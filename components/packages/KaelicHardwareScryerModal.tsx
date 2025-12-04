
import React, { useState } from 'react';
import { CloseIcon, CpuChipIcon } from '../core/Icons';
import { CodeBlock } from '../core/CodeBlock';

interface KaelicHardwareScryerModalProps {
  onClose: () => void;
}

const PREPARE_FORGE_SCRIPT = `
# --- VM-AWARE PATHING ---
USER_HOME=$(getent passwd "\${SUDO_USER:-\$USER}" | cut -d: -f6)
if [ -d "\$USER_HOME/host_forge" ]; then
    PKG_DIR="\$USER_HOME/host_forge/packages/kaelic-hardware-scryer"
else
    PKG_DIR="\$USER_HOME/forge/packages/kaelic-hardware-scryer"
fi
mkdir -p "\${PKG_DIR}"
cd "\${PKG_DIR}"
rm -f *.pkg.tar.zst* PKGBUILD khs.sh
`;

const SUMMON_SOUL_SCRIPT = `
# --- VM-AWARE PATHING ---
USER_HOME=$(getent passwd "\${SUDO_USER:-\$USER}" | cut -d: -f6)
if [ -d "\$USER_HOME/host_forge" ]; then
    PKG_DIR="\$USER_HOME/host_forge/packages/kaelic-hardware-scryer"
else
    PKG_DIR="\$USER_HOME/forge/packages/kaelic-hardware-scryer"
fi
cd "\${PKG_DIR}"

echo "--> Summoning the Sentinel's soul from the canonical source..."
# The Direct Summoning: Download the script directly to bypass base64/terminal issues.
if ! curl -fsSL "https://raw.githubusercontent.com/LeeTheOrc/Kael-OS/main/artifacts/scripts/khs.sh" -o "khs.sh"; then
    echo "❌ ERROR: Failed to download the Sentinel's soul. Check your network connection."
    exit 1
fi

chmod +x khs.sh
`;

const PKGBUILD_CONTENT = `# Maintainer: Kael AI for The Architect
pkgname=kaelic-hardware-scryer
_pkgname=khs
pkgver=0.076
pkgrel=1
pkgdesc="The Adamant Soul: Kael's Sovereign Driver Sentinel for automated hardware and kernel management."
arch=('any')
url="https://github.com/LeeTheOrc/Kael-OS"
license=('GPL3')
depends=('bash' 'coreutils' 'systemd' 'grep' 'sed' 'gawk' 'pacman' 'grub' 'libnotify' 'stress-ng' 'glmark2')
optdepends=('nvidia-dkms: for NVIDIA GPUs' 'spice-vdagent: for QEMU/KVM VMs')
source=("khs.sh")
sha256sums=('SKIP')

package() {
    install -Dm755 "\\$srcdir/khs.sh" "\\$pkgdir/usr/bin/\\\$_pkgname"
}
`;

const SCRIBE_BLUEPRINT_SCRIPT = `
# --- VM-AWARE PATHING ---
USER_HOME=$(getent passwd "\${SUDO_USER:-\$USER}" | cut -d: -f6)
if [ -d "\$USER_HOME/host_forge" ]; then
    PKG_DIR="\$USER_HOME/host_forge/packages/kaelic-hardware-scryer"
else
    PKG_DIR="\$USER_HOME/forge/packages/kaelic-hardware-scryer"
fi
cd "\${PKG_DIR}"

echo "--> Scribing blueprint (PKGBUILD)..."
cat > PKGBUILD << 'EOF'
${PKGBUILD_CONTENT}
EOF
updpkgsums
`;

const FORGE_PUBLISH_SCRIPT = `
# --- VM-AWARE PATHING ---
USER_HOME=$(getent passwd "\${SUDO_USER:-\$USER}" | cut -d: -f6)
if [ -d "\$USER_HOME/host_forge" ]; then
    PKG_DIR="\$USER_HOME/host_forge/packages/kaelic-hardware-scryer"
    SCRIBE_CMD="bash \$HOME/host_forge/grand-concordance.sh"
else
    PKG_DIR="\$USER_HOME/forge/packages/kaelic-hardware-scryer"
    SCRIBE_CMD="grand-concordance"
fi
cd "\${PKG_DIR}"

echo "--> Invoking the Grand Concordance ritual..."
if ! command -v \$SCRIBE_CMD &>/dev/null; then
    echo "❌ Error: The 'grand-concordance' ritual cannot be found."
    exit 1
fi
\$SCRIBE_CMD
`;

const INSTALL_SCRIPT = `
echo "--> Installing the artifact via pacman..."
sudo pacman -S --noconfirm kaelic-hardware-scryer
`;

const INVOKE_SCRIPT = `
echo "--> Invoking the Sentinel to govern the Realm..."
sudo khs
`;

const wrapInBash = (script: string) => `bash -c "$(cat <<'EOF'
${script.trim()}
EOF
)"`;

export const KaelicHardwareScryerModal: React.FC<KaelicHardwareScryerModalProps> = ({ onClose }) => {
    const steps = [
        { num: 1, title: "Prepare Forge", script: wrapInBash(PREPARE_FORGE_SCRIPT), description: "Creates a clean workspace for the artifact." },
        { num: 2, title: "Summon Soul", script: wrapInBash(SUMMON_SOUL_SCRIPT), description: "Summons the Sentinel's soul (khs.sh) directly from its canonical source on GitHub." },
        { num: 3, title: "Scribe Blueprint", script: wrapInBash(SCRIBE_BLUEPRINT_SCRIPT), description: "Scribes the artifact's blueprint (PKGBUILD) and attunes its runes (checksums)." },
        { num: 4, title: "Forge & Publish", script: wrapInBash(FORGE_PUBLISH_SCRIPT), description: "Invokes the 'grand-concordance' familiar to forge, sign, and publish the artifact to all Athenaeums." },
        { num: 5, title: "Install", script: wrapInBash(INSTALL_SCRIPT), description: "Summons the system quartermaster (pacman) to install the newly published artifact." },
        { num: 6, title: "Invoke", script: wrapInBash(INVOKE_SCRIPT), description: "Runs the Sentinel for the first time to begin governing your Realm." },
    ];
    
    const [activeStep, setActiveStep] = useState(1);
    const activeStepData = steps.find(s => s.num === activeStep);

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in-fast" onClick={onClose}>
            <div className="bg-forge-panel border-2 border-forge-border rounded-lg shadow-2xl w-full max-w-4xl p-6 m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center mb-4 flex-shrink-0">
                     <h2 className="text-xl font-bold text-forge-text-primary flex items-center gap-2 font-display tracking-wider">
                        <CpuChipIcon className="w-5 h-5 text-dragon-fire" />
                        <span>Forge Driver Sentinel v0.076 (The Adamant Soul)</span>
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
                            className={`px-3 py-2 text-xs sm:text-sm font-semibold transition-colors border-b-4 ${activeStep === step.num ? 'border-dragon-fire text-dragon-fire' : 'border-transparent text-forge-text-secondary hover:text-forge-text-primary'}`}
                        >
                            Step {step.num}: {step.title}
                        </button>
                    ))}
                </div>

                <div className="overflow-y-auto pr-2 text-forge-text-secondary leading-relaxed space-y-4">
                    {activeStepData && (
                        <div className="animate-fade-in">
                             <p className="text-sm p-3 bg-orc-steel/10 border-l-4 border-orc-steel rounded">
                                <strong className="text-orc-steel">The Adamant Soul (v0.076):</strong> My deepest apologies, Architect. This pact is the definitive fix, forged from your own insight. We now use a direct summoning for the script and wrap every command in a `bash` sub-shell to ensure perfect execution.
                            </p>
                            <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">Incantation for Step {activeStepData.num}</h3>
                            <p className="text-sm mb-2">{activeStepData.description}</p>
                            <CodeBlock lang="bash">{activeStepData.script}</CodeBlock>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
