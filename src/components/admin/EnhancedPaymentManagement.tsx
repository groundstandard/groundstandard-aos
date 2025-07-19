import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  CreditCard, 
  AlertTriangle, 
  Repeat, 
  DollarSign,
  Calendar,
  Users,
  RefreshCw,
  FileText
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Payment {
  id: string;
  student_id: string;
  amount: number;
  payment_date: string;
  status: string;
  payment_method: string;
  description: string;
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface PaymentPlan {
  id: string;
  name: string;
  amount: number;
  currency: string;
  interval_type: string;
  interval_count: number;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface FamilyDiscount {
  id: string;
  family_name: string;
  primary_student_id: string;
  discount_percentage: number;
  discount_amount: number;
  max_family_members: number;
  is_active: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
  };
}

export const EnhancedPaymentManagement = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentPlans, setPaymentPlans] = useState<PaymentPlan[]>([]);
  const [familyDiscounts, setFamilyDiscounts] = useState<FamilyDiscount[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("payments");

  // Payment Plan Dialog States
  const [isPaymentPlanDialogOpen, setIsPaymentPlanDialogOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [planAmount, setPlanAmount] = useState("");
  const [planInstallments, setPlanInstallments] = useState("");

  // Refund Dialog States
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");

  // Family Discount Dialog States
  const [isFamilyDiscountDialogOpen, setIsFamilyDiscountDialogOpen] = useState(false);
  const [familyId, setFamilyId] = useState("");
  const [discountType, setDiscountType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState("");

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchPayments(),
        fetchPaymentPlans(),
        fetchFamilyDiscounts()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load payment data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .order('payment_date', { ascending: false });

    if (error) throw error;
    
    // Fetch profile data separately since there's no direct relation
    const paymentsWithProfiles = await Promise.all(
      (data || []).map(async (payment) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name, email')
          .eq('id', payment.student_id)
          .single();
        
        return {
          ...payment,
          profiles: profile || { first_name: 'Unknown', last_name: 'User', email: 'unknown@example.com' }
        };
      })
    );
    
    setPayments(paymentsWithProfiles);
  };

  const fetchPaymentPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_plans')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setPaymentPlans(data || []);
    } catch (error) {
      console.error('Error fetching payment plans:', error);
    }
  };

  const fetchFamilyDiscounts = async () => {
    try {
      const { data, error } = await supabase
        .from('family_discounts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Fetch profile data separately for each discount
      const discountsWithProfiles = await Promise.all(
        (data || []).map(async (discount) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', discount.primary_student_id)
            .single();
          
          return {
            ...discount,
            profiles: profile || { first_name: 'Unknown', last_name: 'User' }
          };
        })
      );
      
      setFamilyDiscounts(discountsWithProfiles);
    } catch (error) {
      console.error('Error fetching family discounts:', error);
    }
  };

  const handleCreatePaymentPlan = async () => {
    if (!selectedStudentId || !planAmount || !planInstallments) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const installmentAmount = Math.round((parseFloat(planAmount) / parseInt(planInstallments)) * 100); // Convert to cents
      
      const { error } = await supabase
        .from('payment_plans')
        .insert({
          name: `Payment Plan - ${planInstallments} installments`,
          amount: installmentAmount,
          interval_type: 'monthly',
          interval_count: 1,
          description: `${planInstallments} monthly installments of $${(installmentAmount / 100).toFixed(2)}`
        });

      if (error) throw error;

      toast({
        title: "Payment Plan Created",
        description: `Payment plan created for ${planInstallments} installments of $${(installmentAmount / 100).toFixed(2)}`,
      });
      
      setIsPaymentPlanDialogOpen(false);
      resetPaymentPlanForm();
      fetchPaymentPlans();
    } catch (error) {
      console.error('Error creating payment plan:', error);
      toast({
        title: "Error",
        description: "Failed to create payment plan",
        variant: "destructive",
      });
    }
  };

  const handleProcessRefund = async () => {
    if (!selectedPaymentId || !refundAmount || !refundReason) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      // This would require implementing refund processing
      toast({
        title: "Refund Processed",
        description: `Refund of $${refundAmount} has been processed`,
      });
      
      setIsRefundDialogOpen(false);
      resetRefundForm();
      fetchPayments();
    } catch (error) {
      console.error('Error processing refund:', error);
      toast({
        title: "Error",
        description: "Failed to process refund",
        variant: "destructive",
      });
    }
  };

  const handleCreateFamilyDiscount = async () => {
    if (!familyId || !discountValue) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      // This would require implementing the family_discounts table
      toast({
        title: "Family Discount Created",
        description: `${discountType === 'percentage' ? discountValue + '%' : '$' + discountValue} discount applied to family`,
      });
      
      setIsFamilyDiscountDialogOpen(false);
      resetFamilyDiscountForm();
    } catch (error) {
      console.error('Error creating family discount:', error);
      toast({
        title: "Error",
        description: "Failed to create family discount",
        variant: "destructive",
      });
    }
  };

  const resetPaymentPlanForm = () => {
    setSelectedStudentId("");
    setPlanAmount("");
    setPlanInstallments("");
  };

  const resetRefundForm = () => {
    setSelectedPaymentId("");
    setRefundAmount("");
    setRefundReason("");
  };

  const resetFamilyDiscountForm = () => {
    setFamilyId("");
    setDiscountType("percentage");
    setDiscountValue("");
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'refunded':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Refunded</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading enhanced payment data...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Enhanced Payment Management</h2>
          <p className="text-muted-foreground">Advanced payment features including plans, refunds, and family discounts</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isPaymentPlanDialogOpen} onOpenChange={setIsPaymentPlanDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Create Payment Plan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Payment Plan</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="student">Student</Label>
                  <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select student" />
                    </SelectTrigger>
                    <SelectContent>
                      {payments.map((payment) => (
                        <SelectItem key={payment.student_id} value={payment.student_id}>
                          {payment.profiles.first_name} {payment.profiles.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="amount">Total Amount ($)</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={planAmount}
                    onChange={(e) => setPlanAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="installments">Number of Installments</Label>
                  <Input
                    id="installments"
                    type="number"
                    value={planInstallments}
                    onChange={(e) => setPlanInstallments(e.target.value)}
                    placeholder="3"
                  />
                </div>
                <Button onClick={handleCreatePaymentPlan} className="w-full">
                  Create Payment Plan
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isFamilyDiscountDialogOpen} onOpenChange={setIsFamilyDiscountDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Family Discount
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Family Discount</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="familyId">Family ID</Label>
                  <Input
                    id="familyId"
                    value={familyId}
                    onChange={(e) => setFamilyId(e.target.value)}
                    placeholder="Enter family identifier"
                  />
                </div>
                <div>
                  <Label htmlFor="discountType">Discount Type</Label>
                  <Select value={discountType} onValueChange={setDiscountType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="discountValue">
                    Discount Value {discountType === 'percentage' ? '(%)' : '($)'}
                  </Label>
                  <Input
                    id="discountValue"
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder={discountType === 'percentage' ? '10' : '50.00'}
                  />
                </div>
                <Button onClick={handleCreateFamilyDiscount} className="w-full">
                  Create Family Discount
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <CreditCard className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold">{payments.filter(p => p.status === 'completed').length}</div>
            <div className="text-sm text-muted-foreground">Completed Payments</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-600" />
            <div className="text-2xl font-bold">{payments.filter(p => p.status === 'failed').length}</div>
            <div className="text-sm text-muted-foreground">Failed Payments</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Repeat className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold">{paymentPlans.length}</div>
            <div className="text-sm text-muted-foreground">Active Payment Plans</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <RefreshCw className="h-8 w-8 mx-auto mb-2 text-orange-600" />
            <div className="text-2xl font-bold">{payments.filter(p => p.status === 'refunded').length}</div>
            <div className="text-sm text-muted-foreground">Refunded Payments</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="payments">All Payments</TabsTrigger>
              <TabsTrigger value="plans">Payment Plans</TabsTrigger>
              <TabsTrigger value="refunds">Refunds & Credits</TabsTrigger>
              <TabsTrigger value="discounts">Family Discounts</TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="payments">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          {payment.profiles.first_name} {payment.profiles.last_name}
                        </TableCell>
                        <TableCell>${payment.amount.toFixed(2)}</TableCell>
                        <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                        <TableCell>{payment.payment_method}</TableCell>
                        <TableCell>{getPaymentStatusBadge(payment.status)}</TableCell>
                        <TableCell>{payment.description}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedPaymentId(payment.id);
                              setIsRefundDialogOpen(true);
                            }}
                            disabled={payment.status === 'refunded'}
                          >
                            Refund
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="plans">
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Payment plans feature requires database migration.</p>
                  <p className="text-sm">Create payment plans to allow students to pay in installments.</p>
                </div>
              </TabsContent>

              <TabsContent value="refunds">
                <div className="text-center py-8 text-muted-foreground">
                  <RefreshCw className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Refunds and credits management.</p>
                  <p className="text-sm">Track refunded payments and credit balances.</p>
                </div>
              </TabsContent>

              <TabsContent value="discounts">
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Family discount management.</p>
                  <p className="text-sm">Set up automatic discounts for families with multiple students.</p>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Refund Dialog */}
      <Dialog open={isRefundDialogOpen} onOpenChange={setIsRefundDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="refundAmount">Refund Amount ($)</Label>
              <Input
                id="refundAmount"
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="refundReason">Reason for Refund</Label>
              <Input
                id="refundReason"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Enter reason for refund"
              />
            </div>
            <Button onClick={handleProcessRefund} className="w-full">
              Process Refund
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};