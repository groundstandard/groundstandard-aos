-- Add default price entries for Basic and Premium Monthly plans
-- Insert default entries for all existing academies with unique placeholder IDs

DO $$
DECLARE
  academy_record RECORD;
BEGIN
  -- Loop through all academies and add default price entries
  FOR academy_record IN SELECT id FROM public.academies LOOP
    -- Insert Basic Monthly plan with unique placeholder
    INSERT INTO public.prices (academy_id, name, stripe_price_id) VALUES
    (academy_record.id, 'Basic Monthly', 'price_basic_monthly_' || academy_record.id)
    ON CONFLICT (academy_id, name) DO NOTHING;
    
    -- Insert Premium Monthly plan with unique placeholder
    INSERT INTO public.prices (academy_id, name, stripe_price_id) VALUES
    (academy_record.id, 'Premium Monthly', 'price_premium_monthly_' || academy_record.id)
    ON CONFLICT (academy_id, name) DO NOTHING;
  END LOOP;
END $$;