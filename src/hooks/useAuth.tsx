import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'student' | 'admin' | 'instructor' | 'owner' | 'staff';
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
        
        // Handle password recovery
        if (event === 'PASSWORD_RECOVERY') {
          console.log('Password recovery event detected, user can now reset password');
        }
        
        setUser(session?.user ?? null);
        if (session?.user) {
          // Defer Supabase calls with setTimeout to prevent deadlocks
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setUserAcademies([]);
          setLoading(false);
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
        setLoading(false);
        return;
      } else if (data) {
        console.log('Profile fetched successfully:', data);
        setProfile(data as Profile);
        // Fetch user academies after profile is set
        await fetchUserAcademies(userId);
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
      throw new Error('No user found');
    }

    console.log('switchAcademy: Starting academy switch to:', academyId);

    try {
      // Use the secure database function to switch academy
      const { data, error } = await supabase
        .rpc('switch_user_academy', { target_academy_id: academyId });

      console.log('switchAcademy: Database function result', { data, error });

      if (error) {
        console.error('switchAcademy: Database function failed', error);
        throw error;
      }

      // Type cast the response to access the jsonb properties
      const result = data as { success: boolean; error?: string; old_academy_id?: string; new_academy_id?: string };

      if (!result?.success) {
        console.error('switchAcademy: Switch failed', result?.error);
        throw new Error(result?.error || 'Academy switch failed');
      }

      console.log('switchAcademy: Success! Refreshing profile...');
      
      // Refresh profile to get updated last_academy_id
      await refreshProfile();
      
      console.log('switchAcademy: Reloading page to refresh academy context');
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