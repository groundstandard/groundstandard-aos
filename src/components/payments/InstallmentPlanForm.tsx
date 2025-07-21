import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar, Calculator, CreditCard, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const InstallmentPlanForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    total_amount: "",
    installments_count: "3",
    frequency: "monthly",
    start_date: new Date().toISOString().split('T')[0],
    description: "",
    preferred_payment_method: "card"
  });

  const calculateInstallmentAmount = () => {
    const total = parseFloat(formData.total_amount) || 0;
    const count = parseInt(formData.installments_count) || 1;
    return (total / count).toFixed(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.total_amount || parseFloat(formData.total_amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid total amount.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-installment-plan', {
        body: {
          total_amount: parseFloat(formData.total_amount),
          installments_count: parseInt(formData.installments_count),
          frequency: formData.frequency,
          start_date: formData.start_date,
          description: formData.description,
          preferred_payment_method: formData.preferred_payment_method
        },
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;

      toast({
        title: "Installment Plan Created",
        description: `Your payment plan has been set up with ${formData.installments_count} installments of $${calculateInstallmentAmount()}.`,
      });

      // Reset form
      setFormData({
        total_amount: "",
        installments_count: "3",
        frequency: "monthly",
        start_date: new Date().toISOString().split('T')[0],
        description: "",
        preferred_payment_method: "card"
      });

    } catch (error) {
      console.error("Installment plan creation error:", error);
      toast({
        title: "Creation Failed",
        description: "Failed to create installment plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Create Installment Plan
        </CardTitle>
        <CardDescription>
          Split large payments into manageable installments
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="total_amount">Total Amount ($)</Label>
              <Input
                id="total_amount"
                type="number"
                step="0.01"
                min="1"
                placeholder="500.00"
                value={formData.total_amount}
                onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="installments_count">Number of Installments</Label>
              <Select 
                value={formData.installments_count}
                onValueChange={(value) => setFormData({ ...formData, installments_count: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 payments</SelectItem>
                  <SelectItem value="3">3 payments</SelectItem>
                  <SelectItem value="4">4 payments</SelectItem>
                  <SelectItem value="6">6 payments</SelectItem>
                  <SelectItem value="12">12 payments</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="frequency">Payment Frequency</Label>
              <Select 
                value={formData.frequency}
                onValueChange={(value) => setFormData({ ...formData, frequency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_date">First Payment Date</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Preferred Payment Method</Label>
            <RadioGroup 
              value={formData.preferred_payment_method}
              onValueChange={(value) => setFormData({ ...formData, preferred_payment_method: value })}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="card" id="card" />
                <Label htmlFor="card" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Credit Card (2.9%)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ach" id="ach" />
                <Label htmlFor="ach" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  ACH Bank Transfer (0.8%)
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="e.g., Annual tuition payment plan"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {formData.total_amount && (
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Payment Breakdown
              </h4>
              <div className="text-sm space-y-1">
                <p>Total Amount: <span className="font-medium">${formData.total_amount}</span></p>
                <p>Number of Payments: <span className="font-medium">{formData.installments_count}</span></p>
                <p>Payment Amount: <span className="font-medium">${calculateInstallmentAmount()}</span></p>
                <p>Frequency: <span className="font-medium">{formData.frequency}</span></p>
              </div>
            </div>
          )}

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Creating Plan..." : "Create Installment Plan"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};