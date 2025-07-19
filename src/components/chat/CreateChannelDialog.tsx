import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface CreateChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChannelCreated: (channel: any) => void;
}

export const CreateChannelDialog = ({ open, onOpenChange, onChannelCreated }: CreateChannelDialogProps) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPrivate: false,
    isAdminOnly: false
  });
  const { profile } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Channel name is required'
      });
      return;
    }

    // Create mock channel for now
    const newChannel = {
      id: `channel-${Date.now()}`,
      name: formData.name.toLowerCase().replace(/\s+/g, '-'),
      description: formData.description,
      type: formData.isPrivate ? 'private' : 'public',
      is_admin_only: formData.isAdminOnly,
      created_by: profile?.id,
      member_count: 1,
      unread_count: 0,
      last_message: 'Channel created',
      last_activity: new Date().toISOString()
    };

    onChannelCreated(newChannel);
    
    toast({
      title: 'Success',
      description: `Channel #${formData.name} created successfully`
    });

    // Reset form
    setFormData({
      name: '',
      description: '',
      isPrivate: false,
      isAdminOnly: false
    });
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Channel</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Channel Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. marketing-team"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Use lowercase letters, numbers, and hyphens
            </p>
          </div>

          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="What's this channel about?"
              className="mt-1 min-h-[3rem]"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="private">Make private</Label>
                <p className="text-xs text-muted-foreground">
                  Only invited members can see this channel
                </p>
              </div>
              <Switch
                id="private"
                checked={formData.isPrivate}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPrivate: checked }))}
              />
            </div>

            {profile?.role === 'admin' && (
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="admin-only">Admin only</Label>
                  <p className="text-xs text-muted-foreground">
                    Only administrators can access this channel
                  </p>
                </div>
                <Switch
                  id="admin-only"
                  checked={formData.isAdminOnly}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isAdminOnly: checked }))}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              Create Channel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};