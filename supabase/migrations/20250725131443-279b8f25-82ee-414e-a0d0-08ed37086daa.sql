-- Create performance_targets table if not exists
CREATE TABLE IF NOT EXISTS public.performance_targets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  academy_id UUID,
  retention_3_months DECIMAL(5,2) DEFAULT 90.0,
  retention_6_months DECIMAL(5,2) DEFAULT 85.0,
  retention_9_months DECIMAL(5,2) DEFAULT 80.0,
  retention_12_months DECIMAL(5,2) DEFAULT 75.0,
  capacity_adults DECIMAL(5,2) DEFAULT 80.0,
  capacity_youth DECIMAL(5,2) DEFAULT 75.0,
  capacity_first_30_days DECIMAL(5,2) DEFAULT 60.0,
  capacity_after_30_days DECIMAL(5,2) DEFAULT 85.0,
  revenue_monthly INTEGER DEFAULT 2000000,
  revenue_quarterly INTEGER DEFAULT 6000000,
  revenue_half_yearly INTEGER DEFAULT 12000000,
  revenue_yearly INTEGER DEFAULT 24000000,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.performance_targets ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage performance targets" ON public.performance_targets
FOR ALL USING (get_current_user_role() = ANY (ARRAY['admin'::text, 'owner'::text]));

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

-- Create policies for inventory
CREATE POLICY "Admins can manage inventory" ON public.inventory
FOR ALL USING (get_current_user_role() = ANY (ARRAY['admin'::text, 'owner'::text]));

CREATE POLICY "All can view inventory" ON public.inventory
FOR SELECT USING (true);

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
CREATE POLICY "Admins can manage stock movements" ON public.stock_movements
FOR ALL USING (get_current_user_role() = ANY (ARRAY['admin'::text, 'owner'::text]));

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
CREATE POLICY "Academy members can view locations" ON public.academy_locations
FOR SELECT USING (
  academy_id IN (
    SELECT am.academy_id 
    FROM academy_memberships am 
    WHERE am.user_id = auth.uid() AND am.is_active = true
  )
);

CREATE POLICY "Admins can manage locations" ON public.academy_locations
FOR ALL USING (
  get_current_user_role() = ANY (ARRAY['admin'::text, 'owner'::text]) AND
  academy_id IN (
    SELECT am.academy_id 
    FROM academy_memberships am 
    WHERE am.user_id = auth.uid() AND am.is_active = true
  )
);

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

-- Insert sample data for default academy location (if academies exist)
INSERT INTO public.academy_locations (academy_id, name, latitude, longitude, check_in_radius_meters)
SELECT 
  id,
  'Main Academy Location',
  40.7589, -- Default NYC coordinates for demo
  -73.9851,
  100 -- 100 meter radius
FROM public.academies
WHERE NOT EXISTS (
  SELECT 1 FROM public.academy_locations WHERE academy_id = academies.id
)
LIMIT 1;

-- Create subscription plans for the software itself (not for students)
CREATE TABLE IF NOT EXISTS public.software_subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price_monthly INTEGER NOT NULL, -- in cents
  price_yearly INTEGER, -- in cents (if available)
  features JSONB NOT NULL DEFAULT '[]',
  max_academies INTEGER DEFAULT 1,
  max_students_per_academy INTEGER DEFAULT 50,
  max_instructors_per_academy INTEGER DEFAULT 3,
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default software subscription plans
INSERT INTO public.software_subscription_plans (name, description, price_monthly, price_yearly, features, max_academies, max_students_per_academy, max_instructors_per_academy)
VALUES 
('Starter', 'Perfect for small academies getting started', 9900, 9900, 
 '["Up to 50 students", "3 instructors", "Basic reporting", "Class scheduling", "Attendance tracking"]'::jsonb, 
 1, 50, 3),
('Professional', 'For growing academies with advanced needs', 19900, 19900,
 '["Up to 200 students", "10 instructors", "Advanced analytics", "Payment processing", "Automated billing", "Inventory management"]'::jsonb,
 1, 200, 10),
('Enterprise', 'For large organizations with multiple locations', 39900, 39900,
 '["Unlimited students", "Unlimited instructors", "Multi-academy management", "Custom integrations", "Priority support", "Advanced automations"]'::jsonb,
 999, 999999, 999);

-- Enable RLS for software subscription plans
ALTER TABLE public.software_subscription_plans ENABLE ROW LEVEL SECURITY;

-- Create policies for software subscription plans
CREATE POLICY "Everyone can view active plans" ON public.software_subscription_plans
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage plans" ON public.software_subscription_plans
FOR ALL USING (get_current_user_role() = ANY (ARRAY['admin'::text, 'owner'::text]));

-- Update academy_subscriptions to link to software plans
ALTER TABLE public.academy_subscriptions 
ADD COLUMN IF NOT EXISTS software_plan_id UUID REFERENCES public.software_subscription_plans(id);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers
DROP TRIGGER IF EXISTS update_performance_targets_updated_at ON public.performance_targets;
CREATE TRIGGER update_performance_targets_updated_at
  BEFORE UPDATE ON public.performance_targets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_inventory_updated_at ON public.inventory;
CREATE TRIGGER update_inventory_updated_at
  BEFORE UPDATE ON public.inventory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();