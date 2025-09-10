import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { config } from '@/lib/config';
import { Loader2, CreditCard } from 'lucide-react';

const stripePromise = loadStripe(config.stripe.publishableKey);

interface SubscribePanelProps {
  priceId: string;
  planName: string;
  amount: number;
  onSuccess?: () => void;
}

export function SubscribePanel({ priceId, planName, amount, onSuccess }: SubscribePanelProps) {
  const [clientSecret, setClientSecret] = useState<string>('');
  const [subscriptionId, setSubscriptionId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    createSubscription();
  }, [priceId]);

  const createSubscription = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: { priceId }
      });

      if (error) throw error;

      setClientSecret(data.clientSecret);
      setSubscriptionId(data.subscriptionId);
    } catch (error) {
      console.error('Error creating subscription:', error);
      toast({
        title: 'Error',
        description: 'Failed to initialize payment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const appearance = {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: 'hsl(var(--primary))',
      colorBackground: 'hsl(var(--background))',
      colorText: 'hsl(var(--foreground))',
      colorDanger: 'hsl(var(--destructive))',
      fontFamily: 'system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '6px',
    },
  };

  const options = {
    clientSecret,
    appearance,
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Initializing payment...</span>
        </CardContent>
      </Card>
    );
  }

  if (!clientSecret) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <p className="text-muted-foreground">Failed to initialize payment</p>
            <Button onClick={createSubscription} className="mt-4">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Subscribe to {planName}
        </CardTitle>
        <CardDescription>
          ${(amount / 100).toFixed(2)} per month
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Elements options={options} stripe={stripePromise}>
          <CheckoutForm 
            subscriptionId={subscriptionId}
            onSuccess={onSuccess}
          />
        </Elements>
      </CardContent>
    </Card>
  );
}

function CheckoutForm({ subscriptionId, onSuccess }: { subscriptionId: string; onSuccess?: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/subscription?success=true`,
      },
    });

    if (error) {
      console.error('Payment failed:', error);
      toast({
        title: 'Payment Failed',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Payment Successful',
        description: 'Your subscription has been activated!',
      });
      onSuccess?.();
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement 
        options={{
          layout: 'tabs',
        }}
      />
      
      <Button 
        type="submit" 
        disabled={!stripe || isLoading} 
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          'Subscribe Now'
        )}
      </Button>
      
      <p className="text-xs text-muted-foreground text-center">
        By subscribing, you agree to our terms of service and privacy policy.
        You can cancel your subscription at any time.
      </p>
    </form>
  );
}