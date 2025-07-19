import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar as CalendarIcon,
  Package,
  TrendingUp,
  TrendingDown,
  ArrowUpCircle,
  ArrowDownCircle,
  RotateCcw,
  AlertTriangle,
  Eye,
  Download
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface StockMovement {
  id: string;
  inventory_id: string;
  movement_type: string;
  quantity: number;
  unit_cost: number | null;
  total_cost: number | null;
  reference_id: string | null;
  notes: string | null;
  created_at: string;
  created_by: string | null;
  inventory?: {
    name: string;
    category: string;
    current_stock: number;
    sku: string;
  };
  profiles?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface StockStats {
  totalMovements: number;
  purchaseValue: number;
  saleValue: number;
  adjustments: number;
  lowStockItems: number;
}

export const StockMovementHistory = () => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [stats, setStats] = useState<StockStats>({
    totalMovements: 0,
    purchaseValue: 0,
    saleValue: 0,
    adjustments: 0,
    lowStockItems: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [selectedMovement, setSelectedMovement] = useState<StockMovement | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { toast } = useToast();

  // New movement form state
  const [newMovement, setNewMovement] = useState({
    inventory_id: "",
    movement_type: "adjustment" as "purchase" | "sale" | "adjustment" | "return" | "damage",
    quantity: "",
    unit_cost: "",
    reference_id: "",
    notes: ""
  });

  useEffect(() => {
    fetchMovements();
    fetchStats();
  }, []);

  const fetchMovements = async () => {
    try {
      const { data, error } = await supabase
        .from('stock_movements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch inventory and profile data separately for each movement
      const movementsWithDetails = await Promise.all(
        (data || []).map(async (movement) => {
          const [inventoryResult, profileResult] = await Promise.all([
            supabase
              .from('inventory')
              .select('name, category, current_stock, sku')
              .eq('id', movement.inventory_id)
              .single(),
            movement.created_by ? supabase
              .from('profiles')
              .select('first_name, last_name, email')
              .eq('id', movement.created_by)
              .single() : Promise.resolve({ data: null })
          ]);
          
          return {
            ...movement,
            inventory: inventoryResult.data,
            profiles: profileResult.data
          };
        })
      );
      
      setMovements(movementsWithDetails);
    } catch (error) {
      console.error('Error fetching stock movements:', error);
      toast({
        title: "Error",
        description: "Failed to fetch stock movements",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const [movementsResult, inventoryResult] = await Promise.all([
        supabase.from('stock_movements').select('movement_type, quantity, total_cost, unit_cost'),
        supabase.from('inventory').select('current_stock, min_stock_level')
      ]);

      if (movementsResult.error || inventoryResult.error) {
        throw movementsResult.error || inventoryResult.error;
      }

      const movements = movementsResult.data || [];
      const inventory = inventoryResult.data || [];

      const totalMovements = movements.length;
      const purchaseValue = movements
        .filter(m => m.movement_type === 'purchase')
        .reduce((sum, m) => sum + (Number(m.total_cost) || 0), 0);
      
      const saleValue = movements
        .filter(m => m.movement_type === 'sale')
        .reduce((sum, m) => sum + (Number(m.total_cost) || 0), 0);
      
      const adjustments = movements.filter(m => m.movement_type === 'adjustment').length;
      const lowStockItems = inventory.filter(item => 
        item.current_stock <= item.min_stock_level
      ).length;

      setStats({
        totalMovements,
        purchaseValue: purchaseValue / 100, // Convert from cents
        saleValue: saleValue / 100, // Convert from cents
        adjustments,
        lowStockItems
      });
    } catch (error) {
      console.error('Error fetching stock stats:', error);
    }
  };

  const handleAddMovement = async () => {
    try {
      const totalCost = Number(newMovement.quantity) * Number(newMovement.unit_cost || 0);
      
      const { error } = await supabase
        .from('stock_movements')
        .insert({
          inventory_id: newMovement.inventory_id,
          movement_type: newMovement.movement_type,
          quantity: Number(newMovement.quantity),
          unit_cost: newMovement.unit_cost ? Number(newMovement.unit_cost) * 100 : null, // Convert to cents
          total_cost: totalCost ? totalCost * 100 : null, // Convert to cents
          reference_id: newMovement.reference_id || null,
          notes: newMovement.notes || null
        });

      if (error) throw error;

      // Update inventory stock based on movement type
      const { data: currentInventory } = await supabase
        .from('inventory')
        .select('current_stock')
        .eq('id', newMovement.inventory_id)
        .single();

      if (currentInventory) {
        let stockChange = 0;
        switch (newMovement.movement_type) {
          case 'purchase':
          case 'return':
            stockChange = Number(newMovement.quantity);
            break;
          case 'sale':
          case 'damage':
            stockChange = -Number(newMovement.quantity);
            break;
          case 'adjustment':
            // For adjustments, the quantity represents the final stock level
            stockChange = Number(newMovement.quantity) - currentInventory.current_stock;
            break;
        }

        await supabase
          .from('inventory')
          .update({ 
            current_stock: Math.max(0, currentInventory.current_stock + stockChange)
          })
          .eq('id', newMovement.inventory_id);
      }

      toast({
        title: "Success",
        description: "Stock movement recorded successfully",
      });

      setShowAddDialog(false);
      setNewMovement({ 
        inventory_id: "", 
        movement_type: "adjustment", 
        quantity: "", 
        unit_cost: "", 
        reference_id: "", 
        notes: "" 
      });
      fetchMovements();
      fetchStats();
    } catch (error) {
      console.error('Error adding stock movement:', error);
      toast({
        title: "Error",
        description: "Failed to record stock movement",
        variant: "destructive",
      });
    }
  };

  const filteredMovements = movements.filter(movement => {
    const matchesSearch = movement.inventory ? 
      movement.inventory.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.inventory.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.inventory.category.toLowerCase().includes(searchTerm.toLowerCase())
      : false;
    
    const matchesType = typeFilter === "all" || movement.movement_type === typeFilter;
    
    const matchesDate = !dateFilter || 
      format(new Date(movement.created_at), 'yyyy-MM-dd') === format(dateFilter, 'yyyy-MM-dd');
    
    return matchesSearch && matchesType && matchesDate;
  });

  const getMovementBadge = (type: string, quantity: number) => {
    const typeConfig = {
      purchase: { label: "Purchase", variant: "default" as const, icon: ArrowUpCircle, color: "text-green-600" },
      sale: { label: "Sale", variant: "secondary" as const, icon: ArrowDownCircle, color: "text-blue-600" },
      adjustment: { label: "Adjustment", variant: "outline" as const, icon: RotateCcw, color: "text-purple-600" },
      return: { label: "Return", variant: "default" as const, icon: ArrowUpCircle, color: "text-green-600" },
      damage: { label: "Damage", variant: "destructive" as const, icon: AlertTriangle, color: "text-red-600" }
    };
    
    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.adjustment;
    const IconComponent = config.icon;
    
    return (
      <div className="flex items-center gap-2">
        <Badge variant={config.variant} className="flex items-center gap-1">
          <IconComponent className="h-3 w-3" />
          {config.label}
        </Badge>
        <span className={`text-sm font-medium ${config.color}`}>
          {type === 'sale' || type === 'damage' ? '-' : '+'}{Math.abs(quantity)}
        </span>
      </div>
    );
  };

  const exportMovements = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Date,Item,SKU,Type,Quantity,Unit Cost,Total Cost,Notes\n" +
      filteredMovements.map(movement => {
        const date = format(new Date(movement.created_at), 'yyyy-MM-dd HH:mm');
        const item = movement.inventory?.name || 'Unknown';
        const sku = movement.inventory?.sku || '';
        const unitCost = movement.unit_cost ? (movement.unit_cost / 100).toFixed(2) : '';
        const totalCost = movement.total_cost ? (movement.total_cost / 100).toFixed(2) : '';
        const notes = (movement.notes || '').replace(/"/g, '""');
        return `"${date}","${item}","${sku}","${movement.movement_type}","${movement.quantity}","${unitCost}","${totalCost}","${notes}"`;
      }).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `stock_movements_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading stock movements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Movements</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMovements}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Purchase Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${stats.purchaseValue.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sale Value</CardTitle>
            <TrendingDown className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">${stats.saleValue.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Adjustments</CardTitle>
            <RotateCcw className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.adjustments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.lowStockItems}</div>
          </CardContent>
        </Card>
      </div>

      {/* Header and Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Stock Movement History</CardTitle>
              <CardDescription>
                Track all inventory movements and stock changes
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportMovements}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Movement
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Record Stock Movement</DialogTitle>
                    <DialogDescription>
                      Record a new inventory movement
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="inventory_id">Inventory Item ID</Label>
                      <Input
                        id="inventory_id"
                        value={newMovement.inventory_id}
                        onChange={(e) => setNewMovement({ ...newMovement, inventory_id: e.target.value })}
                        placeholder="Enter inventory item ID"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="movement_type">Movement Type</Label>
                        <Select value={newMovement.movement_type} onValueChange={(value: any) => setNewMovement({ ...newMovement, movement_type: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="purchase">Purchase</SelectItem>
                            <SelectItem value="sale">Sale</SelectItem>
                            <SelectItem value="adjustment">Adjustment</SelectItem>
                            <SelectItem value="return">Return</SelectItem>
                            <SelectItem value="damage">Damage</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="quantity">Quantity</Label>
                        <Input
                          id="quantity"
                          type="number"
                          value={newMovement.quantity}
                          onChange={(e) => setNewMovement({ ...newMovement, quantity: e.target.value })}
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="unit_cost">Unit Cost (Optional)</Label>
                        <Input
                          id="unit_cost"
                          type="number"
                          step="0.01"
                          value={newMovement.unit_cost}
                          onChange={(e) => setNewMovement({ ...newMovement, unit_cost: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="reference_id">Reference ID (Optional)</Label>
                        <Input
                          id="reference_id"
                          value={newMovement.reference_id}
                          onChange={(e) => setNewMovement({ ...newMovement, reference_id: e.target.value })}
                          placeholder="Order ID, etc."
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="notes">Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        value={newMovement.notes}
                        onChange={(e) => setNewMovement({ ...newMovement, notes: e.target.value })}
                        placeholder="Additional notes..."
                      />
                    </div>
                    {newMovement.quantity && newMovement.unit_cost && (
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          Total Cost: ${(Number(newMovement.quantity) * Number(newMovement.unit_cost)).toFixed(2)}
                        </p>
                      </div>
                    )}
                    <Button onClick={handleAddMovement} className="w-full">
                      Record Movement
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="purchase">Purchase</SelectItem>
                <SelectItem value="sale">Sale</SelectItem>
                <SelectItem value="adjustment">Adjustment</SelectItem>
                <SelectItem value="return">Return</SelectItem>
                <SelectItem value="damage">Damage</SelectItem>
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[200px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFilter ? format(dateFilter, "PPP") : "Filter by date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateFilter}
                  onSelect={setDateFilter}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
                <div className="p-3 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => setDateFilter(undefined)}
                    className="w-full"
                  >
                    Clear Filter
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Stock Movements Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Movement</TableHead>
                  <TableHead>Unit Cost</TableHead>
                  <TableHead>Total Cost</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMovements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell>
                      {format(new Date(movement.created_at), 'MMM dd, HH:mm')}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {movement.inventory?.name || 'Unknown Item'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {movement.inventory?.category}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {movement.inventory?.sku}
                    </TableCell>
                    <TableCell>
                      {getMovementBadge(movement.movement_type, movement.quantity)}
                    </TableCell>
                    <TableCell>
                      {movement.unit_cost ? `$${(movement.unit_cost / 100).toFixed(2)}` : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {movement.total_cost ? `$${(movement.total_cost / 100).toFixed(2)}` : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {movement.profiles ? 
                        `${movement.profiles.first_name} ${movement.profiles.last_name}` : 
                        'System'
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedMovement(movement)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredMovements.length === 0 && (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No stock movements found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Movement Details Dialog */}
      {selectedMovement && (
        <Dialog open={!!selectedMovement} onOpenChange={() => setSelectedMovement(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Stock Movement Details</DialogTitle>
              <DialogDescription>
                Complete information about this stock movement
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date & Time</Label>
                  <p className="text-sm font-medium">
                    {format(new Date(selectedMovement.created_at), 'MMM dd, yyyy HH:mm:ss')}
                  </p>
                </div>
                <div>
                  <Label>Item</Label>
                  <p className="text-sm font-medium">
                    {selectedMovement.inventory?.name || 'Unknown Item'}
                  </p>
                </div>
                <div>
                  <Label>SKU</Label>
                  <p className="text-sm font-mono">{selectedMovement.inventory?.sku}</p>
                </div>
                <div>
                  <Label>Current Stock</Label>
                  <p className="text-sm font-medium">{selectedMovement.inventory?.current_stock}</p>
                </div>
                <div>
                  <Label>Movement Type</Label>
                  {getMovementBadge(selectedMovement.movement_type, selectedMovement.quantity)}
                </div>
                <div>
                  <Label>Quantity</Label>
                  <p className="text-sm font-medium">{selectedMovement.quantity}</p>
                </div>
                <div>
                  <Label>Unit Cost</Label>
                  <p className="text-sm font-medium">
                    {selectedMovement.unit_cost ? `$${(selectedMovement.unit_cost / 100).toFixed(2)}` : 'N/A'}
                  </p>
                </div>
                <div>
                  <Label>Total Cost</Label>
                  <p className="text-sm font-medium">
                    {selectedMovement.total_cost ? `$${(selectedMovement.total_cost / 100).toFixed(2)}` : 'N/A'}
                  </p>
                </div>
              </div>
              
              {selectedMovement.reference_id && (
                <div>
                  <Label>Reference ID</Label>
                  <p className="text-sm font-mono">{selectedMovement.reference_id}</p>
                </div>
              )}
              
              {selectedMovement.notes && (
                <div>
                  <Label>Notes</Label>
                  <p className="text-sm border rounded p-2 bg-muted/50">{selectedMovement.notes}</p>
                </div>
              )}
              
              <div>
                <Label>Created By</Label>
                <p className="text-sm font-medium">
                  {selectedMovement.profiles ? 
                    `${selectedMovement.profiles.first_name} ${selectedMovement.profiles.last_name}` : 
                    'System'
                  }
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};