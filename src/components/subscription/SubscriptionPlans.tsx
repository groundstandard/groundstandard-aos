import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Loader2, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval_type: string;
  interval_count: number;
  features: string[];
  is_active: boolean;
  stripe_price_id?: string;
}

const SubscriptionPlans = () => {
  const { user } = useAuth();
  const { subscriptionInfo, loading, createCheckout, refreshSubscription } = useSubscription();
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) throw error;
      const formattedPlans = (data || []).map(plan => ({
        ...plan,
        features: Array.isArray(plan.features) ? plan.features as string[] : []
      }));
      setPlans(formattedPlans);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast({
        title: "Error",
        description: "Failed to load subscription plans",
        variant: "destructive",
      });
    } finally {
      setLoadingPlans(false);
    }
  };

  const handleSubscribe = async (plan: Plan) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to subscribe to a plan",
        variant: "destructive",
      });
      return;
    }

    setProcessingPlan(plan.id);
    try {
      const checkoutUrl = await createCheckout(plan.id);
      if (checkoutUrl) {
        // Open Stripe checkout in a new tab
        window.open(checkoutUrl, '_blank');
        
        // Refresh subscription status after a delay
        setTimeout(() => {
          refreshSubscription();
        }, 2000);
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Error",
        description: "Failed to start subscription process",
        variant: "destructive",
      });
    } finally {
      setProcessingPlan(null);
    }
  };

  const isCurrentPlan = (planName: string) => {
    return subscriptionInfo?.subscribed && 
           subscriptionInfo?.subscription_tier?.toLowerCase() === planName.toLowerCase();
  };

  const formatPrice = (price: number, currency: string, interval: string, intervalCount: number) => {
    const formattedPrice = (price / 100).toFixed(2);
    const intervalText = intervalCount === 1 ? interval : `${intervalCount} ${interval}s`;
    return `$${formattedPrice}/${intervalText}`;
  };

  if (loadingPlans) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading subscription plans...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Choose Your Plan</h2>
        <p className="text-muted-foreground">
          Select the perfect plan for your martial arts journey
        </p>
      </div>

      {subscriptionInfo?.subscribed && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="font-medium">
                You're currently subscribed to the {subscriptionInfo.subscription_tier} plan
              </span>
              {subscriptionInfo.subscription_end && (
                <span className="text-sm text-muted-foreground">
                  (expires {new Date(subscriptionInfo.subscription_end).toLocaleDateString()})
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrent = isCurrentPlan(plan.name);
          const isPopular = plan.name.toLowerCase().includes('premium');
          
          return (
            <Card 
              key={plan.id} 
              className={`relative ${isCurrent ? 'border-primary ring-2 ring-primary/20' : ''} ${isPopular ? 'border-accent' : ''}`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge variant="default" className="bg-accent text-accent-foreground">
                    <Star className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}
              
              {isCurrent && (
                <div className="absolute -top-3 right-4">
                  <Badge variant="default" className="bg-primary text-primary-foreground">
                    Current Plan
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="text-3xl font-bold">
                  {formatPrice(plan.price, plan.currency, plan.interval_type, plan.interval_count)}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {plan.features?.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  onClick={() => handleSubscribe(plan)}
                  disabled={isCurrent || processingPlan === plan.id || loading}
                  variant={isCurrent ? "outline" : "default"}
                >
                  {processingPlan === plan.id ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : isCurrent ? (
                    "Current Plan"
                  ) : (
                    `Subscribe to ${plan.name}`
                  )}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {plans.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">
              No subscription plans are currently available. Please check back later.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SubscriptionPlans;