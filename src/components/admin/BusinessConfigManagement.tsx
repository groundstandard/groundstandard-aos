import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAcademy } from '@/hooks/useAcademy';
import { Loader2, Settings, DollarSign, GraduationCap, Calendar, Shield } from 'lucide-react';
import { PriceMappingsManagement } from './PriceMappingsManagement';

interface BusinessConfig {
  id: string;
  key: string;
  value: any;
}

export function BusinessConfigManagement() {
  const [configs, setConfigs] = useState<BusinessConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { academy } = useAcademy();
  const { toast } = useToast();

  useEffect(() => {
    if (academy?.id) {
      loadConfigs();
    }
  }, [academy?.id]);

  const loadConfigs = async () => {
    try {
      const { data, error } = await supabase
        .from('business_config')
        .select('*')
        .eq('academy_id', academy?.id);

      if (error) throw error;
      setConfigs(data || []);
    } catch (error) {
      console.error('Error loading configs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load business configurations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = async (key: string, value: any) => {
    if (!academy?.id) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('business_config')
        .upsert({
          academy_id: academy.id,
          key,
          value,
        });

      if (error) throw error;

      // Update configs array or add new config if it doesn't exist
      setConfigs(prev => {
        const existingIndex = prev.findIndex(config => config.key === key);
        if (existingIndex >= 0) {
          return prev.map(config => 
            config.key === key ? { ...config, value } : config
          );
        } else {
          return [...prev, { id: crypto.randomUUID(), key, value }];
        }
      });

      toast({
        title: 'Success',
        description: 'Configuration updated successfully',
      });
    } catch (error) {
      console.error('Error updating config:', error);
      toast({
        title: 'Error',
        description: 'Failed to update configuration',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getConfigValue = (key: string, defaultValue: any = {}) => {
    const config = configs.find(c => c.key === key);
    return config?.value || getDefaultValue(key);
  };

  const getDefaultValue = (key: string) => {
    const defaults = {
      pricing_strategy: {
        model: 'flat',
        currency: 'USD',
        tax_inclusive: false,
        payment_terms: 'immediate'
      },
      membership_model: {
        trial_days: 7,
        trial_enabled: true,
        auto_renewal: true,
        family_discounts: false
      },
      tax_settings: {
        enabled: false,
        rate: 0.0875,
        inclusive: false
      },
      belt_curriculum: {
        system: 'brazilian_jiu_jitsu',
        testing_enabled: true,
        stripe_requirements: false
      },
      class_schedule: {
        booking_window_hours: 24,
        cancellation_window_hours: 4,
        max_reservations_per_student: 3,
        waitlist_enabled: true
      }
    };
    return defaults[key as keyof typeof defaults] || {};
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading configurations...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Business Configuration</h2>
      </div>

      <Tabs defaultValue="pricing" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="pricing" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Pricing
          </TabsTrigger>
          <TabsTrigger value="prices" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Prices
          </TabsTrigger>
          <TabsTrigger value="membership" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Membership
          </TabsTrigger>
          <TabsTrigger value="tax" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Tax
          </TabsTrigger>
          <TabsTrigger value="belt" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Belt System
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Schedule
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pricing">
          <Card>
            <CardHeader>
              <CardTitle>Pricing Strategy</CardTitle>
              <CardDescription>Configure your academy's pricing model and terms</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <PricingConfig 
                value={getConfigValue('pricing_strategy')} 
                onUpdate={(value) => updateConfig('pricing_strategy', value)}
                saving={saving}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prices">
          <PriceMappingsManagement />
        </TabsContent>

        <TabsContent value="membership">
          <Card>
            <CardHeader>
              <CardTitle>Membership Model</CardTitle>
              <CardDescription>Configure membership types and features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <MembershipConfig 
                value={getConfigValue('membership_model')} 
                onUpdate={(value) => updateConfig('membership_model', value)}
                saving={saving}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tax">
          <Card>
            <CardHeader>
              <CardTitle>Tax Settings</CardTitle>
              <CardDescription>Configure tax rates and regions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <TaxConfig 
                value={getConfigValue('tax_settings')} 
                onUpdate={(value) => updateConfig('tax_settings', value)}
                saving={saving}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="belt">
          <Card>
            <CardHeader>
              <CardTitle>Belt Curriculum</CardTitle>
              <CardDescription>Configure belt system and testing requirements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <BeltConfig 
                value={getConfigValue('belt_curriculum')} 
                onUpdate={(value) => updateConfig('belt_curriculum', value)}
                saving={saving}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle>Class Schedule Settings</CardTitle>
              <CardDescription>Configure booking and scheduling policies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ScheduleConfig 
                value={getConfigValue('class_schedule')} 
                onUpdate={(value) => updateConfig('class_schedule', value)}
                saving={saving}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PricingConfig({ value, onUpdate, saving }: { value: any, onUpdate: (value: any) => void, saving: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label htmlFor="pricing-model">Pricing Model</Label>
        <Select value={value?.model || 'flat'} onValueChange={(model) => onUpdate({ ...value, model })}>
          <SelectTrigger>
            <SelectValue placeholder="Select pricing model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="flat">Flat Rate</SelectItem>
            <SelectItem value="tiered">Tiered Pricing</SelectItem>
            <SelectItem value="usage">Usage-Based</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="currency">Currency</Label>
        <Select value={value?.currency || 'USD'} onValueChange={(currency) => onUpdate({ ...value, currency })}>
          <SelectTrigger>
            <SelectValue placeholder="Select currency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="USD">USD</SelectItem>
            <SelectItem value="EUR">EUR</SelectItem>
            <SelectItem value="GBP">GBP</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center space-x-2">
        <Switch 
          checked={value?.tax_inclusive || false} 
          onCheckedChange={(tax_inclusive) => onUpdate({ ...value, tax_inclusive })}
        />
        <Label>Tax Inclusive Pricing</Label>
      </div>
      <div>
        <Label htmlFor="payment-terms">Payment Terms</Label>
        <Select value={value?.payment_terms || 'immediate'} onValueChange={(payment_terms) => onUpdate({ ...value, payment_terms })}>
          <SelectTrigger>
            <SelectValue placeholder="Select payment terms" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="immediate">Immediate</SelectItem>
            <SelectItem value="15_days">Net 15</SelectItem>
            <SelectItem value="30_days">Net 30</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function MembershipConfig({ value, onUpdate, saving }: { value: any, onUpdate: (value: any) => void, saving: boolean }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="trial-days">Trial Days</Label>
          <Input 
            type="number" 
            value={value?.trial_days || 7} 
            onChange={(e) => onUpdate({ ...value, trial_days: parseInt(e.target.value) || 7 })}
          />
        </div>
        <div className="flex items-center space-x-2">
          <Switch 
            checked={value?.trial_enabled || false} 
            onCheckedChange={(trial_enabled) => onUpdate({ ...value, trial_enabled })}
          />
          <Label>Enable Trial Period</Label>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <Switch 
            checked={value?.auto_renewal || false} 
            onCheckedChange={(auto_renewal) => onUpdate({ ...value, auto_renewal })}
          />
          <Label>Auto Renewal</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch 
            checked={value?.family_discounts || false} 
            onCheckedChange={(family_discounts) => onUpdate({ ...value, family_discounts })}
          />
          <Label>Family Discounts</Label>
        </div>
      </div>
    </div>
  );
}

function TaxConfig({ value, onUpdate, saving }: { value: any, onUpdate: (value: any) => void, saving: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="flex items-center space-x-2">
        <Switch 
          checked={value?.enabled || false} 
          onCheckedChange={(enabled) => onUpdate({ ...value, enabled })}
        />
        <Label>Enable Tax Collection</Label>
      </div>
      <div>
        <Label htmlFor="tax-rate">Tax Rate (%)</Label>
        <Input 
          type="number" 
          step="0.01"
          value={((value?.rate || 0) * 100).toFixed(2)} 
          onChange={(e) => onUpdate({ ...value, rate: parseFloat(e.target.value) / 100 || 0 })}
        />
      </div>
      <div className="flex items-center space-x-2">
        <Switch 
          checked={value?.inclusive || false} 
          onCheckedChange={(inclusive) => onUpdate({ ...value, inclusive })}
        />
        <Label>Tax Inclusive</Label>
      </div>
    </div>
  );
}

function BeltConfig({ value, onUpdate, saving }: { value: any, onUpdate: (value: any) => void, saving: boolean }) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="belt-system">Belt System</Label>
        <Select value={value?.system || 'brazilian_jiu_jitsu'} onValueChange={(system) => onUpdate({ ...value, system })}>
          <SelectTrigger>
            <SelectValue placeholder="Select belt system" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="brazilian_jiu_jitsu">Brazilian Jiu-Jitsu</SelectItem>
            <SelectItem value="karate">Karate</SelectItem>
            <SelectItem value="taekwondo">Taekwondo</SelectItem>
            <SelectItem value="judo">Judo</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <Switch 
            checked={value?.testing_enabled || false} 
            onCheckedChange={(testing_enabled) => onUpdate({ ...value, testing_enabled })}
          />
          <Label>Enable Belt Testing</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch 
            checked={value?.stripe_requirements || false} 
            onCheckedChange={(stripe_requirements) => onUpdate({ ...value, stripe_requirements })}
          />
          <Label>Stripe Requirement System</Label>
        </div>
      </div>
    </div>
  );
}

function ScheduleConfig({ value, onUpdate, saving }: { value: any, onUpdate: (value: any) => void, saving: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label htmlFor="booking-window">Booking Window (hours)</Label>
        <Input 
          type="number" 
          value={value?.booking_window_hours || 24} 
          onChange={(e) => onUpdate({ ...value, booking_window_hours: parseInt(e.target.value) || 24 })}
        />
      </div>
      <div>
        <Label htmlFor="cancellation-window">Cancellation Window (hours)</Label>
        <Input 
          type="number" 
          value={value?.cancellation_window_hours || 4} 
          onChange={(e) => onUpdate({ ...value, cancellation_window_hours: parseInt(e.target.value) || 4 })}
        />
      </div>
      <div>
        <Label htmlFor="max-reservations">Max Reservations per Student</Label>
        <Input 
          type="number" 
          value={value?.max_reservations_per_student || 3} 
          onChange={(e) => onUpdate({ ...value, max_reservations_per_student: parseInt(e.target.value) || 3 })}
        />
      </div>
      <div className="flex items-center space-x-2">
        <Switch 
          checked={value?.waitlist_enabled || false} 
          onCheckedChange={(waitlist_enabled) => onUpdate({ ...value, waitlist_enabled })}
        />
        <Label>Enable Waitlist</Label>
      </div>
    </div>
  );
}