import { useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, Settings, MoreVertical, Hash, Lock, Crown, ArrowLeft } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';

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

interface ChatMessagesProps {
  messages: Message[];
  currentChannel: Channel | undefined;
  newMessage: string;
  onNewMessageChange: (value: string) => void;
  onSendMessage: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onBackToChannels?: () => void;
  className?: string;
}

export const ChatMessages = ({
  messages,
  currentChannel,
  newMessage,
  onNewMessageChange,
  onSendMessage,
  onKeyPress,
  onBackToChannels,
  className = ""
}: ChatMessagesProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

  return (
    <Card className={`card-minimal shadow-elegant flex flex-col ${className}`}>
      {/* Channel Header */}
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isMobile && onBackToChannels && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBackToChannels}
                className="h-8 w-8 p-0 lg:hidden"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
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
                  {message.thread_count && message.thread_count > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-primary hover:bg-primary/10 mt-1"
                    >
                      {message.thread_count} replies
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        
        <div ref={messagesEndRef} />
      </CardContent>

      {/* Message Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            placeholder={`Message #${currentChannel?.name}`}
            value={newMessage}
            onChange={(e) => onNewMessageChange(e.target.value)}
            onKeyPress={onKeyPress}
            className="flex-1"
          />
          <Button onClick={onSendMessage} size="sm" className="px-3">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};