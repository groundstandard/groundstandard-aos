import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, Building2, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';

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

interface EmbeddedPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId: string;
  onSuccess?: () => void;
}

export const EmbeddedPaymentModal = ({ 
  open, 
  onOpenChange, 
  contactId,
  onSuccess 
}: EmbeddedPaymentModalProps) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [scheduleType, setScheduleType] = useState<'immediate' | 'future'>('immediate');
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (open && contactId) {
      fetchPaymentMethods();
    }
  }, [open, contactId]);

  const fetchPaymentMethods = async () => {
    setLoadingPaymentMethods(true);
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('contact_id', contactId)
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setPaymentMethods(data || []);
      
      // Auto-select the default payment method if available
      const defaultMethod = data?.find(pm => pm.is_default);
      if (defaultMethod) {
        setSelectedPaymentMethod(defaultMethod.stripe_payment_method_id);
      } else if (data && data.length > 0) {
        setSelectedPaymentMethod(data[0].stripe_payment_method_id);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      toast({
        title: "Error",
        description: "Failed to load payment methods",
        variant: "destructive",
      });
    } finally {
      setLoadingPaymentMethods(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPaymentMethod || !amount) {
      toast({
        title: "Error",
        description: "Please select a payment method and enter an amount",
        variant: "destructive",
      });
      return;
    }

    if (scheduleType === 'future' && !scheduledDate) {
      toast({
        title: "Error",
        description: "Please select a date for the scheduled payment",
        variant: "destructive",
      });
      return;
    }

    const amountCents = Math.round(parseFloat(amount) * 100);
    if (amountCents <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const response = await supabase.functions.invoke('process-direct-payment', {
        body: {
          contactId,
          paymentMethodId: selectedPaymentMethod,
          amountCents,
          description: `Custom payment: ${notes || 'Direct payment'}`,
          scheduleType,
          scheduledDate: scheduleType === 'future' ? scheduledDate?.toISOString() : undefined,
          notes: notes || undefined,
        },
      });

      console.log('Payment response:', response);

      const { data, error } = response;

      // Handle Supabase edge function errors
      if (error) {
        console.error('Edge function error:', error);
        
        // Try to get the actual error message from the response
        let errorMessage = 'Payment processing failed';
        
        // For FunctionsHttpError, the actual error might be in the message or context
        if (error.message && error.message !== 'Edge Function returned a non-2xx status code') {
          errorMessage = error.message;
        } else if (error.context && error.context.error) {
          errorMessage = error.context.error;
        } else {
          // Fallback: make a direct fetch to get the actual error message
          try {
            const directResponse = await fetch(
              `https://yhriiykdnpuutzexjdee.supabase.co/functions/v1/process-direct-payment`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlocmlpeWtkbnB1dXR6ZXhqZGVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4ODEwNjAsImV4cCI6MjA2ODQ1NzA2MH0.Xtwogx9B2N8ODzbojiJJPFUpqN9j5GUtFFZHBbv2H9E`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  contactId,
                  paymentMethodId: selectedPaymentMethod,
                  amountCents,
                  description: `Custom payment: ${notes || 'Direct payment'}`,
                  scheduleType,
                  scheduledDate: scheduleType === 'future' ? scheduledDate?.toISOString() : undefined,
                  notes: notes || undefined,
                }),
              }
            );
            
            if (!directResponse.ok) {
              const errorData = await directResponse.json();
              if (errorData.error) {
                errorMessage = errorData.error;
              }
            }
          } catch (fetchError) {
            console.error('Direct fetch error:', fetchError);
          }
        }
        
        throw new Error(errorMessage);
      }

      // For 500 errors, the error message might be in the data object
      if (data && typeof data === 'object' && data.error) {
        throw new Error(data.error);
      }

      // Check for application-level errors in the response
      if (data?.error) {
        throw new Error(data.error);
      }

      if (!data?.success) {
        throw new Error('Payment processing failed');
      }

      toast({
        title: "Success",
        description: scheduleType === 'immediate' 
          ? "Payment processed successfully" 
          : "Payment scheduled successfully",
      });

      onSuccess?.();
      onOpenChange(false);
      
      // Reset form
      setAmount('');
      setNotes('');
      setScheduleType('immediate');
      setScheduledDate(undefined);
      
    } catch (error: any) {
      console.error('Error processing payment:', error);
      
      // Extract error message from different error types
      let errorMessage = "Failed to process payment";
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.error) {
        errorMessage = error.error;
      }
      
      toast({
        title: "Payment Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPaymentMethodIcon = (type: string) => {
    return type === 'card' ? <CreditCard className="h-4 w-4" /> : <Building2 className="h-4 w-4" />;
  };

  const formatCardDetails = (method: PaymentMethod) => {
    if (method.type === 'card') {
      return `•••• •••• •••• ${method.last4} (${method.brand?.toUpperCase()})`;
    }
    return `${method.bank_name} •••• ${method.last4}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Process Custom Payment</DialogTitle>
          <DialogDescription>
            Create a custom payment for this contact using their saved payment methods.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Payment Methods */}
          <div className="space-y-3">
            <Label>Payment Method</Label>
            {loadingPaymentMethods ? (
              <div className="text-sm text-muted-foreground">Loading payment methods...</div>
            ) : paymentMethods.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No payment methods on file. Add a payment method first.
              </div>
            ) : (
              <RadioGroup value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                {paymentMethods.map((method) => (
                  <div key={method.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={method.stripe_payment_method_id} id={method.id} />
                    <Label htmlFor={method.id} className="flex-1 cursor-pointer">
                      <Card className="p-3">
                        <CardContent className="p-0">
                          <div className="flex items-center gap-3">
                            {getPaymentMethodIcon(method.type)}
                            <div className="flex-1">
                              <div className="font-medium">
                                {formatCardDetails(method)}
                              </div>
                              {method.is_default && (
                                <div className="text-xs text-primary">Default</div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount ($)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          {/* Schedule Type */}
          <div className="space-y-3">
            <Label>When to Process</Label>
            <RadioGroup value={scheduleType} onValueChange={(value: 'immediate' | 'future') => setScheduleType(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="immediate" id="immediate" />
                <Label htmlFor="immediate" className="flex items-center gap-2 cursor-pointer">
                  <Clock className="h-4 w-4" />
                  Process Immediately
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="future" id="future" />
                <Label htmlFor="future" className="flex items-center gap-2 cursor-pointer">
                  <CalendarIcon className="h-4 w-4" />
                  Schedule for Later
                </Label>
              </div>
            </RadioGroup>

            {scheduleType === 'future' && (
              <div className="ml-6">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {scheduledDate ? format(scheduledDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={scheduledDate}
                      onSelect={setScheduledDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this payment..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !selectedPaymentMethod || !amount || loadingPaymentMethods}
              className="flex-1"
            >
              {loading ? 'Processing...' : scheduleType === 'immediate' ? 'Process Payment' : 'Schedule Payment'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};