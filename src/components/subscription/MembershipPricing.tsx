import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, CreditCard, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useMembershipSubscription } from '@/hooks/useMembershipSubscription';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MembershipPlan {
  id: string;
  name: string;
  description?: string;
  base_price_cents: number;
  billing_frequency: string;
  features?: string[];
  classes_per_week?: number;
  is_active: boolean;
}

export const MembershipPricing = () => {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [billingFrequency, setBillingFrequency] = useState<Record<string, string>>({});
  
  const { subscription, loading: subscriptionLoading, createCheckout, openPortal } = useMembershipSubscription();
  const { toast } = useToast();

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('membership_plans')
        .select('*')
        .eq('is_active', true)
        .order('base_price_cents', { ascending: true });

      if (error) {
        throw error;
      }

      setPlans(data || []);
      
      // Initialize billing frequency for each plan
      const frequencies: Record<string, string> = {};
      data?.forEach(plan => {
        frequencies[plan.id] = plan.billing_frequency;
      });
      setBillingFrequency(frequencies);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast({
        title: "Error",
        description: "Failed to load membership plans",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    setCheckoutLoading(planId);
    try {
      const frequency = billingFrequency[planId] || 'monthly';
      const checkoutUrl = await createCheckout(planId, frequency);
      
      if (checkoutUrl) {
        // Open checkout in new tab
        window.open(checkoutUrl, '_blank');
        toast({
          title: "Checkout Opened",
          description: "A new tab has opened with your checkout session",
        });
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
    } finally {
      setCheckoutLoading(null);
    }
  };

  const formatPrice = (cents: number, frequency: string) => {
    const price = cents / 100;
    const formattedPrice = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);

    let discountedPrice = price;
    let discount = '';

    if (frequency === 'quarterly') {
      discountedPrice = price * 3 * 0.95; // 5% discount
      discount = ' (5% off)';
    } else if (frequency === 'annually') {
      discountedPrice = price * 12 * 0.85; // 15% discount
      discount = ' (15% off)';
    }

    const finalPrice = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(discountedPrice);

    const period = frequency === 'monthly' ? '/month' : 
                  frequency === 'quarterly' ? '/quarter' : '/year';

    return frequency === 'monthly' ? 
      `${formattedPrice}${period}` : 
      `${finalPrice}${period}${discount}`;
  };

  const isCurrentPlan = (planId: string) => {
    return subscription?.membership_plan_id === planId && subscription?.status === 'active';
  };

  if (loading || subscriptionLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Choose Your Membership</h2>
        <p className="text-muted-foreground">
          Select the perfect plan for your martial arts journey
        </p>
      </div>

      {subscription && (
        <Card className="border-primary bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-primary" />
              Current Subscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{subscription.membership_plan?.name}</p>
                <p className="text-sm text-muted-foreground">
                  Status: {subscription.status} • Next billing: {subscription.next_billing_date}
                </p>
              </div>
              <Button variant="outline" onClick={openPortal}>
                <Settings className="h-4 w-4 mr-2" />
                Manage
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`relative ${isCurrentPlan(plan.id) ? 'border-primary ring-2 ring-primary/20' : ''}`}
          >
            {isCurrentPlan(plan.id) && (
              <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary">
                Current Plan
              </Badge>
            )}
            
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              {plan.description && (
                <CardDescription>{plan.description}</CardDescription>
              )}
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Select
                  value={billingFrequency[plan.id]}
                  onValueChange={(value) => 
                    setBillingFrequency(prev => ({ ...prev, [plan.id]: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="annually">Annually</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="text-center">
                  <div className="text-3xl font-bold">
                    {formatPrice(plan.base_price_cents, billingFrequency[plan.id])}
                  </div>
                </div>
              </div>

              {plan.features && (
                <div className="space-y-2">
                  <p className="font-medium text-sm">Features:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {plan.classes_per_week && (
                <div className="text-sm">
                  <span className="font-medium">Classes per week: </span>
                  {plan.classes_per_week === 999 ? 'Unlimited' : plan.classes_per_week}
                </div>
              )}
            </CardContent>

            <CardFooter>
              {isCurrentPlan(plan.id) ? (
                <Button variant="outline" className="w-full" onClick={openPortal}>
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Subscription
                </Button>
              ) : (
                <Button 
                  className="w-full" 
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={checkoutLoading === plan.id}
                >
                  {checkoutLoading === plan.id ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CreditCard className="h-4 w-4 mr-2" />
                  )}
                  {subscription ? 'Switch Plan' : 'Subscribe Now'}
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>All plans include access to our mobile app and online booking system.</p>
        <p>You can cancel or change your plan at any time.</p>
      </div>
    </div>
  );
};