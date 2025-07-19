import { createContext, useContext, useState, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface RoleTestingContextType {
  testRole: string | null;
  setTestRole: (role: string | null) => void;
  effectiveRole: string;
  isOwner: boolean;
}

const RoleTestingContext = createContext<RoleTestingContextType | undefined>(undefined);

export const useRoleTesting = () => {
  const context = useContext(RoleTestingContext);
  if (!context) {
    throw new Error('useRoleTesting must be used within a RoleTestingProvider');
  }
  return context;
};

interface RoleTestingProviderProps {
  children: ReactNode;
}

export const RoleTestingProvider = ({ children }: RoleTestingProviderProps) => {
  const [testRole, setTestRole] = useState<string | null>(null);
  const { profile } = useAuth();

  // Check if user is actually an owner/admin
  const isOwner = profile?.role === 'admin'; // admin is owner in current system
  
  // Determine effective role (test role override or actual role)
  const effectiveRole = isOwner && testRole ? testRole : (profile?.role || 'student');

  return (
    <RoleTestingContext.Provider value={{ 
      testRole, 
      setTestRole, 
      effectiveRole, 
      isOwner 
    }}>
      {children}
    </RoleTestingContext.Provider>
  );
};