import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { createClient } from '@supabase/supabase-js';
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const checkRecoveryTokens = () => {
      const accessToken = sessionStorage.getItem('sb-recovery-access-token');
      const refreshToken = sessionStorage.getItem('sb-recovery-refresh-token');

      if (!accessToken || !refreshToken) {
        toast({
          variant: "destructive",
          title: "Invalid Reset Link", 
          description: "Please use the link from your email or request a new password reset",
        });
        navigate("/auth");
      }
    };

    checkRecoveryTokens();
  }, [navigate, toast]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Password Mismatch",
        description: "Passwords do not match"
      });
      return;
    }

    if (password.length < 8) {
      toast({
        variant: "destructive",
        title: "Password Too Short",
        description: "Password must be at least 8 characters long"
      });
      return;
    }

    setLoading(true);
    try {
      // Get stored tokens
      const accessToken = sessionStorage.getItem('sb-recovery-access-token');
      const refreshToken = sessionStorage.getItem('sb-recovery-refresh-token');

      if (!accessToken || !refreshToken) {
        throw new Error('Recovery tokens not found');
      }

      // Create a temporary client that doesn't persist sessions
      const tempClient = createClient(
        "https://yhriiykdnpuutzexjdee.supabase.co",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlocmlpeWtkbnB1dXR6ZXhqZGVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4ODEwNjAsImV4cCI6MjA2ODQ1NzA2MH0.Xtwogx9B2N8ODzbojiJJPFUpqN9j5GUtFFZHBbv2H9E",
        {
          auth: {
            storage: {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            },
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
          }
        }
      );

      // Set session temporarily
      const { error: sessionError } = await tempClient.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (sessionError) throw sessionError;

      // Update password
      const { error } = await tempClient.auth.updateUser({
        password: password
      });

      if (error) throw error;

      // Clean up tokens
      sessionStorage.removeItem('sb-recovery-access-token');
      sessionStorage.removeItem('sb-recovery-refresh-token');

      // Sign out from temp client (doesn't affect main client)
      await tempClient.auth.signOut();

      toast({
        title: "Password Updated",
        description: "Your password has been successfully updated. Please sign in with your new password."
      });
      
      // Redirect to login page
      navigate("/auth");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Reset Failed",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
      <Card className="w-full max-w-md shadow-elegant border-0 bg-white">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-display text-primary">Reset Password</CardTitle>
          <CardDescription>Enter your new password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Enter new password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirm new password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Password
            </Button>
          </form>
          <div className="text-center mt-4">
            <Button 
              type="button" 
              variant="link" 
              onClick={() => navigate("/auth")}
              className="text-sm"
            >
              Back to Sign In
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;