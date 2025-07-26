// ABOUTME: Modal component for displaying detailed payment information with full transaction details, refund functionality, and scheduled payment management
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CreditCard, Calendar, Receipt, User, Building, RefreshCw, AlertTriangle, Edit, X, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  onPaymentUpdated?: () => void;
}

const PaymentDetailModal: React.FC<PaymentDetailModalProps> = ({
  payment,
  open,
  onOpenChange,
  onPaymentUpdated,
}) => {
  const [showRefundForm, setShowRefundForm] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editAmount, setEditAmount] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDate, setEditDate] = useState('');
  const [isProcessingEdit, setIsProcessingEdit] = useState(false);
  const [isProcessingCancel, setIsProcessingCancel] = useState(false);
  const { toast } = useToast();
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

  const handleRefund = async () => {
    if (!payment || !refundAmount) return;

    const refundAmountCents = Math.round(parseFloat(refundAmount) * 100);
    
    if (refundAmountCents <= 0 || refundAmountCents > payment.amount) {
      toast({
        title: "Invalid Amount",
        description: `Refund amount must be between $0.01 and ${formatCurrency(payment.amount)}`,
        variant: "destructive",
      });
      return;
    }

    setIsProcessingRefund(true);
    try {
      const isFullRefund = refundAmountCents === payment.amount;
      
      const { data, error } = await supabase.functions.invoke('process-refund', {
        body: {
          payment_id: payment.id,
          amount: refundAmountCents,
          reason: refundReason || 'Refund requested',
          refund_type: isFullRefund ? 'full' : 'partial',
          processed_by: (await supabase.auth.getUser()).data.user?.id,
        },
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Refund Processed",
        description: `Successfully processed ${formatCurrency(refundAmountCents)} refund`,
      });

      // Reset form
      setShowRefundForm(false);
      setRefundAmount('');
      setRefundReason('');
      
      // Refresh payment data
      if (onPaymentUpdated) {
        onPaymentUpdated();
      }
      
      // Close modal
      onOpenChange(false);
    } catch (error) {
      console.error('Error processing refund:', error);
      toast({
        title: "Refund Failed",
        description: "Failed to process refund. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingRefund(false);
    }
  };

  const handleCancelScheduledPayment = async () => {
    if (!payment) return;

    setIsProcessingCancel(true);
    try {
      const { error } = await supabase
        .from('payments')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', payment.id);

      if (error) throw error;

      toast({
        title: "Payment Cancelled",
        description: "Scheduled payment has been cancelled successfully",
      });

      if (onPaymentUpdated) {
        onPaymentUpdated();
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Error cancelling payment:', error);
      toast({
        title: "Cancellation Failed",
        description: "Failed to cancel scheduled payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingCancel(false);
    }
  };

  const handleEditScheduledPayment = async () => {
    if (!payment || !editAmount || !editDate) return;

    const editAmountCents = Math.round(parseFloat(editAmount) * 100);
    
    if (editAmountCents <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Amount must be greater than $0.00",
        variant: "destructive",
      });
      return;
    }

    setIsProcessingEdit(true);
    try {
      const { error } = await supabase
        .from('payments')
        .update({
          amount: editAmountCents,
          description: editDescription || payment.description,
          payment_date: editDate,
          updated_at: new Date().toISOString()
        })
        .eq('id', payment.id);

      if (error) throw error;

      toast({
        title: "Payment Updated",
        description: "Scheduled payment has been updated successfully",
      });

      setShowEditForm(false);
      setEditAmount('');
      setEditDescription('');
      setEditDate('');

      if (onPaymentUpdated) {
        onPaymentUpdated();
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating payment:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update scheduled payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingEdit(false);
    }
  };

  const startEditScheduledPayment = () => {
    setEditAmount((payment.amount / 100).toString());
    setEditDescription(payment.description || '');
    setEditDate(payment.payment_date.split('T')[0]); // Extract date part
    setShowEditForm(true);
  };

  const canRefund = payment?.status === 'completed' && payment.stripe_invoice_id;
  const canCancelOrEdit = payment?.status === 'pending' || payment?.status === 'scheduled';

  if (!payment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Payment Details
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 max-h-[70vh] px-1">
          <div className="space-y-4 pr-3">
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

          {/* Refund Section */}
          {showRefundForm && (
            <>
              <Separator />
              <div className="space-y-4 p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">Process Refund</span>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="refund-amount">Refund Amount</Label>
                    <Input
                      id="refund-amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={payment.amount / 100}
                      placeholder="0.00"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Maximum refundable: {formatCurrency(payment.amount)}
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="refund-reason">Reason (Optional)</Label>
                    <Textarea
                      id="refund-reason"
                      placeholder="Enter reason for refund..."
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRefundForm(false)}
                    disabled={isProcessingRefund}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleRefund}
                    disabled={isProcessingRefund || !refundAmount}
                  >
                    {isProcessingRefund ? "Processing..." : "Process Refund"}
                  </Button>
                </div>
              </div>
            </>
           )}

          {/* Edit Scheduled Payment Section */}
          {showEditForm && (
            <>
              <Separator />
              <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 text-blue-800">
                  <Edit className="h-4 w-4" />
                  <span className="font-medium">Edit Scheduled Payment</span>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="edit-amount">Amount</Label>
                    <Input
                      id="edit-amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-date">Scheduled Date</Label>
                    <Input
                      id="edit-date"
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-description">Description (Optional)</Label>
                    <Textarea
                      id="edit-description"
                      placeholder="Enter payment description..."
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowEditForm(false)}
                    disabled={isProcessingEdit}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleEditScheduledPayment}
                    disabled={isProcessingEdit || !editAmount || !editDate}
                  >
                    {isProcessingEdit ? "Updating..." : "Update Payment"}
                  </Button>
                </div>
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
        </ScrollArea>

        {/* Footer with Actions */}
        {canRefund && !showRefundForm && !showEditForm && (
          <DialogFooter className="border-t pt-4">
            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                onClick={() => {
                  setRefundAmount((payment.amount / 100).toString());
                  setShowRefundForm(true);
                }}
                className="flex-1"
                disabled={isProcessingRefund}
              >
                Full Refund
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowRefundForm(true)}
                className="flex-1"
                disabled={isProcessingRefund}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Partial Refund
              </Button>
            </div>
          </DialogFooter>
        )}

        {/* Scheduled Payment Actions */}
        {canCancelOrEdit && !showRefundForm && !showEditForm && (
          <DialogFooter className="border-t pt-4">
            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                onClick={startEditScheduledPayment}
                className="flex-1"
                disabled={isProcessingEdit || isProcessingCancel}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Payment
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancelScheduledPayment}
                className="flex-1"
                disabled={isProcessingEdit || isProcessingCancel}
              >
                <X className="h-4 w-4 mr-2" />
                {isProcessingCancel ? "Cancelling..." : "Cancel Payment"}
              </Button>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PaymentDetailModal;