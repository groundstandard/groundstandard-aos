import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, MessageCircle, Users, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  created_at: string;
}

interface ChatRoom {
  id: string;
  name: string;
  description: string;
  type: 'general' | 'class' | 'direct';
  participants: number;
}

export const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<string>('general');
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock data for now - will implement with Supabase later
  useEffect(() => {
    // Initialize mock rooms
    const mockRooms: ChatRoom[] = [
      {
        id: 'general',
        name: 'General Discussion',
        description: 'Chat with all academy members',
        type: 'general',
        participants: 15
      },
      {
        id: 'beginners',
        name: 'Beginners Class',
        description: 'Discussion for beginners',
        type: 'class',
        participants: 8
      },
      {
        id: 'advanced',
        name: 'Advanced Class',
        description: 'Discussion for advanced students',
        type: 'class',
        participants: 6
      }
    ];

    // Mock messages
    const mockMessages: Message[] = [
      {
        id: '1',
        content: 'Welcome to the academy chat! Feel free to ask questions and connect with fellow martial artists.',
        sender_id: 'instructor-1',
        sender_name: 'Sensei Johnson',
        sender_role: 'admin',
        created_at: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: '2',
        content: 'Thank you! Excited to be part of this community.',
        sender_id: 'student-1',
        sender_name: 'Alex Chen',
        sender_role: 'student',
        created_at: new Date(Date.now() - 3000000).toISOString()
      },
      {
        id: '3',
        content: 'Remember, classes are canceled on Monday due to the holiday.',
        sender_id: 'instructor-1',
        sender_name: 'Sensei Johnson',
        sender_role: 'admin',
        created_at: new Date(Date.now() - 1800000).toISOString()
      }
    ];

    setRooms(mockRooms);
    setMessages(mockMessages);
    setLoading(false);
  }, []);

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

    // TODO: Implement actual message sending to Supabase
    // For now, just add to local state
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getMessageTime = (timestamp: string) => {
    return format(new Date(timestamp), 'h:mm a');
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-12rem)]">
      {/* Chat Rooms Sidebar */}
      <Card className="card-minimal shadow-soft lg:col-span-1">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageCircle className="h-5 w-5" />
            Chat Rooms
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 p-4">
          {rooms.map((room) => (
            <Button
              key={room.id}
              variant={activeRoom === room.id ? "default" : "ghost"}
              className="w-full justify-start text-left h-auto p-3"
              onClick={() => setActiveRoom(room.id)}
            >
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{room.name}</span>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    {room.participants}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground text-left">
                  {room.description}
                </div>
              </div>
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* Chat Messages */}
      <Card className="card-minimal shadow-elegant lg:col-span-3 flex flex-col">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            {rooms.find(r => r.id === activeRoom)?.name}
          </CardTitle>
        </CardHeader>
        
        {/* Messages Area */}
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="flex gap-3">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="text-xs">
                  {message.sender_name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{message.sender_name}</span>
                  <Badge variant="outline" className={`text-xs ${getRoleColor(message.sender_role)}`}>
                    {message.sender_role}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {getMessageTime(message.created_at)}
                  </span>
                </div>
                <div className="text-sm text-foreground bg-muted/30 rounded-lg p-3 max-w-[80%]">
                  {message.content}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </CardContent>

        {/* Message Input */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1"
              maxLength={500}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};