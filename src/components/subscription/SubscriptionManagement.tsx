import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Crown, 
  Users, 
  Calendar, 
  CreditCard, 
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle
} from 'lucide-react';

interface SubscriptionData {
  id: string;
  academy_id: string;
  plan_type: string;
  status: string;
  trial_ends_at: string;
  current_period_end: string;
  max_students: number;
  max_instructors: number;
  features: any;
}

interface UsageData {
  students: number;
  instructors: number;
  active_classes: number;
}

const planFeatures = {
  starter: [
    'Up to 50 students',
    'Up to 3 instructors',
    'Basic attendance tracking',
    'Payment processing',
    'Email support'
  ],
  professional: [
    'Up to 200 students',
    'Up to 10 instructors',
    'Advanced analytics',
    'Belt testing management',
    'Automated communications',
    'Priority support'
  ],
  enterprise: [
    'Unlimited students',
    'Unlimited instructors',
    'Custom integrations',
    'White-label options',
    'Dedicated support',
    'Advanced reporting'
  ]
};

const planPricing = {
  starter: { monthly: 29, yearly: 290 },
  professional: { monthly: 79, yearly: 790 },
  enterprise: { monthly: 199, yearly: 1990 }
};

export const SubscriptionManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  useEffect(() => {
    loadSubscriptionData();
  }, [user]);

  const loadSubscriptionData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);

      // Get user's academy
      const { data: profile } = await supabase
        .from('profiles')
        .select('academy_id')
        .eq('id', user.id)
        .single();

      if (!profile?.academy_id) return;

      // Get subscription data
      const { data: subData } = await supabase
        .from('academy_subscriptions')
        .select('*')
        .eq('academy_id', profile.academy_id)
        .single();

      setSubscription(subData);

      // Get usage data
      const { data: usageData } = await supabase
        .rpc('get_academy_usage', { academy_uuid: profile.academy_id });

      if (usageData && typeof usageData === 'object' && !Array.isArray(usageData)) {
        setUsage(usageData as unknown as UsageData);
      }

    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (newPlan: string) => {
    if (!subscription) return;
    
    setUpgradeLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-subscription-checkout', {
        body: {
          plan_type: newPlan,
          academy_id: subscription.academy_id
        }
      });

      if (error) throw error;

      // Open checkout in new tab
      window.open(data.url, '_blank');

    } catch (error: any) {
      toast({
        title: "Upgrade Failed",
        description: error.message || "Failed to start upgrade process",
        variant: "destructive"
      });
    } finally {
      setUpgradeLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'trial': return 'bg-blue-100 text-blue-800';
      case 'past_due': return 'bg-red-100 text-red-800';
      case 'canceled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUsagePercentage = (current: number, max: number) => {
    return Math.min((current / max) * 100, 100);
  };

  const isTrialExpiringSoon = () => {
    if (!subscription || subscription.status !== 'trial') return false;
    const trialEnd = new Date(subscription.trial_ends_at);
    const now = new Date();
    const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft <= 7;
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-muted rounded-lg"></div>
        <div className="h-48 bg-muted rounded-lg"></div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No subscription found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Plan Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Current Plan
              </CardTitle>
              <CardDescription>
                Your subscription details and usage
              </CardDescription>
            </div>
            <Badge className={getStatusColor(subscription.status)}>
              {subscription.status === 'trial' ? 'Free Trial' : subscription.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Plan Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold capitalize">{subscription.plan_type}</div>
              <div className="text-sm text-muted-foreground">Plan Type</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {subscription.status === 'trial' ? 'Free' : `$${planPricing[subscription.plan_type as keyof typeof planPricing]?.monthly || 0}`}
              </div>
              <div className="text-sm text-muted-foreground">Per Month</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {subscription.status === 'trial' 
                  ? Math.ceil((new Date(subscription.trial_ends_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                  : '∞'
                }
              </div>
              <div className="text-sm text-muted-foreground">
                {subscription.status === 'trial' ? 'Trial Days Left' : 'Days Remaining'}
              </div>
            </div>
          </div>

          {/* Trial Warning */}
          {isTrialExpiringSoon() && (
            <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-yellow-800">Trial Ending Soon</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Your trial expires in {Math.ceil((new Date(subscription.trial_ends_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days. 
                  Upgrade now to continue using all features.
                </p>
              </div>
            </div>
          )}

          {/* Usage Stats */}
          {usage && (
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Current Usage
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Students
                    </span>
                    <span>{usage.students} / {subscription.max_students}</span>
                  </div>
                  <Progress value={getUsagePercentage(usage.students, subscription.max_students)} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Instructors
                    </span>
                    <span>{usage.instructors} / {subscription.max_instructors}</span>
                  </div>
                  <Progress value={getUsagePercentage(usage.instructors, subscription.max_instructors)} />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Plans */}
      <Card>
        <CardHeader>
          <CardTitle>Available Plans</CardTitle>
          <CardDescription>
            Choose the plan that best fits your academy's needs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(planFeatures).map(([planType, features]) => {
              const isCurrentPlan = planType === subscription.plan_type;
              const pricing = planPricing[planType as keyof typeof planPricing];
              
              return (
                <Card key={planType} className={`relative ${isCurrentPlan ? 'ring-2 ring-primary' : ''}`}>
                  {isCurrentPlan && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground">
                        Current Plan
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="text-center">
                    <CardTitle className="capitalize">{planType}</CardTitle>
                    <div className="text-3xl font-bold">
                      ${pricing?.monthly}
                      <span className="text-sm font-normal text-muted-foreground">/month</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      or ${pricing?.yearly}/year (save 2 months)
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2">
                      {features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button
                      variant={isCurrentPlan ? "secondary" : "default"}
                      className="w-full"
                      disabled={isCurrentPlan || upgradeLoading}
                      onClick={() => handleUpgrade(planType)}
                    >
                      {isCurrentPlan ? 'Current Plan' : `Upgrade to ${planType}`}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Billing History
          </CardTitle>
          <CardDescription>
            Your payment history and invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No billing history available</p>
            <p className="text-sm">Your payment history will appear here after your first payment</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};