import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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
    const { student_id, reminder_type = "first_notice", payment_due_date, amount } = await req.json();

    if (!student_id || !payment_due_date || !amount) {
      throw new Error("Missing required fields: student_id, payment_due_date, amount");
    }

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

    // Get email template based on reminder type
    const templateMap = {
      'first_notice': 'payment_reminder_first',
      'second_notice': 'payment_reminder_first',
      'final_notice': 'payment_reminder_first',
      'overdue': 'payment_overdue'
    };

    const templateName = templateMap[reminder_type as keyof typeof templateMap] || 'payment_reminder_first';

    const { data: template, error: templateError } = await supabaseClient
      .from('email_templates')
      .select('subject, html_content')
      .eq('template_name', templateName)
      .eq('is_active', true)
      .single();

    if (templateError || !template) {
      throw new Error("Email template not found");
    }

    // Replace template variables
    const studentName = `${student.first_name} ${student.last_name}`;
    const variables = {
      student_name: studentName,
      amount: (amount / 100).toFixed(2),
      due_date: new Date(payment_due_date).toLocaleDateString(),
      late_fee: reminder_type === 'overdue' ? (amount * 0.05 / 100).toFixed(2) : '0.00'
    };

    let emailSubject = template.subject;
    let emailContent = template.html_content;

    // Replace variables in subject and content
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      emailSubject = emailSubject.replace(new RegExp(placeholder, 'g'), value);
      emailContent = emailContent.replace(new RegExp(placeholder, 'g'), value);
    });

    // Send email
    const { data: emailResult, error: emailError } = await resend.emails.send({
      from: "Academy Payments <payments@resend.dev>",
      to: [student.email],
      subject: emailSubject,
      html: emailContent,
    });

    if (emailError) {
      throw new Error(`Failed to send email: ${emailError.message}`);
    }

    // Record the reminder in the database
    const { error: reminderError } = await supabaseClient
      .from('payment_reminders')
      .insert({
        student_id,
        payment_due_date,
        amount,
        reminder_type,
        status: 'sent',
        sent_at: new Date().toISOString(),
        email_content: emailContent,
      });

    if (reminderError) {
      console.error("Error recording reminder:", reminderError);
    }

    return new Response(JSON.stringify({
      success: true,
      email_id: emailResult?.id,
      reminder_type,
      sent_to: student.email,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error sending payment reminder:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});