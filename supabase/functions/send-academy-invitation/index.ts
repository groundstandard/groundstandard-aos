import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  email: string;
  role: string;
  academyName: string;
  inviterName: string;
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-INVITATION] ${step}${detailsStr}`);
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Create Supabase client using service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get request data
    const { email, role, academyName, inviterName }: InvitationRequest = await req.json();
    logStep("Request data", { email, role, academyName, inviterName });

    // Get user's academy and role (enforce inviter permissions)
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('academy_id, role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.academy_id) {
      throw new Error("User not associated with any academy");
    }

    if (!['owner', 'admin', 'staff'].includes(profile.role)) {
      throw new Error('Insufficient permissions to send invitations');
    }

    // Generate invitation token
    const invitationToken = crypto.randomUUID();
    
    // Create invitation record
    const { error: inviteError } = await supabaseClient
      .from('academy_invitations')
      .insert({
        academy_id: profile.academy_id,
        email,
        role,
        token: invitationToken,
        inviter_id: user.id,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      });

    if (inviteError) throw inviteError;
    logStep("Invitation record created", { token: invitationToken });

    // Prepare invitation link + use as Supabase Auth invite redirect
    const origin = req.headers.get("origin") || "http://localhost:3000";
    const inviteLink = `${origin}/accept-invitation?token=${invitationToken}`;

    const webhookUrl = Deno.env.get('N8N_EMAIL_SENDER_WEBHOOK_URL')
      || 'https://groundstandard.app.n8n.cloud/webhook/email-sender';

    const webhookPayload = {
      type: 'academy_invitation',
      email,
      role,
      academyName,
      inviterName,
      inviteLink,
      invitationToken,
      academyId: profile.academy_id,
      inviterId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    logStep('Calling n8n webhook', { webhookUrl });

    const webhookResp = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookPayload),
    });

    const webhookText = await webhookResp.text();
    logStep('n8n webhook response', { status: webhookResp.status, body: webhookText });

    if (!webhookResp.ok) {
      throw new Error(`Invitation created but webhook failed (${webhookResp.status}): ${webhookText}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Invitation sent successfully",
        invitationId: invitationToken,
        deliveryProvider: 'n8n',
        webhookStatus: webhookResp.status
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});