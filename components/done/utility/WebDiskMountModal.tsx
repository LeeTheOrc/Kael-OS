

import React, { useState } from 'react';
import { CloseIcon, DocumentDuplicateIcon, ServerIcon } from '../../core/Icons';
import { CodeBlock } from '../../core/CodeBlock';

interface WebDiskMountModalProps {
  onClose: () => void;
}

const SYNC_SCRIPT_RAW = `#!/bin/bash
set -euo pipefail

echo "--- WebDisk Forge Sync 0.00.01 (VM Walker) ---"

# --- ENVIRONMENT DETECTION ---
USER_HOME=\$(getent passwd "\${SUDO_USER:-\$USER}" | cut -d: -f6)

if [ -d "\${USER_HOME}/host_forge" ] && [ -d "\${USER_HOME}/host_webdisk" ]; then
    echo "--> 🔮 VM Environment Detected."
    LOCAL_FORGE="\${USER_HOME}/host_forge"
    MOUNT_POINT="\${USER_HOME}/host_webdisk"
    MODE="VM"
else
    echo "--> 🖥️  Host Environment Detected."
    LOCAL_FORGE="\${USER_HOME}/forge"
    MOUNT_POINT="\${USER_HOME}/WebDisk"
    MODE="HOST"
fi

echo "    Source:      \$LOCAL_FORGE"
echo "    Destination: \$MOUNT_POINT"
echo ""

# --- VALIDATION ---
if [ ! -d "\$MOUNT_POINT" ]; then
    echo "❌ ERROR: Mount point '\$MOUNT_POINT' does not exist." >&2
    if [ "\$MODE" == "VM" ]; then
        echo "   (VM Hint: Ensure shared folders are mounted: 'sudo mount -t 9p -o trans=virtio,version=9p2000.L,rw host_webdisk ~/host_webdisk')"
    else
        echo "   (Host Hint: Run the 'Automount WebDisk' ritual first.)"
    fi
    exit 1
fi

if [ ! -d "\$LOCAL_FORGE" ]; then
    echo "❌ ERROR: Source forge '\$LOCAL_FORGE' does not exist." >&2
    exit 1
fi

# Trigger mount by access
echo "--> Waking up WebDisk..."
ls -d "\$MOUNT_POINT" >/dev/null 2>&1 || true

if ! mountpoint -q "\$MOUNT_POINT"; then
    if [ "\$MODE" == "VM" ]; then
        echo "⚠️  VM Share detached. Attempting to mount..."
        if sudo mount -t 9p -o trans=virtio,version=9p2000.L,rw host_webdisk "\$MOUNT_POINT"; then
            echo "✅ Mounted successfully."
        else
            echo "❌ ERROR: Could not mount host_webdisk. Sync aborted to prevent data loss." >&2
            exit 1
        fi
    else
        echo "⚠️  Warning: \$MOUNT_POINT is not a mountpoint. Ensure 'davfs2' is active."
        # On host, we warn but allow proceeding if the user knows what they are doing (e.g. local testing)
    fi
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

const INSTALLER_SCRIPT_RAW = `set -e
# 1. Create temporary file
cat > /tmp/webdisk-sync << 'EOF'
\${SYNC_SCRIPT_RAW}
EOF

# 2. Install system-wide on Host
chmod +x /tmp/webdisk-sync
sudo mv /tmp/webdisk-sync /usr/local/bin/webdisk-sync

# 3. Deploy to Shared Forge (for VM Access)
USER_HOME=\$(getent passwd "\${SUDO_USER:-\$USER}" | cut -d: -f6)
SHARED_SCRIPT="\${USER_HOME}/forge/webdisk-sync.sh"

if [ -d "\${USER_HOME}/forge" ]; then
    cat > "\$SHARED_SCRIPT" << 'EOF'
\${SYNC_SCRIPT_RAW}
EOF
    chmod +x "\$SHARED_SCRIPT"
    echo "✅ 'webdisk-sync.sh' deployed to \$SHARED_SCRIPT (Accessible in VM at ~/host_forge/webdisk-sync.sh)"
fi

echo "✅ 'webdisk-sync' command installed system-wide."
`;

export const WebDiskMountModal: React.FC<WebDiskMountModalProps> = ({ onClose }) => {
    // Updated URL to match the Automount target EXACTLY (port 2078) with new path
    const credsCommand = `mkdir -p ~/.davfs2 && echo 'https://leroyonline.co.za:2078/leroy/forge "leroy@leroyonline.co.za" "LeRoy0923!"' >> ~/.davfs2/secrets && chmod 600 ~/.davfs2/secrets`;
    
    const vmMountCommand = `sudo mount -t 9p -o trans=virtio,version=9p2000.L,rw host_webdisk ~/host_webdisk`;

    const encodedInstaller = btoa(unescape(encodeURIComponent(INSTALLER_SCRIPT_RAW.replace(/\${SYNC_SCRIPT_RAW}/g, SYNC_SCRIPT_RAW))));
    const installCommand = `echo "${encodedInstaller}" | base64 --decode | bash`;
    
    const runCommand = `webdisk-sync`;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in-fast" onClick={onClose}>
            <div className="bg-forge-panel border-2 border-forge-border rounded-lg shadow-2xl w-full max-w-3xl p-6 m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                     <h2 className="text-xl font-bold text-forge-text-primary flex items-center gap-2 font-display tracking-wider">
                        <DocumentDuplicateIcon className="w-5 h-5 text-dragon-fire" />
                        <span>WebDisk Forge Sync 0.00.01 (VM Walker)</span>
                    </h2>
                    <button onClick={onClose} className="text-forge-text-secondary hover:text-forge-text-primary">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="overflow-y-auto pr-2 text-forge-text-secondary leading-relaxed space-y-4">
                    <p>
                        Architect, this ritual synchronizes your <strong className="text-forge-text-primary">entire forge workspace</strong> to the WebDisk. I have upgraded it to be aware of the Void (VM).
                    </p>
                    <div className="text-sm p-3 bg-orc-steel/10 border-l-4 border-orc-steel rounded space-y-2">
                        <strong className="text-orc-steel">VM Walker Capabilities:</strong>
                        <ul className="list-disc list-inside">
                            <li><strong>Environment Detection:</strong> Automatically detects if it is running on the Host or inside the VM.</li>
                            <li><strong>Auto-Mount:</strong> If the VM share is detected but detached, it will automatically attempt to mount it before syncing. Aborts if mounting fails.</li>
                            <li><strong>Path Mapping:</strong> 
                                <ul className="pl-4 list-square text-xs mt-1 text-forge-text-secondary">
                                    <li>Host: Syncs <code className="font-mono">~/forge</code> to <code className="font-mono">~/WebDisk</code></li>
                                    <li>VM: Syncs <code className="font-mono">~/host_forge</code> to <code className="font-mono">~/host_webdisk</code></li>
                                </ul>
                            </li>
                        </ul>
                    </div>

                    <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">Step 1: Forge the Tool (Run on Host)</h3>
                    <p>
                        Run this on your main machine. It installs the command and also places a copy in the shared folder for the VM.
                    </p>
                    <CodeBlock lang="bash">{installCommand}</CodeBlock>

                    <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">Step 2: Invoke the Sync</h3>
                    <p>
                        <strong>On Host:</strong> Run <code>webdisk-sync</code><br/>
                        <strong>On VM:</strong> Run <code>bash ~/host_forge/webdisk-sync.sh</code>
                    </p>
                    <div className="border-t border-forge-border pt-4 mt-4">
                        <h3 className="font-bold text-dragon-fire flex items-center gap-2">
                            <ServerIcon className="w-4 h-4" />
                            <span>Troubleshooting</span>
                        </h3>
                        <div className="space-y-3 mt-2 text-sm">
                            <p><strong>VM Mount Command:</strong> If the script can't auto-mount, run this inside the VM:</p>
                            <CodeBlock lang="bash">{vmMountCommand}</CodeBlock>
                            
                            <p><strong>Host Manual Credentials:</strong> If automount fails on host, use this:</p>
                            <CodeBlock lang="bash">{credsCommand}</CodeBlock>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};