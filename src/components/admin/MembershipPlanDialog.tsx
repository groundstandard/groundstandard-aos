import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  base_price_cents: z.number().min(0, "Price must be positive"),
  signup_fee_cents: z.number().min(0, "Signup fee must be positive"),
  cycle_length_months: z.number().min(1, "Cycle length must be at least 1 month"),
  payment_frequency: z.string().min(1, "Payment frequency is required"),
  age_group: z.string().optional(),
  is_active: z.boolean(),
  is_class_pack: z.boolean(),
  is_unlimited: z.boolean(),
  class_pack_size: z.number().optional(),
  pack_expiry_days: z.number().optional(),
  classes_per_week: z.number().optional(),
  // Renewal terms
  renewal_enabled: z.boolean(),
  renewal_discount_percentage: z.number().min(0).max(100),
  renewal_new_rate_enabled: z.boolean(),
  renewal_new_rate_cents: z.number().min(0).optional(),
  auto_renewal_default: z.boolean(),
});

interface MembershipPlan {
  id: string;
  name: string;
  description: string;
  base_price_cents: number;
  signup_fee_cents?: number;
  cycle_length_months?: number;
  payment_frequency?: string;
  age_group: string;
  is_active: boolean;
  is_class_pack?: boolean;
  is_unlimited?: boolean;
  class_pack_size?: number;
  pack_expiry_days?: number;
  classes_per_week?: number;
  renewal_enabled?: boolean;
  renewal_discount_percentage?: number;
  renewal_new_rate_enabled?: boolean;
  renewal_new_rate_cents?: number;
  auto_renewal_default?: boolean;
}

interface MembershipPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan?: MembershipPlan | null;
  onSuccess: () => void;
  defaultTab?: string;
}

export const MembershipPlanDialog = ({
  open,
  onOpenChange,
  plan,
  onSuccess,
  defaultTab = "main",
}: MembershipPlanDialogProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(defaultTab);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      base_price_cents: 0,
      signup_fee_cents: 0,
      cycle_length_months: 1,
      payment_frequency: "monthly",
      age_group: "all",
      is_active: true,
      is_class_pack: false,
      is_unlimited: false,
      class_pack_size: 0,
      pack_expiry_days: 30,
      classes_per_week: 1,
      renewal_enabled: true,
      renewal_discount_percentage: 0,
      renewal_new_rate_enabled: false,
      renewal_new_rate_cents: 0,
      auto_renewal_default: false,
    },
  });

  useEffect(() => {
    if (plan) {
      form.reset({
        name: plan.name,
        description: plan.description || "",
        base_price_cents: plan.base_price_cents,
        signup_fee_cents: plan.signup_fee_cents || 0,
        cycle_length_months: plan.cycle_length_months || 1,
        payment_frequency: plan.payment_frequency || "monthly",
        age_group: plan.age_group,
        is_active: plan.is_active,
        is_class_pack: plan.is_class_pack || false,
        is_unlimited: plan.is_unlimited || false,
        class_pack_size: plan.class_pack_size || 0,
        pack_expiry_days: plan.pack_expiry_days || 30,
        classes_per_week: plan.classes_per_week || 1,
        renewal_enabled: plan.renewal_enabled ?? true,
        renewal_discount_percentage: plan.renewal_discount_percentage || 0,
        renewal_new_rate_enabled: plan.renewal_new_rate_enabled || false,
        renewal_new_rate_cents: plan.renewal_new_rate_cents || 0,
        auto_renewal_default: plan.auto_renewal_default || false,
      });
    } else {
      form.reset({
        name: "",
        description: "",
        base_price_cents: 0,
        signup_fee_cents: 0,
        cycle_length_months: 1,
        payment_frequency: "monthly",
        age_group: "all",
        is_active: true,
        is_class_pack: false,
        is_unlimited: false,
        class_pack_size: 0,
        pack_expiry_days: 30,
        classes_per_week: 1,
        renewal_enabled: true,
        renewal_discount_percentage: 0,
        renewal_new_rate_enabled: false,
        renewal_new_rate_cents: 0,
        auto_renewal_default: false,
      });
    }
  }, [plan, form]);

  // Set active tab when dialog opens
  useEffect(() => {
    if (open) {
      setActiveTab(defaultTab);
    }
  }, [open, defaultTab]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);

      // Ensure required fields are properly typed for database
      const dataToSubmit = {
        name: values.name,
        description: values.description || "",
        base_price_cents: values.base_price_cents,
        signup_fee_cents: values.signup_fee_cents,
        cycle_length_months: values.cycle_length_months,
        payment_frequency: values.payment_frequency,
        age_group: values.age_group || "all",
        is_active: values.is_active,
        is_class_pack: values.is_class_pack,
        is_unlimited: values.is_unlimited,
        class_pack_size: values.class_pack_size || null,
        pack_expiry_days: values.pack_expiry_days || null,
        classes_per_week: values.classes_per_week || null,
        renewal_enabled: values.renewal_enabled,
        renewal_discount_percentage: values.renewal_discount_percentage,
        renewal_new_rate_enabled: values.renewal_new_rate_enabled,
        renewal_new_rate_cents: values.renewal_new_rate_enabled ? values.renewal_new_rate_cents : null,
        auto_renewal_default: values.auto_renewal_default,
      };

      if (plan) {
        const { error } = await supabase
          .from('membership_plans')
          .update(dataToSubmit)
          .eq('id', plan.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Membership plan updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('membership_plans')
          .insert(dataToSubmit);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Membership plan created successfully",
        });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving membership plan:', error);
      toast({
        title: "Error",
        description: "Failed to save membership plan",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {plan ? "Edit Membership Plan" : "Create Membership Plan"}
          </DialogTitle>
          <DialogDescription>
            {plan
              ? "Update the membership plan details and renewal terms"
              : "Create a new membership plan with payment options and renewal terms"}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="main">Plan Details</TabsTrigger>
            <TabsTrigger value="renewal">Renewal Terms</TabsTrigger>
          </TabsList>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <TabsContent value="main" className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plan Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Adult Monthly" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Brief description of the plan..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="base_price_cents"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly Price ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="99.99"
                            {...field}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0;
                              field.onChange(Math.round(value * 100));
                            }}
                            value={field.value ? (field.value / 100).toString() : ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="signup_fee_cents"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Signup Fee ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0;
                              field.onChange(Math.round(value * 100));
                            }}
                            value={field.value ? (field.value / 100).toString() : ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="cycle_length_months"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cycle Length</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select cycle" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1">1 Month</SelectItem>
                            <SelectItem value="2">2 Months</SelectItem>
                            <SelectItem value="3">3 Months</SelectItem>
                            <SelectItem value="6">6 Months</SelectItem>
                            <SelectItem value="9">9 Months</SelectItem>
                            <SelectItem value="12">12 Months</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="payment_frequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Frequency</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">3 Months</SelectItem>
                            <SelectItem value="semi-annually">6 Months</SelectItem>
                            <SelectItem value="tri-annually">9 Months</SelectItem>
                            <SelectItem value="annually">Annual</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="classes_per_week"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Classes/Week</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            placeholder="1"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="age_group"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age Group</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select age group" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="all">All Ages</SelectItem>
                            <SelectItem value="kids">Kids (5-12)</SelectItem>
                            <SelectItem value="teens">Teens (13-17)</SelectItem>
                            <SelectItem value="adults">Adults (18+)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {form.watch("is_class_pack") && (
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="class_pack_size"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Classes in Pack</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              placeholder="10"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="pack_expiry_days"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expiry (Days)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              placeholder="30"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 30)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name="is_class_pack"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Class Pack</FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="is_unlimited"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Unlimited Classes</FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Active Plan</FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="renewal" className="space-y-4">
                <div className="text-sm text-muted-foreground mb-4">
                  Configure how this membership plan handles renewals when the current term expires.
                </div>

                <FormField
                  control={form.control}
                  name="renewal_enabled"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Enable Renewals</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Allow this plan to be renewed automatically or manually
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {form.watch("renewal_enabled") && (
                  <>
                    <FormField
                      control={form.control}
                      name="auto_renewal_default"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Auto-Renewal by Default</FormLabel>
                            <div className="text-sm text-muted-foreground">
                              New subscriptions will have auto-renewal enabled by default
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="renewal_discount_percentage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Renewal Discount (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              placeholder="0"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <div className="text-sm text-muted-foreground">
                            Discount percentage applied to renewal payments (0-100%)
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="renewal_new_rate_enabled"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Custom Renewal Rate</FormLabel>
                            <div className="text-sm text-muted-foreground">
                              Use a different price for renewals instead of discount
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {form.watch("renewal_new_rate_enabled") && (
                      <FormField
                        control={form.control}
                        name="renewal_new_rate_cents"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Renewal Price ($)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="79.99"
                                {...field}
                                onChange={(e) => {
                                  const value = parseFloat(e.target.value) || 0;
                                  field.onChange(Math.round(value * 100));
                                }}
                                value={field.value ? (field.value / 100).toString() : ""}
                              />
                            </FormControl>
                            <div className="text-sm text-muted-foreground">
                              Fixed price for renewal periods (overrides discount)
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </>
                )}
              </TabsContent>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? "Saving..." : plan ? "Update Plan" : "Create Plan"}
                </Button>
              </div>
            </form>
          </Form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};