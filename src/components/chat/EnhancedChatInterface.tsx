import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ChatSidebar } from './ChatSidebar';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { CreateChannelDialog } from './CreateChannelDialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { ArrowLeft, Hash, Lock, Crown, Users } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  created_at: string;
  thread_count?: number;
  reactions?: Array<{ emoji: string; count: number; users: string[] }>;
  attachments?: Array<{ url: string; type: string; name: string }>;
  parent_message_id?: string;
}

interface Channel {
  id: string;
  name: string;
  description: string;
  type: 'public' | 'private' | 'premium';
  is_admin_only: boolean;
  created_by: string;
  member_count: number;
  unread_count?: number;
  last_message?: string;
  last_activity?: string;
}

interface UserPresence {
  user_id: string;
  name: string;
  online_at: string;
  status: 'online' | 'away' | 'busy';
}

export const EnhancedChatInterface = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<string>('general');
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showChannels, setShowChannels] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  const { profile } = useAuth();
  const { subscriptionInfo } = useSubscription();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Initialize channels with subscription-aware features
  useEffect(() => {
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
        last_message: 'Welcome to the academy! 🥋',
        last_activity: new Date(Date.now() - 300000).toISOString()
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
        last_activity: new Date(Date.now() - 600000).toISOString()
      }
    ];

    // Add premium channels for subscribers
    if (subscriptionInfo?.subscribed) {
      mockChannels.push({
        id: 'premium-techniques',
        name: 'premium-techniques',
        description: 'Advanced techniques and masterclasses',
        type: 'premium',
        is_admin_only: false,
        created_by: 'admin',
        member_count: 8,
        unread_count: 0,
        last_message: 'New advanced kata breakdown available',
        last_activity: new Date(Date.now() - 420000).toISOString()
      });
    }

    // Add admin channels if user is admin
    if (profile?.role === 'admin') {
      mockChannels.push({
        id: 'admin-team',
        name: 'admin-team',
        description: 'Private admin discussions',
        type: 'private',
        is_admin_only: true,
        created_by: 'admin',
        member_count: 3,
        unread_count: 0,
        last_message: 'Staff meeting notes',
        last_activity: new Date(Date.now() - 1200000).toISOString()
      });
    }

    // Enhanced mock messages
    const mockMessages: Message[] = [
      {
        id: '1',
        content: 'Welcome to the academy chat! Feel free to ask questions and connect with fellow martial artists. 🥋',
        sender_id: 'instructor-1',
        sender_name: 'Sensei Johnson',
        sender_role: 'admin',
        created_at: new Date(Date.now() - 7200000).toISOString(),
        reactions: [
          { emoji: '👋', count: 5, users: ['user1', 'user2'] },
          { emoji: '🥋', count: 3, users: ['user3'] }
        ]
      },
      {
        id: '2',
        content: 'Thank you! Excited to be part of this community.',
        sender_id: 'student-1',
        sender_name: 'Alex Chen',
        sender_role: 'student',
        created_at: new Date(Date.now() - 6900000).toISOString()
      },
      {
        id: '3',
        content: 'Classes are canceled on Monday due to the holiday. We will resume normal schedule on Tuesday.',
        sender_id: 'instructor-1',
        sender_name: 'Sensei Johnson',
        sender_role: 'admin',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        thread_count: 2
      }
    ];

    setChannels(mockChannels);
    setMessages(mockMessages);
    setLoading(false);
  }, [profile, subscriptionInfo]);

  // Real-time presence tracking
  useEffect(() => {
    if (!profile) return;

    const channel = supabase.channel(`chat-presence-${activeChannel}`, {
      config: { presence: { key: profile.id } }
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        const users = Object.values(newState).flat();
        const validUsers = users
          .filter((user: any) => user.user_id && user.name)
          .map((user: any) => ({
            user_id: user.user_id,
            name: user.name,
            online_at: user.online_at || new Date().toISOString(),
            status: user.status || 'online'
          })) as UserPresence[];
        setOnlineUsers(validUsers);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: profile.id,
            name: `${profile.first_name} ${profile.last_name}`,
            online_at: new Date().toISOString(),
            status: 'online' as const
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeChannel, profile]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !profile) return;

    if (editingMessageId) {
      // Update existing message
      setMessages(prev => prev.map(msg => 
        msg.id === editingMessageId 
          ? { ...msg, content: newMessage.trim() }
          : msg
      ));
      setEditingMessageId(null);
      toast({
        title: "Message updated",
        description: "Your message has been edited successfully."
      });
    } else {
      // Create new message
      const message: Message = {
        id: Date.now().toString(),
        content: newMessage.trim(),
        sender_id: profile.id,
        sender_name: `${profile.first_name} ${profile.last_name}`,
        sender_role: profile.role,
        created_at: new Date().toISOString(),
        parent_message_id: replyingTo || undefined
      };

      setMessages(prev => [...prev, message]);

      // Update channel's last activity
      setChannels(prev => prev.map(channel => 
        channel.id === activeChannel 
          ? { ...channel, last_message: newMessage.trim(), last_activity: new Date().toISOString() }
          : channel
      ));
    }

    setNewMessage('');
    setReplyingTo(null);
  };

  const handleChannelSwitch = (channelId: string) => {
    const channel = channels.find(c => c.id === channelId);
    
    if (channel?.type === 'premium' && !subscriptionInfo?.subscribed) {
      toast({
        title: "Premium Feature",
        description: "This channel is available for premium members only.",
        action: (
          <Button variant="outline" size="sm" onClick={() => navigate('/subscription')}>
            Upgrade
          </Button>
        )
      });
      return;
    }

    setActiveChannel(channelId);
    setChannels(prev => prev.map(c => 
      c.id === channelId ? { ...c, unread_count: 0 } : c
    ));
    
    if (isMobile) {
      setShowChannels(false);
    }
  };

  const handleReaction = (messageId: string, emoji: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const reactions = msg.reactions || [];
        const existingReaction = reactions.find(r => r.emoji === emoji);
        
        if (existingReaction) {
          // Toggle reaction
          const userInReaction = existingReaction.users.includes(profile?.id || '');
          if (userInReaction) {
            // Remove user's reaction
            if (existingReaction.count === 1) {
              return { ...msg, reactions: reactions.filter(r => r.emoji !== emoji) };
            } else {
              return {
                ...msg,
                reactions: reactions.map(r => 
                  r.emoji === emoji 
                    ? { ...r, count: r.count - 1, users: r.users.filter(u => u !== profile?.id) }
                    : r
                )
              };
            }
          } else {
            // Add user's reaction
            return {
              ...msg,
              reactions: reactions.map(r => 
                r.emoji === emoji 
                  ? { ...r, count: r.count + 1, users: [...r.users, profile?.id || ''] }
                  : r
              )
            };
          }
        } else {
          // Add new reaction
          return {
            ...msg,
            reactions: [...reactions, { emoji, count: 1, users: [profile?.id || ''] }]
          };
        }
      }
      return msg;
    }));
  };

  const handleReply = (messageId: string) => {
    setReplyingTo(messageId);
    // Focus input would go here
  };

  const handleEdit = (messageId: string, content: string) => {
    // Set the message content to the input for editing
    setNewMessage(content);
    setEditingMessageId(messageId);
    // Focus the input (would need ref in real implementation)
  };

  const handleDelete = (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
    toast({
      title: "Message deleted",
      description: "The message has been removed from the chat."
    });
  };

  const handlePin = (messageId: string) => {
    // In a real app, this would update the message in the database
    toast({
      title: "Message pinned",
      description: "The message has been pinned to the channel."
    });
  };

  const handleReport = (messageId: string, reason: string) => {
    // In a real app, this would send a report to admins
    toast({
      title: "Message reported",
      description: "Thank you for your report. We'll review it shortly."
    });
  };

  const handleToggleThread = (messageId: string) => {
    setExpandedThreads(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  const getThreadReplies = (messageId: string): Message[] => {
    return messages.filter(msg => msg.parent_message_id === messageId);
  };

  const currentChannel = channels.find(c => c.id === activeChannel);

  const getChannelIcon = (channel: Channel) => {
    if (channel.type === 'premium') return <Crown className="h-4 w-4 text-amber-500" />;
    if (channel.type === 'private' || channel.is_admin_only) return <Lock className="h-4 w-4 text-muted-foreground" />;
    return <Hash className="h-4 w-4 text-muted-foreground" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">Loading chat...</div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="h-full w-full overflow-hidden bg-background">
        <div className="relative h-full">
          {/* Mobile Channel List */}
          <div className={`absolute inset-0 z-10 transform transition-transform duration-300 ease-in-out ${
            showChannels ? 'translate-x-0' : '-translate-x-full'
          }`}>
            <ChatSidebar
              channels={channels}
              activeChannel={activeChannel}
              onChannelSelect={handleChannelSwitch}
              onCreateChannel={() => setShowCreateChannel(true)}
              className="h-full"
            />
          </div>

          {/* Mobile Chat View */}
          <div className={`absolute inset-0 transform transition-transform duration-300 ease-in-out ${
            showChannels ? 'translate-x-full' : 'translate-x-0'
          }`}>
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-4 border-b bg-background/95 backdrop-blur">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowChannels(true)}
                    className="h-8 w-8 p-0"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500/10 to-purple-600/10 flex items-center justify-center">
                    {currentChannel && getChannelIcon(currentChannel)}
                  </div>
                  
                  <div>
                    <h1 className="font-semibold">
                      {currentChannel?.type === 'public' ? '#' : ''}{currentChannel?.name}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      {currentChannel?.member_count} members • {onlineUsers.length} online
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4">
                {replyingTo && (
                  <div className="mb-4 p-2 bg-muted/50 rounded-lg text-sm">
                    Replying to message
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReplyingTo(null)}
                      className="ml-2 h-5 w-5 p-0"
                    >
                      ×
                    </Button>
                  </div>
                )}
                
                <div className="space-y-1">
                  {messages.map((message, index) => {
                    const prevMessage = messages[index - 1];
                    const isOwnMessage = message.sender_id === profile?.id;
                    const showAvatar = !prevMessage || 
                      prevMessage.sender_id !== message.sender_id || 
                      isOwnMessage !== (prevMessage.sender_id === profile?.id);

                     return (
                       <MessageBubble
                         key={message.id}
                         message={message}
                         isOwnMessage={isOwnMessage}
                         showAvatar={showAvatar}
                         onReaction={handleReaction}
                         onReply={handleReply}
                         onEdit={handleEdit}
                         onDelete={handleDelete}
                         onPin={handlePin}
                         onReport={handleReport}
                         onToggleThread={handleToggleThread}
                         showThread={expandedThreads.has(message.id)}
                         threadReplies={getThreadReplies(message.id)}
                         currentUserId={profile?.id}
                       />
                     );
                  })}
                </div>
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <MessageInput
                newMessage={newMessage}
                onNewMessageChange={setNewMessage}
                onSendMessage={handleSendMessage}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                channelName={currentChannel?.name}
              />
            </div>
          </div>
        </div>

        <CreateChannelDialog
          open={showCreateChannel}
          onOpenChange={setShowCreateChannel}
          onChannelCreated={(newChannel) => {
            setChannels(prev => [...prev, newChannel]);
            setActiveChannel(newChannel.id);
            setShowCreateChannel(false);
          }}
        />
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Sidebar */}
      <div className="w-72 min-w-72 border-r bg-background">
        <ChatSidebar
          channels={channels}
          activeChannel={activeChannel}
          onChannelSelect={handleChannelSwitch}
          onCreateChannel={() => setShowCreateChannel(true)}
          className="h-full"
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="p-4 border-b bg-background/95 backdrop-blur">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500/10 to-purple-600/10 flex items-center justify-center">
                {currentChannel && getChannelIcon(currentChannel)}
              </div>
              
              <div>
                <h1 className="font-semibold">
                  {currentChannel?.type === 'public' ? '#' : ''}{currentChannel?.name}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {currentChannel?.member_count} members • {onlineUsers.length} online
                </p>
              </div>
            </div>
            
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Users className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          {replyingTo && (
            <div className="mb-4 p-2 bg-muted/50 rounded-lg text-sm">
              Replying to message
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyingTo(null)}
                className="ml-2 h-5 w-5 p-0"
              >
                ×
              </Button>
            </div>
          )}
          
          <div className="space-y-1">
            {messages.map((message, index) => {
              const prevMessage = messages[index - 1];
              const isOwnMessage = message.sender_id === profile?.id;
              const showAvatar = !prevMessage || 
                prevMessage.sender_id !== message.sender_id || 
                isOwnMessage !== (prevMessage.sender_id === profile?.id);

              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwnMessage={isOwnMessage}
                  showAvatar={showAvatar}
                  onReaction={handleReaction}
                  onReply={handleReply}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onPin={handlePin}
                  onReport={handleReport}
                  onToggleThread={handleToggleThread}
                  showThread={expandedThreads.has(message.id)}
                  threadReplies={getThreadReplies(message.id)}
                  currentUserId={profile?.id}
                />
              );
            })}
          </div>
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <MessageInput
          newMessage={newMessage}
          onNewMessageChange={setNewMessage}
          onSendMessage={handleSendMessage}
          onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
          channelName={currentChannel?.name}
        />
      </div>

      <CreateChannelDialog
        open={showCreateChannel}
        onOpenChange={setShowCreateChannel}
        onChannelCreated={(newChannel) => {
          setChannels(prev => [...prev, newChannel]);
          setActiveChannel(newChannel.id);
          setShowCreateChannel(false);
        }}
      />
    </div>
  );
};