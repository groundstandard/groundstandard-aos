import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Package, AlertTriangle, CheckCircle, Repeat } from 'lucide-react';
import { ClassPackPurchaseDialog } from './ClassPackPurchaseDialog';

interface ClassPack {
  id: string;
  total_classes: number;
  remaining_classes: number;
  purchase_date: string;
  expiry_date: string;
  status: string;
  auto_renewal: boolean;
  renewal_discount_percentage: number;
  membership_plans: {
    id: string;
    name: string;
    description: string;
    base_price_cents: number;
    class_pack_size: number;
    pack_expiry_days: number;
  };
}

interface ClassPacksCardProps {
  contactId?: string;
  onPurchaseComplete?: () => void;
}

export const ClassPacksCard = ({ contactId, onPurchaseComplete }: ClassPacksCardProps) => {
  const [classPacks, setClassPacks] = useState<ClassPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (contactId) {
      fetchClassPacks();
    }
  }, [contactId]);

  const fetchClassPacks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('class_packs')
        .select(`
          *,
          membership_plans (
            id,
            name,
            description,
            base_price_cents,
            class_pack_size,
            pack_expiry_days
          )
        `)
        .eq('profile_id', contactId)
        .order('purchase_date', { ascending: false });

      if (error) throw error;
      setClassPacks(data || []);
    } catch (error) {
      console.error('Error fetching class packs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRenewClassPack = async (packId: string, planId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('create-class-pack-purchase', {
        body: {
          planId,
          contactId,
          isRenewal: true,
          originalPackId: packId
        }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
        toast({
          title: "Class Pack Renewal Created",
          description: "Opening payment window...",
        });
      }
    } catch (error) {
      console.error('Error creating class pack renewal:', error);
      toast({
        title: "Error",
        description: "Failed to create class pack renewal",
        variant: "destructive",
      });
    }
  };

  const handlePurchaseComplete = () => {
    fetchClassPacks(); // Refresh the class packs list
    onPurchaseComplete?.(); // Refresh parent component data (payments, etc.)
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'exhausted':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const isExpiringSoon = (expiryDate: string) => {
    const daysLeft = getDaysUntilExpiry(expiryDate);
    return daysLeft > 0 && daysLeft <= 14; // Within 2 weeks
  };

  const getProgressPercentage = (remaining: number, total: number) => {
    return ((total - remaining) / total) * 100;
  };

  if (loading) {
    return (
      <Card className="card-minimal">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading class packs...</div>
        </CardContent>
      </Card>
    );
  }

  if (classPacks.length === 0) {
    return (
      <Card className="card-minimal">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Class Packs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">No class packs found</p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowPurchaseDialog(true)}
            >
              Purchase Class Pack
            </Button>
          </div>
        </CardContent>
        
        <ClassPackPurchaseDialog
          open={showPurchaseDialog}
          onOpenChange={setShowPurchaseDialog}
          contactId={contactId || ''}
          onPurchaseComplete={handlePurchaseComplete}
        />
      </Card>
    );
  }

  return (
    <Card className="card-minimal shadow-elegant">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Class Packs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {classPacks.map((pack) => {
          const plan = pack.membership_plans;
          const daysLeft = getDaysUntilExpiry(pack.expiry_date);
          const progressPercent = getProgressPercentage(pack.remaining_classes, pack.total_classes);
          
          return (
            <div key={pack.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{plan.name}</h4>
                    <Badge variant="outline" className={getStatusColor(pack.status)}>
                      {pack.status}
                    </Badge>
                    {pack.auto_renewal && (
                      <Badge variant="secondary" className="gap-1">
                        <Repeat className="h-3 w-3" />
                        Auto-Renew
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(plan.base_price_cents)}</p>
                  <p className="text-xs text-muted-foreground">
                    {pack.total_classes} classes
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Classes Used</span>
                  <span>{pack.total_classes - pack.remaining_classes} / {pack.total_classes}</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">
                  {pack.remaining_classes} classes remaining
                </p>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    Purchased
                  </div>
                  <p className="font-medium">
                    {new Date(pack.purchase_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    Expires
                  </div>
                  <p className="font-medium">
                    {new Date(pack.expiry_date).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Status Indicator */}
              {pack.status === 'active' && (
                <div className={`border rounded-lg p-3 ${
                  isExpiringSoon(pack.expiry_date) || pack.remaining_classes <= 2
                    ? 'bg-amber-50 border-amber-200' 
                    : 'bg-green-50 border-green-200'
                }`}>
                  <div className="flex items-center gap-2">
                    {isExpiringSoon(pack.expiry_date) || pack.remaining_classes <= 2 ? (
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                    <span className={`text-sm font-medium ${
                      isExpiringSoon(pack.expiry_date) || pack.remaining_classes <= 2
                        ? 'text-amber-800' 
                        : 'text-green-800'
                    }`}>
                      {pack.remaining_classes <= 2 
                        ? `Only ${pack.remaining_classes} classes left!`
                        : daysLeft > 0 
                          ? `${daysLeft} days remaining`
                          : 'Expired'
                      }
                    </span>
                  </div>
                  
                  {(isExpiringSoon(pack.expiry_date) || pack.remaining_classes <= 2) && pack.auto_renewal && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2 w-full"
                      onClick={() => handleRenewClassPack(pack.id, pack.membership_plans.id)}
                    >
                      Renew Class Pack
                    </Button>
                  )}
                </div>
              )}

              {pack.renewal_discount_percentage > 0 && (
                <div className="text-xs text-muted-foreground">
                  Next renewal: {pack.renewal_discount_percentage}% discount applied
                </div>
              )}
            </div>
          );
        })}
        
        <div className="pt-4 border-t">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={() => setShowPurchaseDialog(true)}
          >
            Purchase Another Class Pack
          </Button>
        </div>
      </CardContent>

      <ClassPackPurchaseDialog
        open={showPurchaseDialog}
        onOpenChange={setShowPurchaseDialog}
        contactId={contactId || ''}
        onPurchaseComplete={handlePurchaseComplete}
      />
    </Card>
  );
};