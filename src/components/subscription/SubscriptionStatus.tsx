import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Settings, Crown, AlertCircle } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { format } from "date-fns";

export const SubscriptionStatus = () => {
  const { subscriptionInfo, loading, refreshSubscription, openCustomerPortal } = useSubscription();
  const { toast } = useToast();
  const [refreshing, setRefreshing] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await refreshSubscription();
      toast({
        title: "Status Updated",
        description: "Subscription status has been refreshed.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh subscription status.",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setOpeningPortal(true);
      await openCustomerPortal();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to open customer portal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setOpeningPortal(false);
    }
  };

  if (loading) {
    return (
      <Card className="card-minimal">
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading subscription status...</span>
        </CardContent>
      </Card>
    );
  }

  const isSubscribed = subscriptionInfo?.subscribed;
  const tier = subscriptionInfo?.subscription_tier;
  const endDate = subscriptionInfo?.subscription_end;

  return (
    <Card className={`card-minimal ${isSubscribed ? 'border-primary bg-primary/5' : 'border-muted'}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isSubscribed ? (
              <Crown className="h-5 w-5 text-primary" />
            ) : (
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
            )}
            <CardTitle className="text-lg">Subscription Status</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Status:</span>
          <Badge variant={isSubscribed ? "default" : "secondary"}>
            {isSubscribed ? "Active" : "Free Plan"}
          </Badge>
        </div>

        {tier && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Plan:</span>
            <Badge variant="outline">{tier}</Badge>
          </div>
        )}

        {endDate && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Renews:</span>
            <span className="text-sm text-muted-foreground">
              {format(new Date(endDate), "PPP")}
            </span>
          </div>
        )}

        {isSubscribed && (
          <Button
            variant="outline"
            onClick={handleManageSubscription}
            disabled={openingPortal}
            className="w-full"
          >
            <Settings className="h-4 w-4 mr-2" />
            {openingPortal ? "Opening..." : "Manage Subscription"}
          </Button>
        )}

        {!isSubscribed && (
          <CardDescription className="text-sm">
            Upgrade to a premium plan to access advanced features and unlimited access.
          </CardDescription>
        )}
      </CardContent>
    </Card>
  );
};