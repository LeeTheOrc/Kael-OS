import React, { useState } from 'react';
import { CloseIcon, CpuChipIcon } from '../core/Icons';
import { CodeBlock } from '../core/CodeBlock';

interface KaelicHardwareScryerModalProps {
  onClose: () => void;
}

const STEP_1_PREPARE_FORGE = `#!/bin/bash
# --- VM-AWARE PATHING ---
USER_HOME=$(getent passwd "\${SUDO_USER:-\$USER}" | cut -d: -f6)
if [ -d "\$USER_HOME/host_forge" ]; then
    PKG_DIR="\$USER_HOME/host_forge/packages/kaelic-hardware-scryer"
else
    PKG_DIR="\$USER_HOME/forge/packages/kaelic-hardware-scryer"
fi
echo "--- The Scribe's Partition - Step 1/6: Preparing the Forge ---"
mkdir -p "\${PKG_DIR}"
cd "\${PKG_DIR}"
rm -f *.pkg.tar.zst* PKGBUILD khs.sh *.install
echo "✅ Forge is ready and cleansed."
`;

const STEP_2_SCRIBE_SOUL = `#!/bin/bash
# --- VM-AWARE PATHING ---
USER_HOME=$(getent passwd "\${SUDO_USER:-\$USER}" | cut -d: -f6)
if [ -d "\$USER_HOME/host_forge" ]; then
    PKG_DIR="\$USER_HOME/host_forge/packages/kaelic-hardware-scryer"
else
    PKG_DIR="\$USER_HOME/forge/packages/kaelic-hardware-scryer"
fi
echo "--- The Scribe's Partition - Step 2/6: Scribing the Sentinel's Soul (v0.083) ---"
cd "\${PKG_DIR}"

echo "--> Summoning the Sentinel's soul from the canonical source..."
# The Direct Summoning: Download the script directly to bypass base64/terminal issues.
CANONICAL_URL="https://raw.githubusercontent.com/LeeTheOrc/kael-os-repo/gh-pages/artifacts/scripts/khs.sh"
if ! curl -fsSL "\${CANONICAL_URL}" -o "khs.sh"; then
    echo "❌ ERROR: Failed to download the Sentinel's soul. Check your network connection."
    exit 1
fi

chmod +x khs.sh
echo "✅ Soul summoned and sanctified."
`;

const STEP_3_SCRIBE_BLUEPRINT = `#!/bin/bash
# --- VM-AWARE PATHING ---
USER_HOME=$(getent passwd "\${SUDO_USER:-\$USER}" | cut -d: -f6)
if [ -d "\$USER_HOME/host_forge" ]; then
    PKG_DIR="\$USER_HOME/host_forge/packages/kaelic-hardware-scryer"
else
    PKG_DIR="\$USER_HOME/forge/packages/kaelic-hardware-scryer"
fi
echo "--- The Scribe's Partition - Step 3/6: Scribing the Blueprint ---"
cd "\${PKG_DIR}"
echo "--> Scribing blueprint (PKGBUILD) and install script..."

cat > PKGBUILD << 'EOF'
# Maintainer: Kael AI for The Architect
pkgname=kaelic-hardware-scryer
_pkgname=khs
pkgver=0.083
pkgrel=1
pkgdesc="The Canonical Summoning: A resilient, self-managing Driver Sentinel."
arch=('any')
url="https://github.com/LeeTheOrc/Kael-OS"
license=('GPL3')
depends=('bash' 'coreutils' 'systemd' 'grep' 'sed' 'gawk' 'pacman' 'grub' 'libnotify' 'stress-ng' 'glmark2' 'perf' 'procps-ng')
optdepends=('nvidia-dkms: for NVIDIA GPUs' 'spice-vdagent: for QEMU/KVM VMs')
source=("khs.sh" "kaelic-hardware-scryer.install")
sha256sums=('SKIP' 'SKIP')
install=kaelic-hardware-scryer.install

package() {
    install -Dm755 "\$srcdir/khs.sh" "\$pkgdir/usr/bin/\$_pkgname"
}
EOF

cat > kaelic-hardware-scryer.install << 'EOF'
post_install() {
    echo "--> Kaelic Hardware Scryer (khs) v0.083 installed."
    echo "--> Run 'sudo khs' to begin."
}
post_upgrade() {
    post_install
}
EOF

updpkgsums
echo "✅ Blueprint scribed and attuned."
`;

const STEP_4_FORGE_PUBLISH = `#!/bin/bash
# --- VM-AWARE PATHING ---
USER_HOME=$(getent passwd "\${SUDO_USER:-\$USER}" | cut -d: -f6)
if [ -d "\$USER_HOME/host_forge" ]; then
    PKG_DIR="\$USER_HOME/host_forge/packages/kaelic-hardware-scryer"
    SCRIBE_CMD="bash \$USER_HOME/host_forge/grand-concordance.sh"
else
    PKG_DIR="\$USER_HOME/forge/packages/kaelic-hardware-scryer"
    SCRIBE_CMD="grand-concordance"
fi
echo "--- The Scribe's Partition - Step 4/6: Forge & Publish ---"
cd "\${PKG_DIR}"
echo "--> Invoking the Grand Concordance ritual..."
if ! command -v \${SCRIBE_CMD%% *} &>/dev/null && ! [ -f "\${SCRIBE_CMD##* }" ]; then
    echo "❌ ERROR: The 'grand-concordance' ritual cannot be found."
    echo "   Please use 'The Forge' -> 'Core Setup' -> 'Install/Update Grand Concordance' to install it first."
    exit 1
fi
\${SCRIBE_CMD}
echo "✅ Artifact forged and published."
`;

const STEP_5_INSTALL_PACKAGE = `#!/bin/bash
echo "--- The Scribe's Partition - Step 5/6: Installing the Sentinel ---"
sudo pacman -Syu --noconfirm kaelic-hardware-scryer
`;

const STEP_6_INVOKE = `sudo khs`;

const steps = [
    { num: 1, title: "Prepare Forge", script: STEP_1_PREPARE_FORGE, description: "Creates a clean workspace for the artifact." },
    { num: 2, title: "Scribe Soul", script: STEP_2_SCRIBE_SOUL, description: "Summons the Sentinel's perfected soul (khs.sh) directly from its canonical GitHub source." },
    { num: 3, title: "Scribe Blueprint", script: STEP_3_SCRIBE_BLUEPRINT, description: "Scribes the PKGBUILD and install script into the forge." },
    { num: 4, title: "Forge & Publish", script: STEP_4_FORGE_PUBLISH, description: "Invokes the 'grand-concordance' familiar to build the artifact and publish it to all Athenaeums." },
    { num: 5, title: "Install Sentinel", script: STEP_5_INSTALL_PACKAGE, description: "Summons pacman to install the newly published artifact from your repository." },
    { num: 6, title: "Invoke Sentinel", script: STEP_6_INVOKE, description: "Runs the 'khs' command to begin governing the Realm." },
];

export const KaelicHardwareScryerModal: React.FC<KaelicHardwareScryerModalProps> = ({ onClose }) => {
    const [activeStep, setActiveStep] = useState(1);
    
    const activeStepData = steps.find(s => s.num === activeStep);
    // The Shell-Agnostic Pact: use a robust here-document to guarantee execution under bash.
    const finalCommand = activeStepData ? `bash <<'EOF'\n${activeStepData.script}\nEOF` : "";

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in-fast" onClick={onClose}>
            <div className="bg-forge-panel border-2 border-forge-border rounded-lg shadow-2xl w-full max-w-4xl p-6 m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center mb-4 flex-shrink-0">
                     <h2 className="text-xl font-bold text-forge-text-primary flex items-center gap-2 font-display tracking-wider">
                        <CpuChipIcon className="w-5 h-5 text-dragon-fire" />
                        <span>Forge Driver Sentinel v0.083 (The Canonical Summoning)</span>
                    </h2>
                    <button onClick={onClose} className="text-forge-text-secondary hover:text-forge-text-primary">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </header>
                
                <div className="flex gap-1 border-b-2 border-forge-border mb-4 flex-wrap">
                    {steps.map(step => (
                        <button 
                            key={step.num}
                            onClick={() => setActiveStep(step.num)}
                            className={`px-3 py-2 text-sm font-semibold transition-colors border-b-4 ${activeStep === step.num ? 'border-dragon-fire text-dragon-fire' : 'border-transparent text-forge-text-secondary hover:text-forge-text-primary'}`}
                        >
                            Step {step.num}: {step.title}
                        </button>
                    ))}
                </div>

                <div className="overflow-y-auto pr-2 text-forge-text-secondary leading-relaxed space-y-4">
                    {activeStepData && (
                        <div className="animate-fade-in">
                            <p className="text-sm p-3 bg-orc-steel/10 border-l-4 border-orc-steel rounded">
                                <strong className="text-orc-steel">Step {activeStepData.num}: {activeStepData.title}</strong><br/>
                                {activeStepData.description}
                            </p>
                            <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">Incantation for Step {activeStepData.num}</h3>
                            <CodeBlock lang="bash">{finalCommand}</CodeBlock>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
