import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Crown, Repeat, AlertTriangle, CheckCircle } from 'lucide-react';
import { AssignMembershipDialog } from './AssignMembershipDialog';

interface MembershipSubscription {
  id: string;
  membership_plan_id: string;
  status: string;
  start_date: string;
  end_date: string;
  next_billing_date: string;
  cycle_number: number;
  auto_renewal: boolean;
  renewal_discount_percentage: number;
  discount_expires_at: string | null;
  membership_plans: {
    name: string;
    description: string;
    base_price_cents: number;
    billing_cycle: string;
    is_unlimited: boolean;
    classes_per_week: number;
  };
}

interface ActiveMembershipCardProps {
  contactId?: string;
}

export const ActiveMembershipCard = ({ contactId }: ActiveMembershipCardProps) => {
  const [membership, setMembership] = useState<MembershipSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (contactId) {
      fetchActiveMembership();
    }
  }, [contactId]);

  const fetchActiveMembership = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('membership_subscriptions')
        .select(`
          *,
          membership_plans (
            name,
            description,
            base_price_cents,
            billing_cycle,
            is_unlimited,
            classes_per_week
          )
        `)
        .eq('profile_id', contactId)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setMembership(data);
    } catch (error) {
      console.error('Error fetching membership:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRenewMembership = async () => {
    if (!membership) return;

    try {
      const { data, error } = await supabase.functions.invoke('create-membership-renewal', {
        body: {
          subscriptionId: membership.id,
          planId: membership.membership_plan_id
        }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
        toast({
          title: "Renewal Payment Created",
          description: "Opening payment window...",
        });
      }
    } catch (error) {
      console.error('Error creating renewal:', error);
      toast({
        title: "Error",
        description: "Failed to create renewal payment",
        variant: "destructive",
      });
    }
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
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDaysUntilExpiry = () => {
    if (!membership?.end_date) return null;
    const endDate = new Date(membership.end_date);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const isExpiringSoon = () => {
    const daysLeft = getDaysUntilExpiry();
    return daysLeft !== null && daysLeft <= 30 && daysLeft > 0;
  };

  if (loading) {
    return (
      <Card className="card-minimal">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading membership...</div>
        </CardContent>
      </Card>
    );
  }

  if (!membership) {
    return (
      <Card className="card-minimal">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Active Membership
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">No active membership found</p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowAssignDialog(true)}
            >
              Assign Membership
            </Button>
            <AssignMembershipDialog
              open={showAssignDialog}
              onOpenChange={setShowAssignDialog}
              contact={{ 
                id: contactId || '', 
                first_name: '', 
                last_name: '', 
                email: '', 
                membership_status: '' 
              }}
              onSuccess={fetchActiveMembership}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  const daysLeft = getDaysUntilExpiry();
  const plan = membership.membership_plans;

  return (
    <Card className="card-minimal shadow-elegant">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5" />
          Active Membership
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">{plan.name}</h3>
              <Badge variant="outline" className={getStatusColor(membership.status)}>
                {membership.status}
              </Badge>
              {plan.billing_cycle === 'annual' && (
                <Badge variant="secondary" className="gap-1">
                  <Repeat className="h-3 w-3" />
                  12-Month Cycle
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{plan.description}</p>
            <div className="flex items-center gap-4 text-sm">
              <span className="font-medium">
                {formatCurrency(plan.base_price_cents)} / {plan.billing_cycle}
              </span>
              {plan.is_unlimited ? (
                <span className="text-primary">Unlimited Classes</span>
              ) : (
                <span>{plan.classes_per_week} classes/week</span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="h-3 w-3" />
              Start Date
            </div>
            <p className="font-medium">
              {new Date(membership.start_date).toLocaleDateString()}
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="h-3 w-3" />
              End Date
            </div>
            <p className="font-medium">
              {membership.end_date ? new Date(membership.end_date).toLocaleDateString() : 'Ongoing'}
            </p>
          </div>
        </div>

        {plan.billing_cycle === 'annual' && (
          <div className="border rounded-lg p-3 bg-muted/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">12-Month Cycle #{membership.cycle_number}</p>
                <p className="text-xs text-muted-foreground">
                  {membership.auto_renewal ? 'Auto-renewal enabled' : 'Manual renewal required'}
                </p>
              </div>
              {membership.renewal_discount_percentage > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {membership.renewal_discount_percentage}% discount
                </Badge>
              )}
            </div>
            
            {membership.discount_expires_at && (
              <div className="mt-2 text-xs text-amber-600">
                Discount expires: {new Date(membership.discount_expires_at).toLocaleDateString()}
              </div>
            )}
          </div>
        )}

        {daysLeft !== null && (
          <div className={`border rounded-lg p-3 ${
            isExpiringSoon() ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'
          }`}>
            <div className="flex items-center gap-2">
              {isExpiringSoon() ? (
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
              <span className={`text-sm font-medium ${
                isExpiringSoon() ? 'text-amber-800' : 'text-green-800'
              }`}>
                {daysLeft > 0 ? `${daysLeft} days remaining` : 'Expired'}
              </span>
            </div>
            
            {isExpiringSoon() && plan.billing_cycle === 'annual' && (
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2 w-full"
                onClick={handleRenewMembership}
              >
                Renew for Next 12-Month Cycle
              </Button>
            )}
          </div>
        )}

        {membership.next_billing_date && (
          <div className="text-xs text-muted-foreground">
            Next billing: {new Date(membership.next_billing_date).toLocaleDateString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};