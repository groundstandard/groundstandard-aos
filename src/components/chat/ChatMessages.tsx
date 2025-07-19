import { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, Settings, MoreVertical, Hash, Lock, Crown, ArrowLeft, Smile } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/hooks/useAuth';

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
  newMessage?: string;
  onNewMessageChange?: (value: string) => void;
  onSendMessage?: () => void;
  onKeyPress?: (e: React.KeyboardEvent) => void;
  onBackToChannels?: () => void;
  className?: string;
  hideInput?: boolean;
}

export const ChatMessages = ({
  messages,
  currentChannel,
  newMessage = "",
  onNewMessageChange = () => {},
  onSendMessage = () => {},
  onKeyPress = () => {},
  onBackToChannels,
  className = "",
  hideInput = false
}: ChatMessagesProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const { profile } = useAuth();

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
        return 'bg-red-500/10 text-red-700 border-red-200';
      case 'instructor':
        return 'bg-blue-500/10 text-blue-700 border-blue-200';
      default:
        return 'bg-green-500/10 text-green-700 border-green-200';
    }
  };

  const getChannelIcon = (channel: Channel) => {
    if (channel.type === 'premium') {
      return <Crown className="h-4 w-4 text-amber-500" />;
    }
    if (channel.type === 'private' || channel.is_admin_only) {
      return <Lock className="h-4 w-4 text-muted-foreground" />;
    }
    return <Hash className="h-4 w-4 text-muted-foreground" />;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const MessageBubble = ({ message, isOwnMessage, showAvatar }: { 
    message: Message; 
    isOwnMessage: boolean; 
    showAvatar: boolean; 
  }) => (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`flex max-w-[85%] ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
        {/* Avatar */}
        {!isOwnMessage && (
          <div className="w-8 h-8 flex items-center justify-center">
            {showAvatar ? (
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  {getInitials(message.sender_name)}
                </AvatarFallback>
              </Avatar>
            ) : null}
          </div>
        )}
        
        {/* Message Content */}
        <div className={`space-y-1 ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
          {/* Sender name for other messages */}
          {!isOwnMessage && showAvatar && (
            <div className="flex items-center gap-2 px-3">
              <span className="text-xs font-medium text-foreground">{message.sender_name}</span>
              <Badge variant="outline" className={`text-xs h-4 ${getRoleColor(message.sender_role)}`}>
                {message.sender_role}
              </Badge>
            </div>
          )}
          
          {/* Message bubble */}
          <div
            className={`
              px-4 py-3 rounded-2xl max-w-full break-words
              ${isOwnMessage 
                ? 'bg-primary text-primary-foreground rounded-br-md' 
                : 'bg-muted text-foreground rounded-bl-md'
              }
              ${isOwnMessage ? 'shadow-sm' : 'shadow-sm'}
            `}
          >
            <p className="text-sm leading-relaxed">{message.content}</p>
          </div>
          
          {/* Timestamp */}
          <div className={`flex items-center gap-1 px-3 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
            <span className="text-xs text-muted-foreground">
              {getMessageTime(message.created_at)}
            </span>
            {/* Delivered/Read status for own messages */}
            {isOwnMessage && (
              <span className="text-xs text-muted-foreground">Delivered</span>
            )}
          </div>

          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex gap-1 mt-1 px-3">
              {message.reactions.map((reaction, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  className="h-6 px-2 text-xs hover:bg-muted rounded-full"
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
              className="h-6 px-3 text-xs text-primary hover:bg-primary/10 mt-1 rounded-full"
            >
              {message.thread_count} replies
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className={`flex flex-col h-full bg-background ${className}`}>
      {/* Header */}
      <div className="p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {isMobile && onBackToChannels && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBackToChannels}
                className="h-8 w-8 p-0 shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            
            <div className="flex items-center gap-3 min-w-0">
              {/* Channel Icon */}
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500/10 to-purple-600/10 flex items-center justify-center shrink-0">
                {currentChannel && getChannelIcon(currentChannel)}
              </div>
              
              {/* Channel Info */}
              <div className="min-w-0">
                <h1 className="font-semibold truncate">
                  {currentChannel?.type === 'public' ? '#' : ''}{currentChannel?.name}
                </h1>
                <p className="text-sm text-muted-foreground truncate">
                  {currentChannel?.member_count} members
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-2">
        {/* Channel description */}
        {currentChannel && (
          <div className="text-center mb-6 py-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500/10 to-purple-600/10 flex items-center justify-center mx-auto mb-3">
              {getChannelIcon(currentChannel)}
            </div>
            <h2 className="text-xl font-bold mb-2">
              Welcome to {currentChannel.type === 'public' ? '#' : ''}{currentChannel.name}
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {currentChannel.description}
            </p>
          </div>
        )}

        {/* Messages */}
        <div className="space-y-1">
          {messages.map((message, index) => {
            const prevMessage = messages[index - 1];
            const isOwnMessage = message.sender_id === profile?.id;
            const showAvatar = !prevMessage || 
              prevMessage.sender_id !== message.sender_id || 
              isOwnMessage !== (prevMessage.sender_id === profile?.id);
            
            const timeDiff = prevMessage ? 
              new Date(message.created_at).getTime() - new Date(prevMessage.created_at).getTime() 
              : Infinity;
            const showTimeBreak = timeDiff > 3600000; // 1 hour

            return (
              <div key={message.id}>
                {showTimeBreak && (
                  <div className="text-center my-6">
                    <div className="inline-block bg-muted px-3 py-1 rounded-full">
                      <span className="text-xs text-muted-foreground font-medium">
                        {format(new Date(message.created_at), 'EEEE, MMMM d')}
                      </span>
                    </div>
                  </div>
                )}
                
                <MessageBubble 
                  message={message} 
                  isOwnMessage={isOwnMessage} 
                  showAvatar={showAvatar} 
                />
              </div>
            );
          })}
        </div>
        
        <div ref={messagesEndRef} className="pb-2" />
      </div>

      {/* Message Input - only show if not hidden */}
      {!hideInput && (
        <div className="p-4 border-t bg-background">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Input
                placeholder={`Message ${currentChannel?.name}...`}
                value={newMessage}
                onChange={(e) => onNewMessageChange(e.target.value)}
                onKeyPress={onKeyPress}
                className="pr-12 rounded-full bg-muted/50 border-0 h-11"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted"
              >
                <Smile className="h-4 w-4" />
              </Button>
            </div>
            <Button 
              onClick={onSendMessage} 
              size="sm" 
              className={`h-11 w-11 p-0 rounded-full ${
                newMessage.trim() ? 'bg-primary hover:bg-primary/90' : 'bg-muted-foreground/20'
              }`}
              disabled={!newMessage.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};