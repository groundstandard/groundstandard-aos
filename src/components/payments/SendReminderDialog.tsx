import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

interface SendReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface OverduePayment {
  id: string;
  student_id: string;
  amount: number;
  description: string;
  payment_date: string;
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

export const SendReminderDialog = ({ open, onOpenChange }: SendReminderDialogProps) => {
  const { toast } = useToast();
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [reminderType, setReminderType] = useState<'gentle' | 'firm' | 'final'>('gentle');
  const [customMessage, setCustomMessage] = useState('');

  // Fetch overdue payments
  const { data: overduePayments, isLoading } = useQuery({
    queryKey: ['overdue-payments'],
    queryFn: async () => {
      let data: any[] = [];
      {
        const { data: rows, error } = await (supabase as any)
          .from('payments')
          .select('id, student_id, amount, description, payment_date')
          .eq('status', 'pending')
          .lt('payment_date', new Date().toISOString())
          .order('payment_date', { ascending: true });

        if (!error) {
          data = rows || [];
        } else {
          const { data: rows2, error: error2 } = await (supabase as any)
            .from('payments')
            .select('id, user_id, amount, description, payment_date')
            .eq('status', 'pending')
            .lt('payment_date', new Date().toISOString())
            .order('payment_date', { ascending: true });

          if (error2) throw error2;
          data = (rows2 || []).map((r: any) => ({
            ...r,
            student_id: r.user_id,
          }));
        }
      }

      const studentIds = Array.from(new Set((data || []).map((p: any) => p.student_id).filter(Boolean)));
      const { data: profilesData, error: profilesError } = studentIds.length
        ? await supabase
            .from('profiles')
            .select('id, first_name, last_name, email')
            .in('id', studentIds)
        : { data: [], error: null };

      if (profilesError) throw profilesError;
      const profileById = new Map((profilesData || []).map((p: any) => [p.id, p]));

      return ((data as any[]) || []).map((item: any) => ({
        ...item,
        profiles: profileById.get(item.student_id) || null,
      })) as OverduePayment[];
    },
    enabled: open
  });

  const sendReminderMutation = useMutation({
    mutationFn: async ({ paymentIds, type, message }: { 
      paymentIds: string[]; 
      type: string; 
      message: string; 
    }) => {
      const { data, error } = await supabase.functions.invoke('send-payment-reminder', {
        body: {
          payment_ids: paymentIds,
          reminder_type: type,
          custom_message: message
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Reminders Sent',
        description: `Payment reminders sent to ${selectedPayments.length} customer(s).`
      });
      resetForm();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to send reminders'
      });
    }
  });

  const resetForm = () => {
    setSelectedPayments([]);
    setReminderType('gentle');
    setCustomMessage('');
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  const togglePaymentSelection = (paymentId: string) => {
    setSelectedPayments(prev => 
      prev.includes(paymentId)
        ? prev.filter(id => id !== paymentId)
        : [...prev, paymentId]
    );
  };

  const selectAll = () => {
    if (selectedPayments.length === overduePayments?.length) {
      setSelectedPayments([]);
    } else {
      setSelectedPayments(overduePayments?.map(p => p.id) || []);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  const getOverdueDays = (paymentDate: string) => {
    const daysDiff = Math.floor((Date.now() - new Date(paymentDate).getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff;
  };

  const getReminderTemplate = (type: string) => {
    switch (type) {
      case 'gentle':
        return 'Hi! This is a friendly reminder that your payment is past due. Please make your payment at your earliest convenience.';
      case 'firm':
        return 'Your payment is overdue. Please make your payment immediately to avoid any service interruptions.';
      case 'final':
        return 'FINAL NOTICE: Your payment is seriously overdue. Please make payment immediately or contact us to discuss your account.';
      default:
        return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send Payment Reminders</DialogTitle>
          <DialogDescription>
            Send payment reminders to customers with overdue payments
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-4">Loading overdue payments...</div>
          ) : overduePayments?.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No overdue payments found
            </div>
          ) : (
            <>
              {/* Payment Selection */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-base font-medium">Select Overdue Payments</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAll}
                  >
                    {selectedPayments.length === overduePayments?.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
                
                <div className="max-h-48 overflow-y-auto border rounded-lg">
                  {overduePayments?.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center space-x-3 p-3 border-b last:border-b-0 hover:bg-muted/50"
                    >
                      <Checkbox
                        checked={selectedPayments.includes(payment.id)}
                        onCheckedChange={() => togglePaymentSelection(payment.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium truncate">
                            {payment.profiles?.first_name} {payment.profiles?.last_name}
                          </p>
                          <Badge variant="destructive" className="ml-2">
                            {getOverdueDays(payment.payment_date)} days overdue
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {payment.profiles?.email}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-sm">
                            {formatCurrency(payment.amount)} - {payment.description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Due: {formatDistanceToNow(new Date(payment.payment_date), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reminder Type */}
              <div>
                <Label>Reminder Type</Label>
                <Select 
                  value={reminderType} 
                  onValueChange={(value: 'gentle' | 'firm' | 'final') => {
                    setReminderType(value);
                    setCustomMessage(getReminderTemplate(value));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gentle">Gentle Reminder</SelectItem>
                    <SelectItem value="firm">Firm Reminder</SelectItem>
                    <SelectItem value="final">Final Notice</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Message */}
              <div>
                <Label>Message</Label>
                <Textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Enter custom reminder message..."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This message will be sent to selected customers
                </p>
              </div>

              <Button 
                onClick={() => sendReminderMutation.mutate({
                  paymentIds: selectedPayments,
                  type: reminderType,
                  message: customMessage
                })}
                disabled={sendReminderMutation.isPending || selectedPayments.length === 0 || !customMessage}
                className="w-full"
              >
                {sendReminderMutation.isPending 
                  ? 'Sending...' 
                  : `Send Reminders (${selectedPayments.length})`
                }
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};