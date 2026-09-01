import UIKit
import Capacitor

class ViewController: CAPBridgeViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        if #available(iOS 16.4, *) {
            self.webView?.isInspectable = true
        }
    }

    override func capacitorDidLoad() {
        self.webView?.allowsBackForwardNavigationGestures = true
    }
}
