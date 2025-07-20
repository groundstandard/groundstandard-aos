import React from 'react';
import { useAcademy } from '@/hooks/useAcademy';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

interface AcademyGatekeeperProps {
  children: React.ReactNode;
}

const AcademyGatekeeper: React.FC<AcademyGatekeeperProps> = ({ children }) => {
  const { academy, loading } = useAcademy();
  const { user, profile } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // If user doesn't have an academy, redirect to setup
  if (!academy && user) {
    return <Navigate to="/academy-setup" replace />;
  }

  // If academy exists but setup is not complete, redirect to setup
  if (academy && !academy.is_setup_complete) {
    return <Navigate to="/academy-setup" replace />;
  }

  return <>{children}</>;
};

export default AcademyGatekeeper;