package com.uasetechstudio.carstrims;

import android.os.Bundle;
import android.webkit.WebView;
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

        if (this.bridge != null && this.bridge.getWebView() != null) {
            this.bridge.getWebView().setBackgroundColor(android.graphics.Color.parseColor("#1A1A1A"));
        }
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
