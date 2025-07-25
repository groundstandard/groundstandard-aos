import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  console.log(`[CREATE-INSTALLMENT-PLAN] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { 
      total_amount, 
      installments_count, 
      frequency, 
      start_date, 
      description,
      preferred_payment_method 
    } = await req.json();

    logStep("Request received", { 
      total_amount, 
      installments_count, 
      frequency, 
      description 
    });

    // For now, just return a mock response since this is for testing
    // In a real implementation, you would create installment records in the database
    const installmentPlan = {
      id: `plan_${Date.now()}`,
      total_amount,
      installments_count,
      frequency,
      start_date,
      description,
      preferred_payment_method,
      installment_amount: Math.round(total_amount / installments_count),
      status: "pending",
      created_at: new Date().toISOString()
    };

    logStep("Installment plan created", installmentPlan);

    return new Response(JSON.stringify({ 
      success: true,
      installment_plan: installmentPlan 
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