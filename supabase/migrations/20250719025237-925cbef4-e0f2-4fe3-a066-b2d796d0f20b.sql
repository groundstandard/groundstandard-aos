-- Create events table for academy events management
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('tournament', 'seminar', 'workshop', 'belt_test', 'social')),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location TEXT,
  max_participants INTEGER,
  registration_fee NUMERIC(10,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'registration_open', 'registration_closed', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create event registrations table
CREATE TABLE public.event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  registration_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'confirmed', 'cancelled', 'attended', 'no_show')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  notes TEXT,
  UNIQUE(event_id, student_id)
);

-- Create inventory management table
CREATE TABLE public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('uniforms', 'equipment', 'gear', 'supplies', 'merchandise')),
  sku TEXT UNIQUE NOT NULL,
  current_stock INTEGER NOT NULL DEFAULT 0,
  min_stock_level INTEGER NOT NULL DEFAULT 5,
  max_stock_level INTEGER NOT NULL DEFAULT 100,
  unit_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  selling_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  supplier TEXT,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'discontinued', 'out_of_stock')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create stock movements table for tracking inventory changes
CREATE TABLE public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id UUID NOT NULL REFERENCES public.inventory(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('purchase', 'sale', 'adjustment', 'return', 'damage')),
  quantity INTEGER NOT NULL,
  unit_cost NUMERIC(10,2),
  total_cost NUMERIC(10,2),
  reference_id UUID, -- Can reference orders, returns, etc.
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable Row Level Security
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for events
CREATE POLICY "Everyone can view published events" 
ON public.events 
FOR SELECT 
USING (status IN ('published', 'registration_open', 'registration_closed', 'completed'));

CREATE POLICY "Admins can manage all events" 
ON public.events 
FOR ALL 
USING (get_current_user_role() = 'admin');

-- Create RLS policies for event registrations
CREATE POLICY "Students can view their own registrations" 
ON public.event_registrations 
FOR SELECT 
USING (student_id = auth.uid());

CREATE POLICY "Students can register for events" 
ON public.event_registrations 
FOR INSERT 
WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update their own registrations" 
ON public.event_registrations 
FOR UPDATE 
USING (student_id = auth.uid());

CREATE POLICY "Admins can manage all event registrations" 
ON public.event_registrations 
FOR ALL 
USING (get_current_user_role() = 'admin');

-- Create RLS policies for inventory
CREATE POLICY "Admins can manage inventory" 
ON public.inventory 
FOR ALL 
USING (get_current_user_role() = 'admin');

CREATE POLICY "Staff can view inventory" 
ON public.inventory 
FOR SELECT 
USING (get_current_user_role() IN ('admin', 'instructor'));

-- Create RLS policies for stock movements
CREATE POLICY "Admins can manage stock movements" 
ON public.stock_movements 
FOR ALL 
USING (get_current_user_role() = 'admin');

CREATE POLICY "Staff can view stock movements" 
ON public.stock_movements 
FOR SELECT 
USING (get_current_user_role() IN ('admin', 'instructor'));

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at
  BEFORE UPDATE ON public.inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_events_date ON public.events(date);
CREATE INDEX idx_events_status ON public.events(status);
CREATE INDEX idx_events_type ON public.events(event_type);
CREATE INDEX idx_event_registrations_event_id ON public.event_registrations(event_id);
CREATE INDEX idx_event_registrations_student_id ON public.event_registrations(student_id);
CREATE INDEX idx_inventory_category ON public.inventory(category);
CREATE INDEX idx_inventory_sku ON public.inventory(sku);
CREATE INDEX idx_inventory_status ON public.inventory(status);
CREATE INDEX idx_stock_movements_inventory_id ON public.stock_movements(inventory_id);
CREATE INDEX idx_stock_movements_created_at ON public.stock_movements(created_at);