import { createContext, useContext, useState, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface ViewContextType {
  currentView: 'admin' | 'member';
  setCurrentView: (view: 'admin' | 'member') => void;
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
  const [currentView, setCurrentView] = useState<'admin' | 'member'>(
    profile?.role === 'admin' ? 'admin' : 'member'
  );
  
  const canSwitchView = profile?.role === 'admin';

  return (
    <ViewContext.Provider value={{ currentView, setCurrentView, canSwitchView }}>
      {children}
    </ViewContext.Provider>
  );
};