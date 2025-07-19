import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Settings, Zap, AlertTriangle, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AutomationSettings {
  bookedLead: boolean;
  memberSigned: boolean;
  memberCancelled: boolean;
  memberAbsent: boolean;
  memberPresent: boolean;
  memberDelinquent: boolean;
  memberCurrent: boolean;
  absentDaysThreshold: number;
}

interface HighLevelConfig {
  subaccountId: string;
  webhookUrl: string;
  isConnected: boolean;
}

export const AutomationManagement = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [automations, setAutomations] = useState<AutomationSettings>({
    bookedLead: false,
    memberSigned: false,
    memberCancelled: false,
    memberAbsent: false,
    memberPresent: false,
    memberDelinquent: false,
    memberCurrent: false,
    absentDaysThreshold: 7
  });

  const [hlConfig, setHlConfig] = useState<HighLevelConfig>({
    subaccountId: '',
    webhookUrl: '',
    isConnected: false
  });

  const [showApiKey, setShowApiKey] = useState(false);

  // Load settings from database
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Load automation settings
        const { data: automationData, error: automationError } = await supabase
          .from('automation_settings')
          .select('*')
          .maybeSingle();

        if (automationError) {
          console.error('Error loading automation settings:', automationError);
        } else if (automationData) {
          setAutomations({
            bookedLead: automationData.booked_lead,
            memberSigned: automationData.member_signed,
            memberCancelled: automationData.member_cancelled,
            memberAbsent: automationData.member_absent,
            memberPresent: automationData.member_present,
            memberDelinquent: automationData.member_delinquent,
            memberCurrent: automationData.member_current,
            absentDaysThreshold: automationData.absent_days_threshold
          });
        }

        // Load HighLevel config
        const { data: hlData, error: hlError } = await supabase
          .from('highlevel_config')
          .select('*')
          .maybeSingle();

        if (hlError) {
          console.error('Error loading HighLevel config:', hlError);
        } else if (hlData) {
          setHlConfig({
            subaccountId: hlData.subaccount_id || '',
            webhookUrl: hlData.webhook_url || '',
            isConnected: hlData.is_connected || false
          });
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        toast({
          title: "Error Loading Settings",
          description: "Failed to load automation settings. Please refresh the page.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [toast]);

  // Save automation settings to database
  const saveAutomationSettings = async (newSettings: AutomationSettings) => {
    try {
      const { error } = await supabase
        .from('automation_settings')
        .upsert({
          booked_lead: newSettings.bookedLead,
          member_signed: newSettings.memberSigned,
          member_cancelled: newSettings.memberCancelled,
          member_absent: newSettings.memberAbsent,
          member_present: newSettings.memberPresent,
          member_delinquent: newSettings.memberDelinquent,
          member_current: newSettings.memberCurrent,
          absent_days_threshold: newSettings.absentDaysThreshold
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving automation settings:', error);
      throw error;
    }
  };

  // Save HighLevel config to database
  const saveHighLevelConfig = async (config: HighLevelConfig) => {
    try {
      const { error } = await supabase
        .from('highlevel_config')
        .upsert({
          subaccount_id: config.subaccountId,
          webhook_url: config.webhookUrl,
          is_connected: config.isConnected
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving HighLevel config:', error);
      throw error;
    }
  };

  const handleAutomationToggle = async (automation: keyof AutomationSettings, value: boolean) => {
    if (!hlConfig.isConnected && value) {
      toast({
        title: "HighLevel Not Connected",
        description: "Please configure HighLevel connection before enabling automations.",
        variant: "destructive"
      });
      return;
    }

    const newSettings = {
      ...automations,
      [automation]: value
    };

    try {
      setSaving(true);
      await saveAutomationSettings(newSettings);
      setAutomations(newSettings);

      toast({
        title: `Automation ${value ? 'Enabled' : 'Disabled'}`,
        description: `${automation} automation has been ${value ? 'activated' : 'deactivated'}.`
      });
    } catch (error) {
      toast({
        title: "Error Saving Settings",
        description: "Failed to save automation settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleConfigSave = async () => {
    if (!hlConfig.subaccountId) {
      toast({
        title: "Missing Configuration",
        description: "Please provide the Subaccount ID.",
        variant: "destructive"
      });
      return;
    }

    try {
      setSaving(true);
      const newConfig = { ...hlConfig, isConnected: true };
      await saveHighLevelConfig(newConfig);
      setHlConfig(newConfig);

      toast({
        title: "HighLevel Connected",
        description: "Successfully connected to HighLevel. You can now enable automations.",
      });
    } catch (error) {
      toast({
        title: "Error Saving Configuration",
        description: "Failed to save HighLevel configuration. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setSaving(true);
      
      const newConfig = {
        subaccountId: '',
        webhookUrl: '',
        isConnected: false
      };
      
      const newSettings = {
        ...automations,
        bookedLead: false,
        memberSigned: false,
        memberCancelled: false,
        memberAbsent: false,
        memberPresent: false,
        memberDelinquent: false,
        memberCurrent: false
      };

      await Promise.all([
        saveHighLevelConfig(newConfig),
        saveAutomationSettings(newSettings)
      ]);

      setHlConfig(newConfig);
      setAutomations(newSettings);

      toast({
        title: "HighLevel Disconnected",
        description: "All automations have been disabled.",
      });
    } catch (error) {
      toast({
        title: "Error Disconnecting",
        description: "Failed to disconnect from HighLevel. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const automationItems = [
    {
      key: 'bookedLead' as keyof AutomationSettings,
      title: 'Booked Lead',
      description: 'Receive lead information when appointments are booked in HighLevel',
      icon: <CheckCircle className="h-4 w-4" />,
      direction: 'HL → Software'
    },
    {
      key: 'memberSigned' as keyof AutomationSettings,
      title: 'Member Signed',
      description: 'Send new member information to HighLevel when they sign up',
      icon: <Zap className="h-4 w-4" />,
      direction: 'Software → HL'
    },
    {
      key: 'memberCancelled' as keyof AutomationSettings,
      title: 'Member Cancelled',
      description: 'Notify HighLevel when a member cancels their membership',
      icon: <XCircle className="h-4 w-4" />,
      direction: 'Software → HL'
    },
    {
      key: 'memberAbsent' as keyof AutomationSettings,
      title: 'Member Absent',
      description: `Trigger HighLevel workflow when member is absent for ${automations.absentDaysThreshold} days`,
      icon: <Clock className="h-4 w-4" />,
      direction: 'Software → HL'
    },
    {
      key: 'memberPresent' as keyof AutomationSettings,
      title: 'Member Present',
      description: 'Notify HighLevel when a previously absent member returns to class',
      icon: <CheckCircle className="h-4 w-4" />,
      direction: 'Software → HL'
    },
    {
      key: 'memberDelinquent' as keyof AutomationSettings,
      title: 'Member Delinquent',
      description: 'Notify HighLevel when payment fails or member becomes delinquent',
      icon: <AlertTriangle className="h-4 w-4" />,
      direction: 'Software → HL'
    },
    {
      key: 'memberCurrent' as keyof AutomationSettings,
      title: 'Member Current',
      description: 'Stop collection messaging in HighLevel when payment is resolved',
      icon: <CheckCircle className="h-4 w-4" />,
      direction: 'Software → HL'
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Automation Management</h1>
        </div>
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading automation settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Automation Management</h1>
        {saving && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving...
          </div>
        )}
      </div>

      {/* HighLevel Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            HighLevel Integration
            <Badge variant={hlConfig.isConnected ? "default" : "secondary"}>
              {hlConfig.isConnected ? "Connected" : "Not Connected"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!hlConfig.isConnected ? (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900">API Key Configured</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Your HighLevel API key has been securely stored. Just enter your Subaccount ID to complete the connection.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subaccountId">Subaccount ID</Label>
                <Input
                  id="subaccountId"
                  value={hlConfig.subaccountId}
                  onChange={(e) => setHlConfig(prev => ({ ...prev, subaccountId: e.target.value }))}
                  placeholder="Enter your subaccount ID"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="webhookUrl">Webhook URL for HighLevel</Label>
                <div className="bg-gray-50 border rounded-lg p-3">
                  <code className="text-sm">
                    https://yhriiykdnpuutzexjdee.supabase.co/functions/v1/highlevel-webhook
                  </code>
                </div>
                <p className="text-xs text-muted-foreground">
                  Configure this URL in your HighLevel account to receive appointment bookings
                </p>
              </div>
              
              <Button onClick={handleConfigSave} className="w-full">
                Connect to HighLevel
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Connected to subaccount: <code className="bg-muted px-1 py-0.5 rounded text-xs">{hlConfig.subaccountId}</code>
                </p>
              </div>
              <Button variant="outline" onClick={handleDisconnect}>
                Disconnect
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Automation Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Automation Settings</CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure which automations should be active between your software and HighLevel.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Absent Days Threshold */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label htmlFor="absentDays">Absent Days Threshold</Label>
                <p className="text-sm text-muted-foreground">
                  Number of days before triggering absent member automation
                </p>
              </div>
              <Input
                id="absentDays"
                type="number"
                min="1"
                max="30"
                value={automations.absentDaysThreshold}
                onChange={(e) => setAutomations(prev => ({ 
                  ...prev, 
                  absentDaysThreshold: parseInt(e.target.value) || 7 
                }))}
                className="w-20"
              />
            </div>

            <Separator />

            {/* Automation Switches */}
            <div className="space-y-4">
              {automationItems.map((item) => (
                <div key={item.key} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{item.icon}</div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{item.title}</h3>
                        <Badge variant="outline" className="text-xs">
                          {item.direction}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={automations[item.key] as boolean}
                    onCheckedChange={(checked) => handleAutomationToggle(item.key, checked)}
                    disabled={!hlConfig.isConnected}
                  />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Automation Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {automationItems.map((item) => (
              <div key={item.key} className="text-center p-3 border rounded-lg">
                <div className="flex justify-center mb-2">
                  {automations[item.key] ? (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  ) : (
                    <XCircle className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">
                  {automations[item.key] ? 'Active' : 'Inactive'}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};