-- Create custom field pages table
CREATE TABLE custom_field_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  academy_id UUID REFERENCES academies(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create custom field definitions table
CREATE TABLE custom_field_definitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  field_type TEXT NOT NULL, -- text, textarea, number, date, select, multiselect, checkbox, file, url, email, phone
  is_required BOOLEAN NOT NULL DEFAULT false,
  validation_rules JSONB DEFAULT '{}',
  options JSONB DEFAULT '[]', -- for select/multiselect fields
  default_value TEXT,
  placeholder_text TEXT,
  help_text TEXT,
  page_id UUID REFERENCES custom_field_pages(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  show_in_table BOOLEAN NOT NULL DEFAULT false,
  academy_id UUID REFERENCES academies(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(name, academy_id)
);

-- Create custom field values table
CREATE TABLE custom_field_values (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  field_id UUID REFERENCES custom_field_definitions(id) ON DELETE CASCADE,
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(contact_id, field_id)
);

-- Create default field extensions table (for adding options to existing system fields)
CREATE TABLE default_field_extensions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  field_name TEXT NOT NULL, -- role, belt_level, membership_status, etc.
  option_value TEXT NOT NULL,
  option_label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  academy_id UUID REFERENCES academies(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(field_name, option_value, academy_id)
);

-- Enable RLS
ALTER TABLE custom_field_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_field_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_field_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE default_field_extensions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for custom_field_pages
CREATE POLICY "Academy members can view pages" ON custom_field_pages
  FOR SELECT USING (
    academy_id IN (
      SELECT am.academy_id FROM academy_memberships am 
      WHERE am.user_id = auth.uid() AND am.is_active = true
    )
  );

CREATE POLICY "Academy admins can manage pages" ON custom_field_pages
  FOR ALL USING (
    academy_id IN (
      SELECT am.academy_id FROM academy_memberships am 
      WHERE am.user_id = auth.uid() AND am.is_active = true 
      AND am.role IN ('admin', 'owner')
    )
  );

-- RLS Policies for custom_field_definitions
CREATE POLICY "Academy members can view field definitions" ON custom_field_definitions
  FOR SELECT USING (
    academy_id IN (
      SELECT am.academy_id FROM academy_memberships am 
      WHERE am.user_id = auth.uid() AND am.is_active = true
    )
  );

CREATE POLICY "Academy admins can manage field definitions" ON custom_field_definitions
  FOR ALL USING (
    academy_id IN (
      SELECT am.academy_id FROM academy_memberships am 
      WHERE am.user_id = auth.uid() AND am.is_active = true 
      AND am.role IN ('admin', 'owner')
    )
  );

-- RLS Policies for custom_field_values
CREATE POLICY "Academy members can view field values" ON custom_field_values
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM custom_field_definitions cfd
      JOIN academy_memberships am ON cfd.academy_id = am.academy_id
      WHERE cfd.id = custom_field_values.field_id 
      AND am.user_id = auth.uid() AND am.is_active = true
    )
  );

CREATE POLICY "Academy admins can manage field values" ON custom_field_values
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM custom_field_definitions cfd
      JOIN academy_memberships am ON cfd.academy_id = am.academy_id
      WHERE cfd.id = custom_field_values.field_id 
      AND am.user_id = auth.uid() AND am.is_active = true 
      AND am.role IN ('admin', 'owner')
    )
  );

-- RLS Policies for default_field_extensions
CREATE POLICY "Academy members can view field extensions" ON default_field_extensions
  FOR SELECT USING (
    academy_id IN (
      SELECT am.academy_id FROM academy_memberships am 
      WHERE am.user_id = auth.uid() AND am.is_active = true
    )
  );

CREATE POLICY "Academy admins can manage field extensions" ON default_field_extensions
  FOR ALL USING (
    academy_id IN (
      SELECT am.academy_id FROM academy_memberships am 
      WHERE am.user_id = auth.uid() AND am.is_active = true 
      AND am.role IN ('admin', 'owner')
    )
  );

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_custom_field_pages_updated_at
  BEFORE UPDATE ON custom_field_pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_field_definitions_updated_at
  BEFORE UPDATE ON custom_field_definitions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_field_values_updated_at
  BEFORE UPDATE ON custom_field_values
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();