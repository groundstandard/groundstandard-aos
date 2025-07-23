import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Monitor,
  Settings,
  UserCheck,
  Clock,
  MapPin,
  Smartphone,
  Users,
  QrCode,
  Shield,
  RotateCcw,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface CheckInSettings {
  id: string;
  kiosk_mode_enabled: boolean;
  auto_checkout_hours: number;
  require_class_selection: boolean;
  welcome_message: string;
  allow_early_checkin_minutes?: number;
  allow_late_checkin_minutes?: number;
  require_pin_verification?: boolean;
  enable_location_tracking?: boolean;
  max_distance_meters?: number;
}

interface CheckInRecord {
  id: string;
  student_id: string;
  class_id?: string;
  check_in_time: string;
  check_out_time?: string;
  location_data?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  device_info?: {
    user_agent: string;
    ip_address: string;
  };
  status: 'checked_in' | 'checked_out' | 'auto_checkout';
  notes?: string;
  profiles: {
    first_name: string;
    last_name: string;
    belt_level: string;
  };
}

interface StudentProfile {
  id: string;
  first_name: string;
  last_name: string;
  belt_level: string;
  check_in_pin: string;
  membership_status: string;
}

const KIOSK_THEMES = [
  { name: 'Modern', value: 'modern', bg: 'bg-gradient-to-br from-blue-50 to-indigo-100' },
  { name: 'Dark', value: 'dark', bg: 'bg-gradient-to-br from-gray-900 to-gray-800' },
  { name: 'Martial Arts', value: 'martial', bg: 'bg-gradient-to-br from-red-50 to-orange-100' },
  { name: 'Zen', value: 'zen', bg: 'bg-gradient-to-br from-green-50 to-teal-100' }
];

export const AdvancedCheckInSystem = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [kioskMode, setKioskMode] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('modern');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // Fetch check-in settings
  const { data: settings } = useQuery({
    queryKey: ['checkin-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('check_in_settings')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
  });

  // Fetch today's check-ins
  const { data: todayCheckIns = [] } = useQuery({
    queryKey: ['today-checkins'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          profiles (
            first_name,
            last_name,
            belt_level
          )
        `)
        .eq('date', today)
        .eq('status', 'present')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    refetchInterval: kioskMode ? 10000 : 30000 // More frequent updates in kiosk mode
  });

  // Fetch available classes for today
  const { data: todayClasses = [] } = useQuery({
    queryKey: ['today-classes'],
    queryFn: async () => {
      const dayOfWeek = new Date().getDay();
      
      const { data, error } = await supabase
        .from('class_schedules')
        .select(`
          *,
          classes (
            id,
            name,
            max_students
          )
        `)
        .eq('day_of_week', dayOfWeek)
        .eq('classes.is_active', true);

      if (error) throw error;
      return data || [];
    }
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<CheckInSettings>) => {
      const { data, error } = await supabase
        .from('check_in_settings')
        .upsert(newSettings)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkin-settings'] });
      toast({
        title: 'Success',
        description: 'Check-in settings updated successfully'
      });
    }
  });

  // PIN check-in mutation
  const pinCheckInMutation = useMutation({
    mutationFn: async (data: { pin: string; classId?: string; location?: any }) => {
      const { data: result, error } = await supabase.rpc('check_in_with_pin', {
        pin_code: data.pin,
        class_id_param: data.classId
      });

      if (error) throw error;
      return result;
    },
    onSuccess: (result: any) => {
      if (result?.success) {
        toast({
          title: 'Check-in Successful',
          description: `Welcome, ${result.student_name}!`
        });
        setPinInput('');
        queryClient.invalidateQueries({ queryKey: ['today-checkins'] });
      } else {
        toast({
          variant: 'destructive',
          title: 'Check-in Failed',
          description: result?.error || 'Check-in failed'
        });
      }
    }
  });

  // Get user's location
  useEffect(() => {
    if (settings?.enable_location_tracking && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.warn('Location access denied:', error);
        }
      );
    }
  }, [settings?.enable_location_tracking]);

  const handlePinCheckIn = () => {
    if (pinInput.length !== 4) {
      toast({
        variant: 'destructive',
        title: 'Invalid PIN',
        description: 'PIN must be 4 digits'
      });
      return;
    }

    pinCheckInMutation.mutate({
      pin: pinInput,
      location: currentLocation
    });
  };

  const toggleKioskMode = () => {
    setKioskMode(!kioskMode);
    if (!kioskMode) {
      // Enter kiosk mode
      document.documentElement.requestFullscreen?.();
    } else {
      // Exit kiosk mode
      document.exitFullscreen?.();
    }
  };

  const canManageSettings = profile?.role && ['admin', 'owner'].includes(profile.role);

  if (kioskMode) {
    return (
      <div className={cn(
        'min-h-screen flex flex-col items-center justify-center p-8',
        KIOSK_THEMES.find(t => t.value === selectedTheme)?.bg
      )}>
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl flex items-center justify-center gap-2">
              <UserCheck className="h-8 w-8" />
              Academy Check-In
            </CardTitle>
            <p className="text-muted-foreground">
              {settings?.welcome_message || 'Welcome! Please enter your 4-digit PIN to check in.'}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="pin" className="text-lg">4-Digit PIN</Label>
              <div className="flex gap-2">
                {[0, 1, 2, 3].map((index) => (
                  <Input
                    key={index}
                    type="password"
                    maxLength={1}
                    className="w-16 h-16 text-center text-2xl font-bold"
                    value={pinInput[index] || ''}
                    onChange={(e) => {
                      const newPin = pinInput.split('');
                      newPin[index] = e.target.value;
                      setPinInput(newPin.join('').slice(0, 4));
                      
                      // Auto-focus next input
                      if (e.target.value && index < 3) {
                        const nextInput = (e.target as HTMLInputElement).parentElement?.children[index + 1] as HTMLInputElement;
                        nextInput?.focus();
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !pinInput[index] && index > 0) {
                        const prevInput = (e.target as HTMLInputElement).parentElement?.children[index - 1] as HTMLInputElement;
                        prevInput?.focus();
                      }
                    }}
                  />
                ))}
              </div>
            </div>

            <Button
              onClick={handlePinCheckIn}
              disabled={pinInput.length !== 4 || pinCheckInMutation.isPending}
              className="w-full h-12 text-lg"
              size="lg"
            >
              {pinCheckInMutation.isPending ? 'Checking In...' : 'Check In'}
            </Button>

            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Need help? Contact front desk
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleKioskMode}
                className="text-xs"
              >
                Exit Kiosk Mode
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Check-ins Display */}
        <Card className="mt-8 w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-center">Recent Check-ins</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {todayCheckIns.slice(0, 10).map((checkIn: any) => (
                  <div key={checkIn.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="font-medium">
                        {checkIn.profiles.first_name} {checkIn.profiles.last_name}
                      </span>
                      <Badge variant="outline">{checkIn.profiles.belt_level}</Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(checkIn.created_at), 'h:mm a')}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Advanced Check-In System</h2>
          <p className="text-muted-foreground">Manage student check-ins and kiosk settings</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={toggleKioskMode}
            className="flex items-center gap-2"
          >
            <Monitor className="h-4 w-4" />
            Kiosk Mode
          </Button>
          {canManageSettings && (
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Check-In Settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Welcome Message</Label>
                      <Textarea
                        value={settings?.welcome_message || ''}
                        onChange={(e) => {
                          updateSettingsMutation.mutate({
                            welcome_message: e.target.value
                          });
                        }}
                        placeholder="Welcome message for kiosk"
                        rows={3}
                      />
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={settings?.kiosk_mode_enabled || false}
                          onCheckedChange={(checked) => {
                            updateSettingsMutation.mutate({
                              kiosk_mode_enabled: checked
                            });
                          }}
                        />
                        <Label>Enable Kiosk Mode</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={settings?.require_class_selection || false}
                          onCheckedChange={(checked) => {
                            updateSettingsMutation.mutate({
                              require_class_selection: checked
                            });
                          }}
                        />
                        <Label>Require Class Selection</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={settings?.enable_location_tracking || false}
                          onCheckedChange={(checked) => {
                            updateSettingsMutation.mutate({
                              enable_location_tracking: checked
                            });
                          }}
                        />
                        <Label>Enable Location Tracking</Label>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Auto Checkout (hours)</Label>
                      <Input
                        type="number"
                        value={settings?.auto_checkout_hours || 24}
                        onChange={(e) => {
                          updateSettingsMutation.mutate({
                            auto_checkout_hours: parseInt(e.target.value) || 24
                          });
                        }}
                        min="1"
                        max="72"
                      />
                    </div>
                    <div>
                      <Label>Early Check-in (minutes)</Label>
                      <Input
                        type="number"
                        value={settings?.allow_early_checkin_minutes || 15}
                        onChange={(e) => {
                          updateSettingsMutation.mutate({
                            allow_early_checkin_minutes: parseInt(e.target.value) || 15
                          });
                        }}
                        min="0"
                        max="60"
                      />
                    </div>
                    <div>
                      <Label>Late Check-in (minutes)</Label>
                      <Input
                        type="number"
                        value={settings?.allow_late_checkin_minutes || 30}
                        onChange={(e) => {
                          updateSettingsMutation.mutate({
                            allow_late_checkin_minutes: parseInt(e.target.value) || 30
                          });
                        }}
                        min="0"
                        max="120"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Kiosk Theme</Label>
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {KIOSK_THEMES.map((theme) => (
                        <button
                          key={theme.value}
                          onClick={() => setSelectedTheme(theme.value)}
                          className={cn(
                            'p-4 rounded-lg border-2 transition-all',
                            theme.bg,
                            selectedTheme === theme.value
                              ? 'border-primary'
                              : 'border-transparent hover:border-muted-foreground'
                          )}
                        >
                          <div className="text-sm font-medium">{theme.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Check-In */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Quick Check-In
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="quick-pin">Student PIN</Label>
              <Input
                id="quick-pin"
                type="password"
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="Enter 4-digit PIN"
                className="text-center text-lg font-mono"
              />
            </div>

            {settings?.require_class_selection && (
              <div>
                <Label>Select Class (Optional)</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a class" />
                  </SelectTrigger>
                  <SelectContent>
                    {todayClasses.map((schedule: any) => (
                      <SelectItem key={schedule.id} value={schedule.class_id}>
                        {schedule.classes?.name || 'Unknown Class'} ({schedule.start_time} - {schedule.end_time})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button
              onClick={handlePinCheckIn}
              disabled={pinInput.length !== 4 || pinCheckInMutation.isPending}
              className="w-full"
            >
              {pinCheckInMutation.isPending ? 'Checking In...' : 'Check In'}
            </Button>
          </CardContent>
        </Card>

        {/* Today's Check-ins */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Today's Check-ins ({todayCheckIns.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              {todayCheckIns.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <UserCheck className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No check-ins today</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todayCheckIns.map((checkIn: any) => (
                    <Card key={checkIn.id} className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded-full">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {checkIn.profiles.first_name} {checkIn.profiles.last_name}
                            </p>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {checkIn.profiles.belt_level}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(checkIn.created_at), 'h:mm a')}
                              </span>
                            </div>
                          </div>
                        </div>
                        {checkIn.notes && (
                          <div className="text-xs text-muted-foreground max-w-32 truncate">
                            {checkIn.notes}
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};