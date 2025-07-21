import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[PROCESS-RECURRING-PAYMENTS] Starting recurring payment processing");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Process failed payments that need retry
    await processFailedPayments(supabase, stripe);

    // Check for expiring trials
    await processExpiringTrials(supabase, stripe);

    // Process overdue payments
    await processOverduePayments(supabase, stripe);

    // Auto-process class pack renewals
    await processClassPackRenewals(supabase, stripe);

    console.log("[PROCESS-RECURRING-PAYMENTS] Completed successfully");

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[PROCESS-RECURRING-PAYMENTS] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function processFailedPayments(supabase: any, stripe: Stripe) {
  console.log("Processing failed payments for retry...");

  // Get subscriptions with failed payments in the last 3 days
  const { data: failedPayments } = await supabase
    .from("payments")
    .select(`
      *,
      profiles!inner(email, first_name, last_name, membership_status)
    `)
    .eq("status", "failed")
    .gte("payment_date", new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString())
    .limit(10);

  for (const payment of failedPayments || []) {
    try {
      // Try to charge the customer again
      const customers = await stripe.customers.list({
        email: payment.profiles.email,
        limit: 1
      });

      if (customers.data.length > 0) {
        const customer = customers.data[0];
        
        // Get customer's default payment method
        const paymentMethods = await stripe.paymentMethods.list({
          customer: customer.id,
          type: 'card',
        });

        if (paymentMethods.data.length > 0) {
          // Attempt to create a new payment intent
          const paymentIntent = await stripe.paymentIntents.create({
            amount: payment.amount,
            currency: 'usd',
            customer: customer.id,
            payment_method: paymentMethods.data[0].id,
            confirm: true,
            automatic_payment_methods: {
              enabled: true,
              allow_redirects: 'never'
            },
            description: `Retry payment for ${payment.description}`,
          });

          if (paymentIntent.status === 'succeeded') {
            // Update payment status
            await supabase
              .from("payments")
              .update({
                status: "completed",
                updated_at: new Date().toISOString(),
                description: `${payment.description} (Retry successful)`
              })
              .eq("id", payment.id);

            console.log(`Payment retry successful for ${payment.profiles.email}`);
          }
        }
      }
    } catch (error) {
      console.error(`Failed to retry payment for ${payment.profiles.email}:`, error);
      
      // After 3 failed attempts, suspend the account
      const retryCount = (payment.description?.match(/Retry/g) || []).length;
      if (retryCount >= 2) {
        await supabase
          .from("profiles")
          .update({
            membership_status: "suspended",
            updated_at: new Date().toISOString()
          })
          .eq("id", payment.student_id);
      }
    }
  }
}

async function processExpiringTrials(supabase: any, stripe: Stripe) {
  console.log("Processing expiring trials...");

  const { data: expiringTrials } = await supabase
    .from("subscriptions")
    .select(`
      *,
      profiles!inner(email, first_name, last_name)
    `)
    .not("trial_end", "is", null)
    .lte("trial_end", new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()) // 2 days from now
    .eq("status", "trialing");

  for (const subscription of expiringTrials || []) {
    try {
      // Send trial expiring notification via our notification service
      await supabase.functions.invoke('send-payment-reminder', {
        body: {
          type: 'trial_expiring',
          contactId: subscription.user_id,
          data: {
            trial_end: subscription.trial_end,
            portal_url: await getCustomerPortalUrl(stripe, subscription.stripe_customer_id)
          }
        }
      });
      
      console.log(`Trial expiring notification sent to ${subscription.profiles.email}`);
    } catch (error) {
      console.error(`Failed to process expiring trial for ${subscription.profiles.email}:`, error);
    }
  }
}

async function processOverduePayments(supabase: any, stripe: Stripe) {
  console.log("Processing overdue payments...");

  const { data: overduePayments } = await supabase
    .from("payments")
    .select(`
      *,
      profiles!inner(email, first_name, last_name)
    `)
    .eq("status", "pending")
    .lt("payment_date", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // 7 days overdue

  for (const payment of overduePayments || []) {
    try {
      // Apply late fee if not already applied
      const { data: existingLateFee } = await supabase
        .from("late_fees")
        .select("id")
        .eq("payment_id", payment.id)
        .single();

      if (!existingLateFee) {
        const lateFeeAmount = Math.max(Math.floor(payment.amount * 0.05), 500); // 5% or $5 minimum

        await supabase
          .from("late_fees")
          .insert({
            payment_id: payment.id,
            student_id: payment.student_id,
            original_amount: payment.amount,
            late_fee_amount: lateFeeAmount,
            days_overdue: Math.floor((Date.now() - new Date(payment.payment_date).getTime()) / (24 * 60 * 60 * 1000)),
            fee_percentage: 5.0,
            status: "pending",
            created_at: new Date().toISOString()
          });

        console.log(`Late fee applied for ${payment.profiles.email}: $${lateFeeAmount / 100}`);
      }
    } catch (error) {
      console.error(`Failed to process overdue payment for ${payment.profiles.email}:`, error);
    }
  }
}

async function processClassPackRenewals(supabase: any, stripe: Stripe) {
  console.log("Processing class pack auto-renewals...");

  // Get class packs that are set for auto-renewal and are expiring or low on classes
  const { data: renewalPacks } = await supabase
    .from("class_packs")
    .select(`
      *,
      profiles!inner(email, first_name, last_name),
      membership_plans!inner(name, price_cents, stripe_price_id)
    `)
    .eq("auto_renewal", true)
    .eq("status", "active")
    .or(`expiry_date.lte.${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()},remaining_classes.lte.2`);

  for (const pack of renewalPacks || []) {
    try {
      const customers = await stripe.customers.list({
        email: pack.profiles.email,
        limit: 1
      });

      if (customers.data.length > 0 && pack.membership_plans.stripe_price_id) {
        // Create a one-time charge for the renewal
        await stripe.invoiceItems.create({
          customer: customers.data[0].id,
          price: pack.membership_plans.stripe_price_id,
          description: `Auto-renewal: ${pack.membership_plans.name}`,
        });

        const invoice = await stripe.invoices.create({
          customer: customers.data[0].id,
          auto_advance: true,
        });

        await stripe.invoices.finalizeInvoice(invoice.id);
        await stripe.invoices.pay(invoice.id);

        // Create new class pack
        await supabase
          .from("class_packs")
          .insert({
            profile_id: pack.profile_id,
            membership_plan_id: pack.membership_plan_id,
            total_classes: pack.total_classes,
            remaining_classes: pack.total_classes,
            expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
            status: "active",
            auto_renewal: pack.auto_renewal,
            notes: `Auto-renewal from pack ${pack.id}`,
            created_at: new Date().toISOString()
          });

        console.log(`Auto-renewed class pack for ${pack.profiles.email}`);
      }
    } catch (error) {
      console.error(`Failed to auto-renew class pack for ${pack.profiles.email}:`, error);
    }
  }
}

async function getCustomerPortalUrl(stripe: Stripe, customerId: string): Promise<string> {
  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: 'https://academy.com/payments',
    });
    return portalSession.url;
  } catch (error) {
    return 'https://academy.com/payments';
  }
}