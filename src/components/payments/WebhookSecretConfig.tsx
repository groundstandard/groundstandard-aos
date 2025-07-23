import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, AlertTriangle, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface WebhookSecretConfigProps {
  onConfigured?: () => void;
}

export const WebhookSecretConfig = ({ onConfigured }: WebhookSecretConfigProps) => {
  const [webhookSecret, setWebhookSecret] = useState("");
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const webhookEndpoint = `${window.location.origin.replace('http://', 'https://')}/functions/v1/stripe-webhook`;

  const handleConfigureSecret = async () => {
    if (!webhookSecret.trim()) {
      toast({
        title: "Error",
        description: "Please enter your Stripe webhook secret",
        variant: "destructive"
      });
      return;
    }

    setIsConfiguring(true);
    try {
      // Test the webhook secret by calling a validation function
      const { error } = await supabase.functions.invoke('validate-webhook-secret', {
        body: { webhook_secret: webhookSecret }
      });

      if (error) {
        throw error;
      }

      setIsConfigured(true);
      toast({
        title: "Success",
        description: "Webhook secret configured successfully",
      });
      onConfigured?.();
    } catch (error) {
      toast({
        title: "Configuration Failed",
        description: error instanceof Error ? error.message : "Failed to configure webhook secret",
        variant: "destructive"
      });
    } finally {
      setIsConfiguring(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied",
        description: "Endpoint URL copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Webhook Secret Configuration
          {isConfigured && (
            <Badge variant="default" className="ml-2">
              Configured
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Configure your Stripe webhook secret to enable secure webhook processing.
            This is required for production use.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div>
            <Label htmlFor="webhook-endpoint">Webhook Endpoint URL</Label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                id="webhook-endpoint"
                value={webhookEndpoint}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(webhookEndpoint)}
                className="shrink-0"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Add this URL to your Stripe webhook configuration
            </p>
          </div>

          <div>
            <Label htmlFor="webhook-secret">Stripe Webhook Secret</Label>
            <Input
              id="webhook-secret"
              type="password"
              placeholder="whsec_..."
              value={webhookSecret}
              onChange={(e) => setWebhookSecret(e.target.value)}
              className="font-mono"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Find this in your Stripe Dashboard → Developers → Webhooks → [Your Webhook] → Signing secret
            </p>
          </div>

          <Button
            onClick={handleConfigureSecret}
            disabled={isConfiguring || !webhookSecret.trim()}
            className="w-full"
          >
            {isConfiguring ? "Configuring..." : "Configure Webhook Secret"}
          </Button>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-medium mb-2">Required Webhook Events</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <Badge variant="outline">checkout.session.completed</Badge>
            <Badge variant="outline">customer.subscription.*</Badge>
            <Badge variant="outline">invoice.payment_*</Badge>
            <Badge variant="outline">payment_intent.succeeded</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};