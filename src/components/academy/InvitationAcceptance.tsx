import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Building2, Crown, Shield, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface InvitationData {
  id: string;
  email: string;
  role: string;
  status: string;
  expires_at: string;
  academy: {
    id: string;
    name: string;
    description?: string;
  };
  inviter: {
    first_name?: string;
    last_name?: string;
    email: string;
  };
}

const InvitationAcceptance = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const token = searchParams.get('token');
  
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roles = {
    owner: { label: 'Owner', icon: Crown, color: 'bg-yellow-500' },
    admin: { label: 'Admin', icon: Shield, color: 'bg-blue-500' },
    instructor: { label: 'Instructor', icon: User, color: 'bg-green-500' },
    staff: { label: 'Staff', icon: User, color: 'bg-gray-500' },
    student: { label: 'Student', icon: User, color: 'bg-purple-500' },
  };

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link');
      setLoading(false);
      return;
    }

    fetchInvitation();
  }, [token]);

  const fetchInvitation = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('academy_invitations')
        .select(`
          id,
          email,
          role,
          status,
          expires_at,
          academy:academies(id, name, description),
          inviter:profiles(first_name, last_name, email)
        `)
        .eq('token', token)
        .single();

      if (error) throw error;

      if (!data) {
        setError('Invitation not found');
        return;
      }

      if (data.status !== 'pending') {
        setError('This invitation has already been used or cancelled');
        return;
      }

      if (new Date(data.expires_at) < new Date()) {
        setError('This invitation has expired');
        return;
      }

      setInvitation(data as InvitationData);

    } catch (error) {
      console.error('Error fetching invitation:', error);
      setError('Failed to load invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!invitation || !user) return;

    setAccepting(true);
    try {
      // Check if user's email matches invitation email
      if (user.email !== invitation.email) {
        throw new Error('This invitation was sent to a different email address');
      }

      // Update user's profile to join the academy
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          academy_id: invitation.academy.id,
          role: invitation.role
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Mark invitation as accepted
      const { error: inviteError } = await (supabase as any)
        .from('academy_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitation.id);

      if (inviteError) throw inviteError;

      toast({
        title: "Welcome to the team!",
        description: `You've successfully joined ${invitation.academy.name}`,
      });

      // Redirect to dashboard
      navigate('/dashboard');

    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to accept invitation",
        variant: "destructive",
      });
    } finally {
      setAccepting(false);
    }
  };

  const handleDeclineInvitation = async () => {
    if (!invitation) return;

    try {
      const { error } = await (supabase as any)
        .from('academy_invitations')
        .update({ status: 'declined' })
        .eq('id', invitation.id);

      if (error) throw error;

      toast({
        title: "Invitation declined",
        description: "You have declined this invitation",
      });

      navigate('/');

    } catch (error) {
      console.error('Error declining invitation:', error);
      toast({
        title: "Error",
        description: "Failed to decline invitation",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate('/')} variant="outline">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Building2 className="h-12 w-12 text-primary mx-auto mb-4" />
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>
              Please sign in to accept this invitation
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate('/auth')} className="w-full">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) return null;

  const roleInfo = roles[invitation.role as keyof typeof roles] || roles.student;
  const RoleIcon = roleInfo.icon;

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <Building2 className="h-12 w-12 text-primary mx-auto mb-4" />
          <CardTitle className="text-2xl">You're Invited!</CardTitle>
          <CardDescription>
            Join {invitation.academy.name} as a team member
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Academy Info */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">{invitation.academy.name}</h3>
            {invitation.academy.description && (
              <p className="text-muted-foreground text-sm">{invitation.academy.description}</p>
            )}
          </div>

          {/* Role Badge */}
          <div className="flex items-center justify-center">
            <Badge variant="secondary" className="flex items-center gap-2 text-base px-4 py-2">
              <RoleIcon className="h-4 w-4" />
              {roleInfo.label}
            </Badge>
          </div>

          {/* Inviter Info */}
          <div className="text-center text-sm text-muted-foreground">
            Invited by{' '}
            <span className="font-medium">
              {invitation.inviter.first_name || invitation.inviter.last_name 
                ? `${invitation.inviter.first_name || ''} ${invitation.inviter.last_name || ''}`.trim()
                : invitation.inviter.email
              }
            </span>
          </div>

          {/* Email Match Check */}
          {user.email !== invitation.email && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <div className="flex items-center gap-2 text-destructive text-sm">
                <XCircle className="h-4 w-4" />
                <span>
                  This invitation was sent to {invitation.email}, but you're signed in as {user.email}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={handleDeclineInvitation}
              className="flex-1"
            >
              Decline
            </Button>
            <Button 
              onClick={handleAcceptInvitation}
              disabled={accepting || user.email !== invitation.email}
              className="flex-1"
            >
              {accepting ? "Joining..." : "Accept & Join"}
            </Button>
          </div>

          {/* Expiry Info */}
          <div className="text-center text-xs text-muted-foreground">
            This invitation expires on {new Date(invitation.expires_at).toLocaleDateString()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvitationAcceptance;