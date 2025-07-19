import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Search, Users } from 'lucide-react';

interface User {
  id: string;
  name: string;
  role: string;
  online?: boolean;
}

interface AddPeopleToChannelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddPeople: (userIds: string[]) => void;
  channelName?: string;
}

export const AddPeopleToChannelModal = ({ 
  open, 
  onOpenChange, 
  onAddPeople,
  channelName 
}: AddPeopleToChannelModalProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const { profile } = useAuth();

  // Fetch users from Supabase
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, role')
          .neq('id', profile?.id); // Don't show current user

        if (error) {
          console.error('Error fetching users:', error);
          return;
        }

        const fetchedUsers: User[] = data.map(user => ({
          id: user.id,
          name: `${user.first_name} ${user.last_name}`.trim(),
          role: user.role,
          online: Math.random() > 0.5 // Random online status for demo
        }));

        setUsers(fetchedUsers);
      } catch (error) {
        console.error('Error:', error);
      }
    };

    if (open && profile?.id) {
      fetchUsers();
    }
  }, [open, profile]);

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUserSelect = (userId: string, checked: boolean) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(userId);
      } else {
        newSet.delete(userId);
      }
      return newSet;
    });
  };

  const handleAddPeople = () => {
    if (selectedUsers.size > 0) {
      onAddPeople(Array.from(selectedUsers));
      onOpenChange(false);
      setSelectedUsers(new Set());
      setSearchQuery('');
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'text-red-500';
      case 'instructor': return 'text-blue-500';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Add People to {channelName || 'Channel'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* User List */}
          <ScrollArea className="h-80">
            <div className="space-y-1">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleUserSelect(user.id, !selectedUsers.has(user.id))}
                  >
                    <Checkbox
                      checked={selectedUsers.has(user.id)}
                      onCheckedChange={(checked) => handleUserSelect(user.id, checked as boolean)}
                    />
                    
                    <div className="relative">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      {user.online && (
                        <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 border-2 border-background rounded-full" />
                      )}
                    </div>
                    
                    <div className="flex-1 text-left">
                      <div className="font-medium text-sm">{user.name}</div>
                      <div className={`text-xs capitalize ${getRoleColor(user.role)}`}>
                        {user.role}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? 'No users found' : 'No users available'}
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Actions */}
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {selectedUsers.size} user{selectedUsers.size !== 1 ? 's' : ''} selected
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddPeople}
                disabled={selectedUsers.size === 0}
              >
                Add People
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};