package com.uasetechstudio.carstrims;

import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebSettings;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
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

    @Override
    protected void onStart() {
        super.onStart();
    }
}
