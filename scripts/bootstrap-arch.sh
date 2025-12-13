#!/usr/bin/env bash
set -euo pipefail

# Arch bootstrap for publishing dependencies using paru
# Installs: gh (GitHub CLI), python, python-pip, python-google-cloud-storage
# Also installs: webdav client curl (already present on most systems)

if ! command -v paru >/dev/null 2>&1; then
  echo "paru not found. Please install paru first (Arch-based systems)." >&2
  exit 1
fi

packages=(
  gh
  python
  python-pip
  python-google-cloud-storage
)

echo "Installing required packages via paru..."
paru -S --needed --noconfirm "${packages[@]}"

# Set up local venv and install google-cloud-storage inside it for consistency
if [[ ! -d .venv ]]; then
  python -m venv .venv
fi
. .venv/bin/activate
pip install --upgrade pip
pip install google-cloud-storage

echo "Bootstrap complete. Verify gh auth with: gh auth login"
