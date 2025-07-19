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
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Download,
  FileText,
  Calendar,
  Users,
  DollarSign,
  Send,
  Edit,
  Trash2
} from "lucide-react";
import { format } from "date-fns";

interface Invoice {
  id: string;
  user_id: string;
  invoice_number: string;
  amount: number;
  currency: string;
  status: string;
  due_date: string | null;
  notes: string | null;
  line_items: any;
  stripe_invoice_id: string | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface InvoiceStats {
  totalInvoices: number;
  totalAmount: number;
  draftInvoices: number;
  overdueInvoices: number;
}

export const InvoiceManagement = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<InvoiceStats>({
    totalInvoices: 0,
    totalAmount: 0,
    draftInvoices: 0,
    overdueInvoices: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { toast } = useToast();

  // New invoice form state
  const [newInvoice, setNewInvoice] = useState({
    user_id: "",
    amount: "",
    currency: "usd",
    due_date: "",
    notes: "",
    line_items: [{ description: "", quantity: 1, unit_price: 0 }]
  });

  useEffect(() => {
    fetchInvoices();
    fetchStats();
  }, []);

  const fetchInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch profile data separately for each invoice
      const invoicesWithProfiles = await Promise.all(
        (data || []).map(async (invoice) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name, email')
            .eq('id', invoice.user_id)
            .single();
          
          return {
            ...invoice,
            profiles: profile
          };
        })
      );
      
      setInvoices(invoicesWithProfiles);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast({
        title: "Error",
        description: "Failed to fetch invoices",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('amount, status, due_date');

      if (error) throw error;

      const totalInvoices = data?.length || 0;
      const totalAmount = data?.reduce((sum, invoice) => sum + Number(invoice.amount), 0) || 0;
      const draftInvoices = data?.filter(invoice => invoice.status === 'draft').length || 0;
      
      const today = new Date();
      const overdueInvoices = data?.filter(invoice => {
        if (!invoice.due_date || invoice.status === 'paid') return false;
        return new Date(invoice.due_date) < today;
      }).length || 0;

      setStats({
        totalInvoices,
        totalAmount: totalAmount / 100, // Convert from cents
        draftInvoices,
        overdueInvoices
      });
    } catch (error) {
      console.error('Error fetching invoice stats:', error);
    }
  };

  const handleCreateInvoice = async () => {
    try {
      const lineItems = newInvoice.line_items.filter(item => item.description.trim());
      const totalAmount = lineItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

      const { error } = await supabase
        .from('invoices')
        .insert({
          user_id: newInvoice.user_id,
          amount: Math.round(totalAmount * 100), // Convert to cents
          currency: newInvoice.currency,
          due_date: newInvoice.due_date || null,
          notes: newInvoice.notes || null,
          line_items: lineItems,
          status: 'draft',
          invoice_number: `INV-${Date.now()}` // Temporary until trigger generates it
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Invoice created successfully",
      });

      setShowCreateDialog(false);
      resetNewInvoiceForm();
      fetchInvoices();
      fetchStats();
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast({
        title: "Error",
        description: "Failed to create invoice",
        variant: "destructive",
      });
    }
  };

  const resetNewInvoiceForm = () => {
    setNewInvoice({
      user_id: "",
      amount: "",
      currency: "usd",
      due_date: "",
      notes: "",
      line_items: [{ description: "", quantity: 1, unit_price: 0 }]
    });
  };

  const addLineItem = () => {
    setNewInvoice({
      ...newInvoice,
      line_items: [...newInvoice.line_items, { description: "", quantity: 1, unit_price: 0 }]
    });
  };

  const updateLineItem = (index: number, field: string, value: any) => {
    const updatedItems = newInvoice.line_items.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    setNewInvoice({ ...newInvoice, line_items: updatedItems });
  };

  const removeLineItem = (index: number) => {
    if (newInvoice.line_items.length > 1) {
      const updatedItems = newInvoice.line_items.filter((_, i) => i !== index);
      setNewInvoice({ ...newInvoice, line_items: updatedItems });
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.profiles ? 
      `${invoice.profiles.first_name} ${invoice.profiles.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.profiles.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())
      : invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: "Draft", variant: "secondary" as const },
      sent: { label: "Sent", variant: "default" as const },
      paid: { label: "Paid", variant: "default" as const },
      overdue: { label: "Overdue", variant: "destructive" as const },
      cancelled: { label: "Cancelled", variant: "outline" as const }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInvoices}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalAmount.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft Invoices</CardTitle>
            <Edit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.draftInvoices}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.overdueInvoices}</div>
          </CardContent>
        </Card>
      </div>

      {/* Header and Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Invoice Management</CardTitle>
              <CardDescription>
                Create, manage, and track invoices for your academy
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Invoice
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Invoice</DialogTitle>
                    <DialogDescription>
                      Create a new invoice for a student or customer
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="user_id">Customer ID</Label>
                        <Input
                          id="user_id"
                          value={newInvoice.user_id}
                          onChange={(e) => setNewInvoice({ ...newInvoice, user_id: e.target.value })}
                          placeholder="Enter customer ID"
                        />
                      </div>
                      <div>
                        <Label htmlFor="due_date">Due Date</Label>
                        <Input
                          id="due_date"
                          type="date"
                          value={newInvoice.due_date}
                          onChange={(e) => setNewInvoice({ ...newInvoice, due_date: e.target.value })}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label>Line Items</Label>
                      {newInvoice.line_items.map((item, index) => (
                        <div key={index} className="flex gap-2 mt-2">
                          <Input
                            placeholder="Description"
                            value={item.description}
                            onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                            className="flex-1"
                          />
                          <Input
                            type="number"
                            placeholder="Qty"
                            value={item.quantity}
                            onChange={(e) => updateLineItem(index, 'quantity', Number(e.target.value))}
                            className="w-20"
                          />
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Price"
                            value={item.unit_price}
                            onChange={(e) => updateLineItem(index, 'unit_price', Number(e.target.value))}
                            className="w-24"
                          />
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={() => removeLineItem(index)}
                            disabled={newInvoice.line_items.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button type="button" variant="outline" size="sm" onClick={addLineItem} className="mt-2">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Line Item
                      </Button>
                    </div>

                    <div>
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={newInvoice.notes}
                        onChange={(e) => setNewInvoice({ ...newInvoice, notes: e.target.value })}
                        placeholder="Invoice notes..."
                      />
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-semibold">
                        Total: ${newInvoice.line_items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0).toFixed(2)}
                      </p>
                    </div>

                    <Button onClick={handleCreateInvoice} className="w-full">
                      Create Invoice
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Invoices Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {invoice.invoice_number}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {invoice.profiles ? 
                            `${invoice.profiles.first_name} ${invoice.profiles.last_name}` : 
                            'Unknown Customer'
                          }
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {invoice.profiles?.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      ${(Number(invoice.amount) / 100).toFixed(2)}
                    </TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell>
                      {invoice.due_date ? format(new Date(invoice.due_date), 'MMM dd, yyyy') : 'No due date'}
                    </TableCell>
                    <TableCell>
                      {format(new Date(invoice.created_at), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedInvoice(invoice)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredInvoices.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No invoices found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Details Dialog */}
      {selectedInvoice && (
        <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Invoice Details - {selectedInvoice.invoice_number}</DialogTitle>
              <DialogDescription>
                Detailed information about this invoice
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Customer</Label>
                  <p className="text-sm font-medium">
                    {selectedInvoice.profiles ? 
                      `${selectedInvoice.profiles.first_name} ${selectedInvoice.profiles.last_name}` : 
                      'Unknown Customer'
                    }
                  </p>
                </div>
                <div>
                  <Label>Amount</Label>
                  <p className="text-sm font-medium">${(Number(selectedInvoice.amount) / 100).toFixed(2)}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  {getStatusBadge(selectedInvoice.status)}
                </div>
                <div>
                  <Label>Due Date</Label>
                  <p className="text-sm font-medium">
                    {selectedInvoice.due_date ? format(new Date(selectedInvoice.due_date), 'MMM dd, yyyy') : 'No due date'}
                  </p>
                </div>
                <div>
                  <Label>Created</Label>
                  <p className="text-sm font-medium">
                    {format(new Date(selectedInvoice.created_at), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
                <div>
                  <Label>Currency</Label>
                  <p className="text-sm font-medium uppercase">{selectedInvoice.currency}</p>
                </div>
              </div>
              
              {selectedInvoice.line_items && (
                <div>
                  <Label>Line Items</Label>
                  <div className="border rounded-md p-3">
                    {selectedInvoice.line_items.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between py-1">
                        <span>{item.description} (x{item.quantity})</span>
                        <span>${(item.quantity * item.unit_price).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedInvoice.notes && (
                <div>
                  <Label>Notes</Label>
                  <p className="text-sm">{selectedInvoice.notes}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};