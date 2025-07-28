import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Copy, ExternalLink } from 'lucide-react';

interface CreatePaymentLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreatePaymentLinkDialog = ({ open, onOpenChange }: CreatePaymentLinkDialogProps) => {
  const { toast } = useToast();
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  
  const [form, setForm] = useState({
    amount: '',
    description: '',
    success_url: window.location.origin + '/payment-success',
    cancel_url: window.location.origin + '/payment-cancelled',
    payment_method_types: 'card'
  });

  const createLinkMutation = useMutation({
    mutationFn: async (formData: typeof form) => {
      const { data, error } = await supabase.functions.invoke('create-payment-link', {
        body: {
          amount: Math.round(parseFloat(formData.amount) * 100),
          description: formData.description,
          success_url: formData.success_url,
          cancel_url: formData.cancel_url,
          payment_method_types: [formData.payment_method_types],
          metadata: {
            created_from: 'admin_panel',
            created_at: new Date().toISOString()
          }
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setGeneratedLink(data.url);
      toast({
        title: 'Payment Link Created',
        description: 'Payment link has been generated successfully.'
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create payment link'
      });
    }
  });

  const copyToClipboard = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      toast({
        title: 'Copied!',
        description: 'Payment link copied to clipboard.'
      });
    }
  };

  const resetForm = () => {
    setForm({
      amount: '',
      description: '',
      success_url: window.location.origin + '/payment-success',
      cancel_url: window.location.origin + '/payment-cancelled',
      payment_method_types: 'card'
    });
    setGeneratedLink(null);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Payment Link</DialogTitle>
          <DialogDescription>
            Generate a secure payment link to share with customers
          </DialogDescription>
        </DialogHeader>
        
        {!generatedLink ? (
          <div className="space-y-4">
            <div>
              <Label>Amount ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Payment for..."
                rows={3}
              />
            </div>

            <div>
              <Label>Payment Method</Label>
              <Select 
                value={form.payment_method_types} 
                onValueChange={(value) => setForm(prev => ({ ...prev, payment_method_types: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="card">Credit/Debit Card</SelectItem>
                  <SelectItem value="ach_debit">ACH Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label>Success URL</Label>
                <Input
                  value={form.success_url}
                  onChange={(e) => setForm(prev => ({ ...prev, success_url: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label>Cancel URL</Label>
                <Input
                  value={form.cancel_url}
                  onChange={(e) => setForm(prev => ({ ...prev, cancel_url: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
            </div>

            <Button 
              onClick={() => createLinkMutation.mutate(form)}
              disabled={createLinkMutation.isPending || !form.amount || !form.description}
              className="w-full"
            >
              {createLinkMutation.isPending ? 'Creating...' : 'Create Payment Link'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800 mb-2">Payment link created successfully!</p>
              <div className="flex items-center gap-2">
                <Input
                  value={generatedLink}
                  readOnly
                  className="bg-white"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(generatedLink, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <Button onClick={() => resetForm()} className="w-full">
              Create Another Link
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};