import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const body = await req.json();
    const { planId, paymentType = 'subscription', amount, description } = body;
    logStep("Request body", body);
    
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Get or create Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id }
      });
      customerId = customer.id;
      logStep("Created new customer", { customerId });
    }

    let sessionConfig: any = {
      customer: customerId,
      line_items: [],
      success_url: `${req.headers.get("origin")}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/pricing`,
    };

    if (paymentType === 'subscription' && planId) {
      // Get membership plan details
      const { data: plan, error: planError } = await supabaseClient
        .from('membership_plans')
        .select('*')
        .eq('id', planId)
        .single();
      
      if (planError || !plan) {
        logStep("Plan lookup error", { planError, planId });
        throw new Error("Invalid subscription plan");
      }
      logStep("Found membership plan", { plan: plan.name, price: plan.base_price_cents });

      sessionConfig.mode = "subscription";
      sessionConfig.line_items = [{
        price_data: {
          currency: "usd",
          product_data: { 
            name: plan.name,
            description: plan.description || `${plan.name} membership plan`
          },
          unit_amount: plan.base_price_cents,
          recurring: { 
            interval: plan.billing_cycle === 'monthly' ? 'month' : 'year',
            interval_count: 1 
          },
        },
        quantity: 1,
      }];

      // Add setup fee if exists
      if (plan.setup_fee_cents > 0) {
        sessionConfig.line_items.push({
          price_data: {
            currency: "usd",
            product_data: { 
              name: `${plan.name} - Setup Fee`,
              description: "One-time setup fee"
            },
            unit_amount: plan.setup_fee_cents,
          },
          quantity: 1,
        });
      }
    } else {
      // One-time payment (class fees, gear, etc.)
      const paymentAmount = amount || 2500;
      const paymentDescription = description || "Academy Payment";
      
      sessionConfig.mode = "payment";
      sessionConfig.line_items = [{
        price_data: {
          currency: "usd",
          product_data: { name: paymentDescription },
          unit_amount: paymentAmount,
        },
        quantity: 1,
      }];
      logStep("One-time payment setup", { amount: paymentAmount, description: paymentDescription });
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);
    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    // Record the payment intent in our database if payments table exists
    try {
      await supabaseClient.from('payments').insert({
        user_id: user.id,
        stripe_session_id: session.id,
        amount: sessionConfig.line_items[0].price_data.unit_amount,
        status: 'pending',
        payment_type: paymentType,
        description: paymentType === 'subscription' ? 
          `Subscription: ${sessionConfig.line_items[0].price_data.product_data.name}` : 
          sessionConfig.line_items[0].price_data.product_data.name
      });
      logStep("Payment record created");
    } catch (paymentInsertError) {
      logStep("Could not create payment record", { error: paymentInsertError });
      // Continue even if payment record fails - the important part is the Stripe session
    }

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});