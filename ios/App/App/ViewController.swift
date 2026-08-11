import UIKit
import Capacitor

class ViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        // Enables the standard iOS edge-swipe-to-go-back gesture on the
        // WebView, matching how every other native iOS app behaves.
        // Capacitor does not turn this on by default.
        self.webView?.allowsBackForwardNavigationGestures = true
    }
}
