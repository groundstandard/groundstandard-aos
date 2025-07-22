import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface BackButtonProps {
  fallbackPath?: string;
  className?: string;
}

export const BackButton = ({ fallbackPath = '/dashboard', className = '' }: BackButtonProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    // Define route hierarchy for better navigation
    const routeHierarchy: Record<string, string> = {
      '/membership-management': '/dashboard',
      '/contacts': '/dashboard',
      '/payments': '/dashboard',
      '/attendance': '/dashboard',
      '/reports': '/dashboard',
      '/team-management': '/dashboard',
      '/events': '/dashboard',
      '/belt-testing': '/dashboard',
      '/admin/performance-targets': '/dashboard',
      '/settings': '/dashboard',
      '/profile': '/dashboard',
    };

    // Get the parent route for current path
    const parentRoute = routeHierarchy[location.pathname] || fallbackPath;
    
    // Always navigate to the logical parent instead of relying on browser history
    navigate(parentRoute);
  };

  // Don't show back button on dashboard
  if (location.pathname === '/dashboard' || location.pathname === '/') {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleBack}
      className={`mb-4 ${className}`}
    >
      <ArrowLeft className="h-4 w-4 mr-2" />
      Back
    </Button>
  );
};