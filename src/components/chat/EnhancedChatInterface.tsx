import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ChatLayout } from './ChatLayout';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  created_at: string;
  thread_count?: number;
  reactions?: Array<{ emoji: string; count: number; users: string[] }>;
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
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const { profile } = useAuth();
  const { subscriptionInfo } = useSubscription();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

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
        last_message: 'Welcome to the academy!',
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
      },
      {
        id: 'announcements',
        name: 'announcements',
        description: 'Important academy updates',
        type: 'public',
        is_admin_only: false,
        created_by: 'admin',
        member_count: 30,
        unread_count: 1,
        last_message: 'Holiday schedule update',
        last_activity: new Date(Date.now() - 900000).toISOString()
      }
    ];

    // Add premium channels for subscribers
    if (subscriptionInfo?.subscribed) {
      mockChannels.push(
        {
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
        },
        {
          id: 'premium-community',
          name: 'premium-community',
          description: 'Exclusive community for premium members',
          type: 'premium',
          is_admin_only: false,
          created_by: 'admin',
          member_count: 15,
          unread_count: 3,
          last_message: 'Monthly virtual seminar this weekend',
          last_activity: new Date(Date.now() - 120000).toISOString()
        }
      );
    }

    // Add admin channels if user is admin
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
          last_activity: new Date(Date.now() - 1200000).toISOString()
        },
        {
          id: 'instructors',
          name: 'instructors',
          description: 'Instructor coordination',
          type: 'private',
          is_admin_only: true,
          created_by: 'admin',
          member_count: 5,
          unread_count: 3,
          last_message: 'Schedule adjustments needed',
          last_activity: new Date(Date.now() - 180000).toISOString()
        }
      );
    }

    // Enhanced mock messages with better formatting
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
        content: 'Quick reminder: Classes are canceled on Monday due to the holiday. We will resume normal schedule on Tuesday.',
        sender_id: 'instructor-1',
        sender_name: 'Sensei Johnson',
        sender_role: 'admin',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        thread_count: 2
      },
      {
        id: '4',
        content: 'Got it, thanks for the heads up! 👍',
        sender_id: 'student-2',
        sender_name: 'Sarah Kim',
        sender_role: 'student',
        created_at: new Date(Date.now() - 1800000).toISOString(),
        reactions: [{ emoji: '👍', count: 4, users: ['user1', 'user2', 'user3', 'user4'] }]
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
      config: {
        presence: {
          key: profile.id
        }
      }
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        const users = Object.values(newState).flat();
        // Filter and transform presence data to match UserPresence interface
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
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined chat:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left chat:', key, leftPresences);
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

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !profile) return;

    const message: Message = {
      id: Date.now().toString(),
      content: newMessage.trim(),
      sender_id: profile.id,
      sender_name: `${profile.first_name} ${profile.last_name}`,
      sender_role: profile.role,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // Update channel's last activity
    setChannels(prev => prev.map(channel => 
      channel.id === activeChannel 
        ? { ...channel, last_message: newMessage.trim(), last_activity: new Date().toISOString() }
        : channel
    ));

    // Clear typing indicator
    clearTypingIndicator();
  };

  const handleTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Simulate typing indicator broadcast
    typingTimeoutRef.current = setTimeout(() => {
      clearTypingIndicator();
    }, 3000);
  };

  const clearTypingIndicator = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setTypingUsers([]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    } else {
      handleTyping();
    }
  };

  const handleChannelSwitch = (channelId: string) => {
    const channel = channels.find(c => c.id === channelId);
    
    // Check if premium channel and user doesn't have subscription
    if (channel?.type === 'premium' && !subscriptionInfo?.subscribed) {
      toast({
        title: "Premium Feature",
        description: "This channel is available for premium members only.",
        action: (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/subscription')}
          >
            Upgrade
          </Button>
        )
      });
      return;
    }

    setActiveChannel(channelId);
    
    // Mark channel as read
    setChannels(prev => prev.map(c => 
      c.id === channelId ? { ...c, unread_count: 0 } : c
    ));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">Loading chat...</div>
      </div>
    );
  }

  return (
    <ChatLayout
      messages={messages}
      channels={channels}
      activeChannel={activeChannel}
      newMessage={newMessage}
      onChannelSelect={handleChannelSwitch}
      onNewMessageChange={setNewMessage}
      onSendMessage={handleSendMessage}
      onKeyPress={handleKeyPress}
      onChannelCreated={(newChannel) => {
        setChannels(prev => [...prev, newChannel]);
        setActiveChannel(newChannel.id);
      }}
    />
  );
};