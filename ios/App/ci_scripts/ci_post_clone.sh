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

# Xcode Cloud disables automatic package resolution for reproducible
# builds, which means it REQUIRES a Package.resolved file to already
# exist and be up to date — it won't just resolve fresh dependencies
# on the fly. Since this repo has never had one committed, any time a
# new Capacitor plugin gets added (like @capacitor/camera or
# @capacitor-community/speech-recognition, both added recently), the
# build fails outright with "a resolved file is required... Running
# resolver because the following dependencies were added: ...".
#
# Rather than trying to hand-maintain a committed Package.resolved
# (fragile — anyone forgetting to regenerate and commit it after
# adding a plugin breaks the next build), this generates one fresh on
# Xcode Cloud's own machine, which has real Xcode/xcodebuild and full
# network access, right before the build needs it.
echo "==> Resolving Swift Package dependencies"
cd "$CI_PRIMARY_REPOSITORY_PATH/ios/App"
xcodebuild -resolvePackageDependencies -workspace App.xcodeproj/project.xcworkspace -scheme App

echo "==> Package resolution complete."
