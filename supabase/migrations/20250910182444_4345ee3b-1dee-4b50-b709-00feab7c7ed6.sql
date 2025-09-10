-- Add default price entries for Basic and Premium Monthly plans
-- Insert default entries for all existing academies

DO $$
DECLARE
  academy_record RECORD;
BEGIN
  -- Loop through all academies and add default price entries
  FOR academy_record IN SELECT id FROM public.academies LOOP
    -- Insert Basic Monthly plan
    INSERT INTO public.prices (academy_id, name, stripe_price_id) VALUES
    (academy_record.id, 'Basic Monthly', 'price_basic_monthly_placeholder')
    ON CONFLICT (academy_id, name) DO NOTHING;
    
    -- Insert Premium Monthly plan  
    INSERT INTO public.prices (academy_id, name, stripe_price_id) VALUES
    (academy_record.id, 'Premium Monthly', 'price_premium_monthly_placeholder')
    ON CONFLICT (academy_id, name) DO NOTHING;
  END LOOP;
END $$;