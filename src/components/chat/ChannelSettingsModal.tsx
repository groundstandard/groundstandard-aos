import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Trash2, 
  Archive, 
  LogOut, 
  UserPlus, 
  UserMinus,
  Hash,
  Users,
  Settings,
  Crown,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Channel {
  id: string;
  name: string;
  description: string;
  type: 'public' | 'private' | 'premium';
  is_admin_only: boolean;
  created_by: string;
  member_count: number;
}

interface User {
  id: string;
  first_name: string;
  last_name: string;
  role: 'student' | 'instructor' | 'admin';
  email: string;
}

interface ChannelSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channel: Channel;
  onChannelUpdate: (channel: Channel) => void;
  onChannelDelete?: (channelId: string) => void;
  onLeaveChannel?: (channelId: string) => void;
}

export const ChannelSettingsModal = ({
  open,
  onOpenChange,
  channel,
  onChannelUpdate,
  onChannelDelete,
  onLeaveChannel
}: ChannelSettingsModalProps) => {
  const [channelName, setChannelName] = useState(channel.name);
  const [channelDescription, setChannelDescription] = useState(channel.description);
  const [members, setMembers] = useState<User[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [showAddUsers, setShowAddUsers] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const isAdmin = profile?.role === 'admin';
  const isChannelCreator = profile?.id === channel.created_by;

  useEffect(() => {
    if (open) {
      setChannelName(channel.name);
      setChannelDescription(channel.description);
      fetchChannelMembers();
      fetchAvailableUsers();
    }
  }, [open, channel]);

  const fetchChannelMembers = async () => {
    try {
      // Mock data for now - in real app would fetch from channel_members table
      const mockMembers: User[] = [
        {
          id: '1',
          first_name: 'John',
          last_name: 'Sensei',
          role: 'admin',
          email: 'john@academy.com'
        },
        {
          id: '2', 
          first_name: 'Sarah',
          last_name: 'Instructor',
          role: 'instructor',
          email: 'sarah@academy.com'
        }
      ];
      setMembers(mockMembers);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role, email')
        .limit(20);

      if (error) throw error;
      setAvailableUsers((data || []) as User[]);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleSaveChanges = async () => {
    if (!isAdmin && !isChannelCreator) {
      toast({
        variant: "destructive",
        title: "Permission denied",
        description: "Only admins and channel creators can modify channel settings."
      });
      return;
    }

    setLoading(true);
    try {
      const updatedChannel = {
        ...channel,
        name: channelName,
        description: channelDescription
      };
      
      onChannelUpdate(updatedChannel);
      
      toast({
        title: "Channel updated",
        description: "Channel settings have been saved successfully."
      });
      
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update channel settings."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!isAdmin && !isChannelCreator) return;
    
    setMembers(prev => prev.filter(member => member.id !== userId));
    toast({
      title: "Member removed",
      description: "User has been removed from the channel."
    });
  };

  const handleAddMember = async (user: User) => {
    if (!isAdmin && !isChannelCreator) return;
    
    if (members.find(member => member.id === user.id)) {
      toast({
        variant: "destructive",
        title: "Already a member",
        description: "This user is already in the channel."
      });
      return;
    }
    
    setMembers(prev => [...prev, user]);
    toast({
      title: "Member added",
      description: `${user.first_name} ${user.last_name} has been added to the channel.`
    });
  };

  const handleLeaveChannel = () => {
    if (onLeaveChannel) {
      onLeaveChannel(channel.id);
      onOpenChange(false);
      toast({
        title: "Left channel",
        description: `You have left #${channel.name}.`
      });
    }
  };

  const handleDeleteChannel = () => {
    if (!isAdmin && !isChannelCreator) return;
    
    if (onChannelDelete) {
      onChannelDelete(channel.id);
      onOpenChange(false);
      toast({
        title: "Channel deleted",
        description: `#${channel.name} has been permanently deleted.`
      });
    }
  };

  const handleArchiveChannel = () => {
    if (!isAdmin && !isChannelCreator) return;
    
    toast({
      title: "Channel archived",
      description: `#${channel.name} has been archived.`
    });
    onOpenChange(false);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500/10 text-red-700 border-red-200';
      case 'instructor':
        return 'bg-blue-500/10 text-blue-700 border-blue-200';
      default:
        return 'bg-green-500/10 text-green-700 border-green-200';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            {channel.name} Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Channel Details */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Channel Name</label>
              <Input
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                disabled={!isAdmin && !isChannelCreator}
                placeholder="Enter channel name"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Description</label>
              <Textarea
                value={channelDescription}
                onChange={(e) => setChannelDescription(e.target.value)}
                disabled={!isAdmin && !isChannelCreator}
                placeholder="Enter channel description"
                rows={3}
              />
            </div>
          </div>

          <Separator />

          {/* Members Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Users className="h-5 w-5" />
                Members ({members.length})
              </h3>
              {(isAdmin || isChannelCreator) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddUsers(!showAddUsers)}
                  className="flex items-center gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  Add Members
                </Button>
              )}
            </div>

            {/* Add Users Section */}
            {showAddUsers && (isAdmin || isChannelCreator) && (
              <div className="border rounded-lg p-4 bg-muted/50">
                <h4 className="text-sm font-medium mb-3">Add New Members</h4>
                <div className="grid gap-2 max-h-32 overflow-y-auto">
                  {availableUsers
                    .filter(user => !members.find(member => member.id === user.id))
                    .map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-2 hover:bg-background rounded">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                            {getInitials(user.first_name, user.last_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{user.first_name} {user.last_name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                        <Badge variant="outline" className={`text-xs ${getRoleColor(user.role)}`}>
                          {user.role}
                        </Badge>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddMember(user)}
                      >
                        Add
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Current Members */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="text-sm bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                        {getInitials(member.first_name, member.last_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{member.first_name} {member.last_name}</p>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                    <Badge variant="outline" className={`text-xs ${getRoleColor(member.role)}`}>
                      {member.role}
                      {member.role === 'admin' && <Crown className="h-3 w-3 ml-1" />}
                    </Badge>
                  </div>
                  
                  {(isAdmin || isChannelCreator) && member.id !== profile?.id && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveMember(member.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="space-y-3">
            <div className="flex gap-2 flex-wrap">
              {(isAdmin || isChannelCreator) && (
                <Button
                  onClick={handleSaveChanges}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Save Changes
                </Button>
              )}
              
              <Button
                variant="outline"
                onClick={handleLeaveChannel}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Leave Channel
              </Button>
              
              {(isAdmin || isChannelCreator) && (
                <Button
                  variant="outline"
                  onClick={handleArchiveChannel}
                  className="flex items-center gap-2"
                >
                  <Archive className="h-4 w-4" />
                  Archive
                </Button>
              )}
            </div>
            
            {/* Danger Zone */}
            {(isAdmin || isChannelCreator) && (
              <div className="border border-destructive/20 rounded-lg p-4 bg-destructive/5">
                <h4 className="text-sm font-medium text-destructive mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Danger Zone
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Once you delete a channel, there is no going back. All messages will be permanently lost.
                </p>
                {!showDeleteConfirm ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Channel
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteChannel}
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Confirm Delete
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};