#!/usr/bin/env bash
set -euo pipefail

# Version bump utility with semantic versioning and strict alpha→beta→release flow
# Usage: bash scripts/bump-version.sh [alpha|beta|release]

VERSION_FILE="version.json"

if [[ ! -f "$VERSION_FILE" ]]; then
  echo "Error: $VERSION_FILE not found" >&2
  exit 1
fi

STAGE="${1:-alpha}"

if [[ ! "$STAGE" =~ ^(alpha|beta|release)$ ]]; then
  echo "Usage: bash scripts/bump-version.sh [alpha|beta|release]" >&2
  exit 1
fi

# Read current version
MAJOR=$(jq -r '.major' "$VERSION_FILE")
MINOR=$(jq -r '.minor' "$VERSION_FILE")
PATCH=$(jq -r '.patch' "$VERSION_FILE")
CURRENT_STAGE=$(jq -r '.stage' "$VERSION_FILE")
BUILD=$(jq -r '.build' "$VERSION_FILE")

# Increment based on stage transition
case "$CURRENT_STAGE:$STAGE" in
  alpha:alpha)
    # Stay in alpha, increment build
    BUILD=$((BUILD + 1))
    ;;
  alpha:beta|beta:beta)
    # Move to or stay in beta
    if [[ "$CURRENT_STAGE" == "alpha" ]]; then
      MINOR=$((MINOR + 1))
      PATCH=0
      BUILD=1
    else
      BUILD=$((BUILD + 1))
    fi
    ;;
  beta:release|release:release|alpha:release)
    # Move to release or stay in release
    if [[ "$CURRENT_STAGE" != "release" ]]; then
      MAJOR=$((MAJOR + 1))
      MINOR=0
      PATCH=0
      BUILD=1
    else
      PATCH=$((PATCH + 1))
      BUILD=$((BUILD + 1))
    fi
    ;;
  *)
    echo "Invalid stage transition: $CURRENT_STAGE → $STAGE" >&2
    echo "Allowed: alpha→alpha, alpha→beta, beta→beta, beta→release, release→release" >&2
    exit 1
    ;;
esac

VERSION="${MAJOR}.${MINOR}.${PATCH}"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Update version.json
jq --arg major "$MAJOR" \
   --arg minor "$MINOR" \
   --arg patch "$PATCH" \
   --arg stage "$STAGE" \
   --arg build "$BUILD" \
   --arg ts "$TIMESTAMP" \
   '.major = ($major | tonumber) | .minor = ($minor | tonumber) | .patch = ($patch | tonumber) | .stage = $stage | .build = ($build | tonumber) | .timestamp = $ts' \
   "$VERSION_FILE" > "$VERSION_FILE.tmp" && mv "$VERSION_FILE.tmp" "$VERSION_FILE"

# Update Cargo.toml
sed -i "s/^version = .*/version = \"$VERSION\"/" src-tauri/Cargo.toml

echo "✓ Bumped to v${VERSION}-${STAGE}.${BUILD} (timestamp: $TIMESTAMP)"
echo "Current version.json:"
cat "$VERSION_FILE" | jq .
