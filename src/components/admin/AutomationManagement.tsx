import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Settings, Zap, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  apiKey: string;
  subaccountId: string;
  webhookUrl: string;
  isConnected: boolean;
}

export const AutomationManagement = () => {
  const { toast } = useToast();
  
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
    apiKey: '',
    subaccountId: '',
    webhookUrl: '',
    isConnected: false
  });

  const [showApiKey, setShowApiKey] = useState(false);

  const handleAutomationToggle = (automation: keyof AutomationSettings, value: boolean) => {
    if (!hlConfig.isConnected && value) {
      toast({
        title: "HighLevel Not Connected",
        description: "Please configure HighLevel connection before enabling automations.",
        variant: "destructive"
      });
      return;
    }

    setAutomations(prev => ({
      ...prev,
      [automation]: value
    }));

    toast({
      title: `Automation ${value ? 'Enabled' : 'Disabled'}`,
      description: `${automation} automation has been ${value ? 'activated' : 'deactivated'}.`
    });
  };

  const handleConfigSave = () => {
    if (!hlConfig.apiKey || !hlConfig.subaccountId) {
      toast({
        title: "Missing Configuration",
        description: "Please provide both API Key and Subaccount ID.",
        variant: "destructive"
      });
      return;
    }

    setHlConfig(prev => ({ ...prev, isConnected: true }));
    toast({
      title: "HighLevel Connected",
      description: "Successfully connected to HighLevel. You can now enable automations.",
    });
  };

  const handleDisconnect = () => {
    setHlConfig({
      apiKey: '',
      subaccountId: '',
      webhookUrl: '',
      isConnected: false
    });
    
    // Disable all automations when disconnecting
    setAutomations(prev => ({
      ...prev,
      bookedLead: false,
      memberSigned: false,
      memberCancelled: false,
      memberAbsent: false,
      memberPresent: false,
      memberDelinquent: false,
      memberCurrent: false
    }));

    toast({
      title: "HighLevel Disconnected",
      description: "All automations have been disabled.",
    });
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Automation Management</h1>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="apiKey">HighLevel API Key</Label>
                  <Input
                    id="apiKey"
                    type={showApiKey ? "text" : "password"}
                    value={hlConfig.apiKey}
                    onChange={(e) => setHlConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                    placeholder="Enter your HighLevel API key"
                  />
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
              </div>
              <div className="space-y-2">
                <Label htmlFor="webhookUrl">Webhook URL (Optional)</Label>
                <Input
                  id="webhookUrl"
                  value={hlConfig.webhookUrl}
                  onChange={(e) => setHlConfig(prev => ({ ...prev, webhookUrl: e.target.value }))}
                  placeholder="Enter webhook URL for incoming data"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={showApiKey}
                  onCheckedChange={setShowApiKey}
                />
                <Label>Show API Key</Label>
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