import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SUBSCRIPTION-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  
  if (!stripeSecretKey) {
    logStep("ERROR: STRIPE_SECRET_KEY not set");
    return new Response("Stripe secret key not configured", { status: 500 });
  }

  if (!webhookSecret) {
    logStep("ERROR: STRIPE_WEBHOOK_SECRET not set");
    return new Response("Webhook secret not configured", { status: 500 });
  }

  if (!signature) {
    logStep("ERROR: No stripe signature");
    return new Response("No signature", { status: 400 });
  }

  try {
    const body = await req.text();
    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });
    
    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    logStep("Webhook verified", { eventType: event.type, eventId: event.id });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Process different webhook events
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(supabaseClient, subscription);
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCancellation(supabaseClient, subscription);
        break;
      }
      
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(supabaseClient, invoice);
        break;
      }
      
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(supabaseClient, invoice);
        break;
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(supabaseClient, session);
        break;
      }

      default:
        logStep("Unhandled event type", { eventType: event.type });
    }

    // Log the event
    await supabaseClient
      .from('subscription_events')
      .insert({
        event_type: event.type,
        stripe_event_id: event.id,
        event_data: event.data,
        processed: true,
        created_at: new Date().toISOString()
      });

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR processing webhook", { error: errorMessage });
    return new Response(`Webhook error: ${errorMessage}`, { status: 400 });
  }
});

async function handleSubscriptionUpdate(supabaseClient: any, subscription: Stripe.Subscription) {
  logStep("Processing subscription update", { 
    subscriptionId: subscription.id,
    status: subscription.status,
    customerId: subscription.customer 
  });

  const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;
  
  // Get plan details
  const priceId = subscription.items.data[0]?.price.id;
  const { data: plan } = await supabaseClient
    .from('subscription_plans')
    .select('*')
    .eq('stripe_price_id', priceId)
    .single();

  // Update subscriber record
  await supabaseClient
    .from('subscribers')
    .update({
      subscription_status: subscription.status,
      stripe_subscription_id: subscription.id,
      subscription_tier: plan?.name || 'Unknown',
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      subscribed: subscription.status === 'active' || subscription.status === 'trialing',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_customer_id', customerId);

  logStep("Subscription updated successfully");
}

async function handleSubscriptionCancellation(supabaseClient: any, subscription: Stripe.Subscription) {
  logStep("Processing subscription cancellation", { subscriptionId: subscription.id });

  const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;

  await supabaseClient
    .from('subscribers')
    .update({
      subscription_status: 'canceled',
      subscribed: false,
      updated_at: new Date().toISOString()
    })
    .eq('stripe_customer_id', customerId);

  logStep("Subscription cancelled successfully");
}

async function handlePaymentSucceeded(supabaseClient: any, invoice: Stripe.Invoice) {
  logStep("Processing payment success", { invoiceId: invoice.id });

  const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
  
  // Find subscriber
  const { data: subscriber } = await supabaseClient
    .from('subscribers')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (subscriber) {
    // Record the payment transaction
    await supabaseClient
      .from('payment_transactions')
      .insert({
        subscriber_id: subscriber.id,
        stripe_invoice_id: invoice.id,
        amount: invoice.amount_paid || 0,
        currency: invoice.currency || 'usd',
        status: 'succeeded',
        payment_method: invoice.payment_intent ? 'card' : 'other',
        description: `Payment for invoice ${invoice.number}`,
        receipt_url: invoice.hosted_invoice_url,
        created_at: new Date().toISOString()
      });

    logStep("Payment transaction recorded");
  }
}

async function handlePaymentFailed(supabaseClient: any, invoice: Stripe.Invoice) {
  logStep("Processing payment failure", { invoiceId: invoice.id });

  const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
  
  // Find subscriber
  const { data: subscriber } = await supabaseClient
    .from('subscribers')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (subscriber) {
    // Record the failed payment
    await supabaseClient
      .from('payment_transactions')
      .insert({
        subscriber_id: subscriber.id,
        stripe_invoice_id: invoice.id,
        amount: invoice.amount_due || 0,
        currency: invoice.currency || 'usd',
        status: 'failed',
        description: `Failed payment for invoice ${invoice.number}`,
        failure_reason: 'Payment failed',
        created_at: new Date().toISOString()
      });

    logStep("Failed payment recorded");
  }
}

async function handleCheckoutCompleted(supabaseClient: any, session: Stripe.Checkout.Session) {
  logStep("Processing checkout completion", { sessionId: session.id });

  const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
  
  if (customerId) {
    await supabaseClient
      .from('subscribers')
      .update({
        stripe_customer_id: customerId,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', session.metadata?.supabase_user_id);

    logStep("Checkout completion processed");
  }
}