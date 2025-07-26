import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SETUP-PAYMENT-METHOD] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseServiceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseServiceClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.id) throw new Error("User not authenticated");

    logStep("User authenticated", { userId: user.id });

    const { contact_id, payment_type = 'card' } = await req.json();
    logStep("Request data", { contact_id, payment_type });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Get contact details with academy information
    const { data: contact, error: contactError } = await supabaseServiceClient
      .from('profiles')
      .select(`
        email, 
        first_name, 
        last_name,
        academy_id,
        academies:academy_id(
          stripe_connect_account_id,
          stripe_charges_enabled
        )
      `)
      .eq('id', contact_id)
      .single();

    if (contactError || !contact) {
      throw new Error("Contact not found");
    }

    logStep("Contact found", { 
      contactEmail: contact.email,
      hasConnectAccount: !!contact?.academies?.stripe_connect_account_id 
    });

    // Use Connect account if available, otherwise main account
    const stripeConfig = contact?.academies?.stripe_connect_account_id 
      ? { stripeAccount: contact.academies.stripe_connect_account_id }
      : {};

    // Find or create Stripe customer
    let customer;
    const customerListOptions = { 
      email: contact.email, 
      limit: 1,
      ...stripeConfig
    };
    const customers = await stripe.customers.list(customerListOptions);
    
    if (customers.data.length > 0) {
      customer = customers.data[0];
      logStep("Existing customer found", { customerId: customer.id });
    } else {
      const createOptions = {
        email: contact.email,
        name: `${contact.first_name} ${contact.last_name}`.trim(),
        metadata: {
          contact_id: contact_id
        },
        ...stripeConfig
      };
      customer = await stripe.customers.create(createOptions);
      logStep("New customer created", { customerId: customer.id });
    }

    // Create SetupIntent for the payment method
    const setupIntentOptions = {
      customer: customer.id,
      payment_method_types: payment_type === 'ach' ? ['us_bank_account'] : ['card'],
      usage: 'off_session',
      metadata: {
        contact_id: contact_id,
        payment_type: payment_type
      },
      ...stripeConfig
    };
    const setupIntent = await stripe.setupIntents.create(setupIntentOptions);

    logStep("SetupIntent created", { 
      setupIntentId: setupIntent.id, 
      clientSecret: setupIntent.client_secret 
    });

    return new Response(JSON.stringify({
      client_secret: setupIntent.client_secret,
      setup_intent_id: setupIntent.id,
      customer_id: customer.id
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});