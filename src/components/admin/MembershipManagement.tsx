import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, DollarSign, Users, Calendar, Grid, List, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { MembershipPlanDialog } from "./MembershipPlanDialog";
import { DiscountDialog } from "./DiscountDialog";
import { DropInDialog } from "./DropInDialog";

interface MembershipPlan {
  id: string;
  name: string;
  description: string;
  base_price_cents: number;
  billing_cycle: string;
  cycle_length_months?: number;
  payment_frequency?: string;
  age_group: string;
  is_active: boolean;
  is_class_pack?: boolean;
  is_unlimited?: boolean;
  classes_per_week?: number;
  class_pack_size?: number;
  pack_expiry_days?: number;
  renewal_enabled?: boolean;
  renewal_discount_percentage?: number;
  renewal_new_rate_enabled?: boolean;
  renewal_new_rate_cents?: number;
  auto_renewal_default?: boolean;
}

interface Discount {
  id: string;
  name: string;
  description: string;
  discount_type: string;
  discount_value: number;
  applies_to: string;
  is_active: boolean;
}

interface DropInOption {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  option_type: string;
  age_group: string;
  trial_duration_days: number;
  is_active: boolean;
}

type SortField = 'name' | 'base_price_cents' | 'billing_cycle' | 'age_group' | 'discount_value' | 'discount_type' | 'applies_to' | 'price_cents' | 'option_type';
type SortOrder = 'asc' | 'desc';

interface SortConfig {
  field: SortField | null;
  order: SortOrder;
}

export const MembershipManagement = () => {
  const { toast } = useToast();
  const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [dropInOptions, setDropInOptions] = useState<DropInOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
  const [dropInDialogOpen, setDropInDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null);
  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null);
  const [selectedDropIn, setSelectedDropIn] = useState<DropInOption | null>(null);

  // View states with persistence
  const [plansViewMode, setPlansViewMode] = useState<'cards' | 'table'>(() => {
    return (localStorage.getItem('plansViewMode') as 'cards' | 'table') || 'cards';
  });
  const [discountsViewMode, setDiscountsViewMode] = useState<'cards' | 'table'>(() => {
    return (localStorage.getItem('discountsViewMode') as 'cards' | 'table') || 'cards';
  });
  const [dropInViewMode, setDropInViewMode] = useState<'cards' | 'table'>(() => {
    return (localStorage.getItem('dropInViewMode') as 'cards' | 'table') || 'cards';
  });

  // Sort states with persistence
  const [plansSort, setPlansSort] = useState<SortConfig>(() => {
    const saved = localStorage.getItem('plansSortConfig');
    return saved ? JSON.parse(saved) : { field: null, order: 'asc' };
  });
  const [discountsSort, setDiscountsSort] = useState<SortConfig>(() => {
    const saved = localStorage.getItem('discountsSortConfig');
    return saved ? JSON.parse(saved) : { field: null, order: 'asc' };
  });
  const [dropInSort, setDropInSort] = useState<SortConfig>(() => {
    const saved = localStorage.getItem('dropInSortConfig');
    return saved ? JSON.parse(saved) : { field: null, order: 'asc' };
  });

  useEffect(() => {
    fetchData();
  }, []);

  // Persist view mode changes
  useEffect(() => {
    localStorage.setItem('plansViewMode', plansViewMode);
  }, [plansViewMode]);

  useEffect(() => {
    localStorage.setItem('discountsViewMode', discountsViewMode);
  }, [discountsViewMode]);

  useEffect(() => {
    localStorage.setItem('dropInViewMode', dropInViewMode);
  }, [dropInViewMode]);

  // Persist sort changes
  useEffect(() => {
    localStorage.setItem('plansSortConfig', JSON.stringify(plansSort));
  }, [plansSort]);

  useEffect(() => {
    localStorage.setItem('discountsSortConfig', JSON.stringify(discountsSort));
  }, [discountsSort]);

  useEffect(() => {
    localStorage.setItem('dropInSortConfig', JSON.stringify(dropInSort));
  }, [dropInSort]);

  // Sorting functions
  const handleSort = (field: SortField, currentSort: SortConfig, setSort: (config: SortConfig) => void) => {
    const newOrder = currentSort.field === field && currentSort.order === 'asc' ? 'desc' : 'asc';
    setSort({ field, order: newOrder });
  };

  const sortData = <T extends Record<string, any>>(data: T[], sortConfig: SortConfig): T[] => {
    if (!sortConfig.field) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.field!];
      const bValue = b[sortConfig.field!];
      
      if (aValue === bValue) return 0;
      
      const comparison = aValue < bValue ? -1 : 1;
      return sortConfig.order === 'asc' ? comparison : -comparison;
    });
  };

  const getSortIcon = (field: SortField, currentSort: SortConfig) => {
    if (currentSort.field !== field) return <ArrowUpDown className="h-4 w-4" />;
    return currentSort.order === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch membership plans
      const { data: plans, error: plansError } = await supabase
        .from('membership_plans')
        .select('*')
        .order('created_at', { ascending: false });

      if (plansError) throw plansError;

      // Fetch discounts
      const { data: discountData, error: discountsError } = await supabase
        .from('discount_types')
        .select('*')
        .order('created_at', { ascending: false });

      if (discountsError) throw discountsError;

      // Fetch drop-in options
      const { data: dropIns, error: dropInsError } = await supabase
        .from('drop_in_options')
        .select('*')
        .order('created_at', { ascending: false });

      if (dropInsError) throw dropInsError;

      setMembershipPlans(plans || []);
      setDiscounts(discountData || []);
      setDropInOptions(dropIns || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load membership data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlan = async (id: string) => {
    try {
      const { error } = await supabase
        .from('membership_plans')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Membership plan deleted successfully",
      });
      
      fetchData();
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast({
        title: "Error",
        description: "Failed to delete membership plan",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDiscount = async (id: string) => {
    try {
      const { error } = await supabase
        .from('discount_types')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Discount deleted successfully",
      });
      
      fetchData();
    } catch (error) {
      console.error('Error deleting discount:', error);
      toast({
        title: "Error",
        description: "Failed to delete discount",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDropIn = async (id: string) => {
    try {
      const { error } = await supabase
        .from('drop_in_options')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Drop-in option deleted successfully",
      });
      
      fetchData();
    } catch (error) {
      console.error('Error deleting drop-in option:', error);
      toast({
        title: "Error",
        description: "Failed to delete drop-in option",
        variant: "destructive",
      });
    }
  };

  const openEditPlanDialog = (plan: MembershipPlan) => {
    setSelectedPlan(plan);
    setPlanDialogOpen(true);
  };

  const openEditDiscountDialog = (discount: Discount) => {
    setSelectedDiscount(discount);
    setDiscountDialogOpen(true);
  };

  const openEditDropInDialog = (dropIn: DropInOption) => {
    setSelectedDropIn(dropIn);
    setDropInDialogOpen(true);
  };

  // Render table headers with sorting
  const renderSortableHeader = (label: string, field: SortField, currentSort: SortConfig, setSort: (config: SortConfig) => void) => (
    <TableHead 
      className="cursor-pointer select-none hover:bg-muted/50" 
      onClick={() => handleSort(field, currentSort, setSort)}
    >
      <div className="flex items-center gap-2">
        {label}
        {getSortIcon(field, currentSort)}
      </div>
    </TableHead>
  );

  // Get sorted data
  const sortedPlans = sortData(membershipPlans, plansSort);
  const sortedDiscounts = sortData(discounts, discountsSort);
  const sortedDropInOptions = sortData(dropInOptions, dropInSort);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading membership data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Membership Management</h1>
          <p className="text-muted-foreground">Manage your academy's membership plans, discounts, and drop-in options</p>
        </div>
      </div>

      <Tabs defaultValue="plans" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="plans">Membership Plans</TabsTrigger>
          <TabsTrigger value="discounts">Discounts</TabsTrigger>
          <TabsTrigger value="drop-ins">Drop-in Options</TabsTrigger>
        </TabsList>

        {/* Membership Plans Tab */}
        <TabsContent value="plans" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Membership Plans</h2>
              <p className="text-muted-foreground">Manage your academy's membership plans and pricing</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center border rounded-md">
                <Button
                  variant={plansViewMode === 'cards' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setPlansViewMode('cards')}
                  className="rounded-r-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={plansViewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setPlansViewMode('table')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
              <Button onClick={() => setPlanDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Plan
              </Button>
            </div>
          </div>

          {plansViewMode === 'cards' ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sortedPlans.length === 0 ? (
                <Card className="md:col-span-2 lg:col-span-3">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No membership plans yet</h3>
                    <p className="text-muted-foreground text-center mb-4">
                      Create your first membership plan to start accepting members
                    </p>
                    <Button onClick={() => setPlanDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Plan
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                sortedPlans.map((plan) => (
                  <Card key={plan.id} className="relative">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {plan.name}
                            {!plan.is_active && <Badge variant="secondary">Inactive</Badge>}
                            {plan.is_class_pack && <Badge variant="outline">Class Pack</Badge>}
                            {plan.is_unlimited && <Badge variant="outline">Unlimited</Badge>}
                          </CardTitle>
                          <CardDescription>{plan.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span>${(plan.base_price_cents / 100).toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="capitalize">{plan.billing_cycle}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="capitalize">{plan.age_group} ages</span>
                        </div>
                        {plan.classes_per_week && (
                          <div className="text-sm text-muted-foreground">
                            {plan.classes_per_week} classes/week
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditPlanDialog(plan)}
                          className="flex-1"
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeletePlan(plan.id)}
                          className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    {renderSortableHeader('Name', 'name', plansSort, setPlansSort)}
                    {renderSortableHeader('Price', 'base_price_cents', plansSort, setPlansSort)}
                    {renderSortableHeader('Billing Cycle', 'billing_cycle', plansSort, setPlansSort)}
                    {renderSortableHeader('Age Group', 'age_group', plansSort, setPlansSort)}
                    <TableHead>Features</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedPlans.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <div className="flex flex-col items-center">
                          <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
                          <p className="text-muted-foreground">No membership plans found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedPlans.map((plan) => (
                      <TableRow key={plan.id}>
                        <TableCell className="font-medium">{plan.name}</TableCell>
                        <TableCell>${(plan.base_price_cents / 100).toFixed(2)}</TableCell>
                        <TableCell className="capitalize">{plan.billing_cycle}</TableCell>
                        <TableCell className="capitalize">{plan.age_group}</TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {plan.is_class_pack && <Badge variant="outline" className="text-xs">Class Pack</Badge>}
                            {plan.is_unlimited && <Badge variant="outline" className="text-xs">Unlimited</Badge>}
                            {plan.classes_per_week && <Badge variant="secondary" className="text-xs">{plan.classes_per_week}/week</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={plan.is_active ? "default" : "secondary"}>
                            {plan.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditPlanDialog(plan)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeletePlan(plan.id)}
                              className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* Discounts Tab */}
        <TabsContent value="discounts" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Discounts</h2>
              <p className="text-muted-foreground">Manage discount codes and promotional offers</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center border rounded-md">
                <Button
                  variant={discountsViewMode === 'cards' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setDiscountsViewMode('cards')}
                  className="rounded-r-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={discountsViewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setDiscountsViewMode('table')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
              <Button onClick={() => setDiscountDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Discount
              </Button>
            </div>
          </div>

          {discountsViewMode === 'cards' ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sortedDiscounts.length === 0 ? (
                <Card className="md:col-span-2 lg:col-span-3">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No discounts yet</h3>
                    <p className="text-muted-foreground text-center mb-4">
                      Create discount codes to offer special pricing to your members
                    </p>
                    <Button onClick={() => setDiscountDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Discount
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                sortedDiscounts.map((discount) => (
                  <Card key={discount.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {discount.name}
                        {!discount.is_active && <Badge variant="secondary">Inactive</Badge>}
                      </CardTitle>
                      <CardDescription>{discount.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Type:</span>
                          <p className="capitalize">{discount.discount_type}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Value:</span>
                          <p>
                            {discount.discount_type === 'percentage' 
                              ? `${discount.discount_value}%`
                              : `$${discount.discount_value}`
                            }
                          </p>
                        </div>
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Applies to:</span>
                          <p className="capitalize">{discount.applies_to.replace('_', ' ')}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDiscountDialog(discount)}
                          className="flex-1"
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteDiscount(discount.id)}
                          className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    {renderSortableHeader('Name', 'name', discountsSort, setDiscountsSort)}
                    {renderSortableHeader('Type', 'discount_type', discountsSort, setDiscountsSort)}
                    {renderSortableHeader('Value', 'discount_value', discountsSort, setDiscountsSort)}
                    {renderSortableHeader('Applies To', 'applies_to', discountsSort, setDiscountsSort)}
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedDiscounts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        <div className="flex flex-col items-center">
                          <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
                          <p className="text-muted-foreground">No discounts found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedDiscounts.map((discount) => (
                      <TableRow key={discount.id}>
                        <TableCell className="font-medium">{discount.name}</TableCell>
                        <TableCell className="capitalize">{discount.discount_type}</TableCell>
                        <TableCell>
                          {discount.discount_type === 'percentage' 
                            ? `${discount.discount_value}%`
                            : `$${discount.discount_value}`
                          }
                        </TableCell>
                        <TableCell className="capitalize">{discount.applies_to.replace('_', ' ')}</TableCell>
                        <TableCell>
                          <Badge variant={discount.is_active ? "default" : "secondary"}>
                            {discount.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDiscountDialog(discount)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteDiscount(discount.id)}
                              className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* Drop-in Options Tab */}
        <TabsContent value="drop-ins" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Drop-in Options</h2>
              <p className="text-muted-foreground">Manage single class and trial options</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center border rounded-md">
                <Button
                  variant={dropInViewMode === 'cards' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setDropInViewMode('cards')}
                  className="rounded-r-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={dropInViewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setDropInViewMode('table')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
              <Button onClick={() => setDropInDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Option
              </Button>
            </div>
          </div>

          {dropInViewMode === 'cards' ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sortedDropInOptions.length === 0 ? (
                <Card className="md:col-span-2 lg:col-span-3">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No drop-in options yet</h3>
                    <p className="text-muted-foreground text-center mb-4">
                      Create drop-in options for single classes and trial sessions
                    </p>
                    <Button onClick={() => setDropInDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Option
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                sortedDropInOptions.map((option) => (
                  <Card key={option.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {option.name}
                        {!option.is_active && <Badge variant="secondary">Inactive</Badge>}
                      </CardTitle>
                      <CardDescription>{option.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span>${(option.price_cents / 100).toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Type:</span>
                          <p className="capitalize">{option.option_type?.replace('_', ' ')}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="capitalize">{option.age_group} ages</span>
                        </div>
                        {option.trial_duration_days && option.trial_duration_days > 0 && (
                          <div>
                            <span className="text-muted-foreground">Trial:</span>
                            <p>{option.trial_duration_days} days</p>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDropInDialog(option)}
                          className="flex-1"
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteDropIn(option.id)}
                          className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    {renderSortableHeader('Name', 'name', dropInSort, setDropInSort)}
                    {renderSortableHeader('Price', 'price_cents', dropInSort, setDropInSort)}
                    {renderSortableHeader('Type', 'option_type', dropInSort, setDropInSort)}
                    <TableHead>Age Group</TableHead>
                    <TableHead>Trial Days</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedDropInOptions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <div className="flex flex-col items-center">
                          <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                          <p className="text-muted-foreground">No drop-in options found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedDropInOptions.map((option) => (
                      <TableRow key={option.id}>
                        <TableCell className="font-medium">{option.name}</TableCell>
                        <TableCell>${(option.price_cents / 100).toFixed(2)}</TableCell>
                        <TableCell className="capitalize">{option.option_type?.replace('_', ' ')}</TableCell>
                        <TableCell className="capitalize">{option.age_group}</TableCell>
                        <TableCell>{option.trial_duration_days || 0} days</TableCell>
                        <TableCell>
                          <Badge variant={option.is_active ? "default" : "secondary"}>
                            {option.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDropInDialog(option)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteDropIn(option.id)}
                              className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <MembershipPlanDialog
        open={planDialogOpen}
        onOpenChange={(open) => {
          setPlanDialogOpen(open);
          if (!open) setSelectedPlan(null);
        }}
        plan={selectedPlan}
        onSuccess={fetchData}
      />

      <DiscountDialog
        open={discountDialogOpen}
        onOpenChange={(open) => {
          setDiscountDialogOpen(open);
          if (!open) setSelectedDiscount(null);
        }}
        discount={selectedDiscount}
        onSuccess={fetchData}
      />

      <DropInDialog
        open={dropInDialogOpen}
        onOpenChange={(open) => {
          setDropInDialogOpen(open);
          if (!open) setSelectedDropIn(null);
        }}
        option={selectedDropIn}
        onSuccess={fetchData}
      />
    </div>
  );
};