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
  console.log(`[CREATE-INVOICE] ${step}${detailsStr}`);
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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { 
      student_id,
      amount_cents,
      description,
      due_date,
      items = [],
      auto_send = false,
      metadata = {}
    } = await req.json();

    if (!student_id || !amount_cents || !description) {
      throw new Error("student_id, amount_cents, and description are required");
    }

    // Get student details
    const { data: student, error: studentError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', student_id)
      .single();

    if (studentError || !student) {
      throw new Error("Student not found");
    }

    logStep("Student found", { 
      studentId: student.id, 
      name: `${student.first_name} ${student.last_name}`,
      email: student.email 
    });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Find or create Stripe customer for the student
    let customerId;
    const customers = await stripe.customers.list({ 
      email: student.email, 
      limit: 1 
    });
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing Stripe customer", { customerId });
    } else {
      // Create new customer
      const customer = await stripe.customers.create({
        email: student.email,
        name: `${student.first_name} ${student.last_name}`,
        metadata: {
          user_id: student.id,
          created_by: 'create-invoice-function'
        }
      });
      customerId = customer.id;
      logStep("Created new Stripe customer", { customerId });
    }

    // Create invoice
    const invoice = await stripe.invoices.create({
      customer: customerId,
      auto_advance: auto_send,
      collection_method: 'send_invoice',
      days_until_due: due_date ? Math.ceil((new Date(due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 30,
      description,
      metadata: {
        user_id: user.id,
        student_id: student.id,
        created_by: 'create-invoice-function',
        ...metadata
      }
    });

    logStep("Invoice created", { invoiceId: invoice.id });

    // Add invoice items
    if (items.length > 0) {
      for (const item of items) {
        await stripe.invoiceItems.create({
          customer: customerId,
          invoice: invoice.id,
          amount: item.amount_cents || amount_cents,
          currency: 'usd',
          description: item.description || description,
          metadata: item.metadata || {}
        });
      }
      logStep("Added invoice items", { itemCount: items.length });
    } else {
      // Add default invoice item
      await stripe.invoiceItems.create({
        customer: customerId,
        invoice: invoice.id,
        amount: amount_cents,
        currency: 'usd',
        description,
      });
      logStep("Added default invoice item");
    }

    // Finalize the invoice
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);
    logStep("Invoice finalized", { status: finalizedInvoice.status });

    // Send invoice if auto_send is enabled
    if (auto_send) {
      await stripe.invoices.sendInvoice(invoice.id);
      logStep("Invoice sent to customer");
    }

    // Save invoice to database
    const { error: insertError } = await supabaseClient
      .from('invoices')
      .insert({
        student_id: student.id,
        amount_cents,
        description,
        due_date: due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: finalizedInvoice.status,
        stripe_invoice_id: invoice.id,
        stripe_invoice_url: finalizedInvoice.hosted_invoice_url,
        created_by: user.id,
        metadata
      });

    if (insertError) {
      logStep("Warning: Could not save invoice to database", insertError);
    } else {
      logStep("Saved invoice to database");
    }

    return new Response(JSON.stringify({ 
      invoice_id: invoice.id,
      invoice_url: finalizedInvoice.hosted_invoice_url,
      status: finalizedInvoice.status,
      amount_due: finalizedInvoice.amount_due
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