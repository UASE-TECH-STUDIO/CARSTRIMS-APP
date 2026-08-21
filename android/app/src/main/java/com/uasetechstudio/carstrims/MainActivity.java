package com.uasetechstudio.carstrims;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.webkit.WebView;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Android 15+ (targetSdk 35+) forces edge-to-edge display by
        // default, overriding Capacitor's StatusBar.overlaysWebView:false
        // setting at the OS level — this is what was causing content to
        // render under/behind the status bar ("overlapping", "colliding
        // with the up side" when scrolling). Explicitly opting back into
        // the classic (non-edge-to-edge) window behavior restores the
        // system's automatic reservation of space for the status bar and
        // navigation bar, matching what the app's Capacitor config already
        // expects.
        WindowCompat.setDecorFitsSystemWindows(getWindow(), true);

        // Setting setDecorFitsSystemWindows alone can take an extra
        // layout pass to fully propagate — meaning the WebView's very
        // first render can happen with the OLD (edge-to-edge) inset
        // values still in effect, showing content overlapping the
        // status bar briefly, before self-correcting a moment later
        // once Android naturally re-lays-out the window (e.g. on the
        // next scroll or resize event). Forcing a fresh insets
        // application immediately, on the very next frame, means the
        // WebView gets the CORRECT inset values from its first paint
        // instead of needing something else to trigger the correction.
        getWindow().getDecorView().post(() -> {
            ViewCompat.requestApplyInsets(getWindow().getDecorView());
        });

        createNotificationChannel();

        if (this.bridge != null && this.bridge.getWebView() != null) {
            this.bridge.getWebView().setBackgroundColor(android.graphics.Color.parseColor("#1A1A1A"));
        }
    }

    /**
     * Android 8.0 (API 26)+ requires every notification to belong to a
     * channel — without one explicitly created here, the system falls
     * back to whatever default behavior that specific device/OEM
     * chooses, which is inconsistent and often does NOT reliably show
     * as a heads-up (pop-up) alert with sound the way WhatsApp-style
     * notifications do. Creating a channel with IMPORTANCE_HIGH
     * guarantees FCM push notifications pop up over whatever the
     * person is doing (including the lock screen) with sound, rather
     * than silently landing in the notification shade.
     */
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;

        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager == null) return;

        NotificationChannel channel = new NotificationChannel(
                "carstrims_default",
                "CARSTRIMS Notifications",
                NotificationManager.IMPORTANCE_HIGH
        );
        channel.setDescription("Messages, offers, and updates from CARSTRIMS");
        channel.enableLights(true);
        channel.enableVibration(true);
        channel.setVibrationPattern(new long[]{0, 250, 100, 250});

        // Uses the system's default notification sound — a custom tone
        // can be added later by bundling a file at
        // android/app/src/main/res/raw/notification_sound.<ext> and
        // pointing this at it; left as the default for now since no
        // custom sound file exists in the project yet.
        AudioAttributes audioAttributes = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build();
        Uri defaultSoundUri = android.provider.Settings.System.DEFAULT_NOTIFICATION_URI;
        channel.setSound(defaultSoundUri, audioAttributes);

        manager.createNotificationChannel(channel);
    }

    @Override
    public void onResume() {
        super.onResume();
        // Fix black screen on resume - reload if WebView is blank
        if (this.bridge != null && this.bridge.getWebView() != null) {
            WebView webView = this.bridge.getWebView();
            // Re-apply settings to fix white/black screen on resume
            webView.setBackgroundColor(android.graphics.Color.parseColor("#1A1A1A"));
        }
    }
}
