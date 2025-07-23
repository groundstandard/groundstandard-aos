// ABOUTME: Component for prompting users to install the PWA or native app
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Smartphone, Download, X } from 'lucide-react';
import { useNativeCapabilities } from '@/hooks/useNativeCapabilities';
import { useToast } from '@/hooks/use-toast';

export const MobileAppInstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const { installPrompt, pushNotifications, isNative } = useNativeCapabilities();
  const { toast } = useToast();

  useEffect(() => {
    // Don't show prompt if already native app
    if (isNative) return;

    // Check if user has dismissed prompt recently
    const dismissed = localStorage.getItem('app-install-dismissed');
    const lastDismissed = dismissed ? new Date(dismissed) : null;
    const daysSinceDismissal = lastDismissed 
      ? Math.floor((Date.now() - lastDismissed.getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    // Show prompt if available and not dismissed recently
    if (installPrompt.isAvailable && daysSinceDismissal > 7) {
      setShowPrompt(true);
    }
  }, [installPrompt.isAvailable, isNative]);

  const handleInstall = async () => {
    try {
      await installPrompt.showPrompt();
      setShowPrompt(false);
      
      // Request push notification permission after install
      if (pushNotifications.isSupported && !pushNotifications.isEnabled) {
        setTimeout(async () => {
          const granted = await pushNotifications.requestPermission();
          if (granted) {
            toast({
              title: "Notifications Enabled",
              description: "You'll receive important updates from your academy",
            });
          }
        }, 2000);
      }
    } catch (error) {
      console.error('Error installing app:', error);
      toast({
        title: "Installation Error",
        description: "There was an issue installing the app. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('app-install-dismissed', new Date().toISOString());
  };

  if (!showPrompt || isNative) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm animate-slide-in-right">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Install App</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          Get the best experience with our mobile app
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Quick access from your home screen</li>
            <li>• Offline check-in capabilities</li>
            <li>• Push notifications for updates</li>
          </ul>
          <div className="flex gap-2">
            <Button onClick={handleInstall} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Install
            </Button>
            <Button variant="outline" onClick={handleDismiss}>
              Later
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};