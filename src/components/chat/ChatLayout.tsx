import { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { ChatSidebar } from './ChatSidebar';
import { ChatMessages } from './ChatMessages';
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

interface ChatLayoutProps {
  messages: Message[];
  channels: Channel[];
  activeChannel: string;
  newMessage: string;
  onChannelSelect: (channelId: string) => void;
  onNewMessageChange: (value: string) => void;
  onSendMessage: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onChannelCreated: (channel: Channel) => void;
}

export const ChatLayout = ({
  messages,
  channels,
  activeChannel,
  newMessage,
  onChannelSelect,
  onNewMessageChange,
  onSendMessage,
  onKeyPress,
  onChannelCreated
}: ChatLayoutProps) => {
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showChannels, setShowChannels] = useState(true);
  const isMobile = useIsMobile();

  const currentChannel = channels.find(c => c.id === activeChannel);

  const handleChannelSelect = (channelId: string) => {
    onChannelSelect(channelId);
    if (isMobile) {
      setShowChannels(false);
    }
  };

  const handleBackToChannels = () => {
    setShowChannels(true);
  };

  const handleCreateChannel = () => {
    setShowCreateChannel(true);
  };

  const handleChannelCreated = (newChannel: Channel) => {
    onChannelCreated(newChannel);
    setShowCreateChannel(false);
    handleChannelSelect(newChannel.id);
  };

  if (isMobile) {
    return (
      <div className="h-[calc(100vh-12rem)] w-full overflow-hidden">
        <div className="relative h-full">
          {/* Mobile Channel List */}
          <div 
            className={`absolute inset-0 z-10 transform transition-transform duration-300 ease-in-out bg-background ${
              showChannels ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <ChatSidebar
              channels={channels}
              activeChannel={activeChannel}
              onChannelSelect={handleChannelSelect}
              onCreateChannel={handleCreateChannel}
              className="h-full"
            />
          </div>

          {/* Mobile Chat Messages */}
          <div 
            className={`absolute inset-0 transform transition-transform duration-300 ease-in-out ${
              showChannels ? 'translate-x-full' : 'translate-x-0'
            }`}
          >
            <ChatMessages
              messages={messages}
              currentChannel={currentChannel}
              newMessage={newMessage}
              onNewMessageChange={onNewMessageChange}
              onSendMessage={onSendMessage}
              onKeyPress={onKeyPress}
              onBackToChannels={handleBackToChannels}
              className="h-full"
            />
          </div>
        </div>

        <CreateChannelDialog
          open={showCreateChannel}
          onOpenChange={setShowCreateChannel}
          onChannelCreated={handleChannelCreated}
        />
      </div>
    );
  }

  // Desktop layout with simple flex
  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="w-80 min-w-80 flex-shrink-0 border-r border-border bg-background">
        <ChatSidebar
          channels={channels}
          activeChannel={activeChannel}
          onChannelSelect={onChannelSelect}
          onCreateChannel={handleCreateChannel}
          className="h-full"
        />
      </div>

      {/* Desktop Messages */}
      <div className="flex-1 min-w-0 overflow-hidden">
        <ChatMessages
          messages={messages}
          currentChannel={currentChannel}
          newMessage={newMessage}
          onNewMessageChange={onNewMessageChange}
          onSendMessage={onSendMessage}
          onKeyPress={onKeyPress}
          className="h-full"
        />
      </div>

      <CreateChannelDialog
        open={showCreateChannel}
        onOpenChange={setShowCreateChannel}
        onChannelCreated={handleChannelCreated}
      />
    </div>
  );
};