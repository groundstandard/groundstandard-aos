import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  ChevronUp, 
  ChevronDown, 
  Save,
  Filter,
  Eye,
  Edit,
  Trash2,
  ArrowUpDown,
  Plus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AllPlan {
  id: string;
  name: string;
  type: 'membership' | 'private_session' | 'drop_in' | 'trial';
  price: number;
  duration?: string;
  ageGroup?: string;
  status: boolean;
  created_at: string;
  // Additional fields for different types
  classes_per_week?: number;
  is_unlimited?: boolean;
  session_type?: string;
  package_size?: number;
  instructor_name?: string;
  trial_duration_days?: number;
}

interface SortConfig {
  key: keyof AllPlan;
  direction: 'asc' | 'desc';
}

interface SavedView {
  id: string;
  name: string;
  sortConfig: SortConfig | null;
  filters: {
    type: string;
    status: string;
    ageGroup: string;
    search: string;
  };
}

// Import the actual create dialogs
import { 
  CreateMembershipPlanDialog,
  CreatePrivateSessionDialog, 
  CreateDropInDialog 
} from './MembershipPlanManagement';

export const SortableAllPlansTable = () => {
  const { toast } = useToast();
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    ageGroup: 'all',
    search: ''
  });
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [newViewName, setNewViewName] = useState('');

  // Fetch all plan types
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

  // Combine all plans into unified format
  const allPlans: AllPlan[] = useMemo(() => {
    const plans: AllPlan[] = [];

    // Add membership plans
    membershipPlans?.forEach(plan => {
      plans.push({
        id: plan.id,
        name: plan.name,
        type: plan.is_class_pack ? 'trial' : 'membership',
        price: plan.base_price_cents,
        duration: plan.is_class_pack ? `${plan.class_pack_size} classes` : `${plan.cycle_length_months}mo`,
        ageGroup: plan.age_group,
        status: plan.is_active,
        created_at: plan.created_at,
        classes_per_week: plan.classes_per_week,
        is_unlimited: plan.is_unlimited
      });
    });

    // Add private sessions
    privateSessions?.forEach(session => {
      plans.push({
        id: session.id,
        name: session.name,
        type: 'private_session',
        price: session.price_per_session_cents,
        duration: `${session.duration_minutes} min`,
        ageGroup: 'all', // Private sessions don't have age groups in the schema
        status: session.is_active,
        created_at: session.created_at,
        session_type: session.session_type,
        package_size: session.package_size,
        instructor_name: session.instructor ? `${session.instructor.first_name} ${session.instructor.last_name}` : 'Any Instructor'
      });
    });

    // Add drop-in options
    dropInOptions?.forEach(option => {
      plans.push({
        id: option.id,
        name: option.name,
        type: option.option_type === 'trial' ? 'trial' : 'drop_in',
        price: option.price_cents,
        duration: option.trial_duration_days ? `${option.trial_duration_days} days` : 'Single class',
        ageGroup: option.age_group,
        status: option.is_active,
        created_at: option.created_at,
        trial_duration_days: option.trial_duration_days
      });
    });

    return plans;
  }, [membershipPlans, privateSessions, dropInOptions]);

  // Filter and sort plans
  const filteredAndSortedPlans = useMemo(() => {
    let filtered = allPlans.filter(plan => {
      const matchesType = filters.type === 'all' || plan.type === filters.type;
      const matchesStatus = filters.status === 'all' || 
        (filters.status === 'active' && plan.status) ||
        (filters.status === 'inactive' && !plan.status);
      const matchesAgeGroup = filters.ageGroup === 'all' || plan.ageGroup === filters.ageGroup;
      const matchesSearch = !filters.search || 
        plan.name.toLowerCase().includes(filters.search.toLowerCase());
      
      return matchesType && matchesStatus && matchesAgeGroup && matchesSearch;
    });

    if (sortConfig) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [allPlans, filters, sortConfig]);

  const handleSort = (key: keyof AllPlan) => {
    setSortConfig(prev => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const saveCurrentView = () => {
    if (!newViewName.trim()) return;
    
    const newView: SavedView = {
      id: Date.now().toString(),
      name: newViewName,
      sortConfig,
      filters: { ...filters }
    };
    
    setSavedViews(prev => [...prev, newView]);
    setNewViewName('');
    setViewDialogOpen(false);
    toast({ title: "View saved successfully" });
  };

  const loadView = (view: SavedView) => {
    setSortConfig(view.sortConfig);
    setFilters(view.filters);
    toast({ title: `Loaded view: ${view.name}` });
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'membership': return '🥋';
      case 'private_session': return '👨‍🏫';
      case 'drop_in': return '📅';
      case 'trial': return '⭐';
      default: return '❓';
    }
  };

  const getSortIcon = (columnKey: keyof AllPlan) => {
    if (sortConfig?.key !== columnKey) {
      return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
    }
    return sortConfig.direction === 'asc' ? 
      <ChevronUp className="h-4 w-4" /> : 
      <ChevronDown className="h-4 w-4" />;
  };

  return (
    <div className="space-y-4">
      {/* Filters and Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>All Plans & Services</span>
            <div className="flex gap-2">
              <CreateMembershipPlanDialog instructors={instructors || []} />
              <CreatePrivateSessionDialog instructors={instructors || []} />
              <CreateDropInDialog />
              <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Save className="h-4 w-4 mr-2" />
                    Save View
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Save Current View</DialogTitle>
                    <DialogDescription>
                      Save your current filters and sorting preferences
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="viewName">View Name</Label>
                      <Input
                        id="viewName"
                        value={newViewName}
                        onChange={(e) => setNewViewName(e.target.value)}
                        placeholder="Enter view name"
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={saveCurrentView} disabled={!newViewName.trim()}>
                        Save View
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              
              {savedViews.length > 0 && (
                <Select onValueChange={(viewId) => {
                  const view = savedViews.find(v => v.id === viewId);
                  if (view) loadView(view);
                }}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Load View" />
                  </SelectTrigger>
                  <SelectContent>
                    {savedViews.map(view => (
                      <SelectItem key={view.id} value={view.id}>
                        <div className="flex items-center">
                          <Eye className="h-4 w-4 mr-2" />
                          {view.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="py-3">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div>
              <Label className="text-xs">Search</Label>
              <Input
                placeholder="Search plans..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs">Type</Label>
              <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="membership">Memberships</SelectItem>
                  <SelectItem value="private_session">Private Sessions</SelectItem>
                  <SelectItem value="drop_in">Drop-in Classes</SelectItem>
                  <SelectItem value="trial">Trials</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Age Group</Label>
              <Select value={filters.ageGroup} onValueChange={(value) => setFilters(prev => ({ ...prev, ageGroup: value }))}>
                <SelectTrigger className="h-8">
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
            <div>
              <Button 
                variant="outline" 
                onClick={() => setFilters({ search: '', type: 'all', status: 'all', ageGroup: 'all' })}
                className="h-8 mt-5"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredAndSortedPlans.length} of {allPlans.length} plans
      </div>

      {/* Sortable Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center">
                  Name
                  {getSortIcon('name')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('type')}
              >
                <div className="flex items-center">
                  Type
                  {getSortIcon('type')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('price')}
              >
                <div className="flex items-center">
                  Price
                  {getSortIcon('price')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('duration')}
              >
                <div className="flex items-center">
                  Duration
                  {getSortIcon('duration')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('ageGroup')}
              >
                <div className="flex items-center">
                  Age Group
                  {getSortIcon('ageGroup')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center">
                  Status
                  {getSortIcon('status')}
                </div>
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedPlans.map((plan) => (
              <TableRow key={`${plan.type}-${plan.id}`}>
                <TableCell className="font-medium">{plan.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span>{getTypeIcon(plan.type)}</span>
                    <Badge variant="outline">
                      {plan.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>{formatPrice(plan.price)}</TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div>{plan.duration}</div>
                    {plan.is_unlimited && (
                      <Badge variant="secondary" className="text-xs">Unlimited</Badge>
                    )}
                    {plan.classes_per_week && !plan.is_unlimited && (
                      <div className="text-xs text-muted-foreground">
                        {plan.classes_per_week}/week
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{plan.ageGroup}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={plan.status ? 'default' : 'secondary'}>
                    {plan.status ? 'Active' : 'Inactive'}
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
        
        {filteredAndSortedPlans.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No plans found matching your criteria
          </div>
        )}
      </Card>
    </div>
  );
};