import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    // Create Supabase client using the anon key for user authentication
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get user's academy information
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select(`
        academy_id,
        academies:academy_id(
          stripe_connect_account_id,
          stripe_charges_enabled
        )
      `)
      .eq('id', user.id)
      .single();

    logStep("Profile and academy data fetched", { 
      academyId: profile?.academy_id,
      hasConnectAccount: !!profile?.academies?.stripe_connect_account_id 
    });

    // Parse request body to get plan details or custom payment info
    const requestBody = await req.json();
    const { planId, planType, amount, description, paymentType } = requestBody;
    
    // Check if this is a custom payment or plan-based payment
    const isCustomPayment = paymentType === 'payment' && amount && (!planId || planId === '');
    
    if (!isCustomPayment && (!planId || !planType)) {
      throw new Error("planId and planType are required for plan-based payments");
    }
    
    logStep("Request details received", { 
      planId, 
      planType, 
      amount, 
      description, 
      paymentType, 
      isCustomPayment 
    });

    // Get plan details from database (skip for custom payments)
    let planData = null;
    
    if (!isCustomPayment) {
      switch (planType) {
        case 'membership':
          const { data: membershipPlan, error: membershipError } = await supabaseClient
            .from('membership_plans')
            .select('*')
            .eq('id', planId)
            .single();
          if (membershipError) throw new Error(`Error fetching membership plan: ${membershipError.message}`);
          planData = membershipPlan;
          break;
        case 'private_session':
          const { data: privatePlan, error: privateError } = await supabaseClient
            .from('private_sessions')
            .select('*')
            .eq('id', planId)
            .single();
          if (privateError) throw new Error(`Error fetching private session: ${privateError.message}`);
          planData = privatePlan;
          break;
        case 'drop_in':
          const { data: dropInPlan, error: dropInError } = await supabaseClient
            .from('drop_in_options')
            .select('*')
            .eq('id', planId)
            .single();
          if (dropInError) throw new Error(`Error fetching drop-in option: ${dropInError.message}`);
          planData = dropInPlan;
          break;
        default:
          throw new Error(`Unknown plan type: ${planType}`);
      }

      if (!planData) throw new Error("Plan not found");
      logStep("Plan data retrieved", { planName: planData.name, planType });
    } else {
      logStep("Custom payment - no plan data needed");
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Use Connect account if available, otherwise main account
    const stripeConfig = profile?.academies?.stripe_connect_account_id 
      ? { stripeAccount: profile.academies.stripe_connect_account_id }
      : {};

    // Check if customer exists
    const customers = await stripe.customers.list({ 
      email: user.email, 
      limit: 1 
    }, stripeConfig);
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing Stripe customer", { customerId });
    } else {
      logStep("No existing customer found, will create new one");
    }

    // Get the origin for redirect URLs
    const origin = req.headers.get("origin") || "http://localhost:3000";

    // Determine price and whether it's recurring
    let unitAmount;
    let productName;
    let recurring = undefined;

    if (isCustomPayment) {
      // Handle custom payment
      unitAmount = parseInt(amount);
      productName = description || "Custom Payment";
      // Custom payments are always one-time (no recurring)
      logStep("Custom payment configured", { unitAmount, productName });
    } else {
      // Handle plan-based payment
      switch (planType) {
        case 'membership':
          unitAmount = planData.base_price_cents;
          productName = `${planData.name} - Membership Plan`;
          if (planData.payment_frequency === 'monthly') {
            recurring = { interval: "month" };
          } else if (planData.payment_frequency === 'yearly') {
            recurring = { interval: "year" };
          }
          break;
        case 'private_session':
          unitAmount = planData.price_per_session_cents || planData.price_per_hour * 100;
          productName = `${planData.name} - Private Session`;
          break;
        case 'drop_in':
          unitAmount = planData.price_cents;
          productName = `${planData.name} - Drop-in Class`;
          break;
      }
      logStep("Plan-based payment configured", { unitAmount, productName, recurring });
    }

    // Create line item
    const lineItem: any = {
      price_data: {
        currency: "usd",
        product_data: { 
          name: productName,
          description: isCustomPayment 
            ? (description || "Custom payment") 
            : (planData.description || `${planType} plan`)
        },
        unit_amount: unitAmount,
      },
      quantity: 1,
    };

    // Add recurring info if it's a subscription
    if (recurring) {
      lineItem.price_data.recurring = recurring;
    }

    // Create checkout session
    const sessionConfig: any = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [lineItem],
      mode: recurring ? "subscription" : "payment",
      success_url: `${origin}/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/subscription?cancelled=true`,
      metadata: {
        user_id: user.id,
        plan_id: planId || 'custom',
        plan_type: planType || 'custom_payment',
        is_custom_payment: isCustomPayment.toString(),
        custom_amount: isCustomPayment ? amount : undefined,
      },
    };

    const session = await stripe.checkout.sessions.create(sessionConfig, stripeConfig);
    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    // Store checkout session info in database using service role
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Create a simple orders/checkouts table entry to track this
    await supabaseService.from("invoices").insert({
      user_id: user.id,
      stripe_invoice_id: session.id,
      amount: unitAmount,
      status: 'pending',
      line_items: [{
        plan_id: planId || 'custom',
        plan_type: planType || 'custom_payment',
        plan_name: productName,
        amount: unitAmount
      }],
      notes: isCustomPayment 
        ? `Custom payment: ${description || 'Custom amount'}`
        : `Checkout session for ${planType}: ${planData.name}`
    });

    logStep("Order tracking record created");

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