#!/usr/bin/env bash
set -euo pipefail

# Version bump utility for {{APP_NAME}}
# Strict semantic versioning: v0.0.1-alpha → v0.1.0-beta → v1.0.0-release
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
    BUILD=$((BUILD + 1))
    ;;
  alpha:beta|beta:beta)
    if [[ "$CURRENT_STAGE" == "alpha" ]]; then
      MINOR=$((MINOR + 1))
      PATCH=0
      BUILD=1
    else
      BUILD=$((BUILD + 1))
    fi
    ;;
  beta:release|release:release|alpha:release)
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

echo "✓ Bumped to v${VERSION}-${STAGE}.${BUILD} (timestamp: $TIMESTAMP)"
cat "$VERSION_FILE" | jq .
