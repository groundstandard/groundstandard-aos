import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Package, Calendar, Clock, Loader2 } from 'lucide-react';

interface MembershipPlan {
  id: string;
  name: string;
  description: string;
  base_price_cents: number;
  class_pack_size: number;
  pack_expiry_days: number;
  is_active: boolean;
}

interface ClassPackPurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId: string;
  onPurchaseComplete?: () => void;
}

export const ClassPackPurchaseDialog = ({
  open,
  onOpenChange,
  contactId,
  onPurchaseComplete
}: ClassPackPurchaseDialogProps) => {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchClassPackPlans();
    }
  }, [open]);

  const fetchClassPackPlans = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('membership_plans')
        .select('*')
        .eq('is_class_pack', true)
        .eq('is_active', true)
        .order('base_price_cents', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching class pack plans:', error);
      toast({
        title: "Error",
        description: "Failed to load class pack plans",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (planId: string) => {
    try {
      setPurchasing(planId);
      const { data, error } = await supabase.functions.invoke('create-class-pack-purchase', {
        body: {
          planId,
          contactId,
          isRenewal: false
        }
      });

      if (error) throw error;

      if (data?.url) {
        // Open payment in new tab
        window.open(data.url, '_blank');
        
        toast({
          title: "Class Pack Purchase Initiated",
          description: "Opening payment window...",
        });

        // Close dialog and refresh data
        onOpenChange(false);
        if (onPurchaseComplete) {
          onPurchaseComplete();
        }
      }
    } catch (error) {
      console.error('Error creating class pack purchase:', error);
      toast({
        title: "Error",
        description: "Failed to initiate class pack purchase",
        variant: "destructive",
      });
    } finally {
      setPurchasing(null);
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Purchase Class Pack
          </DialogTitle>
          <DialogDescription>
            Choose a class pack plan to purchase for this contact.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading class pack plans...</p>
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No class pack plans available</p>
              <p className="text-sm text-muted-foreground mt-2">
                Contact an admin to create class pack plans.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 max-h-96 overflow-y-auto">
              {plans.map((plan) => (
                <Card key={plan.id} className="transition-all hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{plan.name}</h3>
                          <Badge variant="outline" className="text-xs">
                            Class Pack
                          </Badge>
                        </div>
                        
                        {plan.description && (
                          <p className="text-sm text-muted-foreground">
                            {plan.description}
                          </p>
                        )}

                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            <span>{plan.class_pack_size} classes</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{plan.pack_expiry_days} days to use</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{Math.round(plan.pack_expiry_days / plan.class_pack_size)} days per class</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right space-y-2">
                        <div className="text-2xl font-bold">
                          {formatCurrency(plan.base_price_cents)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency(Math.round(plan.base_price_cents / plan.class_pack_size))} per class
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handlePurchase(plan.id)}
                          disabled={purchasing === plan.id}
                          className="w-full"
                        >
                          {purchasing === plan.id ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Processing...
                            </>
                          ) : (
                            'Purchase Pack'
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};