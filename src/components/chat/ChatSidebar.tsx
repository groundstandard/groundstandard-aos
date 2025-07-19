import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Hash, 
  Lock, 
  Crown, 
  Plus, 
  MessageCircle,
  Users,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

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

interface DirectMessageUser {
  user_id: string;
  name: string;
  online_at: string;
  status: 'online' | 'away' | 'busy';
  unread_count?: number;
  last_message?: string;
}

interface ChatSidebarProps {
  channels: Channel[];
  activeChannel: string;
  onChannelSelect: (channelId: string) => void;
  onCreateChannel: () => void;
  onStartDM: () => void;
  onDirectMessageSelect: (userId: string) => void;
  directMessageUsers: DirectMessageUser[];
  className?: string;
}

export const ChatSidebar = ({ 
  channels, 
  activeChannel, 
  onChannelSelect, 
  onCreateChannel,
  onStartDM,
  onDirectMessageSelect,
  directMessageUsers,
  className = ""
}: ChatSidebarProps) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedSections, setCollapsedSections] = useState<{[key: string]: boolean}>({});
  const { profile } = useAuth();
  const { subscriptionInfo } = useSubscription();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const toggleSection = (sectionId: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
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

    onChannelSelect(channelId);
  };

  const filteredChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    channel.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupChannels = filteredChannels.filter(channel => 
    channel.type === 'public' || channel.type === 'private' || channel.type === 'premium'
  );
  
  const directMessages = []; // We'll add direct messages later when that feature is implemented

  const ChannelItem = ({ channel }: { channel: Channel }) => (
    <button
      onClick={() => handleChannelSwitch(channel.id)}
      className={`w-full p-2 rounded-lg transition-all duration-200 flex items-center space-x-3 group ${
        activeChannel === channel.id
          ? 'bg-primary text-primary-foreground shadow-md'
          : 'hover:bg-muted/60 active:bg-muted/80'
      }`}
    >
      <div className="relative">
        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
          activeChannel === channel.id 
            ? 'bg-primary-foreground/20' 
            : 'bg-gradient-to-br from-blue-500/10 to-purple-600/10'
        }`}>
          {getChannelIcon(channel)}
        </div>
      </div>
      
      <div className="flex-1 text-left min-w-0">
        <div className="flex items-center justify-between">
          <p className={`font-medium truncate text-sm ${
            activeChannel === channel.id ? 'text-primary-foreground' : 'text-foreground'
          }`}>
            {channel.type === 'public' ? '#' : ''}{channel.name}
          </p>
          {channel.unread_count && channel.unread_count > 0 && (
            <Badge 
              variant={activeChannel === channel.id ? "secondary" : "default"} 
              className="h-4 min-w-4 text-xs rounded-full ml-2"
            >
              {channel.unread_count > 99 ? '99+' : channel.unread_count}
            </Badge>
          )}
        </div>
        {channel.last_message && (
          <p className={`text-xs truncate ${
            activeChannel === channel.id ? 'text-primary-foreground/70' : 'text-muted-foreground'
          }`}>
            {channel.last_message}
          </p>
        )}
      </div>
    </button>
  );

  const ChannelSection = ({ 
    title, 
    channels, 
    icon, 
    showCreateButton = false,
    sectionId
  }: { 
    title: string; 
    channels: Channel[]; 
    icon: React.ReactNode;
    showCreateButton?: boolean;
    sectionId: string;
  }) => {
    const isCollapsed = collapsedSections[sectionId];
    
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between px-4">
          <button
            onClick={() => toggleSection(sectionId)}
            className="flex items-center space-x-2 hover:bg-muted/50 rounded p-1 -ml-1 transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
            {icon}
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
              {title}
            </h3>
          </button>
          {showCreateButton && profile?.role === 'admin' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCreateChannel}
              className="h-7 w-7 p-0 rounded-full hover:bg-muted"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
        {!isCollapsed && (
          <div className="space-y-1 px-2">
            {channels.map((channel) => (
              <ChannelItem key={channel.id} channel={channel} />
            ))}
          </div>
        )}
      </div>
    );
  };

  if (isMobile) {
    return (
      <div className={`h-full bg-background ${className}`}>
        {/* Mobile Header */}
        <div className="p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <h1 className="text-2xl font-bold mb-4">Messages</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-full bg-muted/50 border-0 h-10"
            />
          </div>
        </div>

        <Tabs defaultValue="channels" className="flex-1">
          <TabsList className="grid w-full grid-cols-2 rounded-none border-b bg-background h-12">
            <TabsTrigger value="channels" className="rounded-none font-semibold">
              Channels
            </TabsTrigger>
            <TabsTrigger value="direct" className="rounded-none font-semibold">
              Direct
            </TabsTrigger>
          </TabsList>

          <TabsContent value="channels" className="p-0 mt-0 space-y-4 overflow-y-auto h-full">
            <div className="py-4">
              <ChannelSection 
                title="Channels" 
                channels={groupChannels.filter(c => c.type === 'public')}
                icon={<Hash className="h-4 w-4" />}
                showCreateButton={true}
                sectionId="public-channels"
              />
              
              {groupChannels.some(c => c.type === 'premium') && (
                <ChannelSection 
                  title="Premium Channels" 
                  channels={groupChannels.filter(c => c.type === 'premium')}
                  icon={<Crown className="h-4 w-4 text-amber-500" />}
                  sectionId="premium-channels"
                />
              )}
              
              {profile?.role === 'admin' && groupChannels.some(c => c.is_admin_only) && (
                <ChannelSection 
                  title="Private Channels" 
                  channels={groupChannels.filter(c => c.is_admin_only)}
                  icon={<Lock className="h-4 w-4" />}
                  sectionId="private-channels"
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="direct" className="p-4 space-y-4 overflow-y-auto h-full">
            {directMessageUsers.length > 0 ? (
              <div className="space-y-1">
                {directMessageUsers.map((user) => (
                  <button
                    key={user.user_id}
                    onClick={() => onDirectMessageSelect(user.user_id)}
                    className="w-full p-2 rounded-lg transition-all duration-200 flex items-center space-x-3 hover:bg-muted/60"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs bg-gradient-to-br from-green-500/10 to-blue-600/10">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-sm">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.status}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-semibold text-muted-foreground mb-2">No Direct Messages</h3>
                <p className="text-sm text-muted-foreground">Start a conversation with someone!</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className={`h-full bg-background flex flex-col ${className}`}>
      {/* Desktop Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Messages</h2>
          {profile?.role === 'admin' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCreateChannel}
              className="h-8 w-8 p-0 rounded-full hover:bg-muted"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-full bg-muted/50 border-0"
          />
        </div>
      </div>

      {/* Desktop Content */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        <ChannelSection 
          title="Channels" 
          channels={groupChannels.filter(c => c.type === 'public')}
          icon={<Hash className="h-4 w-4" />}
          showCreateButton={true}
          sectionId="public-channels"
        />
        
        {groupChannels.some(c => c.type === 'premium') && (
          <ChannelSection 
            title="Premium Channels" 
            channels={groupChannels.filter(c => c.type === 'premium')}
            icon={<Crown className="h-4 w-4 text-amber-500" />}
            sectionId="premium-channels"
          />
        )}
        
        {profile?.role === 'admin' && groupChannels.some(c => c.is_admin_only) && (
          <ChannelSection 
            title="Private Channels" 
            channels={groupChannels.filter(c => c.is_admin_only)}
            icon={<Lock className="h-4 w-4" />}
            sectionId="private-channels"
          />
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between px-4">
            <button
              onClick={() => toggleSection('direct-messages')}
              className="flex items-center space-x-2 hover:bg-muted/50 rounded p-1 -ml-1 transition-colors"
            >
              {collapsedSections['direct-messages'] ? (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
              <MessageCircle className="h-4 w-4" />
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                Direct Messages
              </h3>
            </button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onStartDM}
              className="h-7 w-7 p-0 rounded-full hover:bg-muted"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {!collapsedSections['direct-messages'] && (
            <div className="px-2">
              {directMessageUsers.length > 0 ? (
                <div className="space-y-1">
                  {directMessageUsers.map((user) => (
                    <button
                      key={user.user_id}
                      onClick={() => onDirectMessageSelect(user.user_id)}
                      className="w-full p-2 rounded-lg transition-all duration-200 flex items-center space-x-3 hover:bg-muted/60"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-gradient-to-br from-green-500/10 to-blue-600/10">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-sm">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.status}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <MessageCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Start a conversation with someone!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};