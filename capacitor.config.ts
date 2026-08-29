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
      // launchAutoHide was true with a fixed 2000ms duration - this
      // hid the splash on a blind timer with zero relationship to
      // whether the app (loaded remotely via server.url below) had
      // actually finished loading. On a slow connection - exactly
      // what a fresh install or an app update is, with a cold cache -
      // the timer could fire before the page was ready, revealing an
      // empty WKWebView that reads as a stuck black screen. Now false:
      // SplashScreenController.tsx (mounted in app/layout.tsx) hides
      // it explicitly once the app has actually rendered a first
      // frame, with its own generous safety-net timeout so a bug
      // elsewhere can never leave it on screen forever.
      launchAutoHide: false,
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
      overlaysWebView: false, // Prevents status bar from drawing over application UI on Android
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