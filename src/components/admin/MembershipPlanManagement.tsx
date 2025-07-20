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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

export const MembershipPlanManagement = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('memberships');

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

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Membership Plans</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{membershipPlans?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Active plans</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Private Sessions</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{privateSessions?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Session types</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drop-in Options</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dropInOptions?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Available options</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Discounts</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{discountTypes?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Discount types</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="memberships">Membership Plans</TabsTrigger>
          <TabsTrigger value="private">Private Sessions</TabsTrigger>
          <TabsTrigger value="dropin">Drop-in & Trials</TabsTrigger>
          <TabsTrigger value="discounts">Discounts</TabsTrigger>
        </TabsList>

        <TabsContent value="memberships" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Membership Plans</h3>
            <CreateMembershipPlanDialog instructors={instructors} />
          </div>
          
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Age Group</TableHead>
                  <TableHead>Classes/Week</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Billing</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {membershipPlans?.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">{plan.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{plan.age_group}</Badge>
                    </TableCell>
                    <TableCell>
                      {plan.is_unlimited ? 'Unlimited' : plan.classes_per_week}
                    </TableCell>
                    <TableCell>{formatPrice(plan.base_price_cents)}</TableCell>
                    <TableCell>{plan.billing_cycle}</TableCell>
                    <TableCell>
                      <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                        {plan.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="private" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Private Sessions</h3>
            <CreatePrivateSessionDialog instructors={instructors} />
          </div>
          
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Package Size</TableHead>
                  <TableHead>Price per Session</TableHead>
                  <TableHead>Total Price</TableHead>
                  <TableHead>Instructor</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {privateSessions?.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-medium">{session.name}</TableCell>
                    <TableCell>
                      <Badge>{session.session_type}</Badge>
                    </TableCell>
                    <TableCell>{session.package_size}</TableCell>
                    <TableCell>{formatPrice(session.price_per_session_cents)}</TableCell>
                    <TableCell>{formatPrice(session.total_price_cents)}</TableCell>
                    <TableCell>
                      {session.instructor ? 
                        `${session.instructor.first_name} ${session.instructor.last_name}` : 
                        'Any Instructor'
                      }
                    </TableCell>
                    <TableCell>{session.duration_minutes} min</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="dropin" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Drop-in Classes & Trial Periods</h3>
            <CreateDropInDialog />
          </div>
          
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Age Group</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dropInOptions?.map((option) => (
                  <TableRow key={option.id}>
                    <TableCell className="font-medium">{option.name}</TableCell>
                    <TableCell>
                      <Badge variant={option.option_type === 'drop_in' ? 'default' : 'secondary'}>
                        {option.option_type === 'drop_in' ? 'Drop-in' : 'Trial'}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatPrice(option.price_cents)}</TableCell>
                    <TableCell>
                      {option.trial_duration_days ? `${option.trial_duration_days} days` : 'Single class'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{option.age_group}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={option.is_active ? 'default' : 'secondary'}>
                        {option.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="discounts" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Discount Types & Family Plans</h3>
            <CreateDiscountDialog />
          </div>
          
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Applies To</TableHead>
                  <TableHead>Min Members</TableHead>
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
                    <TableCell>{discount.minimum_members}</TableCell>
                    <TableCell>
                      <Badge variant={discount.is_active ? 'default' : 'secondary'}>
                        {discount.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Form components with full functionality
const CreateMembershipPlanDialog = ({ instructors }: { instructors: any[] }) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    age_group: 'all',
    base_price_cents: '',
    billing_cycle: 'monthly',
    classes_per_week: '',
    is_unlimited: false,
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
        billing_cycle: 'monthly',
        classes_per_week: '',
        is_unlimited: false,
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Membership Plan</DialogTitle>
          <DialogDescription>
            Add a new membership plan for your academy
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Plan Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
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
              <Label htmlFor="base_price_cents">Monthly Price ($)</Label>
              <Input
                id="base_price_cents"
                type="number"
                step="0.01"
                value={formData.base_price_cents}
                onChange={(e) => setFormData({...formData, base_price_cents: (parseFloat(e.target.value) * 100).toString()})}
                required
              />
            </div>
            <div>
              <Label htmlFor="billing_cycle">Billing Cycle</Label>
              <Select value={formData.billing_cycle} onValueChange={(value) => setFormData({...formData, billing_cycle: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly (3 months)</SelectItem>
                  <SelectItem value="semi_annual">Semi-Annual (6 months)</SelectItem>
                  <SelectItem value="annual">Annual (12 months)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={formData.is_unlimited}
              onCheckedChange={(checked) => setFormData({...formData, is_unlimited: checked})}
            />
            <Label>Unlimited Classes</Label>
          </div>

          {!formData.is_unlimited && (
            <div>
              <Label htmlFor="classes_per_week">Classes per Week</Label>
              <Input
                id="classes_per_week"
                type="number"
                min="1"
                value={formData.classes_per_week}
                onChange={(e) => setFormData({...formData, classes_per_week: e.target.value})}
                required={!formData.is_unlimited}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="setup_fee_cents">Setup Fee ($)</Label>
              <Input
                id="setup_fee_cents"
                type="number"
                step="0.01"
                value={formData.setup_fee_cents}
                onChange={(e) => setFormData({...formData, setup_fee_cents: (parseFloat(e.target.value || '0') * 100).toString()})}
              />
            </div>
            <div>
              <Label htmlFor="trial_days">Trial Days</Label>
              <Input
                id="trial_days"
                type="number"
                min="0"
                value={formData.trial_days}
                onChange={(e) => setFormData({...formData, trial_days: e.target.value})}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createPlan.isPending}>
              {createPlan.isPending ? 'Creating...' : 'Create Plan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const CreatePrivateSessionDialog = ({ instructors }: { instructors: any[] }) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    session_type: 'individual',
    package_size: '1',
    price_per_session_cents: '',
    duration_minutes: '60',
    instructor_id: null,
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
          instructor_id: data.instructor_id || null
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
        instructor_id: null,
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
                value={formData.price_per_session_cents}
                onChange={(e) => setFormData({...formData, price_per_session_cents: (parseFloat(e.target.value) * 100).toString()})}
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
            <Select value={formData.instructor_id || ''} onValueChange={(value) => setFormData({...formData, instructor_id: value || null})}>
              <SelectTrigger>
                <SelectValue placeholder="Any instructor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any Instructor</SelectItem>
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

const CreateDropInDialog = () => {
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
                value={formData.price_cents}
                onChange={(e) => setFormData({...formData, price_cents: (parseFloat(e.target.value) * 100).toString()})}
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
    minimum_members: '1',
    max_family_members: '',
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
          discount_value: parseFloat(data.discount_value),
          minimum_members: parseInt(data.minimum_members),
          max_family_members: data.max_family_members ? parseInt(data.max_family_members) : null
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
        minimum_members: '1',
        max_family_members: '',
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
          <DialogTitle>Create Discount Type</DialogTitle>
          <DialogDescription>
            Add a new discount type or family plan
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="minimum_members">Minimum Family Members</Label>
              <Input
                id="minimum_members"
                type="number"
                min="1"
                value={formData.minimum_members}
                onChange={(e) => setFormData({...formData, minimum_members: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="max_family_members">Maximum Family Members</Label>
              <Input
                id="max_family_members"
                type="number"
                min="1"
                value={formData.max_family_members}
                onChange={(e) => setFormData({...formData, max_family_members: e.target.value})}
              />
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