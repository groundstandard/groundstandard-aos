import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { 
  Calculator,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface TaxSetting {
  id: string;
  jurisdiction: string;
  tax_name: string;
  tax_rate: number;
  tax_type: string;
  applicable_services: string[];
  is_active: boolean;
  effective_date: string;
  created_at: string;
}

export const TaxManagement = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showTaxDialog, setShowTaxDialog] = useState(false);
  const [editingTax, setEditingTax] = useState<TaxSetting | null>(null);
  
  const [taxForm, setTaxForm] = useState({
    jurisdiction: '',
    tax_name: '',
    tax_rate: '',
    tax_type: 'percentage' as 'percentage' | 'fixed',
    applicable_services: [] as string[],
    effective_date: new Date().toISOString().split('T')[0]
  });

  const serviceOptions = [
    'membership',
    'classes',
    'products',
    'equipment',
    'events',
    'testing'
  ];

  // Fetch tax settings
  const { data: taxSettings, isLoading: taxLoading } = useQuery({
    queryKey: ['tax-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tax_settings')
        .select('*')
        .order('jurisdiction', { ascending: true });

      if (error) throw error;
      return data || [];
    }
  });

  // Create/update tax setting mutation
  const saveTaxMutation = useMutation({
    mutationFn: async (formData: typeof taxForm & { id?: string }) => {
      const taxData = {
        jurisdiction: formData.jurisdiction,
        tax_name: formData.tax_name,
        tax_rate: parseFloat(formData.tax_rate) / (formData.tax_type === 'percentage' ? 100 : 1),
        tax_type: formData.tax_type,
        applicable_services: formData.applicable_services,
        effective_date: formData.effective_date
      };

      if (formData.id) {
        const { data, error } = await supabase
          .from('tax_settings')
          .update(taxData)
          .eq('id', formData.id);
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('tax_settings')
          .insert(taxData);
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      toast({
        title: editingTax ? 'Tax Updated' : 'Tax Created',
        description: `Tax setting has been ${editingTax ? 'updated' : 'created'} successfully.`
      });
      setShowTaxDialog(false);
      setEditingTax(null);
      setTaxForm({
        jurisdiction: '',
        tax_name: '',
        tax_rate: '',
        tax_type: 'percentage',
        applicable_services: [],
        effective_date: new Date().toISOString().split('T')[0]
      });
      queryClient.invalidateQueries({ queryKey: ['tax-settings'] });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || `Failed to ${editingTax ? 'update' : 'create'} tax setting`
      });
    }
  });

  // Toggle tax status mutation
  const toggleTaxMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('tax_settings')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-settings'] });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update tax status'
      });
    }
  });

  // Delete tax setting mutation
  const deleteTaxMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('tax_settings')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Tax Deleted',
        description: 'Tax setting has been deleted successfully.'
      });
      queryClient.invalidateQueries({ queryKey: ['tax-settings'] });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete tax setting'
      });
    }
  });

  const handleEdit = (tax: TaxSetting) => {
    setEditingTax(tax);
    setTaxForm({
      jurisdiction: tax.jurisdiction,
      tax_name: tax.tax_name,
      tax_rate: (tax.tax_rate * (tax.tax_type === 'percentage' ? 100 : 1)).toString(),
      tax_type: tax.tax_type as 'percentage' | 'fixed',
      applicable_services: tax.applicable_services,
      effective_date: tax.effective_date
    });
    setShowTaxDialog(true);
  };

  const handleServiceToggle = (service: string) => {
    setTaxForm(prev => ({
      ...prev,
      applicable_services: prev.applicable_services.includes(service)
        ? prev.applicable_services.filter(s => s !== service)
        : [...prev.applicable_services, service]
    }));
  };

  const formatTaxRate = (rate: number, type: string) => {
    if (type === 'percentage') {
      return `${(rate * 100).toFixed(2)}%`;
    } else {
      return `$${rate.toFixed(2)}`;
    }
  };

  const getJurisdictionColor = (jurisdiction: string) => {
    switch (jurisdiction.toLowerCase()) {
      case 'federal':
        return 'bg-blue-100 text-blue-800';
      case 'state':
        return 'bg-green-100 text-green-800';
      case 'local':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-6 w-6" />
                Tax Management
              </CardTitle>
              <CardDescription>
                Configure tax rates and compliance settings
              </CardDescription>
            </div>
            <Dialog open={showTaxDialog} onOpenChange={setShowTaxDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Tax Setting
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingTax ? 'Edit Tax Setting' : 'Add Tax Setting'}
                  </DialogTitle>
                  <DialogDescription>
                    Configure tax rates for different jurisdictions and services
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Jurisdiction</Label>
                      <Select 
                        value={taxForm.jurisdiction} 
                        onValueChange={(value) => setTaxForm(prev => ({ ...prev, jurisdiction: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select jurisdiction" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="federal">Federal</SelectItem>
                          <SelectItem value="state">State</SelectItem>
                          <SelectItem value="local">Local</SelectItem>
                          <SelectItem value="county">County</SelectItem>
                          <SelectItem value="city">City</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Tax Name</Label>
                      <Input
                        value={taxForm.tax_name}
                        onChange={(e) => setTaxForm(prev => ({ ...prev, tax_name: e.target.value }))}
                        placeholder="e.g., Sales Tax, VAT"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Tax Type</Label>
                      <Select 
                        value={taxForm.tax_type} 
                        onValueChange={(value: 'percentage' | 'fixed') => setTaxForm(prev => ({ ...prev, tax_type: value }))}
                      >
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
                      <Label>
                        Tax Rate {taxForm.tax_type === 'percentage' ? '(%)' : '($)'}
                      </Label>
                      <Input
                        type="number"
                        step={taxForm.tax_type === 'percentage' ? '0.01' : '0.01'}
                        value={taxForm.tax_rate}
                        onChange={(e) => setTaxForm(prev => ({ ...prev, tax_rate: e.target.value }))}
                        placeholder={taxForm.tax_type === 'percentage' ? '8.25' : '5.00'}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Effective Date</Label>
                    <Input
                      type="date"
                      value={taxForm.effective_date}
                      onChange={(e) => setTaxForm(prev => ({ ...prev, effective_date: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label>Applicable Services</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {serviceOptions.map((service) => (
                        <div key={service} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={service}
                            checked={taxForm.applicable_services.includes(service)}
                            onChange={() => handleServiceToggle(service)}
                            className="rounded border-gray-300"
                          />
                          <Label htmlFor={service} className="text-sm">
                            {service.charAt(0).toUpperCase() + service.slice(1)}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button 
                    onClick={() => saveTaxMutation.mutate({ ...taxForm, id: editingTax?.id })}
                    disabled={saveTaxMutation.isPending}
                    className="w-full"
                  >
                    {saveTaxMutation.isPending ? 'Saving...' : editingTax ? 'Update Tax' : 'Add Tax'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Tax Compliance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">
                  {taxSettings?.filter(t => t.is_active).length || 0}
                </p>
                <p className="text-sm text-muted-foreground">Active Tax Rules</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">
                  {taxSettings?.filter(t => !t.is_active).length || 0}
                </p>
                <p className="text-sm text-muted-foreground">Inactive Rules</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Settings className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">
                  {new Set(taxSettings?.map(t => t.jurisdiction)).size || 0}
                </p>
                <p className="text-sm text-muted-foreground">Jurisdictions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tax Settings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tax Settings</CardTitle>
          <CardDescription>
            Manage tax rates for different jurisdictions and services
          </CardDescription>
        </CardHeader>
        <CardContent>
          {taxLoading ? (
            <div className="text-center py-6">Loading tax settings...</div>
          ) : taxSettings?.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              No tax settings configured
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Jurisdiction</TableHead>
                  <TableHead>Tax Name</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Applicable Services</TableHead>
                  <TableHead>Effective Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {taxSettings?.map((tax) => (
                  <TableRow key={tax.id}>
                    <TableCell>
                      <Badge className={getJurisdictionColor(tax.jurisdiction)}>
                        {tax.jurisdiction}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{tax.tax_name}</TableCell>
                    <TableCell>{formatTaxRate(tax.tax_rate, tax.tax_type)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {tax.applicable_services.slice(0, 3).map((service) => (
                          <Badge key={service} variant="outline" className="text-xs">
                            {service}
                          </Badge>
                        ))}
                        {tax.applicable_services.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{tax.applicable_services.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(tax.effective_date), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={tax.is_active}
                        onCheckedChange={(checked) => 
                          toggleTaxMutation.mutate({ id: tax.id, is_active: checked })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(tax)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteTaxMutation.mutate(tax.id)}
                          disabled={deleteTaxMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};