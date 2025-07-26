import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { 
      membership_subscription_id, 
      start_date, 
      end_date, 
      frozen_amount_cents, 
      reason, 
      created_by 
    } = await req.json()

    console.log('Creating freeze with extension:', {
      membership_subscription_id,
      start_date,
      end_date,
      frozen_amount_cents,
      reason
    })

    // Get the membership subscription details
    const { data: membership, error: membershipError } = await supabase
      .from('membership_subscriptions')
      .select('*, membership_plans(cycle_length_months)')
      .eq('id', membership_subscription_id)
      .single()

    if (membershipError) throw membershipError

    // Create the freeze
    const { data: freeze, error: freezeError } = await supabase
      .from('membership_freezes')
      .insert({
        membership_subscription_id,
        start_date,
        end_date,
        frozen_amount_cents,
        reason,
        created_by,
        status: 'active'
      })
      .select()
      .single()

    if (freezeError) throw freezeError

    // Calculate freeze duration in months if this is a fixed-term membership
    if (membership.cycle_length_months && end_date) {
      const freezeStartDate = new Date(start_date)
      const freezeEndDate = new Date(end_date)
      const freezeDurationMonths = Math.ceil(
        (freezeEndDate.getTime() - freezeStartDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
      )

      if (freezeDurationMonths > 0) {
        // Get the last payment in the schedule
        const { data: lastPayment, error: lastPaymentError } = await supabase
          .from('payment_schedule')
          .select('*')
          .eq('membership_subscription_id', membership_subscription_id)
          .order('scheduled_date', { ascending: false })
          .limit(1)
          .single()

        if (lastPaymentError) {
          console.error('Error getting last payment:', lastPaymentError)
        } else {
          // Create additional payment schedule entries
          const additionalPayments = []
          const lastScheduledDate = new Date(lastPayment.scheduled_date)
          
          for (let i = 1; i <= freezeDurationMonths; i++) {
            const newDate = new Date(lastScheduledDate)
            newDate.setMonth(newDate.getMonth() + i)
            
            additionalPayments.push({
              membership_subscription_id,
              scheduled_date: newDate.toISOString().split('T')[0],
              amount_cents: lastPayment.amount_cents,
              status: 'pending',
              installment_number: lastPayment.installment_number + i,
              total_installments: lastPayment.total_installments + freezeDurationMonths
            })
          }

          // Update total_installments for all existing payments
          await supabase
            .from('payment_schedule')
            .update({ 
              total_installments: lastPayment.total_installments + freezeDurationMonths 
            })
            .eq('membership_subscription_id', membership_subscription_id)

          // Insert the new payment schedule entries
          const { error: insertError } = await supabase
            .from('payment_schedule')
            .insert(additionalPayments)

          if (insertError) {
            console.error('Error inserting additional payments:', insertError)
          } else {
            console.log(`Added ${freezeDurationMonths} additional payments to extend the schedule`)
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        freeze,
        message: 'Freeze created and payment schedule extended successfully' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in create-membership-freeze-extended:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})