import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  Send, 
  MessageCircle, 
  Users, 
  User, 
  Hash, 
  Lock, 
  Plus, 
  Settings, 
  Paperclip, 
  Smile, 
  Search, 
  MoreVertical,
  Image,
  FileText,
  Download,
  Phone,
  Video,
  Bell,
  BellOff,
  Pin,
  Reply,
  MessageSquare,
  Trash2,
  Edit2,
  Share,
  Archive,
  Star,
  Flag,
  Mic,
  StopCircle,
  Play
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, isToday, isYesterday } from 'date-fns';
import { CreateChannelDialog } from './CreateChannelDialog';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  created_at: string;
  edited_at?: string;
  thread_count?: number;
  parent_id?: string;
  attachments?: MessageAttachment[];
  reactions?: Array<{ emoji: string; count: number; users: string[] }>;
  is_pinned?: boolean;
  is_deleted?: boolean;
  message_type: 'text' | 'image' | 'file' | 'voice' | 'system';
}

interface MessageAttachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  thumbnail?: string;
}

interface Channel {
  id: string;
  name: string;
  description: string;
  type: 'public' | 'private' | 'direct';
  is_admin_only: boolean;
  created_by: string;
  member_count: number;
  unread_count?: number;
  last_message?: string;
  last_activity?: string;
  is_muted?: boolean;
  notifications_enabled?: boolean;
  pinned_messages?: string[];
}

interface UserPresence {
  user_id: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  last_seen: string;
  activity?: string;
}

interface VoiceMessage {
  id: string;
  url: string;
  duration: number;
  waveform?: number[];
}

export const EnhancedChatInterface = () => {
  const isMobile = useIsMobile();
  const [messages, setMessages] = useState<Message[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<string>('general');
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [userPresence, setUserPresence] = useState<Record<string, UserPresence>>({});
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [uploadingFiles, setUploadingFiles] = useState<boolean>(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [messageSearchQuery, setMessageSearchQuery] = useState('');
  const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]);
  const [showSidebar, setShowSidebar] = useState(!isMobile);
  
  const { profile } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const voiceRecorderRef = useRef<MediaRecorder | null>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  // Real-time setup with Supabase
  useEffect(() => {
    if (!profile) return;

    // Set up real-time subscription for messages
    const messageChannel = supabase
      .channel('messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages'
      }, (payload) => {
        const newMessage = payload.new as Message;
        setMessages(prev => [...prev, newMessage]);
        scrollToBottom();
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'chat_messages'
      }, (payload) => {
        const updatedMessage = payload.new as Message;
        setMessages(prev => prev.map(msg => 
          msg.id === updatedMessage.id ? updatedMessage : msg
        ));
      })
      .subscribe();

    // Set up presence tracking
    const presenceChannel = supabase
      .channel('online-users')
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        setUserPresence({});
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('User joined:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('User left:', leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            user_id: profile.id,
            status: 'online',
            last_seen: new Date().toISOString(),
            activity: 'browsing'
          });
        }
      });

    return () => {
      supabase.removeChannel(messageChannel);
      supabase.removeChannel(presenceChannel);
    };
  }, [profile]);

  // Initialize mock data (replace with actual Supabase queries)
  useEffect(() => {
    initializeMockData();
  }, [profile]);

  const initializeMockData = () => {
    // Mock channels
    const mockChannels: Channel[] = [
      {
        id: 'general',
        name: 'general',
        description: 'Academy-wide announcements and discussions',
        type: 'public',
        is_admin_only: false,
        created_by: 'admin',
        member_count: 25,
        unread_count: 2,
        last_message: 'Welcome to the enhanced academy chat!',
        last_activity: new Date(Date.now() - 300000).toISOString(),
        notifications_enabled: true
      },
      {
        id: 'beginners',
        name: 'beginners',
        description: 'Support for new students',
        type: 'public',
        is_admin_only: false,
        created_by: 'admin',
        member_count: 12,
        unread_count: 0,
        last_message: 'Great progress in class today!',
        last_activity: new Date(Date.now() - 600000).toISOString(),
        notifications_enabled: true
      },
      {
        id: 'tournament-prep',
        name: 'tournament-prep',
        description: 'Tournament training and preparation',
        type: 'public',
        is_admin_only: false,
        created_by: 'admin',
        member_count: 18,
        unread_count: 5,
        last_message: 'Next tournament is in 3 weeks',
        last_activity: new Date(Date.now() - 120000).toISOString(),
        notifications_enabled: true
      }
    ];

    // Add admin channels
    if (profile?.role === 'admin') {
      mockChannels.push(
        {
          id: 'admin-team',
          name: 'admin-team',
          description: 'Private admin discussions',
          type: 'private',
          is_admin_only: true,
          created_by: 'admin',
          member_count: 3,
          unread_count: 0,
          last_message: 'Staff meeting notes',
          last_activity: new Date(Date.now() - 1200000).toISOString(),
          notifications_enabled: true
        }
      );
    }

    // Mock messages with enhanced features
    const mockMessages: Message[] = [
      {
        id: '1',
        content: 'Welcome to our enhanced academy chat! 🥋 This new system supports file sharing, voice messages, reactions, and much more.',
        sender_id: 'instructor-1',
        sender_name: 'Sensei Johnson',
        sender_role: 'admin',
        created_at: new Date(Date.now() - 7200000).toISOString(),
        message_type: 'text',
        is_pinned: true,
        reactions: [
          { emoji: '👋', count: 8, users: ['user1', 'user2', 'user3'] },
          { emoji: '🥋', count: 12, users: ['user4', 'user5'] },
          { emoji: '🔥', count: 5, users: ['user6'] }
        ]
      },
      {
        id: '2',
        content: 'Amazing! Love the new features. The file sharing will be so helpful for sharing training videos.',
        sender_id: 'student-1',
        sender_name: 'Alex Chen',
        sender_role: 'student',
        created_at: new Date(Date.now() - 6900000).toISOString(),
        message_type: 'text',
        reactions: [
          { emoji: '💯', count: 3, users: ['user1', 'user2'] }
        ]
      },
      {
        id: '3',
        content: 'Check out this training schedule for next week. Let me know if you have any conflicts.',
        sender_id: 'instructor-1',
        sender_name: 'Sensei Johnson',
        sender_role: 'admin',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        message_type: 'file',
        attachments: [
          {
            id: 'att1',
            name: 'training-schedule-week-12.pdf',
            url: '#',
            size: 245760,
            type: 'application/pdf'
          }
        ],
        thread_count: 4
      },
      {
        id: '4',
        content: 'Perfect timing! I was just about to ask about the schedule. 👍',
        sender_id: 'student-2',
        sender_name: 'Sarah Kim',
        sender_role: 'student',
        created_at: new Date(Date.now() - 1800000).toISOString(),
        message_type: 'text',
        parent_id: '3',
        reactions: [
          { emoji: '👍', count: 6, users: ['user1', 'user2', 'user3', 'user4'] }
        ]
      }
    ];

    setChannels(mockChannels);
    setMessages(mockMessages);
    setPinnedMessages(mockMessages.filter(msg => msg.is_pinned));
    setLoading(false);
  };

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !profile) return;

    const message: Message = {
      id: Date.now().toString(),
      content: newMessage.trim(),
      sender_id: profile.id,
      sender_name: `${profile.first_name} ${profile.last_name}`,
      sender_role: profile.role,
      created_at: new Date().toISOString(),
      message_type: 'text',
      parent_id: replyToMessage?.id
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
    setReplyToMessage(null);

    // Update channel's last activity
    setChannels(prev => prev.map(channel => 
      channel.id === activeChannel 
        ? { ...channel, last_message: newMessage.trim(), last_activity: new Date().toISOString() }
        : channel
    ));

    // TODO: Send to Supabase
    toast({ title: "Message sent!" });
  };

  // File upload
  const handleFileUpload = async (files: FileList) => {
    if (!files.length || !profile) return;

    setUploadingFiles(true);
    
    try {
      for (const file of Array.from(files)) {
        // Simulate file upload
        const attachment: MessageAttachment = {
          id: Date.now().toString(),
          name: file.name,
          url: URL.createObjectURL(file),
          size: file.size,
          type: file.type,
          thumbnail: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
        };

        const message: Message = {
          id: Date.now().toString(),
          content: `Shared ${file.type.startsWith('image/') ? 'an image' : 'a file'}: ${file.name}`,
          sender_id: profile.id,
          sender_name: `${profile.first_name} ${profile.last_name}`,
          sender_role: profile.role,
          created_at: new Date().toISOString(),
          message_type: file.type.startsWith('image/') ? 'image' : 'file',
          attachments: [attachment]
        };

        setMessages(prev => [...prev, message]);
      }

      toast({ title: `${files.length} file(s) uploaded successfully` });
    } catch (error) {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploadingFiles(false);
    }
  };

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      voiceRecorderRef.current = recorder;
      
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        
        const voiceMessage: Message = {
          id: Date.now().toString(),
          content: 'Voice message',
          sender_id: profile!.id,
          sender_name: `${profile!.first_name} ${profile!.last_name}`,
          sender_role: profile!.role,
          created_at: new Date().toISOString(),
          message_type: 'voice',
          attachments: [{
            id: Date.now().toString(),
            name: 'voice-message.webm',
            url,
            size: blob.size,
            type: 'audio/webm'
          }]
        };

        setMessages(prev => [...prev, voiceMessage]);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      
      // Start duration counter
      const startTime = Date.now();
      const interval = setInterval(() => {
        setRecordingDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);

      recorder.onstop = () => {
        clearInterval(interval);
        setRecordingDuration(0);
      };

    } catch (error) {
      toast({ title: "Could not access microphone", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    if (voiceRecorderRef.current && isRecording) {
      voiceRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Message reactions
  const addReaction = (messageId: string, emoji: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const reactions = msg.reactions || [];
        const existingReaction = reactions.find(r => r.emoji === emoji);
        
        if (existingReaction) {
          // Toggle user's reaction
          const userReacted = existingReaction.users.includes(profile!.id);
          if (userReacted) {
            existingReaction.count--;
            existingReaction.users = existingReaction.users.filter(id => id !== profile!.id);
            if (existingReaction.count === 0) {
              return { ...msg, reactions: reactions.filter(r => r.emoji !== emoji) };
            }
          } else {
            existingReaction.count++;
            existingReaction.users.push(profile!.id);
          }
        } else {
          reactions.push({
            emoji,
            count: 1,
            users: [profile!.id]
          });
        }
        
        return { ...msg, reactions };
      }
      return msg;
    }));
  };

  // Pin/unpin message
  const togglePinMessage = (messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, is_pinned: !msg.is_pinned } : msg
    ));
    
    setPinnedMessages(prev => {
      const message = messages.find(m => m.id === messageId);
      if (!message) return prev;
      
      if (message.is_pinned) {
        return prev.filter(m => m.id !== messageId);
      } else {
        return [...prev, { ...message, is_pinned: true }];
      }
    });
  };

  // Filter messages based on search
  const filteredMessages = messages.filter(msg => 
    !messageSearchQuery || 
    msg.content.toLowerCase().includes(messageSearchQuery.toLowerCase()) ||
    msg.sender_name.toLowerCase().includes(messageSearchQuery.toLowerCase())
  );

  // Get message time formatting
  const getMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    if (isToday(date)) {
      return format(date, 'h:mm a');
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, 'h:mm a')}`;
    } else {
      return format(date, 'MMM d, h:mm a');
    }
  };

  // Get channel icon
  const getChannelIcon = (channel: Channel) => {
    if (channel.type === 'direct') return <User className="h-4 w-4" />;
    if (channel.type === 'private' || channel.is_admin_only) return <Lock className="h-4 w-4" />;
    return <Hash className="h-4 w-4" />;
  };

  // Get role styling
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'instructor':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Loading enhanced chat...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentChannel = channels.find(c => c.id === activeChannel);

  return (
    <div className={`${isMobile ? 'h-[calc(100vh-8rem)]' : 'h-[calc(100vh-12rem)]'} flex flex-col`}>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 overflow-hidden">
        
        {/* Enhanced Channels Sidebar */}
        {(!isMobile || showSidebar) && (
          <Card className="lg:col-span-1 flex flex-col">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">
                  Academy Chat
                </CardTitle>
                <div className="flex gap-1">
                  {profile?.role === 'admin' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCreateChannel(true)}
                      className="h-8 w-8 p-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Enhanced Search */}
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search channels..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-8 text-sm"
                />
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 overflow-y-auto p-0">
              <ScrollArea className="h-full">
                <div className="space-y-1 p-2">
                  {/* Pinned Messages Section */}
                  {pinnedMessages.length > 0 && (
                    <>
                      <div className="px-2 py-1">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                          <Pin className="h-3 w-3" />
                          Pinned
                        </h3>
                      </div>
                      <div className="space-y-1 mb-4">
                        {pinnedMessages.slice(0, 3).map((msg) => (
                          <div key={msg.id} className="px-2 py-1 text-xs bg-muted/50 rounded">
                            <div className="font-medium truncate">{msg.sender_name}</div>
                            <div className="text-muted-foreground truncate">{msg.content}</div>
                          </div>
                        ))}
                      </div>
                      <Separator className="my-2" />
                    </>
                  )}

                  {/* Public Channels */}
                  <div className="px-2 py-1">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Channels
                    </h3>
                  </div>
                  
                  {channels
                    .filter(channel => 
                      channel.type === 'public' &&
                      (channel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       channel.description.toLowerCase().includes(searchQuery.toLowerCase()))
                    )
                    .map((channel) => (
                      <Button
                        key={channel.id}
                        variant={activeChannel === channel.id ? "secondary" : "ghost"}
                        className="w-full justify-start text-left h-auto p-2 font-normal"
                        onClick={() => setActiveChannel(channel.id)}
                      >
                        <div className="flex items-center gap-2 w-full">
                          {getChannelIcon(channel)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-sm truncate">#{channel.name}</span>
                              <div className="flex items-center gap-1">
                                {channel.is_muted && <BellOff className="h-3 w-3 text-muted-foreground" />}
                                {(channel.unread_count || 0) > 0 && (
                                  <Badge variant="destructive" className="px-1.5 py-0.5 text-xs min-w-0">
                                    {channel.unread_count}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {channel.last_message}
                            </div>
                          </div>
                        </div>
                      </Button>
                    ))}

                  {/* Private Channels */}
                  {profile?.role === 'admin' && channels.some(c => c.is_admin_only) && (
                    <>
                      <div className="px-2 py-1 mt-4">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Private Channels
                        </h3>
                      </div>
                      
                      {channels
                        .filter(channel => channel.is_admin_only)
                        .map((channel) => (
                          <Button
                            key={channel.id}
                            variant={activeChannel === channel.id ? "secondary" : "ghost"}
                            className="w-full justify-start text-left h-auto p-2 font-normal"
                            onClick={() => setActiveChannel(channel.id)}
                          >
                            <div className="flex items-center gap-2 w-full">
                              {getChannelIcon(channel)}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm truncate">{channel.name}</span>
                                  {(channel.unread_count || 0) > 0 && (
                                    <Badge variant="destructive" className="px-1.5 py-0.5 text-xs">
                                      {channel.unread_count}
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {channel.last_message}
                                </div>
                              </div>
                            </div>
                          </Button>
                        ))}
                    </>
                  )}

                  {/* Online Users */}
                  <div className="px-2 py-1 mt-4">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Online ({Object.keys(userPresence).length})
                    </h3>
                  </div>
                  <div className="space-y-1">
                    {Object.entries(userPresence).map(([userId, presence]) => (
                      <div key={userId} className="flex items-center gap-2 px-2 py-1">
                        <div className="relative">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {presence.user_id.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className={cn(
                            "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background",
                            presence.status === 'online' ? 'bg-green-500' :
                            presence.status === 'away' ? 'bg-yellow-500' :
                            presence.status === 'busy' ? 'bg-red-500' : 'bg-gray-500'
                          )} />
                        </div>
                        <span className="text-xs truncate">{presence.user_id}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Enhanced Chat Messages Area */}
        <Card className={`${isMobile && showSidebar ? 'hidden' : ''} ${!isMobile ? 'lg:col-span-3' : ''} flex flex-col`}>
          {/* Enhanced Channel Header */}
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isMobile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSidebar(!showSidebar)}
                    className="h-8 w-8 p-0"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                )}
                {currentChannel && getChannelIcon(currentChannel)}
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">
                      {currentChannel?.type === 'public' ? '#' : ''}{currentChannel?.name}
                    </CardTitle>
                    {currentChannel?.is_muted && (
                      <BellOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {currentChannel?.description} • {currentChannel?.member_count} members
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Message Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search messages..."
                    value={messageSearchQuery}
                    onChange={(e) => setMessageSearchQuery(e.target.value)}
                    className="pl-9 h-8 w-48 text-sm"
                  />
                </div>
                
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Video className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          {/* Enhanced Messages Area */}
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            <ScrollArea className="h-full">
              {replyToMessage && (
                <div className="mb-4 p-3 bg-muted/50 rounded-lg border-l-4 border-primary">
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <span className="font-medium">Replying to {replyToMessage.sender_name}</span>
                      <p className="text-muted-foreground truncate">{replyToMessage.content}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReplyToMessage(null)}
                      className="h-6 w-6 p-0"
                    >
                      ×
                    </Button>
                  </div>
                </div>
              )}

              {filteredMessages.map((message, index) => {
                const prevMessage = filteredMessages[index - 1];
                const showAvatar = !prevMessage || prevMessage.sender_id !== message.sender_id;
                const timeDiff = prevMessage ? 
                  new Date(message.created_at).getTime() - new Date(prevMessage.created_at).getTime() 
                  : Infinity;
                const showTimeBreak = timeDiff > 300000; // 5 minutes

                return (
                  <div key={message.id}>
                    {showTimeBreak && (
                      <div className="text-center my-4">
                        <span className="text-xs text-muted-foreground bg-background px-2">
                          {getMessageTime(message.created_at)}
                        </span>
                      </div>
                    )}
                    
                    <div className={cn(
                      "flex gap-3 group hover:bg-muted/30 -mx-4 px-4 py-1 rounded relative",
                      !showAvatar ? 'mt-1' : 'mt-3',
                      message.is_pinned && 'bg-primary/5 border-l-2 border-primary'
                    )}>
                      {/* Message actions menu */}
                      <div className="absolute right-4 top-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-1 bg-background border rounded-md shadow-sm p-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => addReaction(message.id, '👍')}
                          >
                            <Smile className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => setReplyToMessage(message)}
                          >
                            <Reply className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => togglePinMessage(message.id)}
                          >
                            <Pin className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                          >
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="w-9 flex justify-center">
                        {showAvatar ? (
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="text-sm">
                              {message.sender_name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 leading-6">
                            {format(new Date(message.created_at), 'h:mm')}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex-1 space-y-1">
                        {showAvatar && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm">{message.sender_name}</span>
                            <Badge variant="outline" className={`text-xs ${getRoleColor(message.sender_role)}`}>
                              {message.sender_role}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {getMessageTime(message.created_at)}
                            </span>
                            {message.is_pinned && (
                              <Pin className="h-3 w-3 text-primary" />
                            )}
                            {message.edited_at && (
                              <span className="text-xs text-muted-foreground">(edited)</span>
                            )}
                          </div>
                        )}
                        
                        {/* Reply indicator */}
                        {message.parent_id && (
                          <div className="text-xs text-muted-foreground border-l-2 border-muted pl-2 mb-1">
                            Replying to a message
                          </div>
                        )}

                        {/* Message content based on type */}
                        <div className="text-sm text-foreground leading-relaxed">
                          {message.message_type === 'text' && message.content}
                          
                          {message.message_type === 'voice' && message.attachments?.[0] && (
                            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <Play className="h-4 w-4" />
                              </Button>
                              <div className="flex-1">
                                <div className="h-1 bg-muted rounded"></div>
                              </div>
                              <span className="text-xs text-muted-foreground">0:30</span>
                            </div>
                          )}
                          
                          {(message.message_type === 'file' || message.message_type === 'image') && message.attachments && (
                            <div className="space-y-2">
                              {message.content && <div>{message.content}</div>}
                              {message.attachments.map((attachment) => (
                                <div key={attachment.id} className="border rounded-lg p-3 bg-muted/30">
                                  {attachment.type.startsWith('image/') ? (
                                    <div className="space-y-2">
                                      <img 
                                        src={attachment.url} 
                                        alt={attachment.name}
                                        className="max-w-sm max-h-64 rounded object-cover"
                                      />
                                      <div className="text-xs text-muted-foreground">{attachment.name}</div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-3">
                                      <FileText className="h-8 w-8 text-muted-foreground" />
                                      <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">{attachment.name}</div>
                                        <div className="text-xs text-muted-foreground">
                                          {(attachment.size / 1024).toFixed(1)} KB
                                        </div>
                                      </div>
                                      <Button variant="ghost" size="sm">
                                        <Download className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Reactions */}
                        {message.reactions && message.reactions.length > 0 && (
                          <div className="flex gap-1 mt-2 flex-wrap">
                            {message.reactions.map((reaction, idx) => (
                              <Button
                                key={idx}
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs hover:bg-primary/10"
                                onClick={() => addReaction(message.id, reaction.emoji)}
                              >
                                {reaction.emoji} {reaction.count}
                              </Button>
                            ))}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                              onClick={() => setShowEmojiPicker(true)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        )}

                        {/* Thread indicator */}
                        {message.thread_count && message.thread_count > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-primary hover:text-primary/80 h-auto p-1"
                          >
                            <MessageSquare className="h-3 w-3 mr-1" />
                            {message.thread_count} {message.thread_count === 1 ? 'reply' : 'replies'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </ScrollArea>
          </CardContent>

          {/* Enhanced Message Input */}
          <div className="p-4 border-t">
            <div className="flex items-end gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                className="hidden"
                multiple
                accept="image/*,application/pdf,.doc,.docx,.txt"
              />
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingFiles}
                className="h-9 w-9 p-0 shrink-0"
              >
                <Paperclip className="h-4 w-4" />
              </Button>

              <div className="flex-1">
                <div className="relative">
                  <Input
                    ref={messageInputRef}
                    placeholder={`Message #${currentChannel?.name || 'channel'}`}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="pr-20"
                    disabled={uploadingFiles}
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => setShowEmojiPicker(true)}
                    >
                      <Smile className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Voice recording */}
              <Button
                variant={isRecording ? "destructive" : "ghost"}
                size="sm"
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onMouseLeave={stopRecording}
                className="h-9 w-9 p-0 shrink-0"
              >
                {isRecording ? <StopCircle className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>

              <Button 
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || uploadingFiles}
                size="sm"
                className="h-9 w-9 p-0 shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>

            {isRecording && (
              <div className="mt-2 text-center text-sm text-red-600">
                Recording... {recordingDuration}s
              </div>
            )}

            {uploadingFiles && (
              <div className="mt-2 text-center text-sm text-muted-foreground">
                Uploading files...
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Create Channel Dialog */}
      {profile?.role === 'admin' && (
        <CreateChannelDialog 
          open={showCreateChannel}
          onOpenChange={setShowCreateChannel}
          onChannelCreated={(channel) => {
            setChannels(prev => [...prev, channel]);
            setActiveChannel(channel.id);
          }}
        />
      )}
    </div>
  );
};