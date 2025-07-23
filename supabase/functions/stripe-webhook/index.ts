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
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    let event;
    
    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        logStep("Webhook signature verified", { eventType: event.type });
      } catch (err) {
        logStep("Webhook signature verification failed", { error: err.message });
        return new Response('Webhook signature verification failed', { status: 400 });
      }
    } else {
      // If no webhook secret, parse the body directly (for testing)
      event = JSON.parse(body);
      logStep("Webhook processed without signature verification", { eventType: event.type });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(supabaseClient, event.data.object);
        break;
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(supabaseClient, event.data.object);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionCancelled(supabaseClient, event.data.object);
        break;
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(supabaseClient, event.data.object);
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(supabaseClient, event.data.object);
        break;
      
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(supabaseClient, event.data.object);
        break;

      default:
        logStep("Unhandled event type", { eventType: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

async function handleCheckoutCompleted(supabase: any, session: any) {
  logStep("Processing checkout completion", { sessionId: session.id });
  
  try {
    const customerId = session.customer;
    const metadata = session.metadata || {};
    
    // Update payment record
    if (session.mode === 'payment') {
      await supabase
        .from('payments')
        .upsert({
          stripe_payment_intent_id: session.payment_intent,
          student_id: metadata.contact_id || metadata.user_id,
          amount: session.amount_total,
          status: 'completed',
          payment_method: 'card',
          description: `Payment for ${session.display_items?.[0]?.custom?.name || 'Purchase'}`,
          payment_date: new Date().toISOString(),
          metadata
        });
      
      logStep("Payment record updated");
    }
    
    // Create membership subscription if applicable
    if (session.mode === 'subscription' && metadata.membership_plan_id) {
      await supabase
        .from('membership_subscriptions')
        .upsert({
          profile_id: metadata.contact_id || metadata.user_id,
          membership_plan_id: metadata.membership_plan_id,
          stripe_subscription_id: session.subscription,
          status: 'active',
          start_date: new Date().toISOString(),
          billing_frequency: 'monthly',
          auto_renewal: true
        });
      
      logStep("Membership subscription created");
    }
    
  } catch (error) {
    logStep("Error in checkout completion", error);
  }
}

async function handleSubscriptionUpdate(supabase: any, subscription: any) {
  logStep("Processing subscription update", { subscriptionId: subscription.id });
  
  try {
    const metadata = subscription.metadata || {};
    
    await supabase
      .from('membership_subscriptions')
      .update({
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        next_billing_date: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id);
    
    logStep("Subscription updated in database");
    
  } catch (error) {
    logStep("Error updating subscription", error);
  }
}

async function handleSubscriptionCancelled(supabase: any, subscription: any) {
  logStep("Processing subscription cancellation", { subscriptionId: subscription.id });
  
  try {
    await supabase
      .from('membership_subscriptions')
      .update({
        status: 'cancelled',
        end_date: new Date().toISOString(),
        auto_renewal: false,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id);
    
    logStep("Subscription cancelled in database");
    
  } catch (error) {
    logStep("Error cancelling subscription", error);
  }
}

async function handlePaymentSucceeded(supabase: any, invoice: any) {
  logStep("Processing successful payment", { invoiceId: invoice.id });
  
  try {
    const metadata = invoice.metadata || {};
    
    await supabase
      .from('payments')
      .upsert({
        stripe_invoice_id: invoice.id,
        student_id: metadata.student_id || metadata.contact_id,
        amount: invoice.amount_paid,
        status: 'completed',
        payment_method: 'card',
        description: invoice.description || 'Invoice payment',
        payment_date: new Date(invoice.status_transitions.paid_at * 1000).toISOString(),
        metadata
      });
    
    logStep("Payment record created/updated");
    
  } catch (error) {
    logStep("Error processing payment success", error);
  }
}

async function handlePaymentFailed(supabase: any, invoice: any) {
  logStep("Processing failed payment", { invoiceId: invoice.id });
  
  try {
    const metadata = invoice.metadata || {};
    
    await supabase
      .from('payments')
      .upsert({
        stripe_invoice_id: invoice.id,
        student_id: metadata.student_id || metadata.contact_id,
        amount: invoice.amount_due,
        status: 'failed',
        payment_method: 'card',
        description: invoice.description || 'Failed invoice payment',
        payment_date: new Date().toISOString(),
        metadata
      });
    
    logStep("Failed payment record created/updated");
    
  } catch (error) {
    logStep("Error processing payment failure", error);
  }
}

async function handlePaymentIntentSucceeded(supabase: any, paymentIntent: any) {
  logStep("Processing payment intent success", { paymentIntentId: paymentIntent.id });
  
  try {
    const metadata = paymentIntent.metadata || {};
    
    await supabase
      .from('payments')
      .upsert({
        stripe_payment_intent_id: paymentIntent.id,
        student_id: metadata.contact_id || metadata.user_id,
        amount: paymentIntent.amount,
        status: 'completed',
        payment_method: 'card',
        description: metadata.description || 'Payment',
        payment_date: new Date().toISOString(),
        metadata
      });
    
    logStep("Payment intent record updated");
    
  } catch (error) {
    logStep("Error processing payment intent", error);
  }
}