import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-CONNECT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  logStep("Function started");

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    logStep("Stripe key verified");

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
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const { action } = await req.json();
    logStep("Processing action", { action });

    if (action === "create_account_link") {
      // Check if user already has a connected account
      const { data: existingAccount } = await supabaseClient
        .from("stripe_connected_accounts")
        .select("stripe_account_id")
        .eq("user_id", user.id)
        .single();

      let accountId;
      
      if (existingAccount?.stripe_account_id) {
        accountId = existingAccount.stripe_account_id;
        logStep("Using existing account", { accountId });
      } else {
        // Create new Express account
        const account = await stripe.accounts.create({
          type: "express",
          email: user.email,
          business_type: "individual",
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
        });
        
        accountId = account.id;
        logStep("Created new account", { accountId });

        // Store in database
        await supabaseClient
          .from("stripe_connected_accounts")
          .upsert({
            user_id: user.id,
            stripe_account_id: accountId,
            email: user.email,
            account_status: "pending",
          });
      }

      // Create account link for onboarding
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${req.headers.get("origin")}/payment-test-dashboard`,
        return_url: `${req.headers.get("origin")}/payment-test-dashboard?connected=true`,
        type: "account_onboarding",
      });

      logStep("Account link created", { url: accountLink.url });

      return new Response(JSON.stringify({ url: accountLink.url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (action === "check_account_status") {
      // Get connected account from database
      const { data: connectedAccount } = await supabaseClient
        .from("stripe_connected_accounts")
        .select("stripe_account_id")
        .eq("user_id", user.id)
        .single();

      if (!connectedAccount?.stripe_account_id) {
        logStep("No connected account found");
        return new Response(JSON.stringify({ account: null }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // Get account details from Stripe
      const account = await stripe.accounts.retrieve(connectedAccount.stripe_account_id);
      logStep("Account status retrieved", { 
        id: account.id,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted 
      });

      // Update database with current status
      await supabaseClient
        .from("stripe_connected_accounts")
        .update({
          account_status: account.details_submitted ? "active" : "pending",
          charges_enabled: account.charges_enabled,
          payouts_enabled: account.payouts_enabled,
          details_submitted: account.details_submitted,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      return new Response(JSON.stringify({ 
        account: {
          id: account.id,
          business_type: account.business_type,
          country: account.country,
          email: account.email,
          charges_enabled: account.charges_enabled,
          payouts_enabled: account.payouts_enabled,
          details_submitted: account.details_submitted,
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    throw new Error(`Unknown action: ${action}`);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in stripe-connect-oauth", { message: errorMessage });
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});