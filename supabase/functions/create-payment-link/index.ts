import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-PAYMENT-LINK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header provided');
    
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user) throw new Error('User not authenticated');
    logStep("User authenticated", { userId: user.id });

    // Verify admin role
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'owner'].includes(profile.role)) {
      throw new Error('Insufficient permissions');
    }
    logStep("Admin permissions verified");

    const { student_id, amount, description, expires_in_hours } = await req.json();
    logStep("Request data parsed", { student_id, amount, description, expires_in_hours });

    if (!student_id || !amount) {
      throw new Error('Missing required fields: student_id and amount');
    }

    // Get student details
    const { data: student, error: studentError } = await supabaseClient
      .from('profiles')
      .select('first_name, last_name, email')
      .eq('id', student_id)
      .single();

    if (studentError || !student) {
      throw new Error('Student not found');
    }
    logStep("Student found", { studentEmail: student.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Check if customer exists
    const customers = await stripe.customers.list({ 
      email: student.email, 
      limit: 1 
    });
    
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    } else {
      const customer = await stripe.customers.create({
        email: student.email,
        name: `${student.first_name} ${student.last_name}`,
      });
      customerId = customer.id;
      logStep("New customer created", { customerId });
    }

    // Create payment link
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: description || 'Payment',
            },
            unit_amount: Math.round(parseFloat(amount) * 100),
          },
          quantity: 1,
        },
      ],
      after_completion: {
        type: 'redirect',
        redirect: {
          url: `${req.headers.get('origin') || 'https://app.groundstandard.com'}/payments?success=true`,
        },
      },
      expires_at: Math.floor((Date.now() + (parseInt(expires_in_hours) * 60 * 60 * 1000)) / 1000),
    });

    logStep("Payment link created", { paymentLinkId: paymentLink.id, url: paymentLink.url });

    // Store payment link in database
    const { error: insertError } = await supabaseClient
      .from('payment_links')
      .insert({
        student_id,
        stripe_payment_link_id: paymentLink.id,
        amount: Math.round(parseFloat(amount) * 100),
        description: description || 'Payment',
        expires_at: new Date(paymentLink.expires_at * 1000).toISOString(),
        url: paymentLink.url,
        created_by: user.id,
        status: 'active'
      });

    if (insertError) {
      logStep("Database insert error", { error: insertError });
      // Don't throw - payment link is created, just log the error
    } else {
      logStep("Payment link stored in database");
    }

    return new Response(JSON.stringify({
      success: true,
      url: paymentLink.url,
      expires_at: paymentLink.expires_at,
      payment_link_id: paymentLink.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});