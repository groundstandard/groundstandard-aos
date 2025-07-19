import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  AlertTriangle,
  FileText,
  Download,
  Eye,
  Globe,
  Lock,
  X
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
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

interface ChannelFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploadedAt: string;
}

interface ChannelSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channel: Channel | null;
  onChannelUpdate: (channel: Channel) => void;
  onChannelDelete?: (channelId: string) => void;
  onLeaveChannel?: (channelId: string) => void;
  isDM?: boolean;
  dmUserName?: string;
  dmChannelId?: string;
  onCloseDM?: () => void;
}

export const ChannelSettingsModal = ({
  open,
  onOpenChange,
  channel,
  onChannelUpdate,
  onChannelDelete,
  onLeaveChannel,
  isDM = false,
  dmUserName,
  dmChannelId,
  onCloseDM
}: ChannelSettingsModalProps) => {
  const [channelName, setChannelName] = useState(channel?.name || '');
  const [channelDescription, setChannelDescription] = useState(channel?.description || '');
  const [channelTopic, setChannelTopic] = useState('');
  const [members, setMembers] = useState<User[]>([]);
  const [channelFiles, setChannelFiles] = useState<ChannelFile[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [showAddUsers, setShowAddUsers] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState(isDM ? 'files' : 'about');
  const [editingName, setEditingName] = useState(false);
  const [editingTopic, setEditingTopic] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { profile } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const isAdmin = profile?.role === 'admin';
  const isChannelCreator = profile?.id === channel?.created_by;

  useEffect(() => {
    if (open && channel) {
      setChannelName(channel.name);
      setChannelDescription(channel.description);
      setChannelTopic('');
      if (!isDM) {
        fetchChannelMembers();
        fetchAvailableUsers();
      }
      fetchChannelFiles();
    }
  }, [open, channel, isDM]);

  const fetchChannelFiles = async () => {
    try {
      setLoading(true);
      
      if (!channel && !isDM) {
        setChannelFiles([]);
        return;
      }
      
      // Query for messages with attachments
      let query = supabase
        .from('chat_messages')
        .select(`
          id,
          attachments,
          created_at,
          sender_id,
          profiles!inner(first_name, last_name)
        `)
        .not('attachments', 'eq', '[]')
        .order('created_at', { ascending: false });

      if (isDM && dmChannelId) {
        query = query.eq('dm_channel_id', dmChannelId);
      } else if (channel) {
        console.log('Looking up channel by name:', channel.name);
        // Look up the channel by name to get its UUID
        const { data: channelData, error: channelError } = await supabase
          .from('chat_channels')
          .select('id')
          .eq('name', channel.name)
          .single();
        
        console.log('Channel lookup result:', { channelData, channelError });
        
        if (channelData) {
          query = query.eq('channel_id', channelData.id);
        } else {
          console.log('No channel found, setting empty files');
          setChannelFiles([]);
          return;
        }
      }

      const { data: messages, error } = await query;

      if (error) {
        console.error('Error fetching messages with attachments:', error);
        setChannelFiles([]);
        return;
      }

      const files: ChannelFile[] = [];
      
      messages?.forEach((message) => {
        try {
          const attachments = Array.isArray(message.attachments) ? message.attachments : [];
          
          attachments.forEach((attachment: any, index: number) => {
            if (attachment && attachment.url) {
              const senderName = message.profiles 
                ? `${message.profiles.first_name} ${message.profiles.last_name}`.trim()
                : 'Unknown User';

              // Determine file type from URL or name
              let fileType = 'file';
              const fileName = attachment.name || attachment.url?.split('/').pop() || 'Unknown File';
              const fileExtension = fileName.split('.').pop()?.toLowerCase();
              
              if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension || '')) {
                fileType = 'image';
              } else if (['mp4', 'avi', 'mov', 'wmv'].includes(fileExtension || '')) {
                fileType = 'video';
              } else if (['mp3', 'wav', 'ogg', 'm4a'].includes(fileExtension || '')) {
                fileType = 'audio';
              } else if (fileExtension === 'pdf') {
                fileType = 'pdf';
              } else if (['doc', 'docx'].includes(fileExtension || '')) {
                fileType = 'document';
              }

              files.push({
                id: `${message.id}-${index}`,
                name: fileName,
                type: fileType,
                size: attachment.size || 0,
                url: attachment.url,
                uploadedBy: senderName,
                uploadedAt: message.created_at
              });
            }
          });
        } catch (err) {
          console.error('Error processing message attachments:', err);
        }
      });
      
      setChannelFiles(files);
    } catch (error) {
      console.error('Error fetching files:', error);
      setChannelFiles([]);
    } finally {
      setLoading(false);
    }
  };

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
    if (onLeaveChannel && channel) {
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
    
    if (onChannelDelete && channel) {
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
    
    if (channel) {
      toast({
        title: "Channel archived",
        description: `#${channel.name} has been archived.`
      });
      onOpenChange(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('image')) return '🖼️';
    if (type.includes('video')) return '🎥';
    if (type.includes('audio')) return '🎵';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
    return '📎';
  };

  const handlePreviewFile = (file: ChannelFile) => {
    if (file.type === 'image') {
      // Open image in a new window or modal
      window.open(file.url, '_blank');
    } else if (file.type === 'pdf') {
      // Open PDF in new tab
      window.open(file.url, '_blank');
    } else {
      toast({
        title: "Preview not available",
        description: "This file type cannot be previewed."
      });
    }
  };

  const handleDownloadFile = (file: ChannelFile) => {
    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Download started",
      description: `Downloading ${file.name}...`
    });
  };

  const ModalContent = () => (
    <>
      <div className={`border-b ${isMobile ? 'px-4' : 'px-6'}`}>
        <div className={`flex items-center gap-3 ${isMobile ? 'py-4' : 'py-6'}`}>
          {isDM ? (
            <>
              <Users className="h-5 w-5 text-muted-foreground" />
              <span className="text-lg font-semibold">{dmUserName || 'Direct Message'}</span>
            </>
          ) : (
            <>
              <div className="flex items-center">
                {channel?.type === 'private' && <Lock className="h-4 w-4 text-muted-foreground mr-1" />}
                {channel?.type === 'premium' && <Crown className="h-4 w-4 text-yellow-500 mr-1" />}
                <Hash className="h-5 w-5 text-muted-foreground" />
              </div>
              <span className="text-lg font-semibold">{channel?.name}</span>
            </>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
        <div className={`border-b ${isMobile ? 'px-4' : 'px-6'}`}>
          <TabsList className={`grid w-full bg-transparent h-auto p-0 ${isDM ? 'grid-cols-2' : 'grid-cols-4'}`}>
            {!isDM && (
              <>
                <TabsTrigger 
                  value="about" 
                  className={`
                    border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none
                    ${isMobile ? 'py-4 text-sm' : 'py-3'}
                  `}
                >
                  About
                </TabsTrigger>
                <TabsTrigger 
                  value="members"
                  className={`
                    border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none
                    ${isMobile ? 'py-4 text-sm' : 'py-3'}
                  `}
                >
                  Members {members.length}
                </TabsTrigger>
              </>
            )}
            <TabsTrigger 
              value="files"
              className={`
                border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none
                ${isMobile ? 'py-4 text-sm' : 'py-3'}
              `}
            >
              Files
            </TabsTrigger>
            <TabsTrigger 
              value="settings"
              className={`
                border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none
                ${isMobile ? 'py-4 text-sm' : 'py-3'}
              `}
            >
              Settings
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-y-auto">
          <TabsContent value="about" className={`${isMobile ? 'p-4' : 'p-6'} space-y-6 mt-0`}>
            {/* Channel Name */}
            <div className={`bg-muted/30 rounded-lg ${isMobile ? 'p-4' : 'p-4'}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`font-medium ${isMobile ? 'text-base' : 'text-base'}`}>Channel name</h3>
                {(isAdmin || isChannelCreator) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingName(!editingName)}
                    className="text-primary hover:text-primary/80"
                  >
                    {editingName ? 'Cancel' : 'Edit'}
                  </Button>
                )}
              </div>
              {editingName ? (
                <div className="flex gap-2">
                  <Input
                    value={channelName}
                    onChange={(e) => setChannelName(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleSaveChanges} size="sm">Save</Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {channel?.type === 'private' && <Lock className="h-4 w-4" />}
                  <span className="font-mono text-sm">{channel?.name}</span>
                </div>
              )}
            </div>

            {/* Topic */}
            <div className={`bg-muted/30 rounded-lg ${isMobile ? 'p-4' : 'p-4'}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`font-medium ${isMobile ? 'text-base' : 'text-base'}`}>Topic</h3>
                {(isAdmin || isChannelCreator) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingTopic(!editingTopic)}
                    className="text-primary hover:text-primary/80"
                  >
                    {editingTopic ? 'Cancel' : 'Edit'}
                  </Button>
                )}
              </div>
              {editingTopic ? (
                <div className="flex gap-2">
                  <Input
                    value={channelTopic}
                    onChange={(e) => setChannelTopic(e.target.value)}
                    placeholder="Add a topic"
                    className="flex-1"
                  />
                  <Button onClick={() => setEditingTopic(false)} size="sm">Save</Button>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  {channelTopic || 'Add a topic'}
                </p>
              )}
            </div>

            {/* Description */}
            <div className={`bg-muted/30 rounded-lg ${isMobile ? 'p-4' : 'p-4'}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`font-medium ${isMobile ? 'text-base' : 'text-base'}`}>Description</h3>
                {(isAdmin || isChannelCreator) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingDescription(!editingDescription)}
                    className="text-primary hover:text-primary/80"
                  >
                    {editingDescription ? 'Cancel' : 'Edit'}
                  </Button>
                )}
              </div>
              {editingDescription ? (
                <div className="space-y-3">
                  <Textarea
                    value={channelDescription}
                    onChange={(e) => setChannelDescription(e.target.value)}
                    placeholder="Add a description"
                    rows={3}
                  />
                  <Button onClick={handleSaveChanges} size="sm">Save</Button>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {channelDescription || 'Add a description'}
                </p>
              )}
            </div>

            {/* Created by */}
            <div className="space-y-3">
              <h3 className={`font-medium ${isMobile ? 'text-base' : 'text-base'}`}>Created by</h3>
              <p className="text-sm text-muted-foreground">
                {profile?.first_name} {profile?.last_name} on {formatDate(new Date().toISOString())}
              </p>
            </div>
          </TabsContent>

          <TabsContent value="members" className={`${isMobile ? 'p-4' : 'p-6'} space-y-6 mt-0`}>
            <div className="flex items-center justify-between">
              <h3 className={`font-semibold ${isMobile ? 'text-lg' : 'text-lg'}`}>Members ({members.length})</h3>
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
              <div className={`border rounded-lg ${isMobile ? 'p-4' : 'p-4'} bg-muted/50`}>
                <h4 className="text-sm font-medium mb-4">Add New Members</h4>
                <div className="grid gap-3 max-h-32 overflow-y-auto">
                  {availableUsers
                    .filter(user => !members.find(member => member.id === user.id))
                    .map((user) => (
                    <div key={user.id} className={`flex items-center justify-between ${isMobile ? 'p-3' : 'p-2'} hover:bg-background rounded`}>
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
            <div className="space-y-3">
              {members.map((member) => (
                <div key={member.id} className={`flex items-center justify-between ${isMobile ? 'p-4' : 'p-3'} border rounded-lg`}>
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
          </TabsContent>

          <TabsContent value="files" className={`${isMobile ? 'p-4' : 'p-6'} space-y-6 mt-0`}>
            <h3 className={`font-semibold ${isMobile ? 'text-lg' : 'text-lg'}`}>Files ({channelFiles.length})</h3>
            
            {channelFiles.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No files have been shared in this channel yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {channelFiles.map((file) => (
                  <div key={file.id} className={`flex items-center justify-between ${isMobile ? 'p-4' : 'p-3'} border rounded-lg hover:bg-muted/50`}>
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{getFileIcon(file.type)}</div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(file.size)} • Shared by {file.uploadedBy} • {formatDate(file.uploadedAt)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        title="Preview"
                        onClick={() => handlePreviewFile(file)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        title="Download"
                        onClick={() => handleDownloadFile(file)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings" className={`${isMobile ? 'p-4' : 'p-6'} space-y-6 mt-0`}>
            <div className="space-y-6">
              {/* DM specific settings */}
              {isDM ? (
                <div className={`flex items-center justify-between ${isMobile ? 'p-4' : 'p-4'} border rounded-lg`}>
                  <div className="flex items-center gap-3">
                    <X className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <h4 className="font-medium text-destructive">Close Direct Message</h4>
                      <p className="text-sm text-muted-foreground">
                        This will close the direct message conversation.
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      if (onCloseDM) {
                        onCloseDM();
                        onOpenChange(false);
                      }
                    }}
                  >
                    Close DM
                  </Button>
                </div>
              ) : (
                <>
                  {/* Change to Public Channel */}
                  {channel?.type === 'private' && (isAdmin || isChannelCreator) && (
                    <div className={`flex items-center justify-between ${isMobile ? 'p-4' : 'p-4'} border rounded-lg`}>
                      <div className="flex items-center gap-3">
                        <Globe className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1">
                          <h4 className="font-medium">Change to a public channel</h4>
                          <p className="text-sm text-muted-foreground">
                            Anyone in your workspace will be able to view and join this channel.
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className={isMobile ? 'shrink-0' : ''}>
                        Change to public
                      </Button>
                    </div>
                  )}

                  {/* Archive Channel */}
                  {(isAdmin || isChannelCreator) && (
                    <div className={`flex items-center justify-between ${isMobile ? 'p-4' : 'p-4'} border rounded-lg`}>
                      <div className="flex items-center gap-3">
                        <Archive className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1">
                          <h4 className="font-medium">Archive channel for everyone</h4>
                          <p className="text-sm text-muted-foreground">
                            Hide this channel from the channel list for all workspace members.
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={handleArchiveChannel} className={isMobile ? 'shrink-0' : ''}>
                        Archive channel
                      </Button>
                    </div>
                  )}

                  {/* Delete Channel */}
                  {(isAdmin || isChannelCreator) && (
                    <div className={`border border-destructive/20 rounded-lg ${isMobile ? 'p-4' : 'p-4'} bg-destructive/5`}>
                      <div className={`flex ${isMobile ? 'flex-col gap-4' : 'items-center justify-between'}`}>
                        <div className="flex items-center gap-3">
                          <Trash2 className="h-5 w-5 text-destructive" />
                          <div className="flex-1">
                            <h4 className="font-medium text-destructive">Delete this channel</h4>
                            <p className="text-sm text-muted-foreground">
                              Permanently delete this channel and all its messages. This cannot be undone.
                            </p>
                          </div>
                        </div>
                        {!showDeleteConfirm ? (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setShowDeleteConfirm(true)}
                            className={isMobile ? 'self-start' : ''}
                          >
                            Delete channel
                          </Button>
                        ) : (
                          <div className={`flex gap-2 ${isMobile ? 'self-start' : ''}`}>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={handleDeleteChannel}
                            >
                              Confirm delete
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
                    </div>
                  )}

                  <Separator />
                  
                  {/* Leave Channel */}
                  <div className={`flex items-center justify-between ${isMobile ? 'p-4' : 'p-4'} border rounded-lg`}>
                    <div className="flex items-center gap-3">
                      <LogOut className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <h4 className="font-medium text-destructive">Leave channel</h4>
                        <p className="text-sm text-muted-foreground">
                          You will no longer receive messages from this channel.
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleLeaveChannel} className={isMobile ? 'shrink-0' : ''}>
                      Leave channel
                    </Button>
                  </div>
                </>
              )}
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent 
          side="bottom" 
          className="h-[95vh] rounded-t-2xl p-0 flex flex-col"
        >
          <ModalContent />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden p-0 bg-background flex flex-col">
        <ModalContent />
      </DialogContent>
    </Dialog>
  );

  function getInitials(firstName: string, lastName: string) {
    return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
  }

  function getRoleColor(role: string) {
    switch (role) {
      case 'admin':
        return 'bg-red-500/10 text-red-700 border-red-200';
      case 'instructor':
        return 'bg-blue-500/10 text-blue-700 border-blue-200';
      default:
        return 'bg-green-500/10 text-green-700 border-green-200';
    }
  }
};