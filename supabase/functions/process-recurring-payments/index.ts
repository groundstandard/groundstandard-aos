import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Initialize Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const today = new Date().toISOString().split('T')[0];

    // Get payment schedules that are due today
    const { data: duePayments, error: paymentError } = await supabaseClient
      .from('payment_schedules')
      .select(`
        *,
        profiles!payment_schedules_student_id_fkey(first_name, last_name, email)
      `)
      .eq('status', 'active')
      .lte('next_payment_date', today);

    if (paymentError) {
      throw new Error(`Error fetching due payments: ${paymentError.message}`);
    }

    const results = [];

    for (const schedule of duePayments || []) {
      try {
        let paymentResult;

        if (schedule.stripe_subscription_id) {
          // For Stripe subscriptions, just verify the payment
          const subscription = await stripe.subscriptions.retrieve(schedule.stripe_subscription_id);
          
          if (subscription.status === 'active') {
            // Record successful payment
            const { error: insertError } = await supabaseClient
              .from('payments')
              .insert({
                student_id: schedule.student_id,
                amount: schedule.amount,
                payment_method: 'subscription',
                status: 'completed',
                description: `Recurring payment - ${schedule.frequency}`,
                payment_date: new Date().toISOString(),
              });

            if (!insertError) {
              paymentResult = { success: true, type: 'subscription' };
            }
          }
        } else {
          // For manual recurring payments, create payment intent
          const paymentIntent = await stripe.paymentIntents.create({
            amount: schedule.amount,
            currency: schedule.currency,
            metadata: {
              student_id: schedule.student_id,
              schedule_id: schedule.id,
              type: 'recurring_payment'
            },
            description: `Recurring payment for ${schedule.profiles?.first_name} ${schedule.profiles?.last_name}`,
          });

          paymentResult = { 
            success: true, 
            type: 'payment_intent',
            payment_intent_id: paymentIntent.id 
          };
        }

        if (paymentResult?.success) {
          // Calculate next payment date
          const nextDate = new Date(schedule.next_payment_date);
          switch (schedule.frequency) {
            case 'weekly':
              nextDate.setDate(nextDate.getDate() + 7);
              break;
            case 'monthly':
              nextDate.setMonth(nextDate.getMonth() + 1);
              break;
            case 'quarterly':
              nextDate.setMonth(nextDate.getMonth() + 3);
              break;
            case 'yearly':
              nextDate.setFullYear(nextDate.getFullYear() + 1);
              break;
          }

          // Update payment schedule
          const { error: updateError } = await supabaseClient
            .from('payment_schedules')
            .update({
              next_payment_date: nextDate.toISOString().split('T')[0],
              updated_at: new Date().toISOString(),
            })
            .eq('id', schedule.id);

          if (updateError) {
            console.error(`Error updating schedule ${schedule.id}:`, updateError);
          }

          results.push({
            schedule_id: schedule.id,
            student_name: `${schedule.profiles?.first_name} ${schedule.profiles?.last_name}`,
            amount: schedule.amount,
            next_payment_date: nextDate.toISOString().split('T')[0],
            status: 'processed',
            ...paymentResult
          });
        }

      } catch (scheduleError) {
        console.error(`Error processing schedule ${schedule.id}:`, scheduleError);
        results.push({
          schedule_id: schedule.id,
          student_name: `${schedule.profiles?.first_name} ${schedule.profiles?.last_name}`,
          status: 'failed',
          error: scheduleError.message
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      processed_count: results.length,
      results
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error processing recurring payments:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});