import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  MoreHorizontal, 
  CreditCard, 
  Edit, 
  Trash2, 
  Pause, 
  Calendar as CalendarIcon,
  DollarSign 
} from 'lucide-react';
import { format } from 'date-fns';

interface PaymentSchedule {
  id: string;
  scheduled_date: string;
  amount_cents: number;
  status: string;
  installment_number: number;
  total_installments: number;
  membership_subscription_id: string;
}

interface PaymentScheduleActionsProps {
  schedule: PaymentSchedule;
  onUpdate: () => void;
  onPayNow: (schedule: PaymentSchedule) => void;
}

export const PaymentScheduleActions = ({ schedule, onUpdate, onPayNow }: PaymentScheduleActionsProps) => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [freezeDialogOpen, setFreezeDialogOpen] = useState(false);
  const [editAmount, setEditAmount] = useState(schedule.amount_cents / 100);
  const [freezeAmount, setFreezeAmount] = useState(10);
  const [freezeReason, setFreezeReason] = useState('');
  const [freezeStartDate, setFreezeStartDate] = useState<Date>(new Date());
  const [freezeEndDate, setFreezeEndDate] = useState<Date | undefined>();
  const [freezeIndefinite, setFreezeIndefinite] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleEditPayment = async () => {
    if (editAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Payment amount must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('payment_schedule')
        .update({ amount_cents: Math.round(editAmount * 100) })
        .eq('id', schedule.id);

      if (error) throw error;

      toast({
        title: "Payment Updated",
        description: "Payment amount has been updated successfully",
      });
      setEditDialogOpen(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating payment:', error);
      toast({
        title: "Error",
        description: "Failed to update payment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVoidPayment = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('payment_schedule')
        .update({ status: 'voided' })
        .eq('id', schedule.id);

      if (error) throw error;

      toast({
        title: "Payment Voided",
        description: "Payment has been voided and will be skipped",
      });
      onUpdate();
    } catch (error) {
      console.error('Error voiding payment:', error);
      toast({
        title: "Error",
        description: "Failed to void payment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePayment = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('payment_schedule')
        .delete()
        .eq('id', schedule.id);

      if (error) throw error;

      toast({
        title: "Payment Deleted",
        description: "Payment has been removed from the schedule",
      });
      onUpdate();
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast({
        title: "Error",
        description: "Failed to delete payment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFreeze = async () => {
    if (!freezeReason.trim()) {
      toast({
        title: "Invalid Reason",
        description: "Please provide a reason for the freeze",
        variant: "destructive",
      });
      return;
    }

    if (freezeAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Freeze amount must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('membership_freezes')
        .insert({
          membership_subscription_id: schedule.membership_subscription_id,
          start_date: format(freezeStartDate, 'yyyy-MM-dd'),
          end_date: freezeIndefinite ? null : (freezeEndDate ? format(freezeEndDate, 'yyyy-MM-dd') : null),
          frozen_amount_cents: Math.round(freezeAmount * 100),
          reason: freezeReason,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        });

      if (error) throw error;

      toast({
        title: "Freeze Created",
        description: "Membership freeze has been applied successfully",
      });
      setFreezeDialogOpen(false);
      onUpdate();
    } catch (error) {
      console.error('Error creating freeze:', error);
      toast({
        title: "Error",
        description: "Failed to create freeze",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const canEdit = schedule.status === 'pending';
  const canDelete = schedule.status === 'pending';
  const canVoid = schedule.status === 'pending';

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {(schedule.status === 'pending' || schedule.status === 'past_due') && (
            <DropdownMenuItem onClick={() => onPayNow(schedule)}>
              <CreditCard className="h-4 w-4 mr-2" />
              Pay Now
            </DropdownMenuItem>
          )}
          {canEdit && (
            <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Amount
            </DropdownMenuItem>
          )}
          {canVoid && (
            <DropdownMenuItem onClick={handleVoidPayment}>
              <Pause className="h-4 w-4 mr-2" />
              Void Payment
            </DropdownMenuItem>
          )}
          {canDelete && (
            <DropdownMenuItem onClick={handleDeletePayment} className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Payment
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => setFreezeDialogOpen(true)}>
            <Pause className="h-4 w-4 mr-2" />
            Create Freeze
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Payment Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Payment Amount</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-amount">Payment Amount</Label>
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="edit-amount"
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(parseFloat(e.target.value) || 0)}
                  step="0.01"
                  min="0"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditPayment} disabled={loading}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Freeze Dialog */}
      <Dialog open={freezeDialogOpen} onOpenChange={setFreezeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Membership Freeze</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="freeze-amount">Frozen Payment Amount</Label>
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="freeze-amount"
                  type="number"
                  value={freezeAmount}
                  onChange={(e) => setFreezeAmount(parseFloat(e.target.value) || 0)}
                  step="0.01"
                  min="0"
                />
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Amount to charge during freeze period (e.g., $10-20 instead of full price)
              </p>
            </div>

            <div>
              <Label htmlFor="freeze-reason">Reason for Freeze</Label>
              <Textarea
                id="freeze-reason"
                value={freezeReason}
                onChange={(e) => setFreezeReason(e.target.value)}
                placeholder="e.g., Financial hardship, temporary leave, injury recovery..."
              />
            </div>

            <div>
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(freezeStartDate, 'PPP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={freezeStartDate}
                    onSelect={(date) => date && setFreezeStartDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="freeze-indefinite"
                  checked={freezeIndefinite}
                  onChange={(e) => setFreezeIndefinite(e.target.checked)}
                />
                <Label htmlFor="freeze-indefinite">Indefinite freeze (no end date)</Label>
              </div>
            </div>

            {!freezeIndefinite && (
              <div>
                <Label>End Date (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {freezeEndDate ? format(freezeEndDate, 'PPP') : 'Select end date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={freezeEndDate}
                      onSelect={setFreezeEndDate}
                      initialFocus
                      disabled={(date) => date < freezeStartDate}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setFreezeDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateFreeze} disabled={loading}>
                Create Freeze
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};