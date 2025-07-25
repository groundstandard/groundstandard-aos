-- Create inventory table if not exists
CREATE TABLE IF NOT EXISTS public.inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('uniforms', 'equipment', 'gear', 'supplies', 'merchandise')),
  sku TEXT UNIQUE NOT NULL,
  current_stock INTEGER NOT NULL DEFAULT 0,
  min_stock_level INTEGER NOT NULL DEFAULT 5,
  max_stock_level INTEGER NOT NULL DEFAULT 100,
  unit_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  selling_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  supplier TEXT,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'discontinued', 'out_of_stock')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for inventory
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- Create policies for inventory (check if they exist first)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'inventory' AND policyname = 'Admins can manage inventory'
  ) THEN
    CREATE POLICY "Admins can manage inventory" ON public.inventory
    FOR ALL USING (get_current_user_role() = ANY (ARRAY['admin'::text, 'owner'::text]));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'inventory' AND policyname = 'All can view inventory'
  ) THEN
    CREATE POLICY "All can view inventory" ON public.inventory
    FOR SELECT USING (true);
  END IF;
END
$$;

-- Create stock_movements table for inventory tracking
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inventory_id UUID NOT NULL REFERENCES public.inventory(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment')),
  quantity INTEGER NOT NULL,
  reason TEXT,
  reference_type TEXT, -- 'sale', 'purchase', 'adjustment', 'loss', etc.
  reference_id UUID,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for stock movements
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- Create policies for stock movements
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'stock_movements' AND policyname = 'Admins can manage stock movements'
  ) THEN
    CREATE POLICY "Admins can manage stock movements" ON public.stock_movements
    FOR ALL USING (get_current_user_role() = ANY (ARRAY['admin'::text, 'owner'::text]));
  END IF;
END
$$;

-- Create location tracking for check-ins
CREATE TABLE IF NOT EXISTS public.academy_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  academy_id UUID NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  check_in_radius_meters INTEGER DEFAULT 50,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for academy locations
ALTER TABLE public.academy_locations ENABLE ROW LEVEL SECURITY;

-- Create policies for academy locations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'academy_locations' AND policyname = 'Academy members can view locations'
  ) THEN
    CREATE POLICY "Academy members can view locations" ON public.academy_locations
    FOR SELECT USING (
      academy_id IN (
        SELECT am.academy_id 
        FROM academy_memberships am 
        WHERE am.user_id = auth.uid() AND am.is_active = true
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'academy_locations' AND policyname = 'Admins can manage locations'
  ) THEN
    CREATE POLICY "Admins can manage locations" ON public.academy_locations
    FOR ALL USING (
      get_current_user_role() = ANY (ARRAY['admin'::text, 'owner'::text]) AND
      academy_id IN (
        SELECT am.academy_id 
        FROM academy_memberships am 
        WHERE am.user_id = auth.uid() AND am.is_active = true
      )
    );
  END IF;
END
$$;

-- Update class_reservations to include check-in location verification
ALTER TABLE public.class_reservations 
ADD COLUMN IF NOT EXISTS check_in_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS check_in_verification_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS check_in_distance_meters INTEGER;

-- Create function for location-based check-in verification
CREATE OR REPLACE FUNCTION public.verify_location_check_in(
  user_latitude DECIMAL(10,8),
  user_longitude DECIMAL(11,8),
  academy_location_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  location_record RECORD;
  distance_meters DECIMAL;
BEGIN
  -- Get academy location details
  SELECT latitude, longitude, check_in_radius_meters
  INTO location_record
  FROM public.academy_locations
  WHERE id = academy_location_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Calculate distance using Haversine formula (simplified)
  -- This is a basic implementation - for production, consider using PostGIS
  distance_meters := (
    6371000 * acos(
      cos(radians(location_record.latitude)) * 
      cos(radians(user_latitude)) * 
      cos(radians(user_longitude) - radians(location_record.longitude)) + 
      sin(radians(location_record.latitude)) * 
      sin(radians(user_latitude))
    )
  );
  
  RETURN distance_meters <= location_record.check_in_radius_meters;
END;
$$;