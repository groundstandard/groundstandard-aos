import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import { useMembershipSubscription } from "@/hooks/useMembershipSubscription";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, DollarSign, Calendar, Users } from "lucide-react";

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  membership_status: string;
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

interface AssignMembershipDialogProps {
  contact: Contact | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const AssignMembershipDialog = ({ contact, open, onOpenChange, onSuccess }: AssignMembershipDialogProps) => {
  const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { createCheckout } = useMembershipSubscription();

  useEffect(() => {
    if (open) {
      fetchMembershipPlans();
    }
  }, [open]);

  const fetchMembershipPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('membership_plans')
        .select('*')
        .eq('is_active', true)
        .order('base_price_cents', { ascending: true });

      if (error) throw error;
      setMembershipPlans(data || []);
    } catch (error) {
      console.error('Error fetching membership plans:', error);
      toast({
        title: "Error",
        description: "Failed to load membership plans",
        variant: "destructive",
      });
    }
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const handleAssignMembership = async () => {
    if (!contact || !selectedPlan) return;

    try {
      setLoading(true);
      
      // Create checkout session for the selected plan
      const checkoutUrl = await createCheckout(selectedPlan);
      
      if (checkoutUrl) {
        // Update contact's membership status to pending payment
        await supabase
          .from('profiles')
          .update({ 
            membership_status: 'pending_payment',
            // Store the selected plan for reference
            membership_plan_id: selectedPlan 
          })
          .eq('id', contact.id);

        toast({
          title: "Payment Processing",
          description: `Redirecting ${contact.first_name} to payment for their membership...`,
        });

        // Open checkout in new tab
        window.open(checkoutUrl, '_blank');
        
        onSuccess();
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error assigning membership:', error);
      toast({
        title: "Error",
        description: "Failed to process membership assignment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedPlanData = membershipPlans.find(plan => plan.id === selectedPlan);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Assign Membership
          </DialogTitle>
          <DialogDescription>
            {contact && `Assign a membership plan to ${contact.first_name} ${contact.last_name}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {contact && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Contact Information</CardTitle>
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

          <div>
            <Label htmlFor="membership-plan">Select Membership Plan</Label>
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

          {selectedPlanData && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Plan Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Price:</span> {formatPrice(selectedPlanData.base_price_cents)}
                  </div>
                  <div>
                    <span className="font-medium">Billing:</span> {selectedPlanData.billing_cycle}
                  </div>
                  <div>
                    <span className="font-medium">Classes:</span> 
                    {selectedPlanData.is_unlimited ? ' Unlimited' : ` ${selectedPlanData.classes_per_week}/week`}
                  </div>
                  {selectedPlanData.setup_fee_cents > 0 && (
                    <div>
                      <span className="font-medium">Setup Fee:</span> {formatPrice(selectedPlanData.setup_fee_cents)}
                    </div>
                  )}
                </div>
                {selectedPlanData.trial_days > 0 && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <Calendar className="h-4 w-4" />
                    {selectedPlanData.trial_days} day free trial included
                  </div>
                )}
                {selectedPlanData.description && (
                  <p className="text-sm text-muted-foreground">{selectedPlanData.description}</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleAssignMembership} 
            disabled={!selectedPlan || loading}
            className="min-w-[120px]"
          >
            {loading ? "Processing..." : "Proceed to Payment"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};