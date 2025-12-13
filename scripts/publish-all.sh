#!/usr/bin/env bash
set -euo pipefail

# Runs all publishers: WebDAV, Firebase (if configured), GitHub release (if gh is logged in).
# Uses version.json for version info (not env var).

VERSION_FILE="version.json"
if [[ ! -f "$VERSION_FILE" ]]; then
  echo "Error: $VERSION_FILE not found. Run scripts/bump-version.sh first." >&2
  exit 1
fi

# Extract version from version.json
VERSION=$(jq -r '.major as $maj | .minor as $min | .patch as $pat | "\($maj).\($min).\($pat)"' "$VERSION_FILE")
STAGE=$(jq -r '.stage' "$VERSION_FILE")
BUILD=$(jq -r '.build' "$VERSION_FILE")
SEMVER="${VERSION}-${STAGE}.${BUILD}"

echo "Publishing v$SEMVER..."

echo "== Publish Desktop (WebDAV + GPG) =="
./scripts/publish-desktop.sh

if [[ -f firebase-service-account.json ]]; then
  echo "== Publish to Firebase Storage =="
  ./scripts/publish-firebase.sh
else
  echo "Skipping Firebase: firebase-service-account.json not found"
fi

if command -v gh >/dev/null 2>&1; then
  echo "== Publish GitHub Release =="
  TAG="v${VERSION}"
  # Create release if not exists and upload assets
  set +e
  gh release view "$TAG" >/dev/null 2>&1
  EXISTS=$?
  set -e
  if [[ $EXISTS -ne 0 ]]; then
    gh release create "$TAG" --title "Kael-OS ${VERSION}" --notes "Signed desktop release." || true
  fi
  # Only upload assets if missing or size differs to save bandwidth
  ASSET_JSON=$(gh api repos/:owner/:repo/releases/tags/"$TAG")
  # Extract asset sizes by name
  REMOTE_TGZ_SIZE=$(echo "$ASSET_JSON" | jq -r '.assets[] | select(.name=="kael-os-'"$VERSION"'-x86_64.tar.gz") | .size')
  REMOTE_SIG_SIZE=$(echo "$ASSET_JSON" | jq -r '.assets[] | select(.name=="kael-os-'"$VERSION"'-x86_64.tar.gz.sig") | .size')
  LOCAL_TGZ_SIZE=$(stat -c%s dist/kael-os-${VERSION}-x86_64.tar.gz)
  LOCAL_SIG_SIZE=$(stat -c%s dist/kael-os-${VERSION}-x86_64.tar.gz.sig)

  UPLOAD_ARGS=()
  if [[ -z "$REMOTE_TGZ_SIZE" || "$REMOTE_TGZ_SIZE" != "$LOCAL_TGZ_SIZE" ]]; then
    UPLOAD_ARGS+=("dist/kael-os-${VERSION}-x86_64.tar.gz")
  else
    echo "Skip GitHub upload (unchanged): kael-os-${VERSION}-x86_64.tar.gz"
  fi
  if [[ -z "$REMOTE_SIG_SIZE" || "$REMOTE_SIG_SIZE" != "$LOCAL_SIG_SIZE" ]]; then
    UPLOAD_ARGS+=("dist/kael-os-${VERSION}-x86_64.tar.gz.sig")
  else
    echo "Skip GitHub upload (unchanged): kael-os-${VERSION}-x86_64.tar.gz.sig"
  fi

  if [[ ${#UPLOAD_ARGS[@]} -gt 0 ]]; then
    gh release upload "$TAG" "${UPLOAD_ARGS[@]}" --clobber
  fi
else
  echo "Skipping GitHub release: gh CLI not found or not authenticated"
fi

echo "== All publishers complete =="
