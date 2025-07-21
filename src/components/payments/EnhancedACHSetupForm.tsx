import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from "@stripe/react-stripe-js";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, CheckCircle, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

// You'll need to add your Stripe publishable key here
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "pk_test_...");

const ACHSetupContent = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState("");
  const [setupComplete, setSetupComplete] = useState(false);

  useEffect(() => {
    setupACHIntent();
  }, []);

  const setupACHIntent = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('setup-ach-payment', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;
      setClientSecret(data.client_secret);
    } catch (error) {
      console.error("Setup error:", error);
      toast({
        title: "Setup Failed",
        description: "Failed to initialize ACH setup. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsLoading(true);
    try {
      const { error } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payments?setup=complete`,
        },
        redirect: "if_required"
      });

      if (error) {
        toast({
          title: "Setup Failed", 
          description: error.message,
          variant: "destructive",
        });
      } else {
        setSetupComplete(true);
        toast({
          title: "ACH Setup Complete",
          description: "Your bank account has been successfully verified and saved.",
        });
      }
    } catch (error) {
      console.error("ACH setup error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (setupComplete) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
            <h3 className="text-lg font-medium">ACH Setup Complete!</h3>
            <p className="text-muted-foreground">
              Your bank account is now verified and ready for automatic payments.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          ACH Bank Account Setup
        </CardTitle>
        <CardDescription>
          Connect your bank account for lower fees and automatic payments
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            ACH payments have lower fees (0.8%) compared to credit cards (2.9%+).
            Bank verification may take 1-2 business days.
          </AlertDescription>
        </Alert>

        {clientSecret && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <PaymentElement 
              options={{
                layout: "tabs"
              }}
            />
            <Button 
              type="submit" 
              disabled={isLoading || !stripe || !elements}
              className="w-full"
            >
              {isLoading ? "Setting up..." : "Verify Bank Account"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
};

export const EnhancedACHSetupForm = () => (
  <Elements stripe={stripePromise}>
    <ACHSetupContent />
  </Elements>
);