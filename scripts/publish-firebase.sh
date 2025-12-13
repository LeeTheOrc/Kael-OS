#!/usr/bin/env bash
set -euo pipefail

# Uploads release artifacts to Firebase Storage.
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

OUT_DIR=${OUT_DIR:-dist}
PKG_NAME="kael-os-${VERSION}-x86_64"

# Service account JSON path and bucket name
FIREBASE_SA_JSON=${FIREBASE_SA_JSON:-firebase-service-account.json}
FIREBASE_BUCKET=${FIREBASE_BUCKET:-your-project.appspot.com}

if [[ ! -f "$OUT_DIR/${PKG_NAME}.tar.gz" ]]; then
  echo "Missing $OUT_DIR/${PKG_NAME}.tar.gz. Run publish-desktop.sh first." >&2
  exit 1
fi

if [[ ! -f "$OUT_DIR/${PKG_NAME}.tar.gz.sig" ]]; then
  echo "Missing signature. Run publish-desktop.sh first." >&2
  exit 1
fi

if [[ ! -f "$FIREBASE_SA_JSON" ]]; then
  echo "Service account JSON not found: $FIREBASE_SA_JSON" >&2
  exit 1
fi

# Prefer project venv Python if available, else fallback to system python3
PYTHON_BIN="python3"
if [[ -x ".venv/bin/python" ]]; then
  PYTHON_BIN=".venv/bin/python"
fi

"${PYTHON_BIN}" - << 'PY'
import base64, hashlib, json, os, sys
from google.cloud import storage

VERSION = os.environ.get('VERSION', '0.2.0')
OUT_DIR = os.environ.get('OUT_DIR', 'dist')
PKG_NAME = f"kael-os-{VERSION}-x86_64"
SA = os.environ.get('FIREBASE_SA_JSON', 'firebase-service-account.json')
BUCKET_NAME = os.environ.get('FIREBASE_BUCKET', 'your-project.appspot.com')

client = storage.Client.from_service_account_json(SA)
bucket = client.bucket(BUCKET_NAME)

uploads = [
  (f"{OUT_DIR}/{PKG_NAME}.tar.gz", f"releases/desktop/{PKG_NAME}.tar.gz"),
  (f"{OUT_DIR}/{PKG_NAME}.tar.gz.sig", f"releases/desktop/{PKG_NAME}.tar.gz.sig"),
]

for src, dest in uploads:
  blob = bucket.blob(dest)
  # Compute local md5 in base64 to match GCS md5Hash
  md5 = hashlib.md5()
  with open(src, 'rb') as f:
    for chunk in iter(lambda: f.read(8192), b''):
      md5.update(chunk)
  local_md5_b64 = base64.b64encode(md5.digest()).decode('ascii')

  # If blob exists and md5 matches, skip upload to save bandwidth
  if blob.exists():
    blob.reload()
    if blob.md5_hash == local_md5_b64:
      print(f"Skip (unchanged): gs://{BUCKET_NAME}/{dest}")
      continue

  blob.upload_from_filename(src)
  try:
    blob.make_public()
  except Exception:
    pass
  print(f"Uploaded: gs://{BUCKET_NAME}/{dest} → https://storage.googleapis.com/{BUCKET_NAME}/{dest}")
PY

echo "Firebase publish complete."
