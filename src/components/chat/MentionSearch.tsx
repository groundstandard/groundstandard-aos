import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Crown, Users, Hash, Lock, Star } from 'lucide-react';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  role: 'student' | 'instructor' | 'admin';
  profileName: string;
}

interface Channel {
  id: string;
  name: string;
  description: string;
  type: 'public' | 'private' | 'premium';
  is_admin_only: boolean;
  profileName: string;
}

interface MentionSearchProps {
  searchQuery: string;
  onSelectUser: (user: User | Channel | { id: 'everyone', profileName: '@everyone', first_name: 'Everyone', last_name: '', role: 'admin' }) => void;
  currentUserRole: string;
  position: { top: number; left: number };
  searchType: 'user' | 'channel';
}

export const MentionSearch = ({ searchQuery, onSelectUser, currentUserRole, position, searchType }: MentionSearchProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      if (searchQuery.length < 1) {
        setUsers([]);
        setChannels([]);
        return;
      }

      setLoading(true);
      try {
        if (searchType === 'user') {
          // Fetch users
          const { data, error } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, role')
            .or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%`)
            .limit(10);

          if (error) throw error;

          const formattedUsers = (data || []).map(user => ({
            ...user,
            profileName: `@${user.first_name}${user.last_name}`.toLowerCase(),
            role: user.role as 'student' | 'instructor' | 'admin'
          }));

          setUsers(formattedUsers);
        } else {
          // Fetch channels
          const { data, error } = await supabase
            .from('chat_channels')
            .select('id, name, description, type, is_admin_only')
            .ilike('name', `%${searchQuery}%`)
            .limit(10);

          if (error) throw error;

          const formattedChannels = (data || []).map(channel => ({
            ...channel,
            profileName: `#${channel.name}`,
            type: channel.type as 'public' | 'private' | 'premium'
          }));

          setChannels(formattedChannels);
        }
      } catch (error) {
        console.error('Error fetching search results:', error);
        setUsers([]);
        setChannels([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [searchQuery, searchType]);

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
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
    if (channel.type === 'private') return <Lock className="h-4 w-4" />;
    if (channel.type === 'premium') return <Star className="h-4 w-4" />;
    return <Hash className="h-4 w-4" />;
  };

  const shouldShowEveryone = searchType === 'user' && currentUserRole === 'admin' && 
    ('everyone'.includes(searchQuery.toLowerCase()) || searchQuery.length === 0);

  if (!loading && users.length === 0 && channels.length === 0 && !shouldShowEveryone) {
    return null;
  }

  return (
    <div 
      className="absolute z-50 bg-popover border rounded-lg shadow-lg p-2 min-w-64 max-w-80 max-h-64 overflow-y-auto"
      style={{ top: position.top, left: position.left }}
    >
      {loading && (
        <div className="p-3 text-center text-muted-foreground text-sm">
          {searchType === 'user' ? 'Searching people...' : 'Searching channels...'}
        </div>
      )}

      {/* @everyone option for admins when searching users */}
      {shouldShowEveryone && (
        <div
          onClick={() => onSelectUser({ 
            id: 'everyone', 
            profileName: '@everyone', 
            first_name: 'Everyone', 
            last_name: '', 
            role: 'admin'
          })}
          className="flex items-center gap-3 p-2 hover:bg-muted rounded-md cursor-pointer"
        >
          <div className="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-600 rounded-full">
            <Users className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">@everyone</span>
              <Badge variant="outline" className="text-xs h-4 bg-purple-500/10 text-purple-700 border-purple-200">
                <Crown className="h-3 w-3 mr-1" />
                Admin Only
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">Notify all channel members</p>
          </div>
        </div>
      )}

      {/* User results */}
      {searchType === 'user' && users.map((user) => (
        <div
          key={user.id}
          onClick={() => onSelectUser(user)}
          className="flex items-center gap-3 p-2 hover:bg-muted rounded-md cursor-pointer"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              {getInitials(user.first_name, user.last_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{user.profileName}</span>
              <Badge variant="outline" className={`text-xs h-4 ${getRoleColor(user.role)}`}>
                {user.role}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {user.first_name} {user.last_name}
            </p>
          </div>
        </div>
      ))}

      {/* Channel results */}
      {searchType === 'channel' && channels.map((channel) => (
        <div
          key={channel.id}
          onClick={() => onSelectUser(channel)}
          className="flex items-center gap-3 p-2 hover:bg-muted rounded-md cursor-pointer"
        >
          <div className="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-green-500 to-blue-600 rounded-full">
            {getChannelIcon(channel)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{channel.profileName}</span>
              <Badge variant="outline" className={`text-xs h-4 ${
                channel.type === 'private' ? 'bg-orange-500/10 text-orange-700 border-orange-200' :
                channel.type === 'premium' ? 'bg-yellow-500/10 text-yellow-700 border-yellow-200' :
                'bg-green-500/10 text-green-700 border-green-200'
              }`}>
                {channel.type}
              </Badge>
              {channel.is_admin_only && (
                <Badge variant="outline" className="text-xs h-4 bg-red-500/10 text-red-700 border-red-200">
                  <Crown className="h-3 w-3 mr-1" />
                  Admin
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {channel.description || 'No description'}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};