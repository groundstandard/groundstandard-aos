-- Corrective migration to move Payment Intent IDs to the correct column
-- Move Payment Intent IDs (starting with 'pi_') from stripe_invoice_id to stripe_payment_intent_id

UPDATE payments 
SET 
  stripe_payment_intent_id = stripe_invoice_id,
  stripe_invoice_id = NULL
WHERE stripe_invoice_id LIKE 'pi_%' 
  AND stripe_payment_intent_id IS NULL;

-- Update metadata for corrected payments to indicate they were fixed
UPDATE payments 
SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('corrected_payment_intent_id', true)
WHERE stripe_payment_intent_id LIKE 'pi_%' 
  AND (metadata IS NULL OR NOT metadata ? 'corrected_payment_intent_id');