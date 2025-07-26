import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, DollarSign, Calendar, Users, Percent, User, Clock, Star, Building2 } from "lucide-react";
import { PaymentMethodManager } from "@/components/payments/PaymentMethodManager";

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  membership_status: string;
  parent_id?: string;
}

interface MembershipPlan {
  id: string;
  name: string;
  description: string;
  base_price_cents: number;
  billing_cycle: string;
  classes_per_week: number;
  is_unlimited: boolean;
  trial_days: number;
  setup_fee_cents: number;
}

interface DiscountType {
  id: string;
  name: string;
  description: string;
  discount_type: string;
  discount_value: number;
  applies_to: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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

interface EnhancedAssignMembershipDialogProps {
  contact: Contact | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const EnhancedAssignMembershipDialog = ({ 
  contact, 
  open, 
  onOpenChange, 
  onSuccess 
}: EnhancedAssignMembershipDialogProps) => {
  const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>([]);
  const [discountTypes, setDiscountTypes] = useState<DiscountType[]>([]);
  const [familyMembers, setFamilyMembers] = useState<Contact[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [selectedDiscount, setSelectedDiscount] = useState<string>("none");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");
  const [billingContact, setBillingContact] = useState<string>("");
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [scheduledPaymentDate, setScheduledPaymentDate] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<'manual' | 'integrated' | 'scheduled'>('integrated');
  const [manualPaymentAmount, setManualPaymentAmount] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [waiveSetupFee, setWaiveSetupFee] = useState(false);
  const [customSetupFee, setCustomSetupFee] = useState<string>("");
  const [showAddPaymentMethod, setShowAddPaymentMethod] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    if (open && contact) {
      fetchData();
      fetchPaymentMethods();
      setBillingContact(contact.id); // Default to the contact themselves
    }
  }, [open, contact]);

  const fetchData = async () => {
    try {
      // Fetch membership plans
      const { data: plans, error: plansError } = await supabase
        .from('membership_plans')
        .select('*')
        .eq('is_active', true)
        .order('base_price_cents', { ascending: true });

      if (plansError) throw plansError;
      setMembershipPlans(plans || []);

      // Fetch discount types
      const { data: discounts, error: discountsError } = await supabase
        .from('discount_types')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (discountsError) throw discountsError;
      setDiscountTypes(discounts || []);

      // Fetch family members (including parents and children)
      if (contact) {
        // Build family query dynamically to avoid null UUID issues
        let familyQuery = `id.eq.${contact.id},parent_id.eq.${contact.id}`;
        if (contact.parent_id) {
          familyQuery += `,id.eq.${contact.parent_id}`;
        }
        
        const { data: family, error: familyError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email, parent_id, membership_status')
          .or(familyQuery);

        if (familyError) throw familyError;
        setFamilyMembers(family || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load membership data",
        variant: "destructive",
      });
    }
  };

  const fetchPaymentMethods = async () => {
    if (!contact) return;

    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('contact_id', contact.id)
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPaymentMethods(data || []);
      // Auto-select the default payment method if it exists
      const defaultMethod = data?.find(method => method.is_default);
      if (defaultMethod) {
        setSelectedPaymentMethod(defaultMethod.id);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    }
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

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const calculateDiscountedPrice = () => {
    const plan = membershipPlans.find(p => p.id === selectedPlan);
    const discount = discountTypes.find(d => d.id === selectedDiscount && selectedDiscount !== "none");
    
    if (!plan) return 0;

    let discountedPrice = plan.base_price_cents;
    
    if (discount) {
      if (discount.discount_type === 'percentage') {
        const discountAmount = (plan.base_price_cents * discount.discount_value) / 100;
        discountedPrice -= discountAmount;
      } else if (discount.discount_type === 'fixed_amount') {
        discountedPrice -= discount.discount_value * 100; // Convert to cents
      }
    }

    return Math.max(0, discountedPrice);
  };

  const calculateSetupFee = () => {
    if (!selectedPlanData) return 0;
    
    // If setup fee is waived, return 0
    if (waiveSetupFee) return 0;
    
    // If there's a custom setup fee, use that
    if (customSetupFee && parseFloat(customSetupFee) > 0) {
      return parseFloat(customSetupFee) * 100; // Convert to cents
    }
    
    // Otherwise use the plan's default setup fee
    return selectedPlanData.setup_fee_cents;
  };

  const handleCreateMembership = async () => {
    if (!contact || !selectedPlan) return;

    try {
      setLoading(true);
      
      const plan = membershipPlans.find(p => p.id === selectedPlan);
      if (!plan) throw new Error("Selected plan not found");

      const finalPrice = calculateDiscountedPrice();
      
      // Create membership subscription record
      const selectedDiscountData = discountTypes.find(discount => discount.id === selectedDiscount && selectedDiscount !== "none");
      
      const membershipData = {
        profile_id: contact.id,
        membership_plan_id: selectedPlan,
        status: paymentMethod === 'manual' && manualPaymentAmount ? 'active' : 'active',
        start_date: startDate,
        billing_amount_cents: finalPrice,
        notes: notes,
        next_billing_date: paymentMethod === 'scheduled' ? scheduledPaymentDate : null,
        discount_percentage: selectedDiscountData && selectedDiscountData.discount_type === 'percentage' ? selectedDiscountData.discount_value : null,
      };

      const { data: membership, error: membershipError } = await supabase
        .from('membership_subscriptions')
        .insert([membershipData])
        .select()
        .single();

      if (membershipError) throw membershipError;

      // Apply discount if selected (and not "none")
      if (selectedDiscount && selectedDiscount !== "none") {
        await supabase
          .from('contact_discounts')
          .insert([{
            contact_id: contact.id,
            discount_type_id: selectedDiscount,
            status: 'active',
            assigned_by: (await supabase.auth.getUser()).data.user?.id,
            notes: `Applied to membership: ${plan.name}`
          }]);
      }

      // Handle different payment methods
      if (paymentMethod === 'manual' && manualPaymentAmount) {
        // Record manual payment - using billing_cycles table instead
        await supabase
          .from('billing_cycles')
          .insert([{
            membership_subscription_id: membership.id,
            cycle_start_date: startDate,
            cycle_end_date: new Date(new Date(startDate).setMonth(new Date(startDate).getMonth() + 1)).toISOString().split('T')[0],
            amount_cents: parseFloat(manualPaymentAmount) * 100,
            total_amount_cents: parseFloat(manualPaymentAmount) * 100,
            due_date: startDate,
            paid_date: new Date().toISOString().split('T')[0],
            status: 'paid',
            payment_method: 'cash'
          }]);

        // Update membership to active
        await supabase
          .from('membership_subscriptions')
          .update({ status: 'active' })
          .eq('id', membership.id);

        toast({
          title: "Membership Created",
          description: `Manual payment recorded and membership activated for ${contact.first_name}`,
        });
      } else if (paymentMethod === 'integrated') {
        // Check if payment method is selected
        if (!selectedPaymentMethod) {
          toast({
            title: "Payment Method Required",
            description: "Please select a payment method to charge",
            variant: "destructive",
          });
          return;
        }

        // Get the selected payment method details to get the Stripe payment method ID
        const selectedMethod = paymentMethods.find(pm => pm.id === selectedPaymentMethod);
        if (!selectedMethod) {
          toast({
            title: "Payment Method Error",
            description: "Selected payment method not found",
            variant: "destructive",
          });
          return;
        }

        // Use process-direct-payment function with Stripe payment method ID
        const { data: chargeData, error: chargeError } = await supabase.functions.invoke('process-direct-payment', {
          body: { 
            contactId: contact.id,
            paymentMethodId: selectedMethod.stripe_payment_method_id, // Use Stripe PM ID, not database ID
            amountCents: finalPrice + calculateSetupFee(),
            description: `Membership: ${plan.name}`,
            scheduleType: 'immediate'
          },
        });

        console.log('Charge response:', { chargeData, chargeError });

        if (chargeError) {
          throw chargeError;
        }

        if (chargeData?.success) {
          toast({
            title: "Payment Successful",
            description: `Membership activated for ${contact.first_name}. Payment processed successfully.`,
          });
        } else {
          throw new Error(chargeData?.error || 'Payment failed');
        }
      } else if (paymentMethod === 'scheduled') {
        toast({
          title: "Membership Scheduled",
          description: `Membership created with payment scheduled for ${scheduledPaymentDate}`,
        });
      } else {
        toast({
          title: "Membership Draft Created",
          description: `Draft membership saved for ${contact.first_name}. Activate when ready.`,
        });
      }

      onSuccess();
      onOpenChange(false);
      resetForm();
      
    } catch (error) {
      console.error('Error creating membership:', error);
      toast({
        title: "Error",
        description: "Failed to create membership",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedPlan("");
    setSelectedDiscount("none");
    setSelectedPaymentMethod("");
    setBillingContact(contact?.id || "");
    setStartDate(new Date().toISOString().split('T')[0]);
    setScheduledPaymentDate("");
    setPaymentMethod('integrated');
    setManualPaymentAmount("");
    setNotes("");
    setIsActive(true);
    setWaiveSetupFee(false);
    setCustomSetupFee("");
    setShowAddPaymentMethod(false);
  };

  const selectedPlanData = membershipPlans.find(plan => plan.id === selectedPlan);
  const selectedDiscountData = discountTypes.find(discount => discount.id === selectedDiscount && selectedDiscount !== "none");
  const billingContactData = familyMembers.find(member => member.id === billingContact);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Enhanced Membership Assignment
          </DialogTitle>
          <DialogDescription>
            {contact && `Create a comprehensive membership for ${contact.first_name} ${contact.last_name}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Contact Information */}
          {contact && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Name:</span> {contact.first_name} {contact.last_name}
                  </div>
                  <div>
                    <span className="font-medium">Email:</span> {contact.email}
                  </div>
                  <div>
                    <span className="font-medium">Current Status:</span>
                    <Badge className="ml-2" variant={contact.membership_status === 'active' ? 'default' : 'secondary'}>
                      {contact.membership_status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Membership Plan Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Membership Plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="membership-plan">Select Plan</Label>
                <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Choose a membership plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {membershipPlans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        <div className="flex justify-between items-center w-full">
                          <span>{plan.name}</span>
                          <span className="ml-4 font-medium">
                            {formatPrice(plan.base_price_cents)}/{plan.billing_cycle}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div className="flex items-center space-x-2 mt-6">
                  <Switch
                    id="is-active"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                  <Label htmlFor="is-active">Activate immediately</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Discount Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Percent className="h-5 w-5" />
                Discounts (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="discount">Apply Discount</Label>
                <Select value={selectedDiscount} onValueChange={setSelectedDiscount}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select a discount (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No discount</SelectItem>
                    {discountTypes.map((discount) => (
                      <SelectItem key={discount.id} value={discount.id}>
                        <div className="flex justify-between items-center w-full">
                          <span>{discount.name}</span>
                          <span className="ml-4 font-medium">
                            {discount.discount_type === 'percentage' 
                              ? `${discount.discount_value}%` 
                              : discount.discount_type === 'fixed_amount'
                              ? formatPrice(discount.discount_value * 100)
                              : discount.discount_value}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Setup Fee Management */}
          {selectedPlanData && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Setup Fee Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedPlanData.setup_fee_cents > 0 ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>Default Setup Fee:</span>
                      <span className="font-medium">{formatPrice(selectedPlanData.setup_fee_cents)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="waive-setup-fee"
                        checked={waiveSetupFee}
                        onCheckedChange={setWaiveSetupFee}
                      />
                      <Label htmlFor="waive-setup-fee">Waive setup fee</Label>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">No setup fee configured for this plan.</p>
                    <div>
                      <Label htmlFor="custom-setup-fee">Add Custom Setup Fee (Optional)</Label>
                      <Input
                        id="custom-setup-fee"
                        type="number"
                        placeholder="0.00"
                        value={customSetupFee}
                        onChange={(e) => setCustomSetupFee(e.target.value)}
                        className="mt-2"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Family/Billing Assignment */}
          {familyMembers.length > 1 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Family & Billing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="billing-contact">Billing Contact</Label>
                  <Select value={billingContact} onValueChange={setBillingContact}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select who will be billed" />
                    </SelectTrigger>
                    <SelectContent>
                      {familyMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.first_name} {member.last_name}
                          {member.id === contact?.id ? " (Self)" : ""}
                          {member.id === contact?.parent_id ? " (Parent)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Options */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Payment Type</Label>
                <Select value={paymentMethod} onValueChange={(value: 'manual' | 'integrated' | 'scheduled') => setPaymentMethod(value)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="integrated">Stored Payment Methods</SelectItem>
                    <SelectItem value="manual">Manual Payment (Cash/Check)</SelectItem>
                    <SelectItem value="scheduled">Schedule Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {paymentMethod === 'integrated' && (
                <div className="space-y-4">
                  {paymentMethods.length === 0 ? (
                    <div className="text-center py-4 border rounded-lg">
                      <p className="text-muted-foreground mb-4">No payment methods saved</p>
                      <Button 
                        onClick={() => setShowAddPaymentMethod(true)}
                        variant="outline"
                      >
                        Add Payment Method
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <Label htmlFor="payment-method-select">Select Payment Method</Label>
                      <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Choose a payment method" />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentMethods.map((method) => (
                            <SelectItem key={method.id} value={method.id}>
                              <div className="flex items-center gap-2">
                                {getPaymentMethodIcon(method.type)}
                                <span>{getPaymentMethodDisplay(method)}</span>
                                {method.is_default && (
                                  <Badge variant="secondary" className="ml-2">
                                    <Star className="h-3 w-3 mr-1" />
                                    Default
                                  </Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="mt-2">
                        <Button 
                          onClick={() => setShowAddPaymentMethod(true)}
                          variant="outline"
                          size="sm"
                        >
                          Add Another Payment Method
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {paymentMethod === 'manual' && (
                <div>
                  <Label htmlFor="manual-amount">Payment Amount</Label>
                  <Input
                    id="manual-amount"
                    type="number"
                    placeholder="0.00"
                    value={manualPaymentAmount}
                    onChange={(e) => setManualPaymentAmount(e.target.value)}
                    className="mt-2"
                  />
                </div>
              )}

              {paymentMethod === 'scheduled' && (
                <div>
                  <Label htmlFor="scheduled-date">Scheduled Payment Date</Label>
                  <Input
                    id="scheduled-date"
                    type="date"
                    value={scheduledPaymentDate}
                    onChange={(e) => setScheduledPaymentDate(e.target.value)}
                    className="mt-2"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Price Summary */}
          {selectedPlanData && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Price Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Base Price:</span>
                  <span>{formatPrice(selectedPlanData.base_price_cents)}</span>
                </div>
                {selectedDiscountData && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({selectedDiscountData.name}):</span>
                    <span>-{formatPrice(selectedPlanData.base_price_cents - calculateDiscountedPrice())}</span>
                  </div>
                )}
                {(selectedPlanData.setup_fee_cents > 0 || customSetupFee) && (
                  <div className="flex justify-between">
                    <span>Setup Fee:</span>
                    <span className={waiveSetupFee ? 'line-through text-muted-foreground' : ''}>
                      {formatPrice(calculateSetupFee())}
                    </span>
                  </div>
                )}
                {waiveSetupFee && selectedPlanData.setup_fee_cents > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Setup Fee Waived:</span>
                    <span>-{formatPrice(selectedPlanData.setup_fee_cents)}</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>Total:</span>
                  <span>{formatPrice(calculateDiscountedPrice() + calculateSetupFee())}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Add any notes about this membership..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateMembership} 
            disabled={loading || !selectedPlan || (paymentMethod === 'manual' && !manualPaymentAmount) || (paymentMethod === 'scheduled' && !scheduledPaymentDate) || (paymentMethod === 'integrated' && !selectedPaymentMethod)}
            className="min-w-[180px]"
          >
            {loading ? "Processing..." : 
             paymentMethod === 'integrated' ? "Charge Payment Method" : 
             paymentMethod === 'manual' ? "Record Manual Payment" :
             paymentMethod === 'scheduled' ? "Schedule Payment" :
             "Create Membership"}
          </Button>
        </div>

        {/* Add Payment Method Dialog */}
        {showAddPaymentMethod && contact && (
          <Dialog open={showAddPaymentMethod} onOpenChange={setShowAddPaymentMethod}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Payment Method</DialogTitle>
                <DialogDescription>
                  Add a new payment method for {contact.first_name} {contact.last_name}
                </DialogDescription>
              </DialogHeader>
              <PaymentMethodManager 
                contactId={contact.id}
                showAddButton={false}
                onPaymentMethodSelected={() => {
                  setShowAddPaymentMethod(false);
                  fetchPaymentMethods();
                }}
              />
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setShowAddPaymentMethod(false)}>
                  Done
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
};