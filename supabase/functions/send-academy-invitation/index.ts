import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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

serve(async (req) => {
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

    // Get user's academy
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('academy_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.academy_id) {
      throw new Error("User not associated with any academy");
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

    // Prepare invitation link
    const origin = req.headers.get("origin") || "http://localhost:3000";
    const inviteLink = `${origin}/accept-invitation?token=${invitationToken}`;

    // Send invitation email
    const emailResponse = await resend.emails.send({
      from: "Academy Manager <onboarding@resend.dev>",
      to: [email],
      subject: `You're invited to join ${academyName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #3B82F6; margin: 0;">Academy Manager</h1>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
            <h2 style="color: #1e293b; margin-top: 0;">You've been invited!</h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">
              <strong>${inviterName}</strong> has invited you to join <strong>${academyName}</strong> 
              as a <strong>${role}</strong>.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteLink}" 
               style="background: #3B82F6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Accept Invitation
            </a>
          </div>
          
          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px;">
            <p style="color: #64748b; font-size: 14px; margin: 0;">
              This invitation will expire in 7 days. If you can't click the button above, 
              copy and paste this link into your browser:
            </p>
            <p style="color: #3B82F6; font-size: 14px; word-break: break-all; margin: 10px 0 0 0;">
              ${inviteLink}
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #94a3b8; font-size: 12px;">
            <p>If you didn't expect this invitation, you can safely ignore this email.</p>
          </div>
        </div>
      `,
    });

    logStep("Email sent", { emailId: emailResponse.data?.id });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Invitation sent successfully",
        invitationId: invitationToken 
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