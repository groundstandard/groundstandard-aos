import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionRenewalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscriptionId: string;
  currentAutoRenewal: boolean;
  currentDiscountPercentage: number;
  onSuccess: () => void;
}

export const SubscriptionRenewalDialog = ({
  open,
  onOpenChange,
  subscriptionId,
  currentAutoRenewal,
  currentDiscountPercentage,
  onSuccess
}: SubscriptionRenewalDialogProps) => {
  const [autoRenewal, setAutoRenewal] = useState(currentAutoRenewal);
  const [discountPercentage, setDiscountPercentage] = useState(currentDiscountPercentage);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setAutoRenewal(currentAutoRenewal);
    setDiscountPercentage(currentDiscountPercentage);
  }, [currentAutoRenewal, currentDiscountPercentage, open]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('membership_subscriptions')
        .update({
          auto_renewal: autoRenewal,
          renewal_discount_percentage: discountPercentage,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId);

      if (error) throw error;

      toast({
        title: "Renewal terms updated",
        description: "The subscription renewal settings have been customized for this member.",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating renewal terms:', error);
      toast({
        title: "Error",
        description: "Failed to update renewal terms. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Customize Renewal Terms</DialogTitle>
          <DialogDescription>
            Customize the renewal settings for this specific membership subscription.
            These changes will only apply to this member's subscription.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-renewal">Auto Renewal</Label>
              <div className="text-sm text-muted-foreground">
                Automatically renew this membership when it expires
              </div>
            </div>
            <Switch
              id="auto-renewal"
              checked={autoRenewal}
              onCheckedChange={setAutoRenewal}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="discount-percentage">Renewal Discount (%)</Label>
            <Input
              id="discount-percentage"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={discountPercentage}
              onChange={(e) => setDiscountPercentage(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
            />
            <div className="text-sm text-muted-foreground">
              Discount percentage to apply when this membership renews
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};