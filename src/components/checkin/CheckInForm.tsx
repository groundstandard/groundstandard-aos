import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export const CheckInForm = () => {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<{
    success: boolean;
    message: string;
    studentName?: string;
  } | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (pin.length !== 4) {
      toast({
        title: "Invalid PIN",
        description: "Please enter a 4-digit PIN",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setLastResult(null);

    try {
      const { data, error } = await supabase.rpc('check_in_with_pin', {
        pin_code: pin
      });

      if (error) {
        throw error;
      }

      const result = data as { success: boolean; student_name?: string; error?: string };

      if (result.success) {
        setLastResult({
          success: true,
          message: `Welcome, ${result.student_name}! You're checked in.`,
          studentName: result.student_name
        });
        toast({
          title: "Check-in Successful",
          description: `Welcome, ${result.student_name}!`,
        });
        setPin("");
      } else {
        setLastResult({
          success: false,
          message: result.error || "Check-in failed"
        });
        toast({
          title: "Check-in Failed",
          description: result.error || "Invalid PIN or already checked in",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Check-in error:', error);
      setLastResult({
        success: false,
        message: "An error occurred during check-in"
      });
      toast({
        title: "Error",
        description: "An error occurred during check-in",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="pin">Enter Your 4-Digit PIN</Label>
          <Input
            id="pin"
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="••••"
            className="text-center text-2xl tracking-widest"
            maxLength={4}
            autoComplete="off"
          />
        </div>
        
        <Button 
          type="submit" 
          className="w-full" 
          disabled={loading || pin.length !== 4}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Checking In...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Check In
            </>
          )}
        </Button>
      </form>

      {lastResult && (
        <Alert variant={lastResult.success ? "default" : "destructive"}>
          {lastResult.success ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{lastResult.message}</AlertDescription>
        </Alert>
      )}

      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <h4 className="font-medium mb-2">Don't know your PIN?</h4>
          <p className="text-sm text-muted-foreground">
            Your 4-digit check-in PIN can be found in your profile or ask a staff member for assistance.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};