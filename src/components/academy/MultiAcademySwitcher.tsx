import { useState, useEffect } from "react";
import { ChevronDown, Plus, Building2, Users, Crown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAcademy } from "@/hooks/useAcademy";
import { useView } from "@/hooks/useView";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// ABOUTME: Multi-Academy Switcher Component - Secure academy switching with proper error handling

const MultiAcademySwitcher = () => {
  const { user, userAcademies, switchAcademy } = useAuth();
  const { academy, currentAcademyId } = useAcademy();
  const { currentView } = useView();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [academyLogos, setAcademyLogos] = useState<Record<string, string>>({});

  // Filter academies based on login role - only show staff roles for staff users
  const getFilteredAcademies = () => {
    const loginRole = localStorage.getItem('loginRole');
    
    // If logged in as staff, only show academies where they have staff roles
    if (loginRole === 'staff') {
      return userAcademies.filter(academy => academy.role !== 'student');
    }
    
    // If logged in as student, only show student roles
    if (loginRole === 'student') {
      return userAcademies.filter(academy => academy.role === 'student');
    }
    
    // Default: show all academies
    return userAcademies;
  };

  const filteredAcademies = getFilteredAcademies();

  // Get effective role for display based on view toggle
  const getEffectiveRole = (membership: any) => {
    const loginRole = localStorage.getItem('loginRole');
    
    // If user logged in as student but is in admin view, show their staff role
    if (loginRole === 'student' && currentView === 'admin') {
      // Find their staff role in this academy
      const staffMembership = userAcademies.find(
        m => m.academy_id === membership.academy_id && m.role !== 'student'
      );
      return staffMembership ? staffMembership.role : membership.role;
    }
    
    return membership.role;
  };

  // Fetch logos for all user academies
  useEffect(() => {
    const fetchAcademyLogos = async () => {
      if (!userAcademies.length) return;
      
      const academyIds = userAcademies.map(membership => membership.academy_id);
      const { data, error } = await supabase
        .from('academies')
        .select('id, logo_url')
        .in('id', academyIds);
      
      if (data && !error) {
        const logoMap: Record<string, string> = {};
        data.forEach(academy => {
          if (academy.logo_url) {
            logoMap[academy.id] = academy.logo_url;
          }
        });
        setAcademyLogos(logoMap);
      }
    };

    fetchAcademyLogos();
  }, [userAcademies]);

  if (!user || filteredAcademies.length === 0) {
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

  const getAcademyIcon = (membership: any, logoUrl?: string) => {
    // If academy has a logo, show it with role icon as fallback
    if (logoUrl) {
      return (
        <Avatar className="h-6 w-6">
          <AvatarImage src={logoUrl} alt={membership.academy_name} />
          <AvatarFallback>
            {getRoleIcon(membership.role)}
          </AvatarFallback>
        </Avatar>
      );
    }
    return getRoleIcon(membership.role);
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

  // Only show switcher if user has multiple filtered academies
  if (filteredAcademies.length === 1) {
    const currentFilteredAcademy = filteredAcademies[0];
    const effectiveRole = currentFilteredAcademy ? getEffectiveRole(currentFilteredAcademy) : currentFilteredAcademy?.role;
    return (
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        {getAcademyIcon(currentFilteredAcademy, academy?.logo_url)}
        <span className="font-medium">{academy?.name || 'Loading...'}</span>
        {effectiveRole && getRoleBadge(effectiveRole)}
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
            {currentAcademy && getAcademyIcon(currentAcademy, academy?.logo_url)}
            <div className="flex flex-col items-start min-w-0">
              <span className="font-medium text-sm truncate">
                {academy?.name || 'Select Academy'}
              </span>
              {currentAcademy && (
                <span className="text-xs text-muted-foreground">
                  {getEffectiveRole(currentAcademy).charAt(0).toUpperCase() + getEffectiveRole(currentAcademy).slice(1)}
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
          Switch Academy ({filteredAcademies.length})
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Scrollable academy list with max height */}
        <div className="max-h-[300px] overflow-y-auto">
          {filteredAcademies.map((membership) => (
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
                {getAcademyIcon(membership, academyLogos[membership.academy_id])}
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
        </div>
        
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