import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-INSTALLMENT-PLAN] ${step}${detailsStr}`);
};

interface InstallmentPlanRequest {
  total_amount: number;
  installments_count: number;
  frequency: 'weekly' | 'monthly' | 'quarterly';
  start_date: string;
  description?: string;
  preferred_payment_method: 'card' | 'ach';
  payment_method_id?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const requestData: InstallmentPlanRequest = await req.json();
    const {
      total_amount,
      installments_count,
      frequency,
      start_date,
      description,
      preferred_payment_method,
      payment_method_id
    } = requestData;

    // Calculate installment amount
    const installment_amount = Math.ceil(total_amount / installments_count);
    logStep("Calculated installment amount", { installment_amount, total_amount, installments_count });

    // Calculate next payment date based on frequency
    const startDate = new Date(start_date);
    let nextPaymentDate = new Date(startDate);
    
    switch (frequency) {
      case 'weekly':
        nextPaymentDate.setDate(startDate.getDate() + 7);
        break;
      case 'monthly':
        nextPaymentDate.setMonth(startDate.getMonth() + 1);
        break;
      case 'quarterly':
        nextPaymentDate.setMonth(startDate.getMonth() + 3);
        break;
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // If payment method provided, save it
    let setupIntentId = null;
    if (payment_method_id) {
      // Get customer
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      if (customers.data.length > 0) {
        const customerId = customers.data[0].id;
        
        // Attach payment method to customer
        await stripe.paymentMethods.attach(payment_method_id, {
          customer: customerId,
        });

        // Get payment method details for storage
        const paymentMethod = await stripe.paymentMethods.retrieve(payment_method_id);
        
        // Save payment method to database
        await supabaseClient.from('saved_payment_methods').upsert({
          user_id: user.id,
          stripe_payment_method_id: payment_method_id,
          payment_type: paymentMethod.type,
          is_default: preferred_payment_method === paymentMethod.type,
          card_brand: paymentMethod.card?.brand,
          card_last4: paymentMethod.card?.last4,
          bank_name: paymentMethod.us_bank_account?.bank_name,
          bank_last4: paymentMethod.us_bank_account?.last4,
        });

        logStep("Payment method saved", { payment_method_id, type: paymentMethod.type });
      }
    }

    // Create installment plan in database
    const { data: installmentPlan, error: planError } = await supabaseClient
      .from('installment_plans')
      .insert({
        student_id: user.id,
        total_amount: total_amount * 100, // Convert to cents
        installments_count,
        installment_amount: installment_amount * 100, // Convert to cents
        frequency,
        start_date: start_date,
        next_payment_date: nextPaymentDate.toISOString().split('T')[0],
        description,
        preferred_payment_method,
        setup_intent_id: setupIntentId,
        status: 'active'
      })
      .select()
      .single();

    if (planError) throw new Error(`Failed to create installment plan: ${planError.message}`);
    logStep("Installment plan created", { planId: installmentPlan.id });

    return new Response(JSON.stringify({
      installment_plan: installmentPlan,
      message: "Installment plan created successfully"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-installment-plan", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});