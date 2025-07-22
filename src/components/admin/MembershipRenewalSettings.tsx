import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Repeat, DollarSign, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MembershipPlan {
  id: string;
  name: string;
  base_price_cents: number;
  billing_cycle: string;
  renewal_enabled: boolean;
  renewal_discount_percentage: number;
  renewal_new_rate_enabled: boolean;
  renewal_new_rate_cents: number | null;
  auto_renewal_default: boolean;
  is_active: boolean;
}

interface RenewalSettingsFormData {
  renewal_enabled: boolean;
  renewal_discount_percentage: number;
  renewal_new_rate_enabled: boolean;
  renewal_new_rate_cents: number;
  auto_renewal_default: boolean;
}

export const MembershipRenewalSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [formData, setFormData] = useState<RenewalSettingsFormData>({
    renewal_enabled: true,
    renewal_discount_percentage: 0,
    renewal_new_rate_enabled: false,
    renewal_new_rate_cents: 0,
    auto_renewal_default: false
  });

  // Fetch membership plans with renewal settings
  const { data: membershipPlans, isLoading } = useQuery({
    queryKey: ['membership-plans-renewal'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('membership_plans')
        .select(`
          id,
          name,
          base_price_cents,
          billing_cycle,
          renewal_enabled,
          renewal_discount_percentage,
          renewal_new_rate_enabled,
          renewal_new_rate_cents,
          auto_renewal_default,
          is_active
        `)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as MembershipPlan[];
    }
  });

  // Update renewal settings mutation
  const updateRenewalSettings = useMutation({
    mutationFn: async ({ planId, settings }: { planId: string; settings: RenewalSettingsFormData }) => {
      const { error } = await supabase
        .from('membership_plans')
        .update({
          renewal_enabled: settings.renewal_enabled,
          renewal_discount_percentage: settings.renewal_discount_percentage,
          renewal_new_rate_enabled: settings.renewal_new_rate_enabled,
          renewal_new_rate_cents: settings.renewal_new_rate_enabled ? settings.renewal_new_rate_cents : null,
          auto_renewal_default: settings.auto_renewal_default
        })
        .eq('id', planId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['membership-plans-renewal'] });
      toast({
        title: "Success",
        description: "Renewal settings updated successfully"
      });
      setShowSettingsDialog(false);
      setSelectedPlan(null);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update renewal settings"
      });
    }
  });

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100);
  };

  const openSettingsDialog = (plan: MembershipPlan) => {
    setSelectedPlan(plan);
    setFormData({
      renewal_enabled: plan.renewal_enabled,
      renewal_discount_percentage: plan.renewal_discount_percentage,
      renewal_new_rate_enabled: plan.renewal_new_rate_enabled,
      renewal_new_rate_cents: plan.renewal_new_rate_cents || plan.base_price_cents,
      auto_renewal_default: plan.auto_renewal_default
    });
    setShowSettingsDialog(true);
  };

  const handleSaveSettings = () => {
    if (!selectedPlan) return;
    
    updateRenewalSettings.mutate({
      planId: selectedPlan.id,
      settings: formData
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading renewal settings...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5" />
            Membership Renewal Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Configure renewal options for each membership plan. Members can renew at the same rate, with discounts, or at new rates.
            </p>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan Name</TableHead>
                  <TableHead>Current Rate</TableHead>
                  <TableHead>Renewal Enabled</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>New Rate Option</TableHead>
                  <TableHead>Auto-Renewal Default</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {membershipPlans?.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">{plan.name}</TableCell>
                    <TableCell>{formatCurrency(plan.base_price_cents)}</TableCell>
                    <TableCell>
                      <Badge variant={plan.renewal_enabled ? "default" : "secondary"}>
                        {plan.renewal_enabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {plan.renewal_discount_percentage > 0 ? (
                        <Badge variant="outline">
                          {plan.renewal_discount_percentage}% off
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {plan.renewal_new_rate_enabled ? (
                        <Badge variant="outline">
                          {formatCurrency(plan.renewal_new_rate_cents || plan.base_price_cents)}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">Same rate</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={plan.auto_renewal_default ? "default" : "secondary"}>
                        {plan.auto_renewal_default ? "On" : "Off"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openSettingsDialog(plan)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Renewal Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Renewal Settings
            </DialogTitle>
            <DialogDescription>
              Configure renewal options for {selectedPlan?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Enable Renewals */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Renewals</Label>
                <p className="text-xs text-muted-foreground">
                  Allow members to renew this membership
                </p>
              </div>
              <Switch
                checked={formData.renewal_enabled}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, renewal_enabled: checked }))
                }
              />
            </div>

            {formData.renewal_enabled && (
              <>
                {/* Renewal Discount */}
                <div className="space-y-2">
                  <Label>Renewal Discount (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.renewal_discount_percentage}
                    onChange={(e) => 
                      setFormData(prev => ({ 
                        ...prev, 
                        renewal_discount_percentage: parseInt(e.target.value) || 0 
                      }))
                    }
                    placeholder="0"
                  />
                  <p className="text-xs text-muted-foreground">
                    Discount percentage for renewals (0 = no discount)
                  </p>
                </div>

                {/* New Rate Option */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Allow New Rate Renewals</Label>
                    <p className="text-xs text-muted-foreground">
                      Offer renewal at a different rate
                    </p>
                  </div>
                  <Switch
                    checked={formData.renewal_new_rate_enabled}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, renewal_new_rate_enabled: checked }))
                    }
                  />
                </div>

                {formData.renewal_new_rate_enabled && (
                  <div className="space-y-2">
                    <Label>New Renewal Rate ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.renewal_new_rate_cents / 100}
                      onChange={(e) => 
                        setFormData(prev => ({ 
                          ...prev, 
                          renewal_new_rate_cents: Math.round((parseFloat(e.target.value) || 0) * 100)
                        }))
                      }
                      placeholder="0.00"
                    />
                    <p className="text-xs text-muted-foreground">
                      Alternative rate for renewals
                    </p>
                  </div>
                )}

                {/* Auto-Renewal Default */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-Renewal Default</Label>
                    <p className="text-xs text-muted-foreground">
                      Enable auto-renewal by default for new subscriptions
                    </p>
                  </div>
                  <Switch
                    checked={formData.auto_renewal_default}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, auto_renewal_default: checked }))
                    }
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowSettingsDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveSettings}
              disabled={updateRenewalSettings.isPending}
            >
              {updateRenewalSettings.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};