import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper logging function for enhanced debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Function started');

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep('Stripe key verified');

    // Initialize Supabase client with service role for secure operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep('Authorization header found');

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep('User authenticated', { userId: user.id, email: user.email });

    // Parse request body
    const { priceId, customerId } = await req.json();
    if (!priceId) throw new Error("priceId is required");
    logStep('Request parsed', { priceId, customerId });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Find or create customer
    let stripeCustomerId = customerId;
    if (!stripeCustomerId) {
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      if (customers.data.length > 0) {
        stripeCustomerId = customers.data[0].id;
        logStep('Found existing customer', { customerId: stripeCustomerId });
      } else {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: { userId: user.id }
        });
        stripeCustomerId = customer.id;
        logStep('Created new customer', { customerId: stripeCustomerId });
      }
    }

    // Create subscription with incomplete payment behavior
    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });

    logStep('Subscription created', { 
      subscriptionId: subscription.id, 
      status: subscription.status 
    });

    // Extract client secret from payment intent
    const latestInvoice = subscription.latest_invoice as Stripe.Invoice;
    const paymentIntent = latestInvoice?.payment_intent as Stripe.PaymentIntent;
    
    if (!paymentIntent?.client_secret) {
      throw new Error("Failed to create payment intent");
    }

    logStep('Client secret obtained', { 
      paymentIntentId: paymentIntent.id,
      subscriptionId: subscription.id 
    });

    // Update or create subscriber record
    await supabaseClient.from("subscribers").upsert({
      email: user.email,
      user_id: user.id,
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: subscription.id,
      subscribed: false, // Will be updated to true when payment succeeds
      subscription_status: subscription.status,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'email' });

    logStep('Subscriber record updated');

    return new Response(JSON.stringify({
      clientSecret: paymentIntent.client_secret,
      subscriptionId: subscription.id,
      customerId: stripeCustomerId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep('ERROR in create-subscription', { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});