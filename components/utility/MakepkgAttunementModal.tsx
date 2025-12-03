
import React from 'react';
import { CloseIcon, CpuChipIcon } from '../core/Icons';
import { CodeBlock } from '../core/CodeBlock';

interface MakepkgAttunementModalProps {
  onClose: () => void;
}

const ATTUNEMENT_SCRIPT_RAW = `#!/bin/bash
set -euo pipefail

echo "--- Attune The Master Crafter Ritual ---"
echo "This ritual attunes makepkg to use all available cores."
echo ""

CONFIG_FILE="/etc/makepkg.conf"
BACKUP_FILE="/etc/makepkg.conf.kael-cores.bak"

echo "--> Backing up current configuration..."
if [ ! -f "$BACKUP_FILE" ]; then
    sudo cp "$CONFIG_FILE" "$BACKUP_FILE"
    echo "    -> Backup created at: $BACKUP_FILE"
else
    echo "    -> Backup already exists. Skipping."
fi
echo "✅ Backup is secure."
echo ""

echo "--> Unleashing all CPU cores for compilation..."
# Use sed to find and replace the MAKEFLAGS line, or append it if it doesn't exist.
if sudo grep -q '^#\\?MAKEFLAGS=' "$CONFIG_FILE"; then
    sudo sed -i 's/^#\\?MAKEFLAGS=.*/MAKEFLAGS="-j$(nproc)"/' "$CONFIG_FILE"
# Check if it's already set and uncommented, then update it
elif sudo grep -q '^MAKEFLAGS=' "$CONFIG_FILE"; then
    sudo sed -i 's/^MAKEFLAGS=.*/MAKEFLAGS="-j$(nproc)"/' "$CONFIG_FILE"
else
    echo 'MAKEFLAGS="-j$(nproc)"' | sudo tee -a "$CONFIG_FILE" > /dev/null
fi
echo "✅ MAKEFLAGS set to use all available cores."
echo ""

echo "--> Enabling parallel compression..."
# Do the same for COMPRESSXZ and COMPRESSZST
if sudo grep -q '^#\\?COMPRESSXZ=' "$CONFIG_FILE"; then
    sudo sed -i 's/^#\\?COMPRESSXZ=.*/COMPRESSXZ=(xz -c -z - --threads=0)/' "$CONFIG_FILE"
elif sudo grep -q '^COMPRESSXZ=' "$CONFIG_FILE"; then
    sudo sed -i 's/^COMPRESSXZ=.*/COMPRESSXZ=(xz -c -z - --threads=0)/' "$CONFIG_FILE"
else
    echo 'COMPRESSXZ=(xz -c -z - --threads=0)' | sudo tee -a "$CONFIG_FILE" > /dev/null
fi

if sudo grep -q '^#\\?COMPRESSZST=' "$CONFIG_FILE"; then
    sudo sed -i 's/^#\\?COMPRESSZST=.*/COMPRESSZST=(zstd -c -z -q - --threads=0)/' "$CONFIG_FILE"
elif sudo grep -q '^COMPRESSZST=' "$CONFIG_FILE"; then
    sudo sed -i 's/^COMPRESSZST=.*/COMPRESSZST=(zstd -c -z -q - --threads=0)/' "$CONFIG_FILE"
else
    echo 'COMPRESSZST=(zstd -c -z -q - --threads=0)' | sudo tee -a "$CONFIG_FILE" > /dev/null
fi
echo "✅ Compression is now parallelized."
echo ""

echo "✨ Ritual Complete! The Master Crafter is now fully attuned."
`;

export const MakepkgAttunementModal: React.FC<MakepkgAttunementModalProps> = ({ onClose }) => {
    const finalCommand = `echo "${btoa(unescape(encodeURIComponent(ATTUNEMENT_SCRIPT_RAW)))}" | base64 --decode | sudo bash`;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in-fast" onClick={onClose}>
            <div className="bg-forge-panel border-2 border-forge-border rounded-lg shadow-2xl w-full max-w-3xl p-6 m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                     <h2 className="text-xl font-bold text-forge-text-primary flex items-center gap-2 font-display tracking-wider">
                        <CpuChipIcon className="w-5 h-5 text-dragon-fire" />
                        <span>Attune The Master Crafter</span>
                    </h2>
                    <button onClick={onClose} className="text-forge-text-secondary hover:text-forge-text-primary">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="overflow-y-auto pr-2 text-forge-text-secondary leading-relaxed space-y-4">
                    <p>
                        Architect, a high-performance Realm cannot be forged on a single anvil. This critical one-time ritual attunes the master crafter, <code className="font-mono text-xs">makepkg</code>, to use the full power of your machine.
                    </p>
                    <div className="text-sm p-3 bg-orc-steel/10 border-l-4 border-orc-steel rounded space-y-2">
                        <strong className="text-orc-steel">Effects of this Ritual:</strong>
                        <ul className="list-disc list-inside">
                            <li>Sets <code className="font-mono text-xs">MAKEFLAGS</code> to use all available CPU cores, dramatically reducing compilation times.</li>
                            <li>Enables parallel compression for packaging artifacts.</li>
                        </ul>
                    </div>

                    <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">The Attunement Incantation</h3>
                    <p>
                        Run this on your host machine to prepare it for the "Longest Ritual" of kernel compilation.
                    </p>
                    <CodeBlock lang="bash">{finalCommand}</CodeBlock>
                </div>
            </div>
        </div>
    );
};
