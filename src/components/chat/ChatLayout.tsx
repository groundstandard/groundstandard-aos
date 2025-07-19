import { useState } from 'react';
import { Sidebar, SidebarContent, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
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
      <div className="h-[calc(100vh-12rem)]">
        {showChannels ? (
          <ChatSidebar
            channels={channels}
            activeChannel={activeChannel}
            onChannelSelect={handleChannelSelect}
            onCreateChannel={handleCreateChannel}
            className="h-full"
          />
        ) : (
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
        )}

        <CreateChannelDialog
          open={showCreateChannel}
          onOpenChange={setShowCreateChannel}
          onChannelCreated={handleChannelCreated}
        />
      </div>
    );
  }

  // Desktop layout with sidebar
  return (
    <SidebarProvider defaultOpen>
      <div className="flex h-[calc(100vh-12rem)] w-full">
        <Sidebar className="w-80 border-r">
          <SidebarContent className="p-0">
            <ChatSidebar
              channels={channels}
              activeChannel={activeChannel}
              onChannelSelect={onChannelSelect}
              onCreateChannel={handleCreateChannel}
              className="h-full border-0 shadow-none"
            />
          </SidebarContent>
        </Sidebar>

        <main className="flex-1">
          <ChatMessages
            messages={messages}
            currentChannel={currentChannel}
            newMessage={newMessage}
            onNewMessageChange={onNewMessageChange}
            onSendMessage={onSendMessage}
            onKeyPress={onKeyPress}
            className="h-full"
          />
        </main>
      </div>

      <CreateChannelDialog
        open={showCreateChannel}
        onOpenChange={setShowCreateChannel}
        onChannelCreated={handleChannelCreated}
      />
    </SidebarProvider>
  );
};