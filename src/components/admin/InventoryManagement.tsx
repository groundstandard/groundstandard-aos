import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Search,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Shirt,
  Target,
  Star
} from "lucide-react";

interface InventoryItem {
  id: string;
  name: string;
  description: string;
  category: 'uniforms' | 'equipment' | 'gear' | 'supplies' | 'merchandise';
  sku: string;
  current_stock: number;
  min_stock_level: number;
  max_stock_level: number;
  unit_cost: number;
  selling_price: number;
  supplier: string;
  location: string;
  status: 'active' | 'discontinued' | 'out_of_stock';
  created_at: string;
  updated_at: string;
}

export const InventoryManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    category: 'equipment' as InventoryItem['category'],
    sku: '',
    current_stock: 0,
    min_stock_level: 5,
    max_stock_level: 100,
    unit_cost: 0,
    selling_price: 0,
    supplier: '',
    location: '',
    status: 'active' as InventoryItem['status']
  });

  const { data: inventory, isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as InventoryItem[];
    }
  });

  const createItemMutation = useMutation({
    mutationFn: async (itemData: typeof itemForm) => {
      const { data, error } = await supabase
        .from('inventory')
        .insert([itemData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Item added successfully" });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({ 
        title: "Failed to add item", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const updateStockMutation = useMutation({
    mutationFn: async ({ id, quantity, type }: { id: string; quantity: number; type: 'add' | 'remove' }) => {
      const item = inventory?.find(i => i.id === id);
      if (!item) throw new Error('Item not found');

      const newStock = type === 'add' 
        ? item.current_stock + quantity 
        : item.current_stock - quantity;

      const { error } = await supabase
        .from('inventory')
        .update({ 
          current_stock: Math.max(0, newStock),
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Stock updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
    onError: (error) => {
      toast({ 
        title: "Failed to update stock", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const resetForm = () => {
    setItemForm({
      name: '',
      description: '',
      category: 'equipment',
      sku: '',
      current_stock: 0,
      min_stock_level: 5,
      max_stock_level: 100,
      unit_cost: 0,
      selling_price: 0,
      supplier: '',
      location: '',
      status: 'active'
    });
  };

  const filteredInventory = inventory?.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  }) || [];

  const lowStockItems = inventory?.filter(item => 
    item.current_stock <= item.min_stock_level && item.status === 'active'
  ) || [];

  const outOfStockItems = inventory?.filter(item => 
    item.current_stock === 0 && item.status === 'active'
  ) || [];

  const totalValue = inventory?.reduce((sum, item) => 
    sum + (item.current_stock * item.unit_cost), 0
  ) || 0;

  const inventoryStats = {
    totalItems: inventory?.length || 0,
    lowStockCount: lowStockItems.length,
    outOfStockCount: outOfStockItems.length,
    totalValue,
    categories: {
      uniforms: inventory?.filter(i => i.category === 'uniforms').length || 0,
      equipment: inventory?.filter(i => i.category === 'equipment').length || 0,
      gear: inventory?.filter(i => i.category === 'gear').length || 0,
      supplies: inventory?.filter(i => i.category === 'supplies').length || 0,
      merchandise: inventory?.filter(i => i.category === 'merchandise').length || 0,
    }
  };

  const getCategoryIcon = (category: InventoryItem['category']) => {
    switch (category) {
      case 'uniforms': return <Shirt className="h-4 w-4" />;
      case 'equipment': return <Target className="h-4 w-4" />;
      case 'gear': return <Star className="h-4 w-4" />;
      case 'supplies': return <Package className="h-4 w-4" />;
      case 'merchandise': return <ShoppingCart className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.current_stock === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    if (item.current_stock <= item.min_stock_level) return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
    if (item.current_stock >= item.max_stock_level) return { label: 'Overstocked', color: 'bg-blue-100 text-blue-800' };
    return { label: 'In Stock', color: 'bg-green-100 text-green-800' };
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventoryStats.totalItems}</div>
            <p className="text-xs text-muted-foreground">Tracked items</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{inventoryStats.lowStockCount}</div>
            <p className="text-xs text-muted-foreground">Need restocking</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{inventoryStats.outOfStockCount}</div>
            <p className="text-xs text-muted-foreground">Items unavailable</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Inventory value</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="all-items">All Items</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Item</DialogTitle>
                <DialogDescription>
                  Add a new item to your inventory
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Item Name</Label>
                    <Input
                      id="name"
                      value={itemForm.name}
                      onChange={(e) => setItemForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter item name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                      id="sku"
                      value={itemForm.sku}
                      onChange={(e) => setItemForm(prev => ({ ...prev, sku: e.target.value }))}
                      placeholder="Stock keeping unit"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={itemForm.description}
                    onChange={(e) => setItemForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Item description..."
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select 
                      value={itemForm.category} 
                      onValueChange={(value: InventoryItem['category']) => 
                        setItemForm(prev => ({ ...prev, category: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="uniforms">Uniforms</SelectItem>
                        <SelectItem value="equipment">Equipment</SelectItem>
                        <SelectItem value="gear">Gear</SelectItem>
                        <SelectItem value="supplies">Supplies</SelectItem>
                        <SelectItem value="merchandise">Merchandise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="supplier">Supplier</Label>
                    <Input
                      id="supplier"
                      value={itemForm.supplier}
                      onChange={(e) => setItemForm(prev => ({ ...prev, supplier: e.target.value }))}
                      placeholder="Supplier name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={itemForm.location}
                      onChange={(e) => setItemForm(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Storage location"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="unit_cost">Unit Cost ($)</Label>
                    <Input
                      id="unit_cost"
                      type="number"
                      step="0.01"
                      value={itemForm.unit_cost}
                      onChange={(e) => setItemForm(prev => ({ ...prev, unit_cost: parseFloat(e.target.value) }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="selling_price">Selling Price ($)</Label>
                    <Input
                      id="selling_price"
                      type="number"
                      step="0.01"
                      value={itemForm.selling_price}
                      onChange={(e) => setItemForm(prev => ({ ...prev, selling_price: parseFloat(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="current_stock">Current Stock</Label>
                    <Input
                      id="current_stock"
                      type="number"
                      value={itemForm.current_stock}
                      onChange={(e) => setItemForm(prev => ({ ...prev, current_stock: parseInt(e.target.value) }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="min_stock_level">Min Stock Level</Label>
                    <Input
                      id="min_stock_level"
                      type="number"
                      value={itemForm.min_stock_level}
                      onChange={(e) => setItemForm(prev => ({ ...prev, min_stock_level: parseInt(e.target.value) }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="max_stock_level">Max Stock Level</Label>
                    <Input
                      id="max_stock_level"
                      type="number"
                      value={itemForm.max_stock_level}
                      onChange={(e) => setItemForm(prev => ({ ...prev, max_stock_level: parseInt(e.target.value) }))}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => createItemMutation.mutate(itemForm)}
                  disabled={!itemForm.name || createItemMutation.isPending}
                >
                  {createItemMutation.isPending ? "Adding..." : "Add Item"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Category Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Inventory by Category</CardTitle>
                <CardDescription>Items distribution across categories</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(inventoryStats.categories).map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getCategoryIcon(category as InventoryItem['category'])}
                      <span className="capitalize">{category}</span>
                    </div>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Low Stock Alerts */}
            <Card>
              <CardHeader>
                <CardTitle>Stock Alerts</CardTitle>
                <CardDescription>Items requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                {lowStockItems.length > 0 ? (
                  <div className="space-y-3">
                    {lowStockItems.slice(0, 5).map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <div className="font-medium text-sm">{item.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {item.current_stock} remaining (min: {item.min_stock_level})
                          </div>
                        </div>
                        <Badge className="bg-yellow-100 text-yellow-800">
                          Low Stock
                        </Badge>
                      </div>
                    ))}
                    {lowStockItems.length > 5 && (
                      <div className="text-sm text-muted-foreground text-center">
                        +{lowStockItems.length - 5} more items
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>All items are well stocked</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="all-items" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search items..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="uniforms">Uniforms</SelectItem>
                    <SelectItem value="equipment">Equipment</SelectItem>
                    <SelectItem value="gear">Gear</SelectItem>
                    <SelectItem value="supplies">Supplies</SelectItem>
                    <SelectItem value="merchandise">Merchandise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Items Table */}
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Unit Cost</TableHead>
                    <TableHead>Selling Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.map((item) => {
                    const stockStatus = getStockStatus(item);
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-muted-foreground">{item.description}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getCategoryIcon(item.category)}
                            <span className="capitalize">{item.category}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{item.current_stock}</div>
                            <div className="text-muted-foreground">
                              Min: {item.min_stock_level}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>${item.unit_cost.toFixed(2)}</TableCell>
                        <TableCell>${item.selling_price.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge className={stockStatus.color}>
                            {stockStatus.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm">
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                const quantity = prompt('Enter quantity to add:');
                                if (quantity && parseInt(quantity) > 0) {
                                  updateStockMutation.mutate({
                                    id: item.id,
                                    quantity: parseInt(quantity),
                                    type: 'add'
                                  });
                                }
                              }}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Out of Stock Items</CardTitle>
                <CardDescription>Items that need immediate restocking</CardDescription>
              </CardHeader>
              <CardContent>
                {outOfStockItems.length > 0 ? (
                  <div className="space-y-3">
                    {outOfStockItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border border-red-200 rounded">
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-muted-foreground">SKU: {item.sku}</div>
                        </div>
                        <Button size="sm" variant="destructive">
                          Reorder
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No out of stock items</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-yellow-600">Low Stock Items</CardTitle>
                <CardDescription>Items approaching minimum stock levels</CardDescription>
              </CardHeader>
              <CardContent>
                {lowStockItems.length > 0 ? (
                  <div className="space-y-3">
                    {lowStockItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border border-yellow-200 rounded">
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.current_stock} remaining (min: {item.min_stock_level})
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          Reorder
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>All items are well stocked</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Reports</CardTitle>
              <CardDescription>Detailed analysis and reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Inventory reports and analytics will be available here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};