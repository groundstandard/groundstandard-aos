import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target, Users, Calendar, DollarSign, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PerformanceTargets {
  id?: string;
  retention_3_months: number;
  retention_6_months: number;
  retention_9_months: number;
  retention_12_months: number;
  capacity_adults: number;
  capacity_youth: number;
  capacity_first_30_days: number;
  capacity_after_30_days: number;
  revenue_monthly: number;
  revenue_quarterly: number;
  revenue_half_yearly: number;
  revenue_yearly: number;
}

export const PerformanceTargets = () => {
  const { toast } = useToast();
  const [targets, setTargets] = useState<PerformanceTargets>({
    retention_3_months: 90.0,
    retention_6_months: 85.0,
    retention_9_months: 80.0,
    retention_12_months: 75.0,
    capacity_adults: 80.0,
    capacity_youth: 75.0,
    capacity_first_30_days: 60.0,
    capacity_after_30_days: 85.0,
    revenue_monthly: 2000000, // $20,000 in cents
    revenue_quarterly: 6000000, // $60,000 in cents
    revenue_half_yearly: 12000000, // $120,000 in cents
    revenue_yearly: 24000000, // $240,000 in cents
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTargets();
  }, []);

  const loadTargets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('performance_targets')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setTargets(data);
      }
    } catch (error) {
      console.error('Error loading performance targets:', error);
      toast({
        title: "Error",
        description: "Failed to load performance targets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveTargets = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('performance_targets')
        .upsert({
          ...targets,
          academy_id: null, // You can set this to academy ID if needed
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Performance targets updated successfully",
      });
    } catch (error) {
      console.error('Error saving performance targets:', error);
      toast({
        title: "Error",
        description: "Failed to save performance targets",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof PerformanceTargets, value: string) => {
    const numValue = parseFloat(value) || 0;
    setTargets(prev => ({
      ...prev,
      [field]: numValue
    }));
  };

  if (loading) {
    return <div>Loading performance targets...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Performance Targets</h2>
          <p className="text-muted-foreground">
            Set targets for student retention, class capacity, and revenue goals
          </p>
        </div>
        <Button onClick={saveTargets} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Targets"}
        </Button>
      </div>

      <Tabs defaultValue="retention" className="space-y-4">
        <TabsList>
          <TabsTrigger value="retention" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Student Retention
          </TabsTrigger>
          <TabsTrigger value="capacity" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Class Capacity
          </TabsTrigger>
          <TabsTrigger value="revenue" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Revenue Goals
          </TabsTrigger>
        </TabsList>

        <TabsContent value="retention">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Student Retention Targets
              </CardTitle>
              <CardDescription>
                Set target retention percentages for different time periods
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="retention_3_months">3 Months (%)</Label>
                  <Input
                    id="retention_3_months"
                    type="number"
                    step="0.1"
                    value={targets.retention_3_months}
                    onChange={(e) => handleInputChange('retention_3_months', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retention_6_months">6 Months (%)</Label>
                  <Input
                    id="retention_6_months"
                    type="number"
                    step="0.1"
                    value={targets.retention_6_months}
                    onChange={(e) => handleInputChange('retention_6_months', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retention_9_months">9 Months (%)</Label>
                  <Input
                    id="retention_9_months"
                    type="number"
                    step="0.1"
                    value={targets.retention_9_months}
                    onChange={(e) => handleInputChange('retention_9_months', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retention_12_months">12 Months (%)</Label>
                  <Input
                    id="retention_12_months"
                    type="number"
                    step="0.1"
                    value={targets.retention_12_months}
                    onChange={(e) => handleInputChange('retention_12_months', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="capacity">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Class Capacity Targets
              </CardTitle>
              <CardDescription>
                Set target capacity percentages for different student groups
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="capacity_adults">Adults (%)</Label>
                  <Input
                    id="capacity_adults"
                    type="number"
                    step="0.1"
                    value={targets.capacity_adults}
                    onChange={(e) => handleInputChange('capacity_adults', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity_youth">Youth (%)</Label>
                  <Input
                    id="capacity_youth"
                    type="number"
                    step="0.1"
                    value={targets.capacity_youth}
                    onChange={(e) => handleInputChange('capacity_youth', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity_first_30_days">First 30 Days (%)</Label>
                  <Input
                    id="capacity_first_30_days"
                    type="number"
                    step="0.1"
                    value={targets.capacity_first_30_days}
                    onChange={(e) => handleInputChange('capacity_first_30_days', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity_after_30_days">After 30 Days (%)</Label>
                  <Input
                    id="capacity_after_30_days"
                    type="number"
                    step="0.1"
                    value={targets.capacity_after_30_days}
                    onChange={(e) => handleInputChange('capacity_after_30_days', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Revenue Targets
              </CardTitle>
              <CardDescription>
                Set revenue targets for different time periods (in USD)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="revenue_monthly">Monthly ($)</Label>
                  <Input
                    id="revenue_monthly"
                    type="number"
                    value={targets.revenue_monthly / 100}
                    onChange={(e) => handleInputChange('revenue_monthly', String(parseFloat(e.target.value) * 100))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="revenue_quarterly">Quarterly ($)</Label>
                  <Input
                    id="revenue_quarterly"
                    type="number"
                    value={targets.revenue_quarterly / 100}
                    onChange={(e) => handleInputChange('revenue_quarterly', String(parseFloat(e.target.value) * 100))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="revenue_half_yearly">Half Year ($)</Label>
                  <Input
                    id="revenue_half_yearly"
                    type="number"
                    value={targets.revenue_half_yearly / 100}
                    onChange={(e) => handleInputChange('revenue_half_yearly', String(parseFloat(e.target.value) * 100))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="revenue_yearly">Yearly ($)</Label>
                  <Input
                    id="revenue_yearly"
                    type="number"
                    value={targets.revenue_yearly / 100}
                    onChange={(e) => handleInputChange('revenue_yearly', String(parseFloat(e.target.value) * 100))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};