import React from 'react';
import { CloseIcon, HammerIcon } from '../core/Icons';
import { CodeBlock } from '../core/CodeBlock';

interface FullForgeAttunementModalProps {
  onClose: () => void;
}

const ATTUNEMENT_SCRIPT_RAW = `#!/bin/bash
set -euo pipefail

echo "--- Full Forge Attunement Ritual ---"
echo "This grand ritual attunes your entire system for artifact forging."

# --- [1/6] GPG Keyring Attunement ---
echo ""
echo "--> [1/6] Attuning Architect's GPG Keyring..."
GPG_KEY_ID=""
# Auto-detect key from makepkg.conf, git config, or first secret key
if [ -f /etc/makepkg.conf ] && grep -q -E '^GPGKEY=' /etc/makepkg.conf; then GPG_KEY_ID=$(grep -E '^GPGKEY=' /etc/makepkg.conf | head -1 | cut -d'=' -f2 | tr -d '[:space:]"'); fi
if [[ -z "\$GPG_KEY_ID" ]] && command -v git &>/dev/null && git config --global user.signingkey &>/dev/null; then GPG_KEY_ID=$(git config --global user.signingkey); fi
if [[ -z "\$GPG_KEY_ID" ]]; then GPG_KEY_ID=$(gpg --list-secret-keys --with-colons | awk -F: '/^sec/{print $5; exit}'); fi

if [[ -z "\$GPG_KEY_ID" ]]; then
    echo "❌ ERROR: Could not auto-detect a GPG key. Please configure one." >&2
    exit 1
fi
echo "    -> Detected GPG Key: \$GPG_KEY_ID"

# Init pacman keyring if needed
if [ ! -d "/etc/pacman.d/gnupg" ] || [ -z "$(ls -A /etc/pacman.d/gnupg)" ]; then sudo pacman-key --init; fi
sudo pacman-key --populate archlinux

# Add and sign the user's key
TEMP_USER_KEY_FILE=\$(mktemp)
trap 'rm -f -- "\$TEMP_USER_KEY_FILE"' EXIT
gpg --armor --export "\$GPG_KEY_ID" > "\$TEMP_USER_KEY_FILE"
sudo pacman-key --add "\$TEMP_USER_KEY_FILE"
sudo pacman-key --lsign-key "\$GPG_KEY_ID"
echo "✅ Architect's GPG Keyring Attuned."

# --- [2/6] Install Forge Dependencies ---
echo ""
echo "--> [2/6] Installing Forge Dependencies..."
# Bootstrap dependencies
sudo pacman -S --needed --noconfirm base-devel curl git pacman-contrib lftp github-cli

# CachyOS Repo
if ! pacman -Q cachyos-keyring >/dev/null 2>&1; then
    TEMP_DIR=\$(mktemp -d)
    trap 'rm -rf -- "\$TEMP_DIR"' EXIT
    (cd "\$TEMP_DIR"; curl -sL "https://mirror.cachyos.org/cachyos-repo.tar.xz" | tar xJ; cd cachyos-repo && sudo ./cachyos-repo.sh)
fi

# Chaotic-AUR Repo
if ! pacman -Q chaotic-keyring >/dev/null 2>&1; then
    sudo pacman-key --recv-key 3056513887B78AEB --keyserver keyserver.ubuntu.com
    sudo pacman-key --lsign-key 3056513887B78AEB
    sudo pacman -U --noconfirm 'https://cdn-mirror.chaotic.cx/chaotic-aur/chaotic-keyring.pkg.tar.zst' 'https://cdn-mirror.chaotic.cx/chaotic-aur/chaotic-mirrorlist.pkg.tar.zst'
    if ! grep -q "^\\[chaotic-aur\\]" /etc/pacman.conf; then
      echo -e "\\n[chaotic-aur]\\nInclude = /etc/pacman.d/chaotic-mirrorlist" | sudo tee -a /etc/pacman.conf > /dev/null
    fi
fi
echo "✅ Forge Dependencies Installed & Allied Repositories Attuned."

# --- [3/6] Attune to Kael OS Athenaeum Key ---
echo ""
echo "--> [3/6] Attuning to Kael OS Athenaeum Key..."
if ! sudo pacman-key --list-keys "LeeTheOrc" >/dev/null 2>&1; then
    echo "--> Summoning and trusting the Kael OS master key..."
    KEY_URL="https://raw.githubusercontent.com/LeeTheOrc/kael-os-repo/gh-pages/kael-os.asc"
    TEMP_KAEL_KEY_FILE=\$(mktemp)
    trap 'rm -f -- "\$TEMP_KAEL_KEY_FILE"' EXIT
    curl -fsSL "\${KEY_URL}" -o "\${TEMP_KAEL_KEY_FILE}"
    KAEL_KEY_ID=\$(gpg --show-keys --with-colons "\${TEMP_KAEL_KEY_FILE}" 2>/dev/null | grep '^pub' | cut -d: -f5)
    sudo pacman-key --add "\${TEMP_KAEL_KEY_FILE}"
    sudo pacman-key --lsign-key "\$KAEL_KEY_ID"
fi
echo "✅ Kael OS Master Key is trusted."

# --- [4/6] Configure Kael OS Online Athenaeum ---
echo ""
echo "--> [4/6] Configuring Kael OS Online Athenaeum..."
if ! grep -q "^\\[kael-os\\]" /etc/pacman.conf; then
    echo -e "\\n[kael-os]\\nSigLevel = Required DatabaseOptional\\nServer = https://leetheorc.github.io/kael-os-repo/" | sudo tee -a /etc/pacman.conf > /dev/null
fi
echo "✅ Online Athenaeum configured."

# --- [5/6] Sanctify & Configure Local Athenaeum ---
echo ""
echo "--> [5/6] Sanctifying & Configuring Local Athenaeum..."
LOCAL_REPO_PATH="\$HOME/forge/repo"
if [ ! -d "\$LOCAL_REPO_PATH" ]; then
    echo "    -> Local Athenaeum not found. Creating at \$LOCAL_REPO_PATH"
    mkdir -p "\$LOCAL_REPO_PATH"
fi
REPO_DB="\$LOCAL_REPO_PATH/kael-os-local.db.tar.gz"
# Create a new, empty, signed database
rm -f "\$LOCAL_REPO_PATH"/kael-os-local.db*
repo-add --sign "\$REPO_DB"

# Ensure local repo is listed first for priority
if ! grep -q "^\\[kael-os-local\\]" /etc/pacman.conf; then
    sudo sed -i '/^\\[kael-os\\]/i \\\n[kael-os-local]\\nSigLevel = Required DatabaseRequired\\nServer = file://'"\$LOCAL_REPO_PATH"'\\n' /etc/pacman.conf
fi
echo "✅ Local Athenaeum Sanctified and Configured."

# --- [6/6] Final Sync ---
echo ""
echo "--> [6/6] Performing final database synchronization..."
sudo pacman -Syyu
echo ""
echo "✨ Grand Attunement Complete! Your forge is ready for any quest."
`;

export const FullForgeAttunementModal: React.FC<FullForgeAttunementModalProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in-fast" onClick={onClose}>
            <div className="bg-forge-panel border-2 border-forge-border rounded-lg shadow-2xl w-full max-w-3xl p-6 m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                     <h2 className="text-xl font-bold text-forge-text-primary flex items-center gap-2 font-display tracking-wider">
                        <HammerIcon className="w-5 h-5 text-dragon-fire" />
                        <span>Full Forge Attunement</span>
                    </h2>
                    <button onClick={onClose} className="text-forge-text-secondary hover:text-forge-text-primary">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="overflow-y-auto pr-2 text-forge-text-secondary leading-relaxed space-y-4">
                    <p>
                        This is the rite of mastery, Architect. A single, powerful incantation to perform all critical, one-time setup tasks required to make your machine a true forge.
                    </p>
                    <p className="text-sm p-3 bg-orc-steel/10 border-l-4 border-orc-steel rounded">
                        This unified ritual will automatically attune your GPG key, install all forge dependencies (including our allied repositories), sanctify your local Athenaeum by creating a signed database, and configure pacman to prioritize it.
                    </p>
                    
                    <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">Prerequisites</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>The 'Grand Forge Setup & Sync' ritual must be complete.</li>
                        <li>A GPG key must be created and available on your system.</li>
                    </ul>

                    <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">The Unified Incantation</h3>
                    <p>
                        Copy and run this entire script to fully attune your system.
                    </p>
                    <CodeBlock lang="bash">{ATTUNEMENT_SCRIPT_RAW}</CodeBlock>
                </div>
            </div>
        </div>
    );
};