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
  console.log(`[CREATE-MEMBERSHIP-CHECKOUT] ${step}${detailsStr}`);
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

    const { 
      contact_id,
      membership_plan_id,
      success_url,
      cancel_url,
      metadata = {}
    } = await req.json();

    if (!contact_id || !membership_plan_id) {
      throw new Error("contact_id and membership_plan_id are required");
    }

    // Get contact details
    const { data: contact, error: contactError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', contact_id)
      .single();

    if (contactError || !contact) {
      throw new Error("Contact not found");
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

    logStep("Contact and plan found", { 
      contactId: contact.id, 
      contactName: `${contact.first_name} ${contact.last_name}`,
      planName: membershipPlan.name,
      planPrice: membershipPlan.price_cents 
    });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Find or create Stripe customer
    let customerId;
    const customers = await stripe.customers.list({ 
      email: contact.email, 
      limit: 1 
    });
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing Stripe customer", { customerId });
    } else {
      // Create new customer
      const customer = await stripe.customers.create({
        email: contact.email,
        name: `${contact.first_name} ${contact.last_name}`,
        phone: contact.phone || undefined,
        metadata: {
          user_id: contact.id,
          created_by: 'membership-checkout-function'
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

      // Determine if this is a subscription or one-time payment
      const isRecurring = membershipPlan.billing_frequency && membershipPlan.billing_frequency !== 'one_time';
      
      const priceData: any = {
        product: product.id,
        unit_amount: membershipPlan.price_cents,
        currency: 'usd',
        metadata: {
          membership_plan_id: membershipPlan.id
        }
      };

      if (isRecurring) {
        // Map billing frequency to Stripe intervals
        let interval = 'month';
        if (membershipPlan.billing_frequency === 'monthly') interval = 'month';
        else if (membershipPlan.billing_frequency === 'yearly') interval = 'year';
        else if (membershipPlan.billing_frequency === 'weekly') interval = 'week';
        else if (membershipPlan.billing_frequency === 'daily') interval = 'day';
        
        priceData.recurring = {
          interval
        };
      }

      const price = await stripe.prices.create(priceData);
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
        priceId: price.id,
        isRecurring 
      });
    }

    const origin = req.headers.get("origin") || "https://yhriiykdnpuutzexjdee.supabase.co";
    
    // Determine checkout mode
    const isRecurring = membershipPlan.billing_frequency && membershipPlan.billing_frequency !== 'one_time';
    const mode = isRecurring ? 'subscription' : 'payment';

    // Create checkout session
    const sessionData: any = {
      customer: customerId,
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      mode,
      success_url: success_url || `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&contact_id=${contact_id}`,
      cancel_url: cancel_url || `${origin}/contacts/${contact_id}`,
      metadata: {
        contact_id: contact.id,
        membership_plan_id: membershipPlan.id,
        created_by: 'membership-checkout-function',
        ...metadata
      }
    };

    if (mode === 'subscription') {
      sessionData.subscription_data = {
        metadata: {
          contact_id: contact.id,
          membership_plan_id: membershipPlan.id,
          ...metadata
        }
      };
    }

    const session = await stripe.checkout.sessions.create(sessionData);

    logStep("Checkout session created", { 
      sessionId: session.id, 
      url: session.url,
      mode 
    });

    return new Response(JSON.stringify({ 
      url: session.url,
      session_id: session.id,
      mode
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