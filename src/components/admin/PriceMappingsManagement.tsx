import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAcademy } from '@/hooks/useAcademy';
import { Loader2, Plus, Edit, Trash2, DollarSign } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Price {
  id: string;
  name: string;
  stripe_price_id: string;
  created_at: string;
  updated_at: string;
}

export function PriceMappingsManagement() {
  const [prices, setPrices] = useState<Price[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingPrice, setEditingPrice] = useState<Price | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { academy } = useAcademy();
  const { toast } = useToast();

  useEffect(() => {
    if (academy?.id) {
      loadPrices();
    }
  }, [academy?.id]);

  const loadPrices = async () => {
    try {
      const { data, error } = await supabase
        .from('prices')
        .select('*')
        .eq('academy_id', academy?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPrices(data || []);
    } catch (error) {
      console.error('Error loading prices:', error);
      toast({
        title: 'Error',
        description: 'Failed to load price mappings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!academy?.id) return;

    const formData = new FormData(event.currentTarget);
    const name = formData.get('name') as string;
    const stripe_price_id = formData.get('stripe_price_id') as string;

    if (!name || !stripe_price_id) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      if (editingPrice) {
        // Update existing price
        const { error } = await supabase
          .from('prices')
          .update({ name, stripe_price_id })
          .eq('id', editingPrice.id);

        if (error) throw error;

        setPrices(prev => prev.map(p => 
          p.id === editingPrice.id 
            ? { ...p, name, stripe_price_id, updated_at: new Date().toISOString() }
            : p
        ));

        toast({
          title: 'Success',
          description: 'Price mapping updated successfully',
        });
      } else {
        // Create new price
        const { data, error } = await supabase
          .from('prices')
          .insert({
            academy_id: academy.id,
            name,
            stripe_price_id,
          })
          .select()
          .single();

        if (error) throw error;

        setPrices(prev => [data, ...prev]);

        toast({
          title: 'Success',
          description: 'Price mapping created successfully',
        });
      }

      setIsDialogOpen(false);
      setEditingPrice(null);
    } catch (error) {
      console.error('Error saving price:', error);
      toast({
        title: 'Error',
        description: 'Failed to save price mapping',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this price mapping?')) return;

    try {
      const { error } = await supabase
        .from('prices')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPrices(prev => prev.filter(p => p.id !== id));

      toast({
        title: 'Success',
        description: 'Price mapping deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting price:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete price mapping',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (price: Price) => {
    setEditingPrice(price);
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingPrice(null);
    setIsDialogOpen(true);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading price mappings...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Price Mappings
            </CardTitle>
            <CardDescription>
              Map your academy's pricing plans to Stripe price IDs
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-2" />
                Add Price
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSave}>
                <DialogHeader>
                  <DialogTitle>
                    {editingPrice ? 'Edit Price Mapping' : 'Add Price Mapping'}
                  </DialogTitle>
                  <DialogDescription>
                    Create a mapping between your plan name and Stripe price ID
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div>
                    <Label htmlFor="name">Plan Name</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="e.g., Monthly Premium"
                      defaultValue={editingPrice?.name}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="stripe_price_id">Stripe Price ID</Label>
                    <Input
                      id="stripe_price_id"
                      name="stripe_price_id"
                      placeholder="e.g., price_1234567890abcdef"
                      defaultValue={editingPrice?.stripe_price_id}
                      required
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      editingPrice ? 'Update' : 'Create'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {prices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No price mappings configured yet</p>
            <p className="text-sm">Add your first price mapping to get started</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan Name</TableHead>
                <TableHead>Stripe Price ID</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prices.map((price) => (
                <TableRow key={price.id}>
                  <TableCell className="font-medium">{price.name}</TableCell>
                  <TableCell className="font-mono text-sm">{price.stripe_price_id}</TableCell>
                  <TableCell>
                    {new Date(price.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(price)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(price.id)}
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
  );
}