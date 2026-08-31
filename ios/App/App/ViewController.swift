import UIKit
import Capacitor

class ViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        // Enables the standard iOS edge-swipe-to-go-back gesture on the
        // WebView, matching how every other native iOS app behaves.
        // Capacitor does not turn this on by default.
        self.webView?.allowsBackForwardNavigationGestures = true

        // Real, concrete fix for "no inspectable applications" in
        // Safari's Web Inspector: since iOS 16.4, a WKWebView must
        // explicitly opt in to being inspectable for Release-
        // configuration builds (App Store, TestFlight, and Xcode's
        // own Release scheme) - a Debug build run directly from
        // Xcode is automatically inspectable, but this app's actual
        // production build never had this set, so Safari genuinely
        // could not see it at all, no matter how correctly Web
        // Inspector or Developer Mode were configured on the device
        // side. Guarded with an availability check since this
        // property only exists on iOS 16.4+, and this app's own
        // deployment target is iOS 15 (Package.swift).
        if #available(iOS 16.4, *) {
            self.webView?.isInspectable = true
        }
    }
}
