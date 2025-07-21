import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CreditCard, Building2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

export const ACHSetupForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSetupACH = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('setup-ach-payment', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;

      // In a real implementation, you would integrate with Stripe Elements
      // to collect and verify the bank account details
      toast({
        title: "ACH Setup Initiated",
        description: "Bank account verification process started. You'll receive micro-deposits within 1-2 business days.",
      });

      console.log("ACH Setup data:", data);
    } catch (error) {
      console.error("ACH setup error:", error);
      toast({
        title: "Setup Failed",
        description: "Failed to initiate ACH setup. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          ACH Bank Transfer Setup
        </CardTitle>
        <CardDescription>
          Set up bank transfers for lower fees and automatic payments
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            ACH payments typically have lower fees (0.5-1%) compared to credit cards (2.9%+).
            Perfect for recurring tuition payments.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="h-4 w-4 text-primary" />
              <span className="font-medium">Credit Card</span>
            </div>
            <p className="text-sm text-muted-foreground">
              2.9% + 30¢ per transaction
            </p>
          </div>

          <div className="p-4 border rounded-lg bg-primary/5">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-4 w-4 text-primary" />
              <span className="font-medium">ACH Bank Transfer</span>
            </div>
            <p className="text-sm text-muted-foreground">
              0.8% capped at $5 per transaction
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">Benefits of ACH Payments:</h4>
          <ul className="text-sm text-muted-foreground space-y-1 ml-4">
            <li>• Lower transaction fees</li>
            <li>• Automatic recurring payments</li>
            <li>• Direct bank-to-bank transfers</li>
            <li>• Reduced risk of declined payments</li>
          </ul>
        </div>

        <Button 
          onClick={handleSetupACH} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? "Setting up..." : "Setup ACH Bank Transfer"}
        </Button>

        <p className="text-xs text-muted-foreground">
          Bank account verification may take 1-2 business days through micro-deposits.
        </p>
      </CardContent>
    </Card>
  );
};