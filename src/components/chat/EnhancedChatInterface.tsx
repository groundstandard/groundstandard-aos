import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Send, MessageCircle, Users, Hash, Lock, Plus, Settings, MoreVertical, Search, Crown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, isToday, isYesterday } from 'date-fns';
import { CreateChannelDialog } from './CreateChannelDialog';

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<string>('general');
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateChannel, setShowCreateChannel] = useState(false);
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

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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
            onClick={() => window.location.href = '/subscription'}
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

  const getChannelIcon = (channel: Channel) => {
    if (channel.type === 'premium') {
      return <Crown className="h-4 w-4 text-primary" />;
    }
    if (channel.type === 'private' || channel.is_admin_only) {
      return <Lock className="h-4 w-4" />;
    }
    return <Hash className="h-4 w-4" />;
  };

  const filteredChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    channel.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="card-minimal">
          <CardContent className="p-6">
            <div className="text-center">Loading chat...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentChannel = channels.find(c => c.id === activeChannel);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-12rem)]">
      {/* Enhanced Channels Sidebar */}
      <Card className="card-minimal shadow-soft lg:col-span-1 flex flex-col">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Academy Chat
            </CardTitle>
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
          </div>
          
          {/* Search */}
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
          <div className="space-y-1 p-2">
            {/* Public Channels */}
            <div className="px-2 py-1">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Channels
              </h3>
            </div>
            
            {filteredChannels
              .filter(channel => channel.type === 'public')
              .map((channel) => (
                <Button
                  key={channel.id}
                  variant={activeChannel === channel.id ? "secondary" : "ghost"}
                  className="w-full justify-start text-left h-auto p-2 font-normal"
                  onClick={() => handleChannelSwitch(channel.id)}
                >
                  <div className="flex items-center gap-2 w-full">
                    {getChannelIcon(channel)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm truncate">#{channel.name}</span>
                        {(channel.unread_count || 0) > 0 && (
                          <Badge variant="destructive" className="ml-2 px-1.5 py-0.5 text-xs min-w-0">
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

            {/* Premium Channels */}
            {filteredChannels.some(c => c.type === 'premium') && (
              <>
                <div className="px-2 py-1 mt-4">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <Crown className="h-3 w-3 text-primary" />
                    Premium Channels
                  </h3>
                </div>
                
                {filteredChannels
                  .filter(channel => channel.type === 'premium')
                  .map((channel) => (
                    <Button
                      key={channel.id}
                      variant={activeChannel === channel.id ? "secondary" : "ghost"}
                      className="w-full justify-start text-left h-auto p-2 font-normal"
                      onClick={() => handleChannelSwitch(channel.id)}
                      disabled={!subscriptionInfo?.subscribed}
                    >
                      <div className="flex items-center gap-2 w-full">
                        {getChannelIcon(channel)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm truncate">{channel.name}</span>
                            {!subscriptionInfo?.subscribed && (
                              <Lock className="h-3 w-3 text-muted-foreground ml-2" />
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

            {/* Private Channels */}
            {profile?.role === 'admin' && filteredChannels.some(c => c.is_admin_only) && (
              <>
                <div className="px-2 py-1 mt-4">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Private Channels
                  </h3>
                </div>
                
                {filteredChannels
                  .filter(channel => channel.is_admin_only)
                  .map((channel) => (
                    <Button
                      key={channel.id}
                      variant={activeChannel === channel.id ? "secondary" : "ghost"}
                      className="w-full justify-start text-left h-auto p-2 font-normal"
                      onClick={() => handleChannelSwitch(channel.id)}
                    >
                      <div className="flex items-center gap-2 w-full">
                        {getChannelIcon(channel)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm truncate">{channel.name}</span>
                            {(channel.unread_count || 0) > 0 && (
                              <Badge variant="destructive" className="ml-2 px-1.5 py-0.5 text-xs">
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
            {onlineUsers.length > 0 && (
              <>
                <div className="px-2 py-1 mt-4">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Online ({onlineUsers.length})
                  </h3>
                </div>
                <div className="space-y-1">
                  {onlineUsers.slice(0, 5).map((user) => (
                    <div key={user.user_id} className="flex items-center gap-2 px-2 py-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-muted-foreground truncate">
                        {user.name}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Chat Messages Area */}
      <Card className="card-minimal shadow-elegant lg:col-span-3 flex flex-col">
        {/* Channel Header */}
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {currentChannel && getChannelIcon(currentChannel)}
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  {currentChannel?.type === 'public' ? '#' : ''}{currentChannel?.name}
                  {currentChannel?.type === 'premium' && (
                    <Badge variant="default" className="bg-gradient-primary">
                      <Crown className="h-3 w-3 mr-1" />
                      Premium
                    </Badge>
                  )}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {currentChannel?.description} • {currentChannel?.member_count} members
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {/* Messages Area */}
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => {
            const prevMessage = messages[index - 1];
            const showAvatar = !prevMessage || prevMessage.sender_id !== message.sender_id;
            const timeDiff = prevMessage ? 
              new Date(message.created_at).getTime() - new Date(prevMessage.created_at).getTime() 
              : Infinity;
            const showTimeBreak = timeDiff > 300000; // 5 minutes

            return (
              <div key={message.id} className="animate-fade-in">
                {showTimeBreak && (
                  <div className="text-center my-4">
                    <span className="text-xs text-muted-foreground bg-background px-2">
                      {getMessageTime(message.created_at)}
                    </span>
                  </div>
                )}
                
                <div className={`flex gap-3 group hover:bg-muted/30 -mx-4 px-4 py-1 rounded ${!showAvatar ? 'mt-1' : 'mt-3'}`}>
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
                      </div>
                    )}
                    
                    <div className="text-sm text-foreground leading-relaxed">
                      {message.content}
                    </div>

                    {/* Reactions */}
                    {message.reactions && message.reactions.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {message.reactions.map((reaction, idx) => (
                          <Button
                            key={idx}
                            variant="outline"
                            size="sm"
                            className="h-6 px-2 text-xs hover:bg-muted"
                          >
                            {reaction.emoji} {reaction.count}
                          </Button>
                        ))}
                      </div>
                    )}

                    {/* Thread indicator */}
                    {message.thread_count && (
                      <Button variant="ghost" size="sm" className="text-xs text-primary mt-1 h-6 px-2">
                        {message.thread_count} {message.thread_count === 1 ? 'reply' : 'replies'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing indicator */}
          {typingUsers.length > 0 && (
            <div className="flex gap-3 animate-fade-in">
              <div className="w-9 flex justify-center">
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                  <div className="flex gap-1">
                    <div className="w-1 h-1 bg-muted-foreground rounded-full animate-pulse"></div>
                    <div className="w-1 h-1 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-1 h-1 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
              <div className="flex-1">
                <span className="text-sm text-muted-foreground italic">
                  {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                </span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </CardContent>

        {/* Enhanced Message Input */}
        <div className="border-t p-4 bg-background/50 backdrop-blur">
          <div className="flex gap-2">
            <Input
              placeholder={`Message ${currentChannel?.type === 'public' ? '#' : ''}${currentChannel?.name}...`}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};