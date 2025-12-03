

import React from 'react';
import { CloseIcon, ArrowDownTrayIcon } from '../core/Icons';
import { CodeBlock } from '../core/CodeBlock';

interface ForgeReconciliationModalProps {
  onClose: () => void;
}

const UNIFIED_SCRIPT_RAW = `#!/bin/bash
set -euo pipefail

echo "--- Grand Forge Attunement Ritual (Unified v1.7 - The True Path) ---"
echo "This unified ritual performs all critical one-time setup tasks for the forge."

# --- CONFIGURATION & GLOBAL VARS ---
USER_HOME=\$(getent passwd "\\\${SUDO_USER:-\$USER}" | cut -d: -f6)
LOCAL_REPO_PATH="\$USER_HOME/forge/repo"
SYSTEM_MOUNT_POINT="/var/lib/kael-local-repo"
PACMAN_CONF="/etc/pacman.conf"
TEMP_DIR=""
TEMP_KEY_FILE=""
TMP_CONFIG=""

# --- GLOBAL CLEANUP TRAP ---
cleanup() {
    [[ -n "\\$TEMP_DIR" && -d "\\$TEMP_DIR" ]] && rm -rf -- "\\$TEMP_DIR"
    [[ -n "\\$TEMP_KEY_FILE" && -f "\\$TEMP_KEY_FILE" ]] && rm -f -- "\\$TEMP_KEY_FILE"
    [[ -n "\\$TMP_CONFIG" && -f "\\$TMP_CONFIG" ]] && rm -f -- "\\$TMP_CONFIG"
}
trap cleanup EXIT SIGINT SIGTERM


# ===================================================================
# PART 1: THE BINDING RUNE (PERMANENT MOUNT SETUP)
# ===================================================================
echo ""
echo "--- [PART 1/5] Scribing The Binding Rune (Permanent Mount)... ---"

# Dynamically generate systemd unit names for correctness
MOUNT_UNIT_NAME=\$(systemd-escape -p --suffix=mount "\\$SYSTEM_MOUNT_POINT")
AUTOMOUNT_UNIT_NAME=\$(systemd-escape -p --suffix=automount "\\$SYSTEM_MOUNT_POINT")
MOUNT_UNIT_FILE="/etc/systemd/system/\\$MOUNT_UNIT_NAME"
AUTOMOUNT_UNIT_FILE="/etc/systemd/system/\\$AUTOMOUNT_UNIT_NAME"

if [ ! -d "\\$LOCAL_REPO_PATH" ]; then
    echo "❌ ERROR: Local Athenaeum not found at '\\$LOCAL_REPO_PATH'." >&2
    echo "   Please run 'Setup Local Forge' before this ritual." >&2
    exit 1
fi

echo "--> Cleaning up any previous failed configurations..."
sudo systemctl disable --now kael-local-repo.automount &>/dev/null || true
sudo systemctl disable --now kael-local-repo.mount &>/dev/null || true
sudo rm -f /etc/systemd/system/kael-local-repo.automount /etc/systemd/system/kael-local-repo.mount

# Scribe .mount unit
MOUNT_UNIT_CONTENT="[Unit]
Description=Kael OS Local Athenaeum Mount (\\\${USER_HOME})
Requires=local-fs.target
After=local-fs.target
[Mount]
What=\\\${LOCAL_REPO_PATH}
Where=\\\${SYSTEM_MOUNT_POINT}
Type=none
Options=bind,ro
[Install]
WantedBy=multi-user.target"

# Scribe .automount unit
AUTOMOUNT_UNIT_CONTENT="[Unit]
Description=Kael OS Local Athenaeum Automount
[Automount]
Where=\\\${SYSTEM_MOUNT_POINT}
TimeoutIdleSec=600
[Install]
WantedBy=multi-user.target"

echo "\\$MOUNT_UNIT_CONTENT" | sudo tee "\\$MOUNT_UNIT_FILE" > /dev/null
echo "\\$AUTOMOUNT_UNIT_CONTENT" | sudo tee "\\$AUTOMOUNT_UNIT_FILE" > /dev/null
echo "✅ Systemd runes scribed."


# ===================================================================
# PART 2: INSTALL CORE DEPENDENCIES & REPOSITORIES
# ===================================================================
echo ""
echo "--- [PART 2/5] Installing Core Dependencies & Attuning Repositories... ---"
echo "--> Installing bootstrap tools (base-devel, curl, git, pacman-contrib, lftp, github-cli)..."
sudo pacman -S --needed --noconfirm base-devel curl git pacman-contrib lftp github-cli

echo "--> Attuning to the CachyOS repository..."
if ! pacman -Q cachyos-keyring > /dev/null 2>&1; then
    TEMP_DIR=\$(mktemp -d)
    (cd "\\$TEMP_DIR"; curl -fsSL "https://mirror.cachyos.org/cachyos-repo.tar.xz" -o "cachyos-repo.tar.xz"; tar xvf cachyos-repo.tar.xz > /dev/null; cd cachyos-repo && sudo ./cachyos-repo.sh)
fi

echo "--> Attuning to the Chaotic-AUR..."
if ! pacman -Q chaotic-keyring > /dev/null 2>&1; then
    sudo pacman-key --recv-key 3056513887B78AEB --keyserver keyserver.ubuntu.com
    sudo pacman-key --lsign-key 3056513887B78AEB
    sudo pacman -U --noconfirm 'https://cdn-mirror.chaotic.cx/chaotic-aur/chaotic-keyring.pkg.tar.zst' 'https://cdn-mirror.chaotic.cx/chaotic-aur/chaotic-mirrorlist.pkg.tar.zst'
    if ! grep -q "^\\[chaotic-aur\\]" /etc/pacman.conf; then
      echo -e "\\n[chaotic-aur]\\nInclude = /etc/pacman.d/chaotic-mirrorlist" | sudo tee -a /etc/pacman.conf > /dev/null
    fi
fi
echo "✅ Allied repositories attuned."


# ===================================================================
# PART 3: TRUST KAEL OS & CONFIGURE PACMAN.CONF
# ===================================================================
echo ""
echo "--- [PART 3/5] Trusting Kael OS & Configuring pacman.conf... ---"

# Trust Kael OS master key
if ! sudo pacman-key --list-keys "LeeTheOrc" >/dev/null 2>&1; then
    echo "--> Trusting Kael OS master key..."
    KEY_URL="https://raw.githubusercontent.com/LeeTheOrc/kael-os-repo/gh-pages/kael-os.asc"
    TEMP_KEY_FILE=\$(mktemp)
    curl -fsSL "\\\${KEY_URL}" -o "\\\${TEMP_KEY_FILE}"
    KAEL_KEY_ID=\$(gpg --show-keys --with-colons "\\\${TEMP_KEY_FILE}" 2>/dev/null | grep '^pub' | cut -d: -f5)
    sudo pacman-key --add "\\\${TEMP_KEY_FILE}"
    sudo pacman-key --lsign-key "\\\$KAEL_KEY_ID"
fi
echo "--> Kael OS master key is trusted."

# Mirrorlist Creation
echo "--> Scribing Unified Mirrorlist (/etc/pacman.d/kael-os-mirrorlist)..."
cat <<EOF | sudo tee /etc/pacman.d/kael-os-mirrorlist > /dev/null
# Kael OS Unified Mirrorlist (v1.7 - The True Path)
# Primary: GitHub Pages (Fast, Global)
Server = https://leetheorc.github.io/kael-os-repo/

# Secondary: WebDisk (Redundant, Private)
Server = https://leroyonline.co.za/leroy/forge/repo/
EOF

# Atomically update pacman.conf
echo "--> Scribing all repository paths into pacman.conf..."
BACKUP_FILE="/etc/pacman.conf.kael-attune.bak"
if [ ! -f "\\$BACKUP_FILE" ]; then sudo cp "\\$PACMAN_CONF" "\\$BACKUP_FILE"; fi

TMP_CONFIG=\$(mktemp)

# A: Add local repo entry IF the DB exists.
if [ -f "\\$LOCAL_REPO_PATH/kael-os-local.db" ] || [ -f "\\$LOCAL_REPO_PATH/kael-os-local.db.tar.gz" ]; then
    echo "--> Sanctified local forge detected. Configuring permanent mount path..."
    LOCAL_REPO_SERVER="file://\\$SYSTEM_MOUNT_POINT" # Use the permanent mount point
    LOCAL_REPO_ENTRY="[kael-os-local]\\nSigLevel = Required DatabaseRequired\\nServer = \$LOCAL_REPO_SERVER"
    printf "%b\\n\\n" "\$LOCAL_REPO_ENTRY" > "\$TMP_CONFIG"
else
    echo "--> No local forge database found. Using online-only mode."
    > "\$TMP_CONFIG"
fi

# B: Filter old config and append it
awk '
    /^\\\[kael-os-local\\\]/ { in_section=1; next }
    /^\\\[kael-os\\\]/       { in_section=1; next }
    /^\\\[kael-os-webdisk\\\]/ { in_section=1; next }
    /^\\\[chaotic-aur\\\]/    { in_section=1; next }
    /^\\s*\\\[/            { in_section=0 }
    !in_section         { print }
' "\\$PACMAN_CONF" >> "\$TMP_CONFIG"

# C: Append all managed repos in the correct order
{
    echo ""
    echo "# -- Kael OS & Allied Repositories (Managed by Attunement Ritual) --"
    echo "[chaotic-aur]"
    echo "Include = /etc/pacman.d/chaotic-mirrorlist"
    echo ""
    echo "[kael-os]"
    echo "SigLevel = Required DatabaseOptional"
    echo "Include = /etc/pacman.d/kael-os-mirrorlist"
} >> "\$TMP_CONFIG"

# D: Apply
cat "\$TMP_CONFIG" | sudo tee "\$PACMAN_CONF" > /dev/null
echo "✅ pacman.conf fully configured."


# ===================================================================
# PART 4: ACTIVATE MOUNT & SYNCHRONIZE
# ===================================================================
echo ""
echo "--- [PART 4/5] Activating Mount & Synchronizing Databases... ---"
sudo systemctl daemon-reload
sudo systemctl enable --now "\\$AUTOMOUNT_UNIT_NAME"

if ! systemctl is-active --quiet "\\$AUTOMOUNT_UNIT_NAME"; then
    echo "❌ ERROR: Failed to start the automount service." >&2
    echo "   Run 'systemctl status \\$AUTOMOUNT_UNIT_NAME' to diagnose." >&2
    exit 1
fi
echo "--> Automount is armed. Forcing database sync..."
sudo pacman -Syyu


# ===================================================================
# PART 5: INSTALL FINAL FORGE TOOLS
# ===================================================================
echo ""
echo "--- [PART 5/5] Installing Final Forge Tools... ---"
# CLEANUP: Remove legacy scripts before installing package
if [ -f /usr/local/bin/chronicler ]; then
    echo "--> Removing legacy manual 'chronicler' to allow package install..."
    sudo chattr -i /usr/local/bin/chronicler &>/dev/null || true
    sudo rm -f /usr/local/bin/chronicler
fi

sudo pacman -S --needed --noconfirm chronicler kael-shell
echo "✅ All tools installed."
echo ""
echo "✨ Grand Attunement Ritual Complete! Your forge is ready for any quest."
`;


export const ForgeReconciliationModal: React.FC<ForgeReconciliationModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in-fast" onClick={onClose}>
        <div className="bg-forge-panel border-2 border-forge-border rounded-lg shadow-2xl w-full max-w-3xl p-6 m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                 <h2 className="text-xl font-bold text-forge-text-primary flex items-center gap-2 font-display tracking-wider">
                    <ArrowDownTrayIcon className="w-5 h-5 text-dragon-fire" />
                    <span>Grand Forge Attunement (v1.7)</span>
                </h2>
                <button onClick={onClose} className="text-forge-text-secondary hover:text-forge-text-primary">
                    <CloseIcon className="w-5 h-5" />
                </button>
            </div>
            <div className="overflow-y-auto pr-2 text-forge-text-secondary leading-relaxed space-y-6">
                <p>
                    As you command, Architect. I have updated the Grand Attunement to incorporate the <strong className="text-dragon-fire">True Path (v1.7)</strong>.
                </p>
                
                <div className="bg-forge-bg/50 p-4 rounded-lg border border-orc-steel/30 shadow-[0_0_15px_rgba(122,235,190,0.1)]">
                    <h3 className="font-bold text-orc-steel font-display flex items-center gap-2 mb-2 text-lg">
                        The Unified Incantation (v1.7)
                    </h3>
                    <p className="text-sm mb-3 text-forge-text-primary">
                       This updated ritual will correct your repository configuration to resolve the 404 errors. It replaces the faulty mirror list with a new one containing the true coordinates for both the GitHub and WebDisk Athenaeums.
                    </p>
                    <CodeBlock lang="bash">{`echo "${btoa(unescape(encodeURIComponent(UNIFIED_SCRIPT_RAW)))}" | base64 --decode | bash`}</CodeBlock>
                </div>
            </div>
        </div>
    </div>
  );
};
