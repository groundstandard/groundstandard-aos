import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useAcademy } from '@/hooks/useAcademy';
import { useNavigate } from 'react-router-dom';

interface JoinAcademyFormProps {
  onBack: () => void;
}

const JoinAcademyForm = ({ onBack }: JoinAcademyFormProps) => {
  const [invitationCode, setInvitationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { refreshProfile } = useAuth();
  const { refreshAcademy } = useAcademy();
  const navigate = useNavigate();

  const handleJoinAcademy = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!invitationCode.trim()) {
      toast({
        title: "Invalid Code",
        description: "Please enter an invitation code.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('join_academy_with_code', {
        code: invitationCode.trim().toUpperCase()
      });

      if (error) {
        console.error('Join academy error:', error);
        throw error;
      }

      const result = data as any;
      if (!result?.success) {
        toast({
          title: "Invalid Code",
          description: result?.error || "Invalid or expired invitation code.",
          variant: "destructive",
        });
        return;
      }

      // Refresh profile and academy context
      await refreshProfile();
      await refreshAcademy();

      toast({
        title: "Welcome!",
        description: `Successfully joined ${result.academy_name} as ${result.role}.`,
      });

      // Redirect to dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (error) {
      console.error('Error joining academy:', error);
      toast({
        title: "Error",
        description: "Failed to join academy. Please check your invitation code and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <Users className="h-12 w-12 text-primary mx-auto mb-4" />
        <CardTitle className="text-2xl font-bold">Join Existing Academy</CardTitle>
        <CardDescription>
          Enter your invitation code to join an academy
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <form onSubmit={handleJoinAcademy} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invitation-code">Invitation Code</Label>
            <Input
              id="invitation-code"
              value={invitationCode}
              onChange={(e) => setInvitationCode(e.target.value)}
              placeholder="Enter 8-character code (e.g., ABC123XY)"
              className="text-center uppercase"
              maxLength={8}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Ask your academy administrator for an invitation code
            </p>
          </div>
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={loading || !invitationCode.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Joining Academy...
              </>
            ) : (
              <>
                Join Academy
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </form>
        
        <div className="text-center pt-4 space-y-2">
          <Button 
            variant="ghost" 
            onClick={onBack}
            disabled={loading}
          >
            ← Back to options
          </Button>
          
          <div className="text-sm text-muted-foreground">
            Don't have an invitation code?
          </div>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => window.location.href = '/auth'}
            disabled={loading}
          >
            Login or Create Account
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default JoinAcademyForm;