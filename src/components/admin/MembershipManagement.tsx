import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Users, Percent, Clock } from "lucide-react";
import { MembershipPlanDialog } from "./MembershipPlanDialog";
import { DiscountDialog } from "./DiscountDialog";
import { DropInDialog } from "./DropInDialog";

interface MembershipPlan {
  id: string;
  name: string;
  description: string;
  base_price_cents: number;
  billing_cycle: string;
  age_group: string;
  is_active: boolean;
  class_pack_size?: number;
  pack_expiry_days?: number;
  is_class_pack?: boolean;
  is_unlimited?: boolean;
  created_at: string;
}

interface Discount {
  id: string;
  name: string;
  description: string;
  discount_type: string;
  discount_value: number;
  applies_to: string;
  is_active: boolean;
  created_at: string;
}

interface DropInOption {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  option_type: string;
  age_group: string;
  trial_duration_days: number;
  is_active: boolean;
  created_at: string;
}

const MembershipManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [dropInOptions, setDropInOptions] = useState<DropInOption[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
  const [dropInDialogOpen, setDropInDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [editingDropIn, setEditingDropIn] = useState<DropInOption | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch membership plans
      const { data: plans, error: plansError } = await supabase
        .from('membership_plans')
        .select('*')
        .order('created_at', { ascending: false });

      if (plansError) throw plansError;

      // Fetch discounts
      const { data: discountData, error: discountsError } = await supabase
        .from('discount_types')
        .select('*')
        .order('created_at', { ascending: false });

      if (discountsError) throw discountsError;

      // Fetch drop-in options
      const { data: dropIns, error: dropInsError } = await supabase
        .from('drop_in_options')
        .select('*')
        .order('created_at', { ascending: false });

      if (dropInsError) throw dropInsError;

      setMembershipPlans(plans || []);
      setDiscounts(discountData || []);
      setDropInOptions(dropIns || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load membership data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlan = async (id: string) => {
    try {
      const { error } = await supabase
        .from('membership_plans')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Membership plan deleted successfully",
      });
      
      fetchData();
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast({
        title: "Error",
        description: "Failed to delete membership plan",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDiscount = async (id: string) => {
    try {
      const { error } = await supabase
        .from('discount_types')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Discount deleted successfully",
      });
      
      fetchData();
    } catch (error) {
      console.error('Error deleting discount:', error);
      toast({
        title: "Error",
        description: "Failed to delete discount",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDropIn = async (id: string) => {
    try {
      const { error } = await supabase
        .from('drop_in_options')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Drop-in option deleted successfully",
      });
      
      fetchData();
    } catch (error) {
      console.error('Error deleting drop-in option:', error);
      toast({
        title: "Error",
        description: "Failed to delete drop-in option",
        variant: "destructive",
      });
    }
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading membership data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="plans" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="plans" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Membership Plans
          </TabsTrigger>
          <TabsTrigger value="discounts" className="flex items-center gap-2">
            <Percent className="h-4 w-4" />
            Discounts
          </TabsTrigger>
          <TabsTrigger value="dropin" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Drop-in Options
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Membership Plans</h3>
              <p className="text-sm text-muted-foreground">
                Create and manage recurring membership plans
              </p>
            </div>
            <Button onClick={() => setPlanDialogOpen(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Plan
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {membershipPlans.map((plan) => (
              <Card key={plan.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <CardDescription className="mt-1">{plan.description}</CardDescription>
                    </div>
                    <Badge variant={plan.is_active ? "default" : "secondary"}>
                      {plan.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-primary">
                      {formatPrice(plan.base_price_cents)}
                      <span className="text-sm font-normal text-muted-foreground">
                        /{plan.billing_cycle}
                      </span>
                    </div>
                    <div className="flex gap-2 text-xs">
                      <Badge variant="outline">{plan.is_class_pack ? "Class Pack" : "Membership"}</Badge>
                      <Badge variant="outline">{plan.age_group}</Badge>
                      {plan.is_unlimited && <Badge variant="outline">Unlimited</Badge>}
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingPlan(plan);
                          setPlanDialogOpen(true);
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeletePlan(plan.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {membershipPlans.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No membership plans yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first membership plan to get started
                </p>
                <Button onClick={() => setPlanDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Plan
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="discounts" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Discount Types</h3>
              <p className="text-sm text-muted-foreground">
                Manage discount codes and promotions
              </p>
            </div>
            <Button onClick={() => setDiscountDialogOpen(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Discount
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {discounts.map((discount) => (
              <Card key={discount.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{discount.name}</CardTitle>
                      <CardDescription className="mt-1">{discount.description}</CardDescription>
                    </div>
                    <Badge variant={discount.is_active ? "default" : "secondary"}>
                      {discount.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-primary">
                      {discount.discount_type === 'percentage' ? `${discount.discount_value}%` : formatPrice(discount.discount_value * 100)}
                      <span className="text-sm font-normal text-muted-foreground"> off</span>
                    </div>
                    <div className="flex gap-2 text-xs">
                      <Badge variant="outline">{discount.discount_type}</Badge>
                      <Badge variant="outline">{discount.applies_to}</Badge>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingDiscount(discount);
                          setDiscountDialogOpen(true);
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteDiscount(discount.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {discounts.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Percent className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No discounts yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create discount codes to attract new members
                </p>
                <Button onClick={() => setDiscountDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Discount
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="dropin" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Drop-in Options</h3>
              <p className="text-sm text-muted-foreground">
                Manage single-class and trial options
              </p>
            </div>
            <Button onClick={() => setDropInDialogOpen(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Drop-in Option
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {dropInOptions.map((option) => (
              <Card key={option.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{option.name}</CardTitle>
                      <CardDescription className="mt-1">{option.description}</CardDescription>
                    </div>
                    <Badge variant={option.is_active ? "default" : "secondary"}>
                      {option.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-primary">
                      {formatPrice(option.price_cents)}
                    </div>
                    <div className="flex gap-2 text-xs">
                      <Badge variant="outline">{option.option_type}</Badge>
                      <Badge variant="outline">{option.age_group}</Badge>
                      {option.trial_duration_days > 0 && (
                        <Badge variant="outline">{option.trial_duration_days} days trial</Badge>
                      )}
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingDropIn(option);
                          setDropInDialogOpen(true);
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteDropIn(option.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {dropInOptions.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No drop-in options yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create drop-in options for one-time classes
                </p>
                <Button onClick={() => setDropInDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Option
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <MembershipPlanDialog
        open={planDialogOpen}
        onOpenChange={(open) => {
          setPlanDialogOpen(open);
          if (!open) setEditingPlan(null);
        }}
        plan={editingPlan}
        onSuccess={fetchData}
      />

      <DiscountDialog
        open={discountDialogOpen}
        onOpenChange={(open) => {
          setDiscountDialogOpen(open);
          if (!open) setEditingDiscount(null);
        }}
        discount={editingDiscount}
        onSuccess={fetchData}
      />

      <DropInDialog
        open={dropInDialogOpen}
        onOpenChange={(open) => {
          setDropInDialogOpen(open);
          if (!open) setEditingDropIn(null);
        }}
        option={editingDropIn}
        onSuccess={fetchData}
      />
    </div>
  );
};

export default MembershipManagement;