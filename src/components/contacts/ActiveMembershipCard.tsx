import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Crown, Repeat, AlertTriangle, CheckCircle, ChevronDown, ChevronRight, CreditCard, DollarSign, Clock, Snowflake, Trash2, MoreHorizontal, RefreshCw, Edit } from 'lucide-react';
import { AssignMembershipDialog } from './AssignMembershipDialog';
import { DirectPaymentDialog } from '@/components/payments/DirectPaymentDialog';
import { PaymentScheduleActions } from '@/components/payments/PaymentScheduleActions';
import { EditFreezeForm } from '@/components/payments/EditFreezeForm';
import { SubscriptionRenewalDialog } from '@/components/subscription/SubscriptionRenewalDialog';

interface PaymentSchedule {
  id: string;
  scheduled_date: string;
  amount_cents: number;
  status: string;
  installment_number: number;
  total_installments: number;
  stripe_invoice_id?: string;
  payment_method_id?: string;
  is_frozen?: boolean;
  freeze_reason?: string;
  original_amount_cents?: number;
}

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
  renewal_new_rate_enabled?: boolean;
  renewal_new_rate_cents?: number;
  discount_expires_at: string | null;
  membership_plans: {
    name: string;
    description: string;
    base_price_cents: number;
    billing_cycle: string;
    is_unlimited: boolean;
    classes_per_week: number;
    renewal_new_rate_enabled?: boolean;
    renewal_new_rate_cents?: number;
  };
}

interface ActiveMembershipCardProps {
  contactId?: string;
}

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

export const ActiveMembershipCard = ({ contactId }: ActiveMembershipCardProps) => {
  const [memberships, setMemberships] = useState<MembershipSubscription[]>([]);
  const [paymentSchedules, setPaymentSchedules] = useState<Record<string, PaymentSchedule[]>>({});
  const [membershipFreezes, setMembershipFreezes] = useState<Record<string, MembershipFreeze[]>>({});
  const [expandedMemberships, setExpandedMemberships] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDeleteFreezeDialog, setShowDeleteFreezeDialog] = useState(false);
  const [showEditFreezeDialog, setShowEditFreezeDialog] = useState(false);
  const [selectedPaymentSchedule, setSelectedPaymentSchedule] = useState<PaymentSchedule | null>(null);
  const [selectedContactName, setSelectedContactName] = useState('');
  const [membershipToDelete, setMembershipToDelete] = useState<MembershipSubscription | null>(null);
  const [freezeToDelete, setFreezeToDelete] = useState<MembershipFreeze | null>(null);
  const [freezeToEdit, setFreezeToEdit] = useState<MembershipFreeze | null>(null);
  const [showSubscriptionRenewalDialog, setShowSubscriptionRenewalDialog] = useState(false);
  const [selectedMembership, setSelectedMembership] = useState<MembershipSubscription | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (contactId) {
      fetchActiveMemberships();
      fetchContactName();
    }
  }, [contactId]);

  const fetchContactName = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', contactId)
        .single();

      if (error) throw error;
      setSelectedContactName(`${data.first_name} ${data.last_name}`);
    } catch (error) {
      console.error('Error fetching contact name:', error);
    }
  };

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
      
      // Fetch payment schedules for each membership
      if (data && data.length > 0) {
        await fetchPaymentSchedules(data.map(m => m.id));
      }
    } catch (error) {
      console.error('Error fetching memberships:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentSchedules = async (membershipIds: string[]) => {
    try {
      const { data, error } = await supabase
        .from('payment_schedule')
        .select('*')
        .in('membership_subscription_id', membershipIds)
        .order('scheduled_date');

      if (error) throw error;

      // Fetch active freezes for these subscriptions
      const { data: freezeData, error: freezeError } = await supabase
        .from('membership_freezes')
        .select('*')
        .in('membership_subscription_id', membershipIds)
        .eq('status', 'active');

      if (freezeError) throw freezeError;

      // Group freezes by membership subscription ID
      const freezesByMembership = (freezeData || []).reduce((acc, freeze) => {
        const membershipId = freeze.membership_subscription_id;
        if (!acc[membershipId]) {
          acc[membershipId] = [];
        }
        acc[membershipId].push(freeze);
        return acc;
      }, {} as Record<string, MembershipFreeze[]>);

      setMembershipFreezes(freezesByMembership);

      // Apply freezes to payment schedule and group by membership subscription ID
      const grouped = (data || []).reduce((acc, schedule) => {
        const membershipId = schedule.membership_subscription_id;
        if (!acc[membershipId]) {
          acc[membershipId] = [];
        }

        const paymentDate = new Date(schedule.scheduled_date);
        
        // Check if this payment falls within any active freeze period
        const activeFreeze = (freezeData || []).find(freeze => {
          if (freeze.membership_subscription_id !== membershipId) return false;
          
          const freezeStart = new Date(freeze.start_date);
          const freezeEnd = freeze.end_date ? new Date(freeze.end_date) : null;
          
          return paymentDate >= freezeStart && 
                 (freezeEnd === null || paymentDate <= freezeEnd);
        });

        // If payment is in a freeze period, update the amount and add freeze info
        const processedSchedule = activeFreeze ? {
          ...schedule,
          amount_cents: activeFreeze.frozen_amount_cents,
          is_frozen: true,
          freeze_reason: activeFreeze.reason,
          original_amount_cents: schedule.amount_cents
        } : { 
          ...schedule, 
          is_frozen: false 
        };

        acc[membershipId].push(processedSchedule);
        return acc;
      }, {} as Record<string, PaymentSchedule[]>);

      setPaymentSchedules(grouped);
    } catch (error) {
      console.error('Error fetching payment schedules:', error);
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

  const toggleMembershipExpansion = (membershipId: string) => {
    const newExpanded = new Set(expandedMemberships);
    if (newExpanded.has(membershipId)) {
      newExpanded.delete(membershipId);
    } else {
      newExpanded.add(membershipId);
    }
    setExpandedMemberships(newExpanded);
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'past_due':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const isPastDue = (scheduledDate: string, status: string) => {
    const today = new Date();
    const paymentDate = new Date(scheduledDate);
    return paymentDate < today && status === 'pending';
  };

  const handleMakePayment = (schedule: PaymentSchedule) => {
    setSelectedPaymentSchedule(schedule);
    setShowPaymentDialog(true);
  };

  const handleDeleteMembership = (membership: MembershipSubscription) => {
    setMembershipToDelete(membership);
    setShowDeleteDialog(true);
  };

  const confirmDeleteMembership = async () => {
    if (!membershipToDelete) return;

    try {
      const { error } = await supabase
        .from('membership_subscriptions')
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancelled_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', membershipToDelete.id);

      if (error) throw error;

      toast({
        title: "Membership Cancelled",
        description: "The membership has been successfully cancelled",
      });

      setShowDeleteDialog(false);
      setMembershipToDelete(null);
      fetchActiveMemberships();
    } catch (error) {
      console.error('Error cancelling membership:', error);
      toast({
        title: "Error",
        description: "Failed to cancel membership",
        variant: "destructive",
      });
    }
  };

  const handleDeleteFreeze = (freeze: MembershipFreeze) => {
    setFreezeToDelete(freeze);
    setShowDeleteFreezeDialog(true);
  };

  const handleEditFreeze = (freeze: MembershipFreeze) => {
    setFreezeToEdit(freeze);
    setShowEditFreezeDialog(true);
  };

  const confirmDeleteFreeze = async () => {
    if (!freezeToDelete) return;

    try {
      const { error } = await supabase
        .from('membership_freezes')
        .update({ 
          status: 'ended',
          updated_at: new Date().toISOString()
        })
        .eq('id', freezeToDelete.id);

      if (error) throw error;

      toast({
        title: "Freeze Removed",
        description: "The membership freeze has been successfully removed",
      });

      setShowDeleteFreezeDialog(false);
      setFreezeToDelete(null);
      fetchActiveMemberships();
    } catch (error) {
      console.error('Error removing freeze:', error);
      toast({
        title: "Error",
        description: "Failed to remove freeze",
        variant: "destructive",
      });
    }
  };

  const handleUpdateFreeze = async (updatedFreeze: { frozen_amount_cents: number; reason: string; end_date?: string }) => {
    if (!freezeToEdit) return;

    try {
      const { error } = await supabase
        .from('membership_freezes')
        .update({
          frozen_amount_cents: updatedFreeze.frozen_amount_cents,
          reason: updatedFreeze.reason,
          end_date: updatedFreeze.end_date || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', freezeToEdit.id);

      if (error) throw error;

      toast({
        title: "Freeze Updated",
        description: "The membership freeze has been successfully updated",
      });

      setShowEditFreezeDialog(false);
      setFreezeToEdit(null);
      fetchActiveMemberships();
    } catch (error) {
      console.error('Error updating freeze:', error);
      toast({
        title: "Error",
        description: "Failed to update freeze",
        variant: "destructive",
      });
    }
  };

  const handleCustomizeRenewal = (membership: MembershipSubscription) => {
    setSelectedMembership(membership);
    setShowSubscriptionRenewalDialog(true);
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
          const schedules = paymentSchedules[membership.id] || [];
          const isExpanded = expandedMemberships.has(membership.id);

          return (
            <Collapsible key={membership.id} open={isExpanded} onOpenChange={() => toggleMembershipExpansion(membership.id)}>
              <div className="border rounded-lg">
                <CollapsibleTrigger asChild>
                  <div className="p-4 space-y-3 cursor-pointer hover:bg-accent/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{plan.name}</h4>
                          <Badge variant="outline" className={getStatusColor(membership.status)}>
                            {membership.status}
                          </Badge>
                          {schedules.length > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {schedules.filter(s => s.status === 'paid').length}/{schedules.length} payments
                            </Badge>
                          )}
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
                      <div className="flex items-center gap-2">
                        {schedules.some(s => isPastDue(s.scheduled_date, s.status)) && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Past Due
                          </Badge>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteMembership(membership);
                              }}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Cancel Membership
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
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
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRenewMembership(membership);
                            }}
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
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="border-t p-4 space-y-4">
                    {/* Active Freezes Section */}
                    {membershipFreezes[membership.id] && membershipFreezes[membership.id].length > 0 && (
                      <>
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Snowflake className="h-4 w-4" />
                          Active Freezes ({membershipFreezes[membership.id].length})
                        </div>
                        <div className="space-y-2">
                          {membershipFreezes[membership.id].map((freeze) => (
                            <div
                              key={freeze.id}
                              className="flex items-center justify-between p-3 rounded-lg border bg-blue-50/50 border-blue-200"
                            >
                              <div className="flex items-center gap-3">
                                <div className="text-sm">
                                  <div className="font-medium flex items-center gap-2">
                                    <Snowflake className="h-3 w-3 text-blue-600" />
                                    {freeze.reason}
                                  </div>
                                  <div className="text-muted-foreground">
                                    From: {new Date(freeze.start_date).toLocaleDateString()}
                                    {freeze.end_date ? ` to ${new Date(freeze.end_date).toLocaleDateString()}` : ' (Indefinite)'}
                                  </div>
                                  <div className="text-xs text-blue-600">
                                    Frozen Amount: {formatCurrency(freeze.frozen_amount_cents)}
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditFreeze(freeze);
                                  }}
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteFreeze(freeze);
                                  }}
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {/* Payment Schedule Section */}
                    {schedules.length > 0 ? (
                      <>
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Calendar className="h-4 w-4" />
                          Payment Schedule ({schedules.length} installments)
                        </div>
                        <div className="space-y-2">
                          {schedules.map((schedule) => (
                            <div
                              key={schedule.id}
                              className={`flex items-center justify-between p-3 rounded-lg border ${
                                isPastDue(schedule.scheduled_date, schedule.status) ? 'border-red-200 bg-red-50' : 'bg-card'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="text-sm">
                                  <div className="font-medium flex items-center gap-2">
                                    Payment {schedule.installment_number} of {schedule.total_installments}
                                    {schedule.is_frozen && (
                                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                                        <Snowflake className="h-3 w-3 mr-1" />
                                        Frozen
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-muted-foreground">
                                    Due: {new Date(schedule.scheduled_date).toLocaleDateString()}
                                  </div>
                                  {schedule.is_frozen && schedule.freeze_reason && (
                                    <div className="text-xs text-blue-600">
                                      Reason: {schedule.freeze_reason}
                                    </div>
                                  )}
                                </div>
                                <Badge variant="outline" className={getPaymentStatusColor(schedule.status)}>
                                  {schedule.status === 'past_due' && isPastDue(schedule.scheduled_date, schedule.status) ? 'Past Due' : schedule.status}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="text-right">
                                  <div className="font-medium">{formatCurrency(schedule.amount_cents)}</div>
                                  {schedule.is_frozen && schedule.original_amount_cents && (
                                    <div className="text-xs text-muted-foreground line-through">
                                      {formatCurrency(schedule.original_amount_cents)}
                                    </div>
                                  )}
                                </div>
                                {schedule.status === 'paid' && (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                )}
                                <PaymentScheduleActions 
                                  schedule={{
                                    ...schedule,
                                    membership_subscription_id: membership.id
                                  }}
                                  onUpdate={fetchActiveMemberships}
                                  onPayNow={handleMakePayment}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        No payment schedule available for this membership.
                      </div>
                    )}

                    {/* Renewals Section */}
                    <div className="border-t pt-4 space-y-4">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <RefreshCw className="h-4 w-4" />
                        Renewal Settings
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Auto Renewal:</span>
                          <div className="font-medium">
                            {membership.auto_renewal ? 'Enabled' : 'Disabled'}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            {membership.renewal_new_rate_enabled ? 'Custom Rate:' : 'Renewal Discount:'}
                          </span>
                          <div className="font-medium">
                            {membership.renewal_new_rate_enabled 
                              ? formatCurrency(membership.renewal_new_rate_cents || 0)
                              : `${membership.renewal_discount_percentage}%`
                            }
                          </div>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleCustomizeRenewal(membership)}
                      >
                        Customize Renewal Terms
                      </Button>
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
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

      {selectedPaymentSchedule && (
        <DirectPaymentDialog
          open={showPaymentDialog}
          onOpenChange={setShowPaymentDialog}
          contactId={contactId}
          contactName={selectedContactName}
          paymentScheduleId={selectedPaymentSchedule.id}
          prefilledAmount={selectedPaymentSchedule.amount_cents}
          prefilledDescription={`Payment ${selectedPaymentSchedule.installment_number} of ${selectedPaymentSchedule.total_installments}`}
          onSuccess={() => {
            fetchActiveMemberships();
            setSelectedPaymentSchedule(null);
          }}
        />
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Membership</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel the membership "{membershipToDelete?.membership_plans?.name}"? 
              This action will mark the membership as cancelled and stop future billing. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteMembership}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancel Membership
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteFreezeDialog} onOpenChange={setShowDeleteFreezeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Freeze</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this freeze? This will restore the original payment amounts for all future payments in this freeze period. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteFreeze}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove Freeze
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
        </AlertDialog>

        {/* Edit Freeze Dialog */}
        <Dialog open={showEditFreezeDialog} onOpenChange={setShowEditFreezeDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Freeze</DialogTitle>
              <DialogDescription>
                Update the freeze details for this membership
              </DialogDescription>
            </DialogHeader>
            {freezeToEdit && (
              <EditFreezeForm
                freeze={freezeToEdit}
                onSubmit={handleUpdateFreeze}
                onCancel={() => setShowEditFreezeDialog(false)}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Subscription Renewal Dialog */}
        {selectedMembership && (
          <SubscriptionRenewalDialog
            open={showSubscriptionRenewalDialog}
            onOpenChange={setShowSubscriptionRenewalDialog}
            subscriptionId={selectedMembership.id}
            currentAutoRenewal={selectedMembership.auto_renewal}
            currentDiscountPercentage={selectedMembership.renewal_discount_percentage}
            currentRenewalEnabled={true}
            currentRenewalNewRateEnabled={selectedMembership.renewal_new_rate_enabled || false}
            currentRenewalNewRateCents={selectedMembership.renewal_new_rate_cents || 0}
            onSuccess={() => {
              fetchActiveMemberships();
              setSelectedMembership(null);
            }}
          />
        )}
      </CardContent>
    </Card>
  );
};