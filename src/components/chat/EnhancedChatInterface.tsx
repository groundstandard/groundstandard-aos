import { useState, useEffect, useRef, useMemo } from 'react';
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
import { ChannelSettingsModal } from './ChannelSettingsModal';
import { StartDMModal } from './StartDMModal';
import { useIsMobile } from '@/hooks/use-mobile';
import { ArrowLeft, Hash, Lock, Crown, Users, Settings } from 'lucide-react';
import { ChannelSetup } from './ChannelSetup';
import { DateDivider } from './DateDivider';
import { format, isSameDay } from 'date-fns';

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
  is_system_message?: boolean;
  mentioned_users?: string[];
}

// Utility function to parse attachments from message content
const parseAttachments = (content: string): { cleanContent: string; attachments: Array<{ url: string; type: string; name: string }> } => {
  const attachmentRegex = /\[Attachment: (https:\/\/[^\]]+)\]/g;
  const attachments: Array<{ url: string; type: string; name: string }> = [];
  
  let match;
  while ((match = attachmentRegex.exec(content)) !== null) {
    const url = match[1];
    let type = 'file';
    let name = 'Attachment';
    
    // Determine type based on URL
    if (url.includes('/chat-images/')) {
      type = 'image/jpeg';
      name = 'Image';
    } else if (url.includes('/chat-videos/')) {
      type = 'video/mp4';
      name = 'Video';
    } else if (url.includes('/chat-audio/')) {
      type = 'audio/webm';
      name = 'Audio Message';
    } else if (url.includes('/chat-files/')) {
      type = 'file';
      name = 'File';
    }
    
    attachments.push({ url, type, name });
  }
  
  // Remove attachment URLs from content
  const cleanContent = content.replace(attachmentRegex, '').trim();
  
  return { cleanContent, attachments };
};

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
  const [channels, setChannels] = useState<Channel[]>([]);
  const [channelMessages, setChannelMessages] = useState<{ [key: string]: Message[] }>({});
  const [activeChannel, setActiveChannel] = useState('general');
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showChannelSettings, setShowChannelSettings] = useState(false);
  const [showStartDM, setShowStartDM] = useState(false);
  const [showChannels, setShowChannels] = useState(false);
  const [directMessageUsers, setDirectMessageUsers] = useState<UserPresence[]>([]);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { profile } = useAuth();
  const { subscriptionInfo } = useSubscription();
  const { toast } = useToast();
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

    // Initialize messages for each channel
    const initialChannelMessages: Record<string, Message[]> = {
      'general': [
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
        }
      ],
      'beginners': [
        {
          id: '3',
          content: 'Welcome beginners! This is a safe space to ask any questions about basic techniques.',
          sender_id: 'instructor-2',
          sender_name: 'Instructor Sarah',
          sender_role: 'instructor',
          created_at: new Date(Date.now() - 3600000).toISOString()
        }
      ],
      'admin-team': [
        {
          id: '4',
          content: 'Staff meeting scheduled for next Wednesday at 7 PM.',
          sender_id: 'instructor-1',
          sender_name: 'Sensei Johnson',
          sender_role: 'admin',
          created_at: new Date(Date.now() - 1800000).toISOString()
        }
      ]
    };

    setChannels(mockChannels);
    setChannelMessages(initialChannelMessages);
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

  // Remove the complex auto-scroll logic and use a simpler approach
  useEffect(() => {
    // Always scroll to bottom when messages change for the active channel
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const wasAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      
      if (wasAtBottom || shouldAutoScroll) {
        setTimeout(() => {
          container.scrollTop = container.scrollHeight;
        }, 0);
      }
    }
  }, [channelMessages[activeChannel]]);

  // Check if user is near bottom when they scroll
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      // More generous threshold for auto-scroll detection
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
      setShouldAutoScroll(isNearBottom);
    }
  };

  // Reset auto-scroll when switching channels
  useEffect(() => {
    setShouldAutoScroll(true);
  }, [activeChannel]);

  const handleSendMessage = async (attachments?: Array<{url: string; type: string; name: string}>, mentionedUsers?: string[]) => {
    if (!newMessage.trim() && (!attachments || attachments.length === 0)) return;
    if (!profile) return;

    console.log('Sending message, current shouldAutoScroll:', shouldAutoScroll);

    if (editingMessageId) {
      // Update existing message
      setChannelMessages(prev => ({
        ...prev,
        [activeChannel]: (prev[activeChannel] || []).map(msg => 
          msg.id === editingMessageId 
            ? { ...msg, content: newMessage.trim() }
            : msg
        )
      }));
      setEditingMessageId(null);
      toast({
        title: "Message updated",
        description: "Your message has been edited successfully."
      });
    } else {
      // Create new message with direct attachments
      const message: Message = {
        id: Date.now().toString(),
        content: newMessage.trim(),
        sender_id: profile.id,
        sender_name: `${profile.first_name} ${profile.last_name}`,
        sender_role: profile.role,
        created_at: new Date().toISOString(),
        parent_message_id: replyingTo || undefined,
        attachments: attachments && attachments.length > 0 ? attachments : undefined,
        mentioned_users: mentionedUsers || []
      };

      console.log('Adding new message:', message.id);

      setChannelMessages(prev => ({
        ...prev,
        [activeChannel]: [...(prev[activeChannel] || []), message]
      }));

      // Force scroll to bottom immediately after state update
      setTimeout(() => {
        console.log('Attempting to scroll to bottom');
        if (messagesContainerRef.current) {
          const container = messagesContainerRef.current;
          container.scrollTop = container.scrollHeight;
          console.log('Scrolled to:', container.scrollTop, 'of', container.scrollHeight);
        }
      }, 0);

      // If this is a reply, auto-expand the thread to show the new message
      if (replyingTo) {
        setExpandedThreads(prev => new Set([...prev, replyingTo]));
      }

      // Update channel's last activity
      setChannels(prev => prev.map(channel => 
        channel.id === activeChannel 
          ? { 
              ...channel, 
              last_message: newMessage.trim() || (attachments && attachments.length > 0 ? '📎 Attachment' : ''), 
              last_activity: new Date().toISOString() 
            }
          : channel
      ));
    }

    setNewMessage('');
    setReplyingTo(null);
  };

  const handleDescriptionAdded = (description: string) => {
    setChannels(prev => prev.map(channel => 
      channel.id === activeChannel 
        ? { ...channel, description }
        : channel
    ));
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
    setReplyingTo(null);
    setEditingMessageId(null);
    
    if (isMobile) {
      setShowChannels(false);
    }
  };

  const handleDirectMessageSelect = (userId: string) => {
    // Create or switch to a direct message channel with this user
    const dmChannelId = `dm-${userId}`;
    setActiveChannel(dmChannelId);
    setReplyingTo(null);
    setEditingMessageId(null);
    
    // Initialize DM channel if it doesn't exist
    if (!channelMessages[dmChannelId]) {
      setChannelMessages(prev => ({
        ...prev,
        [dmChannelId]: []
      }));
    }
    
    if (isMobile) {
      setShowChannels(false);
    }
  };

  const handleReaction = (messageId: string, emoji: string) => {
    setChannelMessages(prev => ({
      ...prev,
      [activeChannel]: (prev[activeChannel] || []).map(msg => {
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
      })
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
    setChannelMessages(prev => ({
      ...prev,
      [activeChannel]: (prev[activeChannel] || []).filter(msg => msg.id !== messageId)
    }));
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

  const getCurrentChannelMessages = (): Message[] => {
    return channelMessages[activeChannel] || [];
  };

  const getThreadReplies = (messageId: string): Message[] => {
    return getCurrentChannelMessages().filter(msg => msg.parent_message_id === messageId);
  };

  // Get only top-level messages (not replies)
  const getTopLevelMessages = (): Message[] => {
    return getCurrentChannelMessages().filter(msg => !msg.parent_message_id);
  };

  // Group messages by date and insert date dividers
  const getMessagesWithDividers = (): (Message | { type: 'date-divider'; date: string })[] => {
    const messages = getTopLevelMessages();
    const messagesWithDividers: (Message | { type: 'date-divider'; date: string })[] = [];
    
    messages.forEach((message, index) => {
      const prevMessage = messages[index - 1];
      const messageDate = new Date(message.created_at);
      const prevMessageDate = prevMessage ? new Date(prevMessage.created_at) : null;
      
      // Add date divider if this is the first message or if the date changed
      if (!prevMessageDate || !isSameDay(messageDate, prevMessageDate)) {
        messagesWithDividers.push({
          type: 'date-divider',
          date: message.created_at
        });
      }
      
      messagesWithDividers.push(message);
    });
    
    return messagesWithDividers;
  };

  // Check if channel is new (no messages)
  const isNewChannel = (): boolean => {
    const messages = getCurrentChannelMessages();
    return messages.length === 0;
  };

  // Update thread count for messages with replies
  const getMessageWithThreadCount = (message: Message): Message => {
    const threadCount = getThreadReplies(message.id).length;
    return { ...message, thread_count: threadCount > 0 ? threadCount : undefined };
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
              onStartDM={() => setShowStartDM(true)}
              onDirectMessageSelect={handleDirectMessageSelect}
              directMessageUsers={directMessageUsers}
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
              <div 
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4"
              >
                {isNewChannel() ? (
                  <ChannelSetup 
                    channel={currentChannel!} 
                    onDescriptionAdded={handleDescriptionAdded}
                  />
                ) : (
                  <div className="space-y-1">
                    {getMessagesWithDividers().map((item, index) => {
                       if ('type' in item && item.type === 'date-divider') {
                         return <DateDivider key={`divider-${item.date}`} date={item.date} />;
                       }
                       
                       const message = item as Message;
                       const messagesWithDividers = getMessagesWithDividers();
                       const prevItem = messagesWithDividers[index - 1];
                       const prevMessage = prevItem && !('type' in prevItem) ? prevItem as Message : null;
                       const messageWithThreadCount = getMessageWithThreadCount(message);
                       const isOwnMessage = message.sender_id === profile?.id;
                       const showAvatar = !prevMessage || 
                         prevMessage.sender_id !== message.sender_id || 
                         isOwnMessage !== (prevMessage.sender_id === profile?.id);

                       return (
                         <MessageBubble
                           key={message.id}
                           message={messageWithThreadCount}
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
                    <div ref={messagesEndRef} className="h-4" />
                  </div>
                )}
              </div>

              {/* Reply Indicator */}
              {replyingTo && (
                <div className="px-4 py-2 bg-muted/50 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span>Replying to message</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReplyingTo(null)}
                      className="h-5 w-5 p-0"
                    >
                      ×
                    </Button>
                  </div>
                </div>
              )}

              {/* Input - Fixed at bottom */}
              <div className="border-t bg-background">
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
          onStartDM={() => setShowStartDM(true)}
          onDirectMessageSelect={handleDirectMessageSelect}
          directMessageUsers={directMessageUsers}
          className="h-full"
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Channel Header */}
        <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {activeChannel.startsWith('dm-') ? (
                <>
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h2 className="font-semibold">Direct Message</h2>
                    <p className="text-xs text-muted-foreground">Private conversation</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center">
                    {currentChannel?.type === 'private' && <Lock className="h-4 w-4 text-muted-foreground mr-1" />}
                    {currentChannel?.type === 'premium' && <Crown className="h-4 w-4 text-yellow-500 mr-1" />}
                    <Hash className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h2 className="font-semibold">{currentChannel?.name}</h2>
                    {currentChannel?.description && (
                      <p className="text-xs text-muted-foreground">{currentChannel.description}</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onlineUsers.length > 0 && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                {onlineUsers.length}
              </div>
            )}
            
            {/* Channel Settings Button */}
            {!activeChannel.startsWith('dm-') && currentChannel && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowChannelSettings(true)}
                className="h-8 w-8 p-0"
                title="Channel settings"
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div 
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4"
        >
          {isNewChannel() ? (
            <ChannelSetup 
              channel={currentChannel!} 
              onDescriptionAdded={handleDescriptionAdded}
            />
          ) : (
            <div className="space-y-1">
              {getMessagesWithDividers().map((item, index) => {
                if ('type' in item && item.type === 'date-divider') {
                  return <DateDivider key={`divider-${item.date}`} date={item.date} />;
                }
                
                const message = item as Message;
                const messagesWithDividers = getMessagesWithDividers();
                const prevItem = messagesWithDividers[index - 1];
                const prevMessage = prevItem && !('type' in prevItem) ? prevItem as Message : null;
                const messageWithThreadCount = getMessageWithThreadCount(message);
                const isOwnMessage = message.sender_id === profile?.id;
                const showAvatar = !prevMessage || 
                  prevMessage.sender_id !== message.sender_id || 
                  isOwnMessage !== (prevMessage.sender_id === profile?.id);

                return (
                  <MessageBubble
                    key={message.id}
                    message={messageWithThreadCount}
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
              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </div>

        {/* Reply Indicator */}
        {replyingTo && (
          <div className="px-4 py-2 bg-muted/50 border-t">
            <div className="flex items-center justify-between text-sm">
              <span>Replying to message</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyingTo(null)}
                className="h-5 w-5 p-0"
              >
                ×
              </Button>
            </div>
          </div>
        )}

        {/* Input - Fixed at bottom */}
        <div className="border-t bg-background">
          <MessageInput
            newMessage={newMessage}
            onNewMessageChange={setNewMessage}
            onSendMessage={handleSendMessage}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
            channelName={currentChannel?.name}
          />
        </div>
      </div>

      <CreateChannelDialog
        open={showCreateChannel}
        onOpenChange={setShowCreateChannel}
        onChannelCreated={(newChannel) => {
          setChannels(prev => [...prev, newChannel]);
          
          // Create initial system message for channel creation
          const systemMessage: Message = {
            id: `system-${Date.now()}`,
            content: `joined #${newChannel.name}.`,
            sender_id: profile?.id || 'system',
            sender_name: profile ? `${profile.first_name} ${profile.last_name}` : 'User',
            sender_role: profile?.role || 'student',
            created_at: new Date().toISOString(),
            is_system_message: true
          };
          
          setChannelMessages(prev => ({
            ...prev,
            [newChannel.id]: [systemMessage]
          }));
          setActiveChannel(newChannel.id);
          setShowCreateChannel(false);
          
          toast({
            title: "Channel created",
            description: `Welcome to #${newChannel.name}!`
          });
        }}
      />

      {/* Channel Settings Modal */}
      {currentChannel && (
        <ChannelSettingsModal
          open={showChannelSettings}
          onOpenChange={setShowChannelSettings}
          channel={currentChannel}
          onChannelUpdate={(updatedChannel) => {
            setChannels(prev => prev.map(ch => 
              ch.id === updatedChannel.id ? updatedChannel : ch
            ));
          }}
          onChannelDelete={(channelId) => {
            setChannels(prev => prev.filter(ch => ch.id !== channelId));
            setActiveChannel('general');
          }}
          onLeaveChannel={(channelId) => {
            setChannels(prev => prev.filter(ch => ch.id !== channelId));
            setActiveChannel('general');
          }}
        />
      )}

      {/* Start DM Modal */}
      <StartDMModal
        open={showStartDM}
        onOpenChange={setShowStartDM}
        onStartDM={handleDirectMessageSelect}
      />
    </div>
  );
};