import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from '@/hooks/useSubscription';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, Star, Crown, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  stripe_price_id: string;
  price: number;
  interval_type: string;
  interval_count: number;
  trial_period_days: number;
  features: string[];
  is_active: boolean;
  is_popular: boolean;
}

export const SubscriptionPlansDisplay = () => {
  const { subscriptionInfo, createCheckout, loading: subscriptionLoading } = useSubscription();
  const { toast } = useToast();
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);

  const { data: plans, isLoading } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price');
      
      if (error) throw error;
      return data?.map((plan: any) => ({
        ...plan,
        features: Array.isArray(plan.features) ? plan.features : [],
        trial_period_days: plan.trial_period_days || 0,
        is_popular: plan.is_popular || false
      })) as SubscriptionPlan[];
    }
  });

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (subscriptionInfo?.subscribed) {
      toast({
        title: "Already subscribed",
        description: "You already have an active subscription. Use the customer portal to manage it.",
      });
      return;
    }

    setProcessingPlan(plan.id);
    try {
      const checkoutUrl = await createCheckout(plan.id);
      if (checkoutUrl) {
        window.open(checkoutUrl, '_blank');
      }
    } catch (error) {
      console.error('Error during subscription:', error);
    } finally {
      setProcessingPlan(null);
    }
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100);
  };

  const getIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'starter':
        return <Zap className="h-6 w-6" />;
      case 'professional':
        return <Star className="h-6 w-6" />;
      case 'enterprise':
        return <Crown className="h-6 w-6" />;
      default:
        return <Check className="h-6 w-6" />;
    }
  };

  const isCurrentPlan = (planName: string) => {
    return subscriptionInfo?.subscription_tier === planName;
  };

  if (isLoading || subscriptionLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (subscriptionInfo?.subscribed) {
    return (
      <Card className="text-center">
        <CardHeader>
          <CardTitle className="text-2xl text-primary">
            You're subscribed to {subscriptionInfo.subscription_tier}!
          </CardTitle>
          <CardDescription>
            Thank you for being a valued customer. Manage your subscription below.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight">Choose Your Plan</h2>
        <p className="text-muted-foreground mt-2">
          Start your academy management journey with our flexible pricing options
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {plans?.map((plan) => (
          <Card 
            key={plan.id} 
            className={`relative ${plan.is_popular ? 'border-primary shadow-lg scale-105' : ''} ${isCurrentPlan(plan.name) ? 'ring-2 ring-green-500' : ''}`}
          >
            {plan.is_popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground px-3 py-1">
                  Most Popular
                </Badge>
              </div>
            )}
            
            {isCurrentPlan(plan.name) && (
              <div className="absolute -top-3 right-4">
                <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">
                  Your Plan
                </Badge>
              </div>
            )}

            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4 text-primary">
                {getIcon(plan.name)}
              </div>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <CardDescription className="text-sm">
                {plan.description}
              </CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">
                  {formatPrice(plan.price)}
                </span>
                <span className="text-muted-foreground">
                  /{plan.interval_type}
                </span>
              </div>
              {plan.trial_period_days > 0 && (
                <Badge variant="outline" className="mt-2">
                  {plan.trial_period_days} day free trial
                </Badge>
              )}
            </CardHeader>

            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="w-full"
                size="lg"
                onClick={() => handleSubscribe(plan)}
                disabled={processingPlan === plan.id || isCurrentPlan(plan.name)}
                variant={plan.is_popular ? "default" : "outline"}
              >
                {processingPlan === plan.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : isCurrentPlan(plan.name) ? (
                  'Current Plan'
                ) : (
                  `Start ${plan.name}`
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>All plans include secure payment processing and can be cancelled anytime.</p>
        <p>Need a custom solution? <a href="mailto:support@example.com" className="text-primary hover:underline">Contact us</a></p>
      </div>
    </div>
  );
};