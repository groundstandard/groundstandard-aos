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

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  base_price_cents: z.number().min(0, "Price must be positive"),
  billing_cycle: z.string().min(1, "Billing cycle is required"),
  age_group: z.string().optional(),
  is_active: z.boolean(),
  is_class_pack: z.boolean(),
  is_unlimited: z.boolean(),
  class_pack_size: z.number().optional(),
  pack_expiry_days: z.number().optional(),
  classes_per_week: z.number().optional(),
});

interface MembershipPlan {
  id: string;
  name: string;
  description: string;
  base_price_cents: number;
  billing_cycle: string;
  age_group: string;
  is_active: boolean;
  is_class_pack?: boolean;
  is_unlimited?: boolean;
  class_pack_size?: number;
  pack_expiry_days?: number;
  classes_per_week?: number;
}

interface MembershipPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan?: MembershipPlan | null;
  onSuccess: () => void;
}

export const MembershipPlanDialog = ({
  open,
  onOpenChange,
  plan,
  onSuccess,
}: MembershipPlanDialogProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      base_price_cents: 0,
      billing_cycle: "monthly",
      age_group: "all",
      is_active: true,
      is_class_pack: false,
      is_unlimited: false,
      class_pack_size: 0,
      pack_expiry_days: 30,
      classes_per_week: 1,
    },
  });

  useEffect(() => {
    if (plan) {
      form.reset({
        name: plan.name,
        description: plan.description || "",
        base_price_cents: plan.base_price_cents,
        billing_cycle: plan.billing_cycle,
        age_group: plan.age_group,
        is_active: plan.is_active,
        is_class_pack: plan.is_class_pack || false,
        is_unlimited: plan.is_unlimited || false,
        class_pack_size: plan.class_pack_size || 0,
        pack_expiry_days: plan.pack_expiry_days || 30,
        classes_per_week: plan.classes_per_week || 1,
      });
    } else {
      form.reset({
        name: "",
        description: "",
        base_price_cents: 0,
        billing_cycle: "monthly",
        age_group: "all",
        is_active: true,
        is_class_pack: false,
        is_unlimited: false,
        class_pack_size: 0,
        pack_expiry_days: 30,
        classes_per_week: 1,
      });
    }
  }, [plan, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);

      // Ensure required fields are properly typed for database
      const dataToSubmit = {
        name: values.name,
        description: values.description || "",
        base_price_cents: values.base_price_cents,
        billing_cycle: values.billing_cycle,
        age_group: values.age_group || "all",
        is_active: values.is_active,
        is_class_pack: values.is_class_pack,
        is_unlimited: values.is_unlimited,
        class_pack_size: values.class_pack_size || null,
        pack_expiry_days: values.pack_expiry_days || null,
        classes_per_week: values.classes_per_week || null,
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
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {plan ? "Edit Membership Plan" : "Create Membership Plan"}
          </DialogTitle>
          <DialogDescription>
            {plan
              ? "Update the membership plan details"
              : "Create a new membership plan for your academy"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  <FormLabel>Price ($)</FormLabel>
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
                      value={field.value ? (field.value / 100).toFixed(2) : ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

              <FormField
                control={form.control}
                name="billing_cycle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Billing Cycle</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select cycle" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="annually">Annually</SelectItem>
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
      </DialogContent>
    </Dialog>
  );
};