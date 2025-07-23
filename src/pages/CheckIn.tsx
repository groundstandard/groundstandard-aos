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
import { AdvancedCheckInSystem } from "@/components/checkin/AdvancedCheckInSystem";
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

  // Use the new Advanced Check-In System
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="flex items-start gap-2 sm:gap-4 mb-6 sm:mb-8">
          <BackButton />
          <div className="flex-1">
            <h1 className="text-xl sm:text-3xl font-bold text-foreground flex items-center gap-2 flex-wrap">
              <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              <span className="break-words">Advanced Check-In System</span>
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Enhanced check-in with kiosk mode, location tracking, and advanced features
            </p>
          </div>
        </div>
        
        <AdvancedCheckInSystem />
      </div>
    </div>
  );
};

export default CheckIn;