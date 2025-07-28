import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw, Loader2 } from "lucide-react";

export const PaymentSyncButton = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSync = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('sync-stripe-payments');
      
      if (error) throw error;
      
      toast({
        title: "Sync Completed",
        description: `Synced ${data.syncedPayments} payments and updated ${data.updatedProfiles} profiles`,
      });
      
      // Refresh the page to show updated payment data
      window.location.reload();
      
    } catch (error) {
      console.error('Error syncing payments:', error);
      toast({
        title: "Sync Failed",
        description: "Failed to sync Stripe payments. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Stripe Payment Sync
        </CardTitle>
        <CardDescription>
          Sync existing Stripe payments with the local database and update customer IDs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={handleSync} 
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Sync Stripe Payments
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};