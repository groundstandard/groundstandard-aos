import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Loader2 } from "lucide-react";

interface CheckInSettingsProps {
  settings: {
    id: string;
    kiosk_mode_enabled: boolean;
    welcome_message: string;
    require_class_selection: boolean;
    auto_checkout_hours: number;
  };
  onSettingsUpdate: (settings: any) => void;
  onBack: () => void;
}

export const CheckInSettings = ({ settings, onSettingsUpdate, onBack }: CheckInSettingsProps) => {
  const [formData, setFormData] = useState({
    welcome_message: settings.welcome_message,
    require_class_selection: settings.require_class_selection,
    auto_checkout_hours: settings.auto_checkout_hours,
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('check_in_settings')
        .update({
          welcome_message: formData.welcome_message,
          require_class_selection: formData.require_class_selection,
          auto_checkout_hours: formData.auto_checkout_hours,
          updated_at: new Date().toISOString(),
        })
        .eq('id', settings.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      onSettingsUpdate(data);
      toast({
        title: "Settings Saved",
        description: "Check-in settings have been updated successfully",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h2 className="text-2xl font-bold">Check-In Settings</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kiosk Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="welcome-message">Welcome Message</Label>
            <Textarea
              id="welcome-message"
              value={formData.welcome_message}
              onChange={(e) => setFormData(prev => ({ ...prev, welcome_message: e.target.value }))}
              placeholder="Enter the welcome message displayed on the kiosk"
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Require Class Selection</Label>
              <p className="text-sm text-muted-foreground">
                Students must select which class they're attending
              </p>
            </div>
            <Switch
              checked={formData.require_class_selection}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, require_class_selection: checked }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="auto-checkout">Auto Checkout Hours</Label>
            <Input
              id="auto-checkout"
              type="number"
              min="1"
              max="48"
              value={formData.auto_checkout_hours}
              onChange={(e) => 
                setFormData(prev => ({ ...prev, auto_checkout_hours: parseInt(e.target.value) || 24 }))
              }
            />
            <p className="text-sm text-muted-foreground">
              Automatically check out students after this many hours
            </p>
          </div>

          <Button onClick={handleSave} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};