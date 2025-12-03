
import React from 'react';
import { CloseIcon, KeyIcon, ServerIcon } from '../core/Icons';
import { CodeBlock } from '../core/CodeBlock';

interface GpgTransferRitualModalProps {
  onClose: () => void;
}

const EXPORT_SCRIPT_RAW = `#!/bin/bash
set -euo pipefail

echo "--- GPG Identity Transfer Ritual ---"
echo "Target: ~/forge/architect.asc (Shared Folder)"

# --- [1/2] Detect Key ---
GPG_KEY_ID=""
if [ -f /etc/makepkg.conf ] && grep -q -E '^GPGKEY=' /etc/makepkg.conf; then
    GPG_KEY_ID=$(grep -E '^GPGKEY=' /etc/makepkg.conf | head -1 | cut -d'=' -f2 | tr -d '[:space:]"')
fi
if [[ -z "$GPG_KEY_ID" ]] && command -v git &>/dev/null && git config --global user.signingkey &>/dev/null; then
    GPG_KEY_ID=$(git config --global user.signingkey)
fi
if [[ -z "$GPG_KEY_ID" ]]; then
    GPG_KEY_ID=$(gpg --list-secret-keys --with-colons | awk -F: '/^sec/{print $5; exit}')
fi

if [[ -z "$GPG_KEY_ID" ]]; then
    echo "❌ ERROR: Could not detect a GPG key on the host."
    exit 1
fi

echo "--> Detected Key: $GPG_KEY_ID"

# --- [2/2] Export to Shared Folder ---
EXPORT_PATH="$HOME/forge/architect.asc"
mkdir -p "$(dirname "$EXPORT_PATH")"

echo "--> Exporting secret key to $EXPORT_PATH..."
gpg --export-secret-keys --armor "$GPG_KEY_ID" > "$EXPORT_PATH"

echo "✅ Identity Exported!"
echo "   Key ID: $GPG_KEY_ID"
echo "   File:   $EXPORT_PATH"
echo ""
echo "Since ~/forge is shared with the VM as 'host_forge', the key is now accessible inside."
`;

export const GpgTransferRitualModal: React.FC<GpgTransferRitualModalProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in-fast" onClick={onClose}>
            <div className="bg-forge-panel border-2 border-forge-border rounded-lg shadow-2xl w-full max-w-3xl p-6 m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                     <h2 className="text-xl font-bold text-forge-text-primary flex items-center gap-2 font-display tracking-wider">
                        <KeyIcon className="w-5 h-5 text-dragon-fire" />
                        <span>Transfer GPG Identity to VM</span>
                    </h2>
                    <button onClick={onClose} className="text-forge-text-secondary hover:text-forge-text-primary">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="overflow-y-auto pr-2 text-forge-text-secondary leading-relaxed space-y-4">
                    <p>
                        Architect, this ritual bridges your identity across the void. It exports your host's GPG signing key to the shared forge folder, making it instantly accessible inside your new VM.
                    </p>

                    <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">Step 1: Export on Host</h3>
                    <p>
                        Run this on your main machine (the host) to place the key in the shared folder.
                    </p>
                    <CodeBlock lang="bash">{EXPORT_SCRIPT_RAW}</CodeBlock>

                    <div className="border-t border-forge-border pt-4 mt-4">
                        <h3 className="font-bold text-dragon-fire flex items-center gap-2 mb-2">
                            <ServerIcon className="w-4 h-4" />
                            <span>Step 2: Import inside VM</span>
                        </h3>
                        <p className="text-sm mb-2">
                            Once inside the VM (via SSH or window), run these commands.
                        </p>
                        <div className="bg-black/30 p-3 rounded border border-forge-border/50 text-sm font-mono text-forge-text-primary">
                            <div className="mb-2 text-forge-text-secondary"># 1. Mount the shared folder (Required)</div>
                            <div className="text-orc-steel">sudo mount -t 9p -o trans=virtio,version=9p2000.L,rw host_forge ~/host_forge</div>
                            <br/>
                            <div className="mb-2 text-forge-text-secondary"># 2. Import the key</div>
                            <div>gpg --import ~/host_forge/architect.asc</div>
                            <br/>
                            <div className="mb-2 text-forge-text-secondary"># 3. Trust the key (Essential for pacman/makepkg)</div>
                            <div>KEY_ID=$(gpg --list-keys --with-colons | grep "^pub" | head -n1 | cut -d: -f5)</div>
                            <div>echo -e "5\ny\n" | gpg --command-fd 0 --edit-key "$KEY_ID" trust</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
