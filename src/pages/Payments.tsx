import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BackButton } from "@/components/ui/BackButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, CreditCard, AlertCircle, TrendingUp, Users } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Payments = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Only allow admin access
  if (profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Access Denied</CardTitle>
            <CardDescription className="text-center">
              You need administrator privileges to manage payments.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const { data: paymentStats } = useQuery({
    queryKey: ['payment-stats'],
    queryFn: async () => {
      // Get real payment data
      const { data: payments } = await supabase
        .from('payments')
        .select('amount, payment_date, status');

      // Get profile data for active members
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, membership_status')
        .eq('role', 'student');

      const activeMembers = profiles?.filter(p => p.membership_status === 'active').length || 0;
      
      // Calculate actual stats from payments
      const totalRevenue = payments?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const monthlyRevenue = payments?.filter(payment => {
        const paymentDate = new Date(payment.payment_date);
        return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
      }).reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;

      const outstandingPayments = payments?.filter(p => p.status === 'pending').length || 0;
      
      return {
        monthlyRevenue: Math.round(monthlyRevenue),
        outstandingPayments,
        activeMembers,
        totalMembers: profiles?.length || 0,
        averageMonthlyFee: activeMembers > 0 ? Math.round(monthlyRevenue / activeMembers) : 0
      };
    }
  });

  const { data: recentPayments } = useQuery({
    queryKey: ['recent-payments'],
    queryFn: async () => {
      const { data: payments, error } = await supabase
        .from('payments')
        .select('*')
        .order('payment_date', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Fetch profile data for each payment
      const paymentsWithProfiles = await Promise.all(
        (payments || []).map(async (payment) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', payment.student_id)
            .single();
          
          return {
            id: payment.id,
            student_name: profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown Student',
            amount: payment.amount,
            date: payment.payment_date.split('T')[0],
            method: payment.payment_method,
            status: payment.status
          };
        })
      );

      return paymentsWithProfiles;
    }
  });

  const recordPaymentMutation = useMutation({
    mutationFn: async (paymentData: {
      student_id: string;
      amount: number;
      payment_method: string;
      description: string;
    }) => {
      const { data, error } = await supabase
        .from('payments')
        .insert([{
          student_id: paymentData.student_id,
          amount: paymentData.amount,
          payment_method: paymentData.payment_method,
          description: paymentData.description,
          status: 'completed',
          payment_date: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Payment recorded successfully!" });
      setIsCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['recent-payments'] });
      queryClient.invalidateQueries({ queryKey: ['payment-stats'] });
    },
    onError: (error) => {
      console.error('Payment recording error:', error);
      toast({ title: "Error recording payment", variant: "destructive" });
    }
  });

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <BackButton />
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <DollarSign className="h-8 w-8 text-primary" />
              Payment Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Track payments, memberships, and financial overview
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${paymentStats?.monthlyRevenue?.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">+12% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{paymentStats?.outstandingPayments}</div>
              <p className="text-xs text-muted-foreground">Overdue payments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{paymentStats?.activeMembers}</div>
              <p className="text-xs text-muted-foreground">Paying members</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Monthly Fee</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${paymentStats?.averageMonthlyFee}</div>
              <p className="text-xs text-muted-foreground">Per member</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="payments" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="payments">Recent Payments</TabsTrigger>
            <TabsTrigger value="outstanding">Outstanding</TabsTrigger>
            <TabsTrigger value="memberships">Memberships</TabsTrigger>
          </TabsList>

          <TabsContent value="payments" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Recent Payments</h2>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>Record Payment</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Record Payment</DialogTitle>
                    <DialogDescription>
                      Add a new payment record
                    </DialogDescription>
                  </DialogHeader>
                  <RecordPaymentForm 
                    onSubmit={(data) => recordPaymentMutation.mutate(data)}
                    isLoading={recordPaymentMutation.isPending}
                  />
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {recentPayments?.map((payment: any) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div>
                          <h4 className="font-medium">{payment.student_name}</h4>
                          <p className="text-sm text-muted-foreground">{payment.method}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">${payment.amount}</div>
                        <div className="flex items-center gap-2">
                          <Badge variant="default">Completed</Badge>
                          <span className="text-sm text-muted-foreground">{payment.date}</span>
                        </div>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-8 text-muted-foreground">
                      <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No recent payments</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="outstanding" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Outstanding Payments</CardTitle>
                <CardDescription>Members with overdue payments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: "Alex Brown", amount: 120, daysOverdue: 5, lastPayment: "2025-06-15" },
                    { name: "Emily Davis", amount: 240, daysOverdue: 12, lastPayment: "2025-06-01" },
                    { name: "Tom Wilson", amount: 120, daysOverdue: 3, lastPayment: "2025-06-20" }
                  ].map((payment, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg border-destructive/20">
                      <div>
                        <h4 className="font-medium">{payment.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Last payment: {payment.lastPayment}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-destructive">${payment.amount}</div>
                        <Badge variant="destructive">{payment.daysOverdue} days overdue</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="memberships" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Membership Plans</CardTitle>
                <CardDescription>Current membership pricing and plans</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    { name: "Basic", price: 99, features: ["2 classes/week", "Basic training"] },
                    { name: "Standard", price: 149, features: ["Unlimited classes", "Personal training session"] },
                    { name: "Premium", price: 199, features: ["Unlimited classes", "Personal training", "Competition prep"] }
                  ].map((plan, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                        <CardDescription className="text-2xl font-bold">${plan.price}/month</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2 text-sm">
                          {plan.features.map((feature, i) => (
                            <li key={i}>• {feature}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

interface RecordPaymentFormProps {
  onSubmit: (data: any) => void;
  isLoading: boolean;
}

const RecordPaymentForm = ({ onSubmit, isLoading }: RecordPaymentFormProps) => {
  const [formData, setFormData] = useState({
    student_id: '',
    amount: '',
    payment_method: '',
    description: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      amount: parseFloat(formData.amount)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="student_id">Student</Label>
        <Input
          placeholder="Student ID or search..."
          value={formData.student_id}
          onChange={(e) => setFormData({...formData, student_id: e.target.value})}
        />
      </div>

      <div>
        <Label htmlFor="amount">Amount</Label>
        <Input
          type="number"
          step="0.01"
          placeholder="0.00"
          value={formData.amount}
          onChange={(e) => setFormData({...formData, amount: e.target.value})}
        />
      </div>

      <div>
        <Label htmlFor="payment_method">Payment Method</Label>
        <Select value={formData.payment_method} onValueChange={(value) => setFormData({...formData, payment_method: value})}>
          <SelectTrigger>
            <SelectValue placeholder="Select payment method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cash">Cash</SelectItem>
            <SelectItem value="credit_card">Credit Card</SelectItem>
            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
            <SelectItem value="check">Check</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Input
          placeholder="Monthly membership, private lesson, etc."
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
        />
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Recording..." : "Record Payment"}
      </Button>
    </form>
  );
};

export default Payments;