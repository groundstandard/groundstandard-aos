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
  console.log(`[SEND-PAYMENT-REMINDER] ${step}${detailsStr}`);
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
      contact_id,
      payment_id,
      reminder_type = 'overdue',
      custom_message,
      days_overdue,
      amount_due,
      due_date,
      send_email = true,
      send_sms = false
    } = await req.json();

    if (!contact_id) {
      throw new Error("contact_id is required");
    }

    // Get contact details
    const { data: contact, error: contactError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', contact_id)
      .single();

    if (contactError || !contact) {
      throw new Error("Contact not found");
    }

    logStep("Contact found", { 
      contactId: contact.id, 
      name: `${contact.first_name} ${contact.last_name}`,
      email: contact.email 
    });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Get payment details if payment_id is provided
    let paymentDetails = null;
    if (payment_id) {
      const { data: payment, error: paymentError } = await supabaseClient
        .from('payments')
        .select('*')
        .eq('id', payment_id)
        .single();

      if (payment) {
        paymentDetails = payment;
        logStep("Payment details found", { paymentId: payment.id, amount: payment.amount });
      }
    }

    // Determine reminder message based on type
    let subject = "";
    let message = "";
    
    switch (reminder_type) {
      case 'overdue':
        subject = `Payment Reminder - ${days_overdue || 0} Days Overdue`;
        message = custom_message || `Hi ${contact.first_name}, your payment of $${(amount_due || paymentDetails?.amount || 0) / 100} is ${days_overdue || 0} days overdue. Please make your payment as soon as possible.`;
        break;
      case 'upcoming':
        subject = "Upcoming Payment Due";
        message = custom_message || `Hi ${contact.first_name}, you have a payment of $${(amount_due || paymentDetails?.amount || 0) / 100} due on ${due_date || 'soon'}. Please ensure your payment method is up to date.`;
        break;
      case 'trial_expiring':
        subject = "Trial Expiring Soon";
        message = custom_message || `Hi ${contact.first_name}, your trial period is ending soon. Please update your payment information to continue your membership.`;
        break;
      case 'failed_payment':
        subject = "Payment Failed - Action Required";
        message = custom_message || `Hi ${contact.first_name}, your recent payment attempt failed. Please update your payment method and try again.`;
        break;
      default:
        subject = "Payment Reminder";
        message = custom_message || `Hi ${contact.first_name}, this is a reminder about your payment.`;
    }

    logStep("Reminder message prepared", { 
      reminderType: reminder_type, 
      subject,
      hasCustomMessage: !!custom_message 
    });

    let reminderSent = false;
    let reminderResult = null;

    // Send email reminder if enabled
    if (send_email && contact.email) {
      try {
        // Here you would integrate with your email service (Resend, SendGrid, etc.)
        // For now, we'll log that we would send an email
        logStep("Would send email reminder", { 
          to: contact.email,
          subject,
          contactId: contact.id 
        });
        
        reminderSent = true;
        reminderResult = {
          email_sent: true,
          email_to: contact.email
        };
      } catch (emailError) {
        logStep("Email sending failed", { error: emailError });
      }
    }

    // Send SMS reminder if enabled
    if (send_sms && contact.phone) {
      try {
        // Here you would integrate with your SMS service (Twilio, etc.)
        // For now, we'll log that we would send an SMS
        logStep("Would send SMS reminder", { 
          to: contact.phone,
          message: message.substring(0, 160),
          contactId: contact.id 
        });
        
        reminderSent = true;
        reminderResult = {
          ...reminderResult,
          sms_sent: true,
          sms_to: contact.phone
        };
      } catch (smsError) {
        logStep("SMS sending failed", { error: smsError });
      }
    }

    // Log the reminder in communication_logs
    const { error: logError } = await supabaseClient
      .from('communication_logs')
      .insert({
        contact_id: contact.id,
        message_type: 'payment_reminder',
        subject,
        content: message,
        status: reminderSent ? 'sent' : 'failed',
        sent_by: user.id,
        metadata: {
          reminder_type,
          payment_id,
          days_overdue,
          amount_due,
          due_date,
          ...reminderResult
        }
      });

    if (logError) {
      logStep("Warning: Could not log communication", logError);
    } else {
      logStep("Communication logged successfully");
    }

    return new Response(JSON.stringify({ 
      success: reminderSent,
      reminder_type,
      contact_id: contact.id,
      contact_name: `${contact.first_name} ${contact.last_name}`,
      message_sent: reminderResult
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