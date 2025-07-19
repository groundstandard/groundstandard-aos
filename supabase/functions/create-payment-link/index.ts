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
    const { amount, currency = "usd", description, student_id, expires_in_hours = 24 } = await req.json();

    if (!amount || !description || !student_id) {
      throw new Error("Missing required fields: amount, description, student_id");
    }

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

    // Get student details
    const { data: student, error: studentError } = await supabaseClient
      .from('profiles')
      .select('first_name, last_name, email')
      .eq('id', student_id)
      .single();

    if (studentError || !student) {
      throw new Error("Student not found");
    }

    // Create Stripe payment link
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: description,
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      expires_at: Math.floor(Date.now() / 1000) + (expires_in_hours * 60 * 60),
      metadata: {
        student_id,
        description,
      },
    });

    // Store payment link in database
    const { data: paymentLinkRecord, error: insertError } = await supabaseClient
      .from('payment_links')
      .insert({
        student_id,
        amount: Math.round(amount * 100),
        currency,
        description,
        stripe_payment_link_id: paymentLink.id,
        link_url: paymentLink.url,
        expires_at: new Date(paymentLink.expires_at * 1000).toISOString(),
        created_by: student_id, // In a real app, this would be the admin creating the link
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting payment link:", insertError);
    }

    return new Response(JSON.stringify({
      payment_link_id: paymentLinkRecord?.id,
      stripe_payment_link_id: paymentLink.id,
      url: paymentLink.url,
      expires_at: paymentLink.expires_at,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error creating payment link:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});