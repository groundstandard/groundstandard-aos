import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Crown, 
  CreditCard, 
  RefreshCw, 
  ExternalLink,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface SubscriptionData {
  subscribed: boolean;
  subscription_tier?: string;
  subscription_end?: string;
}

export const SubscriptionDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Check subscription status
  const checkSubscription = async () => {
    if (!user) return;
    
    setRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) throw error;
      
      setSubscriptionData(data);
      toast({ 
        title: "Subscription status updated",
        description: `Status: ${data.subscribed ? 'Active' : 'Inactive'}`
      });
    } catch (error) {
      toast({
        title: "Error checking subscription",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Open customer portal for subscription management
  const openCustomerPortal = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      } else {
        throw new Error('No portal URL received');
      }
    } catch (error) {
      toast({
        title: "Error opening customer portal",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Auto-check subscription on mount
  useEffect(() => {
    if (user) {
      checkSubscription();
    }
  }, [user]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (user && !refreshing) {
        checkSubscription();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [user, refreshing]);

  if (!user) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            <CardTitle>Subscription Status</CardTitle>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={checkSubscription}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        <CardDescription>
          Manage your academy membership and billing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {subscriptionData ? (
          <>
            <div className="flex items-center gap-2">
              {subscriptionData.subscribed ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <Badge variant="default" className="bg-green-500">
                    Active Subscription
                  </Badge>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-500" />
                  <Badge variant="destructive">
                    No Active Subscription
                  </Badge>
                </>
              )}
            </div>

            {subscriptionData.subscription_tier && (
              <div>
                <p className="text-sm text-muted-foreground">Plan</p>
                <p className="font-medium">{subscriptionData.subscription_tier}</p>
              </div>
            )}

            {subscriptionData.subscription_end && (
              <div>
                <p className="text-sm text-muted-foreground">Next Billing Date</p>
                <p className="font-medium">
                  {new Date(subscriptionData.subscription_end).toLocaleDateString()}
                </p>
              </div>
            )}

            {subscriptionData.subscribed && (
              <Button 
                onClick={openCustomerPortal} 
                disabled={loading}
                className="w-full"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                {loading ? "Loading..." : "Manage Subscription"}
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            )}

            {!subscriptionData.subscribed && (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">
                  Subscribe to a membership plan to access all academy features.
                </p>
                <p className="text-sm text-muted-foreground">
                  Browse available plans in the "Memberships & Plans" tab above.
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-muted-foreground">Loading subscription status...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};