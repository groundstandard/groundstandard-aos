import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Shield, User } from 'lucide-react';
import { useView } from '@/hooks/useView';

export const ViewToggle = () => {
  const { currentView, setCurrentView, canSwitchView } = useView();

  if (!canSwitchView) {
    return null;
  }

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