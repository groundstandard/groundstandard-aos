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

// Placeholder dialog components that will be implemented
const CreateMembershipPlanDialog = ({ instructors }: { instructors: any[] }) => (
  <Dialog>
    <DialogTrigger asChild>
      <Button>
        <Plus className="h-4 w-4 mr-2" />
        Add Membership Plan
      </Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Create Membership Plan</DialogTitle>
        <DialogDescription>
          Add a new membership plan for your academy
        </DialogDescription>
      </DialogHeader>
      {/* Form will be implemented */}
      <div className="p-4 text-center text-muted-foreground">
        Form coming soon...
      </div>
    </DialogContent>
  </Dialog>
);

const CreatePrivateSessionDialog = ({ instructors }: { instructors: any[] }) => (
  <Dialog>
    <DialogTrigger asChild>
      <Button>
        <Plus className="h-4 w-4 mr-2" />
        Add Private Session
      </Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Create Private Session</DialogTitle>
        <DialogDescription>
          Add a new private session or package option
        </DialogDescription>
      </DialogHeader>
      <div className="p-4 text-center text-muted-foreground">
        Form coming soon...
      </div>
    </DialogContent>
  </Dialog>
);

const CreateDropInDialog = () => (
  <Dialog>
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
      <div className="p-4 text-center text-muted-foreground">
        Form coming soon...
      </div>
    </DialogContent>
  </Dialog>
);

const CreateDiscountDialog = () => (
  <Dialog>
    <DialogTrigger asChild>
      <Button>
        <Plus className="h-4 w-4 mr-2" />
        Add Discount
      </Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Create Discount</DialogTitle>
        <DialogDescription>
          Add a new discount type or family plan
        </DialogDescription>
      </DialogHeader>
      <div className="p-4 text-center text-muted-foreground">
        Form coming soon...
      </div>
    </DialogContent>
  </Dialog>
);