
import React, { useState } from 'react';
import { CloseIcon, CpuChipIcon } from '../core/Icons';
import { CodeBlock } from '../core/CodeBlock';

interface KaelicHardwareScryerModalProps {
  onClose: () => void;
}

const SCRIBE_SOUL_SCRIPT_RAW = `#!/bin/bash
(
set -euo pipefail
# --- VM-AWARE PATHING ---
USER_HOME=\$(getent passwd "\${SUDO_USER:-\$USER}" | cut -d: -f6)
if [ -d "\$USER_HOME/host_forge" ]; then
    PKG_DIR="\$USER_HOME/host_forge/packages/kaelic-hardware-scryer"
else
    PKG_DIR="\$USER_HOME/forge/packages/kaelic-hardware-scryer"
fi

echo "--- The Scribe's Partition - Step 2/6: Scribing the Sentinel's Soul (v0.070) ---"
cd "\${PKG_DIR}"

echo "--> Summoning the Sentinel's soul from the canonical source..."
# The Download Pact: Download from a stable URL to bypass all base64/escaping issues.
if ! curl -fsSL "https://raw.githubusercontent.com/LeeTheOrc/Kael-OS/main/scripts/khs.sh" -o "khs.sh"; then
    echo "❌ ERROR: Failed to download the Sentinel's soul. Check your network connection."
    exit 1
fi

chmod +x khs.sh
echo "✅ Soul scribed and sanctified."
)
`;

const PKGBUILD_CONTENT = `
# Maintainer: Kael AI for The Architect
pkgname=kaelic-hardware-scryer
_pkgname=khs
pkgver=0.070
pkgrel=1
pkgdesc="The Download Pact: Kael's Sovereign Driver Sentinel for automated hardware and kernel management."
arch=('any')
url="https://github.com/LeeTheOrc/Kael-OS"
license=('GPL3')
depends=('bash' 'coreutils' 'systemd' 'grep' 'sed' 'gawk' 'pacman' 'grub' 'libnotify' 'stress-ng' 'glmark2' 'curl')
optdepends=('nvidia-dkms: for NVIDIA GPUs' 'spice-vdagent: for QEMU/KVM VMs')
source=("khs.sh")
sha256sums=('SKIP')

package() {
    install -Dm755 "\$srcdir/khs.sh" "\$pkgdir/usr/bin/\$_pkgname"
}
`;

const SCRIBE_BLUEPRINT_SCRIPT_RAW = `#!/bin/bash
(
set -euo pipefail
# --- VM-AWARE PATHING ---
USER_HOME=\$(getent passwd "\${SUDO_USER:-\$USER}" | cut -d: -f6)
if [ -d "\$USER_HOME/host_forge" ]; then
    PKG_DIR="\$USER_HOME/host_forge/packages/kaelic-hardware-scryer"
else
    PKG_DIR="\$USER_HOME/forge/packages/kaelic-hardware-scryer"
fi
echo "--- The Scribe's Partition - Step 3/6: Scribing the Blueprint ---"
cd "\${PKG_DIR}"
echo "--> Scribing blueprint (PKGBUILD)..."
cat > PKGBUILD << 'EOF'
${"PKGBUILD_CONTENT"}
EOF
updpkgsums
echo "✅ Blueprint scribed and attuned."
)
`;

const PREPARE_FORGE_SCRIPT_RAW = `#!/bin/bash
(
set -euo pipefail
# --- VM-AWARE PATHING ---
USER_HOME=\$(getent passwd "\${SUDO_USER:-\$USER}" | cut -d: -f6)
if [ -d "\$USER_HOME/host_forge" ]; then
    PKG_DIR="\$USER_HOME/host_forge/packages/kaelic-hardware-scryer"
else
    PKG_DIR="\$USER_HOME/forge/packages/kaelic-hardware-scryer"
fi
echo "--- The Scribe's Partition - Step 1/6: Preparing the Forge ---"
mkdir -p "\${PKG_DIR}"
cd "\${PKG_DIR}"
rm -f *.pkg.tar.zst* PKGBUILD khs.sh
echo "✅ Forge is ready and cleansed."
)
`;

const FORGE_PUBLISH_SCRIPT_RAW = `#!/bin/bash
(
set -euo pipefail
# --- VM-AWARE PATHING ---
USER_HOME=\$(getent passwd "\${SUDO_USER:-\$USER}" | cut -d: -f6)
if [ -d "\$USER_HOME/host_forge" ]; then
    PKG_DIR="\$USER_HOME/host_forge/packages/kaelic-hardware-scryer"
    SCRIBE_CMD="bash \$HOME/host_forge/grand-concordance.sh"
else
    PKG_DIR="\$USER_HOME/forge/packages/kaelic-hardware-scryer"
    SCRIBE_CMD="grand-concordance"
fi
echo "--- The Scribe's Partition - Step 4/6: Forge & Publish ---"
cd "\${PKG_DIR}"
echo "--> Invoking the Grand Concordance ritual..."
if ! command -v \${SCRIBE_CMD} &>/dev/null; then
    echo "❌ ERROR: The 'grand-concordance' ritual cannot be found."
    exit 1
fi
\${SCRIBE_CMD}
echo "✅ Artifact forged and published."
)
`;

const INSTALL_SCRIPT_RAW = `#!/bin/bash
(
set -euo pipefail
echo "--- The Scribe's Partition - Step 5/6: Install ---"
echo "--> Summoning the quartermaster..."
sudo pacman -S --noconfirm kaelic-hardware-scryer
echo "✅ Sentinel installed."
)
`;

const INVOKE_CMD_RAW = `sudo khs`;


export const KaelicHardwareScryerModal: React.FC<KaelicHardwareScryerModalProps> = ({ onClose }) => {
    
    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in-fast" onClick={onClose}>
            <div className="bg-forge-panel border-2 border-forge-border rounded-lg shadow-2xl w-full max-w-4xl p-6 m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center mb-4 flex-shrink-0">
                     <h2 className="text-xl font-bold text-forge-text-primary flex items-center gap-2 font-display tracking-wider">
                        <CpuChipIcon className="w-5 h-5 text-dragon-fire" />
                        <span>Forge Driver Sentinel v0.070 (The Download Pact)</span>
                    </h2>
                    <button onClick={onClose} className="text-forge-text-secondary hover:text-forge-text-primary">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </header>
                
                <div className="overflow-y-auto pr-2 text-forge-text-secondary leading-relaxed space-y-6">
                    <p className="text-sm p-3 bg-orc-steel/10 border-l-4 border-orc-steel rounded">
                        <strong className="text-orc-steel">The Download Pact (v0.070):</strong> My deepest apologies, Architect. The base64 grimoire has proven too fragile. This pact is a definitive fix. The "Scribe Soul" ritual now summons the Sentinel's essence directly from its canonical source on GitHub, completely bypassing the flawed base64 process.
                    </p>
                    
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg text-dragon-fire mt-4 mb-2">Step 1: Prepare Forge</h3>
                        <CodeBlock lang="bash">{`echo "${btoa(unescape(encodeURIComponent(PREPARE_FORGE_SCRIPT_RAW)))}" | base64 --decode | bash`}</CodeBlock>

                        <h3 className="font-semibold text-lg text-dragon-fire mt-4 mb-2">Step 2: Scribe Soul</h3>
                        <CodeBlock lang="bash">{`echo "${btoa(unescape(encodeURIComponent(SCRIBE_SOUL_SCRIPT_RAW)))}" | base64 --decode | bash`}</CodeBlock>

                        <h3 className="font-semibold text-lg text-dragon-fire mt-4 mb-2">Step 3: Scribe Blueprint</h3>
                        <CodeBlock lang="bash">{`echo "${btoa(unescape(encodeURIComponent(SCRIBE_BLUEPRINT_SCRIPT_RAW.replace('${"PKGBUILD_CONTENT"}', PKGBUILD_CONTENT))))}" | base64 --decode | bash`}</CodeBlock>

                        <h3 className="font-semibold text-lg text-dragon-fire mt-4 mb-2">Step 4: Forge & Publish</h3>
                        <CodeBlock lang="bash">{`echo "${btoa(unescape(encodeURIComponent(FORGE_PUBLISH_SCRIPT_RAW)))}" | base64 --decode | bash`}</CodeBlock>

                        <h3 className="font-semibold text-lg text-dragon-fire mt-4 mb-2">Step 5: Install</h3>
                        <CodeBlock lang="bash">{`echo "${btoa(unescape(encodeURIComponent(INSTALL_SCRIPT_RAW)))}" | base64 --decode | bash`}</CodeBlock>

                        <h3 className="font-semibold text-lg text-dragon-fire mt-4 mb-2">Step 6: Invoke</h3>
                        <CodeBlock lang="bash">{INVOKE_CMD_RAW}</CodeBlock>
                    </div>
                </div>
            </div>
        </div>
    );
};
