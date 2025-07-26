import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHARGE-STORED-PAYMENT] ${step}${detailsStr}`);
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

    const { 
      contact_id, 
      amount_cents, 
      description, 
      membership_subscription_id,
      setup_fee_cents = 0 
    } = await req.json();

    logStep("Request data", { 
      contact_id, 
      amount_cents, 
      description, 
      membership_subscription_id,
      setup_fee_cents 
    });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Get contact details with academy and family information
    const { data: contact, error: contactError } = await supabaseServiceClient
      .from('profiles')
      .select(`
        id,
        email, 
        first_name, 
        last_name,
        parent_id,
        academy_id,
        academies:academy_id(
          stripe_connect_account_id,
          stripe_charges_enabled
        )
      `)
      .eq('id', contact_id)
      .single();

    if (contactError || !contact) {
      throw new Error("Contact not found");
    }

    logStep("Contact found", { 
      contactEmail: contact.email,
      hasParent: !!contact.parent_id,
      hasConnectAccount: !!contact?.academies?.stripe_connect_account_id 
    });

    // Use Connect account if available, otherwise main account
    const stripeConfig = contact?.academies?.stripe_connect_account_id 
      ? { stripeAccount: contact.academies.stripe_connect_account_id }
      : {};

    // Function to find stored payment methods for a contact
    const findStoredPaymentMethods = async (searchContactId: string) => {
      const { data: searchContact } = await supabaseServiceClient
        .from('profiles')
        .select('email')
        .eq('id', searchContactId)
        .single();

      if (!searchContact) return null;

      const customerListOptions = { 
        email: searchContact.email, 
        limit: 1,
        ...stripeConfig
      };
      const customers = await stripe.customers.list(customerListOptions);
      
      if (customers.data.length === 0) return null;

      const customer = customers.data[0];
      const paymentMethodsOptions = {
        customer: customer.id,
        type: 'card',
        ...stripeConfig
      };
      const paymentMethods = await stripe.paymentMethods.list(paymentMethodsOptions);
      
      return {
        customer,
        paymentMethods: paymentMethods.data
      };
    };

    // Try to find payment method for the contact first
    let paymentData = await findStoredPaymentMethods(contact.id);
    let billingContact = contact;

    // If no payment method found and contact has a parent, try parent's payment methods
    if ((!paymentData || paymentData.paymentMethods.length === 0) && contact.parent_id) {
      logStep("No payment method found for contact, checking parent");
      
      const { data: parentContact } = await supabaseServiceClient
        .from('profiles')
        .select('id, email, first_name, last_name')
        .eq('id', contact.parent_id)
        .single();

      if (parentContact) {
        paymentData = await findStoredPaymentMethods(parentContact.id);
        if (paymentData && paymentData.paymentMethods.length > 0) {
          billingContact = parentContact;
          logStep("Using parent's payment method", { parentId: parentContact.id });
        }
      }
    }

    // If still no payment method found, return error indicating need to add payment method
    if (!paymentData || paymentData.paymentMethods.length === 0) {
      logStep("No stored payment methods found");
      return new Response(JSON.stringify({ 
        error: "No stored payment method found",
        requires_payment_setup: true,
        contact_id: contact.id
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 402, // Payment Required
      });
    }

    // Use the first (most recently added) payment method
    const paymentMethod = paymentData.paymentMethods[0];
    const customer = paymentData.customer;

    logStep("Found payment method", { 
      paymentMethodId: paymentMethod.id,
      customerId: customer.id,
      last4: paymentMethod.card?.last4 
    });

    // Calculate total amount (including setup fee)
    const totalAmount = amount_cents + setup_fee_cents;

    // Create PaymentIntent with the stored payment method
    const paymentIntentOptions = {
      amount: totalAmount,
      currency: 'usd',
      customer: customer.id,
      payment_method: paymentMethod.id,
      description: description,
      confirm: true,
      off_session: true, // Indicates this is for a saved payment method
      metadata: {
        contact_id: contact.id,
        billing_contact_id: billingContact.id,
        membership_subscription_id: membership_subscription_id || '',
        setup_fee_cents: setup_fee_cents.toString()
      },
      ...stripeConfig
    };

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentOptions);

    logStep("PaymentIntent created", { 
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount
    });

    // Record the payment in our database
    const { error: paymentError } = await supabaseServiceClient
      .from('payments')
      .insert({
        student_id: contact.id,
        amount: totalAmount / 100, // Convert cents to dollars
        payment_method: `${paymentMethod.card?.brand} ****${paymentMethod.card?.last4}`,
        description: description,
        status: paymentIntent.status === 'succeeded' ? 'completed' : 'pending',
        payment_date: new Date().toISOString(),
        stripe_invoice_id: paymentIntent.id,
        payment_method_type: 'card'
      });

    if (paymentError) {
      logStep("Error recording payment", { error: paymentError });
    }

    // If this is for a membership, create billing cycle record
    if (membership_subscription_id) {
      const { error: billingError } = await supabaseServiceClient
        .from('billing_cycles')
        .insert({
          membership_subscription_id: membership_subscription_id,
          cycle_start_date: new Date().toISOString().split('T')[0],
          cycle_end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
          amount_cents: amount_cents,
          total_amount_cents: totalAmount,
          due_date: new Date().toISOString().split('T')[0],
          paid_date: paymentIntent.status === 'succeeded' ? new Date().toISOString().split('T')[0] : null,
          status: paymentIntent.status === 'succeeded' ? 'paid' : 'pending',
          payment_method: 'card'
        });

      if (billingError) {
        logStep("Error creating billing cycle", { error: billingError });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      payment_intent_id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      payment_method_last4: paymentMethod.card?.last4,
      billing_contact: {
        id: billingContact.id,
        name: `${billingContact.first_name} ${billingContact.last_name}`,
        email: billingContact.email
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    // If it's a Stripe authentication required error, we need to handle 3D Secure
    if (errorMessage.includes('authentication_required')) {
      return new Response(JSON.stringify({ 
        error: "Payment requires authentication",
        requires_action: true,
        message: "This payment requires additional authentication. Please use a different payment method or contact support."
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 402,
      });
    }

    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});