import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AutomationRequest {
  type: 'member_signed' | 'member_cancelled' | 'member_absent' | 'member_present' | 'member_delinquent' | 'member_current';
  contactId: string;
  data: Record<string, any>;
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

    const { type, contactId, data }: AutomationRequest = await req.json();

    console.log(`[HIGHLEVEL-AUTOMATION] Processing ${type} for contact ${contactId}`);

    // Get automation settings
    const { data: settings, error: settingsError } = await supabase
      .from('automation_settings')
      .select('*')
      .single();

    if (settingsError) {
      throw new Error(`Failed to load automation settings: ${settingsError.message}`);
    }

    // Get HighLevel configuration
    const { data: hlConfig, error: hlError } = await supabase
      .from('highlevel_config')
      .select('*')
      .single();

    if (hlError || !hlConfig?.is_connected) {
      throw new Error('HighLevel is not configured or connected');
    }

    // Check if automation is enabled for this type
    const automationMap = {
      'member_signed': settings.member_signed,
      'member_cancelled': settings.member_cancelled,
      'member_absent': settings.member_absent,
      'member_present': settings.member_present,
      'member_delinquent': settings.member_delinquent,
      'member_current': settings.member_current
    };

    if (!automationMap[type]) {
      console.log(`[HIGHLEVEL-AUTOMATION] ${type} automation is disabled`);
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Automation is disabled' 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Get contact information
    const { data: contact, error: contactError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', contactId)
      .single();

    if (contactError) {
      throw new Error(`Failed to load contact: ${contactError.message}`);
    }

    // Prepare HighLevel API request
    const hlApiUrl = `https://services.leadconnectorhq.com/contacts/`;
    const hlHeaders = {
      'Authorization': `Bearer ${hlConfig.api_key}`,
      'Content-Type': 'application/json',
      'Version': '2021-07-28'
    };

    let hlResponse;
    let automationResult = { success: false, message: '' };

    switch (type) {
      case 'member_signed':
        // Create or update contact in HighLevel
        const createContactPayload = {
          firstName: contact.first_name,
          lastName: contact.last_name,
          email: contact.email,
          phone: contact.phone,
          source: 'Martial Arts Academy',
          tags: ['new-member', 'active'],
          customFields: [
            {
              key: 'belt_level',
              field_value: contact.belt_level || 'White Belt'
            },
            {
              key: 'membership_status',
              field_value: contact.membership_status
            }
          ]
        };

        hlResponse = await fetch(hlApiUrl, {
          method: 'POST',
          headers: hlHeaders,
          body: JSON.stringify(createContactPayload)
        });

        automationResult = {
          success: hlResponse.ok,
          message: hlResponse.ok ? 'Contact created in HighLevel' : 'Failed to create contact'
        };
        break;

      case 'member_cancelled':
        // Update contact tags and status
        const cancelPayload = {
          tags: ['cancelled', 'inactive'],
          customFields: [
            {
              key: 'membership_status',
              field_value: 'cancelled'
            },
            {
              key: 'cancelled_date',
              field_value: new Date().toISOString()
            }
          ]
        };

        hlResponse = await fetch(`${hlApiUrl}${contactId}`, {
          method: 'PUT',
          headers: hlHeaders,
          body: JSON.stringify(cancelPayload)
        });

        automationResult = {
          success: hlResponse.ok,
          message: hlResponse.ok ? 'Contact updated as cancelled' : 'Failed to update contact'
        };
        break;

      case 'member_absent':
        // Tag contact as absent and trigger workflow
        const absentPayload = {
          tags: ['absent', 'needs-follow-up'],
          customFields: [
            {
              key: 'last_attendance',
              field_value: data.lastAttendance || ''
            },
            {
              key: 'days_absent',
              field_value: data.daysAbsent?.toString() || ''
            }
          ]
        };

        hlResponse = await fetch(`${hlApiUrl}${contactId}`, {
          method: 'PUT',
          headers: hlHeaders,
          body: JSON.stringify(absentPayload)
        });

        automationResult = {
          success: hlResponse.ok,
          message: hlResponse.ok ? 'Contact marked as absent' : 'Failed to update contact'
        };
        break;

      case 'member_present':
        // Remove absent tags and update status
        const presentPayload = {
          tags: ['active', 'present'],
          removeTags: ['absent', 'needs-follow-up'],
          customFields: [
            {
              key: 'last_attendance',
              field_value: new Date().toISOString()
            },
            {
              key: 'attendance_status',
              field_value: 'active'
            }
          ]
        };

        hlResponse = await fetch(`${hlApiUrl}${contactId}`, {
          method: 'PUT',
          headers: hlHeaders,
          body: JSON.stringify(presentPayload)
        });

        automationResult = {
          success: hlResponse.ok,
          message: hlResponse.ok ? 'Contact marked as present' : 'Failed to update contact'
        };
        break;

      case 'member_delinquent':
        // Tag as delinquent and trigger collection workflow
        const delinquentPayload = {
          tags: ['delinquent', 'payment-overdue'],
          customFields: [
            {
              key: 'payment_status',
              field_value: 'overdue'
            },
            {
              key: 'last_payment_attempt',
              field_value: data.lastPaymentAttempt || ''
            },
            {
              key: 'amount_due',
              field_value: data.amountDue?.toString() || ''
            }
          ]
        };

        hlResponse = await fetch(`${hlApiUrl}${contactId}`, {
          method: 'PUT',
          headers: hlHeaders,
          body: JSON.stringify(delinquentPayload)
        });

        automationResult = {
          success: hlResponse.ok,
          message: hlResponse.ok ? 'Contact marked as delinquent' : 'Failed to update contact'
        };
        break;

      case 'member_current':
        // Remove delinquent tags and update payment status
        const currentPayload = {
          tags: ['current', 'paid'],
          removeTags: ['delinquent', 'payment-overdue'],
          customFields: [
            {
              key: 'payment_status',
              field_value: 'current'
            },
            {
              key: 'last_payment_date',
              field_value: new Date().toISOString()
            }
          ]
        };

        hlResponse = await fetch(`${hlApiUrl}${contactId}`, {
          method: 'PUT',
          headers: hlHeaders,
          body: JSON.stringify(currentPayload)
        });

        automationResult = {
          success: hlResponse.ok,
          message: hlResponse.ok ? 'Contact payment status updated' : 'Failed to update contact'
        };
        break;

      default:
        throw new Error(`Unknown automation type: ${type}`);
    }

    // Log the automation result
    const { error: logError } = await supabase
      .from('automation_logs')
      .insert({
        automation_type: type,
        contact_id: contactId,
        trigger_data: data,
        highlevel_response: hlResponse ? await hlResponse.json() : null,
        status: automationResult.success ? 'success' : 'failed',
        error_message: automationResult.success ? null : automationResult.message
      });

    if (logError) {
      console.error('Failed to log automation result:', logError);
    }

    console.log(`[HIGHLEVEL-AUTOMATION] ${type} completed:`, automationResult);

    return new Response(JSON.stringify(automationResult), {
      status: automationResult.success ? 200 : 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error: any) {
    console.error('Error in HighLevel automation:', error);
    
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