import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  RefreshCw 
} from 'lucide-react';
import { format } from 'date-fns';

type SortField = 'created_at' | 'amount' | 'status' | 'payment_method';
type SortDirection = 'asc' | 'desc';

interface PaymentWithProfile {
  id: string;
  student_id: string;
  amount: number;
  status: string;
  payment_method: string;
  description: string;
  created_at: string;
  payment_date: string;
  stripe_payment_intent_id?: string;
  profiles?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface RefundWithDetails {
  id: string;
  payment_id: string;
  student_id: string;
  amount: number;
  reason: string;
  refund_type: string;
  status: string;
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

export const PaymentLogContent = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Fetch all payments
  const { data: payments, isLoading: paymentsLoading, refetch: refetchPayments } = useQuery({
    queryKey: ['payment-log', searchTerm, statusFilter, sortField, sortDirection],
    queryFn: async () => {
      let query = supabase
        .from('payments')
        .select('*')
        .order(sortField, { ascending: sortDirection === 'asc' });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch profile data for each payment
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

      // Filter by search term
      const filtered = paymentsWithProfiles.filter(payment => {
        if (!searchTerm) return true;
        
        const customerName = payment.profiles 
          ? `${payment.profiles.first_name} ${payment.profiles.last_name}`.toLowerCase()
          : '';
        const email = payment.profiles?.email?.toLowerCase() || '';
        const description = payment.description?.toLowerCase() || '';
        const paymentMethod = payment.payment_method?.toLowerCase() || '';
        
        return customerName.includes(searchTerm.toLowerCase()) ||
               email.includes(searchTerm.toLowerCase()) ||
               description.includes(searchTerm.toLowerCase()) ||
               paymentMethod.includes(searchTerm.toLowerCase());
      });

      return filtered;
    }
  });

  // Fetch all refunds
  const { data: refunds, isLoading: refundsLoading, refetch: refetchRefunds } = useQuery({
    queryKey: ['refund-log', searchTerm],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('refunds')
        .select(`
          *,
          payments!refunds_payment_id_fkey(amount, description, payment_date)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profile data for each refund
      const refundsWithProfiles = await Promise.all(
        (data || []).map(async (refund) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name, email')
            .eq('id', refund.student_id)
            .single();
          
          return {
            ...refund,
            profiles: profile
          };
        })
      );

      // Filter by search term
      const filtered = refundsWithProfiles.filter(refund => {
        if (!searchTerm) return true;
        
        const customerName = refund.profiles 
          ? `${refund.profiles.first_name} ${refund.profiles.last_name}`.toLowerCase()
          : '';
        const email = refund.profiles?.email?.toLowerCase() || '';
        const reason = refund.reason?.toLowerCase() || '';
        
        return customerName.includes(searchTerm.toLowerCase()) ||
               email.includes(searchTerm.toLowerCase()) ||
               reason.includes(searchTerm.toLowerCase());
      });

      return filtered;
    }
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'bg-green-50 text-green-700 border-green-200',
      pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      scheduled: 'bg-purple-50 text-purple-700 border-purple-200',
      failed: 'bg-red-50 text-red-700 border-red-200',
      processing: 'bg-blue-50 text-blue-700 border-blue-200',
      refunded: 'bg-orange-50 text-orange-700 border-orange-200'
    };
    
    return (
      <Badge className={variants[status as keyof typeof variants] || 'bg-gray-50 text-gray-700 border-gray-200'}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleRefresh = () => {
    refetchPayments();
    refetchRefunds();
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Payment & Refund Log</CardTitle>
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
          <CardDescription>
            Comprehensive log of all payments and refunds with advanced filtering and sorting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by customer, email, description, or payment method..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="payments" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="refunds">Refunds</TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>
                Complete history of all payments with sortable columns
              </CardDescription>
            </CardHeader>
            <CardContent>
              {paymentsLoading ? (
                <div className="text-center py-8">Loading payments...</div>
              ) : !payments?.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  No payments found matching your criteria
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort('amount')}
                        >
                          <div className="flex items-center gap-1">
                            Amount
                            {getSortIcon('amount')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort('status')}
                        >
                          <div className="flex items-center gap-1">
                            Status
                            {getSortIcon('status')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort('payment_method')}
                        >
                          <div className="flex items-center gap-1">
                            Method
                            {getSortIcon('payment_method')}
                          </div>
                        </TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort('created_at')}
                        >
                          <div className="flex items-center gap-1">
                            Date
                            {getSortIcon('created_at')}
                          </div>
                        </TableHead>
                        <TableHead>Payment ID</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {payment.profiles?.first_name} {payment.profiles?.last_name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {payment.profiles?.email}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(payment.amount)}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(payment.status)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{payment.payment_method}</Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {payment.description}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(payment.created_at), 'MMM dd, yyyy HH:mm')}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {payment.id.slice(0, 8)}...
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="refunds" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Refund History</CardTitle>
              <CardDescription>
                Complete history of all refunds and their details
              </CardDescription>
            </CardHeader>
            <CardContent>
              {refundsLoading ? (
                <div className="text-center py-8">Loading refunds...</div>
              ) : !refunds?.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  No refunds found matching your criteria
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Refund Amount</TableHead>
                        <TableHead>Original Amount</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Processed Date</TableHead>
                        <TableHead>Refund ID</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {refunds.map((refund) => (
                        <TableRow key={refund.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {refund.profiles?.first_name} {refund.profiles?.last_name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {refund.profiles?.email}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold text-red-600">
                            -{formatCurrency(refund.amount)}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatCurrency(refund.payments?.amount || 0)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {refund.refund_type.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(refund.status)}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {refund.reason}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {refund.processed_at 
                              ? format(new Date(refund.processed_at), 'MMM dd, yyyy HH:mm')
                              : '-'
                            }
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {refund.id.slice(0, 8)}...
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};