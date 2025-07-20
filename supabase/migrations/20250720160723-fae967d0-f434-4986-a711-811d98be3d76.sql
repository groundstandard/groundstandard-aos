-- Create cron jobs for automated membership and class pack processing
-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily processing of membership cycles (runs at 2 AM daily)
SELECT cron.schedule(
  'process-membership-cycles-daily',
  '0 2 * * *', -- 2 AM every day
  $$
  SELECT net.http_post(
    url := 'https://yhriiykdnpuutzexjdee.supabase.co/functions/v1/process-membership-cycles',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlocmlpeWtkbnB1dXR6ZXhqZGVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4ODEwNjAsImV4cCI6MjA2ODQ1NzA2MH0.Xtwogx9B2N8ODzbojiJJPFUpqN9j5GUtFFZHBbv2H9E"}'::jsonb,
    body := '{"source": "cron_job"}'::jsonb
  ) as request_id;
  $$
);

-- Create function to process expired class packs
CREATE OR REPLACE FUNCTION public.process_expired_class_packs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Mark expired class packs
    UPDATE class_packs 
    SET status = 'expired',
        updated_at = now()
    WHERE expiry_date < CURRENT_DATE 
    AND status = 'active';
    
    -- Auto-renew class packs that have auto_renewal enabled and are nearly exhausted or expired
    INSERT INTO class_packs (
        profile_id,
        membership_plan_id,
        total_classes,
        remaining_classes,
        expiry_date,
        status,
        auto_renewal,
        renewal_discount_percentage,
        notes
    )
    SELECT 
        cp.profile_id,
        cp.membership_plan_id,
        mp.class_pack_size,
        mp.class_pack_size,
        CURRENT_DATE + INTERVAL '1 day' * mp.pack_expiry_days,
        'pending_payment',
        cp.auto_renewal,
        cp.renewal_discount_percentage,
        'Auto-renewal from pack ID: ' || cp.id
    FROM class_packs cp
    JOIN membership_plans mp ON cp.membership_plan_id = mp.id
    WHERE cp.auto_renewal = true
    AND cp.status = 'active'
    AND (
        cp.expiry_date <= CURRENT_DATE + INTERVAL '7 days' -- Expiring within 7 days
        OR cp.remaining_classes <= 2 -- 2 or fewer classes remaining
    )
    AND NOT EXISTS (
        -- Don't create duplicate renewals
        SELECT 1 FROM class_packs cp2 
        WHERE cp2.profile_id = cp.profile_id 
        AND cp2.membership_plan_id = cp.membership_plan_id
        AND cp2.status = 'pending_payment'
        AND cp2.notes LIKE '%Auto-renewal from pack ID: ' || cp.id || '%'
    );
END;
$$;

-- Schedule daily processing of class pack expirations (runs at 1 AM daily)
SELECT cron.schedule(
  'process-class-packs-daily',
  '0 1 * * *', -- 1 AM every day
  $$
  SELECT public.process_expired_class_packs();
  $$
);