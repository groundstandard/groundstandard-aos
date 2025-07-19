import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from './useAuth';

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
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error('Error checking subscription:', error);
        setSubscriptionInfo({ subscribed: false });
      } else if (data) {
        setSubscriptionInfo(data);
      }
    } catch (error) {
      console.error('Error refreshing subscription:', error);
      setSubscriptionInfo({ subscribed: false });
    } finally {
      setLoading(false);
    }
  };

  const createCheckout = async (planId: string): Promise<string | null> => {
    if (!user) {
      throw new Error('User must be authenticated to create checkout');
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { planId, paymentType: 'subscription' }
      });

      if (error) {
        console.error('Error creating checkout:', error);
        throw new Error('Failed to create checkout session');
      }

      return data?.url || null;
    } catch (error) {
      console.error('Error creating checkout:', error);
      throw error;
    }
  };

  const openCustomerPortal = async () => {
    if (!user) {
      throw new Error('User must be authenticated to access customer portal');
    }

    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) {
        console.error('Error opening customer portal:', error);
        throw new Error('Failed to open customer portal');
      }

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      throw error;
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