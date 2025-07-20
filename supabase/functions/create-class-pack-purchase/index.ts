import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CLASS-PACK-PURCHASE] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    // Use service role for database operations
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get authenticated user for auth operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { planId, contactId, isRenewal = false, originalPackId = null } = await req.json();
    logStep("Request data", { planId, contactId, isRenewal, originalPackId });

    // Fetch plan details
    const { data: plan, error: planError } = await supabaseService
      .from('membership_plans')
      .select('*')
      .eq('id', planId)
      .eq('is_class_pack', true)
      .single();

    if (planError) throw new Error(`Class pack plan not found: ${planError.message}`);
    logStep("Plan found", { planId: plan.id, name: plan.name, classPackSize: plan.class_pack_size });

    if (!plan.class_pack_size || !plan.pack_expiry_days) {
      throw new Error("Invalid class pack plan - missing pack size or expiry days");
    }

    // Get or create Stripe customer
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing Stripe customer", { customerId });
    } else {
      const customer = await stripe.customers.create({ email: user.email });
      customerId = customer.id;
      logStep("Created new Stripe customer", { customerId });
    }

    // Calculate expiry date
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + plan.pack_expiry_days);

    // Get discount if renewal
    let discountPercent = 0;
    if (isRenewal && originalPackId) {
      const { data: originalPack } = await supabaseService
        .from('class_packs')
        .select('renewal_discount_percentage')
        .eq('id', originalPackId)
        .single();
      
      if (originalPack?.renewal_discount_percentage) {
        discountPercent = originalPack.renewal_discount_percentage;
      }
    }

    // Calculate price with discount
    let finalPrice = plan.base_price_cents;
    if (discountPercent > 0) {
      const discountAmount = Math.floor(finalPrice * (discountPercent / 100));
      finalPrice = finalPrice - discountAmount;
      logStep("Applied renewal discount", { 
        originalPrice: plan.base_price_cents, 
        discountPercent, 
        finalPrice 
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${plan.name} - ${plan.class_pack_size} Classes`,
              description: `Class pack expires on ${expiryDate.toLocaleDateString()}${discountPercent > 0 ? ` (${discountPercent}% renewal discount applied)` : ''}`,
            },
            unit_amount: finalPrice,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get("origin")}/contacts/${contactId}?pack_purchase=success`,
      cancel_url: `${req.headers.get("origin")}/contacts/${contactId}?pack_purchase=cancelled`,
      metadata: {
        plan_id: planId,
        contact_id: contactId,
        is_renewal: isRenewal.toString(),
        original_pack_id: originalPackId || '',
        class_pack_size: plan.class_pack_size.toString(),
        expiry_days: plan.pack_expiry_days.toString(),
        purchase_type: 'class_pack'
      }
    });

    logStep("Created Stripe checkout session", { sessionId: session.id, url: session.url });

    // Pre-create the class pack record (will be activated on successful payment)
    const { data: newPack, error: packError } = await supabaseService
      .from('class_packs')
      .insert({
        profile_id: contactId,
        membership_plan_id: planId,
        total_classes: plan.class_pack_size,
        remaining_classes: plan.class_pack_size,
        expiry_date: expiryDate.toISOString().split('T')[0],
        status: 'pending_payment',
        auto_renewal: isRenewal, // Keep auto-renewal setting from original pack
        renewal_discount_percentage: discountPercent,
        notes: `Class pack purchased via Stripe session ${session.id}${isRenewal ? ' (renewal)' : ''}`
      })
      .select()
      .single();

    if (packError) {
      logStep("Error creating class pack record", { error: packError.message });
    } else {
      logStep("Created pending class pack record", { packId: newPack.id });
    }

    return new Response(JSON.stringify({ 
      url: session.url,
      sessionId: session.id,
      packId: newPack?.id,
      expiryDate: expiryDate.toISOString().split('T')[0],
      discountApplied: discountPercent
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in class pack purchase", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});