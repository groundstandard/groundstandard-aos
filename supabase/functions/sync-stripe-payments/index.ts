import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SYNC-STRIPE-PAYMENTS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }

    // Use service role for database operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Check if user has admin role
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !['admin', 'owner'].includes(profile.role)) {
      throw new Error("Insufficient permissions");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Get all customers from Stripe
    const customers = await stripe.customers.list({ limit: 100 });
    logStep("Retrieved Stripe customers", { count: customers.data.length });

    let syncedCount = 0;
    let updatedProfiles = 0;

    for (const customer of customers.data) {
      if (!customer.email) continue;

      // Find matching profile by email
      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("id, stripe_customer_id")
        .eq("email", customer.email)
        .single();

      if (!profile) continue;

      // Update profile with Stripe customer ID if missing
      if (!profile.stripe_customer_id) {
        await supabaseClient
          .from("profiles")
          .update({ stripe_customer_id: customer.id })
          .eq("id", profile.id);
        updatedProfiles++;
        logStep("Updated profile with Stripe customer ID", { 
          profileId: profile.id, 
          customerId: customer.id 
        });
      }

      // Get payment intents for this customer
      const paymentIntents = await stripe.paymentIntents.list({
        customer: customer.id,
        limit: 50
      });

      for (const paymentIntent of paymentIntents.data) {
        if (paymentIntent.status !== 'succeeded') continue;

        // Check if payment already exists in our database
        const { data: existingPayment } = await supabaseClient
          .from("payments")
          .select("id")
          .eq("stripe_payment_intent_id", paymentIntent.id)
          .single();

        if (existingPayment) continue;

        // Create payment record
        const paymentData = {
          student_id: profile.id,
          amount: paymentIntent.amount,
          status: 'completed',
          payment_method: paymentIntent.payment_method_types[0] || 'card',
          stripe_payment_intent_id: paymentIntent.id,
          payment_date: new Date(paymentIntent.created * 1000).toISOString(),
          description: paymentIntent.description || 'Stripe payment sync',
          metadata: {
            stripe_customer_id: customer.id,
            synced_from_stripe: true
          }
        };

        const { error: insertError } = await supabaseClient
          .from("payments")
          .insert(paymentData);

        if (!insertError) {
          syncedCount++;
          logStep("Synced payment", { 
            paymentIntentId: paymentIntent.id, 
            amount: paymentIntent.amount 
          });
        }
      }
    }

    logStep("Sync completed", { 
      syncedPayments: syncedCount, 
      updatedProfiles: updatedProfiles 
    });

    return new Response(JSON.stringify({
      success: true,
      syncedPayments: syncedCount,
      updatedProfiles: updatedProfiles
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