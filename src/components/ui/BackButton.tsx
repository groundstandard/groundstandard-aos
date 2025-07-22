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
    console.log('BackButton handleBack called');
    console.log('Current location:', location.pathname);
    console.log('Fallback path:', fallbackPath);
    console.log('History length:', window.history.length);
    console.log('History state:', window.history.state);
    
    try {
      console.log('Attempting to navigate to:', fallbackPath);
      navigate(fallbackPath);
      console.log('Navigate call completed');
    } catch (error) {
      console.error('Navigation error:', error);
    }
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