import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BulkOperation {
  type: 'update_status' | 'add_note' | 'export_data' | 'send_communication';
  contactIds: string[];
  data: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Authentication required');
    }

    // Verify user has admin/owner role
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'owner'].includes(profile.role)) {
      throw new Error('Insufficient permissions');
    }

    const operation: BulkOperation = await req.json();
    let results = [];

    switch (operation.type) {
      case 'update_status':
        // Bulk update membership status
        const { data: updateResults, error: updateError } = await supabaseClient
          .from('profiles')
          .update({ 
            membership_status: operation.data.status,
            updated_at: new Date().toISOString()
          })
          .in('id', operation.contactIds)
          .select();

        if (updateError) throw updateError;
        results = updateResults;
        break;

      case 'add_note':
        // Bulk add notes to multiple contacts
        const noteInserts = operation.contactIds.map(contactId => ({
          contact_id: contactId,
          title: operation.data.title,
          content: operation.data.content,
          note_type: operation.data.note_type || 'general',
          priority: operation.data.priority || 'normal',
          is_private: operation.data.is_private || false,
          created_by: user.id
        }));

        const { data: noteResults, error: noteError } = await supabaseClient
          .from('contact_notes')
          .insert(noteInserts)
          .select();

        if (noteError) throw noteError;
        results = noteResults;
        break;

      case 'export_data':
        // Export contact data with related information
        const { data: exportData, error: exportError } = await supabaseClient
          .from('profiles')
          .select(`
            *,
            payments:payments(*),
            attendance:attendance(*),
            notes:contact_notes(*),
            family_members:profiles!parent_id(*)
          `)
          .in('id', operation.contactIds);

        if (exportError) throw exportError;
        
        // Generate CSV-style export
        const csvData = exportData.map(contact => ({
          id: contact.id,
          name: `${contact.first_name} ${contact.last_name}`,
          email: contact.email,
          phone: contact.phone,
          role: contact.role,
          belt_level: contact.belt_level,
          membership_status: contact.membership_status,
          total_payments: contact.payments?.filter((p: any) => p.status === 'completed').length || 0,
          total_attendance: contact.attendance?.length || 0,
          notes_count: contact.notes?.length || 0,
          family_members_count: contact.family_members?.length || 0,
          joined_date: contact.created_at
        }));

        results = csvData;
        break;

      case 'send_communication':
        // Log communication attempts (actual sending would require integration)
        const communicationLogs = operation.contactIds.map(contactId => ({
          contact_id: contactId,
          message_type: operation.data.type || 'email',
          subject: operation.data.subject,
          content: operation.data.content,
          status: 'queued',
          sent_by: user.id
        }));

        const { data: commResults, error: commError } = await supabaseClient
          .from('communication_logs')
          .insert(communicationLogs)
          .select();

        if (commError) throw commError;
        results = commResults;
        break;

      default:
        throw new Error('Invalid operation type');
    }

    return new Response(JSON.stringify({ 
      success: true, 
      results,
      affected_count: results.length 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Bulk operation error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});