import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Receipt, AlertCircle, DollarSign, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface PaymentSummary {
  totalPaid: number;
  outstandingBalance: number;
  nextPaymentDue: string | null;
  recentPayments: Array<{
    id: string;
    amount: number;
    description: string;
    payment_date: string;
    status: string;
  }>;
  failedPayments: number;
}

export const StudentPaymentSummary = () => {
  const [summary, setSummary] = useState<PaymentSummary>({
    totalPaid: 0,
    outstandingBalance: 0,
    nextPaymentDue: null,
    recentPayments: [],
    failedPayments: 0
  });
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (profile) {
      fetchPaymentSummary();
    }
  }, [profile]);

  const fetchPaymentSummary = async () => {
    try {
      setLoading(true);

      // Fetch payment history
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('student_id', profile?.id)
        .order('payment_date', { ascending: false })
        .limit(10);

      if (paymentsError) throw paymentsError;

      // Calculate summary
      const totalPaid = payments
        ?.filter(p => p.status === 'completed')
        ?.reduce((sum, p) => sum + p.amount, 0) || 0;

      const outstandingBalance = payments
        ?.filter(p => p.status === 'pending')
        ?.reduce((sum, p) => sum + p.amount, 0) || 0;

      const failedPayments = payments?.filter(p => p.status === 'failed').length || 0;

      const recentPayments = payments?.slice(0, 5).map(p => ({
        id: p.id,
        amount: p.amount,
        description: p.description || 'Membership payment',
        payment_date: p.payment_date,
        status: p.status
      })) || [];

      // Fetch next billing date from active subscription
      const { data: subscription } = await supabase
        .from('membership_subscriptions')
        .select('next_billing_date')
        .eq('profile_id', profile?.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      setSummary({
        totalPaid,
        outstandingBalance,
        nextPaymentDue: subscription?.next_billing_date || null,
        recentPayments,
        failedPayments
      });

    } catch (error: any) {
      console.error('Error fetching payment summary:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load payment summary'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  const openPaymentPortal = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        body: { returnUrl: window.location.href }
      });

      if (error) throw error;
      window.open(data.url, '_blank');
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to open payment portal. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card className="card-minimal">
        <CardContent className="p-6">
          <div className="text-center">Loading payment information...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payment Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="card-minimal">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Paid</p>
                <p className="text-xl font-bold">{formatCurrency(summary.totalPaid)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-minimal">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${summary.outstandingBalance > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
                <Receipt className={`h-5 w-5 ${summary.outstandingBalance > 0 ? 'text-red-600' : 'text-gray-600'}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Outstanding</p>
                <p className="text-xl font-bold">{formatCurrency(summary.outstandingBalance)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-minimal">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Next Due</p>
                <p className="text-sm font-medium">
                  {summary.nextPaymentDue 
                    ? format(new Date(summary.nextPaymentDue), 'MMM d, yyyy')
                    : 'No upcoming payments'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Failed Payments Alert */}
      {summary.failedPayments > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div className="flex-1">
                <p className="font-medium text-red-800">Payment Action Required</p>
                <p className="text-sm text-red-700">
                  You have {summary.failedPayments} failed payment{summary.failedPayments > 1 ? 's' : ''} that need attention.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={openPaymentPortal}>
                Update Payment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Payments */}
      <Card className="card-minimal">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Recent Payments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {summary.recentPayments.length > 0 ? (
            <div className="space-y-3">
              {summary.recentPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-3 bg-muted/20 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{formatCurrency(payment.amount)}</p>
                    <p className="text-sm text-muted-foreground">{payment.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(payment.payment_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <Badge
                    variant={
                      payment.status === 'completed' ? 'default' : 
                      payment.status === 'failed' ? 'destructive' :
                      'secondary'
                    }
                  >
                    {payment.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No payment history found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manage Payments */}
      <Card className="card-minimal">
        <CardHeader>
          <CardTitle>Manage Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={openPaymentPortal} className="w-full">
            <CreditCard className="h-4 w-4 mr-2" />
            Open Payment Portal
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};