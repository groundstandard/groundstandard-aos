import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PROCESS-INSTALLMENT-PAYMENTS] ${step}${detailsStr}`);
};

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

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Get all active installment plans due for payment today
    const today = new Date().toISOString().split('T')[0];
    const { data: duePlans, error: plansError } = await supabaseClient
      .from('installment_plans')
      .select(`
        *,
        profiles:student_id (email, first_name, last_name)
      `)
      .eq('status', 'active')
      .eq('auto_pay', true)
      .lte('next_payment_date', today);

    if (plansError) throw new Error(`Failed to fetch due plans: ${plansError.message}`);
    logStep("Found due installment plans", { count: duePlans?.length || 0 });

    if (!duePlans || duePlans.length === 0) {
      return new Response(JSON.stringify({ 
        message: "No installment payments due today",
        processed: 0 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    let successCount = 0;
    let failureCount = 0;

    for (const plan of duePlans) {
      try {
        logStep("Processing installment plan", { planId: plan.id, studentId: plan.student_id });

        // Get customer's default payment method
        const customers = await stripe.customers.list({ 
          email: plan.profiles.email, 
          limit: 1 
        });

        if (customers.data.length === 0) {
          logStep("No Stripe customer found", { email: plan.profiles.email });
          continue;
        }

        const customerId = customers.data[0].id;

        // Get saved payment methods for this user
        const { data: paymentMethods } = await supabaseClient
          .from('saved_payment_methods')
          .select('*')
          .eq('user_id', plan.student_id)
          .eq('payment_type', plan.preferred_payment_method)
          .eq('status', 'active')
          .eq('is_default', true)
          .limit(1);

        if (!paymentMethods || paymentMethods.length === 0) {
          logStep("No default payment method found", { studentId: plan.student_id });
          continue;
        }

        const paymentMethod = paymentMethods[0];

        // Calculate which installment number this is
        const startDate = new Date(plan.start_date);
        const currentDate = new Date();
        let installmentNumber = 1;

        if (plan.frequency === 'weekly') {
          installmentNumber = Math.ceil((currentDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
        } else if (plan.frequency === 'monthly') {
          installmentNumber = Math.ceil((currentDate.getTime() - startDate.getTime()) / (30 * 24 * 60 * 60 * 1000)) + 1;
        } else if (plan.frequency === 'quarterly') {
          installmentNumber = Math.ceil((currentDate.getTime() - startDate.getTime()) / (90 * 24 * 60 * 60 * 1000)) + 1;
        }

        // Create payment intent
        const paymentIntent = await stripe.paymentIntents.create({
          amount: plan.installment_amount,
          currency: 'usd',
          customer: customerId,
          payment_method: paymentMethod.stripe_payment_method_id,
          confirmation_method: 'automatic',
          confirm: true,
          off_session: true, // Indicates this is for a payment outside of the customer flow
          description: `Installment ${installmentNumber}/${plan.installments_count} - ${plan.description || 'Payment Plan'}`,
          metadata: {
            installment_plan_id: plan.id,
            installment_number: installmentNumber.toString(),
            student_id: plan.student_id
          }
        });

        logStep("Payment intent created", { 
          paymentIntentId: paymentIntent.id, 
          status: paymentIntent.status 
        });

        // Record payment in database
        await supabaseClient.from('payments').insert({
          student_id: plan.student_id,
          amount: plan.installment_amount,
          payment_method: plan.preferred_payment_method,
          payment_method_type: plan.preferred_payment_method,
          status: paymentIntent.status === 'succeeded' ? 'completed' : 'pending',
          description: `Installment ${installmentNumber}/${plan.installments_count}`,
          payment_date: new Date().toISOString(),
          installment_plan_id: plan.id,
          installment_number: installmentNumber,
          total_installments: plan.installments_count,
          stripe_payment_intent_id: paymentIntent.id,
          ach_bank_name: paymentMethod.bank_name,
          ach_last4: paymentMethod.bank_last4
        });

        // Calculate next payment date
        const nextPaymentDate = new Date(plan.next_payment_date);
        switch (plan.frequency) {
          case 'weekly':
            nextPaymentDate.setDate(nextPaymentDate.getDate() + 7);
            break;
          case 'monthly':
            nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
            break;
          case 'quarterly':
            nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 3);
            break;
        }

        // Update installment plan
        const updateData: any = {
          next_payment_date: nextPaymentDate.toISOString().split('T')[0]
        };

        // Check if this was the last installment
        if (installmentNumber >= plan.installments_count) {
          updateData.status = 'completed';
        }

        await supabaseClient
          .from('installment_plans')
          .update(updateData)
          .eq('id', plan.id);

        successCount++;
        logStep("Installment payment processed successfully", { planId: plan.id });

      } catch (error) {
        failureCount++;
        logStep("Failed to process installment payment", { 
          planId: plan.id, 
          error: error.message 
        });

        // Record failed payment
        await supabaseClient.from('payments').insert({
          student_id: plan.student_id,
          amount: plan.installment_amount,
          payment_method: plan.preferred_payment_method,
          payment_method_type: plan.preferred_payment_method,
          status: 'failed',
          description: `Failed installment payment - ${error.message}`,
          payment_date: new Date().toISOString(),
          installment_plan_id: plan.id
        });
      }
    }

    logStep("Installment payment processing completed", { 
      total: duePlans.length, 
      successful: successCount, 
      failed: failureCount 
    });

    return new Response(JSON.stringify({
      message: "Installment payment processing completed",
      total_plans: duePlans.length,
      successful_payments: successCount,
      failed_payments: failureCount
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in process-installment-payments", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});