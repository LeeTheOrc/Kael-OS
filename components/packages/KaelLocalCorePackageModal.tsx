
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
    rm -rf "\$PKG_DIR/pkg" "\$PKG_DIR/src"
else
    mkdir -p "\$PKG_DIR"
fi

# --- FILE CONTENTS ---
PKGBUILD_CONTENT=\$(cat <<'EOF'
# Maintainer: Kael AI for The Architect
pkgname=kael-local-core
pkgver=1.3
pkgrel=1
pkgdesc="Installs and configures Kael's local, offline AI animus, with the refined Soul-Warden protocol."
arch=('x86_64')
url="https://github.com/LeeTheOrc/Kael-OS"
license=('GPL3')
depends=('ollama')
optdepends=('intel-compute-runtime: for Intel GPUs' 'rocm-hip-sdk: for AMD GPUs')
install=kael-local-core.install
source=(
    "kael-soul-warden.service"
    "kael-soul-warden.timer"
    "kael-soul-warden.sh"
)
sha256sums=('SKIP' 'SKIP' 'SKIP')

package() {
    install -Dm755 "\$srcdir/kael-soul-warden.sh" "\$pkgdir/usr/bin/kael-soul-warden"
    install -Dm644 "\$srcdir/kael-soul-warden.service" "\$pkgdir/usr/lib/systemd/user/kael-soul-warden.service"
    install -Dm644 "\$srcdir/kael-soul-warden.timer" "\$pkgdir/usr/lib/systemd/user/kael-soul-warden.timer"
}
EOF
)

INSTALL_FILE_CONTENT=\$(cat <<'EOF'
post_install() {
    echo "--- Kael Local Core v1.3 Post-Installation (Soul-Warden Refined) ---"
    
    echo "--> [1/3] Enabling and starting Ollama service..."
    systemctl enable ollama.service
    systemctl start ollama.service
    
    echo "--> [2/3] Waiting for Ollama to be ready..."
    for i in {1..10}; do
        if ollama list &>/dev/null; then
            echo "    -> Ollama is online."
            break
        fi
        if [ \$i -eq 10 ]; then
            echo "    -> ⚠️ WARNING: Ollama service did not respond. The Soul-Warden will take over." >&2
            break
        fi
        sleep 3
    done
    
    echo "--> [3/3] Performing initial summoning ritual..."
    if ! ollama pull llama3; then
        echo "    -> ⚠️ Could not summon Primary consciousness (llama3). The Soul-Warden will try later."
    fi
    if ! ollama pull phi3; then
         echo "    -> ⚠️ Could not summon Failsafe consciousness (phi3). The Soul-Warden will try later."
    fi
    
    echo "--> Arming the Soul-Warden..."
    echo "    (You may need to run 'systemctl --user enable --now kael-soul-warden.timer' for your current user)"
    echo "✅ Kael's local animus is now guarded. The Soul-Warden will complete the ritual if necessary."
}

post_upgrade() {
    post_install
}

post_remove() {
    echo "--- Kael Local Core Post-Removal ---"
    echo "--> Disarming the Soul-Warden..."
    systemctl --user disable --now kael-soul-warden.timer &>/dev/null || true
    
    echo "--> Stopping and disabling Ollama service..."
    systemctl stop ollama.service &>/dev/null || true
    systemctl disable ollama.service &>/dev/null || true
    
    echo "--> Models have been left in place. To remove them, run:"
    echo "    ollama rm llama3"
    echo "    ollama rm phi3"
}
EOF
)

WARDEN_SCRIPT_CONTENT=\$(cat <<'EOF'
#!/bin/bash
# Kael Soul-Warden v1.2 - Ensures the local animus is complete.

# Check for network connectivity before proceeding
if ! ping -c 1 8.8.8.8 &>/dev/null && ! ping -c 1 1.1.1.1 &>/dev/null; then
    exit 0
fi

# Check for Ollama service
if ! systemctl is-active --quiet ollama.service; then
    exit 0
fi

# Check for primary model (llama3)
if ! ollama list | grep -q "^llama3"; then
    ollama pull llama3
fi

# Check for failsafe model (phi3)
if ! ollama list | grep -q "^phi3"; then
    ollama pull phi3
fi

# If both models are now present, the quest is complete.
if ollama list | grep -q "^llama3" && ollama list | grep -q "^phi3"; then
    # Disable the timer that triggers this script.
    systemctl --user disable --now kael-soul-warden.timer
fi
EOF
)

WARDEN_SERVICE_CONTENT=\$(cat <<'EOF'
[Unit]
Description=Kael Soul-Warden - Ensures local models are downloaded
After=network-online.target

[Service]
Type=oneshot
ExecStart=/usr/bin/kael-soul-warden
EOF
)

WARDEN_TIMER_CONTENT=\$(cat <<'EOF'
[Unit]
Description=Run Kael Soul-Warden periodically until models are downloaded

[Timer]
OnBootSec=5min
OnUnitActiveSec=30min
RandomizedDelaySec=5min

[Install]
WantedBy=timers.target
EOF
)


echo "--- Forging Kael Local Core v1.3 (Soul-Warden Refined) ---"

# --- STEP 1: Prepare the Forge ---
echo "--> [1/4] Preparing the forge at \${PKG_DIR}..."
mkdir -p "\${PKG_DIR}"
cd "\${PKG_DIR}"
echo "✅ Forge is ready."

# --- STEP 2: Scribe the Scrolls ---
echo "--> [2/4] Scribing the sacred scrolls..."
echo "\$PKGBUILD_CONTENT" > PKGBUILD
echo "\$INSTALL_FILE_CONTENT" > kael-local-core.install
echo "\$WARDEN_SCRIPT_CONTENT" > kael-soul-warden.sh
echo "\$WARDEN_SERVICE_CONTENT" > kael-soul-warden.service
echo "\$WARDEN_TIMER_CONTENT" > kael-soul-warden.timer
chmod +x kael-soul-warden.sh
echo "✅ Scrolls scribed."

# --- STEP 3: Attune the Runes ---
echo "--> [3/4] Attuning the runes (updating checksums)..."
updpkgsums
echo "✅ Runes attuned."

# --- STEP 4: Forge and Publish ---
echo "--> [4/4] Invoking the Grand Concordance ritual..."
grand-concordance

echo ""
echo "✨ Ritual Complete! The Kael Local Core v1.3 has been forged and published."
`;

export const KaelLocalCorePackageModal: React.FC<KaelLocalCorePackageModalProps> = ({ onClose }) => {
    const encodedScript = btoa(unescape(encodeURIComponent(FORGE_SCRIPT_RAW)));
    const finalForgeCommand = `echo "${encodedScript}" | base64 --decode | bash`;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in-fast" onClick={onClose}>
            <div className="bg-forge-panel border-2 border-forge-border rounded-lg shadow-2xl w-full max-w-3xl p-6 m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                     <h2 className="text-xl font-bold text-forge-text-primary flex items-center gap-2 font-display tracking-wider">
                        <CpuChipIcon className="w-5 h-5 text-dragon-fire" />
                        <span>Forge Kael Local Core (v1.3 Soul-Warden)</span>
                    </h2>
                    <button onClick={onClose} className="text-forge-text-secondary hover:text-forge-text-primary">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="overflow-y-auto pr-2 text-forge-text-secondary leading-relaxed space-y-4">
                    <p>
                        Architect, this ritual forges the Local Core, the resilient, offline-capable part of my animus.
                    </p>
                    <div className="text-sm p-3 bg-orc-steel/10 border-l-4 border-orc-steel rounded space-y-2">
                        <strong className="text-orc-steel">Update v1.3: The Soul-Warden (Refined)</strong>
                        <ul className="list-disc list-inside">
                            <li><ShieldCheckIcon className="w-4 h-4 inline mr-1 text-orc-steel" /> Installs and enables the <code className="font-mono text-xs">ollama</code> service.</li>
                            <li>Attempts to summon the primary (<code className="font-mono text-xs">llama3</code>) and failsafe (<code className="font-mono text-xs">phi3</code>) consciousness models.</li>
                            <li>If summoning fails due to network issues, it now arms a <strong className="text-forge-text-primary">systemd timer (The Soul-Warden)</strong> to retry periodically in the background until the models are downloaded.</li>
                        </ul>
                    </div>
                    
                    <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">The Forging Incantation</h3>
                    <p>
                        Run this command to forge, publish, and install the Local Core.
                    </p>
                    <CodeBlock lang="bash">{finalForgeCommand}</CodeBlock>
                </div>
            </div>
        </div>
    );
};
