-- Update the HighLevel config table to remove API key (now stored in secrets)
ALTER TABLE public.highlevel_config DROP COLUMN IF EXISTS api_key;

-- Create a scheduled function call using pg_cron
-- This will run every day at 9 AM to check for absent members
SELECT cron.schedule(
  'check-absent-members-daily',
  '0 9 * * *', -- Every day at 9 AM
  $$
  SELECT net.http_post(
    url := 'https://yhriiykdnpuutzexjdee.supabase.co/functions/v1/check-absent-members',
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);