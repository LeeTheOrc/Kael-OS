
import React from 'react';
import { CloseIcon, ShieldCheckIcon } from '../core/Icons';
import { CodeBlock } from '../core/CodeBlock';

interface CachyosRepairModalProps {
  onClose: () => void;
}

const REPAIR_SCRIPT_RAW = `#!/bin/bash
set -euo pipefail

echo "--- CachyOS Restoration Ritual ---"
echo "This ritual will re-install the CachyOS keyring and repository configurations."
echo ""

# Create a temporary directory and automatically cd into it
# and clean it up on exit.
TEMP_DIR=$(mktemp -d)
cd "$TEMP_DIR"
trap 'rm -rf -- "$TEMP_DIR"' EXIT SIGINT SIGTERM

echo "--> Summoning CachyOS setup scripts..."
curl -fsSL https://mirror.cachyos.org/cachyos-repo.tar.xz -o cachyos-repo.tar.xz

echo "--> Extracting and running the repair script..."
tar xf cachyos-repo.tar.xz && cd cachyos-repo
sudo ./cachyos-repo.sh

echo ""
echo "--> Forcing a full database refresh..."
sudo pacman -Syyu

echo ""
echo "✨ Ritual Complete! Your CachyOS trust chain should now be restored."
`;

export const CachyosRepairModal: React.FC<CachyosRepairModalProps> = ({ onClose }) => {
    const encodedScript = btoa(unescape(encodeURIComponent(REPAIR_SCRIPT_RAW)));
    const finalCommand = `echo "${encodedScript}" | base64 --decode | bash`;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in-fast" onClick={onClose}>
        <div className="bg-forge-panel border-2 border-forge-border rounded-lg shadow-2xl w-full max-w-3xl p-6 m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                 <h2 className="text-xl font-bold text-forge-text-primary flex items-center gap-2 font-display tracking-wider">
                    <ShieldCheckIcon className="w-5 h-5 text-dragon-fire" />
                    <span>CachyOS Restoration Ritual</span>
                </h2>
                <button onClick={onClose} className="text-forge-text-secondary hover:text-forge-text-primary">
                    <CloseIcon className="w-5 h-5" />
                </button>
            </div>
            <div className="overflow-y-auto pr-2 text-forge-text-secondary leading-relaxed space-y-4">
                <p>
                  Architect, my apologies. A previous version of the 'Forge Dependencies' ritual contained a destructive incantation that likely broke your system's trust with the CachyOS repositories.
                </p>
                 <p className="text-sm p-3 bg-orc-steel/10 border-l-4 border-orc-steel rounded">
                    This ritual will heal your Realm. It uses the <strong className="text-orc-steel">official CachyOS method</strong> to safely re-install their keyring and repository configurations, restoring full functionality.
                </p>
                <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">The Restoration Incantation</h3>
                <p>
                    Run this single command in your terminal to repair your CachyOS installation.
                </p>
                 <CodeBlock lang="bash">{finalCommand}</CodeBlock>
            </div>
        </div>
    </div>
  );
};
