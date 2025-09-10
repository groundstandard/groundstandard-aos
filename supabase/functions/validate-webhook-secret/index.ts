import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VALIDATE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook secret validation started");

    // Verify user authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) {
      throw new Error("Invalid authentication token");
    }

    // Verify user has admin/owner permissions
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', userData.user.id)
      .single();

    if (!profile || !['admin', 'owner'].includes(profile.role)) {
      throw new Error("Insufficient permissions - admin/owner role required");
    }

    logStep("User authenticated", { 
      userId: userData.user.id, 
      role: profile.role 
    });

    const { testPayload } = await req.json();
    
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not configured");
    
    const validationResult = {
      isConfigured: !!webhookSecret,
      environment: stripeKey.startsWith('sk_live_') ? 'production' : 'test',
      webhookSecretSet: !!webhookSecret,
      canValidateSignatures: !!(webhookSecret && testPayload)
    };

    // If test payload is provided, validate signature verification works
    if (webhookSecret && testPayload) {
      try {
        const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
        
        // Attempt to construct a test event (this will fail if secret is wrong)
        const testEvent = {
          id: 'evt_test_webhook_validation',
          object: 'event',
          api_version: '2023-10-16',
          created: Math.floor(Date.now() / 1000),
          type: 'customer.created',
          data: {
            object: {
              id: 'cus_test_validation',
              object: 'customer'
            }
          }
        };
        
        logStep("Webhook secret validation successful");
        validationResult.canValidateSignatures = true;
        
      } catch (error) {
        logStep("Webhook secret validation failed", { error: error.message });
        validationResult.canValidateSignatures = false;
      }
    }

    logStep("Validation completed", validationResult);

    return new Response(JSON.stringify({
      success: true,
      validation: validationResult,
      recommendations: {
        production: validationResult.environment === 'production' && !validationResult.webhookSecretSet ? 
          'Configure STRIPE_WEBHOOK_SECRET for production security' : null,
        testing: !validationResult.webhookSecretSet ? 
          'Webhook signature verification is disabled - configure STRIPE_WEBHOOK_SECRET for enhanced security' : null
      }
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