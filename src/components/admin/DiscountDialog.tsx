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
  description: z.string().default(""),
  discount_type: z.string().default("percentage"),
  discount_value: z.number().min(0, "Discount value must be positive"),
  applies_to: z.string().default("membership"),
  is_active: z.boolean().default(true),
});

interface Discount {
  id: string;
  name: string;
  description: string;
  discount_type: string;
  discount_value: number;
  applies_to: string;
  is_active: boolean;
}

interface DiscountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  discount?: Discount | null;
  onSuccess: () => void;
}

export const DiscountDialog = ({
  open,
  onOpenChange,
  discount,
  onSuccess,
}: DiscountDialogProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      discount_type: "percentage",
      discount_value: 0,
      applies_to: "membership",
      is_active: true,
    },
  });

  useEffect(() => {
    if (discount) {
      form.reset({
        name: discount.name,
        description: discount.description || "",
        discount_type: discount.discount_type,
        discount_value: discount.discount_value,
        applies_to: discount.applies_to,
        is_active: discount.is_active,
      });
    } else {
      form.reset({
        name: "",
        description: "",
        discount_type: "percentage",
        discount_value: 0,
        applies_to: "membership",
        is_active: true,
      });
    }
  }, [discount, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);

      if (discount) {
        const { error } = await supabase
          .from('discount_types')
          .update(values)
          .eq('id', discount.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Discount updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('discount_types')
          .insert(values);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Discount created successfully",
        });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving discount:', error);
      toast({
        title: "Error",
        description: "Failed to save discount",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const discountType = form.watch("discount_type");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {discount ? "Edit Discount" : "Create Discount"}
          </DialogTitle>
          <DialogDescription>
            {discount
              ? "Update the discount details"
              : "Create a new discount for your academy"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Discount Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., New Student Special" {...field} />
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
                      placeholder="Brief description of the discount..."
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
                name="discount_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="discount_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {discountType === "percentage" ? "Percentage (%)" : "Amount ($)"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step={discountType === "percentage" ? "1" : "0.01"}
                        min="0"
                        max={discountType === "percentage" ? "100" : undefined}
                        placeholder={discountType === "percentage" ? "10" : "25.00"}
                        {...field}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="applies_to"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Applies To</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select what this applies to" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="membership">Membership Plans</SelectItem>
                      <SelectItem value="class_pack">Class Packs</SelectItem>
                      <SelectItem value="drop_in">Drop-in Classes</SelectItem>
                      <SelectItem value="all">All Services</SelectItem>
                      <SelectItem value="private_lesson">Private Lessons</SelectItem>
                      <SelectItem value="belt_testing">Belt Testing</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Active Discount</FormLabel>
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
                {isLoading ? "Saving..." : discount ? "Update Discount" : "Create Discount"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};