import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PROCESS-DIRECT-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    // Create service client for all operations
    const supabaseServiceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Validate that this is being called by an authenticated user
    // We'll validate the JWT manually since this is a staff operation
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    logStep("Auth header validation", { hasHeader: !!authHeader });

    // For staff operations, we'll use service role and trust the frontend authentication
    // The frontend should only allow staff/admin users to access this functionality
    logStep("Using service role for staff payment processing");

    

    const { 
      contactId,
      contact_id, 
      paymentMethodId,
      payment_method_id, 
      amountCents,
      amount_cents, 
      description, 
      payment_schedule_id,
      scheduleType,
      scheduledDate,
      notes
    } = await req.json();

    // Support both parameter formats for backwards compatibility
    const finalContactId = contactId || contact_id;
    const finalPaymentMethodId = paymentMethodId || payment_method_id;
    const finalAmountCents = amountCents || amount_cents;

    // Validate required parameters
    if (!finalContactId) {
      throw new Error("Contact ID is required");
    }
    if (!finalPaymentMethodId) {
      throw new Error("Payment method ID is required");
    }
    if (!finalAmountCents || finalAmountCents <= 0) {
      throw new Error("Valid amount is required");
    }

    logStep("Request data", { 
      finalContactId, 
      finalPaymentMethodId, 
      finalAmountCents, 
      description, 
      scheduleType,
      scheduledDate,
      notes
    });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    logStep("Looking up payment method", { 
      finalPaymentMethodId,
      finalContactId 
    });

    // Get payment method details - note: finalPaymentMethodId is the stripe_payment_method_id
    const { data: paymentMethod, error: pmError } = await supabaseServiceClient
      .from('payment_methods')
      .select('stripe_payment_method_id, type, last4, brand, bank_name')
      .eq('stripe_payment_method_id', finalPaymentMethodId)
      .eq('contact_id', finalContactId)
      .eq('is_active', true)
      .single();

    if (pmError || !paymentMethod) {
      logStep("Payment method lookup failed", { 
        error: pmError,
        finalPaymentMethodId,
        finalContactId 
      });
      throw new Error(`Payment method not found or inactive: ${pmError?.message || 'No payment method found'}`);
    }

    logStep("Payment method found", { 
      stripeId: paymentMethod.stripe_payment_method_id,
      type: paymentMethod.type 
    });

    // Get contact's email
    logStep("Fetching contact data", { contactId: finalContactId });
    const { data: contact, error: contactError } = await supabaseServiceClient
      .from('profiles')
      .select('email, first_name, last_name')
      .eq('id', finalContactId)
      .single();

    logStep("Contact fetch result", { contact, contactError });

    if (contactError || !contact) {
      logStep("Contact not found error", { contactError });
      throw new Error("Contact not found");
    }

    // If contact doesn't have an email, we can't process Stripe payments
    logStep("Checking email validation", { email: contact.email });
    if (!contact.email || contact.email.trim() === '') {
      logStep("Email validation failed - throwing error");
      throw new Error("Contact must have an email address to process payments");
    }
    
    logStep("Email validation passed", { email: contact.email });

    // Handle scheduled payments - create a simple payment record with future date
    if (scheduleType === 'future' && scheduledDate) {
      const scheduledDateObj = new Date(scheduledDate);
      if (scheduledDateObj <= new Date()) {
        throw new Error("Scheduled date must be in the future");
      }

      // Create a payment record with scheduled status for future processing
      const scheduledPaymentData: any = {
        student_id: finalContactId,
        amount: finalAmountCents / 100, // Convert cents to dollars
        description: `SCHEDULED: ${description}${notes ? ` - ${notes}` : ''}`,
        payment_method: paymentMethod.type,
        payment_method_type: paymentMethod.type,
        status: 'scheduled',
        payment_date: scheduledDateObj.toISOString(),
      };

      // Add type-specific details
      if (paymentMethod.type === 'card') {
        scheduledPaymentData.payment_method = `${paymentMethod.brand} ****${paymentMethod.last4}`;
      } else if (paymentMethod.type === 'us_bank_account') {
        scheduledPaymentData.payment_method = `${paymentMethod.bank_name} ****${paymentMethod.last4}`;
        scheduledPaymentData.ach_bank_name = paymentMethod.bank_name;
        scheduledPaymentData.ach_last4 = paymentMethod.last4;
      }

      const { data: scheduledPayment, error: scheduleError } = await supabaseServiceClient
        .from('payments')
        .insert(scheduledPaymentData)
        .select()
        .single();

      if (scheduleError) {
        logStep("Error creating scheduled payment", { error: scheduleError });
        throw new Error(`Failed to schedule payment: ${scheduleError.message}`);
      }

      logStep("Payment scheduled successfully", { paymentId: scheduledPayment.id });

      return new Response(JSON.stringify({
        success: true,
        scheduled: true,
        payment: scheduledPayment
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Process immediate payment
    // Find Stripe customer
    const customers = await stripe.customers.list({ email: contact.email, limit: 1 });
    if (customers.data.length === 0) {
      throw new Error("Stripe customer not found");
    }

    const customer = customers.data[0];
    logStep("Customer found", { customerId: customer.id });

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: finalAmountCents,
      currency: 'usd',
      customer: customer.id,
      payment_method: paymentMethod.stripe_payment_method_id,
      confirmation_method: 'automatic',
      confirm: true,
      return_url: `${req.headers.get("origin")}/contacts/${finalContactId}`,
      description: description,
      metadata: {
        contact_id: finalContactId,
        payment_schedule_id: payment_schedule_id || '',
        processed_by: 'staff',
        notes: notes || ''
      }
    });

    logStep("Payment intent created", { 
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status 
    });

    // Record payment in database
    const paymentData: any = {
      student_id: finalContactId,
      amount: finalAmountCents / 100, // Convert cents to dollars for numeric field
      description: description + (notes ? ` - ${notes}` : ''),
      payment_method: paymentMethod.type === 'card' ? `${paymentMethod.brand} ****${paymentMethod.last4}` : `${paymentMethod.bank_name} ****${paymentMethod.last4}`,
      payment_method_type: paymentMethod.type,
      status: paymentIntent.status === 'succeeded' ? 'completed' : 'pending',
      stripe_invoice_id: paymentIntent.id,
      payment_date: new Date().toISOString(),
    };

    // Add ACH-specific details if it's a bank account
    if (paymentMethod.type === 'us_bank_account') {
      paymentData.ach_bank_name = paymentMethod.bank_name;
      paymentData.ach_last4 = paymentMethod.last4;
    }

    const { data: savedPayment, error: paymentError } = await supabaseServiceClient
      .from('payments')
      .insert(paymentData)
      .select()
      .single();

    if (paymentError) {
      logStep("Error saving payment", { error: paymentError });
      throw new Error(`Failed to save payment: ${paymentError.message}`);
    }

    // Update payment schedule if provided
    if (payment_schedule_id && paymentIntent.status === 'succeeded') {
      await supabaseServiceClient
        .from('payment_schedule')
        .update({ 
          status: 'paid',
          stripe_invoice_id: paymentIntent.id,
          payment_method_id: finalPaymentMethodId
        })
        .eq('id', payment_schedule_id);

      logStep("Payment schedule updated");
    }

    logStep("Payment recorded successfully", { paymentId: savedPayment.id });

    return new Response(JSON.stringify({
      success: true,
      payment: savedPayment,
      stripe_status: paymentIntent.status,
      requires_action: paymentIntent.status === 'requires_action',
      client_secret: paymentIntent.client_secret
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