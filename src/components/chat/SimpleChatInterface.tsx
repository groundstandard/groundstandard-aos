import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Hash } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender_name: string;
  sender_role: string;
  created_at: string;
}

export const SimpleChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const { profile } = useAuth();

  useEffect(() => {
    // Sample messages
    const sampleMessages: Message[] = [
      {
        id: '1',
        content: 'Welcome to the academy chat! 🥋',
        sender_name: 'Sensei Johnson',
        sender_role: 'admin',
        created_at: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: '2',
        content: 'Excited to be here!',
        sender_name: 'Alex Chen',
        sender_role: 'student',
        created_at: new Date(Date.now() - 1800000).toISOString(),
      },
    ];
    setMessages(sampleMessages);
  }, []);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !profile) return;

    const message: Message = {
      id: Date.now().toString(),
      content: newMessage.trim(),
      sender_name: `${profile.first_name} ${profile.last_name}`,
      sender_role: profile.role,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="flex h-[calc(100vh-12rem)] w-full">
      {/* Sidebar */}
      <div className="w-64 border-r bg-muted/30 p-4">
        <h3 className="font-semibold mb-4">Channels</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg">
            <Hash className="h-4 w-4" />
            <span className="text-sm">general</span>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <h2 className="font-semibold"># general</h2>
          <p className="text-sm text-muted-foreground">Academy discussions</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {getInitials(message.sender_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{message.sender_name}</span>
                  <span className="text-xs text-muted-foreground">{message.sender_role}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(message.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm">{message.content}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1"
            />
            <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};