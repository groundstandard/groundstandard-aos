import React from 'react';
import { useAcademy } from '@/hooks/useAcademy';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import AcademyWelcome from './AcademyWelcome';
import { StudentAcademySelector } from './StudentAcademySelector';

interface AcademyGatekeeperProps {
  children: React.ReactNode;
}

const AcademyGatekeeper: React.FC<AcademyGatekeeperProps> = ({ children }) => {
  const { academy, loading } = useAcademy();
  const { user, profile, userAcademies } = useAuth();
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

  // Only show student academy selector if user logged in as student
  const loginRole = localStorage.getItem('loginRole');
  console.log('AcademyGatekeeper: Checking student mode', { loginRole, userAcademies: userAcademies?.length, academy: !!academy });
  if (user && profile && userAcademies && loginRole === 'student') {
    const studentAcademies = userAcademies.filter(academy => academy.role === 'student');
    
    console.log('AcademyGatekeeper - Login role:', loginRole);
    console.log('AcademyGatekeeper - User academies:', userAcademies);
    console.log('AcademyGatekeeper - Student academies:', studentAcademies);
    console.log('AcademyGatekeeper - Student academy selected:', localStorage.getItem('student_academy_selected'));
    
    // Show student selector when user has multiple student roles and hasn't selected one yet
    if (studentAcademies.length > 1 && !localStorage.getItem('student_academy_selected')) {
      return (
        <StudentAcademySelector 
          onAcademySelected={() => {
            console.log('AcademyGatekeeper - Academy selected, setting localStorage flag');
            localStorage.setItem('student_academy_selected', 'true');
            // Force a page refresh to reload with the selected academy
            window.location.reload();
          }} 
          studentAcademies={studentAcademies}
        />
      );
    }

    // If user has only one student academy, auto-select it
    if (studentAcademies.length === 1 && !localStorage.getItem('student_academy_selected')) {
      localStorage.setItem('student_academy_selected', 'true');
      // Force a page refresh to reload with the selected academy
      window.location.reload();
      return (
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
    }
  }

  // If user doesn't have an academy, redirect to academy setup
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