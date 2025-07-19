import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-INVOICE] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const { studentId, lineItems, dueDate, notes } = await req.json();
    
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");

    // Check if user is admin
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      throw new Error("Only administrators can create invoices");
    }

    // Get student details
    const { data: student, error: studentError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', studentId)
      .single();

    if (studentError || !student) throw new Error("Student not found");
    logStep("Found student", { studentId, email: student.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Get or create Stripe customer for student
    const customers = await stripe.customers.list({ email: student.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: student.email,
        name: `${student.first_name} ${student.last_name}`,
        metadata: { userId: student.id }
      });
      customerId = customer.id;
    }

    // Calculate total amount
    const totalAmount = lineItems.reduce((sum: number, item: any) => sum + (item.amount * item.quantity), 0);

    // Create Stripe invoice
    const stripeInvoice = await stripe.invoices.create({
      customer: customerId,
      collection_method: 'send_invoice',
      days_until_due: dueDate ? Math.ceil((new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 30,
      metadata: {
        created_by: user.id,
        student_id: studentId
      }
    });

    // Add line items to Stripe invoice
    for (const item of lineItems) {
      await stripe.invoiceItems.create({
        customer: customerId,
        invoice: stripeInvoice.id,
        amount: item.amount * item.quantity,
        currency: 'usd',
        description: item.description
      });
    }

    // Finalize the invoice
    await stripe.invoices.finalizeInvoice(stripeInvoice.id);

    // Create invoice in our database
    const { data: invoice, error: invoiceError } = await supabaseClient
      .from('invoices')
      .insert({
        user_id: studentId,
        amount: totalAmount,
        status: 'sent',
        due_date: dueDate,
        stripe_invoice_id: stripeInvoice.id,
        line_items: lineItems,
        notes
      })
      .select()
      .single();

    if (invoiceError) throw new Error(`Failed to create invoice: ${invoiceError.message}`);

    logStep("Invoice created successfully", { invoiceId: invoice.id, stripeInvoiceId: stripeInvoice.id });

    return new Response(JSON.stringify({ 
      invoice,
      stripe_url: stripeInvoice.hosted_invoice_url 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-invoice", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});