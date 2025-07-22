import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Shield, User, Users } from 'lucide-react';
import { useView } from '@/hooks/useView';
import { useAuth } from '@/hooks/useAuth';

export const ViewToggle = () => {
  const { currentView, setCurrentView, canSwitchView } = useView();
  const { profile } = useAuth();

  if (!canSwitchView) {
    return null;
  }

  // Check if user logged in as staff
  const loginRole = localStorage.getItem('loginRole');
  const isStaffLogin = loginRole === 'staff';
  const isOwnerOrAdmin = profile?.role === 'admin' || profile?.role === 'owner';

  // For staff login or instructors, show Student View vs Staff View
  if (isStaffLogin || profile?.role === 'instructor' || profile?.role === 'staff') {
    return (
      <div className="flex items-center gap-3 p-3 border rounded-lg bg-background/50 backdrop-blur">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <Label htmlFor="view-toggle" className="text-sm font-medium">
            Student View
          </Label>
        </div>
        
        <Switch
          id="view-toggle"
          checked={currentView === 'admin'}
          onCheckedChange={(checked) => setCurrentView(checked ? 'admin' : 'student')}
          className="data-[state=checked]:bg-primary"
        />
        
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <Label htmlFor="view-toggle" className="text-sm font-medium">
            Staff View
          </Label>
        </div>
        
        <Badge variant={currentView === 'admin' ? 'default' : 'secondary'} className="ml-2">
          {currentView === 'admin' ? 'Staff' : 'Student'}
        </Badge>
      </div>
    );
  }

  // For owners/admins, show Student View vs Admin View
  return (
    <div className="flex items-center gap-3 p-3 border rounded-lg bg-background/50 backdrop-blur">
      <div className="flex items-center gap-2">
        <User className="h-4 w-4 text-muted-foreground" />
        <Label htmlFor="view-toggle" className="text-sm font-medium">
          Student View
        </Label>
      </div>
      
      <Switch
        id="view-toggle"
        checked={currentView === 'admin'}
        onCheckedChange={(checked) => setCurrentView(checked ? 'admin' : 'student')}
        className="data-[state=checked]:bg-primary"
      />
      
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4 text-muted-foreground" />
        <Label htmlFor="view-toggle" className="text-sm font-medium">
          Admin View
        </Label>
      </div>
      
      <Badge variant={currentView === 'admin' ? 'default' : 'secondary'} className="ml-2">
        {currentView === 'admin' ? 'Admin' : 'Student'}
      </Badge>
    </div>
  );
};