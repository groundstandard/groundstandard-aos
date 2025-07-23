import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contact_id, payment_due_date, amount, reminder_type, message, type, contactId, data } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Handle both API call types - direct payment reminder or notification service
    const finalContactId = contact_id || contactId;
    const finalType = type || 'payment_reminder';
    
    if (!finalContactId) {
      throw new Error("Contact ID is required");
    }

    // Get contact information
    const { data: contact } = await supabase
      .from("profiles")
      .select("email, first_name, last_name")
      .eq("id", finalContactId)
      .single();

    if (!contact) {
      throw new Error("Contact not found");
    }

    let emailContent = "";
    let subject = "";

    switch (finalType) {
      case "payment_failed":
        subject = "Payment Failed - Action Required";
        emailContent = generatePaymentFailedEmail(contact, data);
        break;
      
      case "payment_succeeded":
        subject = "Payment Received - Thank You!";
        emailContent = generatePaymentSuccessEmail(contact, data);
        break;
      
      case "subscription_canceled":
        subject = "Subscription Canceled";
        emailContent = generateSubscriptionCanceledEmail(contact, data);
        break;
      
      case "trial_expiring":
        subject = "Your Trial is Expiring Soon";
        emailContent = generateTrialExpiringEmail(contact, data);
        break;
      
      case "late_fee_applied":
        subject = "Late Fee Applied to Your Account";
        emailContent = generateLateFeeEmail(contact, data);
        break;
      
      case "payment_reminder":
        subject = "Payment Reminder";
        emailContent = generatePaymentReminderEmail(contact, { 
          amount: amount ? parseFloat(amount) * 100 : (data?.amount || 5000),
          due_date: payment_due_date || data?.due_date,
          description: message || data?.description || 'Payment due',
          ...data 
        });
        break;
      
      default:
        throw new Error(`Unknown notification type: ${finalType}`);
    }

    // Send email if Resend is configured
    let emailId = null;
    if (Deno.env.get("RESEND_API_KEY")) {
      const emailResponse = await resend.emails.send({
        from: "Academy Billing <billing@resend.dev>",
        to: [contact.email],
        subject: subject,
        html: emailContent,
      });
      emailId = emailResponse.data?.id;
    }

    // Log the communication
    await supabase
      .from("communication_logs")
      .insert({
        contact_id: finalContactId,
        message_type: "email",
        subject: subject,
        content: emailContent,
        status: "sent",
        sent_at: new Date().toISOString(),
        metadata: {
          type: finalType,
          resend_id: emailId,
          amount: amount,
          due_date: payment_due_date,
          reminder_type: reminder_type,
          ...data
        }
      });

    console.log(`Sent ${finalType} notification to ${contact.email}`);

    return new Response(JSON.stringify({ 
      success: true, 
      emailId: emailId,
      contact_name: `${contact.first_name} ${contact.last_name}`,
      contact_email: contact.email
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error sending payment notification:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

function generatePaymentFailedEmail(contact: any, data: any) {
  return `
    <html>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #dc3545;">Payment Failed</h2>
          <p>Hi ${contact.first_name},</p>
          <p>We were unable to process your payment of <strong>$${(data.amount / 100).toFixed(2)}</strong> for your membership.</p>
          
          <div style="background-color: #fff; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <h3>What you need to do:</h3>
            <ol>
              <li>Check that your payment method has sufficient funds</li>
              <li>Update your payment method if needed</li>
              <li>Contact us if you continue to experience issues</li>
            </ol>
          </div>
          
          <p>
            <a href="${data.portal_url || '#'}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Update Payment Method
            </a>
          </p>
          
          <p>If you have any questions, please don't hesitate to contact us.</p>
          <p>Best regards,<br>The Academy Team</p>
        </div>
      </body>
    </html>
  `;
}

function generatePaymentSuccessEmail(contact: any, data: any) {
  return `
    <html>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #28a745;">Payment Received</h2>
          <p>Hi ${contact.first_name},</p>
          <p>Thank you! We've successfully received your payment of <strong>$${(data.amount / 100).toFixed(2)}</strong>.</p>
          
          <div style="background-color: #fff; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <h3>Payment Details:</h3>
            <ul>
              <li><strong>Amount:</strong> $${(data.amount / 100).toFixed(2)}</li>
              <li><strong>Date:</strong> ${new Date().toLocaleDateString()}</li>
              <li><strong>Description:</strong> ${data.description || 'Membership payment'}</li>
            </ul>
          </div>
          
          ${data.receipt_url ? `
          <p>
            <a href="${data.receipt_url}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              View Receipt
            </a>
          </p>
          ` : ''}
          
          <p>Your membership is now active and up to date.</p>
          <p>Best regards,<br>The Academy Team</p>
        </div>
      </body>
    </html>
  `;
}

function generateSubscriptionCanceledEmail(contact: any, data: any) {
  return `
    <html>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #6c757d;">Subscription Canceled</h2>
          <p>Hi ${contact.first_name},</p>
          <p>We're sorry to see you go. Your subscription has been canceled as requested.</p>
          
          <div style="background-color: #fff; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <h3>What happens next:</h3>
            <ul>
              <li>Your access will continue until ${data.period_end ? new Date(data.period_end).toLocaleDateString() : 'the end of your billing period'}</li>
              <li>No future charges will be made</li>
              <li>You can reactivate anytime before your access expires</li>
            </ul>
          </div>
          
          <p>We'd love to have you back anytime. If you have feedback on how we can improve, please let us know.</p>
          <p>Best regards,<br>The Academy Team</p>
        </div>
      </body>
    </html>
  `;
}

function generateTrialExpiringEmail(contact: any, data: any) {
  return `
    <html>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #ffc107;">Your Trial is Expiring Soon</h2>
          <p>Hi ${contact.first_name},</p>
          <p>Your free trial expires on <strong>${data.trial_end ? new Date(data.trial_end).toLocaleDateString() : 'soon'}</strong>.</p>
          
          <div style="background-color: #fff; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <h3>Don't lose access to:</h3>
            <ul>
              <li>All martial arts classes</li>
              <li>Academy community features</li>
              <li>Progress tracking</li>
              <li>Exclusive member benefits</li>
            </ul>
          </div>
          
          <p>
            <a href="${data.portal_url || '#'}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Subscribe Now
            </a>
          </p>
          
          <p>Questions? We're here to help!</p>
          <p>Best regards,<br>The Academy Team</p>
        </div>
      </body>
    </html>
  `;
}

function generateLateFeeEmail(contact: any, data: any) {
  return `
    <html>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #dc3545;">Late Fee Applied</h2>
          <p>Hi ${contact.first_name},</p>
          <p>A late fee of <strong>$${(data.late_fee_amount / 100).toFixed(2)}</strong> has been applied to your account due to an overdue payment.</p>
          
          <div style="background-color: #fff; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <h3>Payment Details:</h3>
            <ul>
              <li><strong>Original Amount:</strong> $${(data.original_amount / 100).toFixed(2)}</li>
              <li><strong>Late Fee:</strong> $${(data.late_fee_amount / 100).toFixed(2)}</li>
              <li><strong>Days Overdue:</strong> ${data.days_overdue}</li>
              <li><strong>Total Due:</strong> $${((data.original_amount + data.late_fee_amount) / 100).toFixed(2)}</li>
            </ul>
          </div>
          
          <p>Please make your payment as soon as possible to avoid additional fees.</p>
          
          <p>
            <a href="${data.portal_url || '#'}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Make Payment
            </a>
          </p>
          
          <p>If you have any questions, please contact us immediately.</p>
          <p>Best regards,<br>The Academy Team</p>
        </div>
      </body>
    </html>
  `;
}

function generatePaymentReminderEmail(contact: any, data: any) {
  return `
    <html>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #ffc107;">Payment Reminder</h2>
          <p>Hi ${contact.first_name},</p>
          <p>This is a friendly reminder that your payment of <strong>$${(data.amount / 100).toFixed(2)}</strong> is due on ${data.due_date ? new Date(data.due_date).toLocaleDateString() : 'soon'}.</p>
          
          <div style="background-color: #fff; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <h3>Payment Details:</h3>
            <ul>
              <li><strong>Amount:</strong> $${(data.amount / 100).toFixed(2)}</li>
              <li><strong>Due Date:</strong> ${data.due_date ? new Date(data.due_date).toLocaleDateString() : 'Soon'}</li>
              <li><strong>Description:</strong> ${data.description || 'Membership payment'}</li>
            </ul>
          </div>
          
          <p>
            <a href="${data.portal_url || '#'}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Make Payment
            </a>
          </p>
          
          <p>Thank you for being a valued member!</p>
          <p>Best regards,<br>The Academy Team</p>
        </div>
      </body>
    </html>
  `;
}