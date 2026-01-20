import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Academy {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  website_url?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  timezone?: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  subscription_status?: string;
  max_students?: number;
  owner_id?: string;
  is_setup_complete?: boolean;
}

interface AcademyContextType {
  academy: Academy | null;
  currentAcademyId: string | null;
  loading: boolean;
  refreshAcademy: () => Promise<void>;
  updateAcademy: (updates: Partial<Academy>) => Promise<void>;
  canAccessFeature: (feature: string) => boolean;
  getStudentLimit: () => number;
  isTrialExpired: () => boolean;
}

const AcademyContext = createContext<AcademyContextType | undefined>(undefined);

export const useAcademy = (): AcademyContextType => {
  const context = useContext(AcademyContext);
  if (!context) {
    throw new Error('useAcademy must be used within an AcademyProvider');
  }
  return context;
};

export const AcademyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, userAcademies } = useAuth();
  const [academy, setAcademy] = useState<Academy | null>(null);
  const [currentAcademyId, setCurrentAcademyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshAcademy = async () => {
    if (!user || !profile) {
      setAcademy(null);
      setCurrentAcademyId(null);
      setLoading(false);
      return;
    }

    // Check if we're in student mode (force student selector) - only if user logged in as student
    const loginRole = localStorage.getItem('loginRole');
    const studentAcademies = userAcademies.filter(academy => academy.role === 'student');
    const forceStudentMode = loginRole === 'student' && studentAcademies.length > 1 && !localStorage.getItem('student_academy_selected');
    
    console.log('useAcademy: Student mode check', { loginRole, studentAcademiesCount: studentAcademies.length, studentAcademySelected: localStorage.getItem('student_academy_selected'), forceStudentMode });
    
    if (forceStudentMode) {
      console.log('useAcademy: Student mode active - preventing automatic academy loading');
      setAcademy(null);
      setCurrentAcademyId(null);
      setLoading(false);
      return;
    }

    // Determine which academy to load
    let academyIdToLoad: string | null = null;

    console.log('useAcademy: Determining academy to load', {
      'profile.last_academy_id': profile.last_academy_id,
      'userAcademies': userAcademies.map(a => a.academy_id)
    });

    // Priority 1: Use last_academy_id if user has access to it
    if (profile.last_academy_id) {
      const hasAccess = userAcademies.some(membership => 
        membership.academy_id === profile.last_academy_id
      );
      console.log('useAcademy: last_academy_id access check', { hasAccess });
      if (hasAccess) {
        academyIdToLoad = profile.last_academy_id;
        console.log('useAcademy: Using last_academy_id:', academyIdToLoad);
      }
    }

    // Priority 2: Use first academy in user's list
    if (!academyIdToLoad && userAcademies.length > 0) {
      academyIdToLoad = userAcademies[0].academy_id;
    }

    // Priority 3: Fallback to academy_id for backward compatibility
    if (!academyIdToLoad && (profile as any).academy_id) {
      academyIdToLoad = (profile as any).academy_id;
    }

    if (!academyIdToLoad) {
      setAcademy(null);
      setCurrentAcademyId(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('useAcademy: Fetching academy data for ID:', academyIdToLoad);
      
      const { data, error } = await supabase
        .from('academies')
        .select('*')
        .eq('id', academyIdToLoad)
        .maybeSingle();

      console.log('useAcademy: Academy fetch result:', { data, error });

      if (error) {
        console.error('useAcademy: Database error:', error);
        throw error;
      }
      
      if (!data) {
        console.warn('useAcademy: No academy found for ID:', academyIdToLoad);
        setAcademy(null);
        setCurrentAcademyId(null);
        return;
      }

      console.log('useAcademy: Setting academy data:', data);
      setAcademy(data);
      setCurrentAcademyId(academyIdToLoad);
    } catch (error) {
      console.error('Error fetching academy:', error);
      setAcademy(null);
      setCurrentAcademyId(null);
    } finally {
      setLoading(false);
    }
  };

  const updateAcademy = async (updates: Partial<Academy>) => {
    if (!academy) return;

    try {
      const { error } = await supabase
        .from('academies')
        .update(updates)
        .eq('id', academy.id);

      if (error) throw error;
      
      setAcademy(prev => prev ? { ...prev, ...updates } : null);
    } catch (error) {
      console.error('Error updating academy:', error);
      throw error;
    }
  };

  const canAccessFeature = (feature: string): boolean => {
    if (!academy) return false;
    
    // Define feature access by subscription plan
    const featureAccess: Record<string, string[]> = {
      'basic_reporting': ['Starter', 'Professional', 'Enterprise'],
      'advanced_analytics': ['Professional', 'Enterprise'],
      'custom_branding': ['Professional', 'Enterprise'],
      'payment_processing': ['Professional', 'Enterprise'],
      'automated_communications': ['Professional', 'Enterprise'],
      'white_label': ['Enterprise'],
      'multi_location': ['Enterprise'],
      'custom_integrations': ['Enterprise'],
      'dedicated_support': ['Enterprise']
    };

    const allowedPlans = featureAccess[feature] || [];
    return allowedPlans.includes(academy.subscription_status || 'trial');
  };

  const getStudentLimit = (): number => {
    if (!academy) return 10; // Default trial limit
    
    const limits: Record<string, number> = {
      'trial': 10,
      'Starter': 50,
      'Professional': 200,
      'Enterprise': 999999
    };

    return limits[academy.subscription_status || 'trial'] || 10;
  };

  const isTrialExpired = (): boolean => {
    if (!academy || academy.subscription_status !== 'trial') return false;
    
    // For now, return false - implement trial expiry logic when needed
    return false;
  };

  useEffect(() => {
    console.log('useAcademy: refreshing academy due to deps change', { user: !!user, profile: !!profile, userAcademies: userAcademies.length });
    
    // Don't refresh academy if we're in student mode - only if user logged in as student
    const loginRole = localStorage.getItem('loginRole');
    const studentAcademies = userAcademies.filter(academy => academy.role === 'student');
    const forceStudentMode = loginRole === 'student' && studentAcademies.length > 1 && !localStorage.getItem('student_academy_selected');
    
    if (forceStudentMode) {
      console.log('useAcademy: useEffect - Student mode active, skipping refresh');
      setAcademy(null);
      setCurrentAcademyId(null);
      setLoading(false);
      return;
    }
    
    refreshAcademy();
  }, [user, profile, userAcademies]);

  return (
    <AcademyContext.Provider
      value={{
        academy,
        currentAcademyId,
        loading,
        refreshAcademy,
        updateAcademy,
        canAccessFeature,
        getStudentLimit,
        isTrialExpired,
      }}
    >
      {children}
    </AcademyContext.Provider>
  );
};