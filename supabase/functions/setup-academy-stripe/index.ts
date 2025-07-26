import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SETUP-ACADEMY-STRIPE] ${step}${detailsStr}`);
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

    const { academy_id } = await req.json();
    logStep("Request data", { academy_id });

    // Verify user owns this academy
    const { data: academy, error: academyError } = await supabaseServiceClient
      .from('academies')
      .select('*')
      .eq('id', academy_id)
      .eq('owner_id', user.id)
      .single();

    if (academyError || !academy) {
      throw new Error("Academy not found or access denied");
    }

    logStep("Academy verified", { academyId: academy.id, academyName: academy.name });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Check if academy already has a connected account
    if (academy.stripe_connect_account_id) {
      logStep("Academy already has Stripe Connect account", { accountId: academy.stripe_connect_account_id });
      
      // Check account status
      const account = await stripe.accounts.retrieve(academy.stripe_connect_account_id);
      
      return new Response(JSON.stringify({
        success: true,
        account_id: academy.stripe_connect_account_id,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted,
        existing_account: true
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Create new Stripe Connect Express account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email: academy.email || user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'company',
      company: {
        name: academy.name,
      },
      metadata: {
        academy_id: academy.id,
        academy_name: academy.name,
      }
    });

    logStep("Stripe Connect account created", { accountId: account.id });

    // Update academy with Stripe Connect account ID
    const { error: updateError } = await supabaseServiceClient
      .from('academies')
      .update({
        stripe_connect_account_id: account.id,
        stripe_charges_enabled: account.charges_enabled,
        stripe_payouts_enabled: account.payouts_enabled,
      })
      .eq('id', academy.id);

    if (updateError) {
      logStep("Error updating academy", { error: updateError });
      throw new Error(`Failed to update academy: ${updateError.message}`);
    }

    // Create onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${req.headers.get("origin")}/admin?tab=payments&stripe_refresh=true`,
      return_url: `${req.headers.get("origin")}/admin?tab=payments&stripe_success=true`,
      type: 'account_onboarding',
    });

    logStep("Onboarding link created", { url: accountLink.url });

    return new Response(JSON.stringify({
      success: true,
      account_id: account.id,
      onboarding_url: accountLink.url,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
      existing_account: false
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