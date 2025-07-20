import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAcademy } from '@/hooks/useAcademy';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { UserPlus, Mail, Trash2, Crown, Shield, User, CheckCircle, Clock, XCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface TeamMember {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
  created_at: string;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  expires_at: string;
  created_at: string;
  inviter: {
    first_name?: string;
    last_name?: string;
  };
}

const TeamManagement = () => {
  const { user, profile } = useAuth();
  const { academy } = useAcademy();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviting, setIsInviting] = useState(false);
  
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'student'
  });

  const roles = [
    { value: 'owner', label: 'Owner', icon: Crown, description: 'Full access to everything' },
    { value: 'admin', label: 'Admin', icon: Shield, description: 'Manage academy and users' },
    { value: 'instructor', label: 'Instructor', icon: User, description: 'Manage classes and students' },
    { value: 'staff', label: 'Staff', icon: User, description: 'Limited administrative access' },
    { value: 'student', label: 'Student', icon: User, description: 'Basic student access' },
  ];

  const canInvite = profile?.role === 'owner' || profile?.role === 'admin';

  useEffect(() => {
    fetchTeamData();
  }, [academy?.id]);

  const fetchTeamData = async () => {
    if (!academy?.id) return;

    try {
      setIsLoading(true);

      // Fetch team members
      const { data: members, error: membersError } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, role, created_at')
        .eq('academy_id', academy.id)
        .order('created_at');

      if (membersError) throw membersError;
      setTeamMembers(members || []);

      // Fetch pending invitations
      const { data: invites, error: invitesError } = await supabase
        .from('academy_invitations')
        .select(`
          id,
          email,
          role,
          status,
          expires_at,
          created_at,
          inviter:profiles(first_name, last_name)
        `)
        .eq('academy_id', academy.id)
        .in('status', ['pending', 'accepted'])
        .order('created_at', { ascending: false });

      if (invitesError) throw invitesError;
      setInvitations(invites || []);

    } catch (error) {
      console.error('Error fetching team data:', error);
      toast({
        title: "Error",
        description: "Failed to load team data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!academy || !inviteForm.email) return;

    setIsInviting(true);
    try {
      const { error } = await supabase.functions.invoke('send-academy-invitation', {
        body: {
          email: inviteForm.email,
          role: inviteForm.role,
          academyName: academy.name,
          inviterName: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || profile?.email || 'Academy Admin'
        }
      });

      if (error) throw error;

      toast({
        title: "Invitation sent!",
        description: `Invitation sent to ${inviteForm.email}`,
      });

      setInviteForm({ email: '', role: 'student' });
      setIsInviteDialogOpen(false);
      fetchTeamData();

    } catch (error) {
      console.error('Error sending invitation:', error);
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive",
      });
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ academy_id: null })
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: "Member removed",
        description: "Team member has been removed from the academy",
      });

      fetchTeamData();
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: "Error",
        description: "Failed to remove team member",
        variant: "destructive",
      });
    }
  };

  const handleCancelInvitation = async (inviteId: string) => {
    try {
      const { error } = await supabase
        .from('academy_invitations')
        .update({ status: 'cancelled' })
        .eq('id', inviteId);

      if (error) throw error;

      toast({
        title: "Invitation cancelled",
        description: "The invitation has been cancelled",
      });

      fetchTeamData();
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      toast({
        title: "Error",
        description: "Failed to cancel invitation",
        variant: "destructive",
      });
    }
  };

  const getRoleInfo = (role: string) => {
    return roles.find(r => r.value === role) || roles[4];
  };

  const getStatusIcon = (status: string, expiresAt: string) => {
    const isExpired = new Date(expiresAt) < new Date();
    
    if (isExpired) return <XCircle className="h-4 w-4 text-destructive" />;
    if (status === 'accepted') return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <Clock className="h-4 w-4 text-orange-500" />;
  };

  const getStatusText = (status: string, expiresAt: string) => {
    const isExpired = new Date(expiresAt) < new Date();
    
    if (isExpired) return 'Expired';
    if (status === 'accepted') return 'Accepted';
    return 'Pending';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading team...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Team Management</h2>
          <p className="text-muted-foreground">
            Invite and manage your academy team members
          </p>
        </div>
        
        {canInvite && (
          <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
                <DialogDescription>
                  Send an invitation to join your academy team
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="colleague@example.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select 
                    value={inviteForm.role} 
                    onValueChange={(value) => setInviteForm(prev => ({ ...prev, role: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => {
                        const Icon = role.icon;
                        return (
                          <SelectItem key={role.value} value={role.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              <div>
                                <div className="font-medium">{role.label}</div>
                                <div className="text-xs text-muted-foreground">{role.description}</div>
                              </div>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsInviteDialogOpen(false)}
                    disabled={isInviting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleInvite}
                    disabled={!inviteForm.email || isInviting}
                  >
                    {isInviting ? "Sending..." : "Send Invitation"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Team Members ({teamMembers.length})
          </CardTitle>
          <CardDescription>
            Current members of your academy
          </CardDescription>
        </CardHeader>
        <CardContent>
          {teamMembers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No team members yet. Start by inviting your first team member!
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamMembers.map((member) => {
                  const roleInfo = getRoleInfo(member.role);
                  const Icon = roleInfo.icon;
                  const isCurrentUser = member.id === user?.id;
                  const canRemove = canInvite && !isCurrentUser && member.role !== 'owner';
                  
                  return (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {member.first_name || member.last_name 
                              ? `${member.first_name || ''} ${member.last_name || ''}`.trim()
                              : member.email
                            }
                            {isCurrentUser && <span className="text-muted-foreground ml-2">(You)</span>}
                          </div>
                          <div className="text-sm text-muted-foreground">{member.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                          <Icon className="h-3 w-3" />
                          {roleInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(member.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {canRemove && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove this member from your academy? 
                                  They will lose access to all academy features.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleRemoveMember(member.id)}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {canInvite && invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Pending Invitations ({invitations.filter(i => i.status === 'pending').length})
            </CardTitle>
            <CardDescription>
              Invitations waiting for response
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((invitation) => {
                  const roleInfo = getRoleInfo(invitation.role);
                  const Icon = roleInfo.icon;
                  const isExpired = new Date(invitation.expires_at) < new Date();
                  
                  return (
                    <TableRow key={invitation.id}>
                      <TableCell className="font-medium">{invitation.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="flex items-center gap-1 w-fit">
                          <Icon className="h-3 w-3" />
                          {roleInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(invitation.status, invitation.expires_at)}
                          <span className={isExpired ? 'text-destructive' : ''}>
                            {getStatusText(invitation.status, invitation.expires_at)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(invitation.expires_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {invitation.status === 'pending' && !isExpired && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Cancel Invitation</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to cancel this invitation?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>No, keep it</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleCancelInvitation(invitation.id)}>
                                  Yes, cancel
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TeamManagement;