import React from 'react';
import { CloseIcon, LinkIcon } from '../core/Icons';
import { CodeBlock } from '../core/CodeBlock';

interface WebDiskAttunementModalProps {
  onClose: () => void;
}

const WEBDISK_SCRIPT_RAW = `#!/bin/bash
set -euo pipefail

echo "--- WebDisk Athenaeum Attunement Ritual v1.5 ---"
echo "This ritual adds a pre-configured, redundant mirror to your pacman configuration."
echo ""

# --- CONFIGURATION ---
WEBDISK_REPO_ENTRY="[kael-os-webdisk]\\nSigLevel = Required DatabaseOptional\\nServer = https://leroyonline.co.za/leroyonline.co.za/leroy/forge/repo/"
CONFIG_FILE="/etc/pacman.conf"
BACKUP_FILE="/etc/pacman.conf.kael-webdisk.bak"

# --- [1/2] Configuration Backup ---
echo "--> [1/2] Backing up current pacman configuration..."
if [ -f "\$CONFIG_FILE" ]; then
    if [ ! -f "\$BACKUP_FILE" ]; then
        sudo cp "\$CONFIG_FILE" "\$BACKUP_FILE"
        echo "    -> Backup created at: \$BACKUP_FILE"
    else
        echo "    -> Backup already exists. Skipping."
    fi
    echo "✅ Backup is secure."
else
    echo "❌ ERROR: pacman config not found at \$CONFIG_FILE" >&2
    exit 1
fi
echo ""

# --- [2/2] Update pacman.conf ---
echo "--> [2/2] Scribing new repository into \$CONFIG_FILE..."

# Check if the entry already exists to make the script re-runnable
if grep -q "^\\[kael-os-webdisk\\]" "\$CONFIG_FILE"; then
    echo "--> WebDisk Athenaeum already configured. Overwriting with corrected path..."
    # Use a temporary file to atomically replace the section
    TMP_CONFIG=\$(mktemp)
    trap 'rm -f -- "\$TMP_CONFIG"' EXIT
    
    # Copy config, excluding the old section
    awk '
        /^\\\[kael-os-webdisk\\\]/ { in_section=1; next }
        /^\\s*\\\[/            { in_section=0 }
        !in_section         { print }
    ' "\$CONFIG_FILE" > "\$TMP_CONFIG"
    
    # Append the new, correct section
    printf "\\n%b\\n" "\$WEBDISK_REPO_ENTRY" >> "\$TMP_CONFIG"
    
    # Apply the changes
    cat "\$TMP_CONFIG" | sudo tee "\$CONFIG_FILE" > /dev/null
    echo "✅ pacman.conf has been updated with the corrected WebDisk path."
else
    # Use tee with sudo to append the entry with root privileges
    printf "\\n%b\\n" "\$WEBDISK_REPO_ENTRY" | sudo tee -a "\$CONFIG_FILE" > /dev/null
    echo "✅ pacman.conf has been updated with the WebDisk Athenaeum."
fi

echo ""
echo "✨ Ritual Complete! Force a database refresh with 'sudo pacman -Syyu' to apply."
`;


export const WebDiskAttunementModal: React.FC<WebDiskAttunementModalProps> = ({ onClose }) => {
  const encodedScript = btoa(unescape(encodeURIComponent(WEBDISK_SCRIPT_RAW)));
  const finalCommand = `echo "${encodedScript}" | base64 --decode | bash`;
  
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in-fast" onClick={onClose}>
        <div className="bg-forge-panel border-2 border-forge-border rounded-lg shadow-2xl w-full max-w-3xl p-6 m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                 <h2 className="text-xl font-bold text-forge-text-primary flex items-center gap-2 font-display tracking-wider">
                    <LinkIcon className="w-5 h-5 text-dragon-fire" />
                    <span>Attune to WebDisk Athenaeum v1.5</span>
                </h2>
                <button onClick={onClose} className="text-forge-text-secondary hover:text-forge-text-primary">
                    <CloseIcon className="w-5 h-5" />
                </button>
            </div>
            <div className="overflow-y-auto pr-2 text-forge-text-secondary leading-relaxed space-y-4">
                <p>
                  Architect, this ritual attunes a Realm to our redundant WebDisk Athenaeum.
                </p>
                 <p className="text-sm p-3 bg-orc-steel/10 border-l-4 border-orc-steel rounded">
                    <strong className="text-orc-steel">Patch v1.5:</strong> Updated server URL to correct path: <code className="font-mono text-xs">.../leroy/forge/repo/</code>.
                </p>
                <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">The Attunement Incantation</h3>
                <p>
                    Run this command in your terminal. It will safely update your repository configuration.
                </p>
                 <CodeBlock lang="bash">{finalCommand}</CodeBlock>
                 <p className="font-semibold">
                    After the ritual is complete, it is wise to force a refresh of your package databases by running <code className="font-mono text-xs">sudo pacman -Syyu</code>.
                 </p>
            </div>
        </div>
    </div>
  );
};