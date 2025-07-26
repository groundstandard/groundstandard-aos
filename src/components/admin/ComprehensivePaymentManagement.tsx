import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  DollarSign,
  CreditCard,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Calendar as CalendarIcon,
  Users,
  Clock,
  Mail,
  FileText,
  Download,
  Plus,
  Settings,
  Zap,
  BarChart3,
  Target,
  RefreshCw,
  Link as LinkIcon,
  Bell,
  Calculator,
  Eye,
  ArrowLeft,
  RotateCcw,
  Crown
} from 'lucide-react';
import { RefundManagement } from '@/components/payments/RefundManagement';
import { TaxManagement } from '@/components/payments/TaxManagement';
import { PaymentAnalytics } from '@/components/payments/PaymentAnalytics';
import { PaymentProcessing } from '@/components/payments/PaymentProcessing';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ComprehensivePaymentManagementProps {
  navigate?: (path: string) => void;
}

interface PaymentAnalytics {
  total_revenue: number;
  total_payments: number;
  successful_payments: number;
  failed_payments: number;
  refunded_amount: number;
  outstanding_amount: number;
  average_payment_value: number;
  payment_conversion_rate: number;
  period_start: string;
  period_end: string;
}

interface PaymentSchedule {
  id: string;
  student_id: string;
  amount: number;
  frequency: string;
  next_payment_date: string;
  status: string;
  profiles?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface PaymentReminder {
  id: string;
  student_id: string;
  payment_due_date: string;
  amount: number;
  reminder_type: string;
  status: string;
  sent_at?: string;
  profiles?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface LateFee {
  id: string;
  payment_id: string;
  student_id: string;
  original_amount: number;
  late_fee_amount: number;
  days_overdue: number;
  status: string;
  profiles?: {
    first_name: string;
    last_name: string;
  };
}

type DateRange = {
  from: Date;
  to: Date;
};

export const ComprehensivePaymentManagement = ({ navigate }: ComprehensivePaymentManagementProps) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  
  const [activeTab, setActiveTab] = useState('overview');
  const [showPaymentLinkDialog, setShowPaymentLinkDialog] = useState(false);
  const [showReminderDialog, setShowReminderDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  
  // Form states
  const [paymentLinkForm, setPaymentLinkForm] = useState({
    contact_id: '',
    amount: '',
    description: '',
    expires_in_hours: '24'
  });
  
  const [generatedPaymentLink, setGeneratedPaymentLink] = useState<string | null>(null);
  
  const [reminderForm, setReminderForm] = useState({
    contact_id: '',
    payment_due_date: '',
    amount: '',
    reminder_type: 'first_notice'
  });
  
  const [scheduleForm, setScheduleForm] = useState({
    contact_id: '',
    membership_plan_id: ''
  });
  
  const [selectedContact, setSelectedContact] = useState<any>(null);

  // Fetch payment analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['payment-analytics', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_analytics')
        .select('*')
        .gte('period_start', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('period_end', format(dateRange.to, 'yyyy-MM-dd'))
        .order('period_start', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    }
  });

  // Fetch payment schedules
  const { data: schedules } = useQuery({
    queryKey: ['payment-schedules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_schedules')
        .select('*')
        .eq('status', 'active')
        .order('next_payment_date', { ascending: true });

      if (error) throw error;

      // Fetch profile data separately for each schedule
      const schedulesWithProfiles = await Promise.all(
        (data || []).map(async (schedule) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name, email')
            .eq('id', schedule.student_id)
            .single();
          
          return {
            ...schedule,
            profiles: profile
          };
        })
      );
      
      return schedulesWithProfiles;
    }
  });

  // Fetch payment reminders
  const { data: reminders } = useQuery({
    queryKey: ['payment-reminders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_reminders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch profile data separately for each reminder
      const remindersWithProfiles = await Promise.all(
        (data || []).map(async (reminder) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name, email')
            .eq('id', reminder.student_id)
            .single();
          
          return {
            ...reminder,
            profiles: profile
          };
        })
      );
      
      return remindersWithProfiles;
    }
  });

  // Fetch late fees
  const { data: lateFees } = useQuery({
    queryKey: ['late-fees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('late_fees')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profile data separately for each late fee
      const lateFeesWithProfiles = await Promise.all(
        (data || []).map(async (fee) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', fee.student_id)
            .single();
          
          return {
            ...fee,
            profiles: profile
          };
        })
      );
      
      return lateFeesWithProfiles;
    }
  });

  // Fetch all contacts for dropdowns
  const { data: contacts } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('role', ['student', 'member'])
        .order('first_name');

      if (error) throw error;
      return data;
    }
  });

  // Fetch recent payments for activity feed
  const { data: recentPayments } = useQuery({
    queryKey: ['recent-payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Fetch profile data separately for each payment
      const paymentsWithProfiles = await Promise.all(
        (data || []).map(async (payment) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name, email')
            .eq('id', payment.student_id)
            .single();
          
          return {
            ...payment,
            profiles: profile
          };
        })
      );
      
      return paymentsWithProfiles;
    }
  });

  // Fetch active membership plans for the recurring setup dialog
  const { data: membershipPlans } = useQuery({
    queryKey: ['membership-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('membership_plans')
        .select('id, name, description, base_price_cents, billing_cycle, classes_per_week, is_unlimited, trial_days, setup_fee_cents')
        .eq('is_active', true)
        .order('base_price_cents', { ascending: true });

      if (error) throw error;
      return data;
    }
  });

  // Create payment link mutation
  const createPaymentLinkMutation = useMutation({
    mutationFn: async (formData: typeof paymentLinkForm) => {
      const { data, error } = await supabase.functions.invoke('create-payment-link', {
        body: formData
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: 'Payment Link Created',
        description: 'Payment link has been generated successfully.'
      });
      setGeneratedPaymentLink(data.url);
      setPaymentLinkForm({ contact_id: '', amount: '', description: '', expires_in_hours: '24' });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create payment link'
      });
    }
  });

  // Send reminder mutation
  const sendReminderMutation = useMutation({
    mutationFn: async (formData: typeof reminderForm) => {
      const { data, error } = await supabase.functions.invoke('send-payment-reminder', {
        body: formData
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Reminder Sent',
        description: 'Payment reminder has been sent successfully.'
      });
      setShowReminderDialog(false);
      setReminderForm({ contact_id: '', payment_due_date: '', amount: '', reminder_type: 'first_notice' });
      queryClient.invalidateQueries({ queryKey: ['payment-reminders'] });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to send reminder'
      });
    }
  });

  // Handle contact selection
  const handleContactSelect = async (contactId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, membership_status')
      .eq('id', contactId)
      .single();
    
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load contact information'
      });
      return;
    }
    
    setSelectedContact(data);
    setScheduleForm({ contact_id: contactId, membership_plan_id: '' });
  };

  // Format price helper
  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  // Generate financial report mutation
  const generateReportMutation = useMutation({
    mutationFn: async (reportType: string) => {
      const { data, error } = await supabase.functions.invoke('generate-financial-report', {
        body: {
          report_type: reportType,
          period_start: format(dateRange.from, 'yyyy-MM-dd'),
          period_end: format(dateRange.to, 'yyyy-MM-dd'),
          generated_by: profile?.id
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Report Generated',
        description: 'Financial report has been generated successfully.'
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to generate report'
      });
    }
  });

  // Calculate late fees
  const calculateLateFeesMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('calculate_late_fees');
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Late Fees Calculated',
        description: 'Late fees have been calculated for overdue payments.'
      });
      queryClient.invalidateQueries({ queryKey: ['late-fees'] });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to calculate late fees'
      });
    }
  });

  if (profile?.role !== 'admin' && profile?.role !== 'owner') {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Access denied. Admin privileges required.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-6 w-6" />
                Comprehensive Payment Management
              </CardTitle>
              <CardDescription>
                Advanced payment processing, analytics, and automation
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from && dateRange.to 
                      ? `${format(dateRange.from, "MMM dd")} - ${format(dateRange.to, "MMM dd, yyyy")}`
                      : "Select date range"
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={dateRange}
                    onSelect={(range) => {
                      if (range?.from && range?.to) {
                        setDateRange({ from: range.from, to: range.to });
                      }
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>


      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Create Payment Link */}
        <Dialog open={showPaymentLinkDialog} onOpenChange={setShowPaymentLinkDialog}>
          <DialogTrigger asChild>
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-3">
                <div className="flex items-center gap-3 mb-1">
                  <LinkIcon className="h-6 w-6 text-blue-600" />
                  <h3 className="font-semibold text-sm">Create Payment Link</h3>
                </div>
                <p className="text-xs text-muted-foreground">Generate payment links for contacts</p>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Payment Link</DialogTitle>
              <DialogDescription>Generate a payment link for a specific contact</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Contact</Label>
                <Select value={paymentLinkForm.contact_id} onValueChange={(value) => setPaymentLinkForm(prev => ({ ...prev, contact_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Contact" />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts?.map((contact) => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.first_name} {contact.last_name} ({contact.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={paymentLinkForm.amount}
                  onChange={(e) => setPaymentLinkForm(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label>Description</Label>
                <Input
                  value={paymentLinkForm.description}
                  onChange={(e) => setPaymentLinkForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Payment description"
                />
              </div>

              <div>
                <Label>Expires In (Hours)</Label>
                <Select value={paymentLinkForm.expires_in_hours} onValueChange={(value) => setPaymentLinkForm(prev => ({ ...prev, expires_in_hours: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Hour</SelectItem>
                    <SelectItem value="6">6 Hours</SelectItem>
                    <SelectItem value="24">24 Hours</SelectItem>
                    <SelectItem value="72">3 Days</SelectItem>
                    <SelectItem value="168">1 Week</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {generatedPaymentLink && (
                <div className="space-y-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <Label className="text-green-800 font-medium">Generated Payment Link</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      value={generatedPaymentLink} 
                      readOnly 
                      className="bg-white text-sm"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedPaymentLink);
                        toast({
                          title: 'Copied!',
                          description: 'Payment link copied to clipboard'
                        });
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setGeneratedPaymentLink(null);
                        setShowPaymentLinkDialog(false);
                      }}
                    >
                      Close
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(generatedPaymentLink, '_blank')}
                    >
                      Open Link
                    </Button>
                  </div>
                </div>
              )}

              <Button 
                onClick={() => createPaymentLinkMutation.mutate(paymentLinkForm)}
                disabled={createPaymentLinkMutation.isPending || generatedPaymentLink !== null}
                className="w-full"
              >
                {createPaymentLinkMutation.isPending ? 'Creating...' : 'Create Payment Link'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Setup Recurring */}
        <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
          <DialogTrigger asChild>
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-3">
                <div className="flex items-center gap-3 mb-1">
                  <Clock className="h-6 w-6 text-green-600" />
                  <h3 className="font-semibold text-sm">Setup Recurring</h3>
                </div>
                <p className="text-xs text-muted-foreground">Create payment schedules</p>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Assign Membership
              </DialogTitle>
              <DialogDescription>
                Assign a membership plan to a contact
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {!selectedContact ? (
                <div>
                  <Label>Contact</Label>
                  <Select value={scheduleForm.contact_id} onValueChange={handleContactSelect}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select Contact" />
                    </SelectTrigger>
                    <SelectContent>
                      {contacts?.map((contact) => (
                        <SelectItem key={contact.id} value={contact.id}>
                          {contact.first_name} {contact.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Name:</span> {selectedContact.first_name} {selectedContact.last_name}
                      </div>
                      <div>
                        <span className="font-medium">Email:</span> {selectedContact.email}
                      </div>
                      <div>
                        <span className="font-medium">Current Status:</span>
                        <Badge className="ml-2" variant={selectedContact.membership_status === 'active' ? 'default' : 'secondary'}>
                          {selectedContact.membership_status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {selectedContact && (
                <>
                  <div>
                    <Label htmlFor="membership-plan">Select Membership Plan</Label>
                    <Select value={scheduleForm.membership_plan_id} onValueChange={(value) => 
                      setScheduleForm({...scheduleForm, membership_plan_id: value})
                    }>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Choose a membership plan" />
                      </SelectTrigger>
                      <SelectContent>
                        {membershipPlans?.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            <div className="flex justify-between items-center w-full">
                              <span>{plan.name}</span>
                              <span className="ml-4 font-medium">
                                {formatPrice(plan.base_price_cents)}/{plan.billing_cycle}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {scheduleForm.membership_plan_id && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <DollarSign className="h-5 w-5" />
                          Plan Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {(() => {
                          const selectedPlanData = membershipPlans?.find(plan => plan.id === scheduleForm.membership_plan_id);
                          if (!selectedPlanData) return null;
                          
                          return (
                            <>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="font-medium">Price:</span> {formatPrice(selectedPlanData.base_price_cents)}
                                </div>
                                <div>
                                  <span className="font-medium">Billing:</span> {selectedPlanData.billing_cycle}
                                </div>
                                <div>
                                  <span className="font-medium">Classes:</span> 
                                  {selectedPlanData.is_unlimited ? ' Unlimited' : ` ${selectedPlanData.classes_per_week}/week`}
                                </div>
                                {selectedPlanData.setup_fee_cents > 0 && (
                                  <div>
                                    <span className="font-medium">Setup Fee:</span> {formatPrice(selectedPlanData.setup_fee_cents)}
                                  </div>
                                )}
                              </div>
                              {selectedPlanData.trial_days > 0 && (
                                <div className="flex items-center gap-2 text-sm text-green-600">
                                  <CalendarIcon className="h-4 w-4" />
                                  {selectedPlanData.trial_days} day free trial included
                                </div>
                              )}
                              {selectedPlanData.description && (
                                <p className="text-sm text-muted-foreground">{selectedPlanData.description}</p>
                              )}
                            </>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => {
                setShowScheduleDialog(false);
                setSelectedContact(null);
                setScheduleForm({ contact_id: '', membership_plan_id: '' });
              }}>
                Cancel
              </Button>
              <Button 
                disabled={!scheduleForm.contact_id || !scheduleForm.membership_plan_id}
                className="min-w-[120px]"
              >
                Proceed to Payment
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Send Reminder */}
        <Dialog open={showReminderDialog} onOpenChange={setShowReminderDialog}>
          <DialogTrigger asChild>
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-3">
                <div className="flex items-center gap-3 mb-1">
                  <Bell className="h-6 w-6 text-orange-600" />
                  <h3 className="font-semibold text-sm">Send Reminder</h3>
                </div>
                <p className="text-xs text-muted-foreground">Send payment reminders</p>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Payment Reminder</DialogTitle>
              <DialogDescription>Send a payment reminder to a contact</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Contact</Label>
                <Select value={reminderForm.contact_id} onValueChange={(value) => 
                  setReminderForm({...reminderForm, contact_id: value})
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Contact" />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts?.map((contact) => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.first_name} {contact.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Payment Due Date</Label>
                <Input
                  type="date"
                  value={reminderForm.payment_due_date}
                  onChange={(e) => setReminderForm({...reminderForm, payment_due_date: e.target.value})}
                />
              </div>
              <div>
                <Label>Amount ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={reminderForm.amount}
                  onChange={(e) => setReminderForm({...reminderForm, amount: e.target.value})}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>Reminder Type</Label>
                <Select value={reminderForm.reminder_type} onValueChange={(value) => 
                  setReminderForm({...reminderForm, reminder_type: value})
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="first_notice">First Notice</SelectItem>
                    <SelectItem value="second_notice">Second Notice</SelectItem>
                    <SelectItem value="final_notice">Final Notice</SelectItem>
                    <SelectItem value="overdue">Overdue Notice</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={() => sendReminderMutation.mutate(reminderForm)}
                disabled={sendReminderMutation.isPending}
                className="w-full"
              >
                {sendReminderMutation.isPending ? 'Sending...' : 'Send Reminder'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Calculate Late Fees */}
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => calculateLateFeesMutation.mutate()}
        >
          <CardContent className="p-3">
            <div className="flex items-center gap-3 mb-1">
              <Calculator className="h-6 w-6 text-red-600" />
              <h3 className="font-semibold text-sm">Calculate Late Fees</h3>
            </div>
            <p className="text-xs text-muted-foreground">Process overdue payments</p>
          </CardContent>
        </Card>

        {/* Refunds & Credits */}
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setActiveTab('refunds')}
        >
          <CardContent className="p-3">
            <div className="flex items-center gap-3 mb-1">
              <RotateCcw className="h-6 w-6 text-green-600" />
              <h3 className="font-semibold text-sm">Refunds & Credits</h3>
            </div>
            <p className="text-xs text-muted-foreground">Process refunds and manage credits</p>
          </CardContent>
        </Card>

        {/* Tax Management */}
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setActiveTab('taxes')}
        >
          <CardContent className="p-3">
            <div className="flex items-center gap-3 mb-1">
              <Calculator className="h-6 w-6 text-purple-600" />
              <h3 className="font-semibold text-sm">Tax Management</h3>
            </div>
            <p className="text-xs text-muted-foreground">Configure tax rates and compliance</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="processing">Processing</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="schedules">Schedules</TabsTrigger>
          <TabsTrigger value="reminders">Reminders</TabsTrigger>
          <TabsTrigger value="refunds">Refunds</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentPayments && recentPayments.length > 0 ? (
                    recentPayments.slice(0, 5).map((payment) => {
                      const getStatusBadge = (status: string) => {
                        const statusConfig = {
                          completed: { className: "bg-green-50 text-green-700", label: "Success" },
                          pending: { className: "bg-yellow-50 text-yellow-700", label: "Pending" },
                          scheduled: { className: "bg-purple-50 text-purple-700", label: "Scheduled" },
                          failed: { className: "bg-red-50 text-red-700", label: "Failed" },
                          processing: { className: "bg-blue-50 text-blue-700", label: "Processing" }
                        };
                        return statusConfig[status as keyof typeof statusConfig] || 
                               { className: "bg-gray-50 text-gray-700", label: status };
                      };
                      
                      const config = getStatusBadge(payment.status);
                      const customerName = payment.profiles 
                        ? `${payment.profiles.first_name} ${payment.profiles.last_name}`
                        : 'Unknown Customer';
                        
                      return (
                        <div key={payment.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={config.className}>
                              {config.label}
                            </Badge>
                            <span className="text-sm">
                              {payment.status === 'scheduled' 
                                ? `Payment scheduled for ${customerName}` 
                                : `Payment ${payment.status} from ${customerName}`
                              }
                            </span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {formatPrice(payment.amount)}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No recent payment activity
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Analytics Cards */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${((analytics?.total_revenue || 0) / 100).toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {analytics?.successful_payments || 0} successful payments
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(analytics?.payment_conversion_rate || 0).toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Payment success rate
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${((analytics?.outstanding_amount || 0) / 100).toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Pending payments
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Payment</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${((analytics?.average_payment_value || 0) / 100).toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Per transaction
                  </p>
                </CardContent>
              </Card>
            </div>

          </div>
        </TabsContent>

        <TabsContent value="schedules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Schedules</CardTitle>
              <CardDescription>Manage recurring payment schedules</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Next Payment</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schedules?.map((schedule) => (
                      <TableRow key={schedule.id}>
                        <TableCell>
                          {schedule.profiles?.first_name} {schedule.profiles?.last_name}
                        </TableCell>
                        <TableCell>${(schedule.amount / 100).toFixed(2)}</TableCell>
                        <TableCell className="capitalize">{schedule.frequency}</TableCell>
                        <TableCell>{format(new Date(schedule.next_payment_date), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>
                          <Badge variant={schedule.status === 'active' ? 'default' : 'secondary'}>
                            {schedule.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reminders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Reminders</CardTitle>
              <CardDescription>Track sent and pending payment reminders</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sent At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reminders?.map((reminder) => (
                      <TableRow key={reminder.id}>
                        <TableCell>
                          {reminder.profiles?.first_name} {reminder.profiles?.last_name}
                        </TableCell>
                        <TableCell>${(reminder.amount / 100).toFixed(2)}</TableCell>
                        <TableCell>{format(new Date(reminder.payment_due_date), 'MMM dd, yyyy')}</TableCell>
                        <TableCell className="capitalize">{reminder.reminder_type.replace('_', ' ')}</TableCell>
                        <TableCell>
                          <Badge variant={reminder.status === 'sent' ? 'default' : 'secondary'}>
                            {reminder.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {reminder.sent_at ? format(new Date(reminder.sent_at), 'MMM dd, HH:mm') : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="late-fees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Late Fees</CardTitle>
              <CardDescription>Manage late fees for overdue payments</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Original Amount</TableHead>
                      <TableHead>Late Fee</TableHead>
                      <TableHead>Days Overdue</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lateFees?.map((fee) => (
                      <TableRow key={fee.id}>
                        <TableCell>
                          {fee.profiles?.first_name} {fee.profiles?.last_name}
                        </TableCell>
                        <TableCell>${(fee.original_amount / 100).toFixed(2)}</TableCell>
                        <TableCell>${(fee.late_fee_amount / 100).toFixed(2)}</TableCell>
                        <TableCell>{fee.days_overdue} days</TableCell>
                        <TableCell>
                          <Badge variant={
                            fee.status === 'applied' ? 'default' : 
                            fee.status === 'waived' ? 'secondary' : 'outline'
                          }>
                            {fee.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="processing" className="space-y-6">
          <PaymentProcessing />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <PaymentAnalytics />
        </TabsContent>

        <TabsContent value="refunds" className="space-y-6">
          <RefundManagement />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Financial Reports</CardTitle>
              <CardDescription>Generate and download financial reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  variant="outline" 
                  className="h-20"
                  onClick={() => generateReportMutation.mutate('monthly')}
                  disabled={generateReportMutation.isPending}
                >
                  <div className="text-center">
                    <FileText className="h-6 w-6 mx-auto mb-1" />
                    <div>Monthly Report</div>
                  </div>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20"
                  onClick={() => generateReportMutation.mutate('quarterly')}
                  disabled={generateReportMutation.isPending}
                >
                  <div className="text-center">
                    <BarChart3 className="h-6 w-6 mx-auto mb-1" />
                    <div>Quarterly Report</div>
                  </div>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20"
                  onClick={() => generateReportMutation.mutate('tax')}
                  disabled={generateReportMutation.isPending}
                >
                  <div className="text-center">
                    <Calculator className="h-6 w-6 mx-auto mb-1" />
                    <div>Tax Report</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};