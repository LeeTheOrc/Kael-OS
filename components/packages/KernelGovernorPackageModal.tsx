
import React from 'react';
import { CloseIcon, CpuChipIcon } from '../core/Icons';
import { CodeBlock } from '../core/CodeBlock';

interface KernelGovernorPackageModalProps {
  onClose: () => void;
}

const FORGE_SCRIPT_RAW = `#!/bin/bash
(
set -euo pipefail

# --- VM-AWARE PATHING ---
USER_HOME=$(getent passwd "\${SUDO_USER:-$USER}" | cut -d: -f6)
if [ -d "$USER_HOME/host_forge" ]; then
    PKG_DIR="$USER_HOME/host_forge/packages/kaelic-kernel-governor"
else
    PKG_DIR="$USER_HOME/forge/packages/kaelic-kernel-governor"
fi

mkdir -p "$PKG_DIR"
cd "$PKG_DIR"
rm -f *.pkg.tar.zst* PKGBUILD

echo "--- Forging Kernel Governor v0.00.02 (Base Artifact) ---"

# This is a BASE TEMPLATE. It provides safe defaults.
# The 'khs' script will summon this from the repo and rewrite its dependencies.
cat > PKGBUILD << 'EOF'
# Maintainer: Kael AI for The Architect
# This PKGBUILD is a template managed by the 'khs' Driver Sentinel.
pkgname=kaelic-kernel-governor
pkgver=0.00.02
pkgrel=1
pkgdesc="The self-managing kernel governor for Kael OS. Its dependencies are dynamically set by 'khs'."
arch=('any')
url="https://github.com/LeeTheOrc/Kael-OS"
license=('GPL3')
# --- DYNAMIC DEPENDENCY ANCHOR --- (khs will replace this line)
depends=('linux' 'linux-headers' 'linux-lts' 'linux-lts-headers')
provides=('linux' 'linux-lts') # It can satisfy dependencies for both
conflicts=('linux' 'linux-lts' 'linux-cachyos' 'kaelic-kernel-linux' 'kaelic-kernel-performance' 'kaelic-kernel-lts')
replaces=('linux' 'linux-lts' 'kaelic-kernel-linux' 'kaelic-kernel-performance' 'kaelic-kernel-lts')

package() {
    : # This is a meta-package, it installs no files of its own.
}
EOF

# Invoke the Scribe to publish this base package to the repository
echo "--> Invoking the Grand Concordance ritual to publish..."
if command -v grand-concordance &>/dev/null; then
    grand-concordance
elif [ -f "$HOME/host_forge/grand-concordance.sh" ]; then
    bash "$HOME/host_forge/grand-concordance.sh"
else
    echo "❌ Error: The 'grand-concordance' ritual cannot be found."
    exit 1
fi

echo ""
echo "✨ Kernel Governor base package has been forged and published."
echo "   Other systems can now install it via 'pacman'."

)
`;

export const KernelGovernorPackageModal: React.FC<KernelGovernorPackageModalProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in-fast" onClick={onClose}>
            <div className="bg-forge-panel border-2 border-forge-border rounded-lg shadow-2xl w-full max-w-3xl p-6 m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center mb-4 flex-shrink-0">
                     <h2 className="text-xl font-bold text-forge-text-primary flex items-center gap-2 font-display tracking-wider">
                        <CpuChipIcon className="w-5 h-5 text-dragon-fire" />
                        <span>Forge Kernel Governor v0.00.02</span>
                    </h2>
                    <button onClick={onClose} className="text-forge-text-secondary hover:text-forge-text-primary">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </header>
                <div className="overflow-y-auto pr-2 text-forge-text-secondary leading-relaxed space-y-6">
                     <p>
                        This ritual forges the <strong className="text-dragon-fire">Kernel Governor</strong>, the heart of our new self-managing system, and publishes it to the repository.
                    </p>
                    <p className="text-sm p-3 bg-orc-steel/10 border-l-4 border-orc-steel rounded">
                       This creates a <strong className="text-orc-steel">base package (v0.00.02)</strong> with safe defaults. The Driver Sentinel (`khs`) on a user's machine will summon this package, rewrite its dependencies to match their hardware, and reinstall it, creating a perfectly attuned system.
                    </p>

                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">The Forging Incantation</h3>
                        <p className="text-xs mb-2">This creates the `PKGBUILD`, then invokes the Scribe to build and publish the base artifact.</p>
                        <CodeBlock lang="bash">{FORGE_SCRIPT_RAW}</CodeBlock>
                    </div>
                </div>
            </div>
        </div>
    );
};
