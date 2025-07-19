import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HighLevelWebhookData {
  type: string;
  contactId: string;
  appointmentId?: string;
  contact: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  appointment?: {
    title: string;
    startTime: string;
    endTime: string;
    status: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const webhookData: HighLevelWebhookData = await req.json();

    console.log('[HIGHLEVEL-WEBHOOK] Received webhook:', JSON.stringify(webhookData, null, 2));

    // Check if automation is enabled
    const { data: settings, error: settingsError } = await supabase
      .from('automation_settings')
      .select('booked_lead')
      .single();

    if (settingsError || !settings?.booked_lead) {
      console.log('[HIGHLEVEL-WEBHOOK] Booked lead automation is disabled');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Automation disabled' 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Process appointment booking
    if (webhookData.type === 'appointment.created' || webhookData.type === 'appointment.booked') {
      const { contact, appointment } = webhookData;

      // Check if contact already exists
      let existingContact;
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', contact.email)
        .maybeSingle();

      if (profileError) {
        console.error('Error checking existing contact:', profileError);
      } else {
        existingContact = profiles;
      }

      let contactId = existingContact?.id;

      // Create new contact if doesn't exist
      if (!existingContact) {
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            first_name: contact.firstName,
            last_name: contact.lastName,
            email: contact.email,
            phone: contact.phone,
            role: 'student',
            membership_status: 'visitor',
            belt_level: 'White Belt'
          })
          .select()
          .single();

        if (createError) {
          throw new Error(`Failed to create contact: ${createError.message}`);
        }

        contactId = newProfile.id;
        console.log(`[HIGHLEVEL-WEBHOOK] Created new contact: ${contactId}`);
      } else {
        console.log(`[HIGHLEVEL-WEBHOOK] Found existing contact: ${contactId}`);
      }

      // Create contact activity record
      const { error: activityError } = await supabase
        .from('contact_activities')
        .insert({
          contact_id: contactId,
          activity_type: 'appointment',
          activity_title: 'Appointment Booked from HighLevel',
          activity_description: `${appointment?.title || 'Appointment'} scheduled for ${appointment?.startTime}`,
          activity_data: {
            source: 'highlevel_webhook',
            appointment_id: webhookData.appointmentId,
            appointment_details: appointment,
            webhook_type: webhookData.type
          }
        });

      if (activityError) {
        console.error('Failed to create activity record:', activityError);
      }

      // Log the automation
      const { error: logError } = await supabase
        .from('automation_logs')
        .insert({
          automation_type: 'booked_lead',
          contact_id: contactId,
          trigger_data: webhookData,
          status: 'success'
        });

      if (logError) {
        console.error('Failed to log automation:', logError);
      }

      console.log(`[HIGHLEVEL-WEBHOOK] Successfully processed appointment booking for contact ${contactId}`);

      return new Response(JSON.stringify({
        success: true,
        message: 'Appointment booking processed successfully',
        contactId: contactId
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Handle other webhook types if needed
    console.log(`[HIGHLEVEL-WEBHOOK] Unhandled webhook type: ${webhookData.type}`);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Webhook received but not processed'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error: any) {
    console.error('Error processing HighLevel webhook:', error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
};

serve(handler);