import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export const AuthFlowHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const parseHashParams = (hash: string) => new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);

    const clearUrl = () => {
      window.history.replaceState({}, document.title, window.location.pathname);
    };

    const handleEmailConfirmation = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get('code');

      // Supabase PKCE flow uses ?code=...
      if (code) {
        try {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error('AuthFlowHandler: exchangeCodeForSession failed', error);
          }
        } catch (e) {
          console.error('AuthFlowHandler: exchangeCodeForSession threw', e);
        } finally {
          clearUrl();
          navigate('/');
        }
        return;
      }

      // Supabase implicit flow uses URL hash tokens
      const hash = window.location.hash || '';
      const hashParams = parseHashParams(hash);
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const type = hashParams.get('type');

      if (accessToken && refreshToken && type !== 'recovery') {
        try {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) {
            console.error('AuthFlowHandler: setSession failed', error);
          }
        } catch (e) {
          console.error('AuthFlowHandler: setSession threw', e);
        } finally {
          clearUrl();
          navigate('/');
        }
      }
    };

    // Handle password recovery tokens in URL hash
    const handleHashChange = () => {
      const hash = window.location.hash || '';
      const params = parseHashParams(hash);

      if (params.get('type') === 'recovery') {
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

        // Clear the URL hash to prevent auto-login
        clearUrl();
        
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

    // Handle signup/magiclink confirmation flows
    handleEmailConfirmation();

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