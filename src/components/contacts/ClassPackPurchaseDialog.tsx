import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PaymentMethodManager } from '@/components/payments/PaymentMethodManager';
import { Package, Calendar, Clock, Loader2, CreditCard, Building2, DollarSign } from 'lucide-react';

interface MembershipPlan {
  id: string;
  name: string;
  description: string;
  base_price_cents: number;
  class_pack_size: number;
  pack_expiry_days: number;
  is_active: boolean;
}

interface PaymentMethod {
  id: string;
  contact_id: string;
  stripe_payment_method_id: string;
  type: string;
  last4?: string;
  brand?: string;
  bank_name?: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
}

interface ClassPackPurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId: string;
  onPurchaseComplete?: () => void;
}

export const ClassPackPurchaseDialog = ({
  open,
  onOpenChange,
  contactId,
  onPurchaseComplete
}: ClassPackPurchaseDialogProps) => {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [step, setStep] = useState<'plan' | 'payment' | 'summary'>('plan');
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchClassPackPlans();
      fetchPaymentMethods();
    }
  }, [open]);

  const fetchClassPackPlans = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('membership_plans')
        .select('*')
        .eq('is_class_pack', true)
        .eq('is_active', true)
        .order('base_price_cents', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching class pack plans:', error);
      toast({
        title: "Error",
        description: "Failed to load class pack plans",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('contact_id', contactId)
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPaymentMethods(data || []);
      // Auto-select the default payment method if it exists
      const defaultMethod = data?.find(method => method.is_default);
      if (defaultMethod) {
        setSelectedPaymentMethod(defaultMethod.stripe_payment_method_id);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    }
  };

  const handlePurchase = async () => {
    if (!selectedPlan || !selectedPaymentMethod) return;

    try {
      setPurchasing(true);
      const plan = plans.find(p => p.id === selectedPlan);
      if (!plan) throw new Error("Selected plan not found");

      // Process payment directly using process-direct-payment
      const { data, error } = await supabase.functions.invoke('process-direct-payment', {
        body: {
          contactId,
          paymentMethodId: selectedPaymentMethod,
          amountCents: plan.base_price_cents,
          description: `Class Pack: ${plan.name}`,
          scheduleType: 'immediate'
        }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Payment failed');

      // Create class pack record
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + plan.pack_expiry_days);

      const { error: packError } = await supabase
        .from('class_packs')
        .insert({
          profile_id: contactId,
          membership_plan_id: selectedPlan,
          total_classes: plan.class_pack_size,
          remaining_classes: plan.class_pack_size,
          expiry_date: expiryDate.toISOString().split('T')[0],
          status: 'active'
        });

      if (packError) throw packError;

      toast({
        title: "Success",
        description: "Class pack purchased successfully!",
      });

      onOpenChange(false);
      if (onPurchaseComplete) {
        onPurchaseComplete();
      }
      
      // Reset form
      setSelectedPlan('');
      setSelectedPaymentMethod('');
      setStep('plan');
      
    } catch (error) {
      console.error('Error purchasing class pack:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to purchase class pack",
        variant: "destructive",
      });
    } finally {
      setPurchasing(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const getPaymentMethodDisplay = (method: PaymentMethod) => {
    if (method.type === 'card') {
      return `${method.brand || 'Card'} ****${method.last4}`;
    } else if (method.type === 'us_bank_account') {
      return `${method.bank_name || 'Bank'} ****${method.last4}`;
    }
    return `${method.type} ****${method.last4}`;
  };

  const getPaymentMethodIcon = (type: string) => {
    switch (type) {
      case 'card':
        return <CreditCard className="h-4 w-4" />;
      case 'us_bank_account':
        return <Building2 className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const selectedPlanData = plans.find(p => p.id === selectedPlan);
  const selectedPaymentData = paymentMethods.find(p => p.stripe_payment_method_id === selectedPaymentMethod);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Purchase Class Pack
          </DialogTitle>
          <DialogDescription>
            {step === 'plan' && "Choose a class pack plan to purchase"}
            {step === 'payment' && "Select your payment method"}
            {step === 'summary' && "Review and confirm your purchase"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: Plan Selection */}
          {step === 'plan' && (
            <>
              {loading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading class pack plans...</p>
                </div>
              ) : plans.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No class pack plans available</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Contact an admin to create class pack plans.
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    <Label>Select a Class Pack</Label>
                    <RadioGroup value={selectedPlan} onValueChange={setSelectedPlan}>
                      {plans.map((plan) => (
                        <div key={plan.id} className="flex items-center space-x-2">
                          <RadioGroupItem value={plan.id} id={plan.id} />
                          <Label htmlFor={plan.id} className="flex-1 cursor-pointer">
                            <Card className="p-4">
                              <CardContent className="p-0">
                                <div className="flex items-start justify-between">
                                  <div className="space-y-2 flex-1">
                                    <div className="flex items-center gap-2">
                                      <h3 className="font-semibold">{plan.name}</h3>
                                      <Badge variant="outline" className="text-xs">
                                        Class Pack
                                      </Badge>
                                    </div>
                                    
                                    {plan.description && (
                                      <p className="text-sm text-muted-foreground">
                                        {plan.description}
                                      </p>
                                    )}

                                    <div className="flex gap-4 text-sm text-muted-foreground">
                                      <div className="flex items-center gap-1">
                                        <Package className="h-3 w-3" />
                                        <span>{plan.class_pack_size} classes</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        <span>{plan.pack_expiry_days} days to use</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="text-right">
                                    <div className="text-2xl font-bold">
                                      {formatCurrency(plan.base_price_cents)}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {formatCurrency(Math.round(plan.base_price_cents / plan.class_pack_size))} per class
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => onOpenChange(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={() => setStep('payment')}
                      disabled={!selectedPlan}
                      className="flex-1"
                    >
                      Continue to Payment
                    </Button>
                  </div>
                </>
              )}
            </>
          )}

          {/* Step 2: Payment Method Selection */}
          {step === 'payment' && (
            <>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setStep('plan')}>
                    ← Back to Plans
                  </Button>
                </div>

                {paymentMethods.length === 0 ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      No payment methods found. Add a payment method to continue.
                    </p>
                    <PaymentMethodManager 
                      contactId={contactId}
                      onPaymentMethodSelected={(method) => {
                        setSelectedPaymentMethod(method.stripe_payment_method_id);
                        fetchPaymentMethods();
                      }}
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Label>Select Payment Method</Label>
                    <RadioGroup value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                      {paymentMethods.map((method) => (
                        <div key={method.id} className="flex items-center space-x-2">
                          <RadioGroupItem value={method.stripe_payment_method_id} id={method.id} />
                          <Label htmlFor={method.id} className="flex-1 cursor-pointer">
                            <Card className="p-3">
                              <CardContent className="p-0">
                                <div className="flex items-center gap-3">
                                  {getPaymentMethodIcon(method.type)}
                                  <div className="flex-1">
                                    <div className="font-medium">
                                      {getPaymentMethodDisplay(method)}
                                    </div>
                                    {method.is_default && (
                                      <div className="text-xs text-primary">Default</div>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                )}
              </div>

              {selectedPaymentMethod && (
                <div className="flex gap-3 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setStep('plan')}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={() => setStep('summary')}
                    className="flex-1"
                  >
                    Continue to Summary
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Step 3: Summary and Purchase */}
          {step === 'summary' && selectedPlanData && selectedPaymentData && (
            <>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setStep('payment')}>
                    ← Back to Payment
                  </Button>
                </div>

                <div className="space-y-4">
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-3">Order Summary</h3>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Class Pack:</span>
                          <span className="font-medium">{selectedPlanData.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Classes:</span>
                          <span>{selectedPlanData.class_pack_size}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Valid for:</span>
                          <span>{selectedPlanData.pack_expiry_days} days</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-lg font-semibold">
                          <span>Total:</span>
                          <span>{formatCurrency(selectedPlanData.base_price_cents)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-3">Payment Method</h3>
                      <div className="flex items-center gap-3">
                        {getPaymentMethodIcon(selectedPaymentData.type)}
                        <span>{getPaymentMethodDisplay(selectedPaymentData)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setStep('payment')}
                  disabled={purchasing}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button 
                  onClick={handlePurchase}
                  disabled={purchasing}
                  className="flex-1"
                >
                  {purchasing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <DollarSign className="h-4 w-4 mr-2" />
                      Complete Purchase
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};