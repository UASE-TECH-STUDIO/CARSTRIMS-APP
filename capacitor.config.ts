import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.uasetechstudio.carstrims",
  appName: "CARSTRIMS",
  webDir: "out",
  server: {
    url: "https://www.carstrims.com",
    androidScheme: "https",
    cleartext: false,
    allowNavigation: [
      "*.carstrims.com",
      "carstrims.com",
      "www.carstrims.com",
      "carstrims-backend.onrender.com",
    ],
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#1A1A1A",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "Dark",
      backgroundColor: "#1A1A1A",
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    loggingBehavior: "none",
  },
  ios: {
    contentInset: "automatic",
    scrollEnabled: true,
  },
};

export default config;
