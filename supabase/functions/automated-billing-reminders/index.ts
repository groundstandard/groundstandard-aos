import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[AUTOMATED-BILLING] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Starting automated billing reminders");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Find overdue payments (7+ days past due)
    const overdueDate = new Date();
    overdueDate.setDate(overdueDate.getDate() - 7);

    const { data: overduePayments, error: overdueError } = await supabaseClient
      .from('billing_cycles')
      .select(`
        *,
        membership_subscriptions(
          profile_id,
          profiles(first_name, last_name, email)
        )
      `)
      .eq('status', 'pending')
      .lt('due_date', overdueDate.toISOString().split('T')[0]);

    if (overdueError) throw overdueError;

    logStep("Found overdue payments", { count: overduePayments?.length || 0 });

    // Find upcoming payments (due in 3 days)
    const upcomingDate = new Date();
    upcomingDate.setDate(upcomingDate.getDate() + 3);

    const { data: upcomingPayments, error: upcomingError } = await supabaseClient
      .from('billing_cycles')
      .select(`
        *,
        membership_subscriptions(
          profile_id,
          profiles(first_name, last_name, email)
        )
      `)
      .eq('status', 'pending')
      .eq('due_date', upcomingDate.toISOString().split('T')[0]);

    if (upcomingError) throw upcomingError;

    logStep("Found upcoming payments", { count: upcomingPayments?.length || 0 });

    const results = {
      overdueReminders: 0,
      upcomingReminders: 0,
      errors: []
    };

    // Send overdue payment reminders
    if (overduePayments) {
      for (const payment of overduePayments) {
        try {
          const profile = payment.membership_subscriptions?.profiles;
          if (!profile?.email) continue;

          const { error: reminderError } = await supabaseClient.functions.invoke(
            'send-payment-reminder',
            {
              body: {
                contact_id: payment.membership_subscriptions?.profile_id,
                reminder_type: 'overdue',
                payment_amount: payment.total_amount_cents,
                due_date: payment.due_date
              }
            }
          );

          if (reminderError) {
            results.errors.push(`Failed to send overdue reminder to ${profile.email}: ${reminderError.message}`);
          } else {
            results.overdueReminders++;
            logStep("Sent overdue reminder", { email: profile.email, amount: payment.total_amount_cents });
          }
        } catch (error) {
          results.errors.push(`Error processing overdue payment: ${error.message}`);
        }
      }
    }

    // Send upcoming payment reminders
    if (upcomingPayments) {
      for (const payment of upcomingPayments) {
        try {
          const profile = payment.membership_subscriptions?.profiles;
          if (!profile?.email) continue;

          const { error: reminderError } = await supabaseClient.functions.invoke(
            'send-payment-reminder',
            {
              body: {
                contact_id: payment.membership_subscriptions?.profile_id,
                reminder_type: 'upcoming',
                payment_amount: payment.total_amount_cents,
                due_date: payment.due_date
              }
            }
          );

          if (reminderError) {
            results.errors.push(`Failed to send upcoming reminder to ${profile.email}: ${reminderError.message}`);
          } else {
            results.upcomingReminders++;
            logStep("Sent upcoming reminder", { email: profile.email, amount: payment.total_amount_cents });
          }
        } catch (error) {
          results.errors.push(`Error processing upcoming payment: ${error.message}`);
        }
      }
    }

    logStep("Completed automated billing reminders", results);

    return new Response(JSON.stringify({
      success: true,
      ...results
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    logStep("ERROR in automated billing reminders", { message: error.message });
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});