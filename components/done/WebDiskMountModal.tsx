
import React, { useState } from 'react';
import { CloseIcon, DocumentDuplicateIcon } from '../core/Icons';
import { CodeBlock } from '../core/CodeBlock';

interface WebDiskMountModalProps {
  onClose: () => void;
}

const SYNC_SCRIPT_RAW = `#!/bin/bash
set -euo pipefail

echo "--- WebDisk Sync Ritual (Full Forge Backup) ---"
# Aligned with Automount settings (CamelCase)
MOUNT_POINT="\$HOME/WebDisk"
# Updated to sync the ENTIRE forge, not just the repo.
LOCAL_FORGE="\$HOME/forge"

if [ ! -d "\$MOUNT_POINT" ]; then
    echo "❌ ERROR: Mount point '\$MOUNT_POINT' does not exist." >&2
    echo "   Please run the 'Automount WebDisk' ritual first." >&2
    exit 1
fi

# Trigger mount by access
echo "--> Waking up WebDisk..."
ls -d "\$MOUNT_POINT" >/dev/null 2>&1 || true

if ! mountpoint -q "\$MOUNT_POINT"; then
    echo "⚠️  Warning: \$MOUNT_POINT is not a mountpoint. Attempting to sync anyway..."
fi

# --- RECURSION BREAKER (VOID BANISHING PROTOCOL) ---
echo "--> Checking for temporal anomalies (recursive folders)..."
if [ -d "\$MOUNT_POINT/forge" ]; then
    echo "⚠️  DETECTED: Duplicate 'forge' folder found inside WebDisk."
    echo "    Invoking Void Banishing Protocol..."
    
    # 1. Rename to trash to break the path immediately
    TRASH_NAME="_TRASH_forge_\$(date +%s)"
    echo "    -> Isolating anomaly as '\$TRASH_NAME'..."
    mv "\$MOUNT_POINT/forge" "\$MOUNT_POINT/\$TRASH_NAME" || true
    
    # 2. Attempt purge (Backgrounded because WebDAV deletion is slow)
    echo "    -> Banishing to the void (Deletion scheduled)..."
    ( rm -rf "\$MOUNT_POINT/\$TRASH_NAME" ) &>/dev/null &
    
    echo "✅  Path cleared."
fi

echo "--> Staging full forge..."
STAGE=\$(mktemp -d)
rsync -a "\$LOCAL_FORGE/" "\$STAGE/"

# Transmute DB for FTPS compatibility (Located in the repo subdirectory)
echo "--> Transmuting database signatures..."
if [ -d "\$STAGE/repo" ]; then
    cd "\$STAGE/repo"
    
    # 1. Clean up old symlinks to avoid broken links
    rm -f kael-os-local.db kael-os-local.db.sig kael-os-local.files kael-os-local.files.sig

    # 2. Rename the actual database artifacts (tar.gz and .sig)
    # We perform a global string replacement in the filename
    for f in kael-os-local.*; do
        if [ -f "\$f" ]; then
             mv "\$f" "\${f//kael-os-local/kael-os-webdisk}"
        fi
    done

    # 3. Create COPIES for the new naming convention instead of symlinks.
    # WebDAV/davfs2 often fails to handle symlinks correctly during rsync (skipping non-regular files).
    # Regular files ensure the mirror is robust and accessible.
    echo "    -> Creating regular file copies for WebDAV compatibility..."
    
    if [ -f "kael-os-webdisk.db.tar.gz" ]; then
        rm -f "kael-os-webdisk.db"
        cp "kael-os-webdisk.db.tar.gz" "kael-os-webdisk.db"
    fi
    if [ -f "kael-os-webdisk.db.tar.gz.sig" ]; then
        rm -f "kael-os-webdisk.db.sig"
        cp "kael-os-webdisk.db.tar.gz.sig" "kael-os-webdisk.db.sig"
    fi

    if [ -f "kael-os-webdisk.files.tar.gz" ]; then
        rm -f "kael-os-webdisk.files"
        cp "kael-os-webdisk.files.tar.gz" "kael-os-webdisk.files"
    fi
    if [ -f "kael-os-webdisk.files.tar.gz.sig" ]; then
        rm -f "kael-os-webdisk.files.sig"
        cp "kael-os-webdisk.files.tar.gz.sig" "kael-os-webdisk.files.sig"
    fi
    
else
    echo "⚠️  Warning: 'repo' directory not found in stage. Skipping transmutation."
fi

echo "--> Syncing to WebDisk..."
# Rsync to the mount point.
# We explicitly exclude 'forge' and any '_TRASH_*' folders to prevent re-uploading anomalies.
# --no-owner --no-group: don't try to set ownership (WebDAV usually can't)
rsync -rtv --delete --no-owner --no-group --exclude "lost+found" --exclude "forge" --exclude "_TRASH_*" "\$STAGE/" "\$MOUNT_POINT/"

rm -rf "\$STAGE"
echo "✅ Full Forge Sync Complete."
`;

export const WebDiskMountModal: React.FC<WebDiskMountModalProps> = ({ onClose }) => {
    // Updated URL to match the Automount target EXACTLY (port 2078).
    const credsCommand = `mkdir -p ~/.davfs2 && echo 'https://leroyonline.co.za:2078/forge "leroy@leroyonline.co.za" "LeRoy0923!"' >> ~/.davfs2/secrets && chmod 600 ~/.davfs2/secrets`;

    const encodedSync = btoa(unescape(encodeURIComponent(SYNC_SCRIPT_RAW)));
    const syncCommand = `echo "${encodedSync}" | base64 --decode | bash`;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in-fast" onClick={onClose}>
            <div className="bg-forge-panel border-2 border-forge-border rounded-lg shadow-2xl w-full max-w-3xl p-6 m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                     <h2 className="text-xl font-bold text-forge-text-primary flex items-center gap-2 font-display tracking-wider">
                        <DocumentDuplicateIcon className="w-5 h-5 text-dragon-fire" />
                        <span>WebDisk Full Forge Sync</span>
                    </h2>
                    <button onClick={onClose} className="text-forge-text-secondary hover:text-forge-text-primary">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="overflow-y-auto pr-2 text-forge-text-secondary leading-relaxed space-y-4">
                    <p>
                        Architect, this ritual synchronizes your <strong className="text-forge-text-primary">entire forge workspace</strong> (\`~/forge\`) to the WebDisk.
                    </p>
                    <p className="text-sm p-3 bg-orc-steel/10 border-l-4 border-orc-steel rounded">
                        <strong className="text-orc-steel">Void Banishing Protocol:</strong> I have upgraded the recursion breaker. If it detects a duplicate <code className="font-mono text-xs">forge</code> folder inside the WebDisk, it will aggressively rename it to <code className="font-mono text-xs">_TRASH_...</code> and attempt to delete it, while simultaneously excluding these artifacts from the sync process.
                    </p>

                    <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">Step 1: Manual Credentials (Fallback)</h3>
                    <p>
                        The Automount ritual now handles this automatically. Use this only if manually mounting via user config.
                    </p>
                    <CodeBlock lang="bash">{credsCommand}</CodeBlock>

                    <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">Step 2: The Sync Incantation</h3>
                    <p>
                        Run this command to sync your entire forge to the cloud.
                    </p>
                    <CodeBlock lang="bash">{syncCommand}</CodeBlock>
                </div>
            </div>
        </div>
    );
};
