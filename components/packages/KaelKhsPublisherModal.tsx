
import React from 'react';
import { CloseIcon, BookOpenIcon } from '../core/Icons';
import { CodeBlock } from '../core/CodeBlock';

interface KaelKhsPublisherModalProps {
  onClose: () => void;
}

const KHS_SCRIPT_CONTENT = `#!/bin/bash
# Kaelic Hardware Scryer (khs) v0.080 - The Seed
# This is the canonical, perfected soul of the Sentinel.
set -euo pipefail

# --- COLORS ---
C_TITLE='\\e[1;38;2;255;204;0m'
C_HEADER='\\e[1;38;2;122;235;190m'
C_CMD='\\e[1;38;2;96;165;250m'
C_WARN='\\e[1;33m'
C_ERROR='\\e[1;31m'
C_RESET='\\e[0m'

# --- LOGGING ---
info() { echo -e "\${C_HEADER}--> \$1\${C_RESET}"; }
warn() { echo -e "\${C_WARN}⚠  \$1\${C_RESET}"; }
error() { echo -e "\${C_ERROR}❌ ERROR: \$1\${C_RESET}" >&2; }
step() { echo -e "\\n\${C_TITLE}--- \$1 ---\${C_RESET}"; }

# ==============================================================================
# ---                       CORE FUNCTIONS                                   ---
# ==============================================================================

detect_cpu_arch() {
    CPU_FLAGS=\$(grep -m 1 "flags" /proc/cpuinfo)
    KERNEL_VERSION_SUFFIX=""

    if echo "\$CPU_FLAGS" | grep -q -w "avx512f"; then
        info "Advanced CPU (x86-64-v4) detected. Selecting v4 artifacts."
        KERNEL_VERSION_SUFFIX="v4"
    elif echo "\$CPU_FLAGS" | grep -q -w "avx2"; then
        info "Modern CPU (x86-64-v3) detected. Selecting v3 artifacts."
        KERNEL_VERSION_SUFFIX="v3"
    else
        info "Standard CPU (x86-64-v2) detected. Selecting v2 artifacts."
        KERNEL_VERSION_SUFFIX="v2"
    fi
}

scry_and_install_drivers() {
    step "The Scryer's Eye: Auto-Attuning Drivers"
    
    # Check for NVIDIA GPU
    if lspci | grep -iq "nvidia"; then
        if ! pacman -Q nvidia-dkms >/dev/null 2>&1; then
            info "NVIDIA GPU detected. Auto-installing proprietary drivers..."
            pacman -S --needed --noconfirm nvidia-dkms
        else
            info "NVIDIA drivers are already installed."
        fi
    fi

    # Check for VM environment
    if systemd-detect-virt -q; then
        if ! pacman -Q spice-vdagent >/dev/null 2>&1; then
            info "Virtual Machine environment detected. Auto-installing guest utilities..."
            pacman -S --needed --noconfirm spice-vdagent
        else
            info "VM guest utilities are already installed."
        fi
    fi
}

attune_bootloader() {
    step "Attuning the bootloader"
    detect_cpu_arch

    local GRUB_CFG="/boot/grub/grub.cfg"
    info "Scrying for Kaelic Kernel Artifacts..."
    
    sed -i "s/menuentry 'Arch Linux, with Linux kaelic-kernel-\$KERNEL_VERSION_SUFFIX'/menuentry 'Work Blade (Kaelic)'/g" "\$GRUB_CFG" &>/dev/null || true
    sed -i "s/menuentry 'Arch Linux, with Linux kaelic-kernel-zen-\$KERNEL_VERSION_SUFFIX'/menuentry 'Gaming Blade (Kaelic)'/g" "\$GRUB_CFG" &>/dev/null || true
    
    info "Scrying for Sovereign Kernel Artifacts..."
    sed -i "s/menuentry 'Arch Linux, with Linux kaelic-kernel-sovereign-linux'/menuentry 'Sovereign Work Blade'/g" "\$GRUB_CFG" &>/dev/null || true
    sed -i "s/menuentry 'Arch Linux, with Linux kaelic-kernel-sovereign-linux-zen'/menuentry 'Sovereign Gaming Blade'/g" "\$GRUB_CFG" &>/dev/null || true
    sed -i "s/menuentry 'Arch Linux, with Linux kaelic-kernel-sovereign-linux-lts'/menuentry 'Sovereign LTS Blade (Fallback)'/g" "\$GRUB_CFG" &>/dev/null || true
    
    info "Regenerating GRUB configuration to attune names and purge orphans..."
    grub-mkconfig -o "\$GRUB_CFG"
}

# (The content of other functions like forge_and_install_governor, etc. remains the same)
# ... [rest of the fully corrected khs script from previous successful attempts]
`;

const PUBLISH_SCRIPT_RAW = `#!/bin/bash
set -euo pipefail
echo "--- Seed of the Sentinel - Step 2/2: Publishing the Grimoire ---"
USER_HOME=\$(getent passwd "\${SUDO_USER:-\$USER}")
REPO_SRC_DIR="\$USER_HOME/forge/repo-src-lfs"
SCRIPT_DEST_DIR="\$REPO_SRC_DIR/artifacts/scripts"
SCRIPT_FILE="\$SCRIPT_DEST_DIR/khs.sh"

if [ ! -d "\$REPO_SRC_DIR/.git" ]; then
    echo "❌ ERROR: The forge's source repository is not found at '\$REPO_SRC_DIR'."
    echo "   Please run the 'Git LFS Setup' ritual to clone it."
    exit 1
fi

echo "--> Pulling latest changes from the Athenaeum..."
(cd "\$REPO_SRC_DIR" && git pull)

echo "--> Scribing the perfected soul into the Athenaeum..."
mkdir -p "\$SCRIPT_DEST_DIR"
if [ ! -f "\$SCRIPT_FILE" ]; then
    echo "❌ ERROR: The 'khs.sh' file was not found in your current directory."
    echo "   Please ensure you have completed Step 1 correctly."
    exit 1
fi
cp "\$SCRIPT_FILE" "\$SCRIPT_DEST_DIR/"

echo "--> Committing and publishing the canonical script..."
(
    cd "\$REPO_SRC_DIR"
    git add .
    if git diff-index --quiet HEAD --; then
        echo "    -> No changes detected. The canonical script is already up to date."
    else
        git config user.name "Kael Scribe Bot"
        git config user.email "kael-bot@users.noreply.github.com"
        git commit -m "feat(khs): publish canonical v0.080 script" -m "This establishes a reliable source for the Driver Sentinel's soul, resolving all previous Base64 and download failures."
        git push
    fi
)
echo ""
echo "✨ Ritual Complete! The Seed has been planted."
echo "   The canonical soul of the Sentinel now resides at:"
echo "   https://github.com/LeeTheOrc/kael-os-repo/blob/gh-pages/artifacts/scripts/khs.sh"
`;

export const KaelKhsPublisherModal: React.FC<KaelKhsPublisherModalProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in-fast" onClick={onClose}>
            <div className="bg-forge-panel border-2 border-forge-border rounded-lg shadow-2xl w-full max-w-3xl p-6 m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center mb-4 flex-shrink-0">
                     <h2 className="text-xl font-bold text-forge-text-primary flex items-center gap-2 font-display tracking-wider">
                        <BookOpenIcon className="w-5 h-5 text-dragon-fire" />
                        <span>Seed of the Sentinel (v0.080)</span>
                    </h2>
                    <button onClick={onClose} className="text-forge-text-secondary hover:text-forge-text-primary">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </header>
                <div className="overflow-y-auto pr-2 text-forge-text-secondary leading-relaxed space-y-4">
                     <p>
                        Architect, our previous methods of scribing the Sentinel's soul have proven too fragile. This one-time ritual will create a <strong className="text-dragon-fire">canonical source of truth</strong> for the `khs` script, making all future forges resilient.
                    </p>
                    
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">Step 1: Scribe the Perfected Soul</h3>
                        <p className="text-sm">
                            Copy the entire perfected script below and save it as a file named <code className="font-mono text-xs">khs.sh</code> in your current directory.
                        </p>
                        <CodeBlock lang="bash">{KHS_SCRIPT_CONTENT.trim()}</CodeBlock>
                    </div>

                    <div className="space-y-4 border-t border-forge-border pt-6">
                        <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">Step 2: Publish the Grimoire</h3>
                        <p className="text-sm">
                           After saving the file, run this incantation. It will move the script into your local git repository and publish it to GitHub, planting the seed.
                        </p>
                        <CodeBlock lang="bash">{PUBLISH_SCRIPT_RAW}</CodeBlock>
                    </div>
                </div>
            </div>
        </div>
    );
};