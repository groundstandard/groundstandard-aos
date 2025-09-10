import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export const AuthFlowHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const parseHashParams = (hash: string) => new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);

    // Handle password recovery tokens in URL hash
    const handleHashChange = () => {
      const hash = window.location.hash || '';
      const params = parseHashParams(hash);

      if (params.get('type') === 'recovery' || params.has('access_token')) {
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken && refreshToken) {
          try {
            sessionStorage.setItem('sb-recovery-access-token', accessToken);
            sessionStorage.setItem('sb-recovery-refresh-token', refreshToken);
            console.log('Stored recovery tokens from URL hash');
          } catch (e) {
            console.warn('Could not store recovery tokens', e);
          }
        }

        console.log('Password recovery detected, navigating to reset password page');
        navigate('/reset-password');
      }
    };

    // Also handle query param style (?type=recovery)
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('type') === 'recovery') {
      console.log('Password recovery detected in query, navigating to reset password page');
      navigate('/reset-password');
    }

    // Check initial URL
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);

    // Listen for auth state changes from Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        console.log('PASSWORD_RECOVERY event detected, navigating to reset password page');
        navigate('/reset-password');
      }
    });

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      subscription.unsubscribe();
    };
  }, [navigate, location.search]);

  return null; // This component doesn't render anything
};