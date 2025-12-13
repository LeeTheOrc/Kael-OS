#!/usr/bin/env bash
set -euo pipefail

# Builds, signs, and uploads a desktop tarball + signature to Web Disk.
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

APP_BIN=${APP_BIN:-target/release/kael-os}
OUT_DIR=${OUT_DIR:-dist}
PKG_NAME="kael-os-${VERSION}-x86_64"

WEBDAV_SERVER=${WEBDAV_SERVER:-leroyonline.co.za}
WEBDAV_PORT=${WEBDAV_PORT:-2078}
WEBDAV_USERNAME=${WEBDAV_USERNAME:-leetheorc}
WEBDAV_PASSWORD=${WEBDAV_PASSWORD:-}
WEBDAV_BASE_PATH=${WEBDAV_BASE_PATH:-/public_html/kael}

GPG_USER=${GPG_USER:-leetheorc@gmail.com}
GPG_KEYID=${GPG_KEYID:-D0513E222E8EE8D7}

if [[ ! -f "$APP_BIN" ]]; then
  echo "Missing $APP_BIN. Build with: cargo build --release" >&2
  exit 1
fi

mkdir -p "$OUT_DIR"
cp "$APP_BIN" "$OUT_DIR/kael-os"
pushd "$OUT_DIR" >/dev/null
tar -czf "${PKG_NAME}.tar.gz" kael-os
gpg --batch --yes --detach-sign --local-user "$GPG_KEYID" "${PKG_NAME}.tar.gz"
popd >/dev/null

if [[ -z "$WEBDAV_PASSWORD" ]]; then
  echo "WEBDAV_PASSWORD is required" >&2
  exit 1
fi

base_url="https://${WEBDAV_SERVER}:${WEBDAV_PORT}"
remote_dir="${WEBDAV_BASE_PATH}/downloads/desktop"

# Ensure remote directory exists
curl -sS -X MKCOL -u "${WEBDAV_USERNAME}:${WEBDAV_PASSWORD}" \
  "${base_url}${remote_dir}" >/dev/null || true

echo "Uploading ${PKG_NAME}.tar.gz and signature to ${base_url}${remote_dir}"
curl -sS -T "${OUT_DIR}/${PKG_NAME}.tar.gz" -u "${WEBDAV_USERNAME}:${WEBDAV_PASSWORD}" \
  "${base_url}${remote_dir}/${PKG_NAME}.tar.gz"
curl -sS -T "${OUT_DIR}/${PKG_NAME}.tar.gz.sig" -u "${WEBDAV_USERNAME}:${WEBDAV_PASSWORD}" \
  "${base_url}${remote_dir}/${PKG_NAME}.tar.gz.sig"

echo "Publish complete."
