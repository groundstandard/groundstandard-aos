import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Building2, ChevronDown, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAcademy } from '@/hooks/useAcademy';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface Academy {
  id: string;
  name: string;
  city?: string;
  state?: string;
}

const AcademySwitcher = () => {
  const { user, profile } = useAuth();
  const { academy, refreshAcademy } = useAcademy();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userAcademies, setUserAcademies] = useState<Academy[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUserAcademies();
  }, [user]);

  const fetchUserAcademies = async () => {
    if (!user) return;

    try {
      // Get academies where user is owner
      const { data: ownedAcademies } = await supabase
        .from('academies')
        .select('id, name, city, state')
        .eq('owner_id', user.id);

      // Get academies where user is a member (through invitations that were accepted)
      const { data: memberAcademies } = await supabase
        .from('academy_invitations')
        .select(`
          academy_id,
          academies:academy_id (
            id,
            name,
            city,
            state
          )
        `)
        .eq('email', user.email)
        .eq('status', 'accepted');

      const memberAcademyList = memberAcademies?.map((inv: any) => inv.academies).filter(Boolean) || [];
      
      const allAcademies = [
        ...(ownedAcademies || []),
        ...memberAcademyList
      ];

      // Remove duplicates
      const uniqueAcademies = allAcademies.filter((academy, index, self) => 
        index === self.findIndex((a) => a.id === academy.id)
      );

      setUserAcademies(uniqueAcademies);
    } catch (error) {
      console.error('Error fetching user academies:', error);
    }
  };

  const switchAcademy = async (academyId: string) => {
    setLoading(true);
    try {
      // Update user's profile to switch to selected academy
      const { error } = await supabase
        .from('profiles')
        .update({ academy_id: academyId })
        .eq('id', user?.id);

      if (error) throw error;

      toast({
        title: "Academy Switched",
        description: "Successfully switched to the selected academy.",
      });

      await refreshAcademy();
      await fetchUserAcademies();
    } catch (error) {
      console.error('Error switching academy:', error);
      toast({
        title: "Error",
        description: "Failed to switch academy. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createNewAcademy = () => {
    navigate('/academy-setup');
  };

  if (!user || userAcademies.length <= 1) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="h-9 px-3 min-w-[200px] justify-between"
          disabled={loading}
        >
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="truncate">
              {academy?.name || 'Select Academy'}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 ml-1 flex-shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[300px]">
        <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
          Your Academies
        </div>
        <DropdownMenuSeparator />
        {userAcademies.map((userAcademy) => (
          <DropdownMenuItem
            key={userAcademy.id}
            onClick={() => switchAcademy(userAcademy.id)}
            className="flex items-center gap-2 cursor-pointer"
            disabled={loading}
          >
            <Building2 className="h-4 w-4" />
            <div className="flex-1">
              <div className="font-medium">{userAcademy.name}</div>
              {userAcademy.city && userAcademy.state && (
                <div className="text-xs text-muted-foreground">
                  {userAcademy.city}, {userAcademy.state}
                </div>
              )}
            </div>
            {academy?.id === userAcademy.id && (
              <div className="h-2 w-2 rounded-full bg-primary" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={createNewAcademy}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Create New Academy</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AcademySwitcher;