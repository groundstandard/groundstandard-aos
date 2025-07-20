import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionInfo {
  subscribed: boolean;
  subscription_tier?: string;
  subscription_end?: string;
}

interface SubscriptionContextType {
  subscriptionInfo: SubscriptionInfo | null;
  loading: boolean;
  refreshSubscription: () => Promise<void>;
  createCheckout: (planId: string) => Promise<string | null>;
  openCustomerPortal: () => Promise<void>;
  createPayment: (amount: number, description: string) => Promise<string | null>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

export const SubscriptionProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSubscription = async () => {
    if (!user) {
      setSubscriptionInfo(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('sync-subscription-status', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });
      
      if (error) {
        console.error('Error checking subscription:', error);
        setSubscriptionInfo({ subscribed: false });
        toast({
          title: "Error refreshing subscription",
          description: error.message || "Unknown error",
          variant: "destructive",
        });
      } else if (data) {
        setSubscriptionInfo(data);
      }
    } catch (error) {
      console.error('Error refreshing subscription:', error);
      setSubscriptionInfo({ subscribed: false });
      toast({
        title: "Error refreshing subscription",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createCheckout = async (planId: string): Promise<string | null> => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to subscribe",
        variant: "destructive",
      });
      return null;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-subscription-checkout', {
        body: { planId },
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) {
        console.error('Error creating checkout:', error);
        toast({
          title: "Error creating checkout",
          description: error.message || "Failed to create checkout session",
          variant: "destructive",
        });
        return null;
      }

      return data?.url || null;
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Error creating checkout",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      return null;
    }
  };

  const openCustomerPortal = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to manage your subscription",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('subscription-portal', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) {
        console.error('Error opening customer portal:', error);
        toast({
          title: "Error opening customer portal",
          description: error.message || "Failed to open customer portal",
          variant: "destructive",
        });
        return;
      }

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Error opening customer portal",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const createPayment = async (amount: number, description: string): Promise<string | null> => {
    if (!user) {
      throw new Error('User must be authenticated to create payment');
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { amount: amount * 100, description, paymentType: 'payment' }
      });

      if (error) {
        console.error('Error creating payment:', error);
        throw new Error('Failed to create payment session');
      }

      return data?.url || null;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  };

  useEffect(() => {
    refreshSubscription();
  }, [user]);

  return (
    <SubscriptionContext.Provider value={{
      subscriptionInfo,
      loading,
      refreshSubscription,
      createCheckout,
      openCustomerPortal,
      createPayment
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
};