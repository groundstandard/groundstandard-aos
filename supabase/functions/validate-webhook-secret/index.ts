import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VALIDATE-WEBHOOK-SECRET] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Get the webhook secret from environment
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    
    logStep("Checking environment variables", { 
      hasWebhookSecret: !!webhookSecret,
      hasStripeKey: !!stripeSecretKey 
    });

    // For configuration requests, accept and validate the webhook secret
    if (req.method === 'POST') {
      logStep("Processing POST request");
      
      let requestBody;
      try {
        const bodyText = await req.text();
        logStep("Request body received", { bodyLength: bodyText.length });
        
        if (!bodyText.trim()) {
          throw new Error("Empty request body");
        }
        
        requestBody = JSON.parse(bodyText);
        logStep("JSON parsed successfully", { keys: Object.keys(requestBody) });
      } catch (parseError) {
        logStep("JSON parsing failed", { error: parseError instanceof Error ? parseError.message : String(parseError) });
        return new Response(JSON.stringify({ 
          error: "Invalid JSON in request body" 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }
      
      const { webhook_secret } = requestBody;
      
      if (!webhook_secret || !webhook_secret.startsWith('whsec_')) {
        logStep("Invalid webhook secret format");
        return new Response(JSON.stringify({ 
          error: "Invalid webhook secret format. Must start with 'whsec_'" 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }

      logStep("Webhook secret validation successful");
      return new Response(JSON.stringify({ 
        configured: true,
        message: "Webhook secret is valid"
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // For GET requests, check current configuration status
    const configured = !!(webhookSecret && stripeSecretKey);
    
    logStep("Configuration status check", { configured });

    return new Response(JSON.stringify({
      configured,
      webhook_secret_set: !!webhookSecret,
      stripe_key_set: !!stripeSecretKey,
      message: configured 
        ? "Webhook configuration is complete" 
        : "Webhook secret or Stripe key not configured"
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in validate-webhook-secret", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      configured: false 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});