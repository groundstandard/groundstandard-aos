import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

interface MembershipSubscription {
  id: string;
  membership_plan_id: string;
  stripe_subscription_id?: string;
  status: string;
  start_date: string;
  end_date?: string;
  next_billing_date?: string;
  billing_frequency?: string;
  auto_renewal: boolean;
  cycle_length_months?: number;
  billing_amount_cents?: number;
  discount_percentage?: number;
  membership_plan?: {
    name: string;
    description?: string;
    price_cents: number;
    billing_frequency: string;
  };
}

interface MembershipSubscriptionContextType {
  subscription: MembershipSubscription | null;
  loading: boolean;
  refreshSubscription: () => Promise<void>;
  createCheckout: (planId: string, billingFrequency?: string) => Promise<string | null>;
  openPortal: () => Promise<void>;
}

const MembershipSubscriptionContext = createContext<MembershipSubscriptionContextType | undefined>(undefined);

export const useMembershipSubscription = () => {
  const context = useContext(MembershipSubscriptionContext);
  if (context === undefined) {
    throw new Error('useMembershipSubscription must be used within a MembershipSubscriptionProvider');
  }
  return context;
};

interface MembershipSubscriptionProviderProps {
  children: ReactNode;
}

export const MembershipSubscriptionProvider = ({ children }: MembershipSubscriptionProviderProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<MembershipSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSubscription = async () => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('membership_subscriptions')
        .select(`
          *,
          membership_plan:membership_plans(
            name,
            description,
            price_cents,
            billing_frequency
          )
        `)
        .eq('profile_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (error) {
        console.error('Error fetching subscription:', error);
        toast({
          title: "Error",
          description: "Failed to load subscription information",
          variant: "destructive",
        });
        return;
      }

      if (data) {
        setSubscription({
          id: data.id,
          membership_plan_id: data.membership_plan_id,
          stripe_subscription_id: data.stripe_subscription_id || undefined,
          status: data.status,
          start_date: data.start_date,
          end_date: data.end_date || undefined,
          next_billing_date: data.next_billing_date || undefined,
          auto_renewal: data.auto_renewal,
          cycle_length_months: data.cycle_length_months || undefined,
          billing_amount_cents: data.billing_amount_cents || undefined,
          discount_percentage: data.discount_percentage || undefined,
          membership_plan: Array.isArray(data.membership_plan) && data.membership_plan.length > 0 
            ? data.membership_plan[0] 
            : data.membership_plan || undefined
        });
      } else {
        setSubscription(null);
      }
    } catch (error) {
      console.error('Error refreshing subscription:', error);
      toast({
        title: "Error",
        description: "Failed to refresh subscription",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createCheckout = async (planId: string, billingFrequency = 'monthly'): Promise<string | null> => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to subscribe to a membership plan",
        variant: "destructive",
      });
      return null;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-membership-checkout', {
        body: { 
          planId, 
          billingFrequency 
        },
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) {
        throw error;
      }

      return data.url;
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Checkout Error",
        description: "Failed to create checkout session. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  const openPortal = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to manage your subscription",
        variant: "destructive",
      });
      return;
    }

    if (!subscription?.stripe_subscription_id) {
      toast({
        title: "No Active Subscription",
        description: "You don't have an active subscription to manage",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('membership-portal', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) {
        throw error;
      }

      // Open portal in new tab
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Error opening portal:', error);
      toast({
        title: "Portal Error",
        description: "Failed to open subscription management portal",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    refreshSubscription();
  }, [user]);

  const value: MembershipSubscriptionContextType = {
    subscription,
    loading,
    refreshSubscription,
    createCheckout,
    openPortal,
  };

  return (
    <MembershipSubscriptionContext.Provider value={value}>
      {children}
    </MembershipSubscriptionContext.Provider>
  );
};