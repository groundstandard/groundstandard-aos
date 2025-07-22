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
  const [memberships, setMemberships] = useState<MembershipSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (contactId) {
      fetchActiveMemberships();
    }
  }, [contactId]);

  const fetchActiveMemberships = async () => {
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
        .in('status', ['active', 'paused'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      setMemberships(data || []);
    } catch (error) {
      console.error('Error fetching memberships:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRenewMembership = async (membership: MembershipSubscription) => {
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

  const getDaysUntilExpiry = (membership: MembershipSubscription) => {
    if (!membership?.end_date) return null;
    const endDate = new Date(membership.end_date);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const isExpiringSoon = (membership: MembershipSubscription) => {
    const daysLeft = getDaysUntilExpiry(membership);
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

  if (!memberships || memberships.length === 0) {
    return (
      <Card className="card-minimal">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              Active Memberships
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowAssignDialog(true)}
            >
              <Crown className="h-4 w-4 mr-2" />
              Assign Membership
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">No active memberships found</p>
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
              onSuccess={fetchActiveMemberships}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-minimal">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Active Memberships ({memberships.length})
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowAssignDialog(true)}
          >
            <Crown className="h-4 w-4 mr-2" />
            Add Membership
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {memberships.map((membership) => {
          const daysLeft = getDaysUntilExpiry(membership);
          const plan = membership.membership_plans;

          return (
            <div key={membership.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{plan.name}</h4>
                    <Badge variant="outline" className={getStatusColor(membership.status)}>
                      {membership.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                  <div className="flex items-center gap-3 text-sm">
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

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Start:</span>{' '}
                  <span className="font-medium">
                    {new Date(membership.start_date).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">End:</span>{' '}
                  <span className="font-medium">
                    {membership.end_date ? new Date(membership.end_date).toLocaleDateString() : 'Ongoing'}
                  </span>
                </div>
              </div>

              {daysLeft !== null && (
                <div className={`flex items-center justify-between p-2 rounded text-sm ${
                  isExpiringSoon(membership) ? 'bg-amber-50 text-amber-800' : 'bg-green-50 text-green-800'
                }`}>
                  <span className="font-medium">
                    {daysLeft > 0 ? `${daysLeft} days remaining` : 'Expired'}
                  </span>
                  {isExpiringSoon(membership) && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleRenewMembership(membership)}
                    >
                      Renew
                    </Button>
                  )}
                </div>
              )}

              {membership.next_billing_date && (
                <div className="text-xs text-muted-foreground">
                  Next billing: {new Date(membership.next_billing_date).toLocaleDateString()}
                </div>
              )}
            </div>
          );
        })}

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
          onSuccess={fetchActiveMemberships}
        />
      </CardContent>
    </Card>
  );
};