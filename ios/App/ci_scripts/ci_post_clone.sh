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
