import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExternalLink, CheckCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface StripeAccount {
  id: string;
  business_type: string;
  country: string;
  email: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
}

export const StripeConnectSetup = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedAccount, setConnectedAccount] = useState<StripeAccount | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();

  const initiateStripeConnect = async () => {
    setIsConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('stripe-connect-oauth', {
        body: { action: 'create_account_link' }
      });

      if (error) throw error;

      // Redirect to Stripe Connect OAuth
      window.open(data.url, '_blank');
      
      toast({
        title: "Redirecting to Stripe",
        description: "Complete the setup in the new tab and return here",
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const checkConnectionStatus = async () => {
    setIsChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke('stripe-connect-oauth', {
        body: { action: 'check_account_status' }
      });

      if (error) throw error;

      if (data.account) {
        setConnectedAccount(data.account);
        toast({
          title: "Account Connected",
          description: "Your Stripe account is successfully connected",
        });
      } else {
        toast({
          title: "No Account Found",
          description: "Please complete the Stripe Connect setup first",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Check Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsChecking(false);
    }
  };

  const getAccountStatusBadge = () => {
    if (!connectedAccount) return null;

    const isFullyEnabled = connectedAccount.charges_enabled && 
                          connectedAccount.payouts_enabled && 
                          connectedAccount.details_submitted;

    if (isFullyEnabled) {
      return <Badge variant="default" className="flex items-center gap-1">
        <CheckCircle className="h-3 w-3" />
        Fully Active
      </Badge>;
    }

    return <Badge variant="secondary" className="flex items-center gap-1">
      <AlertTriangle className="h-3 w-3" />
      Setup Required
    </Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ExternalLink className="h-5 w-5 text-primary" />
          Stripe Connect Integration
          {getAccountStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Stripe Connect allows your users to accept payments directly without manually configuring webhooks or API keys.
          </AlertDescription>
        </Alert>

        {connectedAccount ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Account ID:</strong> {connectedAccount.id}
              </div>
              <div>
                <strong>Country:</strong> {connectedAccount.country}
              </div>
              <div>
                <strong>Business Type:</strong> {connectedAccount.business_type}
              </div>
              <div>
                <strong>Email:</strong> {connectedAccount.email}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Account Status:</h4>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className={`p-2 rounded border ${connectedAccount.charges_enabled ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="font-medium">Charges</div>
                  <div className={connectedAccount.charges_enabled ? 'text-green-600' : 'text-red-600'}>
                    {connectedAccount.charges_enabled ? 'Enabled' : 'Disabled'}
                  </div>
                </div>
                <div className={`p-2 rounded border ${connectedAccount.payouts_enabled ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="font-medium">Payouts</div>
                  <div className={connectedAccount.payouts_enabled ? 'text-green-600' : 'text-red-600'}>
                    {connectedAccount.payouts_enabled ? 'Enabled' : 'Disabled'}
                  </div>
                </div>
                <div className={`p-2 rounded border ${connectedAccount.details_submitted ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="font-medium">Details</div>
                  <div className={connectedAccount.details_submitted ? 'text-green-600' : 'text-red-600'}>
                    {connectedAccount.details_submitted ? 'Complete' : 'Incomplete'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-muted-foreground mb-4">
              No Stripe account connected. Connect your Stripe account to enable automated payment processing for your academies.
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <Button 
            onClick={initiateStripeConnect} 
            disabled={isConnecting}
            variant={connectedAccount ? "outline" : "default"}
          >
            {isConnecting ? "Connecting..." : connectedAccount ? "Reconnect Account" : "Connect Stripe Account"}
          </Button>
          
          <Button 
            onClick={checkConnectionStatus} 
            disabled={isChecking}
            variant="outline"
          >
            {isChecking ? "Checking..." : "Check Status"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};