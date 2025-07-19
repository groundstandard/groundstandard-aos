import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Hash, Lock, Crown, Plus, MessageCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useToast } from '@/hooks/use-toast';

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

interface ChatSidebarProps {
  channels: Channel[];
  activeChannel: string;
  onChannelSelect: (channelId: string) => void;
  onCreateChannel: () => void;
  className?: string;
}

export const ChatSidebar = ({ 
  channels, 
  activeChannel, 
  onChannelSelect, 
  onCreateChannel,
  className = ""
}: ChatSidebarProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { profile } = useAuth();
  const { subscriptionInfo } = useSubscription();
  const { toast } = useToast();

  const getChannelIcon = (channel: Channel) => {
    if (channel.type === 'premium') {
      return <Crown className="h-4 w-4 text-primary" />;
    }
    if (channel.type === 'private' || channel.is_admin_only) {
      return <Lock className="h-4 w-4" />;
    }
    return <Hash className="h-4 w-4" />;
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

    onChannelSelect(channelId);
  };

  const filteredChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    channel.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card className={`card-minimal shadow-soft flex flex-col h-full ${className}`}>
      <CardHeader className="pb-3 border-b shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            <span className="truncate">Academy Chat</span>
          </CardTitle>
          {profile?.role === 'admin' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCreateChannel}
              className="h-8 w-8 p-0 shrink-0"
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
      
      <CardContent className="flex-1 overflow-y-auto p-0 min-h-0">
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
        </div>
      </CardContent>
    </Card>
  );
};