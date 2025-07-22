import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'student' | 'admin' | 'instructor' | 'owner';
  parent_id?: string;
  phone?: string;
  emergency_contact?: string;
  belt_level?: string;
  membership_status: 'active' | 'inactive' | 'alumni';
  academy_id?: string; // Current academy (will be deprecated)
  last_academy_id?: string; // Most recent academy for auto-login
  created_at: string;
  updated_at: string;
}

interface AcademyMembership {
  academy_id: string;
  role: string;
  academy_name: string;
  city: string;
  state: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  userAcademies: AcademyMembership[];
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshAcademies: () => Promise<void>;
  switchAcademy: (academyId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userAcademies, setUserAcademies] = useState<AcademyMembership[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Clear any stale auth state on mount
    const clearStaleState = () => {
      const lastClear = localStorage.getItem('auth_state_cleared');
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;
      
      if (!lastClear || (now - parseInt(lastClear)) > oneHour) {
        // Clear potentially stale auth data
        localStorage.removeItem('supabase.auth.token');
        sessionStorage.clear();
        localStorage.setItem('auth_state_cleared', now.toString());
      }
    };

    clearStaleState();

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        
        setUser(session?.user ?? null);
        if (session?.user) {
          // Defer Supabase calls with setTimeout to prevent deadlocks
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setLoading(false);
          // Clear any cached data on sign out
          localStorage.removeItem('auth_state_cleared');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        // Don't try to fetch academies if profile fetch failed
        setLoading(false);
        return;
      } else if (data) {
        console.log('Profile fetched successfully:', data);
        setProfile(data as Profile);
        console.log('Profile state updated, now fetching academies...');
        // Only fetch user academies after profile is successfully set
        try {
          await fetchUserAcademies(userId);
          console.log('Academies fetched successfully');
        } catch (academyError) {
          console.error('Error fetching academies (but profile is loaded):', academyError);
        }
      } else {
        console.log('No profile data found');
        setProfile(null);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserAcademies = async (userId: string) => {
    try {
      console.log('Fetching academies for user:', userId);
      const { data, error } = await supabase
        .rpc('get_user_academies', { target_user_id: userId });

      console.log('Academy fetch result:', { data, error });
      if (error) {
        console.error('Error fetching user academies:', error);
        setUserAcademies([]);
      } else if (data) {
        console.log('Setting user academies:', data);
        setUserAcademies(data as AcademyMembership[]);
      } else {
        console.log('No academy data returned');
        setUserAcademies([]);
      }
    } catch (error) {
      console.error('Error fetching user academies:', error);
      setUserAcademies([]);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const refreshAcademies = async () => {
    if (user) {
      await fetchUserAcademies(user.id);
    }
  };

  const switchAcademy = async (academyId: string) => {
    if (!user) {
      console.error('switchAcademy: No user found');
      return;
    }

    console.log('switchAcademy: Starting academy switch', {
      fromAcademyId: profile?.last_academy_id,
      toAcademyId: academyId,
      userId: user.id
    });

    try {
      // Update last_academy_id in profile
      console.log('switchAcademy: Updating profile with new last_academy_id');
      const { data, error } = await supabase
        .from('profiles')
        .update({ last_academy_id: academyId })
        .eq('id', user.id)
        .select();

      console.log('switchAcademy: Profile update result', { data, error });

      if (error) {
        console.error('switchAcademy: Profile update failed', error);
        throw error;
      }

      // Log the academy switch
      console.log('switchAcademy: Logging academy switch');
      const { error: logError } = await supabase
        .from('academy_switches')
        .insert({
          user_id: user.id,
          from_academy_id: profile?.last_academy_id,
          to_academy_id: academyId
        });

      if (logError) {
        console.error('switchAcademy: Academy switch logging failed', logError);
      }

      // Refresh profile to get updated last_academy_id
      console.log('switchAcademy: Refreshing profile');
      await refreshProfile();
      
      console.log('switchAcademy: Reloading page');
      // Reload the page to clear any cached academy-specific data
      window.location.reload();
    } catch (error) {
      console.error('switchAcademy: Error occurred', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Clear local storage and session storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Force page reload to clear any cached state
      window.location.reload();
    } catch (error) {
      console.error('Error signing out:', error);
      // Force reload even if sign out fails
      window.location.reload();
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      userAcademies, 
      loading, 
      signOut, 
      refreshProfile, 
      refreshAcademies, 
      switchAcademy 
    }}>
      {children}
    </AuthContext.Provider>
  );
};