import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useRoleTesting } from '@/contexts/RoleTestingContext';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ChatSidebar } from './ChatSidebar';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { MobileMessageInput } from './MobileMessageInput';
import { CreateChannelDialog } from './CreateChannelDialog';
import { ChannelSettingsModal } from './ChannelSettingsModal';
import { StartDMModal } from './StartDMModal';
import { useIsMobile } from '@/hooks/use-mobile';
import { ArrowLeft, Hash, Lock, Crown, Users, Settings } from 'lucide-react';
import { ChannelSetup } from './ChannelSetup';
import { DateDivider } from './DateDivider';
import { EmptyChatState } from './EmptyChatState';
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
  const [activeChannel, setActiveChannel] = useState<string | null>(null);
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
  const [dmUserMap, setDmUserMap] = useState<{ [userId: string]: { name: string; role: string } }>({});
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { profile } = useAuth();
  const { effectiveRole } = useRoleTesting();
  const { subscriptionInfo } = useSubscription();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Check user role for permissions using effective role (for testing)
  const isOwner = effectiveRole === 'admin'; // admin is effectively owner in current system
  const isStaff = effectiveRole === 'instructor'; // instructor is staff level
  const isMember = effectiveRole === 'student';
  
  // Channel management permissions
  const canCreateChannels = isOwner;
  const canArchiveChannels = isOwner;
  const canDeleteChannels = isOwner;

  // Load channels and messages from database
  useEffect(() => {
    const loadData = async () => {
      if (!profile) return;

      try {
        // Load channels from database with membership filtering
        let channelQuery = supabase
          .from('chat_channels')
          .select(`
            *,
            channel_memberships!left(user_id)
          `);

        // If not owner, filter channels based on access
        if (!isOwner) {
          channelQuery = channelQuery.or(`
            type.eq.public,
            channel_memberships.user_id.eq.${profile.id}
          `);
        }

        const { data: channelData, error: channelError } = await channelQuery.order('name');

        if (channelError) {
          console.error('Error loading channels:', channelError);
          setLoading(false);
          return;
        }

        // Filter channels based on user role and subscriptions
        const filteredChannels = channelData?.filter(channel => {
          if (channel.is_admin_only && profile.role !== 'admin') return false;
          if (channel.type === 'premium' && !subscriptionInfo?.subscribed) return false;
          return true;
        }) || [];

        const loadedChannels: Channel[] = filteredChannels.map(channel => ({
          id: channel.id,
          name: channel.name,
          description: channel.description || '',
          type: channel.type as 'public' | 'private' | 'premium',
          is_admin_only: channel.is_admin_only || false,
          created_by: channel.created_by || '',
          member_count: channel.member_count || 0,
          unread_count: 0,
          last_message: '',
          last_activity: channel.created_at
        }));

        setChannels(loadedChannels);
        
        // Set first channel as active if none selected or if current activeChannel doesn't exist
        if (loadedChannels.length > 0 && !activeChannel) {
          setActiveChannel(loadedChannels[0].name);
        } else if (activeChannel && !loadedChannels.find(ch => ch.name === activeChannel)) {
          // If selected channel no longer exists, set to first available or null
          setActiveChannel(loadedChannels.length > 0 ? loadedChannels[0].name : null);
        }

        // Load messages for all channels
        const { data: messageData, error: messageError } = await supabase
          .from('chat_messages')
          .select(`
            *,
            profiles!inner(first_name, last_name, role)
          `)
          .order('created_at', { ascending: true });

        if (messageError) {
          console.error('Error loading messages:', messageError);
          setChannelMessages({});
          setLoading(false);
          return;
        }

        // Group messages by channel
        const messagesByChannel: { [key: string]: Message[] } = {};
        
        messageData?.forEach(msg => {
          // Find the channel name for this message
          let channelKey = '';
          if (msg.channel_id) {
            const channel = loadedChannels.find(c => c.id === msg.channel_id);
            channelKey = channel?.name || '';
          } else if (msg.dm_channel_id) {
            channelKey = `dm-${msg.dm_channel_id}`;
          }

          if (channelKey) {
            if (!messagesByChannel[channelKey]) {
              messagesByChannel[channelKey] = [];
            }

            const { cleanContent, attachments } = parseAttachments(msg.content || '');
            
            // Ensure attachments from database are properly typed
            const dbAttachments = Array.isArray(msg.attachments) ? msg.attachments as Array<{ url: string; type: string; name: string }> : [];
            
            messagesByChannel[channelKey].push({
              id: msg.id,
              content: cleanContent,
              sender_id: msg.sender_id,
              sender_name: `${msg.profiles.first_name} ${msg.profiles.last_name}`,
              sender_role: msg.profiles.role,
              created_at: msg.created_at,
              parent_message_id: msg.parent_message_id,
              attachments: dbAttachments.length > 0 ? dbAttachments : (attachments.length > 0 ? attachments : undefined),
              mentioned_users: msg.mentioned_users || []
            });
          }
        });

        setChannelMessages(messagesByChannel);

        // Set up real-time subscription for new messages
        const messageSubscription = supabase
          .channel('chat-messages')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'chat_messages'
            },
            async (payload) => {
              console.log('New message received:', payload);
              
              // Fetch the complete message with profile data
              const { data: newMessageData, error } = await supabase
                .from('chat_messages')
                .select(`
                  *,
                  profiles!inner(first_name, last_name, role)
                `)
                .eq('id', payload.new.id)
                .single();

              if (error || !newMessageData) {
                console.error('Error fetching new message:', error);
                return;
              }

              // Find the channel name for this message
              let channelKey = '';
              if (newMessageData.channel_id) {
                const channel = loadedChannels.find(c => c.id === newMessageData.channel_id);
                channelKey = channel?.name || '';
              } else if (newMessageData.dm_channel_id) {
                channelKey = `dm-${newMessageData.dm_channel_id}`;
              }

              if (channelKey) {
                const { cleanContent, attachments } = parseAttachments(newMessageData.content || '');
                const dbAttachments = Array.isArray(newMessageData.attachments) ? newMessageData.attachments as Array<{ url: string; type: string; name: string }> : [];

                const newMessage: Message = {
                  id: newMessageData.id,
                  content: cleanContent,
                  sender_id: newMessageData.sender_id,
                  sender_name: `${newMessageData.profiles.first_name} ${newMessageData.profiles.last_name}`,
                  sender_role: newMessageData.profiles.role,
                  created_at: newMessageData.created_at,
                  parent_message_id: newMessageData.parent_message_id,
                  attachments: dbAttachments.length > 0 ? dbAttachments : (attachments.length > 0 ? attachments : undefined),
                  mentioned_users: newMessageData.mentioned_users || []
                };

                // Only add if not already in local state (to avoid duplicates)
                setChannelMessages(prev => {
                  const existingMessages = prev[channelKey] || [];
                  const messageExists = existingMessages.some(msg => msg.id === newMessage.id);
                  
                  if (!messageExists) {
                    return {
                      ...prev,
                      [channelKey]: [...existingMessages, newMessage]
                    };
                  }
                  return prev;
                });
              }
            }
          )
          .subscribe();

        // Clean up subscription on unmount or dependency change
        return () => {
          if (messageSubscription) {
            messageSubscription.unsubscribe();
          }
        };
      } catch (error) {
        console.error('Error loading data:', error);
        setChannelMessages({});
      } finally {
        setLoading(false);
      }
    };

    loadData();
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

  // Listen for channel switching from message input
  useEffect(() => {
    const handleChannelSwitch = (event: CustomEvent) => {
      const { channelName } = event.detail;
      if (channelName && channels.find(ch => ch.name === channelName)) {
        setActiveChannel(channelName);
      }
    };

    window.addEventListener('channelSwitch', handleChannelSwitch as EventListener);
    
    return () => {
      window.removeEventListener('channelSwitch', handleChannelSwitch as EventListener);
    };
  }, [channels]);

  // More aggressive scroll to bottom approach
  useEffect(() => {
    if (shouldScrollToBottom && messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      
      // Use multiple strategies to ensure scroll happens
      const scrollToBottom = () => {
        const scrollHeight = container.scrollHeight;
        const clientHeight = container.clientHeight;
        const maxScrollTop = scrollHeight - clientHeight;
        
        console.log('Scrolling - scrollHeight:', scrollHeight, 'clientHeight:', clientHeight, 'maxScrollTop:', maxScrollTop);
        
        container.scrollTop = maxScrollTop;
        
        // Double-check and force if needed
        setTimeout(() => {
          if (container.scrollTop < maxScrollTop - 10) {
            container.scrollTop = maxScrollTop;
            console.log('Force corrected scroll to:', container.scrollTop);
          }
        }, 100);
      };
      
      // Try multiple times with increasing delays to account for image loading
      scrollToBottom();
      setTimeout(scrollToBottom, 50);
      setTimeout(scrollToBottom, 150);
      setTimeout(scrollToBottom, 500);  // Extra delay for image loading
      setTimeout(scrollToBottom, 1000); // Even longer delay for slow images
      
      setShouldScrollToBottom(false);
    }
  }, [shouldScrollToBottom]);

  // Additional effect to handle image loading
  useEffect(() => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const images = container.querySelectorAll('img');
      
      const handleImageLoad = () => {
        const scrollHeight = container.scrollHeight;
        const clientHeight = container.clientHeight;
        const maxScrollTop = scrollHeight - clientHeight;
        container.scrollTop = maxScrollTop;
        console.log('Image loaded, scrolled to:', container.scrollTop);
      };
      
      images.forEach(img => {
        if (img.complete) {
          // Image already loaded
          handleImageLoad();
        } else {
          // Wait for image to load
          img.addEventListener('load', handleImageLoad);
          img.addEventListener('error', handleImageLoad); // Handle broken images too
        }
      });
      
      // Cleanup
      return () => {
        images.forEach(img => {
          img.removeEventListener('load', handleImageLoad);
          img.removeEventListener('error', handleImageLoad);
        });
      };
    }
  }, [channelMessages[activeChannel || '']?.length]); // Run when new messages are added

  // Check if user is near bottom when they scroll
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
      // Don't use shouldAutoScroll state anymore, just track if user is near bottom
    }
  };

  // Always scroll to bottom when switching channels
  useEffect(() => {
    setShouldScrollToBottom(true);
  }, [activeChannel]);

  const handleSendMessage = async (attachments?: Array<{url: string; type: string; name: string}>, mentionedUsers?: string[]) => {
    if (!newMessage.trim() && (!attachments || attachments.length === 0)) return;
    if (!profile) return;

    console.log('Sending message');

    if (editingMessageId && activeChannel) {
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

      // Save message to database first
      try {
        console.log('Attempting to save message. ActiveChannel:', activeChannel);
        
        // Find the actual channel UUID for named channels
        let channelId = null;
        let dmChannelId = null;
        
        if (activeChannel && activeChannel.startsWith('dm-')) {
          dmChannelId = activeChannel.replace('dm-', '');
          console.log('DM channel detected:', dmChannelId);
        } else {
          console.log('Looking up channel by name:', activeChannel);
          // Look up the channel by name to get its UUID
          const { data: channelData, error: lookupError } = await supabase
            .from('chat_channels')
            .select('id')
            .eq('name', activeChannel)
            .single();
          
          console.log('Channel lookup result:', { channelData, lookupError });
          
          if (channelData) {
            channelId = channelData.id;
            console.log('Found channel ID:', channelId);
          } else {
            // If channel doesn't exist, don't save to database but show locally
            console.log('Channel not found in database, showing locally only');
          }
        }

        // Only save to database if we have valid channel/dm info
        if (channelId || dmChannelId) {
          console.log('Saving message to database:', { channelId, dmChannelId, content: message.content });
          const { data, error } = await supabase
            .from('chat_messages')
            .insert({
              channel_id: channelId,
              dm_channel_id: dmChannelId,
              sender_id: profile.id,
              content: message.content,
              parent_message_id: message.parent_message_id,
              mentioned_users: message.mentioned_users,
              attachments: message.attachments || [],
              message_type: 'text'
            })
            .select();

          if (error) {
            console.error('Error saving message:', error);
            toast({
              variant: "destructive",
              title: "Message failed to save",
              description: "Your message will only be visible locally."
            });
          } else {
            console.log('Message saved successfully:', data);
          }
        } else {
          console.log('No valid channel/DM ID found, message will only show locally');
        }
      } catch (error) {
        console.error('Error saving message:', error);
        // Still show message locally even if database save fails
      }

      // Don't add to local state - let the real-time subscription handle it to prevent duplicates

      // Clear the input immediately
      setNewMessage('');
      setReplyingTo(null);
      
      // Trigger scroll to bottom after message is added
      setShouldScrollToBottom(true);

      // If this is a reply, auto-expand the thread to show the new message
      if (replyingTo) {
        setExpandedThreads(prev => new Set([...prev, replyingTo]));
      }

      // Update channel's last activity
      setChannels(prev => prev.map(channel => 
        channel.name === activeChannel 
          ? { 
              ...channel, 
              last_message: newMessage.trim() || (attachments && attachments.length > 0 ? '📎 Attachment' : ''), 
              last_activity: new Date().toISOString() 
            }
          : channel
      ));
    }
  };

  const handleDescriptionAdded = (description: string) => {
    setChannels(prev => prev.map(channel => 
      channel.name === activeChannel 
        ? { ...channel, description }
        : channel
    ));
  };

  const handleChannelSwitch = (channelName: string) => {
    const channel = channels.find(c => c.name === channelName);
    
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

    setActiveChannel(channelName);
    setChannels(prev => prev.map(c => 
      c.name === channelName ? { ...c, unread_count: 0 } : c
    ));
    setReplyingTo(null);
    setEditingMessageId(null);
    
    if (isMobile) {
      setShowChannels(false);
    }
  };

  const handleDirectMessageSelect = (userId: string, userInfo?: { name: string; role: string }) => {
    // Create or switch to a direct message channel with this user
    const dmChannelId = `dm-${userId}`;
    setActiveChannel(dmChannelId);
    setReplyingTo(null);
    setEditingMessageId(null);
    
    // Update dmUserMap with user information
    if (userInfo) {
      setDmUserMap(prev => ({
        ...prev,
        [userId]: userInfo
      }));
    }
    
    // Add this user to DM users list if not already there
    const existingDMUser = directMessageUsers.find(u => u.user_id === userId);
    if (!existingDMUser) {
      const mockUser: UserPresence = {
        user_id: userId,
        name: userInfo?.name || dmUserMap[userId]?.name || `User ${userId.slice(-4)}`,
        online_at: new Date().toISOString(),
        status: 'online'
      };
      setDirectMessageUsers(prev => [...prev, mockUser]);
    }
    
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
    if (!activeChannel) return;
    
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
    if (!activeChannel) return [];
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

  const currentChannel = channels.find(c => c.name === activeChannel);

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
      <>
        <div className="h-[calc(100vh-16rem)] w-full overflow-hidden bg-background">
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
                  <div className="flex items-center justify-between">
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

                    {/* Right side with online count and settings */}
                    <div className="flex items-center gap-2">
                      {/* Online indicator */}
                      <div className="flex items-center gap-1 bg-muted/50 rounded-full px-2 py-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium">{onlineUsers.length}</span>
                      </div>
                      
                      {/* Settings button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowChannelSettings(true)}
                        className="h-8 w-8 p-0"
                        title={activeChannel?.startsWith('dm-') ? "Direct message settings" : "Channel settings"}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div 
                  ref={messagesContainerRef}
                  onScroll={handleScroll}
                  className="flex-1 overflow-y-auto px-4 pt-4 pb-4 flex flex-col justify-end"
                >
                  {!activeChannel ? (
                    <EmptyChatState />
                  ) : isNewChannel() ? (
                    <ChannelSetup 
                      channel={currentChannel!} 
                      onDescriptionAdded={handleDescriptionAdded}
                      isDM={activeChannel?.startsWith('dm-') || false}
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
                      <div ref={messagesEndRef} className="h-4" id="messages-end" />
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
              </div>
            </div>
          </div>

          <CreateChannelDialog
            open={showCreateChannel}
            onOpenChange={setShowCreateChannel}
            onChannelCreated={(newChannel) => {
              setChannels(prev => [...prev, newChannel]);
              setActiveChannel(newChannel.name);
              setShowCreateChannel(false);
            }}
          />

          {/* Channel Settings Modal */}
          <ChannelSettingsModal
            open={showChannelSettings}
            onOpenChange={setShowChannelSettings}
            channel={currentChannel}
            isDM={activeChannel?.startsWith('dm-') || false}
            dmChannelId={activeChannel?.startsWith('dm-') ? activeChannel.replace('dm-', '') : undefined}
            dmUserName={(() => {
              if (activeChannel?.startsWith('dm-')) {
                const userId = activeChannel.replace('dm-', '');
                const dmUser = directMessageUsers.find(u => u.user_id === userId);
                return dmUser?.name || 'Direct Message';
              }
              return undefined;
            })()}
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
            onCloseDM={() => {
              // Remove DM from directMessageUsers and switch to general
              const userId = activeChannel.replace('dm-', '');
              setDirectMessageUsers(prev => prev.filter(u => u.user_id !== userId));
              setChannelMessages(prev => {
                const newMessages = { ...prev };
                delete newMessages[activeChannel];
                return newMessages;
              });
              setActiveChannel('general');
            }}
          />
        </div>
        
        {/* Mobile Input Component */}
        <MobileMessageInput
          newMessage={newMessage}
          onNewMessageChange={setNewMessage}
          onSendMessage={handleSendMessage}
          onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
          channelName={currentChannel?.name}
        />
      </>
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
              {activeChannel?.startsWith('dm-') ? (
                <>
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                   <div>
                     {(() => {
                       const userId = activeChannel.replace('dm-', '');
                       const dmUser = directMessageUsers.find(u => u.user_id === userId);
                       return (
                         <>
                           <h2 className="font-semibold">{dmUser?.name || 'Direct Message'}</h2>
                           <p className="text-xs text-muted-foreground">Private conversation</p>
                         </>
                       );
                     })()}
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
            
            {/* Channel/DM Settings Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowChannelSettings(true)}
              className="h-8 w-8 p-0"
              title={activeChannel?.startsWith('dm-') ? "Direct message settings" : "Channel settings"}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div 
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 pt-4 pb-4 flex flex-col justify-end"
        >
          {!activeChannel ? (
            <EmptyChatState />
          ) : isNewChannel() ? (
            <ChannelSetup 
              channel={currentChannel!} 
              onDescriptionAdded={handleDescriptionAdded}
              isDM={activeChannel?.startsWith('dm-') || false}
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
              <div ref={messagesEndRef} className="h-4" id="messages-end" />
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
            [newChannel.name]: [systemMessage]
          }));
          setActiveChannel(newChannel.name);
          setShowCreateChannel(false);
          
          toast({
            title: "Channel created",
            description: `Welcome to #${newChannel.name}!`
          });
        }}
      />

      {/* Channel Settings Modal */}
      <ChannelSettingsModal
        open={showChannelSettings}
        onOpenChange={setShowChannelSettings}
        channel={currentChannel}
        isDM={activeChannel?.startsWith('dm-') || false}
        dmChannelId={activeChannel?.startsWith('dm-') ? activeChannel.replace('dm-', '') : undefined}
        dmUserName={(() => {
          if (activeChannel?.startsWith('dm-')) {
            const userId = activeChannel.replace('dm-', '');
            const dmUser = directMessageUsers.find(u => u.user_id === userId);
            return dmUser?.name || 'Direct Message';
          }
          return undefined;
        })()}
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
        onCloseDM={() => {
          // Remove DM from directMessageUsers and switch to general
          const userId = activeChannel.replace('dm-', '');
          setDirectMessageUsers(prev => prev.filter(u => u.user_id !== userId));
          setChannelMessages(prev => {
            const newMessages = { ...prev };
            delete newMessages[activeChannel];
            return newMessages;
          });
          setActiveChannel('general');
        }}
      />

      {/* Start DM Modal */}
      <StartDMModal
        open={showStartDM}
        onOpenChange={setShowStartDM}
        onStartDM={handleDirectMessageSelect}
      />
    </div>
  );
};