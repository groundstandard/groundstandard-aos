// ABOUTME: Component that adds mobile-specific enhancements to the app
import { useEffect } from 'react';
import { useNativeCapabilities } from '@/hooks/useNativeCapabilities';
import { useToast } from '@/hooks/use-toast';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

export const MobileEnhancements = () => {
  const { isNative, pushNotifications } = useNativeCapabilities();
  const { toast } = useToast();

  useEffect(() => {
    if (!isNative) return;

    // Set up native push notification handlers
    const setupPushNotifications = async () => {
      // Handle notification received while app is in foreground
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        toast({
          title: notification.title || "New Notification",
          description: notification.body,
        });
      });

      // Handle notification tapped (app was in background)
      PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        const notification = action.notification;
        console.log('Push notification action performed:', action);
        
        // Navigate based on notification data
        if (notification.data?.route) {
          window.location.href = notification.data.route;
        }
      });

      // Register for push notifications
      if (pushNotifications.isSupported && pushNotifications.isEnabled) {
        try {
          await PushNotifications.register();
        } catch (error) {
          console.error('Error registering for push notifications:', error);
        }
      }
    };

    setupPushNotifications();

    // Add native-specific CSS classes for better styling
    document.body.classList.add('native-app');
    document.body.classList.add(`platform-${Capacitor.getPlatform()}`);

    return () => {
      document.body.classList.remove('native-app');
      document.body.classList.remove(`platform-${Capacitor.getPlatform()}`);
    };
  }, [isNative, pushNotifications.isEnabled, pushNotifications.isSupported, toast]);

  // Prevent overscroll on mobile
  useEffect(() => {
    if (isNative) {
      document.body.style.overscrollBehavior = 'none';
      document.documentElement.style.overscrollBehavior = 'none';
    }

    return () => {
      document.body.style.overscrollBehavior = '';
      document.documentElement.style.overscrollBehavior = '';
    };
  }, [isNative]);

  return null; // This component doesn't render anything visual
};