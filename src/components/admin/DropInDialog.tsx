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
  price_cents: z.number().min(0, "Price must be positive"),
  option_type: z.string().optional(),
  age_group: z.string().optional(),
  trial_duration_days: z.number().optional(),
  is_active: z.boolean(),
});

interface DropInOption {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  option_type: string;
  age_group: string;
  trial_duration_days: number;
  is_active: boolean;
}

interface DropInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  option?: DropInOption | null;
  onSuccess: () => void;
}

export const DropInDialog = ({
  open,
  onOpenChange,
  option,
  onSuccess,
}: DropInDialogProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      price_cents: 0,
      option_type: "single_class",
      age_group: "all",
      trial_duration_days: 0,
      is_active: true,
    },
  });

  useEffect(() => {
    if (option) {
      form.reset({
        name: option.name,
        description: option.description || "",
        price_cents: option.price_cents,
        option_type: option.option_type,
        age_group: option.age_group,
        trial_duration_days: option.trial_duration_days,
        is_active: option.is_active,
      });
    } else {
      form.reset({
        name: "",
        description: "",
        price_cents: 0,
        option_type: "single_class",
        age_group: "all",
        trial_duration_days: 0,
        is_active: true,
      });
    }
  }, [option, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);

      // Ensure required fields are properly typed for database
      const dataToSubmit = {
        name: values.name,
        description: values.description || "",
        price_cents: values.price_cents,
        option_type: values.option_type || "single_class",
        age_group: values.age_group || "all",
        trial_duration_days: values.trial_duration_days || 0,
        is_active: values.is_active,
      };

      if (option) {
        const { error } = await supabase
          .from('drop_in_options')
          .update(dataToSubmit)
          .eq('id', option.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Drop-in option updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('drop_in_options')
          .insert(dataToSubmit);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Drop-in option created successfully",
        });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving drop-in option:', error);
      toast({
        title: "Error",
        description: "Failed to save drop-in option",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {option ? "Edit Drop-in Option" : "Create Drop-in Option"}
          </DialogTitle>
          <DialogDescription>
            {option
              ? "Update the drop-in option details"
              : "Create a new drop-in option for single classes"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Option Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Single Class Drop-in" {...field} />
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
                      placeholder="Brief description of the option..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price_cents"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="25.00"
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="option_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Option Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="single_class">Single Class</SelectItem>
                        <SelectItem value="trial_class">Trial Class</SelectItem>
                        <SelectItem value="intro_package">Intro Package</SelectItem>
                        <SelectItem value="guest_pass">Guest Pass</SelectItem>
                      </SelectContent>
                    </Select>
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

            <FormField
              control={form.control}
              name="trial_duration_days"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trial Duration (Days)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0 (0 = no trial)"
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
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Active Option</FormLabel>
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
                {isLoading ? "Saving..." : option ? "Update Option" : "Create Option"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};