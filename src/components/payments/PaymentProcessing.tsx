import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  DollarSign,
  Users,
  Zap,
  RefreshCw,
  Plus,
  Send,
  Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface PendingPayment {
  id: string;
  student_id: string;
  amount: number;
  description: string;
  payment_method: string;
  status: string;
  created_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface ProcessingAction {
  id: string;
  type: 'capture' | 'void' | 'refund' | 'retry';
  label: string;
  description: string;
  icon: any;
  variant: 'default' | 'destructive' | 'outline';
}

export const PaymentProcessing = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedPayment, setSelectedPayment] = useState<PendingPayment | null>(null);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [actionType, setActionType] = useState<string>('');
  const [actionForm, setActionForm] = useState({
    reason: '',
    amount: '',
    notes: ''
  });

  // Fetch pending payments (including scheduled payments)
  const { data: pendingPayments, isLoading } = useQuery({
    queryKey: ['pending-payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .in('status', ['pending', 'processing', 'requires_action', 'scheduled'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profile data separately for each payment
      const paymentsWithProfiles = await Promise.all(
        (data || []).map(async (payment) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name, email')
            .eq('id', payment.student_id)
            .single();
          
          return {
            ...payment,
            profiles: profile
          };
        })
      );
      
      return paymentsWithProfiles;
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch payment statistics
  const { data: stats } = useQuery({
    queryKey: ['payment-processing-stats'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('payments')
        .select('status, amount')
        .gte('created_at', today);

      if (error) throw error;

      const stats = {
        pending: 0,
        processing: 0,
        scheduled: 0,
        completed_today: 0,
        failed_today: 0,
        total_volume: 0
      };

      data.forEach(payment => {
        switch (payment.status) {
          case 'pending':
            stats.pending++;
            break;
          case 'processing':
            stats.processing++;
            break;
          case 'scheduled':
            stats.scheduled++;
            break;
          case 'completed':
            stats.completed_today++;
            stats.total_volume += payment.amount;
            break;
          case 'failed':
            stats.failed_today++;
            break;
        }
      });

      return stats;
    }
  });

  // Process payment action mutation
  const processActionMutation = useMutation({
    mutationFn: async ({ paymentId, action, data }: { paymentId: string; action: string; data: any }) => {
      const endpoint = action === 'refund' ? 'process-refund' : 'process-payment-action';
      
      const { data: result, error } = await supabase.functions.invoke(endpoint, {
        body: {
          payment_id: paymentId,
          action: action,
          ...data
        }
      });

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast({
        title: 'Action Processed',
        description: 'Payment action has been processed successfully.'
      });
      setShowActionDialog(false);
      setActionForm({ reason: '', amount: '', notes: '' });
      queryClient.invalidateQueries({ queryKey: ['pending-payments'] });
      queryClient.invalidateQueries({ queryKey: ['payment-processing-stats'] });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Action Failed',
        description: error.message || 'Failed to process payment action'
      });
    }
  });

  const processingActions: ProcessingAction[] = [
    {
      id: 'capture',
      type: 'capture',
      label: 'Capture Payment',
      description: 'Capture a pre-authorized payment',
      icon: CheckCircle,
      variant: 'default'
    },
    {
      id: 'void',
      type: 'void',
      label: 'Void Payment',
      description: 'Cancel a pending payment',
      icon: XCircle,
      variant: 'destructive'
    },
    {
      id: 'retry',
      type: 'retry',
      label: 'Retry Payment',
      description: 'Retry a failed payment',
      icon: RefreshCw,
      variant: 'outline'
    },
    {
      id: 'refund',
      type: 'refund',
      label: 'Process Refund',
      description: 'Issue a full or partial refund',
      icon: DollarSign,
      variant: 'outline'
    }
  ];

  const handleActionClick = (payment: PendingPayment, action: string) => {
    setSelectedPayment(payment);
    setActionType(action);
    setActionForm({
      reason: '',
      amount: action === 'refund' ? (payment.amount / 100).toString() : '',
      notes: ''
    });
    setShowActionDialog(true);
  };

  const handleSubmitAction = () => {
    if (!selectedPayment) return;

    const actionData = {
      reason: actionForm.reason,
      notes: actionForm.notes,
      ...(actionType === 'refund' && { amount: parseFloat(actionForm.amount) * 100 })
    };

    processActionMutation.mutate({
      paymentId: selectedPayment.id,
      action: actionType,
      data: actionData
    });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      requires_action: 'bg-orange-100 text-orange-800',
      scheduled: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800'
    };
    
    return (
      <Badge className={variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800'}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Payment Processing</h2>
          <p className="text-muted-foreground">Manage and process pending payments</p>
        </div>
        <Button 
          onClick={() => queryClient.invalidateQueries({ queryKey: ['pending-payments'] })}
          variant="outline"
          size="sm"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-xl font-bold text-yellow-600">{stats?.pending || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Processing</p>
                <p className="text-xl font-bold text-blue-600">{stats?.processing || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Scheduled</p>
                <p className="text-xl font-bold text-purple-600">{stats?.scheduled || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed Today</p>
                <p className="text-xl font-bold text-green-600">{stats?.completed_today || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Failed Today</p>
                <p className="text-xl font-bold text-red-600">{stats?.failed_today || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Volume Today</p>
                <p className="text-xl font-bold text-purple-600">
                  {formatCurrency(stats?.total_volume || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Pending Payments
          </CardTitle>
          <CardDescription>
            Payments requiring manual processing or attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading pending payments...</div>
          ) : !pendingPayments?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              No pending payments to process
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {payment.profiles?.first_name} {payment.profiles?.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {payment.profiles?.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(payment.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{payment.payment_method}</Badge>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(payment.status)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(payment.created_at), 'MMM dd, yyyy HH:mm')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {processingActions.map((action) => (
                          <Button
                            key={action.id}
                            variant={action.variant}
                            size="sm"
                            onClick={() => handleActionClick(payment, action.type)}
                          >
                            <action.icon className="h-3 w-3" />
                          </Button>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {processingActions.find(a => a.type === actionType)?.label}
            </DialogTitle>
            <DialogDescription>
              {processingActions.find(a => a.type === actionType)?.description}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedPayment && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium">
                  {selectedPayment.profiles?.first_name} {selectedPayment.profiles?.last_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  Payment: {formatCurrency(selectedPayment.amount)}
                </p>
              </div>
            )}

            {actionType === 'refund' && (
              <div>
                <Label htmlFor="amount">Refund Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={actionForm.amount}
                  onChange={(e) => setActionForm(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="Enter refund amount"
                />
              </div>
            )}

            <div>
              <Label htmlFor="reason">Reason</Label>
              <Select 
                value={actionForm.reason} 
                onValueChange={(value) => setActionForm(prev => ({ ...prev, reason: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer_request">Customer Request</SelectItem>
                  <SelectItem value="duplicate_charge">Duplicate Charge</SelectItem>
                  <SelectItem value="fraudulent">Fraudulent</SelectItem>
                  <SelectItem value="technical_error">Technical Error</SelectItem>
                  <SelectItem value="policy_violation">Policy Violation</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={actionForm.notes}
                onChange={(e) => setActionForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add any additional notes..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowActionDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmitAction}
                disabled={processActionMutation.isPending || !actionForm.reason}
              >
                {processActionMutation.isPending ? 'Processing...' : 'Confirm Action'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};