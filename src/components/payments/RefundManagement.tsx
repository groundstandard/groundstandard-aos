import React, { useState } from 'react';
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  RefreshCw,
  DollarSign,
  CreditCard,
  ArrowLeft,
  Plus,
  Search,
  Calendar,
  Filter,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Refund {
  id: string;
  payment_id: string;
  student_id: string;
  amount: number;
  reason: string;
  refund_type: string;
  stripe_refund_id?: string;
  status: string;
  processed_by?: string;
  processed_at?: string;
  created_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  payments?: {
    amount: number;
    description: string;
    payment_date: string;
  };
}

interface AccountCredit {
  id: string;
  student_id: string;
  amount: number;
  source: string;
  description: string;
  balance: number;
  expires_at?: string;
  status: string;
  created_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export const RefundManagement = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [showCreditDialog, setShowCreditDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [refundForm, setRefundForm] = useState({
    payment_id: '',
    amount: '',
    reason: '',
    refund_type: 'full' as 'full' | 'partial'
  });
  
  const [creditForm, setCreditForm] = useState({
    student_id: '',
    amount: '',
    description: '',
    source: 'manual' as 'refund' | 'manual' | 'promotion' | 'overpayment',
    expires_at: ''
  });

  // Fetch refunds
  const { data: refunds, isLoading: refundsLoading } = useQuery({
    queryKey: ['refunds', searchTerm, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('refunds')
        .select(`
          *,
          profiles!refunds_student_id_fkey (first_name, last_name, email),
          payments!refunds_payment_id_fkey (amount, description, payment_date)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Filter by search term if provided
      if (searchTerm) {
        return data?.filter((refund: Refund) => 
          refund.profiles?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          refund.profiles?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          refund.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          refund.reason?.toLowerCase().includes(searchTerm.toLowerCase())
        ) || [];
      }

      return data || [];
    }
  });

  // Fetch account credits
  const { data: credits, isLoading: creditsLoading } = useQuery({
    queryKey: ['account-credits', searchTerm],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('account_credits')
        .select(`
          *,
          profiles!account_credits_student_id_fkey (first_name, last_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter by search term if provided
      if (searchTerm) {
        return data?.filter((credit: AccountCredit) => 
          credit.profiles?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          credit.profiles?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          credit.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          credit.description?.toLowerCase().includes(searchTerm.toLowerCase())
        ) || [];
      }

      return data || [];
    }
  });

  // Fetch payments for refund dropdown
  const { data: payments } = useQuery({
    queryKey: ['refundable-payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          profiles!payments_student_id_fkey (first_name, last_name, email)
        `)
        .eq('status', 'completed')
        .order('payment_date', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data || [];
    }
  });

  // Fetch students for credit dropdown
  const { data: students } = useQuery({
    queryKey: ['students-for-credits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .eq('role', 'student')
        .order('first_name');

      if (error) throw error;
      return data || [];
    }
  });

  // Process refund mutation
  const processRefundMutation = useMutation({
    mutationFn: async (formData: typeof refundForm) => {
      const { data, error } = await supabase.functions.invoke('process-refund', {
        body: {
          payment_id: formData.payment_id,
          amount: Math.round(parseFloat(formData.amount) * 100),
          reason: formData.reason,
          refund_type: formData.refund_type,
          processed_by: profile?.id
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Refund Processed',
        description: 'Refund has been processed successfully.'
      });
      setShowRefundDialog(false);
      setRefundForm({ payment_id: '', amount: '', reason: '', refund_type: 'full' });
      queryClient.invalidateQueries({ queryKey: ['refunds'] });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to process refund'
      });
    }
  });

  // Add account credit mutation
  const addCreditMutation = useMutation({
    mutationFn: async (formData: typeof creditForm) => {
      const { data, error } = await supabase
        .from('account_credits')
        .insert({
          student_id: formData.student_id,
          amount: Math.round(parseFloat(formData.amount) * 100),
          description: formData.description,
          source: formData.source,
          balance: Math.round(parseFloat(formData.amount) * 100),
          expires_at: formData.expires_at || null,
          created_by: profile?.id
        });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Credit Added',
        description: 'Account credit has been added successfully.'
      });
      setShowCreditDialog(false);
      setCreditForm({ student_id: '', amount: '', description: '', source: 'manual', expires_at: '' });
      queryClient.invalidateQueries({ queryKey: ['account-credits'] });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to add credit'
      });
    }
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'failed':
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'used':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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
                <ArrowLeft className="h-6 w-6" />
                Refunds & Credits Management
              </CardTitle>
              <CardDescription>
                Process refunds and manage account credits
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="refunds" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="refunds">Refunds</TabsTrigger>
          <TabsTrigger value="credits">Account Credits</TabsTrigger>
        </TabsList>

        <TabsContent value="refunds" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Process Refund
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Process Refund</DialogTitle>
                  <DialogDescription>Process a refund for a completed payment</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Payment</Label>
                    <Select value={refundForm.payment_id} onValueChange={(value) => setRefundForm(prev => ({ ...prev, payment_id: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment to refund" />
                      </SelectTrigger>
                      <SelectContent>
                        {payments?.map((payment) => (
                          <SelectItem key={payment.id} value={payment.id}>
                        {(payment as any).profiles?.first_name} {(payment as any).profiles?.last_name} - {formatCurrency(payment.amount)} ({payment.description})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Refund Type</Label>
                    <Select value={refundForm.refund_type} onValueChange={(value: 'full' | 'partial') => setRefundForm(prev => ({ ...prev, refund_type: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">Full Refund</SelectItem>
                        <SelectItem value="partial">Partial Refund</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {refundForm.refund_type === 'partial' && (
                    <div>
                      <Label>Refund Amount</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={refundForm.amount}
                        onChange={(e) => setRefundForm(prev => ({ ...prev, amount: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>
                  )}

                  <div>
                    <Label>Reason</Label>
                    <Textarea
                      value={refundForm.reason}
                      onChange={(e) => setRefundForm(prev => ({ ...prev, reason: e.target.value }))}
                      placeholder="Reason for refund..."
                    />
                  </div>

                  <Button 
                    onClick={() => processRefundMutation.mutate(refundForm)}
                    disabled={processRefundMutation.isPending}
                    className="w-full"
                  >
                    {processRefundMutation.isPending ? 'Processing...' : 'Process Refund'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Refunds</CardTitle>
            </CardHeader>
            <CardContent>
              {refundsLoading ? (
                <div className="text-center py-6">Loading refunds...</div>
              ) : refunds?.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">No refunds found</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {refunds?.map((refund) => (
                      <TableRow key={refund.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {refund.profiles?.first_name} {refund.profiles?.last_name}
                            </p>
                            <p className="text-sm text-muted-foreground">{refund.profiles?.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrency(refund.amount)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {refund.refund_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{refund.reason}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(refund.status)}>
                            {refund.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{format(new Date(refund.created_at), 'MMM dd, yyyy')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credits" className="space-y-6">
          <div className="flex items-center justify-end">
            <Dialog open={showCreditDialog} onOpenChange={setShowCreditDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Credit
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Account Credit</DialogTitle>
                  <DialogDescription>Add credit to a student's account</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Student</Label>
                    <Select value={creditForm.student_id} onValueChange={(value) => setCreditForm(prev => ({ ...prev, student_id: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select student" />
                      </SelectTrigger>
                      <SelectContent>
                        {students?.map((student) => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.first_name} {student.last_name} ({student.email})
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
                      value={creditForm.amount}
                      onChange={(e) => setCreditForm(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <Label>Source</Label>
                    <Select value={creditForm.source} onValueChange={(value: any) => setCreditForm(prev => ({ ...prev, source: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual Credit</SelectItem>
                        <SelectItem value="refund">Refund Credit</SelectItem>
                        <SelectItem value="promotion">Promotion</SelectItem>
                        <SelectItem value="overpayment">Overpayment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={creditForm.description}
                      onChange={(e) => setCreditForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Description of credit..."
                    />
                  </div>

                  <div>
                    <Label>Expires At (Optional)</Label>
                    <Input
                      type="date"
                      value={creditForm.expires_at}
                      onChange={(e) => setCreditForm(prev => ({ ...prev, expires_at: e.target.value }))}
                    />
                  </div>

                  <Button 
                    onClick={() => addCreditMutation.mutate(creditForm)}
                    disabled={addCreditMutation.isPending}
                    className="w-full"
                  >
                    {addCreditMutation.isPending ? 'Adding...' : 'Add Credit'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Account Credits</CardTitle>
            </CardHeader>
            <CardContent>
              {creditsLoading ? (
                <div className="text-center py-6">Loading credits...</div>
              ) : credits?.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">No credits found</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Expires</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {credits?.map((credit) => (
                      <TableRow key={credit.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {credit.profiles?.first_name} {credit.profiles?.last_name}
                            </p>
                            <p className="text-sm text-muted-foreground">{credit.profiles?.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrency(credit.amount)}</TableCell>
                        <TableCell>
                          <span className={credit.balance > 0 ? 'text-green-600 font-medium' : 'text-muted-foreground'}>
                            {formatCurrency(credit.balance)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {credit.source}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{credit.description}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(credit.status)}>
                            {credit.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {credit.expires_at ? (
                            <div className="flex items-center gap-1">
                              {new Date(credit.expires_at) < new Date() && (
                                <AlertCircle className="h-4 w-4 text-red-500" />
                              )}
                              {format(new Date(credit.expires_at), 'MMM dd, yyyy')}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Never</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};