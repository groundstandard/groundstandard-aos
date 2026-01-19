import "jsr:@supabase/functions-js/edge-runtime.d.ts";

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// @ts-ignore - Deno URL imports are resolved by the Supabase Edge runtime
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore - Deno URL imports are resolved by the Supabase Edge runtime
import Stripe from "https://esm.sh/stripe@14.21.0";
// @ts-ignore - Deno URL imports are resolved by the Supabase Edge runtime
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CUSTOMER-PORTAL] ${step}${detailsStr}`);
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    const requestHeaders = req.headers.get('Access-Control-Request-Headers');
    const requestMethod = req.headers.get('Access-Control-Request-Method');

    return new Response(null, {
      headers: {
        ...corsHeaders,
        ...(requestHeaders ? { 'Access-Control-Allow-Headers': requestHeaders } : null),
        ...(requestMethod ? { 'Access-Control-Allow-Methods': `OPTIONS, ${requestMethod}` } : null),
      },
      status: 204,
    });
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

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Use Connect account if available, otherwise main account
    const stripeConfig = profile?.academies?.stripe_connect_account_id 
      ? { stripeAccount: profile.academies.stripe_connect_account_id }
      : {};
    
    // Find or create Stripe customer
    let customerId;
    const customers = await stripe.customers.list({ 
      email: user.email, 
      limit: 1 
    }, stripeConfig);
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing Stripe customer", { customerId });
    } else {
      // Create new customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id,
          created_by: 'customer-portal-function'
        }
      }, stripeConfig);
      customerId = customer.id;
      logStep("Created new Stripe customer", { customerId });
    }

    const origin = req.headers.get("origin") || "https://yhriiykdnpuutzexjdee.supabase.co";
    
    // Create customer portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/payments`,
    }, stripeConfig);

    logStep("Customer portal session created", { 
      sessionId: portalSession.id, 
      url: portalSession.url 
    });

    return new Response(JSON.stringify({ 
      url: portalSession.url 
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