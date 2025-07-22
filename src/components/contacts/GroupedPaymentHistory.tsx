// ABOUTME: Component for displaying payment history grouped by membership cycles with expandable sections
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, CreditCard, Calendar, Receipt } from "lucide-react";
import PaymentDetailModal from "./PaymentDetailModal";

interface Payment {
  id: string;
  amount: number;
  payment_method?: string;
  status: string;
  description?: string;
  payment_date: string;
  stripe_invoice_id?: string;
  payment_method_type?: string;
  ach_bank_name?: string;
  ach_last4?: string;
  tax_amount?: number;
  subtotal_amount?: number;
  applied_credits?: number;
  failure_reason?: string;
  created_at: string;
  updated_at: string;
  student_id: string;
}

interface PaymentGroup {
  id: string;
  title: string;
  description: string;
  totalAmount: number;
  payments: Payment[];
  status: 'active' | 'completed' | 'cancelled';
  dateRange: {
    start: string;
    end: string;
  };
}

interface GroupedPaymentHistoryProps {
  payments: Payment[];
  onPaymentUpdated?: () => void;
}

const GroupedPaymentHistory: React.FC<GroupedPaymentHistoryProps> = ({
  payments,
  onPaymentUpdated,
}) => {
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'refunded':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const groupedPayments = useMemo(() => {
    const groups: PaymentGroup[] = [];
    const processedPayments = new Set<string>();

    // Sort payments by date
    const sortedPayments = [...payments].sort((a, b) => 
      new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
    );

    for (const payment of sortedPayments) {
      if (processedPayments.has(payment.id)) continue;

      // Extract plan name from description
      const planName = payment.description?.split(' - ')[0] || 'Unknown Plan';
      const isSubscription = payment.description?.includes('Subscription');

      if (isSubscription) {
        // Group subscription payments by plan type
        const relatedPayments = sortedPayments.filter(p => 
          p.description?.includes(planName) && 
          p.description?.includes('Subscription') &&
          !processedPayments.has(p.id)
        );

        relatedPayments.forEach(p => processedPayments.add(p.id));

        const totalAmount = relatedPayments.reduce((sum, p) => sum + p.amount, 0);
        const completedPayments = relatedPayments.filter(p => p.status === 'completed');
        const hasFailures = relatedPayments.some(p => p.status === 'failed');
        const hasRefunds = relatedPayments.some(p => p.status === 'refunded');

        let groupStatus: 'active' | 'completed' | 'cancelled' = 'active';
        if (completedPayments.length === relatedPayments.length && relatedPayments.length > 0) {
          groupStatus = 'completed';
        } else if (hasFailures || hasRefunds) {
          groupStatus = 'cancelled';
        }

        const dateRange = {
          start: relatedPayments[relatedPayments.length - 1]?.payment_date || '',
          end: relatedPayments[0]?.payment_date || ''
        };

        groups.push({
          id: `${planName}-${relatedPayments[0]?.id}`,
          title: planName,
          description: `${relatedPayments.length} payment${relatedPayments.length > 1 ? 's' : ''} • ${completedPayments.length} completed`,
          totalAmount,
          payments: relatedPayments,
          status: groupStatus,
          dateRange
        });
      } else {
        // Individual payment (not part of a subscription cycle)
        processedPayments.add(payment.id);
        
        groups.push({
          id: payment.id,
          title: planName,
          description: 'One-time payment',
          totalAmount: payment.amount,
          payments: [payment],
          status: payment.status === 'completed' ? 'completed' : payment.status === 'failed' ? 'cancelled' : 'active',
          dateRange: {
            start: payment.payment_date,
            end: payment.payment_date
          }
        });
      }
    }

    return groups;
  }, [payments]);

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const handlePaymentClick = (payment: Payment) => {
    setSelectedPayment(payment);
    setPaymentModalOpen(true);
  };

  const getGroupStatusBadge = (status: 'active' | 'completed' | 'cancelled') => {
    switch (status) {
      case 'completed':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Issues</Badge>;
      default:
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">Active</Badge>;
    }
  };

  if (groupedPayments.length === 0) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center text-muted-foreground">
            <CreditCard className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No payment history found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {groupedPayments.map((group) => (
        <Card key={group.id}>
          <Collapsible
            open={expandedGroups.has(group.id)}
            onOpenChange={() => toggleGroup(group.id)}
          >
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {expandedGroups.has(group.id) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <div>
                      <CardTitle className="text-lg">{group.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {group.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getGroupStatusBadge(group.status)}
                    <div className="text-right">
                      <p className="font-semibold text-lg">
                        {formatCurrency(group.totalAmount)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(group.dateRange.start).toLocaleDateString()} - {new Date(group.dateRange.end).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {group.payments.map((payment) => (
                    <div
                      key={payment.id}
                      onClick={() => handlePaymentClick(payment)}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{payment.description}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(payment.payment_date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className={getStatusColor(payment.status)}>
                          {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                        </Badge>
                        <span className="font-semibold">
                          {formatCurrency(payment.amount)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      ))}

      <PaymentDetailModal
        payment={selectedPayment}
        open={paymentModalOpen}
        onOpenChange={setPaymentModalOpen}
        onPaymentUpdated={onPaymentUpdated}
      />
    </div>
  );
};

export default GroupedPaymentHistory;