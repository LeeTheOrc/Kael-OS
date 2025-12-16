#!/usr/bin/env bash
# Auto backup script - commits to GitHub and uploads to WebDAV
set -euo pipefail

PROJECT_ROOT="/home/leetheorc/Kael-os"
BACKUP_DIR="/home/leetheorc/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="kael-os-backup-${TIMESTAMP}.tar.gz"

echo "🔄 Starting automatic backup..."

# 1. Git commit and push
echo "📝 Committing to git..."
cd "$PROJECT_ROOT"
git add -A
if git diff --staged --quiet; then
    echo "  ℹ️  No changes to commit"
else
    git commit -m "Auto backup - ${TIMESTAMP}" || true
    echo "📤 Pushing to GitHub..."
    git push origin master
    echo "  ✅ Pushed to GitHub"
fi

# 2. Create compressed backup
echo "📦 Creating backup archive..."
mkdir -p "$BACKUP_DIR"
cd "$PROJECT_ROOT"
tar --exclude=target --exclude=node_modules --exclude=dist --exclude=.git \
    -czf "${BACKUP_DIR}/${BACKUP_FILE}" .
echo "  ✅ Created ${BACKUP_FILE} ($(du -h ${BACKUP_DIR}/${BACKUP_FILE} | cut -f1))"

# 3. Upload to WebDAV
if [[ -z "${WEBDAV_PASSWORD:-}" ]]; then
    echo "⚠️  WEBDAV_PASSWORD not set - skipping upload"
    echo "   Set it in ~/.config/fish/config.fish or export it manually"
    exit 0
fi

echo "☁️  Uploading to WebDAV..."
WEBDAV_SERVER=${WEBDAV_SERVER:-leroyonline.co.za}
WEBDAV_PORT=${WEBDAV_PORT:-2078}
WEBDAV_USERNAME=${WEBDAV_USERNAME:-leetheorc}
PRIVATE_PATH=${PRIVATE_PATH:-/public_html/kael-private}

BASE_URL="https://${WEBDAV_SERVER}:${WEBDAV_PORT}"
REMOTE="${PRIVATE_PATH}/${BACKUP_FILE}"

curl -sS -T "${BACKUP_DIR}/${BACKUP_FILE}" \
     -u "${WEBDAV_USERNAME}:${WEBDAV_PASSWORD}" \
     "${BASE_URL}${REMOTE}"

echo "  ✅ Uploaded to ${BASE_URL}${REMOTE}"

# 4. Cleanup old local backups (keep last 5)
echo "🧹 Cleaning old backups..."
cd "$BACKUP_DIR"
ls -t kael-os-backup-*.tar.gz | tail -n +6 | xargs -r rm -f
echo "  ✅ Kept last 5 backups"

echo ""
echo "✨ Backup complete!"
echo "   GitHub: https://github.com/LeeTheOrc/kael-os"
echo "   WebDAV: ${BASE_URL}${REMOTE}"
echo "   Local: ${BACKUP_DIR}/${BACKUP_FILE}"
