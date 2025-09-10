-- Create stripe_events table (idempotent) and strict RLS for webhook idempotency
-- This migration is safe to run multiple times

-- 1) Table
CREATE TABLE IF NOT EXISTS public.stripe_events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

-- Helpful index for housekeeping/queries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_stripe_events_created_at'
  ) THEN
    CREATE INDEX idx_stripe_events_created_at ON public.stripe_events (created_at DESC);
  END IF;
END $$;

-- 2) Enable RLS
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;

-- 3) Deny-all policies (no public/authenticated access)
DO $$
BEGIN
  -- Policy names chosen to be descriptive and avoid conflicts if already present
  BEGIN
    CREATE POLICY "No authenticated access to stripe_events"
    ON public.stripe_events
    FOR ALL
    USING (false)
    WITH CHECK (false);
  EXCEPTION WHEN duplicate_object THEN
    -- Policy already exists; do nothing
    NULL;
  END;

  BEGIN
    CREATE POLICY "No public access to stripe_events"
    ON public.stripe_events
    FOR ALL
    USING (false)
    WITH CHECK (false);
  EXCEPTION WHEN duplicate_object THEN
    -- Policy already exists; do nothing
    NULL;
  END;
END $$;