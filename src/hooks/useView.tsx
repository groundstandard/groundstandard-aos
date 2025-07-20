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
  
  // Get initial view from localStorage or default based on role
  const getInitialView = (): 'admin' | 'student' => {
    const savedView = localStorage.getItem('userView');
    if (savedView === 'admin' || savedView === 'student') {
      return savedView;
    }
    return profile?.role === 'admin' || profile?.role === 'owner' ? 'admin' : 'student';
  };

  const [currentView, setCurrentView] = useState<'admin' | 'student'>(getInitialView);
  
  // Save to localStorage whenever view changes
  const handleViewChange = (view: 'admin' | 'student') => {
    setCurrentView(view);
    localStorage.setItem('userView', view);
  };
  
  const canSwitchView = profile?.role === 'admin' || profile?.role === 'owner' || profile?.role === 'instructor';

  return (
    <ViewContext.Provider value={{ currentView, setCurrentView: handleViewChange, canSwitchView }}>
      {children}
    </ViewContext.Provider>
  );
};