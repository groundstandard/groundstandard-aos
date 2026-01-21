import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAcademy } from '@/hooks/useAcademy';
import { Calendar } from '@/components/ui/calendar';
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { CalendarIcon } from 'lucide-react';
import { format, startOfDay } from 'date-fns';
import { cn } from "@/lib/utils";

interface SetupRecurringDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SetupRecurringDialog = ({ open, onOpenChange }: SetupRecurringDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentAcademyId } = useAcademy();
  const [startDate, setStartDate] = useState<Date>();
  const [isDateOpen, setIsDateOpen] = useState(false);

  const [form, setForm] = useState({
    student_id: '',
    membership_plan_id: '',
    amount: '',
    description: '',
    frequency: 'monthly' as 'weekly' | 'monthly' | 'quarterly' | 'annually',
    day_of_month: '1',
    is_active: true
  });

  // Fetch students for dropdown
  const { data: students } = useQuery({
    queryKey: ['students-for-recurring'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .eq('role', 'student')
        .order('first_name');

      if (error) throw error;
      return data || [];
    }
  });

  // Fetch membership plans for dropdown
  const {
    data: membershipPlans,
    isLoading: membershipPlansLoading,
  } = useQuery({
    queryKey: ['membership-plans-for-recurring'],
    queryFn: async () => {
      try {
        let query = supabase
          .from('membership_plans')
          .select('id, name')
          .or('is_active.eq.true,is_active.is.null')
          .order('name');

        if (currentAcademyId) {
          query = query.or(`academy_id.eq.${currentAcademyId},academy_id.is.null`);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error?.message || 'Failed to load membership plans',
        });
        return [];
      }
    },
    enabled: open,
  });

  const createRecurringMutation = useMutation({
    mutationFn: async (formData: typeof form & { start_date: string }) => {
      const amountCents = Math.round(parseFloat(formData.amount) * 100);
      if (!formData.student_id) throw new Error('Student is required');
      if (!formData.membership_plan_id) throw new Error('Membership plan is required');
      if (!Number.isFinite(amountCents) || amountCents <= 0) throw new Error('Amount must be greater than 0');

      const { data: existing, error: existingError } = await (supabase as any)
        .from('membership_subscriptions')
        .select('id')
        .eq('contact_id', formData.student_id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingError) throw existingError;

      if (existing?.id) {
        const { error: updateError } = await (supabase as any)
          .from('membership_subscriptions')
          .update({
            next_billing_date: formData.start_date,
            billing_amount_cents: amountCents,
            notes: formData.description || null,
          })
          .eq('id', existing.id);

        if (updateError) throw updateError;
        return { subscription_id: existing.id, created: false };
      }

      const { data: created, error: insertError } = await (supabase as any)
        .from('membership_subscriptions')
        .insert({
          contact_id: formData.student_id,
          membership_plan_id: formData.membership_plan_id,
          status: 'active',
          start_date: formData.start_date,
          next_billing_date: formData.start_date,
          billing_amount_cents: amountCents,
          discount_percentage: 0,
          notes: formData.description || null,
        })
        .select('id')
        .single();

      if (insertError) throw insertError;
      return { subscription_id: (created as any).id, created: true };
    },
    onSuccess: () => {
      toast({
        title: 'Recurring Payment Created',
        description: 'Recurring payment schedule has been set up successfully.'
      });
      resetForm();
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ['membership-subscriptions-schedules'] });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create recurring payment'
      });
    }
  });

  const resetForm = () => {
    setForm({
      student_id: '',
      membership_plan_id: '',
      amount: '',
      description: '',
      frequency: 'monthly',
      day_of_month: '1',
      is_active: true
    });
    setStartDate(undefined);
  };

  const handleSubmit = () => {
    if (!startDate) return;
    createRecurringMutation.mutate({
      ...form,
      start_date: startDate.toISOString().split('T')[0]
    });
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Setup Recurring Payment</DialogTitle>
          <DialogDescription>
            Create automated payment schedules for students
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label>Student</Label>
            <Select 
              value={form.student_id} 
              onValueChange={(value) => setForm(prev => ({ ...prev, student_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent>
                {students?.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.first_name} {student.last_name} ({student.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Membership Plan</Label>
            <Select
              value={form.membership_plan_id}
              onValueChange={(value) => setForm(prev => ({ ...prev, membership_plan_id: value }))}
              disabled={membershipPlansLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={membershipPlansLoading ? "Loading plans..." : "Select plan"} />
              </SelectTrigger>
              <SelectContent>
                {membershipPlans?.map((plan) => (
                  <SelectItem key={(plan as any).id} value={(plan as any).id}>
                    {(plan as any).name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Amount ($)</Label>
            <Input
              type="number"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="0.00"
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Monthly membership fee..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Frequency</Label>
              <Select 
                value={form.frequency} 
                onValueChange={(value: 'weekly' | 'monthly' | 'quarterly' | 'annually') => 
                  setForm(prev => ({ ...prev, frequency: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="annually">Annually</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.frequency === 'monthly' && (
              <div>
                <Label>Day of Month</Label>
                <Input
                  type="number"
                  min="1"
                  max="28"
                  value={form.day_of_month}
                  onChange={(e) => setForm(prev => ({ ...prev, day_of_month: e.target.value }))}
                />
              </div>
            )}
          </div>

          <div>
            <Label>Start Date</Label>
            <PopoverPrimitive.Root open={isDateOpen} onOpenChange={setIsDateOpen}>
              <PopoverPrimitive.Trigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverPrimitive.Trigger>
              <PopoverPrimitive.Content
                align="start"
                sideOffset={4}
                className={cn(
                  "z-50 w-auto rounded-md border bg-popover p-0 text-popover-foreground shadow-md outline-none pointer-events-auto",
                )}
              >
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => {
                    if (!date) return;
                    setStartDate(date);
                    setIsDateOpen(false);
                  }}
                  onDayClick={(date) => {
                    setStartDate(date);
                    setIsDateOpen(false);
                  }}
                  disabled={{ before: startOfDay(new Date()) }}
                  initialFocus
                />
              </PopoverPrimitive.Content>
            </PopoverPrimitive.Root>
          </div>

          <Button 
            onClick={handleSubmit}
            disabled={createRecurringMutation.isPending || !form.student_id || !form.membership_plan_id || !form.amount || !startDate}
            className="w-full"
          >
            {createRecurringMutation.isPending ? 'Creating...' : 'Setup Recurring Payment'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};