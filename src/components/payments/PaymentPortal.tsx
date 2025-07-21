import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Receipt, AlertCircle, Calendar, DollarSign } from 'lucide-react';
import { EnhancedACHSetupForm } from './EnhancedACHSetupForm';
import { InstallmentPlanForm } from './InstallmentPlanForm';
import { InstallmentPlanManagement } from './InstallmentPlanManagement';

interface PaymentPortalProps {
  userId?: string;
}

export const PaymentPortal = ({ userId }: PaymentPortalProps) => {
  const [subscription, setSubscription] = useState<any>(null);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPaymentData();
  }, [userId]);

  const loadPaymentData = async () => {
    try {
      setLoading(true);

      // Load subscription data
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId || (await supabase.auth.getUser()).data.user?.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      setSubscription(subData);

      // Load payment history
      const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .eq('student_id', userId || (await supabase.auth.getUser()).data.user?.id)
        .order('payment_date', { ascending: false })
        .limit(10);

      setPaymentHistory(payments || []);
    } catch (error) {
      console.error('Error loading payment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCustomerPortal = async () => {
    try {
      setPortalLoading(true);
      
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        body: { returnUrl: window.location.href }
      });

      if (error) throw error;

      // Open portal in new tab
      window.open(data.url, '_blank');
      
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Error",
        description: "Failed to open payment portal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPortalLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'canceled':
        return 'bg-red-100 text-red-800';
      case 'trialing':
        return 'bg-blue-100 text-blue-800';
      case 'incomplete':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="installments">Payment Plans</TabsTrigger>
          <TabsTrigger value="manage">Manage Plans</TabsTrigger>
          <TabsTrigger value="ach">Bank Transfer</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Subscription Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Subscription Status
              </CardTitle>
              <CardDescription>
                Manage your membership and billing information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {subscription ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Status</span>
                    <Badge className={getStatusColor(subscription.status)}>
                      {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                    </Badge>
                  </div>

                  {subscription.current_period_end && (
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Next Billing Date</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(subscription.current_period_end).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {subscription.cancel_at_period_end && (
                    <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm text-yellow-700">
                        Your subscription will cancel at the end of the current billing period.
                      </span>
                    </div>
                  )}

                  <Separator />

                  <Button 
                    onClick={openCustomerPortal} 
                    disabled={portalLoading}
                    className="w-full"
                  >
                    {portalLoading ? "Opening Portal..." : "Manage Subscription & Billing"}
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground mb-4">No active subscription found</p>
                  <Button onClick={() => window.location.href = '/subscription'}>
                    View Subscription Plans
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Manage your payments and billing preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => window.location.href = '/subscription'}
              >
                <Calendar className="h-4 w-4 mr-2" />
                View Available Plans
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={openCustomerPortal}
                disabled={portalLoading}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Update Payment Method
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="installments">
          <InstallmentPlanForm />
        </TabsContent>

        <TabsContent value="manage">
          <InstallmentPlanManagement />
        </TabsContent>

        <TabsContent value="ach">
          <EnhancedACHSetupForm />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          {/* Payment History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Payment History
              </CardTitle>
              <CardDescription>
                Your complete payment history
              </CardDescription>
            </CardHeader>
            <CardContent>
              {paymentHistory.length > 0 ? (
                <div className="space-y-3">
                  {paymentHistory.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          payment.status === 'completed' ? 'bg-green-100' :
                          payment.status === 'failed' ? 'bg-red-100' : 'bg-yellow-100'
                        }`}>
                          <DollarSign className={`h-4 w-4 ${
                            payment.status === 'completed' ? 'text-green-600' :
                            payment.status === 'failed' ? 'text-red-600' : 'text-yellow-600'
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium">{formatCurrency(payment.amount)}</p>
                          <p className="text-sm text-muted-foreground">
                            {payment.description || 'Membership payment'}
                          </p>
                          {payment.payment_method_type && (
                            <p className="text-xs text-muted-foreground">
                              via {payment.payment_method_type === 'ach' ? 'Bank Transfer' : 'Credit Card'}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <Badge variant={payment.status === 'completed' ? 'default' : 'destructive'}>
                          {payment.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(payment.payment_date).toLocaleDateString()}
                        </p>
                        {payment.installment_number && (
                          <p className="text-xs text-muted-foreground">
                            {payment.installment_number}/{payment.total_installments}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">No payment history found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};