import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Crown, Users } from 'lucide-react';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  role: 'student' | 'instructor' | 'admin';
  profileName: string;
}

interface MentionSearchProps {
  searchQuery: string;
  onSelectUser: (user: User | { id: 'everyone', profileName: '@everyone', first_name: 'Everyone', last_name: '', role: 'admin' }) => void;
  currentUserRole: string;
  position: { top: number; left: number };
}

export const MentionSearch = ({ searchQuery, onSelectUser, currentUserRole, position }: MentionSearchProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      if (searchQuery.length < 1) {
        setUsers([]);
        return;
      }

      setLoading(true);
      try {
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
      } catch (error) {
        console.error('Error fetching users:', error);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [searchQuery]);

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

  const shouldShowEveryone = currentUserRole === 'admin' && 
    ('everyone'.includes(searchQuery.toLowerCase()) || searchQuery.length === 0);

  if (!loading && users.length === 0 && !shouldShowEveryone) {
    return null;
  }

  return (
    <div 
      className="absolute z-50 bg-popover border rounded-lg shadow-lg p-2 min-w-64 max-w-80 max-h-64 overflow-y-auto"
      style={{ top: position.top, left: position.left }}
    >
      {loading && (
        <div className="p-3 text-center text-muted-foreground text-sm">
          Searching...
        </div>
      )}

      {/* @everyone option for admins */}
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

      {users.map((user) => (
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
    </div>
  );
};