// ABOUTME: Modal component for displaying detailed payment information with full transaction details
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Calendar, Receipt, User, Building } from "lucide-react";

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

interface PaymentDetailModalProps {
  payment: Payment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PaymentDetailModal: React.FC<PaymentDetailModalProps> = ({
  payment,
  open,
  onOpenChange,
}) => {
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

  if (!payment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Payment Details
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Payment Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status</span>
            <Badge variant="outline" className={getStatusColor(payment.status)}>
              {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
            </Badge>
          </div>

          <Separator />

          {/* Amount Details */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">Total Amount</span>
              <span className="text-lg font-bold text-primary">{formatCurrency(payment.amount)}</span>
            </div>
            
            {payment.subtotal_amount && (
              <div className="flex items-center justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatCurrency(payment.subtotal_amount)}</span>
              </div>
            )}
            
            {payment.tax_amount && payment.tax_amount > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span>Tax</span>
                <span>{formatCurrency(payment.tax_amount)}</span>
              </div>
            )}
            
            {payment.applied_credits && payment.applied_credits > 0 && (
              <div className="flex items-center justify-between text-sm text-green-600">
                <span>Credits Applied</span>
                <span>-{formatCurrency(payment.applied_credits)}</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Payment Information */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Payment Method</p>
                <p className="text-sm text-muted-foreground">
                  {payment.payment_method_type || payment.payment_method}
                  {payment.ach_bank_name && ` - ${payment.ach_bank_name}`}
                  {payment.ach_last4 && ` ****${payment.ach_last4}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Payment Date</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(payment.payment_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>

            {payment.description && (
              <div className="flex items-start gap-3">
                <Building className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Description</p>
                  <p className="text-sm text-muted-foreground">{payment.description}</p>
                </div>
              </div>
            )}
          </div>

          {/* Technical Details */}
          {(payment.stripe_invoice_id || payment.failure_reason) && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Technical Details</p>
                {payment.stripe_invoice_id && (
                  <div className="text-xs">
                    <span className="font-medium">Stripe Invoice ID:</span>
                    <span className="ml-2 font-mono bg-muted px-1 rounded">{payment.stripe_invoice_id}</span>
                  </div>
                )}
                {payment.failure_reason && (
                  <div className="text-xs text-red-600">
                    <span className="font-medium">Failure Reason:</span>
                    <span className="ml-2">{payment.failure_reason}</span>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Timestamps */}
          <Separator />
          <div className="text-xs text-muted-foreground space-y-1">
            <div>Created: {new Date(payment.created_at).toLocaleString()}</div>
            <div>Updated: {new Date(payment.updated_at).toLocaleString()}</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentDetailModal;