import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAcademy } from '@/hooks/useAcademy';
import { Navigate } from 'react-router-dom';
import { Loader2, CreditCard, Check, Crown } from 'lucide-react';
import { SubscribePanel } from '@/components/subscription/SubscribePanel';
import { BackButton } from '@/components/ui/BackButton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Price {
  id: string;
  name: string;
  stripe_price_id: string;
}

interface Subscription {
  id: string;
  subscription_tier: string;
  subscription_status: string;
  subscription_end: string;
}

const StudentBilling = () => {
  const [prices, setPrices] = useState<Price[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPrice, setSelectedPrice] = useState<Price | null>(null);
  const [showSubscribeDialog, setShowSubscribeDialog] = useState(false);
  const { user } = useAuth();
  const { academy } = useAcademy();
  const { toast } = useToast();

  // Redirect unauthenticated users
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  useEffect(() => {
    if (academy?.id) {
      loadPricesAndSubscription();
    }
  }, [academy?.id, user?.id]);

  const loadPricesAndSubscription = async () => {
    try {
      setLoading(true);
      
      // Load available prices for this academy
      const { data: pricesData, error: pricesError } = await supabase
        .from('prices')
        .select('*')
        .eq('academy_id', academy?.id)
        .order('name');

      if (pricesError) throw pricesError;
      setPrices(pricesData || []);

      // Load current subscription status
      const { data: subData, error: subError } = await supabase
        .from('subscribers')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (subError && subError.code !== 'PGRST116') {
        throw subError;
      }
      
      setSubscription(subData);
    } catch (error) {
      console.error('Error loading billing data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load billing information',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = (price: Price) => {
    setSelectedPrice(price);
    setShowSubscribeDialog(true);
  };

  const handleSubscriptionSuccess = () => {
    setShowSubscribeDialog(false);
    setSelectedPrice(null);
    toast({
      title: 'Success!',
      description: 'Your subscription has been activated.',
    });
    // Reload subscription data
    loadPricesAndSubscription();
  };

  const openCustomerPortal = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw error;
      
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: 'Error',
        description: 'Failed to open billing portal',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading billing information...</span>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="flex items-start gap-2 sm:gap-4 mb-6 sm:mb-8">
          <BackButton />
          <div className="flex-1">
            <h1 className="text-xl sm:text-3xl font-bold text-foreground flex items-center gap-2 flex-wrap">
              <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              <span className="break-words">Billing & Subscription</span>
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Manage your academy membership and billing
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Current Subscription Status */}
          {subscription && subscription.subscription_status === 'active' ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-primary" />
                  Current Subscription
                </CardTitle>
                <CardDescription>
                  Your active membership plan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{subscription.subscription_tier} Plan</h3>
                    <p className="text-muted-foreground">
                      {subscription.subscription_end && 
                        `Renews on ${new Date(subscription.subscription_end).toLocaleDateString()}`
                      }
                    </p>
                  </div>
                  <Button onClick={openCustomerPortal} variant="outline">
                    Manage Subscription
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Active Subscription</CardTitle>
                <CardDescription>
                  Choose a plan below to get started with your academy membership
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {/* Available Plans */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {prices.map((price) => (
              <Card key={price.id} className="relative">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {price.name}
                    {subscription?.subscription_tier === price.name && (
                      <div className="flex items-center gap-1 text-sm bg-primary/10 text-primary px-2 py-1 rounded-full">
                        <Check className="h-3 w-3" />
                        Current
                      </div>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Stripe Price ID: {price.stripe_price_id}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold">Contact Academy</p>
                      <p className="text-muted-foreground">for pricing details</p>
                    </div>
                    
                    {subscription?.subscription_tier === price.name ? (
                      <Button 
                        onClick={openCustomerPortal} 
                        variant="outline" 
                        className="w-full"
                      >
                        Manage Plan
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => handleSubscribe(price)}
                        className="w-full"
                      >
                        Subscribe Now
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {prices.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Plans Available</h3>
                <p className="text-muted-foreground">
                  Contact your academy administrator to set up subscription plans.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Subscribe Dialog */}
        <Dialog open={showSubscribeDialog} onOpenChange={setShowSubscribeDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Subscribe to {selectedPrice?.name}</DialogTitle>
              <DialogDescription>
                Complete your subscription setup with secure payment
              </DialogDescription>
            </DialogHeader>
            
            {selectedPrice && (
              <SubscribePanel
                priceId={selectedPrice.stripe_price_id}
                planName={selectedPrice.name}
                amount={0} // We'll get this from Stripe
                onSuccess={handleSubscriptionSuccess}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default StudentBilling;