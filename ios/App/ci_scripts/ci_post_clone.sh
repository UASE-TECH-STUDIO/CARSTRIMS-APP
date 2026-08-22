#!/bin/sh
# Xcode Cloud runs this automatically right after cloning the repo,
# before it tries to build/resolve packages. Capacitor's Package.swift
# references ../../../node_modules/@capacitor/* directly, so those
# folders must exist before Xcode's package resolution step runs.
set -e

echo "==> Installing Node.js (Xcode Cloud images don't include it by default)"
brew install node

echo "==> Installing npm dependencies at repo root"
cd "$CI_PRIMARY_REPOSITORY_PATH"
npm install

echo "==> Done. node_modules/@capacitor/* should now exist for SPM to resolve."

# PRIMARY FIX: a Package.resolved file is now committed directly to
# the repo (ios/App/App.xcodeproj/project.xcworkspace/xcshareddata/
# swiftpm/Package.resolved), pinning the one actual remote dependency
# this project has (capacitor-swift-pm@8.4.0 - everything else is a
# local path dependency under node_modules, which doesn't need SPM
# registry resolution). Two earlier attempts at generating this file
# fresh during ci_post_clone.sh (once fatally, once non-fatally) both
# failed to reliably produce a file Xcode's own archive step would
# accept - committing a known-correct one directly sidesteps that
# unreliability entirely.
#
# This resolution step below is now just a DEFENSIVE BACKUP for the
# future: if a new Capacitor plugin gets added later without someone
# remembering to regenerate and commit an updated Package.resolved,
# this at least attempts to patch that gap at build time rather than
# failing outright - but the committed file above is what actually
# fixes today's build.
echo "==> Resolving Swift Package dependencies (defensive backup only - see comment above)"
cd "$CI_PRIMARY_REPOSITORY_PATH/ios/App"
if xcodebuild -resolvePackageDependencies -workspace App.xcodeproj/project.xcworkspace -scheme App; then
  echo "==> Package resolution complete."
else
  echo "==> WARNING: Package resolution step failed (see above for details)."
  echo "==> Continuing anyway - the actual build/archive step may still succeed,"
  echo "==> or will show the real underlying error directly if it doesn't."
fi
