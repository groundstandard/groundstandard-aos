import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MEMBERSHIP-CYCLES] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Processing membership cycles started");

    // Use service role for database operations
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get memberships that need processing
    const { data: expiringMemberships, error: expiringError } = await supabaseService
      .from('membership_subscriptions')
      .select(`
        *,
        membership_plans (
          name,
          billing_cycle,
          base_price_cents
        )
      `)
      .eq('status', 'active')
      .lte('end_date', new Date().toISOString().split('T')[0]);

    if (expiringError) {
      throw new Error(`Error fetching expiring memberships: ${expiringError.message}`);
    }

    logStep("Found expiring memberships", { count: expiringMemberships?.length || 0 });

    const processedMemberships = [];
    const expiredMemberships = [];

    for (const membership of expiringMemberships || []) {
      try {
        if (membership.auto_renewal && membership.membership_plans.billing_cycle === 'annual') {
          // Process auto-renewal for annual memberships
          const newEndDate = new Date(membership.end_date);
          newEndDate.setFullYear(newEndDate.getFullYear() + 1);
          
          const newNextBillingDate = new Date(membership.end_date);
          newNextBillingDate.setDate(newNextBillingDate.getDate() + 1);

          // Check if discount should expire
          let newDiscountPercentage = membership.renewal_discount_percentage;
          let newDiscountExpiresAt = membership.discount_expires_at;
          
          if (membership.discount_expires_at && new Date(membership.discount_expires_at) <= new Date(membership.end_date)) {
            newDiscountPercentage = 0;
            newDiscountExpiresAt = null;
            logStep("Discount expired for membership", { membershipId: membership.id });
          }

          const { error: updateError } = await supabaseService
            .from('membership_subscriptions')
            .update({
              cycle_number: membership.cycle_number + 1,
              start_date: membership.end_date,
              end_date: newEndDate.toISOString().split('T')[0],
              next_billing_date: newNextBillingDate.toISOString().split('T')[0],
              renewal_discount_percentage: newDiscountPercentage,
              discount_expires_at: newDiscountExpiresAt,
              notes: `Auto-renewed to cycle ${membership.cycle_number + 1} on ${new Date().toISOString()}`,
              updated_at: new Date().toISOString()
            })
            .eq('id', membership.id);

          if (updateError) {
            throw new Error(`Error updating membership ${membership.id}: ${updateError.message}`);
          }

          processedMemberships.push({
            id: membership.id,
            action: 'renewed',
            newCycle: membership.cycle_number + 1,
            newEndDate: newEndDate.toISOString().split('T')[0]
          });

          logStep("Auto-renewed membership", { 
            membershipId: membership.id, 
            newCycle: membership.cycle_number + 1,
            discountRemoved: newDiscountPercentage === 0 && membership.renewal_discount_percentage > 0
          });

        } else {
          // Mark membership as expired
          const { error: expireError } = await supabaseService
            .from('membership_subscriptions')
            .update({
              status: 'expired',
              notes: `Expired on ${new Date().toISOString()} - ${membership.auto_renewal ? 'Auto-renewal disabled' : 'Manual renewal required'}`,
              updated_at: new Date().toISOString()
            })
            .eq('id', membership.id);

          if (expireError) {
            throw new Error(`Error expiring membership ${membership.id}: ${expireError.message}`);
          }

          expiredMemberships.push({
            id: membership.id,
            action: 'expired',
            reason: membership.auto_renewal ? 'Non-annual membership' : 'Auto-renewal disabled'
          });

          logStep("Expired membership", { 
            membershipId: membership.id, 
            reason: membership.auto_renewal ? 'Non-annual membership' : 'Auto-renewal disabled'
          });
        }
      } catch (membershipError) {
        logStep("Error processing individual membership", { 
          membershipId: membership.id, 
          error: membershipError instanceof Error ? membershipError.message : String(membershipError)
        });
      }
    }

    // Check for memberships approaching renewal (30 days out)
    const upcomingDate = new Date();
    upcomingDate.setDate(upcomingDate.getDate() + 30);

    const { data: upcomingRenewals, error: upcomingError } = await supabaseService
      .from('membership_subscriptions')
      .select(`
        *,
        membership_plans (name, billing_cycle),
        profiles (first_name, last_name, email)
      `)
      .eq('status', 'active')
      .eq('membership_plans.billing_cycle', 'annual')
      .lte('end_date', upcomingDate.toISOString().split('T')[0])
      .gt('end_date', new Date().toISOString().split('T')[0]);

    if (upcomingError) {
      logStep("Error fetching upcoming renewals", { error: upcomingError.message });
    } else {
      logStep("Found upcoming renewals", { count: upcomingRenewals?.length || 0 });
    }

    const summary = {
      processedCount: processedMemberships.length,
      expiredCount: expiredMemberships.length,
      upcomingRenewalsCount: upcomingRenewals?.length || 0,
      processedMemberships,
      expiredMemberships,
      upcomingRenewals: upcomingRenewals?.map(m => ({
        id: m.id,
        memberName: `${m.profiles.first_name} ${m.profiles.last_name}`,
        planName: m.membership_plans.name,
        endDate: m.end_date,
        cycleNumber: m.cycle_number
      })) || []
    };

    logStep("Membership cycle processing completed", summary);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in membership cycle processing", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});