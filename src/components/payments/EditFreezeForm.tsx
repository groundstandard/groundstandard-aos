import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface MembershipFreeze {
  id: string;
  membership_subscription_id: string;
  start_date: string;
  end_date: string | null;
  frozen_amount_cents: number;
  reason: string;
  status: string;
  created_at: string;
}

interface EditFreezeFormProps {
  freeze: MembershipFreeze;
  onSubmit: (updatedFreeze: { frozen_amount_cents: number; reason: string; end_date?: string }) => void;
  onCancel: () => void;
}

export const EditFreezeForm = ({ freeze, onSubmit, onCancel }: EditFreezeFormProps) => {
  const [frozenAmount, setFrozenAmount] = useState(freeze.frozen_amount_cents / 100);
  const [reason, setReason] = useState(freeze.reason);
  const [endDate, setEndDate] = useState(freeze.end_date ? freeze.end_date.split('T')[0] : '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onSubmit({
        frozen_amount_cents: Math.round(frozenAmount * 100),
        reason,
        end_date: endDate || undefined
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="freeze-amount">Frozen Payment Amount ($)</Label>
        <Input
          id="freeze-amount"
          type="number"
          min="0"
          step="0.01"
          value={frozenAmount}
          onChange={(e) => setFrozenAmount(parseFloat(e.target.value) || 0)}
          placeholder="10.00"
        />
      </div>

      <div>
        <Label htmlFor="freeze-reason">Reason for Freeze</Label>
        <Textarea
          id="freeze-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Temporary financial hardship, medical leave, etc."
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="freeze-end-date">End Date (Optional)</Label>
        <Input
          id="freeze-end-date"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Leave empty for indefinite freeze
        </p>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? "Updating..." : "Update Freeze"}
        </Button>
      </div>
    </div>
  );
};