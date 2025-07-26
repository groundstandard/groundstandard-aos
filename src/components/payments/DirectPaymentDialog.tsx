import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign } from 'lucide-react';

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
  const [amount, setAmount] = useState(prefilledAmount ? (prefilledAmount / 100).toString() : '');
  const [description, setDescription] = useState(prefilledDescription || '');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (prefilledAmount) {
      setAmount((prefilledAmount / 100).toString());
    }
    if (prefilledDescription) {
      setDescription(prefilledDescription);
    }
  }, [prefilledAmount, prefilledDescription]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      const { data, error } = await supabase.functions.invoke('charge-stored-payment', {
        body: {
          contact_id: contactId,
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
      } else if (data.requires_action) {
        toast({
          title: "Action Required",
          description: "Additional authentication required. Please check your bank or card provider.",
          variant: "destructive",
        });
      } else if (data.requires_payment_setup) {
        toast({
          title: "Payment Method Required",
          description: "Please add a payment method to complete this transaction.",
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

          <div className="text-sm text-muted-foreground">
            Payment will be processed using the default payment method on file.
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
            >
              {loading ? "Processing..." : "Process Payment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};