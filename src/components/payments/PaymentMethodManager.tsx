import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { CreditCard, Building2, Plus, Trash2, Star } from 'lucide-react';

// Initialize Stripe
const stripePromise = loadStripe('pk_test_51GfOr7w8D1gCM4sNzxRz1dxoaVMfKfzOhYKWGfOr7w8D1gCM4sNzxRz1dxoaVMfKfzOhYKWGfOr7w8D1gCM4sNzxRz1dxoaVMfKfzOhYKWGfOr7w8D1g');

interface PaymentMethod {
  id: string;
  contact_id: string;
  stripe_payment_method_id: string;
  type: string;
  last4?: string;
  brand?: string;
  bank_name?: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
}

interface PaymentMethodManagerProps {
  contactId: string;
  onPaymentMethodSelected?: (paymentMethod: PaymentMethod) => void;
  showAddButton?: boolean;
}

const AddPaymentMethodContent = ({ contactId, onSuccess, onCancel, clientSecret }: { 
  contactId: string; 
  onSuccess: () => void; 
  onCancel: () => void; 
  clientSecret: string;
}) => {
  const [loading, setLoading] = useState(false);
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !clientSecret) return;

    setLoading(true);

    try {
      const { error: confirmError, setupIntent } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: window.location.href,
        },
        redirect: 'if_required'
      });

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      if (setupIntent?.status === 'succeeded') {
        // Save payment method to database
        const { error: saveError } = await supabase.functions.invoke('save-payment-method', {
          body: {
            setup_intent_id: setupIntent.id,
            contact_id: contactId,
            is_default: false
          }
        });

        if (saveError) throw saveError;

        toast({
          title: "Success",
          description: "Payment method added successfully",
        });

        onSuccess();
      }
    } catch (error) {
      console.error('Error adding payment method:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add payment method",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-3 border rounded-md">
        <PaymentElement options={{
          layout: 'tabs'
        }} />
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading || !stripe}>
          {loading ? "Processing..." : "Add Payment Method"}
        </Button>
      </div>
    </form>
  );
};

const AddPaymentMethodForm = ({ contactId, onSuccess, onCancel }: { 
  contactId: string; 
  onSuccess: () => void; 
  onCancel: () => void; 
}) => {
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setupPaymentMethod();
  }, []);

  const setupPaymentMethod = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('setup-payment-method', {
        body: {
          contact_id: contactId,
          payment_type: 'card'
        }
      });

      if (error) throw error;

      setClientSecret(data.client_secret);
    } catch (error) {
      console.error('Error setting up payment method:', error);
      toast({
        title: "Error",
        description: "Failed to setup payment method",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Setting up payment form...</div>;
  }

  if (!clientSecret) {
    return <div className="text-center py-4">Unable to setup payment form</div>;
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <AddPaymentMethodContent
        contactId={contactId}
        onSuccess={onSuccess}
        onCancel={onCancel}
        clientSecret={clientSecret}
      />
    </Elements>
  );
};

export const PaymentMethodManager = ({ 
  contactId, 
  onPaymentMethodSelected, 
  showAddButton = true 
}: PaymentMethodManagerProps) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPaymentMethods();
  }, [contactId]);

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('contact_id', contactId)
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPaymentMethods(data || []);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      toast({
        title: "Error",
        description: "Failed to load payment methods",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (paymentMethodId: string) => {
    try {
      // First, unset all defaults
      await supabase
        .from('payment_methods')
        .update({ is_default: false })
        .eq('contact_id', contactId);

      // Then set the new default
      const { error } = await supabase
        .from('payment_methods')
        .update({ is_default: true })
        .eq('id', paymentMethodId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Default payment method updated",
      });

      fetchPaymentMethods();
    } catch (error) {
      console.error('Error setting default payment method:', error);
      toast({
        title: "Error",
        description: "Failed to update default payment method",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (paymentMethodId: string) => {
    try {
      const { error } = await supabase
        .from('payment_methods')
        .update({ is_active: false })
        .eq('id', paymentMethodId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Payment method removed",
      });

      fetchPaymentMethods();
    } catch (error) {
      console.error('Error removing payment method:', error);
      toast({
        title: "Error",
        description: "Failed to remove payment method",
        variant: "destructive",
      });
    }
  };

  const getPaymentMethodIcon = (type: string) => {
    switch (type) {
      case 'card':
        return <CreditCard className="h-4 w-4" />;
      case 'us_bank_account':
        return <Building2 className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const getPaymentMethodDisplay = (method: PaymentMethod) => {
    if (method.type === 'card') {
      return `${method.brand || 'Card'} ****${method.last4}`;
    } else if (method.type === 'us_bank_account') {
      return `${method.bank_name || 'Bank'} ****${method.last4}`;
    }
    return `${method.type} ****${method.last4}`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading payment methods...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Methods
            </CardTitle>
            {showAddButton && (
              <Button variant="outline" size="sm" onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Method
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {paymentMethods.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-4">No payment methods saved</p>
              {showAddButton && (
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Payment Method
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className={`flex items-center justify-between p-3 border rounded-lg ${
                    onPaymentMethodSelected ? 'cursor-pointer hover:bg-accent' : ''
                  }`}
                  onClick={() => onPaymentMethodSelected?.(method)}
                >
                  <div className="flex items-center gap-3">
                    {getPaymentMethodIcon(method.type)}
                    <div>
                      <div className="font-medium">
                        {getPaymentMethodDisplay(method)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Added {new Date(method.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    {method.is_default && (
                      <Badge variant="secondary" className="ml-2">
                        <Star className="h-3 w-3 mr-1" />
                        Default
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!method.is_default && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetDefault(method.id);
                        }}
                      >
                        Set Default
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(method.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Payment Method</DialogTitle>
            <DialogDescription>
              Add a new payment method for secure storage and future payments
            </DialogDescription>
          </DialogHeader>
          <AddPaymentMethodForm
            contactId={contactId}
            onSuccess={() => {
              setShowAddDialog(false);
              fetchPaymentMethods();
            }}
            onCancel={() => setShowAddDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};