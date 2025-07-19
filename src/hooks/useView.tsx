import { createContext, useContext, useState, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface ViewContextType {
  currentView: 'admin' | 'student';
  setCurrentView: (view: 'admin' | 'student') => void;
  canSwitchView: boolean;
}

const ViewContext = createContext<ViewContextType | undefined>(undefined);

export const useView = () => {
  const context = useContext(ViewContext);
  if (context === undefined) {
    throw new Error('useView must be used within a ViewProvider');
  }
  return context;
};

export const ViewProvider = ({ children }: { children: ReactNode }) => {
  const { profile } = useAuth();
  const [currentView, setCurrentView] = useState<'admin' | 'student'>(
    profile?.role === 'admin' ? 'admin' : 'student'
  );
  
  const canSwitchView = profile?.role === 'admin' || profile?.role === 'owner' || profile?.role === 'instructor';

  return (
    <ViewContext.Provider value={{ currentView, setCurrentView, canSwitchView }}>
      {children}
    </ViewContext.Provider>
  );
};