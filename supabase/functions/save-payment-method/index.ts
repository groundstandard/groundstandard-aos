import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SAVE-PAYMENT-METHOD] ${step}${detailsStr}`);
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

    const { setup_intent_id, contact_id, is_default = false } = await req.json();
    logStep("Request data", { setup_intent_id, contact_id, is_default });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Retrieve the SetupIntent to get payment method details
    const setupIntent = await stripe.setupIntents.retrieve(setup_intent_id);
    
    if (setupIntent.status !== 'succeeded') {
      throw new Error("SetupIntent has not succeeded");
    }

    if (!setupIntent.payment_method) {
      throw new Error("No payment method attached to SetupIntent");
    }

    // Retrieve payment method details
    const paymentMethod = await stripe.paymentMethods.retrieve(setupIntent.payment_method as string);
    logStep("Payment method retrieved", { 
      paymentMethodId: paymentMethod.id, 
      type: paymentMethod.type 
    });

    let paymentMethodData: any = {
      contact_id: contact_id,
      stripe_payment_method_id: paymentMethod.id,
      type: paymentMethod.type,
      is_default: is_default,
      is_active: true
    };

    // Extract card or ACH details
    if (paymentMethod.type === 'card' && paymentMethod.card) {
      paymentMethodData.last4 = paymentMethod.card.last4;
      paymentMethodData.brand = paymentMethod.card.brand;
    } else if (paymentMethod.type === 'us_bank_account' && paymentMethod.us_bank_account) {
      paymentMethodData.last4 = paymentMethod.us_bank_account.last4;
      paymentMethodData.bank_name = paymentMethod.us_bank_account.bank_name;
    }

    logStep("Payment method data prepared", paymentMethodData);

    // If this is set as default, unset other default payment methods for this contact
    if (is_default) {
      await supabaseServiceClient
        .from('payment_methods')
        .update({ is_default: false })
        .eq('contact_id', contact_id);
      
      logStep("Cleared other default payment methods");
    }

    // Save payment method to database
    const { data: savedPaymentMethod, error: saveError } = await supabaseServiceClient
      .from('payment_methods')
      .insert(paymentMethodData)
      .select()
      .single();

    if (saveError) {
      logStep("Error saving payment method", { error: saveError });
      throw new Error(`Failed to save payment method: ${saveError.message}`);
    }

    logStep("Payment method saved successfully", { id: savedPaymentMethod.id });

    return new Response(JSON.stringify({
      success: true,
      payment_method: savedPaymentMethod
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