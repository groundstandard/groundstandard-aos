import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Crown, Users, GraduationCap, ChevronUp, ChevronDown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface RoleSwitcherProps {
  currentTestRole: string | null;
  onRoleChange: (role: string | null) => void;
}

export const RoleSwitcher = ({ currentTestRole, onRoleChange }: RoleSwitcherProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { profile } = useAuth();

  // Only show for actual owners (admin role is owner in current system)
  if (profile?.role !== 'admin') {
    return null;
  }

  const roles = [
    { value: null, label: 'Owner (Actual)', icon: Crown, color: 'bg-purple-500' },
    { value: 'admin', label: 'Admin View', icon: Settings, color: 'bg-blue-500' },
    { value: 'instructor', label: 'Staff View', icon: Users, color: 'bg-green-500' },
    { value: 'student', label: 'Member View', icon: GraduationCap, color: 'bg-orange-500' },
  ];

  const currentRole = roles.find(r => r.value === currentTestRole) || roles[0];
  const CurrentIcon = currentRole.icon;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg">
      {/* Collapsed View */}
      {!isExpanded && (
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center space-x-2">
            <div className={`p-1.5 rounded-full ${currentRole.color}`}>
              <CurrentIcon className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-medium">Testing as: {currentRole.label}</span>
            <Badge variant="outline" className="text-xs">
              Owner Panel
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(true)}
            className="h-8"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Expanded View */}
      {isExpanded && (
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Crown className="h-5 w-5 text-purple-500" />
              <h3 className="font-semibold">Owner Testing Panel</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
              className="h-8"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium">View as:</label>
            <Select
              value={currentTestRole || 'owner'}
              onValueChange={(value) => onRoleChange(value === 'owner' ? null : value)}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => {
                  const Icon = role.icon;
                  return (
                    <SelectItem key={role.value || 'owner'} value={role.value || 'owner'}>
                      <div className="flex items-center space-x-2">
                        <div className={`p-1 rounded-full ${role.color}`}>
                          <Icon className="h-3 w-3 text-white" />
                        </div>
                        <span>{role.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            {currentTestRole && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRoleChange(null)}
              >
                Reset to Owner
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Switch between different user roles to test permissions and UI changes. 
            This panel is only visible to owners.
          </p>
        </div>
      )}
    </div>
  );
};