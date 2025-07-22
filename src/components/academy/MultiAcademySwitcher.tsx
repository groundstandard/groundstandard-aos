import { useState } from "react";
import { ChevronDown, Plus, Building2, Users, Crown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAcademy } from "@/hooks/useAcademy";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

// ABOUTME: Multi-Academy Switcher Component - Secure academy switching with proper error handling

const MultiAcademySwitcher = () => {
  const { user, userAcademies, switchAcademy } = useAuth();
  const { academy, currentAcademyId } = useAcademy();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  if (!user || userAcademies.length === 0) {
    return null;
  }

  const handleAcademySwitch = async (academyId: string) => {
    if (academyId === currentAcademyId) {
      return; // Already selected
    }

    setIsLoading(true);
    try {
      await switchAcademy(academyId);
      toast({
        title: "Academy Switched",
        description: "Successfully switched to the selected academy.",
      });
    } catch (error) {
      console.error('Error switching academy:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to switch academy. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'admin':
        return <Building2 className="h-4 w-4 text-blue-500" />;
      default:
        return <Users className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      'owner': 'default',
      'admin': 'secondary',
      'instructor': 'secondary',
      'staff': 'secondary',
      'student': 'default',
    };

    return (
      <Badge variant={variants[role] || 'default'} className="text-xs">
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  const currentAcademy = userAcademies.find(
    membership => membership.academy_id === currentAcademyId
  );

  // Only show switcher if user has multiple academies
  if (userAcademies.length === 1) {
    return (
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        {getRoleIcon(currentAcademy?.role || 'student')}
        <span className="font-medium">{academy?.name || 'Loading...'}</span>
        {currentAcademy && getRoleBadge(currentAcademy.role)}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="h-auto p-2 w-full justify-between max-w-[280px]"
          disabled={isLoading}
        >
          <div className="flex items-center space-x-2 truncate">
            {currentAcademy && getRoleIcon(currentAcademy.role)}
            <div className="flex flex-col items-start min-w-0">
              <span className="font-medium text-sm truncate">
                {academy?.name || 'Select Academy'}
              </span>
              {currentAcademy && (
                <span className="text-xs text-muted-foreground">
                  {currentAcademy.role.charAt(0).toUpperCase() + currentAcademy.role.slice(1)}
                </span>
              )}
            </div>
          </div>
          <ChevronDown className="h-4 w-4 flex-shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="start" 
        className="w-80 bg-background border shadow-lg z-50"
      >
        <DropdownMenuLabel className="font-semibold">
          Switch Academy ({userAcademies.length})
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {userAcademies.map((membership) => (
          <DropdownMenuItem
            key={membership.academy_id}
            onClick={() => handleAcademySwitch(membership.academy_id)}
            disabled={isLoading}
            className={`p-3 cursor-pointer hover:bg-muted ${
              membership.academy_id === currentAcademyId 
                ? 'bg-muted ring-1 ring-primary' 
                : ''
            }`}
          >
            <div className="flex items-center space-x-3 w-full">
              {getRoleIcon(membership.role)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium truncate">
                    {membership.academy_name}
                  </span>
                  {membership.academy_id === currentAcademyId && (
                    <Badge variant="default" className="text-xs ml-2">
                      Current
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  {getRoleBadge(membership.role)}
                  {membership.city && membership.state && (
                    <span className="text-xs text-muted-foreground">
                      {membership.city}, {membership.state}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => window.location.href = '/academy-setup'}
          className="p-3 cursor-pointer hover:bg-muted"
        >
          <div className="flex items-center space-x-3">
            <Plus className="h-4 w-4" />
            <span>Create New Academy</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default MultiAcademySwitcher;