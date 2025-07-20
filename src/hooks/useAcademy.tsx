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
  const { user, profile } = useAuth();
  const [academy, setAcademy] = useState<Academy | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshAcademy = async () => {
    if (!user || !(profile as any)?.academy_id) {
      setAcademy(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('academies')
        .select('*')
        .eq('id', (profile as any).academy_id)
        .single();

      if (error) throw error;
      setAcademy(data);
    } catch (error) {
      console.error('Error fetching academy:', error);
      setAcademy(null);
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
    refreshAcademy();
  }, [user, profile]);

  return (
    <AcademyContext.Provider
      value={{
        academy,
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