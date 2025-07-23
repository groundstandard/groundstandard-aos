// ABOUTME: Hook for managing native mobile capabilities using Capacitor
import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

export interface NativeCapabilities {
  isNative: boolean;
  platform: string;
  pushNotifications: {
    isSupported: boolean;
    isEnabled: boolean;
    requestPermission: () => Promise<boolean>;
  };
  installPrompt: {
    isAvailable: boolean;
    showPrompt: () => Promise<void>;
  };
}

export const useNativeCapabilities = (): NativeCapabilities => {
  const [pushEnabled, setPushEnabled] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    // Listen for PWA install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Initialize push notifications for native apps
    if (Capacitor.isNativePlatform()) {
      initializePushNotifications();
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const initializePushNotifications = async () => {
    try {
      const permission = await PushNotifications.checkPermissions();
      setPushEnabled(permission.receive === 'granted');
    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  };

  const requestPushPermission = async (): Promise<boolean> => {
    try {
      if (Capacitor.isNativePlatform()) {
        const permission = await PushNotifications.requestPermissions();
        const granted = permission.receive === 'granted';
        setPushEnabled(granted);
        return granted;
      } else {
        // Web push notifications
        if ('Notification' in window) {
          const permission = await Notification.requestPermission();
          const granted = permission === 'granted';
          setPushEnabled(granted);
          return granted;
        }
      }
      return false;
    } catch (error) {
      console.error('Error requesting push permission:', error);
      return false;
    }
  };

  const showInstallPrompt = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const result = await installPrompt.userChoice;
      if (result.outcome === 'accepted') {
        setInstallPrompt(null);
      }
    }
  };

  return {
    isNative: Capacitor.isNativePlatform(),
    platform: Capacitor.getPlatform(),
    pushNotifications: {
      isSupported: Capacitor.isNativePlatform() || 'Notification' in window,
      isEnabled: pushEnabled,
      requestPermission: requestPushPermission,
    },
    installPrompt: {
      isAvailable: !!installPrompt,
      showPrompt: showInstallPrompt,
    },
  };
};