import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MEMBERSHIP-RENEWAL] ${step}${detailsStr}`);
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

    // Use service role for database operations
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get authenticated user for auth operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { subscriptionId, planId } = await req.json();
    logStep("Request data", { subscriptionId, planId });

    // Fetch subscription and plan details
    const { data: subscription, error: subError } = await supabaseService
      .from('membership_subscriptions')
      .select(`
        *,
        membership_plans (*)
      `)
      .eq('id', subscriptionId)
      .single();

    if (subError) throw new Error(`Subscription not found: ${subError.message}`);
    logStep("Subscription found", { subscriptionId: subscription.id });

    const plan = subscription.membership_plans;
    if (!plan) throw new Error("Membership plan not found");

    // Check if renewals are enabled for this plan
    if (!plan.renewal_enabled) {
      throw new Error("Renewals are not enabled for this membership plan");
    }

    // Calculate renewal price based on plan settings
    let renewalPrice = plan.base_price_cents;
    let discountApplied = 0;

    // Check if plan has a new renewal rate
    if (plan.renewal_new_rate_enabled && plan.renewal_new_rate_cents) {
      renewalPrice = plan.renewal_new_rate_cents;
      logStep("Using new renewal rate", { 
        originalPrice: plan.base_price_cents, 
        newRate: renewalPrice 
      });
    } 
    // Apply plan-level renewal discount if available
    else if (plan.renewal_discount_percentage > 0) {
      const discountAmount = Math.floor(renewalPrice * (plan.renewal_discount_percentage / 100));
      renewalPrice = renewalPrice - discountAmount;
      discountApplied = plan.renewal_discount_percentage;
      logStep("Applied plan renewal discount", { 
        originalPrice: plan.base_price_cents, 
        discountPercent: plan.renewal_discount_percentage,
        finalPrice: renewalPrice 
      });
    }
    // Fall back to subscription-specific discount if no plan-level discount
    else if (subscription.renewal_discount_percentage > 0) {
      const discountAmount = Math.floor(renewalPrice * (subscription.renewal_discount_percentage / 100));
      renewalPrice = renewalPrice - discountAmount;
      discountApplied = subscription.renewal_discount_percentage;
      logStep("Applied subscription discount", { 
        originalPrice: plan.base_price_cents, 
        discountPercent: subscription.renewal_discount_percentage,
        finalPrice: renewalPrice 
      });
    }

    // Get or create Stripe customer
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing Stripe customer", { customerId });
    } else {
      const customer = await stripe.customers.create({ email: user.email });
      customerId = customer.id;
      logStep("Created new Stripe customer", { customerId });
    }

    // Create checkout session for renewal
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${plan.name} - 12-Month Renewal (Cycle ${subscription.cycle_number + 1})`,
              description: `Annual membership renewal${discountApplied > 0 ? ` with ${discountApplied}% discount` : ''}${plan.renewal_new_rate_enabled ? ' at updated rate' : ''}`,
            },
            unit_amount: renewalPrice,
            recurring: plan.billing_cycle === 'annual' ? {
              interval: 'year',
              interval_count: 1,
            } : undefined,
          },
          quantity: 1,
        },
      ],
      mode: plan.billing_cycle === 'annual' ? 'subscription' : 'payment',
      success_url: `${req.headers.get("origin")}/contacts/${subscription.profile_id}?renewal=success`,
      cancel_url: `${req.headers.get("origin")}/contacts/${subscription.profile_id}?renewal=cancelled`,
      metadata: {
        subscription_id: subscriptionId,
        plan_id: planId,
        cycle_number: (subscription.cycle_number + 1).toString(),
        renewal_type: '12_month_cycle'
      }
    });

    logStep("Created Stripe checkout session", { sessionId: session.id, url: session.url });

    // Update subscription with pending renewal
    await supabaseService
      .from('membership_subscriptions')
      .update({
        notes: `Renewal payment initiated for cycle ${subscription.cycle_number + 1}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId);

    logStep("Updated subscription with renewal notes");

    return new Response(JSON.stringify({ 
      url: session.url,
      sessionId: session.id,
      renewalPrice: renewalPrice,
      discountApplied: discountApplied
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in membership-renewal", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});