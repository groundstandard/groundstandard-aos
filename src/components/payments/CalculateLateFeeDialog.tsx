import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDistanceToNow } from 'date-fns';

interface CalculateLateFeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface OverduePayment {
  id: string;
  student_id: string;
  amount: number;
  description: string;
  payment_date: string;
  status: string;
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

export const CalculateLateFeeDialog = ({ open, onOpenChange }: CalculateLateFeeDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [lateFeePercentage, setLateFeePercentage] = useState('5');
  const [minimumLateFee, setMinimumLateFee] = useState('5.00');

  // Fetch overdue payments
  const { data: overduePayments, isLoading } = useQuery({
    queryKey: ['overdue-payments-late-fees'],
    queryFn: async () => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 7); // 7 days grace period
      
      const { data, error } = await supabase
        .from('payments')
        .select(`
          id,
          student_id,
          amount,
          description,
          payment_date,
          status,
          profiles!payments_student_id_fkey (first_name, last_name, email)
        `)
        .eq('status', 'pending')
        .lt('payment_date', cutoffDate.toISOString())
        .order('payment_date', { ascending: true });

      if (error) throw error;
      
      // Filter out payments that already have late fees
      const paymentsWithoutLateFees = [];
      for (const payment of (data as any[]) || []) {
        const { data: existingLateFees, error: lateFeeError } = await supabase
          .from('late_fees')
          .select('id')
          .eq('payment_id', payment.id)
          .limit(1);
        
        if (!lateFeeError && (!existingLateFees || existingLateFees.length === 0)) {
          paymentsWithoutLateFees.push({
            ...payment,
            profiles: payment.profiles?.[0] || payment.profiles
          });
        }
      }
      
      return paymentsWithoutLateFees as OverduePayment[];
    },
    enabled: open
  });

  const calculateLateFeesMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('calculate_late_fees');
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Late Fees Calculated',
        description: `Late fees applied to ${selectedPayments.length} overdue payment(s).`
      });
      resetForm();
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ['overdue-payments-late-fees'] });
      queryClient.invalidateQueries({ queryKey: ['late-fees'] });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to calculate late fees'
      });
    }
  });

  const applySelectedLateFeesMutation = useMutation({
    mutationFn: async (paymentData: { paymentId: string; lateFeeAmount: number; daysOverdue: number }[]) => {
      const promises = paymentData.map(({ paymentId, lateFeeAmount, daysOverdue }) => {
        const payment = overduePayments?.find(p => p.id === paymentId);
        if (!payment) return Promise.resolve();
        
        return supabase
          .from('late_fees')
          .insert({
            payment_id: paymentId,
            student_id: payment.student_id,
            original_amount: payment.amount,
            late_fee_amount: Math.round(lateFeeAmount * 100),
            days_overdue: daysOverdue,
            fee_percentage: parseFloat(lateFeePercentage)
          });
      });
      
      const results = await Promise.all(promises);
      const errors = results.filter(result => result && 'error' in result && result.error);
      
      if (errors.length > 0) {
        throw new Error(`Failed to apply ${errors.length} late fee(s)`);
      }
      
      return results;
    },
    onSuccess: () => {
      toast({
        title: 'Late Fees Applied',
        description: `Late fees applied to ${selectedPayments.length} payment(s).`
      });
      resetForm();
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ['overdue-payments-late-fees'] });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to apply late fees'
      });
    }
  });

  const resetForm = () => {
    setSelectedPayments([]);
    setLateFeePercentage('5');
    setMinimumLateFee('5.00');
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
    return Math.floor((Date.now() - new Date(paymentDate).getTime()) / (1000 * 60 * 60 * 24));
  };

  const calculateLateFee = (amount: number) => {
    const percentageFee = amount * (parseFloat(lateFeePercentage) / 100);
    const minimumFee = parseFloat(minimumLateFee) * 100;
    return Math.max(percentageFee, minimumFee);
  };

  const applySelectedLateFees = () => {
    const paymentData = selectedPayments.map(paymentId => {
      const payment = overduePayments?.find(p => p.id === paymentId);
      if (!payment) return null;
      
      return {
        paymentId,
        lateFeeAmount: calculateLateFee(payment.amount) / 100,
        daysOverdue: getOverdueDays(payment.payment_date)
      };
    }).filter(Boolean) as { paymentId: string; lateFeeAmount: number; daysOverdue: number }[];
    
    applySelectedLateFeesMutation.mutate(paymentData);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Calculate Late Fees</DialogTitle>
          <DialogDescription>
            Apply late fees to overdue payments that are more than 7 days past due
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Late Fee Settings */}
          <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
            <div>
              <Label>Late Fee Percentage (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={lateFeePercentage}
                onChange={(e) => setLateFeePercentage(e.target.value)}
                placeholder="5.0"
              />
            </div>
            <div>
              <Label>Minimum Late Fee ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={minimumLateFee}
                onChange={(e) => setMinimumLateFee(e.target.value)}
                placeholder="5.00"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-4">Loading overdue payments...</div>
          ) : overduePayments?.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No eligible payments for late fees found
            </div>
          ) : (
            <>
              {/* Action Buttons */}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={selectAll}
                >
                  {selectedPayments.length === overduePayments?.length ? 'Deselect All' : 'Select All'}
                </Button>
                
                <div className="flex gap-2">
                  <Button
                    onClick={applySelectedLateFees}
                    disabled={applySelectedLateFeesMutation.isPending || selectedPayments.length === 0}
                  >
                    {applySelectedLateFeesMutation.isPending 
                      ? 'Applying...' 
                      : `Apply Late Fees (${selectedPayments.length})`
                    }
                  </Button>
                  
                  <Button
                    variant="secondary"
                    onClick={() => calculateLateFeesMutation.mutate()}
                    disabled={calculateLateFeesMutation.isPending}
                  >
                    {calculateLateFeesMutation.isPending ? 'Calculating...' : 'Auto Calculate All'}
                  </Button>
                </div>
              </div>

              {/* Payments Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedPayments.length === overduePayments?.length}
                        onCheckedChange={selectAll}
                      />
                    </TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Days Overdue</TableHead>
                    <TableHead>Calculated Late Fee</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overduePayments?.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedPayments.includes(payment.id)}
                          onCheckedChange={() => togglePaymentSelection(payment.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {payment.profiles?.first_name} {payment.profiles?.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">{payment.profiles?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(payment.amount)}</TableCell>
                      <TableCell className="max-w-xs truncate">{payment.description}</TableCell>
                      <TableCell>
                        <Badge variant="destructive">
                          {getOverdueDays(payment.payment_date)} days
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(calculateLateFee(payment.amount))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};