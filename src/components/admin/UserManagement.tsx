import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { UserCog, Shield, User } from 'lucide-react';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'student' | 'admin';
  membership_status: string;
  created_at: string;
}

export const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const isMobile = useIsMobile();
  const { toast } = useToast();

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchUsers();
    }
  }, [profile]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data as User[] || []);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch users'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'student' | 'admin') => {
    try {
      const { error } = await supabase.rpc('update_user_role', {
        target_user_id: userId,
        new_role: newRole
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: `User role updated to ${newRole}`
      });

      // Refresh the users list
      fetchUsers();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update user role'
      });
    }
  };

  if (profile?.role !== 'admin') {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-2" />
            <p>Admin access required</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading users...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-full overflow-hidden">
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-base' : ''}`}>
          <UserCog className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
          User Management
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 sm:p-6">
        <div className="space-y-3 sm:space-y-4">
          {users.map((user) => (
            <div
              key={user.id}
              className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-center justify-between'} p-3 sm:p-4 border rounded-lg max-w-full overflow-hidden`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="flex-shrink-0">
                  {user.role === 'admin' ? (
                    <Shield className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-primary`} />
                  ) : (
                    <User className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-muted-foreground`} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`font-medium ${isMobile ? 'text-sm' : ''} truncate`}>
                    {user.first_name} {user.last_name}
                  </p>
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground truncate`}>{user.email}</p>
                </div>
              </div>
              
              <div className={`flex items-center gap-2 ${isMobile ? 'w-full justify-between' : ''}`}>
                <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className={isMobile ? 'text-xs' : ''}>
                  {user.role}
                </Badge>
                
                {user.id !== profile.id && (
                  <div className={`flex gap-1 ${isMobile ? 'flex-1 justify-end' : ''}`}>
                    {user.role === 'student' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateUserRole(user.id, 'admin')}
                        className={isMobile ? 'text-xs px-2' : ''}
                      >
                        Make Admin
                      </Button>
                    )}
                    {user.role === 'admin' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateUserRole(user.id, 'student')}
                        className={isMobile ? 'text-xs px-2' : ''}
                      >
                        Remove Admin
                      </Button>
                    )}
                  </div>
                )}
                
                {user.id === profile.id && (
                  <Badge variant="outline" className={isMobile ? 'text-xs' : ''}>You</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};