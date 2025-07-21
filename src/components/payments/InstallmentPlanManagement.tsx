import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useEffectiveRole } from "@/hooks/useEffectiveRole";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, CreditCard, Building2, AlertTriangle, Pause, Play, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InstallmentPlan {
  id: string;
  student_id: string;
  total_amount: number;
  installments_count: number;
  installment_amount: number;
  frequency: string;
  start_date: string;
  next_payment_date: string;
  status: string;
  description: string;
  preferred_payment_method: string;
  profiles?: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

export const InstallmentPlanManagement = () => {
  const { user } = useAuth();
  const { isAdmin } = useEffectiveRole();
  const { toast } = useToast();
  const [plans, setPlans] = useState<InstallmentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadInstallmentPlans();
  }, [statusFilter]);

  const loadInstallmentPlans = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('installment_plans')
        .select(`
          *,
          profiles:student_id (first_name, last_name, email)
        `)
        .order('created_at', { ascending: false });

      // If not admin, only show user's own plans
      if (!isAdmin) {
        query = query.eq('student_id', user?.id);
      }

      // Apply status filter
      if (statusFilter !== "all") {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      setPlans((data as any) || []);
    } catch (error) {
      console.error('Error loading installment plans:', error);
      toast({
        title: "Error",
        description: "Failed to load installment plans.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePlanStatus = async (planId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('installment_plans')
        .update({ status: newStatus })
        .eq('id', planId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Installment plan ${newStatus}.`,
      });

      loadInstallmentPlans();
    } catch (error) {
      console.error('Error updating plan status:', error);
      toast({
        title: "Error",
        description: "Failed to update plan status.",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Play className="h-4 w-4 text-green-500" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      case 'cancelled':
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return <Calendar className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Installment Plan Management
        </CardTitle>
        <CardDescription>
          {isAdmin ? "Manage all installment plans" : "View your payment plans"}
        </CardDescription>
        
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Plans</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">Loading plans...</div>
        ) : plans.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No installment plans found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {plans.map((plan) => (
              <div key={plan.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(plan.status)}
                      <h3 className="font-medium">
                        {plan.description || 'Payment Plan'}
                      </h3>
                      <Badge className={getStatusColor(plan.status)}>
                        {plan.status}
                      </Badge>
                    </div>
                    
                    {isAdmin && plan.profiles && (
                      <p className="text-sm text-muted-foreground">
                        {plan.profiles.first_name} {plan.profiles.last_name} ({plan.profiles.email})
                      </p>
                    )}
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Total:</span>
                        <p className="font-medium">${(plan.total_amount / 100).toFixed(2)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Per Payment:</span>
                        <p className="font-medium">${(plan.installment_amount / 100).toFixed(2)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Frequency:</span>
                        <p className="font-medium capitalize">{plan.frequency}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Next Payment:</span>
                        <p className="font-medium">
                          {new Date(plan.next_payment_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      {plan.preferred_payment_method === 'ach' ? (
                        <Building2 className="h-4 w-4" />
                      ) : (
                        <CreditCard className="h-4 w-4" />
                      )}
                      <span className="text-muted-foreground">
                        {plan.preferred_payment_method === 'ach' ? 'Bank Transfer' : 'Credit Card'}
                      </span>
                    </div>
                  </div>

                  {isAdmin && plan.status === 'active' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updatePlanStatus(plan.id, 'paused')}
                      >
                        Pause
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updatePlanStatus(plan.id, 'cancelled')}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}

                  {isAdmin && plan.status === 'paused' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updatePlanStatus(plan.id, 'active')}
                    >
                      Resume
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};