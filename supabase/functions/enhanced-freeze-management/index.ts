import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to log steps for debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ENHANCED-FREEZE-MANAGEMENT] ${step}${detailsStr}`);
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { 
      action, // 'create', 'update', 'delete'
      freeze_id,
      membership_subscription_id, 
      start_date, 
      end_date, 
      frozen_amount_cents, 
      reason, 
      created_by 
    } = await req.json()

    logStep('Enhanced freeze management started', { action, freeze_id, membership_subscription_id });

    if (action === 'create') {
      return await handleCreateFreeze({
        supabase,
        membership_subscription_id,
        start_date,
        end_date,
        frozen_amount_cents,
        reason,
        created_by
      });
    } else if (action === 'update') {
      return await handleUpdateFreeze({
        supabase,
        freeze_id,
        end_date,
        frozen_amount_cents,
        reason
      });
    } else if (action === 'delete') {
      return await handleDeleteFreeze({
        supabase,
        freeze_id
      });
    } else {
      throw new Error('Invalid action. Must be create, update, or delete.');
    }

  } catch (error) {
    logStep('ERROR in enhanced-freeze-management', { message: error.message });
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

async function handleCreateFreeze({
  supabase,
  membership_subscription_id,
  start_date,
  end_date,
  frozen_amount_cents,
  reason,
  created_by
}) {
  logStep('Creating freeze with enhanced logic');

  // Get membership and payment schedule details
  const { data: membership, error: membershipError } = await supabase
    .from('membership_subscriptions')
    .select(`
      *, 
      membership_plans(
        cycle_length_months, 
        base_price_cents, 
        billing_frequency
      )
    `)
    .eq('id', membership_subscription_id)
    .single();

  if (membershipError) throw membershipError;

  // Get existing payment schedule
  const { data: paymentSchedule, error: scheduleError } = await supabase
    .from('payment_schedule')
    .select('*')
    .eq('membership_subscription_id', membership_subscription_id)
    .order('scheduled_date');

  if (scheduleError) throw scheduleError;

  // Check for payment conflicts
  const conflictingPayments = paymentSchedule.filter(payment => {
    const paymentDate = new Date(payment.scheduled_date);
    const freezeStart = new Date(start_date);
    const freezeEnd = end_date ? new Date(end_date) : new Date('2099-12-31');
    
    return payment.status === 'completed' && 
           paymentDate >= freezeStart && 
           paymentDate <= freezeEnd;
  });

  logStep('Checking payment conflicts', { conflictingPayments: conflictingPayments.length });

  // Handle payment conflicts by reallocating them
  if (conflictingPayments.length > 0) {
    await reallocateConflictingPayments(supabase, conflictingPayments, membership_subscription_id);
  }

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
    .single();

  if (freezeError) throw freezeError;

  // Calculate proportionate class/payment additions
  const freezeDuration = calculateFreezeDuration(start_date, end_date, membership.membership_plans.billing_frequency);
  
  if (freezeDuration > 0) {
    await addProportionalPayments(supabase, membership_subscription_id, paymentSchedule, freezeDuration, membership.membership_plans);
  }

  logStep('Freeze created successfully with enhanced logic', { freeze_id: freeze.id, added_payments: freezeDuration });

  return new Response(
    JSON.stringify({ 
      success: true, 
      freeze,
      added_payments: freezeDuration,
      reallocated_payments: conflictingPayments.length,
      message: 'Freeze created with automatic class adjustments and payment reallocation' 
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 
    }
  );
}

async function handleUpdateFreeze({
  supabase,
  freeze_id,
  end_date,
  frozen_amount_cents,
  reason
}) {
  logStep('Updating freeze', { freeze_id });

  // Get existing freeze
  const { data: existingFreeze, error: freezeError } = await supabase
    .from('membership_freezes')
    .select('*')
    .eq('id', freeze_id)
    .single();

  if (freezeError) throw freezeError;

  // Update the freeze
  const { data: updatedFreeze, error: updateError } = await supabase
    .from('membership_freezes')
    .update({
      end_date,
      frozen_amount_cents,
      reason,
      updated_at: new Date().toISOString()
    })
    .eq('id', freeze_id)
    .select()
    .single();

  if (updateError) throw updateError;

  // If end_date changed, recalculate payment schedule
  if (existingFreeze.end_date !== end_date) {
    await recalculatePaymentSchedule(supabase, existingFreeze.membership_subscription_id);
  }

  logStep('Freeze updated successfully');

  return new Response(
    JSON.stringify({ 
      success: true, 
      freeze: updatedFreeze,
      message: 'Freeze updated with payment schedule recalculation' 
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 
    }
  );
}

async function handleDeleteFreeze({
  supabase,
  freeze_id
}) {
  logStep('Deleting freeze', { freeze_id });

  // Get freeze details before deletion
  const { data: freeze, error: freezeError } = await supabase
    .from('membership_freezes')
    .select('*')
    .eq('id', freeze_id)
    .single();

  if (freezeError) throw freezeError;

  // Mark freeze as ended
  const { error: deleteError } = await supabase
    .from('membership_freezes')
    .update({ 
      status: 'ended',
      updated_at: new Date().toISOString()
    })
    .eq('id', freeze_id);

  if (deleteError) throw deleteError;

  // Remove proportional payments that were added for this freeze
  await removeProportionalPayments(supabase, freeze.membership_subscription_id, freeze);

  logStep('Freeze deleted and proportional payments removed');

  return new Response(
    JSON.stringify({ 
      success: true,
      message: 'Freeze removed and payment schedule restored' 
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 
    }
  );
}

async function reallocateConflictingPayments(supabase, conflictingPayments, membership_subscription_id) {
  logStep('Reallocating conflicting payments', { count: conflictingPayments.length });

  for (const payment of conflictingPayments) {
    // Create a reallocation record
    await supabase
      .from('payment_reallocations')
      .insert({
        original_payment_id: payment.id,
        membership_subscription_id,
        original_date: payment.scheduled_date,
        reallocated_date: new Date().toISOString(),
        amount_cents: payment.amount_cents,
        reason: 'Conflicting freeze applied - payment reallocated for reporting',
        status: 'reallocated'
      });

    // Update the original payment status
    await supabase
      .from('payment_schedule')
      .update({
        status: 'reallocated',
        notes: 'Reallocated due to freeze conflict',
        updated_at: new Date().toISOString()
      })
      .eq('id', payment.id);
  }
}

async function addProportionalPayments(supabase, membership_subscription_id, paymentSchedule, duration, membershipPlan) {
  logStep('Adding proportional payments', { duration, membership_subscription_id });

  if (paymentSchedule.length === 0) return;

  const lastPayment = paymentSchedule[paymentSchedule.length - 1];
  const additionalPayments = [];
  
  for (let i = 1; i <= duration; i++) {
    const newDate = new Date(lastPayment.scheduled_date);
    
    // Add time based on billing frequency
    if (membershipPlan.billing_frequency === 'weekly') {
      newDate.setDate(newDate.getDate() + (7 * i));
    } else if (membershipPlan.billing_frequency === 'monthly') {
      newDate.setMonth(newDate.getMonth() + i);
    } else if (membershipPlan.billing_frequency === 'quarterly') {
      newDate.setMonth(newDate.getMonth() + (3 * i));
    } else if (membershipPlan.billing_frequency === 'annually') {
      newDate.setFullYear(newDate.getFullYear() + i);
    }
    
    additionalPayments.push({
      membership_subscription_id,
      scheduled_date: newDate.toISOString().split('T')[0],
      amount_cents: lastPayment.amount_cents,
      status: 'pending',
      installment_number: lastPayment.installment_number + i,
      total_installments: lastPayment.total_installments + duration,
      freeze_compensation: true,
      notes: 'Added to compensate for freeze period'
    });
  }

  // Update total_installments for all existing payments
  await supabase
    .from('payment_schedule')
    .update({ 
      total_installments: lastPayment.total_installments + duration 
    })
    .eq('membership_subscription_id', membership_subscription_id);

  // Insert new payments
  const { error: insertError } = await supabase
    .from('payment_schedule')
    .insert(additionalPayments);

  if (insertError) {
    logStep('Error inserting additional payments', { error: insertError });
    throw insertError;
  }
}

async function removeProportionalPayments(supabase, membership_subscription_id, freeze) {
  logStep('Removing proportional payments for deleted freeze');

  // Remove payments that were added for freeze compensation
  await supabase
    .from('payment_schedule')
    .delete()
    .eq('membership_subscription_id', membership_subscription_id)
    .eq('freeze_compensation', true)
    .eq('status', 'pending');

  // Recalculate total_installments
  await recalculatePaymentSchedule(supabase, membership_subscription_id);
}

async function recalculatePaymentSchedule(supabase, membership_subscription_id) {
  logStep('Recalculating payment schedule', { membership_subscription_id });

  const { data: payments, error } = await supabase
    .from('payment_schedule')
    .select('*')
    .eq('membership_subscription_id', membership_subscription_id)
    .neq('status', 'deleted')
    .order('scheduled_date');

  if (error) throw error;

  const totalPayments = payments.length;

  // Update all payments with correct total_installments
  for (let i = 0; i < payments.length; i++) {
    await supabase
      .from('payment_schedule')
      .update({
        installment_number: i + 1,
        total_installments: totalPayments
      })
      .eq('id', payments[i].id);
  }
}

function calculateFreezeDuration(start_date, end_date, billing_frequency) {
  if (!end_date) return 0;

  const startDate = new Date(start_date);
  const endDate = new Date(end_date);
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  
  if (billing_frequency === 'weekly') {
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
  } else if (billing_frequency === 'monthly') {
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
  } else if (billing_frequency === 'quarterly') {
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 90));
  } else if (billing_frequency === 'annually') {
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 365));
  }
  
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30)); // Default to monthly
}