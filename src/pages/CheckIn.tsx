import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useEffectiveRole } from "@/hooks/useEffectiveRole";
import { BackButton } from "@/components/ui/BackButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckInForm } from "@/components/checkin/CheckInForm";
import { CheckInKiosk } from "@/components/checkin/CheckInKiosk";
import { CheckInSettings } from "@/components/checkin/CheckInSettings";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";
import { Smartphone, Tablet, Settings, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CheckInSettingsType {
  id: string;
  kiosk_mode_enabled: boolean;
  welcome_message: string;
  require_class_selection: boolean;
  auto_checkout_hours: number;
}

const CheckIn = () => {
  const { user, loading } = useAuth();
  const { isAdmin } = useEffectiveRole();
  const { toast } = useToast();
  const [settings, setSettings] = useState<CheckInSettingsType | null>(null);
  const [currentMode, setCurrentMode] = useState<'personal' | 'kiosk' | 'settings'>('personal');
  const [isKioskActive, setIsKioskActive] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('check_in_settings')
        .select('*')
        .limit(1)
        .single();
      
      if (error) {
        console.error('Error fetching check-in settings:', error);
        return;
      }
      
      setSettings(data);
    };

    if (user) {
      fetchSettings();
    }
  }, [user]);

  const toggleKioskMode = () => {
    if (isKioskActive) {
      setIsKioskActive(false);
      setCurrentMode('personal');
      toast({
        title: "Kiosk Mode Disabled",
        description: "Returned to personal check-in mode",
      });
    } else {
      setIsKioskActive(true);
      setCurrentMode('kiosk');
      toast({
        title: "Kiosk Mode Enabled",
        description: "Students can now check in using their PIN",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {!isKioskActive && (
          <div className="flex items-start gap-2 sm:gap-4 mb-6 sm:mb-8">
            <BackButton />
            <div className="flex-1">
              <h1 className="text-xl sm:text-3xl font-bold text-foreground flex items-center gap-2 flex-wrap">
                <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                <span className="break-words">Student Check-In</span>
              </h1>
              <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                Check in to classes using your PIN or manage kiosk mode
              </p>
            </div>
          </div>
        )}

        {currentMode === 'personal' && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Personal Check-In */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Personal Check-In
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CheckInForm />
              </CardContent>
            </Card>

            {/* Admin Controls */}
            {isAdmin && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tablet className="h-5 w-5" />
                    Kiosk Mode
                    {isKioskActive && (
                      <Badge variant="default" className="ml-2">Active</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Enable kiosk mode to allow students to check in on a shared device using their PIN.
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      onClick={toggleKioskMode}
                      variant={isKioskActive ? "destructive" : "default"}
                    >
                      {isKioskActive ? "Disable Kiosk" : "Enable Kiosk"}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setCurrentMode('settings')}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {currentMode === 'kiosk' && settings && (
          <CheckInKiosk 
            settings={settings}
            onExit={() => {
              setIsKioskActive(false);
              setCurrentMode('personal');
            }}
          />
        )}

        {currentMode === 'settings' && isAdmin && settings && (
          <CheckInSettings 
            settings={settings}
            onSettingsUpdate={setSettings}
            onBack={() => setCurrentMode('personal')}
          />
        )}
      </div>
    </div>
  );
};

export default CheckIn;