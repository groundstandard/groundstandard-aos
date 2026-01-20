import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SYNC-SUBSCRIPTION-STATUS] ${step}${detailsStr}`);
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

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      logStep("STRIPE_SECRET_KEY is not set - returning unsubscribed");
      return new Response(JSON.stringify({
        subscribed: false,
        subscription_tier: null,
        subscription_end: null,
        subscription_status: null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("No authorization header provided - returning unsubscribed");
      return new Response(JSON.stringify({
        subscribed: false,
        subscription_tier: null,
        subscription_end: null,
        subscription_status: null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) {
      logStep("Authentication error - returning unsubscribed", { message: userError.message });
      return new Response(JSON.stringify({
        subscribed: false,
        subscription_tier: null,
        subscription_end: null,
        subscription_status: null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    const user = userData.user;
    if (!user?.email) {
      logStep("User not authenticated or email not available - returning unsubscribed");
      return new Response(JSON.stringify({
        subscribed: false,
        subscription_tier: null,
        subscription_end: null,
        subscription_status: null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Check if customer exists in Stripe
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, updating unsubscribed state");
      await supabaseClient
        .from("subscribers")
        .upsert({
          email: user.email,
          user_id: user.id,
          stripe_customer_id: null,
          subscribed: false,
          subscription_status: null,
          subscription_tier: null,
          current_period_end: null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'email' });

      return new Response(JSON.stringify({ 
        subscribed: false,
        subscription_tier: null,
        subscription_end: null 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    let subscriptionTier = null;
    let subscriptionEnd = null;
    let subscriptionStatus = null;
    let hasActiveSub = false;

    if (subscriptions.data.length > 0) {
      const subscription = subscriptions.data[0];
      hasActiveSub = true;
      subscriptionStatus = subscription.status;
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      
      logStep("Active subscription found", { 
        subscriptionId: subscription.id, 
        status: subscription.status,
        endDate: subscriptionEnd 
      });

      // Get plan details from subscription
      const priceId = subscription.items.data[0].price.id;
      const { data: plan } = await supabaseClient
        .from('subscription_plans')
        .select('name')
        .eq('stripe_price_id', priceId)
        .single();

      subscriptionTier = plan?.name || 'Unknown';
      logStep("Determined subscription tier", { priceId, subscriptionTier });

      // Update subscriber record with full details
      await supabaseClient
        .from('subscribers')
        .upsert({
          email: user.email,
          user_id: user.id,
          stripe_customer_id: customerId,
          subscribed: true,
          subscription_status: subscriptionStatus,
          subscription_tier: subscriptionTier,
          stripe_subscription_id: subscription.id,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: subscriptionEnd,
          cancel_at_period_end: subscription.cancel_at_period_end,
          trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
          trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'email' });

    } else {
      // Check for other subscription statuses (trialing, past_due, etc.)
      const allSubscriptions = await stripe.subscriptions.list({
        customer: customerId,
        limit: 10,
      });

      const latestSub = allSubscriptions.data[0];
      if (latestSub) {
        subscriptionStatus = latestSub.status;
        hasActiveSub = latestSub.status === 'trialing';
        
        if (hasActiveSub) {
          subscriptionEnd = new Date(latestSub.current_period_end * 1000).toISOString();
          const priceId = latestSub.items.data[0].price.id;
          const { data: plan } = await supabaseClient
            .from('subscription_plans')
            .select('name')
            .eq('stripe_price_id', priceId)
            .single();
          subscriptionTier = plan?.name || 'Unknown';
        }
      }

      logStep("No active subscription found", { subscriptionStatus });

      await supabaseClient
        .from('subscribers')
        .upsert({
          email: user.email,
          user_id: user.id,
          stripe_customer_id: customerId,
          subscribed: hasActiveSub,
          subscription_status: subscriptionStatus,
          subscription_tier: subscriptionTier,
          stripe_subscription_id: latestSub?.id || null,
          current_period_start: latestSub ? new Date(latestSub.current_period_start * 1000).toISOString() : null,
          current_period_end: subscriptionEnd,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'email' });
    }

    logStep("Updated database with subscription info", { 
      subscribed: hasActiveSub, 
      subscriptionTier,
      subscriptionStatus 
    });

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      subscription_tier: subscriptionTier,
      subscription_end: subscriptionEnd,
      subscription_status: subscriptionStatus
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in sync-subscription-status", { message: errorMessage });
    return new Response(JSON.stringify({
      subscribed: false,
      subscription_tier: null,
      subscription_end: null,
      subscription_status: null,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});