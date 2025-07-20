import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, AlertCircle, Loader2, X, Delete } from "lucide-react";

interface CheckInKioskProps {
  settings: {
    welcome_message: string;
    require_class_selection: boolean;
  };
  onExit: () => void;
}

export const CheckInKiosk = ({ settings, onExit }: CheckInKioskProps) => {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    studentName?: string;
  } | null>(null);
  const { toast } = useToast();

  // Auto-clear result after 3 seconds
  useEffect(() => {
    if (result) {
      const timer = setTimeout(() => {
        setResult(null);
        setPin("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [result]);

  const handlePinInput = (digit: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + digit);
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPin("");
    setResult(null);
  };

  const handleSubmit = async () => {
    if (pin.length !== 4) {
      toast({
        title: "Invalid PIN",
        description: "Please enter a 4-digit PIN",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.rpc('check_in_with_pin', {
        pin_code: pin
      });

      if (error) {
        throw error;
      }

      const result = data as { success: boolean; student_name?: string; error?: string };

      if (result.success) {
        setResult({
          success: true,
          message: `Welcome, ${result.student_name}!`,
          studentName: result.student_name
        });
      } else {
        setResult({
          success: false,
          message: result.error || "Check-in failed"
        });
      }
    } catch (error) {
      console.error('Check-in error:', error);
      setResult({
        success: false,
        message: "An error occurred during check-in"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto space-y-6">
        {/* Exit Button (hidden from students) */}
        <div className="absolute top-4 right-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onExit}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{settings.welcome_message}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* PIN Display */}
            <div className="text-center">
              <div className="flex justify-center gap-2 mb-4">
                {[0, 1, 2, 3].map((index) => (
                  <div
                    key={index}
                    className="w-12 h-12 border-2 border-input rounded-lg flex items-center justify-center text-2xl font-mono"
                  >
                    {pin[index] ? '•' : ''}
                  </div>
                ))}
              </div>
            </div>

            {/* Number Pad */}
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                <Button
                  key={digit}
                  variant="outline"
                  size="lg"
                  className="h-16 text-xl font-semibold"
                  onClick={() => handlePinInput(digit.toString())}
                  disabled={loading}
                >
                  {digit}
                </Button>
              ))}
              
              <Button
                variant="outline"
                size="lg"
                className="h-16"
                onClick={handleClear}
                disabled={loading}
              >
                Clear
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                className="h-16 text-xl font-semibold"
                onClick={() => handlePinInput('0')}
                disabled={loading}
              >
                0
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                className="h-16"
                onClick={handleBackspace}
                disabled={loading}
              >
                <Delete className="h-5 w-5" />
              </Button>
            </div>

            {/* Check In Button */}
            <Button 
              onClick={handleSubmit}
              className="w-full h-14 text-lg"
              disabled={loading || pin.length !== 4}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Checking In...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Check In
                </>
              )}
            </Button>

            {/* Result Display */}
            {result && (
              <Alert variant={result.success ? "default" : "destructive"}>
                {result.success ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertDescription className="text-center text-lg">
                  {result.message}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Help Text */}
        <Card className="bg-muted/50">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Enter your 4-digit PIN to check in. If you need assistance, please ask a staff member.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};