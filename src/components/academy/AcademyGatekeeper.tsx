import React from 'react';
import { useAcademy } from '@/hooks/useAcademy';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import AcademyWelcome from './AcademyWelcome';

interface AcademyGatekeeperProps {
  children: React.ReactNode;
}

const AcademyGatekeeper: React.FC<AcademyGatekeeperProps> = ({ children }) => {
  const { academy, loading } = useAcademy();
  const { user, profile } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Don't redirect if already on academy setup page
  if (location.pathname === '/academy-setup') {
    return <>{children}</>;
  }

  // If user doesn't have an academy, show welcome screen
  if (!academy && user) {
    return <AcademyWelcome />;
  }

  // If academy exists but setup is not complete, redirect to setup
  if (academy && !academy.is_setup_complete) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Complete Academy Setup</h2>
          <p className="text-muted-foreground mb-4">
            Please complete your academy setup to continue.
          </p>
          <a 
            href="/academy-setup" 
            className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            Complete Setup
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AcademyGatekeeper;