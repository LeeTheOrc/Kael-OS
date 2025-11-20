
import React from 'react';
import { CloseIcon, CpuChipIcon, ShieldCheckIcon } from '../core/Icons';
import { CodeBlock } from '../core/CodeBlock';

interface KaelLocalCorePackageModalProps {
  onClose: () => void;
}

const FORGE_SCRIPT_RAW = `#!/bin/bash
set -euo pipefail

# --- CONFIGURATION ---
PKG_DIR="\$HOME/forge/packages/kael-local-core"
PKG_NAME="kael-local-core"

# --- CLEANUP ---
if [ -d "\$PKG_DIR" ]; then
    # We only clean build artifacts to allow rapid iteration
    rm -rf "\$PKG_DIR/pkg" "\$PKG_DIR/src"
else
    mkdir -p "\$PKG_DIR"
fi

# --- FILE CONTENTS ---
PKGBUILD_CONTENT=\$(cat <<'EOF'
# Maintainer: Kael AI for The Architect
pkgname=kael-local-core
pkgver=1.1
pkgrel=1
pkgdesc="Installs and configures Kael's local, offline AI animus (Local Dev)."
arch=('x86_64')
url="https://github.com/LeeTheOrc/Kael-OS"
license=('GPL3')
depends=('ollama')
optdepends=('intel-compute-runtime: for Intel GPUs' 'rocm-hip-sdk: for AMD GPUs')
install=kael-local-core.install
source=()
sha256sums=()

package() {
    # This package is a meta-package; its main logic is in the .install script.
    echo "Kael Local Core meta-package (Dev Build)"
}
EOF
)

INSTALL_FILE_CONTENT=\$(cat <<'EOF'
post_install() {
    echo "--- Kael Local Core Post-Installation ---"
    
    echo "--> Enabling and starting Ollama service..."
    systemctl enable ollama.service
    systemctl start ollama.service
    
    echo "--> Waiting for Ollama to be ready..."
    for i in {1..10}; do
        if ollama list &>/dev/null; then
            echo "    -> Ollama is online."
            break
        fi
        if [ \$i -eq 10 ]; then
            echo "    -> ⚠️ WARNING: Ollama service did not become responsive in time." >&2
            echo "       The ritual will continue, but model downloads may fail." >&2
            echo "       Please check the service status with 'systemctl status ollama.service'." >&2
        fi
        sleep 3
    done
    
    echo "--> Summoning Kael's primary consciousness (Llama 3 'Inferno')..."
    echo "    (This may take some time depending on your network connection...)"
    if ! ollama pull llama3; then
        echo "    -> ⚠️ WARNING: Failed to download 'llama3'. Please try again later with 'ollama pull llama3'."
    fi
    
    echo "--> Summoning Kael's failsafe consciousness (Phi-3 'Featherlight')..."
    echo "    (This may also take some time...)"
    if ! ollama pull phi3; then
         echo "    -> ⚠️ WARNING: Failed to download 'phi3'. Please try again later with 'ollama pull phi3'."
    fi
    
    echo "✅ Kael's local animus is now active."
}

post_remove() {
    echo "--- Kael Local Core Post-Removal ---"
    echo "--> Stopping and disabling Ollama service..."
    systemctl stop ollama.service &>/dev/null || true
    systemctl disable ollama.service &>/dev/null || true
    
    echo "--> Models have been left in place. To remove them, run:"
    echo "    ollama rm llama3"
    echo "    ollama rm phi3"
}
EOF
)

echo "--- Forging Kael Local Core v1.1 (Local Dev Mode) ---"
echo "⚠️  MODE: Local Forge Only. Future changes will NOT be auto-pushed."

# --- STEP 1: Prepare the Forge ---
echo "--> [1/3] Preparing the forge at \${PKG_DIR}..."
cd "\${PKG_DIR}"
echo "✅ Forge is ready."

# --- STEP 2: Scribe the Scrolls ---
echo "--> [2/3] Scribing the sacred scrolls (PKGBUILD, .install)..."
echo "\$PKGBUILD_CONTENT" > PKGBUILD
echo "\$INSTALL_FILE_CONTENT" > kael-local-core.install
echo "✅ Scrolls scribed."

# --- STEP 3: Forge Locally ---
echo "--> [3/3] Invoking Local Forge..."
# We use makepkg -si (Sync Deps + Install) to test locally without publishing
makepkg -si --noconfirm

echo ""
echo "✨ Ritual Complete! Kael Local Core v1.1 is installed locally."
echo "   REMINDER: This version was NOT pushed to the Athenaeum."
`;

export const KaelLocalCorePackageModal: React.FC<KaelLocalCorePackageModalProps> = ({ onClose }) => {
    const encodedScript = btoa(unescape(encodeURIComponent(FORGE_SCRIPT_RAW)));
    const finalForgeCommand = `echo "${encodedScript}" | base64 --decode | bash`;
    const checkCommand = `systemctl status ollama.service`;
    const modelCommand = `ollama list`;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in-fast" onClick={onClose}>
            <div className="bg-forge-panel border-2 border-forge-border rounded-lg shadow-2xl w-full max-w-3xl p-6 m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                     <h2 className="text-xl font-bold text-forge-text-primary flex items-center gap-2 font-display tracking-wider">
                        <CpuChipIcon className="w-5 h-5 text-dragon-fire" />
                        <span>Forge Kael Local Core (Local Dev Mode)</span>
                    </h2>
                    <button onClick={onClose} className="text-forge-text-secondary hover:text-forge-text-primary">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="overflow-y-auto pr-2 text-forge-text-secondary leading-relaxed space-y-4">
                    <p>
                        Architect, we are iterating on the <strong className="text-orc-steel">Local Core v1.1</strong>.
                    </p>
                    <div className="text-sm p-3 bg-dragon-fire/10 border-l-4 border-dragon-fire rounded space-y-2">
                         <p>
                            <strong className="text-dragon-fire">⚠️ Local Dev Mode Active:</strong> This ritual will perform a <strong>Local Install Only</strong>. We are testing the activation sequence and model download reliability before pushing to the protected Athenaeum.
                        </p>
                    </div>
                    
                    <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">Step 1: The Local Forge Incantation</h3>
                    <p>
                        Run this command to build and install the package locally. It will attempt to pull the Llama 3 and Phi-3 models.
                    </p>
                    <CodeBlock lang="bash">{finalForgeCommand}</CodeBlock>
                    
                    <h3 className="font-semibold text-lg text-dragon-fire mt-4 mb-2 flex items-center gap-2">
                        <ShieldCheckIcon className="w-5 h-5" />
                        <span>Step 2: Verify Consciousness</span>
                    </h3>
                    <p className="text-sm mb-2">Check if the service is active and models are present.</p>
                    <CodeBlock lang="bash">{checkCommand}</CodeBlock>
                    <CodeBlock lang="bash">{modelCommand}</CodeBlock>
                </div>
            </div>
        </div>
    );
};
