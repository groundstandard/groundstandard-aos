import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PROCESS-FAILED-PAYMENTS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Get failed payments from the last 7 days that haven't been retried more than 3 times
    const { data: failedPayments, error: failedError } = await supabaseClient
      .from('payments')
      .select(`
        *,
        profiles!payments_student_id_fkey (first_name, last_name, email, stripe_customer_id)
      `)
      .eq('status', 'failed')
      .gte('payment_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .lt('retry_count', 3)
      .order('payment_date', { ascending: true });

    if (failedError) throw failedError;

    logStep("Found failed payments", { count: failedPayments?.length || 0 });

    let processedCount = 0;
    let successCount = 0;
    let failureCount = 0;

    for (const payment of failedPayments || []) {
      try {
        const profile = (payment as any).profiles;
        if (!profile?.stripe_customer_id) {
          logStep("No Stripe customer ID for payment", { paymentId: payment.id });
          continue;
        }

        // Try to charge the customer again
        const paymentIntent = await stripe.paymentIntents.create({
          amount: payment.amount,
          currency: 'usd',
          customer: profile.stripe_customer_id,
          description: payment.description || 'Retry failed payment',
          metadata: {
            original_payment_id: payment.id,
            retry_attempt: (payment.retry_count || 0) + 1
          }
        });

        // Confirm the payment intent
        const confirmedIntent = await stripe.paymentIntents.confirm(paymentIntent.id);

        if (confirmedIntent.status === 'succeeded') {
          // Update original payment as successful
          await supabaseClient
            .from('payments')
            .update({
              status: 'completed',
              stripe_payment_intent_id: confirmedIntent.id,
              retry_count: (payment.retry_count || 0) + 1,
              updated_at: new Date().toISOString()
            })
            .eq('id', payment.id);

          // Create activity log
          await supabaseClient
            .from('contact_activities')
            .insert({
              contact_id: payment.student_id,
              activity_type: 'payment',
              activity_title: 'Failed Payment Recovered',
              activity_description: `Payment of $${(payment.amount / 100).toFixed(2)} successfully processed after failure`,
              activity_data: {
                amount: payment.amount,
                retry_attempt: (payment.retry_count || 0) + 1,
                stripe_payment_intent_id: confirmedIntent.id
              }
            });

          successCount++;
          logStep("Payment retry successful", { paymentId: payment.id });

        } else {
          // Update retry count
          await supabaseClient
            .from('payments')
            .update({
              retry_count: (payment.retry_count || 0) + 1,
              failure_reason: `Retry failed: ${confirmedIntent.status}`,
              updated_at: new Date().toISOString()
            })
            .eq('id', payment.id);

          failureCount++;
          logStep("Payment retry failed", { paymentId: payment.id, status: confirmedIntent.status });
        }

        processedCount++;

      } catch (error) {
        // Update retry count and failure reason
        await supabaseClient
          .from('payments')
          .update({
            retry_count: (payment.retry_count || 0) + 1,
            failure_reason: error instanceof Error ? error.message : 'Unknown error',
            updated_at: new Date().toISOString()
          })
          .eq('id', payment.id);

        failureCount++;
        logStep("Error processing failed payment", { paymentId: payment.id, error: error.message });
      }
    }

    // Send dunning emails for payments that have failed 3+ times
    const { data: dunningPayments } = await supabaseClient
      .from('payments')
      .select(`
        *,
        profiles!payments_student_id_fkey (first_name, last_name, email)
      `)
      .eq('status', 'failed')
      .gte('retry_count', 3);

    for (const payment of dunningPayments || []) {
      try {
        const profile = (payment as any).profiles;
        
        // Create dunning activity
        await supabaseClient
          .from('contact_activities')
          .insert({
            contact_id: payment.student_id,
            activity_type: 'payment',
            activity_title: 'Payment Failure - Action Required',
            activity_description: `Payment of $${(payment.amount / 100).toFixed(2)} has failed multiple times. Customer contact required.`,
            activity_data: {
              amount: payment.amount,
              retry_count: payment.retry_count,
              failure_reason: payment.failure_reason,
              requires_manual_intervention: true
            }
          });

        // Update payment status to require manual intervention
        await supabaseClient
          .from('payments')
          .update({
            status: 'requires_action',
            updated_at: new Date().toISOString()
          })
          .eq('id', payment.id);

        logStep("Dunning process initiated", { paymentId: payment.id });

      } catch (error) {
        logStep("Error in dunning process", { paymentId: payment.id, error: error.message });
      }
    }

    const summary = {
      total_processed: processedCount,
      successful_retries: successCount,
      failed_retries: failureCount,
      dunning_initiated: dunningPayments?.length || 0
    };

    logStep("Processing complete", summary);

    return new Response(JSON.stringify({
      success: true,
      message: "Failed payments processed successfully",
      summary
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in process-failed-payments", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});