import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for enhanced debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PROCESS-REFUND] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    // Initialize Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.id) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    const { payment_id, amount, reason, refund_type, processed_by } = await req.json();
    logStep("Request body parsed", { payment_id, amount, reason, refund_type });

    // Fetch the original payment
    const { data: payment, error: paymentError } = await supabaseClient
      .from('payments')
      .select('*')
      .eq('id', payment_id)
      .single();

    if (paymentError || !payment) {
      throw new Error("Payment not found");
    }
    logStep("Payment found", { paymentAmount: payment.amount, status: payment.status });

    // Validate payment can be refunded
    if (payment.status !== 'completed') {
      throw new Error("Only completed payments can be refunded");
    }

    // Calculate refund amount
    const refundAmount = refund_type === 'full' ? payment.amount : amount;
    if (refundAmount > payment.amount) {
      throw new Error("Refund amount cannot exceed payment amount");
    }
    logStep("Refund amount calculated", { refundAmount });

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    let stripeRefundId = null;
    let refundStatus = 'pending';

    // Process Stripe refund if payment has Stripe details
    if (payment.stripe_payment_intent_id || payment.stripe_invoice_id) {
      try {
        logStep("Processing Stripe refund");
        
        const stripeRefund = await stripe.refunds.create({
          amount: refundAmount,
          payment_intent: payment.stripe_payment_intent_id,
          reason: 'requested_by_customer',
          metadata: {
            refund_reason: reason,
            processed_by: processed_by
          }
        });

        stripeRefundId = stripeRefund.id;
        refundStatus = stripeRefund.status === 'succeeded' ? 'completed' : 'pending';
        logStep("Stripe refund processed", { stripeRefundId, status: refundStatus });
        
      } catch (stripeError) {
        logStep("Stripe refund failed", { error: stripeError.message });
        refundStatus = 'failed';
      }
    } else {
      // For non-Stripe payments, mark as completed immediately
      refundStatus = 'completed';
      logStep("Non-Stripe payment, marking as completed");
    }

    // Create refund record
    const { data: refund, error: refundError } = await supabaseClient
      .from('refunds')
      .insert({
        payment_id,
        student_id: payment.student_id,
        amount: refundAmount,
        reason,
        refund_type,
        stripe_refund_id: stripeRefundId,
        status: refundStatus,
        processed_by,
        processed_at: refundStatus === 'completed' ? new Date().toISOString() : null
      })
      .select()
      .single();

    if (refundError) {
      logStep("Failed to create refund record", { error: refundError.message });
      throw new Error("Failed to create refund record");
    }
    logStep("Refund record created", { refundId: refund.id });

    // If refund is successful, create account credit for remaining amount if partial
    if (refundStatus === 'completed' && refund_type === 'partial') {
      const creditAmount = payment.amount - refundAmount;
      if (creditAmount > 0) {
        const { error: creditError } = await supabaseClient
          .from('account_credits')
          .insert({
            student_id: payment.student_id,
            amount: creditAmount,
            source: 'refund',
            source_reference_id: refund.id,
            description: `Credit from partial refund - ${reason}`,
            balance: creditAmount,
            created_by: processed_by
          });

        if (creditError) {
          logStep("Failed to create account credit", { error: creditError.message });
        } else {
          logStep("Account credit created", { creditAmount });
        }
      }
    }

    // Update payment status if fully refunded
    if (refund_type === 'full' && refundStatus === 'completed') {
      const { error: paymentUpdateError } = await supabaseClient
        .from('payments')
        .update({ status: 'refunded' })
        .eq('id', payment_id);

      if (paymentUpdateError) {
        logStep("Failed to update payment status", { error: paymentUpdateError.message });
      } else {
        logStep("Payment status updated to refunded");
      }
    }

    logStep("Refund process completed successfully");
    return new Response(JSON.stringify({
      success: true,
      refund_id: refund.id,
      status: refundStatus,
      amount: refundAmount
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in process-refund", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});