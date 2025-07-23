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
    console.log('BackButton: handleBack called');
    console.log('BackButton: window.history.length:', window.history.length);
    console.log('BackButton: current location:', location.pathname);
    console.log('BackButton: fallbackPath:', fallbackPath);
    
    // Check if there's history to go back to
    if (window.history.length > 1) {
      console.log('BackButton: Using navigate(-1)');
      navigate(-1);
    } else {
      console.log('BackButton: Using fallback path');
      navigate(fallbackPath);
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