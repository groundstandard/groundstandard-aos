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
  currentRenewalEnabled?: boolean;
  currentRenewalNewRateEnabled?: boolean;
  currentRenewalNewRateCents?: number;
  onSuccess: () => void;
}

export const SubscriptionRenewalDialog = ({
  open,
  onOpenChange,
  subscriptionId,
  currentAutoRenewal,
  currentDiscountPercentage,
  currentRenewalEnabled = true,
  currentRenewalNewRateEnabled = false,
  currentRenewalNewRateCents = 0,
  onSuccess
}: SubscriptionRenewalDialogProps) => {
  const [renewalEnabled, setRenewalEnabled] = useState(currentRenewalEnabled);
  const [autoRenewal, setAutoRenewal] = useState(currentAutoRenewal);
  const [discountPercentage, setDiscountPercentage] = useState(currentDiscountPercentage);
  const [renewalNewRateEnabled, setRenewalNewRateEnabled] = useState(currentRenewalNewRateEnabled);
  const [renewalNewRateCents, setRenewalNewRateCents] = useState(currentRenewalNewRateCents);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setRenewalEnabled(currentRenewalEnabled);
    setAutoRenewal(currentAutoRenewal);
    setDiscountPercentage(currentDiscountPercentage);
    setRenewalNewRateEnabled(currentRenewalNewRateEnabled);
    setRenewalNewRateCents(currentRenewalNewRateCents);
  }, [currentRenewalEnabled, currentAutoRenewal, currentDiscountPercentage, currentRenewalNewRateEnabled, currentRenewalNewRateCents, open]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const updateData: any = {
        auto_renewal: renewalEnabled ? autoRenewal : false,
        renewal_discount_percentage: renewalEnabled && !renewalNewRateEnabled ? discountPercentage : 0,
        renewal_new_rate_enabled: renewalEnabled ? renewalNewRateEnabled : false,
        renewal_new_rate_cents: renewalEnabled && renewalNewRateEnabled ? renewalNewRateCents : null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('membership_subscriptions')
        .update(updateData)
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
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Customize Renewal Terms</DialogTitle>
          <DialogDescription>
            Customize the renewal settings for this specific membership subscription.
            These changes will only apply to this member's subscription.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1">
          <div className="space-y-6 py-4">
            <div className="text-sm text-muted-foreground">
              Configure how this specific membership subscription handles renewals when the current term expires.
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="renewal-enabled">Enable Renewals</Label>
                <div className="text-sm text-muted-foreground">
                  Allow this subscription to be renewed automatically or manually
                </div>
              </div>
              <Switch
                id="renewal-enabled"
                checked={renewalEnabled}
                onCheckedChange={setRenewalEnabled}
              />
            </div>

            {renewalEnabled && (
              <>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-renewal">Auto-Renewal</Label>
                    <div className="text-sm text-muted-foreground">
                      Automatically renew this subscription when it expires
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
                    placeholder="0"
                    disabled={renewalNewRateEnabled}
                  />
                  <div className="text-sm text-muted-foreground">
                    Discount percentage applied to renewal payments (0-100%)
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <Label htmlFor="renewal-new-rate">Custom Renewal Rate</Label>
                    <div className="text-sm text-muted-foreground">
                      Use a different price for renewals instead of discount
                    </div>
                  </div>
                  <Switch
                    id="renewal-new-rate"
                    checked={renewalNewRateEnabled}
                    onCheckedChange={setRenewalNewRateEnabled}
                  />
                </div>

                {renewalNewRateEnabled && (
                  <div className="space-y-2">
                    <Label htmlFor="renewal-price">Renewal Price ($)</Label>
                    <Input
                      id="renewal-price"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="79.99"
                      value={renewalNewRateCents ? (renewalNewRateCents / 100).toString() : ""}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        setRenewalNewRateCents(Math.round(value * 100));
                      }}
                    />
                    <div className="text-sm text-muted-foreground">
                      Fixed price for renewal periods (overrides discount)
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-2 flex-shrink-0 pt-4 border-t">
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