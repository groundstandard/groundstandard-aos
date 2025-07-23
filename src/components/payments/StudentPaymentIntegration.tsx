import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  CreditCard, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  DollarSign,
  Calendar,
  Receipt,
  RefreshCw
} from 'lucide-react';

interface StudentPaymentIntegrationProps {
  contactId: string;
  onPaymentUpdate?: () => void;
}

interface PaymentSummary {
  total_payments: number;
  successful_payments: number;
  failed_payments: number;
  pending_payments: number;
  total_amount_paid: number;
  outstanding_balance: number;
  next_payment_due?: string;
  account_credits: number;
}

interface FailedPayment {
  id: string;
  amount: number;
  failure_reason: string;
  retry_count: number;
  payment_date: string;
  description: string;
}

export const StudentPaymentIntegration = ({ contactId, onPaymentUpdate }: StudentPaymentIntegrationProps) => {
  const { toast } = useToast();
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null);
  const [failedPayments, setFailedPayments] = useState<FailedPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryLoading, setRetryLoading] = useState<string | null>(null);

  useEffect(() => {
    loadPaymentData();
  }, [contactId]);

  const loadPaymentData = async () => {
    try {
      setLoading(true);

      // Fetch payment summary
      const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .eq('student_id', contactId);

      if (payments) {
        const summary: PaymentSummary = {
          total_payments: payments.length,
          successful_payments: payments.filter(p => p.status === 'completed').length,
          failed_payments: payments.filter(p => p.status === 'failed' || p.status === 'requires_action').length,
          pending_payments: payments.filter(p => p.status === 'pending').length,
          total_amount_paid: payments
            .filter(p => p.status === 'completed')
            .reduce((sum, p) => sum + (p.amount || 0), 0),
          outstanding_balance: payments
            .filter(p => p.status === 'failed' || p.status === 'requires_action')
            .reduce((sum, p) => sum + (p.amount || 0), 0),
          account_credits: 0 // Will be loaded separately
        };

        setPaymentSummary(summary);

        // Set failed payments
        setFailedPayments(
          payments
            .filter(p => p.status === 'failed' || p.status === 'requires_action')
            .map(p => ({
              id: p.id,
              amount: p.amount,
              failure_reason: p.failure_reason || 'Payment failed',
              retry_count: p.retry_count || 0,
              payment_date: p.payment_date,
              description: p.description || 'Payment'
            }))
        );
      }

      // Fetch account credits
      const { data: credits } = await supabase
        .from('account_credits')
        .select('balance')
        .eq('student_id', contactId)
        .eq('status', 'active');

      if (credits && paymentSummary) {
        const totalCredits = credits.reduce((sum, c) => sum + (c.balance || 0), 0);
        setPaymentSummary(prev => prev ? { ...prev, account_credits: totalCredits } : null);
      }

      // Fetch next payment due
      const { data: nextPayment } = await supabase
        .from('billing_cycles')
        .select('due_date')
        .eq('membership_subscription_id', contactId) // This would need proper join
        .eq('status', 'pending')
        .order('due_date', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (nextPayment && paymentSummary) {
        setPaymentSummary(prev => prev ? { ...prev, next_payment_due: nextPayment.due_date } : null);
      }

    } catch (error) {
      console.error('Error loading payment data:', error);
      toast({
        title: "Error",
        description: "Failed to load payment information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRetryPayment = async (paymentId: string) => {
    try {
      setRetryLoading(paymentId);

      const { data, error } = await supabase.functions.invoke('process-failed-payments', {
        body: { payment_ids: [paymentId] }
      });

      if (error) throw error;

      toast({
        title: "Payment Retry Initiated",
        description: "We're attempting to process the payment again.",
      });

      // Refresh data
      await loadPaymentData();
      onPaymentUpdate?.();

    } catch (error) {
      console.error('Error retrying payment:', error);
      toast({
        title: "Error",
        description: "Failed to retry payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRetryLoading(null);
    }
  };

  const handleOpenCustomerPortal = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        body: { returnUrl: window.location.href }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Error",
        description: "Failed to open payment portal",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  if (loading) {
    return <div className="animate-pulse">Loading payment information...</div>;
  }

  if (!paymentSummary) {
    return <div>No payment information available</div>;
  }

  return (
    <div className="space-y-6">
      {/* Payment Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{paymentSummary.successful_payments}</p>
                <p className="text-sm text-muted-foreground">Successful</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{paymentSummary.failed_payments}</p>
                <p className="text-sm text-muted-foreground">Failed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{formatCurrency(paymentSummary.total_amount_paid)}</p>
                <p className="text-sm text-muted-foreground">Total Paid</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{formatCurrency(paymentSummary.outstanding_balance)}</p>
                <p className="text-sm text-muted-foreground">Outstanding</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Failed Payments Alert */}
      {failedPayments.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Payment Issues Detected:</strong> {failedPayments.length} payment(s) require attention.
            Please update payment method or contact the customer.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="failed">Failed Payments</TabsTrigger>
          <TabsTrigger value="actions">Quick Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Overview</CardTitle>
              <CardDescription>Summary of payment status and history</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Success Rate</Label>
                  <p className="text-2xl font-bold text-green-600">
                    {paymentSummary.total_payments > 0 
                      ? Math.round((paymentSummary.successful_payments / paymentSummary.total_payments) * 100)
                      : 0}%
                  </p>
                </div>
                
                {paymentSummary.account_credits > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Account Credits</Label>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(paymentSummary.account_credits)}
                    </p>
                  </div>
                )}
              </div>

              {paymentSummary.next_payment_due && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-700">
                    Next payment due: {new Date(paymentSummary.next_payment_due).toLocaleDateString()}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="failed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Failed Payments</CardTitle>
              <CardDescription>Payments that require attention</CardDescription>
            </CardHeader>
            <CardContent>
              {failedPayments.length > 0 ? (
                <div className="space-y-3">
                  {failedPayments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg border-red-200 bg-red-50">
                      <div>
                        <p className="font-medium">{formatCurrency(payment.amount)}</p>
                        <p className="text-sm text-muted-foreground">{payment.description}</p>
                        <p className="text-xs text-red-600">{payment.failure_reason}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(payment.payment_date).toLocaleDateString()} • 
                          Retry attempts: {payment.retry_count}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive">Failed</Badge>
                        {payment.retry_count < 3 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRetryPayment(payment.id)}
                            disabled={retryLoading === payment.id}
                          >
                            {retryLoading === payment.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              'Retry'
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  No failed payments
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Manage payments and billing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleOpenCustomerPortal}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Open Customer Portal
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={loadPaymentData}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Payment Data
              </Button>

              {failedPayments.length > 0 && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => failedPayments.forEach(p => handleRetryPayment(p.id))}
                >
                  <Receipt className="h-4 w-4 mr-2" />
                  Retry All Failed Payments
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};