import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { Search, MessageCircle } from 'lucide-react';

interface User {
  id: string;
  name: string;
  role: string;
  online?: boolean;
}

interface StartDMModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartDM: (userId: string) => void;
}

export const StartDMModal = ({ open, onOpenChange, onStartDM }: StartDMModalProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const { profile } = useAuth();

  // Mock users for demo - in real app, fetch from Supabase
  useEffect(() => {
    const mockUsers: User[] = [
      { id: 'user1', name: 'Alex Chen', role: 'student', online: true },
      { id: 'user2', name: 'Sarah Johnson', role: 'instructor', online: false },
      { id: 'user3', name: 'Mike Rodriguez', role: 'student', online: true },
      { id: 'user4', name: 'Emma Davis', role: 'admin', online: true },
      { id: 'user5', name: 'Tom Wilson', role: 'student', online: false },
      { id: 'user6', name: 'Lisa Anderson', role: 'instructor', online: true },
    ].filter(user => user.id !== profile?.id); // Don't show current user

    setUsers(mockUsers);
  }, [profile]);

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartDM = (userId: string) => {
    onStartDM(userId);
    onOpenChange(false);
    setSearchQuery('');
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
            <MessageCircle className="h-5 w-5" />
            Start a Direct Message
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for a user..."
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
                  <Button
                    key={user.id}
                    variant="ghost"
                    className="w-full justify-start h-auto p-3 hover:bg-muted/50"
                    onClick={() => handleStartDM(user.id)}
                  >
                    <div className="flex items-center gap-3 w-full">
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
                  </Button>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? 'No users found' : 'No users available'}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};