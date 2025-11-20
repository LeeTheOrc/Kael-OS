


import React from 'react';
import { CloseIcon, ArrowDownTrayIcon, HammerIcon, ShieldCheckIcon } from '../core/Icons';
import { CodeBlock } from '../core/CodeBlock';

interface ForgeReconciliationModalProps {
  onClose: () => void;
}

// --- SPELL 1: REPAIR & SYNC ---
const REPAIR_SCRIPT_RAW = `#!/bin/bash
set -euo pipefail

# --- Global Configuration ---
USER_HOME=$(getent passwd "\${SUDO_USER:-\$USER}" | cut -d: -f6)
LOCAL_REPO_PATH="\$USER_HOME/forge/repo"
# The exact deep URL for the WebDisk Athenaeum
WEBDISK_URL="https://leroyonline.co.za/leroyonline.co.za/leroy/forge/repo/"
MOUNT_POINT="\$USER_HOME/WebDisk"

echo "--- [Spell I] The Mending (Repair & Sync) ---"
echo "Target: \$LOCAL_REPO_PATH"

# --- [0/5] WebDisk Anomaly Check (Void Banishing) ---
if [ -d "\$MOUNT_POINT/forge" ]; then
    echo "--> ⚠️  Anomaly Detected: Recursive 'forge' folder in WebDisk."
    echo "    Invoking Void Banishing Protocol..."
    TRASH_NAME="_TRASH_forge_\$(date +%s)"
    mv "\$MOUNT_POINT/forge" "\$MOUNT_POINT/\$TRASH_NAME" || true
    ( rm -rf "\$MOUNT_POINT/\$TRASH_NAME" ) &>/dev/null &
    echo "    ✅ Anomaly banished."
fi

# --- [1/5] Local Athenaeum Repair ---
echo ""
echo "--> [1/5] Repairing Local Athenaeum Structure..."
if [ ! -d "\$LOCAL_REPO_PATH" ]; then
    echo "❌ ERROR: Local repo directory not found."
    echo "   Run 'Setup Local Forge' first."
    exit 1
fi

# 1. Permissions
find "\$LOCAL_REPO_PATH" -type d -exec chmod 755 {} +
find "\$LOCAL_REPO_PATH" -type f -exec chmod 644 {} +
chmod 755 "\$USER_HOME/forge"

# 2. Database Integrity
echo "    -> Verifying database signature..."
cd "\$LOCAL_REPO_PATH"
DB_ARCHIVE="kael-os-local.db.tar.gz"

if [ -f "\$DB_ARCHIVE" ]; then
    if [ ! -f "\$DB_ARCHIVE.sig" ]; then
         echo "       ⚠️  Signature missing. Signing database..."
         gpg --detach-sign --yes "\$DB_ARCHIVE" || echo "       ❌ Failed to sign."
    fi
    
    # Repair Symlinks
    ln -sf "\$DB_ARCHIVE" "kael-os-local.db"
    [ -f "\$DB_ARCHIVE.sig" ] && ln -sf "\$DB_ARCHIVE.sig" "kael-os-local.db.sig"
    
    if [ -f "kael-os-local.files.tar.gz" ]; then
        ln -sf "kael-os-local.files.tar.gz" "kael-os-local.files"
        [ -f "kael-os-local.files.tar.gz.sig" ] && ln -sf "kael-os-local.files.tar.gz.sig" "kael-os-local.files.sig"
    fi
    echo "    ✅ Local integrity secure."
else
    echo "    ⚠️  No database found. Run 'Sanctify Athenaeum' to create one."
fi

# --- [2/5] Migration to Persistent Path ---
echo ""
echo "--> [2/5] Checking for Legacy Bind Mounts (Persistence Fix)..."
PACMAN_CONF="/etc/pacman.conf"
BROKEN_PATH="/var/lib/kael-local-repo"

# Check if the config uses the old broken path
if grep -q "\$BROKEN_PATH" "\$PACMAN_CONF"; then
    echo "    ⚠️  Detected legacy volatile bind-mount path in pacman.conf."
    echo "    -> Migrating config to persistent direct path..."
    
    # We use sed to replace the Server line under [kael-os-local]
    # We match the Server line that contains the broken path
    # And replace it with the new file:// path to HOME
    NEW_SERVER="Server = file://\$LOCAL_REPO_PATH"
    
    # Escape slashes for sed
    ESCAPED_NEW_SERVER=$(echo "\$NEW_SERVER" | sed 's/\\//\\\\\\//g')
    
    # Perform the surgery
    sudo sed -i "s|Server = file://\$BROKEN_PATH/repo|\$ESCAPED_NEW_SERVER|g" "\$PACMAN_CONF"
    
    echo "    ✅ Config migrated to: \$NEW_SERVER"
    
    # Cleanup old broken mount
    if mountpoint -q "\$BROKEN_PATH/repo"; then
        sudo umount "\$BROKEN_PATH/repo"
    fi
    [ -d "\$BROKEN_PATH" ] && sudo rm -rf "\$BROKEN_PATH"
    echo "    ✅ Cleaned up legacy /var/lib paths."
else
    echo "    ✅ Configuration uses valid persistent paths."
fi

# --- [3/5] WebDisk Configuration Fix ---
echo ""
echo "--> [3/5] Checking WebDisk Configuration..."

if grep -q "^\\[kael-os-webdisk\\]" "\$PACMAN_CONF"; then
    if grep -q "leroy/forge/repo" "\$PACMAN_CONF"; then
         echo "    ✅ WebDisk URL is correctly attuned."
    else
         echo "    ⚠️  WebDisk URL mismatch. Updating..."
         ESCAPED_URL=$(echo "\$WEBDISK_URL" | sed 's/\\//\\\\\\//g')
         sudo sed -i "/^\\[kael-os-webdisk\\]/,/^\\[/ s|Server = .*|Server = \$ESCAPED_URL|" "\$PACMAN_CONF"
         echo "    ✅ WebDisk URL repaired."
    fi
else
    WEBDISK_ENTRY="[kael-os-webdisk]\\nSigLevel = Required DatabaseOptional\\nServer = \$WEBDISK_URL"
    printf "\\n%b\\n" "\$WEBDISK_ENTRY" | sudo tee -a "\$PACMAN_CONF" > /dev/null
    echo "    ✅ WebDisk Athenaeum added."
fi

# --- [4/5] Synchronize Databases ---
echo ""
echo "--> [4/5] Synchronizing Pacman Databases..."

# Clear sync cache for local repo to force refresh
sudo rm -f /var/lib/pacman/sync/kael-os-local.db
sudo rm -f /var/lib/pacman/sync/kael-os-local.db.sig

if sudo pacman -Syy; then
    echo "✅ Databases synchronized."
else
    echo "⚠️  Sync failed. Check your internet connection."
fi

echo ""
echo "✨ Spell I Complete: System healed and persistent."
`;

// --- SPELL 2: INSTALL & VERIFY ---
const INSTALL_SCRIPT_RAW = `#!/bin/bash
set -euo pipefail

USER_HOME=$(getent passwd "\${SUDO_USER:-\$USER}" | cut -d: -f6)
FORGE_BASE="\$USER_HOME/forge"

echo "--- [Spell II] The Armament (Install & Verify) ---"

# --- [1/3] Install Forge Tools ---
echo ""
echo "--> [1/3] Installing Forge Familiars..."

CORE_PKGS="base-devel git pacman-contrib curl wget rsync openssh neovim tree unzip"
NET_PKGS="lftp github-cli davfs2"
# Added kael-shell to default shell packages
SHELL_PKGS="zsh starship jq python zsh-autosuggestions zsh-syntax-highlighting kael-shell"
AI_PKGS="ollama"

if sudo pacman -S --needed --noconfirm $CORE_PKGS $NET_PKGS $SHELL_PKGS $AI_PKGS; then
    echo "    ✅ Standard Tools & Kaelic Shell installed."
else
    echo "    ❌ Installation failed."
    exit 1
fi

# --- [2/3] Chronicler Verification ---
echo ""
echo "--> [2/3] Verifying Chronicler..."
if pacman -Q chronicler &>/dev/null; then
    echo "    ✅ 'chronicler' is active."
else
    echo "    -> Installing 'chronicler'..."
    if sudo pacman -S --noconfirm chronicler; then
        echo "    ✅ Installed."
    else
        echo "    ❌ Failed to install chronicler. Check repo connections."
    fi
fi

# --- [3/3] Environment Check ---
echo ""
echo "--> [3/3] Verifying Forge Structure..."
mkdir -p "\$FORGE_BASE/kael" "\$FORGE_BASE/repo" "\$FORGE_BASE/packages" \
         "\$FORGE_BASE/sources" "\$FORGE_BASE/build" "\$FORGE_BASE/artifacts" "\$FORGE_BASE/logs"
echo "    ✅ Directory structure verified."

echo ""
echo "✨ Spell II Complete: The Armament is secured."
`;

export const ForgeReconciliationModal: React.FC<ForgeReconciliationModalProps> = ({ onClose }) => {
  const encodedRepair = btoa(unescape(encodeURIComponent(REPAIR_SCRIPT_RAW)));
  const commandRepair = `echo "${encodedRepair}" | base64 --decode | bash`;

  const encodedInstall = btoa(unescape(encodeURIComponent(INSTALL_SCRIPT_RAW)));
  const commandInstall = `echo "${encodedInstall}" | base64 --decode | bash`;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in-fast" onClick={onClose}>
        <div className="bg-forge-panel border-2 border-forge-border rounded-lg shadow-2xl w-full max-w-3xl p-6 m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                 <h2 className="text-xl font-bold text-forge-text-primary flex items-center gap-2 font-display tracking-wider">
                    <ArrowDownTrayIcon className="w-5 h-5 text-dragon-fire" />
                    <span>Grand Forge Maintenance</span>
                </h2>
                <button onClick={onClose} className="text-forge-text-secondary hover:text-forge-text-primary">
                    <CloseIcon className="w-5 h-5" />
                </button>
            </div>
            <div className="overflow-y-auto pr-2 text-forge-text-secondary leading-relaxed space-y-6">
                <p>
                    Architect, I have updated <strong className="text-dragon-fire">Spell I</strong> to include the Void Banishing Protocol, which aggressively cleans up recursive folders in your WebDisk.
                </p>
                
                {/* Spell 1 */}
                <div className="bg-forge-bg/50 p-4 rounded-lg border border-orc-steel/30 shadow-[0_0_15px_rgba(122,235,190,0.1)]">
                    <h3 className="font-bold text-orc-steel font-display flex items-center gap-2 mb-2 text-lg">
                        <HammerIcon className="w-5 h-5" />
                        <span>Spell I: The Mending</span>
                    </h3>
                    <p className="text-sm mb-3 text-forge-text-primary">
                        Repairs repo permissions, signs the DB, fixes persistent paths, and <strong className="text-dragon-fire">banishes WebDisk anomalies</strong>.
                    </p>
                    <CodeBlock lang="bash">{commandRepair}</CodeBlock>
                </div>

                {/* Spell 2 */}
                <div className="bg-forge-bg/50 p-4 rounded-lg border border-dragon-fire/30 shadow-[0_0_15px_rgba(255,204,0,0.1)]">
                    <h3 className="font-bold text-dragon-fire font-display flex items-center gap-2 mb-2 text-lg">
                        <ShieldCheckIcon className="w-5 h-5" />
                        <span>Spell II: The Armament</span>
                    </h3>
                    <p className="text-sm mb-3 text-forge-text-primary">
                        Ensures all tools (including <strong className="text-dragon-fire">kael-shell</strong>) are installed and the environment is correct.
                    </p>
                    <CodeBlock lang="bash">{commandInstall}</CodeBlock>
                </div>

            </div>
        </div>
    </div>
  );
};