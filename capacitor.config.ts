import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.642cfce50e344061a16a17e0665c250a',
  appName: 'groundstandard-aos',
  webDir: 'dist',
  server: {
    url: 'https://642cfce5-0e34-4061-a16a-17e0665c250a.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    }
  }
};

export default config;