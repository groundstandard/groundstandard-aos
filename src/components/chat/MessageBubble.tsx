import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, Reply, Heart, ThumbsUp, Smile, Trophy, Laugh, Frown, Copy, Edit, Trash2, Pin, Flag } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';

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

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  showAvatar: boolean;
  onReaction: (messageId: string, emoji: string) => void;
  onReply: (messageId: string) => void;
  currentUserId?: string;
}

export const MessageBubble = ({
  message,
  isOwnMessage,
  showAvatar,
  onReaction,
  onReply,
  currentUserId
}: MessageBubbleProps) => {
  const [showReactions, setShowReactions] = useState(false);

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.content);
  };

  const handleEditMessage = () => {
    // TODO: Implement edit functionality
    console.log('Edit message:', message.id);
  };

  const handleDeleteMessage = () => {
    // TODO: Implement delete functionality
    console.log('Delete message:', message.id);
  };

  const handlePinMessage = () => {
    // TODO: Implement pin functionality
    console.log('Pin message:', message.id);
  };

  const handleReportMessage = () => {
    // TODO: Implement report functionality
    console.log('Report message:', message.id);
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

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const quickReactions = [
    { emoji: '👍', icon: ThumbsUp },
    { emoji: '❤️', icon: Heart },
    { emoji: '😂', icon: Laugh },
    { emoji: '😢', icon: Frown },
    { emoji: '💪', icon: Trophy },
    { emoji: '🎉', icon: Smile }
  ];

  const renderAttachment = (attachment: { url: string; type: string; name: string }) => {
    if (attachment.type.startsWith('image/')) {
      return (
        <img 
          src={attachment.url} 
          alt={attachment.name}
          className="max-w-xs max-h-64 rounded-lg object-cover"
        />
      );
    } else if (attachment.type.startsWith('video/')) {
      return (
        <video 
          src={attachment.url}
          controls
          className="max-w-xs max-h-64 rounded-lg"
        />
      );
    } else if (attachment.type.startsWith('audio/')) {
      return (
        <audio 
          src={attachment.url}
          controls
          className="max-w-xs"
        />
      );
    } else {
      return (
        <a 
          href={attachment.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 p-2 bg-muted rounded-lg hover:bg-muted/80"
        >
          📎 {attachment.name}
        </a>
      );
    }
  };

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`flex max-w-[85%] ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} items-end gap-2 group`}>
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
        <div className={`space-y-1 ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col relative`}>
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
              px-4 py-3 rounded-2xl max-w-full break-words relative
              ${isOwnMessage 
                ? 'bg-primary text-primary-foreground rounded-br-md' 
                : 'bg-muted text-foreground rounded-bl-md'
              }
              hover:shadow-sm transition-shadow
            `}
          >
            {/* Thread indicator for replies */}
            {message.parent_message_id && (
              <div className="text-xs opacity-70 mb-1 italic">
                Replying to message
              </div>
            )}
            
            <p className="text-sm leading-relaxed">{message.content}</p>
            
            {/* Attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-2 space-y-2">
                {message.attachments.map((attachment, index) => (
                  <div key={index}>
                    {renderAttachment(attachment)}
                  </div>
                ))}
              </div>
            )}

            {/* Action buttons (show on hover) */}
            <div className={`absolute top-1 ${isOwnMessage ? 'left-1' : 'right-1'} opacity-0 group-hover:opacity-100 transition-opacity`}>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReactions(!showReactions)}
                  className="h-6 w-6 p-0 bg-background/80 backdrop-blur-sm hover:bg-background"
                >
                  <Smile className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onReply(message.id)}
                  className="h-6 w-6 p-0 bg-background/80 backdrop-blur-sm hover:bg-background"
                >
                  <Reply className="h-3 w-3" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 bg-background/80 backdrop-blur-sm hover:bg-background"
                    >
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    <DropdownMenuItem onClick={handleCopyMessage}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy message
                    </DropdownMenuItem>
                    {isOwnMessage && (
                      <DropdownMenuItem onClick={handleEditMessage}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit message
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={handlePinMessage}>
                      <Pin className="mr-2 h-4 w-4" />
                      Pin message
                    </DropdownMenuItem>
                    {isOwnMessage && (
                      <DropdownMenuItem 
                        onClick={handleDeleteMessage}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete message
                      </DropdownMenuItem>
                    )}
                    {!isOwnMessage && (
                      <DropdownMenuItem onClick={handleReportMessage}>
                        <Flag className="mr-2 h-4 w-4" />
                        Report message
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Quick reactions popup */}
          {showReactions && (
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full mb-2 z-10">
              <div className="bg-popover border rounded-lg shadow-lg p-2 flex gap-1">
                {quickReactions.map(({ emoji, icon: Icon }) => (
                  <Button
                    key={emoji}
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onReaction(message.id, emoji);
                      setShowReactions(false);
                    }}
                    className="h-8 w-8 p-0 hover:bg-muted text-lg"
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </div>
          )}
          
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
                  onClick={() => onReaction(message.id, reaction.emoji)}
                  className={`h-6 px-2 text-xs hover:bg-muted rounded-full ${
                    reaction.users.includes(currentUserId || '') ? 'bg-primary/10 border-primary' : ''
                  }`}
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
              onClick={() => onReply(message.id)}
              className="h-6 px-3 text-xs text-primary hover:bg-primary/10 mt-1 rounded-full"
            >
              💬 {message.thread_count} replies
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};