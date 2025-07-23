import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get user if authenticated
    let userId = null;
    let userEmail = null;
    
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: userData } = await supabaseClient.auth.getUser(token);
      if (userData.user) {
        userId = userData.user.id;
        userEmail = userData.user.email;
        logStep("User authenticated", { userId, email: userEmail });
      }
    }

    const { 
      amount, 
      description, 
      metadata = {},
      success_url,
      cancel_url,
      payment_method_types = ['card']
    } = await req.json();

    if (!amount || !description) {
      throw new Error("Amount and description are required");
    }

    logStep("Creating payment link", { amount, description });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Create payment link
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: description,
            },
            unit_amount: amount, // amount in cents
          },
          quantity: 1,
        },
      ],
      payment_method_types,
      metadata: {
        ...metadata,
        user_id: userId || 'anonymous',
        created_by: 'payment-link-function'
      },
      after_completion: {
        type: 'redirect',
        redirect: {
          url: success_url || `${req.headers.get("origin")}/payment-success`
        }
      }
    });

    logStep("Payment link created", { 
      paymentLinkId: paymentLink.id, 
      url: paymentLink.url 
    });

    // Save payment link to database
    if (userId) {
      const { error: insertError } = await supabaseClient
        .from('payment_links')
        .insert({
          user_id: userId,
          stripe_payment_link_id: paymentLink.id,
          amount,
          description,
          status: 'active',
          url: paymentLink.url,
          metadata
        });

      if (insertError) {
        logStep("Warning: Could not save to database", insertError);
      } else {
        logStep("Saved payment link to database");
      }
    }

    return new Response(JSON.stringify({ 
      payment_link: paymentLink.url,
      payment_link_id: paymentLink.id 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});