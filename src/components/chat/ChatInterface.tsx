import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Send, MessageCircle, Users, User, Hash, Lock, Plus, Settings, Paperclip, Smile, Search, MoreVertical } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
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
  type: 'public' | 'private' | 'direct';
  is_admin_only: boolean;
  created_by: string;
  member_count: number;
  unread_count?: number;
  last_message?: string;
  last_activity?: string;
}

export const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<string>('general');
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const { profile } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock data for now - will implement with Supabase later
  useEffect(() => {
    // Initialize mock channels
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

    // Add admin-only channels if user is admin
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

    // Mock messages
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
        content: 'Quick reminder: Classes are canceled on Monday due to the holiday. We\'ll resume normal schedule on Tuesday.',
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
  }, [profile]);

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

    // TODO: Implement actual message sending to Supabase
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
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

  const formatLastActivity = (timestamp: string) => {
    const date = new Date(timestamp);
    if (isToday(date)) {
      return format(date, 'h:mm a');
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM d');
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
    if (channel.type === 'private' || channel.is_admin_only) {
      return <Lock className="h-4 w-4" />;
    }
    return <Hash className="h-4 w-4" />;
  };

  const filteredChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    channel.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleChannelCreated = (newChannel: Channel) => {
    setChannels(prev => [...prev, newChannel]);
    setActiveChannel(newChannel.id);
  };

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
      {/* Channels Sidebar - Slack-inspired */}
      <Card className="card-minimal shadow-soft lg:col-span-1 flex flex-col">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">
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
            {/* Channels Section */}
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
                  onClick={() => setActiveChannel(channel.id)}
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

            {/* Private Channels Section */}
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
                      onClick={() => setActiveChannel(channel.id)}
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
          </div>
        </CardContent>
      </Card>

      {/* Chat Messages Area - Slack-inspired */}
      <Card className="card-minimal shadow-elegant lg:col-span-3 flex flex-col">
        {/* Channel Header */}
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {currentChannel && getChannelIcon(currentChannel)}
              <div>
                <CardTitle className="text-lg">
                  {currentChannel?.type === 'public' ? '#' : ''}{currentChannel?.name}
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
              <div key={message.id}>
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
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700 mt-1"
                      >
                        {message.thread_count} repl{message.thread_count === 1 ? 'y' : 'ies'}
                      </Button>
                    )}
                  </div>

                  {/* Message actions on hover */}
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <Smile className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <MessageCircle className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </CardContent>

        {/* Message Input - Slack-inspired */}
        <div className="border-t p-4">
          <div className="flex gap-2 items-end">
            <div className="flex-1 border rounded-lg">
              <div className="flex items-center gap-2 p-2 border-b">
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <Paperclip className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <Smile className="h-3 w-3" />
                </Button>
              </div>
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Message #${currentChannel?.name}`}
                className="border-0 focus-visible:ring-0 resize-none"
                maxLength={500}
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              size="sm"
              className="h-10"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Create Channel Dialog */}
      <CreateChannelDialog
        open={showCreateChannel}
        onOpenChange={setShowCreateChannel}
        onChannelCreated={handleChannelCreated}
      />
    </div>
  );
};