import { useState } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Plus,
  Edit,
  Trash2,
  Users,
  Calendar,
  DollarSign,
  UserCheck,
  Clock,
  Star,
  Gift,
  GraduationCap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SortableAllPlansTable } from './SortableAllPlansTable';
import { SubscriptionDashboard } from '@/components/subscription/SubscriptionDashboard';
import { MembershipRenewalSettings } from './MembershipRenewalSettings';

export const MembershipPlanManagement = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Access control
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

  // Fetch data queries
  const { data: membershipPlans } = useQuery({
    queryKey: ['membership-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('membership_plans')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const { data: privateSessions } = useQuery({
    queryKey: ['private-sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('private_sessions')
        .select(`
          *,
          instructor:instructor_id(first_name, last_name)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const { data: dropInOptions } = useQuery({
    queryKey: ['drop-in-options'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drop_in_options')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const { data: discountTypes } = useQuery({
    queryKey: ['discount-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('discount_types')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const { data: instructors } = useQuery({
    queryKey: ['instructors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('role', ['instructor', 'admin'])
        .order('first_name');
      if (error) throw error;
      return data;
    }
  });

  // Helper functions
  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100);
  };

  // Delete discount handler
  const handleDeleteDiscount = async (discountId: string) => {
    try {
      const { error } = await supabase
        .from('discount_types')
        .delete()
        .eq('id', discountId);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['discount-types'] });
      toast({ title: "Discount deleted successfully" });
    } catch (error) {
      toast({ 
        title: "Error deleting discount", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-4">
        <Card className="py-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-2">
            <CardTitle className="text-xs font-medium">Membership Plans</CardTitle>
            <Users className="h-3 w-3 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-2">
            <div className="text-lg font-bold">{membershipPlans?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Active plans</p>
          </CardContent>
        </Card>

        <Card className="py-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-2">
            <CardTitle className="text-xs font-medium">Private Sessions</CardTitle>
            <UserCheck className="h-3 w-3 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-2">
            <div className="text-lg font-bold">{privateSessions?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Session types</p>
          </CardContent>
        </Card>

        <Card className="py-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-2">
            <CardTitle className="text-xs font-medium">Drop-in Options</CardTitle>
            <Calendar className="h-3 w-3 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-2">
            <div className="text-lg font-bold">{dropInOptions?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Available options</p>
          </CardContent>
        </Card>

        <Card className="py-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-2">
            <CardTitle className="text-xs font-medium">Discounts</CardTitle>
            <Gift className="h-3 w-3 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-2">
            <div className="text-lg font-bold">{discountTypes?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Discount types</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="memberships" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="memberships">Memberships & Plans</TabsTrigger>
          <TabsTrigger value="renewals">Renewal Settings</TabsTrigger>
          <TabsTrigger value="subscription">My Subscription</TabsTrigger>
          <TabsTrigger value="discounts">Discounts</TabsTrigger>
        </TabsList>

        <TabsContent value="memberships" className="space-y-4">
          <SortableAllPlansTable />
        </TabsContent>

        <TabsContent value="renewals" className="space-y-4">
          <MembershipRenewalSettings />
        </TabsContent>

        <TabsContent value="subscription" className="space-y-4">
          <SubscriptionDashboard />
        </TabsContent>

        <TabsContent value="discounts" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Discounts & Family Plans</h3>
            <div className="flex gap-2">
              <CreateDiscountDialog />
              <CreateFamilyDiscountDialog />
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">General Discounts</CardTitle>
                <CardDescription>Student, military, senior discounts, etc.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Applies To</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {discountTypes?.map((discount) => (
                      <TableRow key={discount.id}>
                        <TableCell className="font-medium">{discount.name}</TableCell>
                        <TableCell>
                          <Badge>{discount.discount_type}</Badge>
                        </TableCell>
                        <TableCell>
                          {discount.discount_type === 'percentage' 
                            ? `${discount.discount_value}%` 
                            : formatPrice((discount.discount_value || 0) * 100)
                          }
                        </TableCell>
                        <TableCell>{discount.applies_to}</TableCell>
                        <TableCell>
                          <Badge variant={discount.is_active ? 'default' : 'secondary'}>
                            {discount.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Edit Discount</DialogTitle>
                                </DialogHeader>
                                <EditDiscountForm discount={discount} />
                              </DialogContent>
                            </Dialog>
                            
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteDiscount(discount.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <FamilyDiscountPlansCard />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
export const CreateMembershipPlanDialog = ({ instructors }: { instructors: any[] }) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    age_group: 'all',
    base_price_cents: '',
    length_months: '1',
    payment_frequency_months: '1',
    classes_per_week: '',
    is_unlimited: false,
    is_class_pack: false,
    class_pack_size: '',
    pack_expiry_days: '',
    setup_fee_cents: '',
    trial_days: '',
    plan_type_id: null,
    is_active: true
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: planTypes } = useQuery({
    queryKey: ['membership-plan-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('membership_plan_types')
        .select('*')
        .eq('is_active', true);
      if (error) throw error;
      return data;
    }
  });

  const createPlan = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('membership_plans')
        .insert([{
          ...data,
          base_price_cents: parseInt(data.base_price_cents),
          setup_fee_cents: data.setup_fee_cents ? parseInt(data.setup_fee_cents) : 0,
          trial_days: data.trial_days ? parseInt(data.trial_days) : 0,
          classes_per_week: data.is_unlimited ? null : parseInt(data.classes_per_week)
        }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['membership-plans'] });
      toast({ title: "Membership plan created successfully" });
      setOpen(false);
      setFormData({
        name: '',
        description: '',
        age_group: 'all',
        base_price_cents: '',
        length_months: '1',
        payment_frequency_months: '1',
        classes_per_week: '',
        is_unlimited: false,
        is_class_pack: false,
        class_pack_size: '',
        pack_expiry_days: '',
        setup_fee_cents: '',
        trial_days: '',
        plan_type_id: null,
        is_active: true
      });
    },
    onError: (error) => {
      toast({ title: "Error creating plan", description: error.message, variant: "destructive" });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPlan.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Membership Plan
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[95vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg">Create Membership Plan</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Add a new membership plan for your academy
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="name" className="text-xs">Plan Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="age_group" className="text-xs">Age Group</Label>
              <Select value={formData.age_group} onValueChange={(value) => setFormData({...formData, age_group: value})}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ages</SelectItem>
                  <SelectItem value="youth">Youth</SelectItem>
                  <SelectItem value="adult">Adult</SelectItem>
                  <SelectItem value="kids">Kids</SelectItem>
                  <SelectItem value="teens">Teens</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description" className="text-xs">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="min-h-[50px] resize-none text-sm"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label htmlFor="base_price_cents" className="text-xs">Price ($)</Label>
              <Input
                id="base_price_cents"
                type="number"
                step="0.01"
                placeholder="600.00"
                value={formData.base_price_cents ? (parseInt(formData.base_price_cents) / 100).toString() : ''}
                onChange={(e) => setFormData({...formData, base_price_cents: e.target.value ? (parseFloat(e.target.value) * 100).toString() : ''})}
                required
                className="h-8 text-sm"
              />
            </div>

            <div>
              <Label htmlFor="length_months" className="text-xs">Length</Label>
              <Input
                id="length_months"
                type="number"
                placeholder="12"
                min="1"
                value={formData.length_months}
                onChange={(e) => setFormData({...formData, length_months: e.target.value})}
                required
                className="h-8 text-sm"
              />
            </div>

            <div>
              <Label htmlFor="payment_frequency_months" className="text-xs">Frequency</Label>
              <Input
                id="payment_frequency_months"
                type="number"
                placeholder="3"
                min="1"
                value={formData.payment_frequency_months}
                onChange={(e) => setFormData({...formData, payment_frequency_months: e.target.value})}
                required
                className="h-8 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center space-x-2 p-2 bg-muted/30 rounded-md">
              <Checkbox
                id="is_class_pack"
                checked={formData.is_class_pack}
                onCheckedChange={(checked) => setFormData({...formData, is_class_pack: checked as boolean})}
                className="h-4 w-4"
              />
              <Label htmlFor="is_class_pack" className="text-xs font-medium cursor-pointer">Class Pack</Label>
            </div>
            <div className="flex items-center space-x-2 p-2 bg-muted/30 rounded-md">
              <Switch
                checked={formData.is_unlimited}
                onCheckedChange={(checked) => setFormData({...formData, is_unlimited: checked})}
              />
              <Label className="text-xs">Unlimited Classes</Label>
            </div>
          </div>

          {formData.is_class_pack && (
            <div className="grid grid-cols-2 gap-2 p-2 bg-muted/30 rounded-md">
              <div>
                <Label htmlFor="class_pack_size" className="text-xs">Number of Classes</Label>
                <Input
                  id="class_pack_size"
                  type="number"
                  min="1"
                  value={formData.class_pack_size}
                  onChange={(e) => setFormData({...formData, class_pack_size: e.target.value})}
                  placeholder="10"
                  required={formData.is_class_pack}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="pack_expiry_days" className="text-xs">Expiry Days</Label>
                <Input
                  id="pack_expiry_days"
                  type="number"
                  min="1"
                  value={formData.pack_expiry_days}
                  onChange={(e) => setFormData({...formData, pack_expiry_days: e.target.value})}
                  placeholder="90"
                  required={formData.is_class_pack}
                  className="h-8 text-sm"
                />
               </div>
              </div>
            )}

            {!formData.is_unlimited && !formData.is_class_pack && (
              <div>
                <Label htmlFor="classes_per_week" className="text-xs">Classes per Week</Label>
                <Input
                  id="classes_per_week"
                  type="number"
                  min="1"
                  value={formData.classes_per_week}
                  onChange={(e) => setFormData({...formData, classes_per_week: e.target.value})}
                  required={!formData.is_unlimited && !formData.is_class_pack}
                  className="h-8 text-sm"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="setup_fee_cents" className="text-xs">Setup Fee ($)</Label>
                <Input
                  id="setup_fee_cents"
                  type="number"
                  step="0.01"
                  value={formData.setup_fee_cents ? (parseInt(formData.setup_fee_cents) / 100).toString() : ''}
                  onChange={(e) => setFormData({...formData, setup_fee_cents: e.target.value ? (parseFloat(e.target.value) * 100).toString() : ''})}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="trial_days" className="text-xs">Trial Days</Label>
                <Input
                  id="trial_days"
                  type="number"
                  min="0"
                  value={formData.trial_days}
                  onChange={(e) => setFormData({...formData, trial_days: e.target.value})}
                  className="h-8 text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} size="sm">
              Cancel
            </Button>
            <Button type="submit" disabled={createPlan.isPending} size="sm">
              {createPlan.isPending ? 'Creating...' : 'Create Plan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const CreatePrivateSessionDialog = ({ instructors }: { instructors: any[] }) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    session_type: 'individual',
    package_size: '1',
    price_per_session_cents: '',
    duration_minutes: '60',
    instructor_id: 'any',
    is_active: true
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createSession = useMutation({
    mutationFn: async (data: any) => {
      const packageSize = parseInt(data.package_size);
      const pricePerSession = parseInt(data.price_per_session_cents);
      const { error } = await supabase
        .from('private_sessions')
        .insert([{
          ...data,
          package_size: packageSize,
          price_per_session_cents: pricePerSession,
          total_price_cents: packageSize * pricePerSession,
          duration_minutes: parseInt(data.duration_minutes),
          instructor_id: data.instructor_id === 'any' ? null : data.instructor_id
        }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['private-sessions'] });
      toast({ title: "Private session created successfully" });
      setOpen(false);
      setFormData({
        name: '',
        description: '',
        session_type: 'individual',
        package_size: '1',
        price_per_session_cents: '',
        duration_minutes: '60',
        instructor_id: 'any',
        is_active: true
      });
    },
    onError: (error) => {
      toast({ title: "Error creating session", description: error.message, variant: "destructive" });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSession.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Private Session
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Private Session</DialogTitle>
          <DialogDescription>
            Add a new private session or package option
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Session Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="session_type">Session Type</Label>
              <Select value={formData.session_type} onValueChange={(value) => setFormData({...formData, session_type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="semi_private">Semi-Private</SelectItem>
                  <SelectItem value="package">Package Deal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="package_size">Package Size</Label>
              <Input
                id="package_size"
                type="number"
                min="1"
                value={formData.package_size}
                onChange={(e) => setFormData({...formData, package_size: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="price_per_session_cents">Price per Session ($)</Label>
              <Input
                id="price_per_session_cents"
                type="number"
                step="0.01"
                value={formData.price_per_session_cents ? (parseInt(formData.price_per_session_cents) / 100).toString() : ''}
                onChange={(e) => setFormData({...formData, price_per_session_cents: e.target.value ? (parseFloat(e.target.value) * 100).toString() : ''})}
                required
              />
            </div>
            <div>
              <Label htmlFor="duration_minutes">Duration (minutes)</Label>
              <Input
                id="duration_minutes"
                type="number"
                min="15"
                step="15"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({...formData, duration_minutes: e.target.value})}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="instructor_id">Specific Instructor (Optional)</Label>
            <Select value={formData.instructor_id || 'any'} onValueChange={(value) => setFormData({...formData, instructor_id: value === 'any' ? null : value})}>
              <SelectTrigger>
                <SelectValue placeholder="Any instructor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any Instructor</SelectItem>
                {instructors?.map((instructor) => (
                  <SelectItem key={instructor.id} value={instructor.id}>
                    {instructor.first_name} {instructor.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createSession.isPending}>
              {createSession.isPending ? 'Creating...' : 'Create Session'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const CreateDropInDialog = () => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    option_type: 'drop_in',
    price_cents: '',
    trial_duration_days: '',
    age_group: 'all',
    is_active: true
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createDropIn = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('drop_in_options')
        .insert([{
          ...data,
          price_cents: parseInt(data.price_cents),
          trial_duration_days: data.trial_duration_days ? parseInt(data.trial_duration_days) : null
        }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drop-in-options'] });
      toast({ title: "Drop-in option created successfully" });
      setOpen(false);
      setFormData({
        name: '',
        description: '',
        option_type: 'drop_in',
        price_cents: '',
        trial_duration_days: '',
        age_group: 'all',
        is_active: true
      });
    },
    onError: (error) => {
      toast({ title: "Error creating option", description: error.message, variant: "destructive" });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createDropIn.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Drop-in Option
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Drop-in/Trial Option</DialogTitle>
          <DialogDescription>
            Add a new drop-in class or trial period option
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Option Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="option_type">Type</Label>
              <Select value={formData.option_type} onValueChange={(value) => setFormData({...formData, option_type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="drop_in">Drop-in Class</SelectItem>
                  <SelectItem value="trial">Trial Period</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price_cents">Price ($)</Label>
              <Input
                id="price_cents"
                type="number"
                step="0.01"
                value={formData.price_cents ? (parseInt(formData.price_cents) / 100).toString() : ''}
                onChange={(e) => setFormData({...formData, price_cents: e.target.value ? (parseFloat(e.target.value) * 100).toString() : ''})}
                required
              />
            </div>
            <div>
              <Label htmlFor="age_group">Age Group</Label>
              <Select value={formData.age_group} onValueChange={(value) => setFormData({...formData, age_group: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ages</SelectItem>
                  <SelectItem value="youth">Youth</SelectItem>
                  <SelectItem value="adult">Adult</SelectItem>
                  <SelectItem value="kids">Kids</SelectItem>
                  <SelectItem value="teens">Teens</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.option_type === 'trial' && (
            <div>
              <Label htmlFor="trial_duration_days">Trial Duration (days)</Label>
              <Input
                id="trial_duration_days"
                type="number"
                min="1"
                value={formData.trial_duration_days}
                onChange={(e) => setFormData({...formData, trial_duration_days: e.target.value})}
                required={formData.option_type === 'trial'}
              />
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createDropIn.isPending}>
              {createDropIn.isPending ? 'Creating...' : 'Create Option'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const CreateDiscountDialog = () => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    applies_to: 'membership',
    is_active: true
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createDiscount = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('discount_types')
        .insert([{
          ...data,
          discount_value: parseFloat(data.discount_value)
        }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discount-types'] });
      toast({ title: "Discount created successfully" });
      setOpen(false);
      setFormData({
        name: '',
        description: '',
        discount_type: 'percentage',
        discount_value: '',
        applies_to: 'membership',
        is_active: true
      });
    },
    onError: (error) => {
      toast({ title: "Error creating discount", description: error.message, variant: "destructive" });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createDiscount.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Discount
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create General Discount</DialogTitle>
          <DialogDescription>
            Add a new general discount (not family-specific)
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Discount Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="discount_type">Discount Type</Label>
              <Select value={formData.discount_type} onValueChange={(value) => setFormData({...formData, discount_type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="discount_value">
                {formData.discount_type === 'percentage' ? 'Percentage (%)' : 'Amount ($)'}
              </Label>
              <Input
                id="discount_value"
                type="number"
                step={formData.discount_type === 'percentage' ? '1' : '0.01'}
                value={formData.discount_value}
                onChange={(e) => setFormData({...formData, discount_value: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="applies_to">Applies To</Label>
              <Select value={formData.applies_to} onValueChange={(value) => setFormData({...formData, applies_to: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="membership">Membership Plans</SelectItem>
                  <SelectItem value="private_sessions">Private Sessions</SelectItem>
                  <SelectItem value="drop_in">Drop-in Classes</SelectItem>
                  <SelectItem value="all">All Services</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createDiscount.isPending}>
              {createDiscount.isPending ? 'Creating...' : 'Create Discount'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// New Family Discount Components
const FamilyDiscountPlansCard = () => {
  const { data: familyPlans } = useQuery({
    queryKey: ['family-discount-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('family_discount_plans')
        .select(`
          *,
          tiers:family_discount_tiers(*)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const formatDiscountValue = (tier: any) => {
    if (tier.discount_type === 'free') return 'Free';
    if (tier.discount_type === 'percentage') return `${tier.discount_value}%`;
    return `$${tier.discount_value}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Family Discount Plans</CardTitle>
        <CardDescription>Progressive discounts for additional family members</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {familyPlans?.map((plan) => (
            <div key={plan.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium">{plan.name}</h4>
                <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                  {plan.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              {plan.description && (
                <p className="text-sm text-muted-foreground mb-3">{plan.description}</p>
              )}
              <div className="grid gap-2">
                {plan.tiers?.sort((a: any, b: any) => a.family_member_position - b.family_member_position)
                  .map((tier: any) => (
                  <div key={tier.id} className="flex justify-between text-sm">
                    <span>{ordinal(tier.family_member_position)} family member:</span>
                    <span className="font-medium">{formatDiscountValue(tier)} off</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-3 gap-2">
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const CreateFamilyDiscountDialog = () => {
  const [open, setOpen] = useState(false);
  const [planData, setPlanData] = useState({
    name: '',
    description: '',
    applies_to: 'membership',
    is_active: true
  });
  const [tiers, setTiers] = useState([
    { family_member_position: 2, discount_type: 'percentage', discount_value: '' }
  ]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createFamilyPlan = useMutation({
    mutationFn: async (data: any) => {
      // First create the plan
      const { data: plan, error: planError } = await supabase
        .from('family_discount_plans')
        .insert([data.plan])
        .select()
        .single();
      
      if (planError) throw planError;

      // Then create the tiers
      const tiersToInsert = data.tiers.map((tier: any) => ({
        ...tier,
        family_plan_id: plan.id,
        discount_value: tier.discount_type === 'free' ? null : parseFloat(tier.discount_value)
      }));

      const { error: tiersError } = await supabase
        .from('family_discount_tiers')
        .insert(tiersToInsert);
      
      if (tiersError) throw tiersError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-discount-plans'] });
      toast({ title: "Family discount plan created successfully" });
      setOpen(false);
      setPlanData({
        name: '',
        description: '',
        applies_to: 'membership',
        is_active: true
      });
      setTiers([{ family_member_position: 2, discount_type: 'percentage', discount_value: '' }]);
    },
    onError: (error) => {
      toast({ title: "Error creating family plan", description: error.message, variant: "destructive" });
    }
  });

  const addTier = () => {
    const nextPosition = Math.max(...tiers.map(t => t.family_member_position)) + 1;
    setTiers([...tiers, { family_member_position: nextPosition, discount_type: 'percentage', discount_value: '' }]);
  };

  const removeTier = (index: number) => {
    setTiers(tiers.filter((_, i) => i !== index));
  };

  const updateTier = (index: number, field: string, value: any) => {
    const newTiers = [...tiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    setTiers(newTiers);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createFamilyPlan.mutate({ plan: planData, tiers });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Add Family Plan
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Family Discount Plan</DialogTitle>
          <DialogDescription>
            Set up progressive discounts for additional family members
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Plan Name</Label>
              <Input
                id="name"
                value={planData.name}
                onChange={(e) => setPlanData({...planData, name: e.target.value})}
                required
                placeholder="e.g., Standard Family Plan"
              />
            </div>
            <div>
              <Label htmlFor="applies_to">Applies To</Label>
              <Select value={planData.applies_to} onValueChange={(value) => setPlanData({...planData, applies_to: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="membership">Membership Plans</SelectItem>
                  <SelectItem value="private_sessions">Private Sessions</SelectItem>
                  <SelectItem value="drop_in">Drop-in Classes</SelectItem>
                  <SelectItem value="all">All Services</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={planData.description}
              onChange={(e) => setPlanData({...planData, description: e.target.value})}
              placeholder="Describe this family discount plan"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <Label className="text-base font-medium">Family Member Discounts</Label>
              <Button type="button" variant="outline" size="sm" onClick={addTier}>
                <Plus className="h-4 w-4 mr-2" />
                Add Tier
              </Button>
            </div>
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                First family member pays full price. Set discounts for additional members:
              </div>
              {tiers.map((tier, index) => (
                <div key={index} className="grid grid-cols-4 gap-3 items-end p-3 border rounded">
                  <div>
                    <Label>Family Member</Label>
                    <Input
                      type="number"
                      min="2"
                      value={tier.family_member_position}
                      onChange={(e) => updateTier(index, 'family_member_position', parseInt(e.target.value))}
                      required
                    />
                  </div>
                  <div>
                    <Label>Discount Type</Label>
                    <Select 
                      value={tier.discount_type} 
                      onValueChange={(value) => updateTier(index, 'discount_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                        <SelectItem value="free">Free</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>
                      {tier.discount_type === 'percentage' ? 'Percentage (%)' : 
                       tier.discount_type === 'fixed_amount' ? 'Amount ($)' : 'Value'}
                    </Label>
                    <Input
                      type="number"
                      step={tier.discount_type === 'percentage' ? '1' : '0.01'}
                      value={tier.discount_value}
                      onChange={(e) => updateTier(index, 'discount_value', e.target.value)}
                      disabled={tier.discount_type === 'free'}
                      required={tier.discount_type !== 'free'}
                      placeholder={tier.discount_type === 'free' ? 'Free' : ''}
                    />
                  </div>
                  <div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeTier(index)}
                      disabled={tiers.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createFamilyPlan.isPending}>
              {createFamilyPlan.isPending ? 'Creating...' : 'Create Family Plan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Edit Discount Form Component
const EditDiscountForm = ({ discount }: { discount: any }) => {
  const [formData, setFormData] = useState({
    name: discount.name || '',
    discount_type: discount.discount_type || 'percentage',
    discount_value: discount.discount_value || '',
    applies_to: discount.applies_to || 'membership',
    description: discount.description || '',
    is_active: discount.is_active ?? true
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateDiscount = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('discount_types')
        .update({
          name: data.name,
          discount_type: data.discount_type,
          discount_value: parseFloat(data.discount_value),
          applies_to: data.applies_to,
          description: data.description,
          is_active: data.is_active
        })
        .eq('id', discount.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discount-types'] });
      toast({ title: "Discount updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Error updating discount", description: error.message, variant: "destructive" });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateDiscount.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Discount Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          required
        />
      </div>
      <div>
        <Label htmlFor="discount_type">Type</Label>
        <Select value={formData.discount_type} onValueChange={(value) => setFormData({...formData, discount_type: value})}>
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
        <Label htmlFor="discount_value">Value</Label>
        <Input
          id="discount_value"
          type="number"
          step="0.01"
          value={formData.discount_value}
          onChange={(e) => setFormData({...formData, discount_value: e.target.value})}
          required
        />
      </div>
      <div>
        <Label htmlFor="applies_to">Applies To</Label>
        <Select value={formData.applies_to} onValueChange={(value) => setFormData({...formData, applies_to: value})}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="membership">Memberships</SelectItem>
            <SelectItem value="private_session">Private Sessions</SelectItem>
            <SelectItem value="all">All Services</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
        />
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
        />
        <Label>Active</Label>
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="submit">Update Discount</Button>
      </div>
    </form>
  );
};

// Helper function for ordinal numbers
const ordinal = (num: number) => {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = num % 100;
  return num + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
};