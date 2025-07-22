import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  console.log(`[MEMBERSHIP-WEBHOOK] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");
    
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      throw new Error("No Stripe signature found");
    }

    const body = await req.text();
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get("STRIPE_WEBHOOK_SECRET") || ""
    );

    logStep("Event type", { type: event.type });

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(supabase, stripe, session);
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(supabase, subscription);
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCancelled(supabase, subscription);
        break;
      }
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(supabase, invoice);
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(supabase, invoice);
        break;
      }
      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

async function handleCheckoutCompleted(supabase: any, stripe: Stripe, session: Stripe.Checkout.Session) {
  logStep("Processing checkout completion", { sessionId: session.id });
  
  const userId = session.metadata?.user_id;
  const planId = session.metadata?.plan_id;
  const billingFrequency = session.metadata?.billing_frequency || 'monthly';

  if (!userId || !planId) {
    throw new Error("Missing user_id or plan_id in session metadata");
  }

  // Get the subscription from Stripe
  const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
  
  // Calculate next billing date
  const nextBillingDate = new Date(subscription.current_period_end * 1000);
  
  // Create membership subscription record
  const { error: subscriptionError } = await supabase
    .from("membership_subscriptions")
    .insert({
      profile_id: userId,
      membership_plan_id: planId,
      stripe_subscription_id: subscription.id,
      status: 'active',
      start_date: new Date().toISOString().split('T')[0],
      next_billing_date: nextBillingDate.toISOString().split('T')[0],
      billing_frequency: billingFrequency,
      auto_renewal: true,
    });

  if (subscriptionError) {
    logStep("Error creating subscription", { error: subscriptionError });
    throw subscriptionError;
  }

  logStep("Subscription created successfully");
}

async function handleSubscriptionUpdate(supabase: any, subscription: Stripe.Subscription) {
  logStep("Processing subscription update", { subscriptionId: subscription.id });
  
  const status = subscription.status === 'active' ? 'active' : 
                subscription.status === 'canceled' ? 'cancelled' : 
                subscription.status;

  const { error } = await supabase
    .from("membership_subscriptions")
    .update({
      status: status,
      next_billing_date: new Date(subscription.current_period_end * 1000).toISOString().split('T')[0],
    })
    .eq("stripe_subscription_id", subscription.id);

  if (error) {
    logStep("Error updating subscription", { error });
    throw error;
  }

  logStep("Subscription updated successfully");
}

async function handleSubscriptionCancelled(supabase: any, subscription: Stripe.Subscription) {
  logStep("Processing subscription cancellation", { subscriptionId: subscription.id });
  
  const { error } = await supabase
    .from("membership_subscriptions")
    .update({
      status: 'cancelled',
      end_date: new Date().toISOString().split('T')[0],
    })
    .eq("stripe_subscription_id", subscription.id);

  if (error) {
    logStep("Error cancelling subscription", { error });
    throw error;
  }

  logStep("Subscription cancelled successfully");
}

async function handlePaymentSucceeded(supabase: any, invoice: Stripe.Invoice) {
  logStep("Processing successful payment", { invoiceId: invoice.id });
  
  // Get subscription details
  const { data: subscription } = await supabase
    .from("membership_subscriptions")
    .select("*")
    .eq("stripe_subscription_id", invoice.subscription)
    .single();

  if (!subscription) {
    logStep("Subscription not found for payment");
    return;
  }

  // Create billing cycle record
  const { error } = await supabase
    .from("billing_cycles")
    .insert({
      membership_subscription_id: subscription.id,
      cycle_start_date: new Date(invoice.period_start * 1000).toISOString().split('T')[0],
      cycle_end_date: new Date(invoice.period_end * 1000).toISOString().split('T')[0],
      amount_cents: invoice.amount_paid,
      total_amount_cents: invoice.amount_paid,
      due_date: new Date(invoice.period_start * 1000).toISOString().split('T')[0],
      paid_date: new Date().toISOString().split('T')[0],
      status: 'paid',
      stripe_invoice_id: invoice.id,
    });

  if (error) {
    logStep("Error creating billing cycle", { error });
    throw error;
  }

  logStep("Payment processed successfully");
}

async function handlePaymentFailed(supabase: any, invoice: Stripe.Invoice) {
  logStep("Processing failed payment", { invoiceId: invoice.id });
  
  // Get subscription details
  const { data: subscription } = await supabase
    .from("membership_subscriptions")
    .select("*")
    .eq("stripe_subscription_id", invoice.subscription)
    .single();

  if (!subscription) {
    logStep("Subscription not found for failed payment");
    return;
  }

  // Update or create billing cycle record
  const { error } = await supabase
    .from("billing_cycles")
    .upsert({
      membership_subscription_id: subscription.id,
      cycle_start_date: new Date(invoice.period_start * 1000).toISOString().split('T')[0],
      cycle_end_date: new Date(invoice.period_end * 1000).toISOString().split('T')[0],
      amount_cents: invoice.amount_due,
      total_amount_cents: invoice.amount_due,
      due_date: new Date(invoice.period_start * 1000).toISOString().split('T')[0],
      status: 'failed',
      stripe_invoice_id: invoice.id,
      failure_reason: 'Payment failed',
      retry_count: 1,
      next_retry_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Retry in 3 days
    });

  if (error) {
    logStep("Error creating failed billing cycle", { error });
    throw error;
  }

  logStep("Failed payment processed");
}