import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[EXPORT-DATA] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Create Supabase client with service role key
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
    if (!user) throw new Error("User not authenticated");

    // Check if user is admin
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      throw new Error('Only administrators can export data');
    }

    const { exportType } = await req.json();
    logStep("Export type requested", { exportType });

    let data: any[] = [];
    let fileName = '';

    switch (exportType) {
      case 'students':
        const { data: students } = await supabaseClient
          .from('profiles')
          .select('*')
          .eq('role', 'student');
        data = students || [];
        fileName = `students_export_${new Date().toISOString().split('T')[0]}.csv`;
        break;

      case 'payments':
        const { data: payments } = await supabaseClient
          .from('payments')
          .select(`
            *,
            profiles!student_id(first_name, last_name, email)
          `);
        data = payments || [];
        fileName = `payments_export_${new Date().toISOString().split('T')[0]}.csv`;
        break;

      case 'attendance':
        const { data: attendance } = await supabaseClient
          .from('attendance')
          .select(`
            *,
            profiles!student_id(first_name, last_name, email),
            classes!class_id(name)
          `);
        data = attendance || [];
        fileName = `attendance_export_${new Date().toISOString().split('T')[0]}.csv`;
        break;

      default:
        throw new Error('Invalid export type');
    }

    // Convert to CSV
    if (data.length === 0) {
      throw new Error('No data found for export');
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          if (typeof value === 'object' && value !== null) {
            return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
          }
          return `"${String(value || '').replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');

    // Log export in database
    await supabaseClient
      .from('export_logs')
      .insert({
        export_type: exportType,
        file_name: fileName,
        file_size: csvContent.length,
        status: 'completed',
        exported_by: user.id,
        completed_at: new Date().toISOString()
      });

    logStep("Export completed", { fileName, recordCount: data.length });

    return new Response(csvContent, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in export-data", { message: errorMessage });
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});