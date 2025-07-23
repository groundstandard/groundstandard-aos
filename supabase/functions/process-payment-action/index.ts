import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PROCESS-PAYMENT-ACTION] ${step}${detailsStr}`);
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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.id) throw new Error("User not authenticated");
    
    logStep("User authenticated", { userId: user.id });

    const { payment_id, action, reason, notes } = await req.json();

    if (!payment_id || !action || !reason) {
      throw new Error("Missing required fields: payment_id, action, reason");
    }

    logStep("Processing payment action", { paymentId: payment_id, action, reason });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Get payment details
    const { data: payment, error: paymentError } = await supabaseClient
      .from('payments')
      .select('*')
      .eq('id', payment_id)
      .single();

    if (paymentError) throw new Error(`Payment not found: ${paymentError.message}`);

    let result;
    let newStatus = payment.status;

    switch (action) {
      case 'capture':
        if (payment.stripe_payment_intent_id) {
          result = await stripe.paymentIntents.capture(payment.stripe_payment_intent_id);
          newStatus = 'completed';
          logStep("Payment captured", { paymentIntentId: payment.stripe_payment_intent_id });
        } else {
          throw new Error("No Stripe payment intent ID found");
        }
        break;

      case 'void':
        if (payment.stripe_payment_intent_id) {
          result = await stripe.paymentIntents.cancel(payment.stripe_payment_intent_id);
          newStatus = 'cancelled';
          logStep("Payment voided", { paymentIntentId: payment.stripe_payment_intent_id });
        } else {
          throw new Error("No Stripe payment intent ID found");
        }
        break;

      case 'retry':
        if (payment.stripe_payment_intent_id) {
          result = await stripe.paymentIntents.confirm(payment.stripe_payment_intent_id);
          newStatus = result.status === 'succeeded' ? 'completed' : 'requires_action';
          logStep("Payment retried", { paymentIntentId: payment.stripe_payment_intent_id, status: result.status });
        } else {
          throw new Error("No Stripe payment intent ID found");
        }
        break;

      default:
        throw new Error(`Unsupported action: ${action}`);
    }

    // Update payment status in database
    const { error: updateError } = await supabaseClient
      .from('payments')
      .update({
        status: newStatus,
        failure_reason: action === 'void' ? reason : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', payment_id);

    if (updateError) {
      logStep("Error updating payment", { error: updateError });
      throw new Error(`Failed to update payment: ${updateError.message}`);
    }

    // Log the action
    const { error: logError } = await supabaseClient
      .from('payment_action_logs')
      .insert({
        payment_id: payment_id,
        action: action,
        reason: reason,
        notes: notes,
        processed_by: user.id,
        stripe_result: result ? JSON.stringify(result) : null,
        created_at: new Date().toISOString()
      });

    if (logError) {
      logStep("Warning: Could not log action", { error: logError });
    }

    logStep("Payment action completed successfully", { paymentId: payment_id, action, newStatus });

    return new Response(JSON.stringify({
      success: true,
      payment_id: payment_id,
      action: action,
      new_status: newStatus,
      stripe_result: result
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in process-payment-action", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});