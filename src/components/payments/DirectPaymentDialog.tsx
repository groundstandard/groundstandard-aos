import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, DollarSign } from 'lucide-react';

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
}

interface DirectPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId: string;
  contactName: string;
  paymentScheduleId?: string;
  prefilledAmount?: number;
  prefilledDescription?: string;
  onSuccess?: () => void;
}

export const DirectPaymentDialog = ({
  open,
  onOpenChange,
  contactId,
  contactName,
  paymentScheduleId,
  prefilledAmount,
  prefilledDescription,
  onSuccess
}: DirectPaymentDialogProps) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>('');
  const [amount, setAmount] = useState(prefilledAmount ? (prefilledAmount / 100).toString() : '');
  const [description, setDescription] = useState(prefilledDescription || '');
  const [loading, setLoading] = useState(false);
  const [loadingMethods, setLoadingMethods] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (open && contactId) {
      fetchPaymentMethods();
    }
  }, [open, contactId]);

  useEffect(() => {
    if (prefilledAmount) {
      setAmount((prefilledAmount / 100).toString());
    }
    if (prefilledDescription) {
      setDescription(prefilledDescription);
    }
  }, [prefilledAmount, prefilledDescription]);

  const fetchPaymentMethods = async () => {
    try {
      setLoadingMethods(true);
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('contact_id', contactId)
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPaymentMethods(data || []);
      
      // Auto-select default payment method if available
      const defaultMethod = data?.find(pm => pm.is_default);
      if (defaultMethod) {
        setSelectedPaymentMethodId(defaultMethod.id);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      toast({
        title: "Error",
        description: "Failed to load payment methods",
        variant: "destructive",
      });
    } finally {
      setLoadingMethods(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPaymentMethodId) {
      toast({
        title: "Error",
        description: "Please select a payment method",
        variant: "destructive",
      });
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('process-direct-payment', {
        body: {
          contact_id: contactId,
          payment_method_id: selectedPaymentMethodId,
          amount_cents: Math.round(parseFloat(amount) * 100),
          description: description,
          payment_schedule_id: paymentScheduleId
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Success",
          description: `Payment of $${amount} processed successfully`,
        });

        onSuccess?.();
        onOpenChange(false);
        
        // Reset form
        setAmount('');
        setDescription('');
        setSelectedPaymentMethodId('');
      } else if (data.requires_action) {
        toast({
          title: "Action Required",
          description: "Additional authentication required. Please check your bank or card provider.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process payment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

  const getPaymentMethodIcon = (type: string) => {
    switch (type) {
      case 'us_bank_account':
        return '🏦';
      default:
        return '💳';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Process Payment
          </DialogTitle>
          <DialogDescription>
            Process a direct payment for {contactName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="amount">Amount</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="pl-10"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Payment description..."
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="payment-method">Payment Method</Label>
            {loadingMethods ? (
              <div className="text-sm text-muted-foreground">Loading payment methods...</div>
            ) : paymentMethods.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No payment methods found. Please add a payment method first.
              </div>
            ) : (
              <Select value={selectedPaymentMethodId} onValueChange={setSelectedPaymentMethodId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.id} value={method.id}>
                      <div className="flex items-center gap-2">
                        <span>{getPaymentMethodIcon(method.type)}</span>
                        <span>{getPaymentMethodDisplay(method)}</span>
                        {method.is_default && (
                          <span className="text-xs text-muted-foreground">(Default)</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || loadingMethods || paymentMethods.length === 0}
            >
              {loading ? "Processing..." : "Process Payment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};