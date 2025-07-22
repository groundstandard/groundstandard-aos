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
    console.log('BackButton clicked - current path:', location.pathname);
    console.log('History length:', window.history.length);
    console.log('History state:', window.history.state);
    
    // Check if we can actually go back in history
    const canGoBack = window.history.state?.idx > 0 || window.history.length > 1;
    
    if (canGoBack) {
      console.log('Going back in history');
      navigate(-1);
    } else {
      console.log('No history to go back to, using fallback:', fallbackPath);
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