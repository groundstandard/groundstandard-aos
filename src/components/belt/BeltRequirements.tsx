import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Award, Plus, Edit, Trash2, Clock, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BeltProgression {
  id: string;
  belt_level: string;
  next_belt_level: string | null;
  minimum_classes_required: number;
  minimum_time_months: number;
  requirements: any[]; // Using any[] to match database Json type
  belt_order: number;
  is_active: boolean;
  description: string | null;
}

interface RequirementItem {
  id: string;
  description: string;
  category: string;
  required: boolean;
}

interface NewBeltProgression {
  belt_level: string;
  next_belt_level: string;
  minimum_classes_required: number;
  minimum_time_months: number;
  requirements: any[];
  description: string;
  belt_order: number;
}

export const BeltRequirements = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingBelt, setEditingBelt] = useState<BeltProgression | null>(null);
  const [newBelt, setNewBelt] = useState<NewBeltProgression>({
    belt_level: '',
    next_belt_level: '',
    minimum_classes_required: 20,
    minimum_time_months: 3,
    requirements: [],
    description: '',
    belt_order: 1
  });
  const [newRequirement, setNewRequirement] = useState({
    description: '',
    category: 'technique',
    required: true
  });

  // Fetch belt progressions
  const { data: beltProgressions, isLoading } = useQuery({
    queryKey: ['belt-progressions-detailed'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('belt_progressions')
        .select('*')
        .order('belt_order');
      
      if (error) throw error;
      return data;
    }
  });

  // Save belt progression mutation
  const saveBeltMutation = useMutation({
    mutationFn: async (belt: NewBeltProgression) => {
      const { error } = await supabase
        .from('belt_progressions')
        .insert({
          belt_level: belt.belt_level,
          next_belt_level: belt.next_belt_level || null,
          minimum_classes_required: belt.minimum_classes_required,
          minimum_time_months: belt.minimum_time_months,
          requirements: belt.requirements as any,
          description: belt.description,
          belt_order: belt.belt_order,
          is_active: true
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Belt progression saved successfully!'
      });
      queryClient.invalidateQueries({ queryKey: ['belt-progressions-detailed'] });
      setShowAddDialog(false);
      resetNewBelt();
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save belt progression'
      });
    }
  });

  // Update belt progression mutation
  const updateBeltMutation = useMutation({
    mutationFn: async (belt: BeltProgression) => {
      const { error } = await supabase
        .from('belt_progressions')
        .update({
          minimum_classes_required: belt.minimum_classes_required,
          minimum_time_months: belt.minimum_time_months,
          requirements: belt.requirements as any,
          description: belt.description,
          updated_at: new Date().toISOString()
        })
        .eq('id', belt.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Belt requirements updated successfully!'
      });
      queryClient.invalidateQueries({ queryKey: ['belt-progressions-detailed'] });
      setEditingBelt(null);
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update belt requirements'
      });
    }
  });

  const resetNewBelt = () => {
    setNewBelt({
      belt_level: '',
      next_belt_level: '',
      minimum_classes_required: 20,
      minimum_time_months: 3,
      requirements: [],
      description: '',
      belt_order: (beltProgressions?.length || 0) + 1
    });
    setNewRequirement({
      description: '',
      category: 'technique',
      required: true
    });
  };

  const addRequirement = () => {
    if (newRequirement.description.trim()) {
      const req: RequirementItem = {
        id: Date.now().toString(),
        ...newRequirement
      };
      setNewBelt(prev => ({
        ...prev,
        requirements: [...prev.requirements, req]
      }));
      setNewRequirement({
        description: '',
        category: 'technique',
        required: true
      });
    }
  };

  const removeRequirement = (id: string) => {
    setNewBelt(prev => ({
      ...prev,
      requirements: prev.requirements.filter(req => req.id !== id)
    }));
  };

  const getBeltColor = (beltLevel: string) => {
    const colors: Record<string, string> = {
      'White': 'bg-gray-100 text-gray-800',
      'Yellow': 'bg-yellow-100 text-yellow-800',
      'Orange': 'bg-orange-100 text-orange-800',
      'Green': 'bg-green-100 text-green-800',
      'Blue': 'bg-blue-100 text-blue-800',
      'Purple': 'bg-purple-100 text-purple-800',
      'Brown': 'bg-amber-100 text-amber-800',
      'Black': 'bg-gray-900 text-white'
    };
    return colors[beltLevel] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading belt requirements...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Belt Requirements & Progression
            </span>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Belt Level
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Belt Level</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Belt Level</Label>
                      <Input
                        value={newBelt.belt_level}
                        onChange={(e) => setNewBelt(prev => ({ ...prev, belt_level: e.target.value }))}
                        placeholder="e.g., Yellow"
                      />
                    </div>
                    <div>
                      <Label>Next Belt Level</Label>
                      <Input
                        value={newBelt.next_belt_level}
                        onChange={(e) => setNewBelt(prev => ({ ...prev, next_belt_level: e.target.value }))}
                        placeholder="e.g., Orange (leave empty for highest belt)"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Minimum Classes Required</Label>
                      <Input
                        type="number"
                        value={newBelt.minimum_classes_required}
                        onChange={(e) => setNewBelt(prev => ({ ...prev, minimum_classes_required: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                    <div>
                      <Label>Minimum Time (Months)</Label>
                      <Input
                        type="number"
                        value={newBelt.minimum_time_months}
                        onChange={(e) => setNewBelt(prev => ({ ...prev, minimum_time_months: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={newBelt.description}
                      onChange={(e) => setNewBelt(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Description of this belt level..."
                    />
                  </div>

                  <div>
                    <Label>Requirements</Label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          value={newRequirement.description}
                          onChange={(e) => setNewRequirement(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Requirement description..."
                          className="flex-1"
                        />
                        <Button type="button" onClick={addRequirement} size="sm">
                          Add
                        </Button>
                      </div>
                      
                      {newBelt.requirements.length > 0 && (
                        <div className="space-y-1 max-h-32 overflow-y-auto border rounded p-2">
                          {newBelt.requirements.map((req) => (
                            <div key={req.id} className="flex items-center justify-between text-sm">
                              <span>{req.description}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeRequirement(req.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => saveBeltMutation.mutate(newBelt)}
                      disabled={!newBelt.belt_level || saveBeltMutation.isPending}
                      className="flex-1"
                    >
                      {saveBeltMutation.isPending ? 'Saving...' : 'Save Belt Level'}
                    </Button>
                    <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Belt Level</TableHead>
                <TableHead>Next Level</TableHead>
                <TableHead>Requirements</TableHead>
                <TableHead>Time & Classes</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {beltProgressions?.map((belt) => (
                <TableRow key={belt.id}>
                  <TableCell>
                    <Badge className={getBeltColor(belt.belt_level)}>
                      {belt.belt_level}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {belt.next_belt_level ? (
                      <Badge variant="outline" className={getBeltColor(belt.next_belt_level)}>
                        {belt.next_belt_level}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">Max Level</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {Array.isArray(belt.requirements) && belt.requirements.slice(0, 2).map((req: any, idx) => (
                        <div key={idx} className="text-xs text-muted-foreground">
                          • {req.description || 'Requirement'}
                        </div>
                      ))}
                      {Array.isArray(belt.requirements) && belt.requirements.length > 2 && (
                        <div className="text-xs text-muted-foreground">
                          +{belt.requirements.length - 2} more...
                        </div>
                      )}
                      {!Array.isArray(belt.requirements) && (
                        <div className="text-xs text-muted-foreground">No requirements</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-3 w-3" />
                        {belt.minimum_time_months} months
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <Users className="h-3 w-3" />
                        {belt.minimum_classes_required} classes
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingBelt(belt as any)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};