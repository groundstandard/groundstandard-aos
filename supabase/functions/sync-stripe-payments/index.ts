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

    // Get all profiles for bulk processing
    const { data: allProfiles } = await supabaseClient
      .from("profiles")
      .select("id, email, stripe_customer_id");

    let syncedCount = 0;
    let updatedProfiles = 0;
    let skippedDuplicates = 0;

    for (const customer of customers.data) {
      if (!customer.email) continue;

      // Find matching profile by email
      const profile = allProfiles?.find(p => p.email === customer.email);
      if (!profile) {
        logStep("No profile found for customer email", { email: customer.email });
        continue;
      }

      // Update profile with Stripe customer ID if missing
      if (!profile.stripe_customer_id) {
        await supabaseClient
          .from("profiles")
          .update({ stripe_customer_id: customer.id })
          .eq("id", profile.id);
        updatedProfiles++;
        logStep("Updated profile with Stripe customer ID", { 
          profileId: profile.id, 
          email: profile.email,
          customerId: customer.id 
        });
        // Update local copy for payment processing
        profile.stripe_customer_id = customer.id;
      }

      // Get payment intents for this customer
      const paymentIntents = await stripe.paymentIntents.list({
        customer: customer.id,
        limit: 50
      });

      logStep("Processing payment intents", { 
        customerId: customer.id, 
        email: customer.email,
        paymentCount: paymentIntents.data.length 
      });

      for (const paymentIntent of paymentIntents.data) {
        if (paymentIntent.status !== 'succeeded') {
          logStep("Skipping non-succeeded payment", { 
            paymentIntentId: paymentIntent.id, 
            status: paymentIntent.status 
          });
          continue;
        }

        // Check if payment already exists by stripe_payment_intent_id
        const { data: existingPayments } = await supabaseClient
          .from("payments")
          .select("id, stripe_payment_intent_id, stripe_invoice_id")
          .eq('stripe_payment_intent_id', paymentIntent.id);

        if (existingPayments && existingPayments.length > 0) {
          skippedDuplicates++;
          logStep("Payment already exists, skipping", { 
            paymentIntentId: paymentIntent.id,
            existingPaymentIds: existingPayments.map(p => p.id)
          });
          continue;
        }

        // Create payment record
        const paymentData = {
          student_id: profile.id,
          amount: paymentIntent.amount,
          status: 'completed',
          payment_method: paymentIntent.payment_method_types[0] || 'card',
          stripe_payment_intent_id: paymentIntent.id,
          stripe_invoice_id: paymentIntent.invoice,
          payment_date: new Date(paymentIntent.created * 1000).toISOString(),
          description: paymentIntent.description || 'Stripe payment sync',
          metadata: {
            stripe_customer_id: customer.id,
            synced_from_stripe: true,
            stripe_amount: paymentIntent.amount,
            stripe_currency: paymentIntent.currency
          }
        };

        const { error: insertError } = await supabaseClient
          .from("payments")
          .insert(paymentData);

        if (!insertError) {
          syncedCount++;
          logStep("Successfully synced payment", { 
            paymentIntentId: paymentIntent.id, 
            amount: paymentIntent.amount,
            profileEmail: profile.email,
            profileId: profile.id
          });
        } else {
          logStep("Failed to insert payment", { 
            paymentIntentId: paymentIntent.id, 
            error: insertError.message 
          });
        }
      }
    }

    logStep("Sync completed", { 
      syncedPayments: syncedCount, 
      updatedProfiles: updatedProfiles,
      skippedDuplicates: skippedDuplicates
    });

    return new Response(JSON.stringify({
      success: true,
      syncedPayments: syncedCount,
      updatedProfiles: updatedProfiles,
      skippedDuplicates: skippedDuplicates
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