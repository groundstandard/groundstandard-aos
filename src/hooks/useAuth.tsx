import { createContext, useContext, useEffect, useRef, useState } from 'react';
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
  onlineUserIds: Set<string>;
  onlineAtByUserId: Record<string, string>;
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
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [onlineAtByUserId, setOnlineAtByUserId] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const lastProfileFetchUserIdRef = useRef<string | null>(null);
  const loginIntentKey = 'audit:login_intent';
  const presenceKeyRef = useRef<string | null>(null);
  const presenceChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const logAuthAuditEvent = async (action: 'login' | 'logout', userId: string | null) => {
    if (!userId) return;
    try {
      await supabase.from('audit_logs').insert({
        user_id: userId,
        action,
        table_name: 'auth',
        record_id: null,
        old_values: null,
        new_values: null,
      });
    } catch (e) {
      // Intentionally ignore audit logging failures to avoid blocking auth flows
    }
  };

  const shouldLogLoginForSession = (userId: string, accessToken: string | null | undefined) => {
    if (!accessToken) return false;
    try {
      const key = `audit:last_login_token:${userId}`;
      const last = sessionStorage.getItem(key);
      if (last === accessToken) return false;
      sessionStorage.setItem(key, accessToken);
      return true;
    } catch {
      // If sessionStorage isn't available, fall back to logging once per SIGNED_IN.
      return true;
    }
  };

  const consumeLoginIntent = () => {
    try {
      const v = sessionStorage.getItem(loginIntentKey);
      if (!v) return false;
      sessionStorage.removeItem(loginIntentKey);
      return true;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        lastProfileFetchUserIdRef.current = session.user.id;
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);

        if (event === 'SIGNED_IN' && session?.user?.id) {
          // Only log login when we know the user just performed a real login action.
          // This prevents page refresh/session restore from creating repeated login logs.
          const hasIntent = consumeLoginIntent();
          if (hasIntent) {
            const shouldLog = shouldLogLoginForSession(session.user.id, session.access_token);
            if (shouldLog) {
              setTimeout(() => {
                logAuthAuditEvent('login', session.user.id);
              }, 0);
            }
          }
        }

        setUser((prev) => {
          const next = session?.user ?? null;
          if (!prev && !next) return prev;
          if (!prev && next) return next;
          if (prev && !next) return next;

          // Both exist
          if (prev.id !== next.id) return next;

          // Avoid churning the User object on token refresh / focus; only replace on explicit events.
          if (event === 'SIGNED_IN' || event === 'USER_UPDATED') return next;
          return prev;
        });
        if (session?.user) {
          const userId = session.user.id;
          const shouldFetchProfile =
            event === 'SIGNED_IN' ||
            event === 'USER_UPDATED' ||
            lastProfileFetchUserIdRef.current !== userId;

          if (shouldFetchProfile) {
            lastProfileFetchUserIdRef.current = userId;
            // Defer Supabase calls with setTimeout to prevent deadlocks
            setTimeout(() => {
              fetchProfile(userId);
            }, 0);
          }
        } else {
          lastProfileFetchUserIdRef.current = null;
          setProfile(null);
          setUserAcademies([]);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const userId = profile?.id;
    if (!userId) {
      if (presenceChannelRef.current) {
        supabase.removeChannel(presenceChannelRef.current);
        presenceChannelRef.current = null;
      }
      presenceKeyRef.current = null;
      setOnlineUserIds(new Set());
      setOnlineAtByUserId({});
      return;
    }

    if (!presenceKeyRef.current) presenceKeyRef.current = userId;

    if (presenceChannelRef.current) {
      supabase.removeChannel(presenceChannelRef.current);
      presenceChannelRef.current = null;
    }

    const channel = supabase.channel('app-presence', {
      config: { presence: { key: presenceKeyRef.current } },
    });
    presenceChannelRef.current = channel;

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState() as Record<string, any[]>;
      const ids = Object.keys(state || {});
      setOnlineUserIds(new Set(ids));

      const nextOnlineAt: Record<string, string> = {};
      for (const id of ids) {
        const sessions = (state[id] || []) as any[];
        let best: string | null = null;
        for (const s of sessions) {
          const onlineAt = typeof s?.online_at === 'string' ? s.online_at : null;
          if (!onlineAt) continue;
          if (!best) best = onlineAt;
          else if (new Date(onlineAt).getTime() < new Date(best).getTime()) best = onlineAt;
        }
        if (best) nextOnlineAt[id] = best;
      }
      setOnlineAtByUserId(nextOnlineAt);
    });

    channel.subscribe(async (status) => {
      if (status !== 'SUBSCRIBED') return;

      let onlineAt: string;
      try {
        const key = `presence:online_at:${userId}`;
        const stored = sessionStorage.getItem(key);
        onlineAt = stored || new Date().toISOString();
        if (!stored) sessionStorage.setItem(key, onlineAt);
      } catch {
        onlineAt = new Date().toISOString();
      }

      await channel.track({
        user_id: userId,
        name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim(),
        online_at: onlineAt,
        status: 'online',
      });
    });

    return () => {
      if (presenceChannelRef.current) {
        supabase.removeChannel(presenceChannelRef.current);
        presenceChannelRef.current = null;
      }
    };
  }, [profile?.id, profile?.first_name, profile?.last_name]);

  const fetchProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId);
      const profileQuery = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Profile request timed out')), 15000);
      });

      const { data, error } = await Promise.race([profileQuery, timeoutPromise]);

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', {
          message: (error as any).message,
          details: (error as any).details,
          hint: (error as any).hint,
          code: (error as any).code,
          status: (error as any).status,
        });

        const status = (error as any).status;
        if (status >= 500) {
          try {
            await supabase.auth.signOut();
          } finally {
            setUser(null);
            setProfile(null);
            setUserAcademies([]);
            navigate('/auth');
          }
        }

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
    } catch (error) {
      console.error('switchAcademy: Error occurred', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const currentUserId = user?.id || (await supabase.auth.getUser()).data.user?.id || null;
      await logAuthAuditEvent('logout', currentUserId);

      if (presenceChannelRef.current) {
        supabase.removeChannel(presenceChannelRef.current);
        presenceChannelRef.current = null;
      }
      presenceKeyRef.current = null;

      // Clear local storage and session storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Sign out from Supabase
      await supabase.auth.signOut();

      setUser(null);
      setProfile(null);
      setUserAcademies([]);
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
      navigate('/auth');
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      userAcademies, 
      onlineUserIds,
      onlineAtByUserId,
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