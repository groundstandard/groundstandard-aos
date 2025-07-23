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
  console.log(`[CREATE-SUBSCRIPTION-CHECKOUT] ${step}${detailsStr}`);
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
    if (!user?.email) throw new Error("User not authenticated or email not available");
    
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { 
      membership_plan_id,
      success_url,
      cancel_url,
      trial_period_days = 0,
      allow_promotion_codes = true,
      metadata = {}
    } = await req.json();

    if (!membership_plan_id) {
      throw new Error("membership_plan_id is required");
    }

    // Get membership plan details
    const { data: membershipPlan, error: planError } = await supabaseClient
      .from('membership_plans')
      .select('*')
      .eq('id', membership_plan_id)
      .single();

    if (planError || !membershipPlan) {
      throw new Error("Membership plan not found");
    }

    logStep("Membership plan found", { 
      planId: membershipPlan.id, 
      name: membershipPlan.name,
      price: membershipPlan.price_cents 
    });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Find or create Stripe customer
    let customerId;
    const customers = await stripe.customers.list({ 
      email: user.email, 
      limit: 1 
    });
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing Stripe customer", { customerId });
    } else {
      // Create new customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id,
          created_by: 'subscription-checkout-function'
        }
      });
      customerId = customer.id;
      logStep("Created new Stripe customer", { customerId });
    }

    // Create or get Stripe price
    let stripePriceId = membershipPlan.stripe_price_id;
    
    if (!stripePriceId) {
      logStep("Creating Stripe price for membership plan");
      
      // Create Stripe product first
      const product = await stripe.products.create({
        name: membershipPlan.name,
        description: membershipPlan.description || `${membershipPlan.name} membership plan`,
        metadata: {
          membership_plan_id: membershipPlan.id
        }
      });

      // Create Stripe price
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: membershipPlan.price_cents,
        currency: 'usd',
        recurring: {
          interval: membershipPlan.billing_frequency || 'month'
        },
        metadata: {
          membership_plan_id: membershipPlan.id
        }
      });

      stripePriceId = price.id;
      
      // Update membership plan with Stripe IDs
      await supabaseClient
        .from('membership_plans')
        .update({
          stripe_product_id: product.id,
          stripe_price_id: price.id
        })
        .eq('id', membershipPlan.id);

      logStep("Created Stripe product and price", { 
        productId: product.id, 
        priceId: price.id 
      });
    }

    const origin = req.headers.get("origin") || "https://yhriiykdnpuutzexjdee.supabase.co";
    
    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: success_url || `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url || `${origin}/payments`,
      allow_promotion_codes,
      subscription_data: {
        trial_period_days: trial_period_days > 0 ? trial_period_days : undefined,
        metadata: {
          user_id: user.id,
          membership_plan_id: membershipPlan.id,
          ...metadata
        }
      },
      metadata: {
        user_id: user.id,
        membership_plan_id: membershipPlan.id,
        ...metadata
      }
    });

    logStep("Checkout session created", { 
      sessionId: session.id, 
      url: session.url 
    });

    return new Response(JSON.stringify({ 
      url: session.url,
      session_id: session.id
    }), {
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