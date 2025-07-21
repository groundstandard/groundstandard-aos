-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily installment payment processing at 9 AM UTC
SELECT cron.schedule(
  'process-daily-installments',
  '0 9 * * *', -- Daily at 9 AM UTC
  $$
  SELECT net.http_post(
    url := 'https://yhriiykdnpuutzexjdee.supabase.co/functions/v1/process-installment-payments',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key', true) || '"}',
    body := '{"automated": true}'
  ) as request_id;
  $$
);

-- Add retry tracking for failed payments
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS next_retry_date DATE,
ADD COLUMN IF NOT EXISTS failure_reason TEXT;