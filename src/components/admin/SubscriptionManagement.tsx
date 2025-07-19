import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, DollarSign, Calendar, Star, Crown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval_type: string;
  interval_count: number;
  features: any;
  stripe_price_id?: string;
  is_active: boolean;
  created_at: string;
}

interface PlanFormData {
  name: string;
  description: string;
  price: number;
  interval_type: 'month' | 'year';
  interval_count: number;
  features: string[];
  stripe_price_id: string;
  is_active: boolean;
}

export const SubscriptionManagement = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [formData, setFormData] = useState<PlanFormData>({
    name: '',
    description: '',
    price: 0,
    interval_type: 'month',
    interval_count: 1,
    features: [],
    stripe_price_id: '',
    is_active: true
  });
  const [newFeature, setNewFeature] = useState('');
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price', { ascending: true });

      if (error) throw error;
      
      // Transform the data to handle features properly
      const transformedPlans = (data || []).map(plan => ({
        ...plan,
        features: Array.isArray(plan.features) ? plan.features : []
      }));
      
      setPlans(transformedPlans);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch subscription plans'
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      interval_type: 'month',
      interval_count: 1,
      features: [],
      stripe_price_id: '',
      is_active: true
    });
    setNewFeature('');
    setEditingPlan(null);
  };

  const openEditDialog = (plan: SubscriptionPlan) => {
    setFormData({
      name: plan.name,
      description: plan.description,
      price: plan.price,
      interval_type: plan.interval_type as 'month' | 'year',
      interval_count: plan.interval_count,
      features: Array.isArray(plan.features) ? plan.features : [],
      stripe_price_id: plan.stripe_price_id || '',
      is_active: plan.is_active
    });
    setEditingPlan(plan);
    setIsCreateDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const planData = {
        ...formData,
        features: formData.features.length > 0 ? formData.features : null
      };

      if (editingPlan) {
        const { error } = await supabase
          .from('subscription_plans')
          .update(planData)
          .eq('id', editingPlan.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Subscription plan updated successfully'
        });
      } else {
        const { error } = await supabase
          .from('subscription_plans')
          .insert([planData]);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Subscription plan created successfully'
        });
      }

      setIsCreateDialogOpen(false);
      resetForm();
      fetchPlans();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to save subscription plan'
      });
    }
  };

  const handleDelete = async (planId: string) => {
    try {
      const { error } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Subscription plan deleted successfully'
      });

      fetchPlans();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete subscription plan'
      });
    }
  };

  const addFeature = () => {
    if (newFeature.trim() && !formData.features.includes(newFeature.trim())) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }));
      setNewFeature('');
    }
  };

  const removeFeature = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter(f => f !== feature)
    }));
  };

  const togglePlanStatus = async (planId: string, newStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('subscription_plans')
        .update({ is_active: newStatus })
        .eq('id', planId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Plan ${newStatus ? 'activated' : 'deactivated'} successfully`
      });

      fetchPlans();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update plan status'
      });
    }
  };

  if (loading) {
    return (
      <Card className="card-minimal">
        <CardContent className="p-6">
          <div className="text-center">Loading subscription plans...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="card-minimal">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Subscription Plans Management
            </CardTitle>
            <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
              setIsCreateDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Plan
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingPlan ? 'Edit Subscription Plan' : 'Create New Subscription Plan'}
                  </DialogTitle>
                  <DialogDescription>
                    Set up membership options for your academy members
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Plan Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Basic Monthly"
                      />
                    </div>
                    <div>
                      <Label htmlFor="price">Price</Label>
                      <Input
                        id="price"
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                        placeholder="9.99"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description of what this plan includes"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="interval_type">Billing Interval</Label>
                      <Select
                        value={formData.interval_type}
                        onValueChange={(value: 'month' | 'year') => 
                          setFormData(prev => ({ ...prev, interval_type: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="month">Monthly</SelectItem>
                          <SelectItem value="year">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="stripe_price_id">Stripe Price ID</Label>
                      <Input
                        id="stripe_price_id"
                        value={formData.stripe_price_id}
                        onChange={(e) => setFormData(prev => ({ ...prev, stripe_price_id: e.target.value }))}
                        placeholder="price_1234567890"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Features</Label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          value={newFeature}
                          onChange={(e) => setNewFeature(e.target.value)}
                          placeholder="Add a feature"
                          onKeyPress={(e) => e.key === 'Enter' && addFeature()}
                        />
                        <Button type="button" onClick={addFeature} variant="outline">
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.features.map((feature, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="cursor-pointer"
                            onClick={() => removeFeature(feature)}
                          >
                            {feature} ×
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                    />
                    <Label htmlFor="is_active">Active Plan</Label>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSubmit}>
                      {editingPlan ? 'Update Plan' : 'Create Plan'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {plans.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No subscription plans created yet</p>
              <p className="text-sm">Create your first plan to start offering memberships</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <Card key={plan.id} className={`shadow-soft ${plan.is_active ? 'border-primary' : 'border-muted opacity-60'}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                        {plan.name.toLowerCase().includes('premium') && <Crown className="h-4 w-4 text-primary" />}
                        {plan.name.toLowerCase().includes('basic') && <Star className="h-4 w-4 text-muted-foreground" />}
                      </div>
                      <Badge variant={plan.is_active ? "default" : "secondary"}>
                        {plan.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold">${plan.price}</span>
                      <span className="text-muted-foreground">/{plan.interval_type}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {plan.features && plan.features.length > 0 && (
                      <div>
                        <p className="font-medium text-sm mb-2">Features:</p>
                        <div className="flex flex-wrap gap-1">
                          {plan.features.slice(0, 3).map((feature, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                          {plan.features.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{plan.features.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={plan.is_active}
                          onCheckedChange={(checked) => togglePlanStatus(plan.id, checked)}
                        />
                        <span className="text-sm">{plan.is_active ? 'Active' : 'Inactive'}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(plan)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Subscription Plan</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{plan.name}"? This action cannot be undone.
                                Existing subscribers will not be affected.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(plan.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};