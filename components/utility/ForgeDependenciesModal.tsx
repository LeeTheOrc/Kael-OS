


import React from 'react';
import { CloseIcon, PackageIcon } from '../core/Icons';
import { CodeBlock } from '../core/CodeBlock';

interface ForgeDependenciesModalProps {
  onClose: () => void;
}

const FORGE_DEPS_SCRIPT_RAW = `#!/bin/bash
set -euo pipefail

# --- CONFIGURATION & GLOBAL VARS ---
# We no longer use /var/lib/kael-local-repo as it caused persistence issues on reboot.
# We now point pacman directly to the user's home directory.
TEMP_DIR=""
TEMP_KEY_FILE=""
TMP_CONFIG=""

# --- GLOBAL CLEANUP TRAP ---
cleanup() {
    [[ -n "$TEMP_DIR" && -d "$TEMP_DIR" ]] && rm -rf -- "$TEMP_DIR"
    [[ -n "$TEMP_KEY_FILE" && -f "$TEMP_KEY_FILE" ]] && rm -f -- "$TEMP_KEY_FILE"
    [[ -n "$TMP_CONFIG" && -f "$TMP_CONFIG" ]] && rm -f -- "$TMP_CONFIG"
}
trap cleanup EXIT SIGINT SIGTERM


echo "--- Forge Dependencies Ritual (Persistence Update) ---"
echo "This ritual prepares your system and ensures your repository connections survive reboots."

# --- [1/5] Install Bootstrap Tools ---
echo ""
echo "--> [1/5] Installing bootstrap tools (base-devel, curl)..."
sudo pacman -S --needed --noconfirm base-devel curl
echo "✅ Bootstrap tools are ready."
echo ""

# --- [2/5] Attune to CachyOS Repository ---
echo "--> [2/5] Attuning to the CachyOS repository..."
if pacman -Q cachyos-keyring > /dev/null 2>&1; then
    echo "--> CachyOS keyring already installed. Skipping."
else
    TEMP_DIR=$(mktemp -d)
    echo "--> Summoning CachyOS setup scripts..."
    (
        cd "$TEMP_DIR"
        curl -fsSL "https://mirror.cachyos.org/cachyos-repo.tar.xz" -o "cachyos-repo.tar.xz"
        tar xvf cachyos-repo.tar.xz > /dev/null
        cd cachyos-repo && sudo ./cachyos-repo.sh
    )
    echo "✅ CachyOS repository attuned."
fi
echo ""

# --- [3/5] Attune to Chaotic-AUR Repository ---
echo "--> [3/5] Attuning to the Chaotic-AUR..."
if pacman -Q chaotic-keyring > /dev/null 2>&1; then
    echo "--> Chaotic-AUR keyring already installed. Skipping."
else
    echo "--> Retrieving and signing master key..."
    sudo pacman-key --recv-key 3056513887B78AEB --keyserver keyserver.ubuntu.com
    sudo pacman-key --lsign-key 3056513887B78AEB
    
    echo "--> Installing keyring and mirrorlist..."
    sudo pacman -U --noconfirm 'https://cdn-mirror.chaotic.cx/chaotic-aur/chaotic-keyring.pkg.tar.zst' 'https://cdn-mirror.chaotic.cx/chaotic-aur/chaotic-mirrorlist.pkg.tar.zst'

    echo "--> Updating pacman configuration..."
    if ! grep -q "^\\[chaotic-aur\\]" /etc/pacman.conf; then
        echo -e "\\n[chaotic-aur]\\nInclude = /etc/pacman.d/chaotic-mirrorlist" | sudo tee -a /etc/pacman.conf > /dev/null
    fi
    echo "✅ Chaotic-AUR repository attuned."
fi
echo ""

# --- [4/5] Attune to Kael OS Athenaeum ---
echo "--> [4/5] Attuning to the Kael OS Athenaeum..."

# Part A: Keyring Attunement
if sudo pacman-key --list-keys "LeeTheOrc" >/dev/null 2>&1; then
    echo "--> Kael OS master key already trusted."
else
    echo "--> Trusting Kael OS master key..."
    KEY_URL="https://raw.githubusercontent.com/LeeTheOrc/kael-os-repo/gh-pages/kael-os.asc"
    TEMP_KEY_FILE=$(mktemp)
    if ! curl -fsSL "\${KEY_URL}" -o "\${TEMP_KEY_FILE}"; then
        echo "❌ ERROR: Failed to download the Kael OS master key." >&2
        exit 1
    fi
    KEY_ID=$(gpg --show-keys --with-colons "\${TEMP_KEY_FILE}" 2>/dev/null | grep '^pub' | cut -d: -f5)
    sudo pacman-key --add "\${TEMP_KEY_FILE}"
    sudo pacman-key --lsign-key "\${KEY_ID}"
    echo "✅ Master key trusted."
fi

# Part B: Repository Configuration
CONFIG_FILE="/etc/pacman.conf"
echo "--> Configuring Kael OS repositories in pacman.conf..."
BACKUP_FILE="/etc/pacman.conf.kael-deps.bak"
if [ ! -f "$BACKUP_FILE" ]; then
    sudo cp "$CONFIG_FILE" "$BACKUP_FILE"
fi

# Correctly determine the user's home directory
USER_HOME=$(getent passwd "\${SUDO_USER:-\$USER}" | cut -d: -f6)
LOCAL_REPO_PATH="\$USER_HOME/forge/repo"

ONLINE_REPO_ENTRY="[kael-os]\\nSigLevel = Required DatabaseOptional\\nServer = https://leetheorc.github.io/kael-os-repo/"

TMP_CONFIG=$(mktemp)

# Conditionally add the local repo entry if the DB exists
if [ -f "\$LOCAL_REPO_PATH/kael-os-local.db" ]; then
    echo "--> Sanctified local forge detected. Adding direct path..."
    
    # PERSISTENCE FIX: Use direct file:// path to home directory.
    # This survives reboots and avoids bind mount complexity.
    LOCAL_REPO_SERVER="file://\${LOCAL_REPO_PATH}"
    
    LOCAL_REPO_ENTRY="[kael-os-local]\\nSigLevel = Required DatabaseRequired\\nServer = \$LOCAL_REPO_SERVER"

    # The local repo MUST come first to be prioritized.
    printf "%b\\n\\n" "\$LOCAL_REPO_ENTRY" > "\$TMP_CONFIG"
else
    echo "--> No local forge database found. Using online-only mode."
    > "\$TMP_CONFIG"
fi

# Append the rest of pacman.conf, filtering out old/managed entries
awk '
    /^\\\[kael-os-local\\\]/ { in_section=1; next }
    /^\\\[kael-os\\\]/       { in_section=1; next }
    /^\\s*\\\[/            { in_section=0 }
    !in_section         { print }
' "\$CONFIG_FILE" >> "\$TMP_CONFIG"

# Append our online repo entry to the end
printf "\\n%b\\n" "\$ONLINE_REPO_ENTRY" >> "\$TMP_CONFIG"

# Apply configuration
cat "\$TMP_CONFIG" | sudo tee "\$CONFIG_FILE" > /dev/null
echo "✅ pacman.conf updated."
echo ""

# --- [5/5] Final Synchronization ---
echo "--> [5/5] Synchronizing databases and installing tools..."
sudo pacman -Sy

echo "--> Installing remaining forge tools..."
# CLEANUP: Remove legacy scripts before installing package
if [ -f /usr/local/bin/chronicler ]; then
    echo "--> Removing legacy manual 'chronicler' to allow package install..."
    sudo chattr -i /usr/local/bin/chronicler &>/dev/null || true
    sudo rm -f /usr/local/bin/chronicler
fi

# Add kael-shell to the default toolset
sudo pacman -S --needed --noconfirm git pacman-contrib lftp github-cli chronicler kael-shell
echo "✅ All tools installed."

echo ""
echo "✨ Ritual Complete! Your forge is persistent and ready."
`;

export const ForgeDependenciesModal: React.FC<ForgeDependenciesModalProps> = ({ onClose }) => {
    const encodedScript = btoa(unescape(encodeURIComponent(FORGE_DEPS_SCRIPT_RAW)));
    const finalForgeCommand = `echo "${encodedScript}" | base64 --decode | bash`;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in-fast" onClick={onClose}>
        <div className="bg-forge-panel border-2 border-forge-border rounded-lg shadow-2xl w-full max-w-3xl p-6 m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                 <h2 className="text-xl font-bold text-forge-text-primary flex items-center gap-2 font-display tracking-wider">
                    <PackageIcon className="w-5 h-5 text-dragon-fire" />
                    <span>Install Forge Dependencies</span>
                </h2>
                <button onClick={onClose} className="text-forge-text-secondary hover:text-forge-text-primary">
                    <CloseIcon className="w-5 h-5" />
                </button>
            </div>
            <div className="overflow-y-auto pr-2 text-forge-text-secondary leading-relaxed space-y-4">
                <p>
                    This grand ritual prepares your system to become a true forge. It will install all necessary tools and attune your machine to our allied repositories.
                </p>
                <p className="text-sm p-3 bg-orc-steel/10 border-l-4 border-orc-steel rounded">
                    <strong className="text-orc-steel">Persistence Upgrade:</strong> This ritual has been updated to use direct, persistent file paths for your local repository. This fixes the "failed to retrieve file" errors that occurred after rebooting.
                </p>
                <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">The Unified Incantation</h3>
                <p>
                    Copy and run this single command in your terminal. It contains the entire ritual, encoded for a flawless execution.
                </p>
                <CodeBlock lang="bash">{finalForgeCommand}</CodeBlock>
            </div>
        </div>
    </div>
  );
};