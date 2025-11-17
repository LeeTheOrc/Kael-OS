import React from 'react';
import { CloseIcon, LinkIcon } from '../core/Icons';
import { CodeBlock } from '../core/CodeBlock';

interface WebDiskAttunementModalProps {
  onClose: () => void;
}

const WEBDISK_ATTUNEMENT_SCRIPT_RAW = `#!/bin/bash
set -euo pipefail

echo "--- WebDisk Attunement Ritual (Reforged) ---"
echo "This ritual will configure your system for robust, persistent access to the WebDisk."
echo ""

# --- [1/6] Prerequisite Check ---
echo "--> [1/6] Verifying davfs2 installation..."
if ! command -v mount.davfs &> /dev/null; then
    echo "❌ ERROR: 'davfs2' is not installed. Please run the 'Install Forge Dependencies' ritual first." >&2
    exit 1
fi
echo "✅ 'davfs2' is installed."
echo ""

# --- [2/6] User and Group Setup ---
# Correctly determine the user, even under sudo
THE_USER="\${SUDO_USER:-\$USER}"
USER_HOME=\$(getent passwd "\$THE_USER" | cut -d: -f6)
echo "--> [2/6] Configuring user '\$THE_USER' for davfs2..."
if ! getent group davfs2 &>/dev/null; then
    echo "    -> 'davfs2' group not found. Creating it..."
    sudo groupadd --system davfs2
fi

if id -nG "\$THE_USER" | grep -qw "davfs2"; then
    echo "    -> User is already in the 'davfs2' group."
else
    echo "    -> Adding user to the 'davfs2' group..."
    sudo gpasswd -a "\$THE_USER" davfs2
    echo "    ⚠️ NOTE: You may need to log out and log back in for this group change to take full effect."
fi
echo "✅ User configuration complete."
echo ""

# --- [3/6] Mount Point Creation ---
MOUNT_POINT="\$USER_HOME/WebDisk"
echo "--> [3/6] Ensuring mount point exists at \$MOUNT_POINT..."
# Create as user to ensure ownership
sudo -u "\$THE_USER" mkdir -p "\$MOUNT_POINT"
echo "✅ Mount point is ready."
echo ""

# --- [4/6] Credential & Config Configuration ---
WEBDAV_URL="https://leroyonline.co.za:2078"
WEBDAV_USER="leroy@leroyonline.co.za"
WEBDAV_PASS='LeRoy0923!'
DAV_CONF_DIR="\$USER_HOME/.davfs2"
SECRETS_FILE="\$DAV_CONF_DIR/secrets"
DAV_CONF_FILE="\$DAV_CONF_DIR/davfs2.conf"

echo "--> [4/6] Storing credentials and user configuration securely..."
# Ensure directory and files exist with correct user ownership
sudo -u "\$THE_USER" mkdir -p "\$DAV_CONF_DIR"
sudo -u "\$THE_USER" touch "\$SECRETS_FILE"
sudo -u "\$THE_USER" chmod 600 "\$SECRETS_FILE"

# Create user config from system template if it doesn't exist
if ! sudo -u "\$THE_USER" [ -f "\$DAV_CONF_FILE" ]; then
    echo "    -> Creating user davfs2.conf from system template..."
    sudo -u "\$THE_USER" cp /etc/davfs2/davfs2.conf "\$DAV_CONF_FILE"
fi

# The secret entry format is: <mount_point_or_url> <user> <password>
SECRET_ENTRY="\$WEBDAV_URL \\"\$WEBDAV_USER\\" \\"\$WEBDAV_PASS\\""

# Use a temporary file to safely update the secrets
TEMP_SECRETS=\$(mktemp)
trap 'rm -f -- "\$TEMP_SECRETS"' EXIT
# Read as user, write to temp file as root
sudo -u "\$THE_USER" grep -vF "\$WEBDAV_URL" "\$SECRETS_FILE" > "\$TEMP_SECRETS" || true
# Append as root
echo "\$SECRET_ENTRY" >> "\$TEMP_SECRETS"
# Overwrite original file as user, which preserves ownership.
sudo -u "\$THE_USER" cp "\$TEMP_SECRETS" "\$SECRETS_FILE"
rm -f "\$TEMP_SECRETS"
trap - EXIT # Clear the trap since we manually cleaned up

echo "✅ Credentials and configuration are secure."
echo ""

# --- [5/6] fstab Configuration ---
FSTAB_FILE="/etc/fstab"
FSTAB_BACKUP="/etc/fstab.kael-webdisk.bak"
USER_ID=\$(id -u "\$THE_USER")
GROUP_ID=\$(id -g "\$THE_USER")

# Reforged fstab entry. The 'conf' option is CRUCIAL for systemd.automount to find the user's credentials.
FSTAB_ENTRY="\$WEBDAV_URL \$MOUNT_POINT davfs user,noauto,x-systemd.automount,x-systemd.mount-timeout=30s,x-systemd.requires=network-online.target,uid=\$USER_ID,gid=\$GROUP_ID,_netdev,conf=\$DAV_CONF_FILE 0 0"

echo "--> [5/6] Configuring /etc/fstab for automounting..."
if [ ! -f "\$FSTAB_BACKUP" ]; then
    sudo cp "\$FSTAB_FILE" "\$FSTAB_BACKUP"
    echo "    -> Created backup: \$FSTAB_BACKUP"
fi

# Unmount if it's currently mounted, to prevent "device is busy" errors
if mountpoint -q "\$MOUNT_POINT"; then
    echo "    -> Temporarily unmounting WebDisk to apply changes..."
    sudo umount "\$MOUNT_POINT"
fi

# Remove any old entry for this mount point before adding the new one
if grep -q " \$MOUNT_POINT davfs " "\$FSTAB_FILE"; then
    echo "    -> Found existing entry in fstab. Replacing it."
    sudo sed -i.bak "s|^.* \$MOUNT_POINT davfs .*||g" "\$FSTAB_FILE"
fi
sudo sed -i '/^$/d' "\$FSTAB_FILE"

echo "\$FSTAB_ENTRY" | sudo tee -a "\$FSTAB_FILE" > /dev/null
echo "✅ /etc/fstab configured."

# --- [6/6] Mount and Verify ---
echo ""
echo "--> [6/6] Reloading systemd and verifying connection..."
sudo systemctl daemon-reload
echo "    -> Systemd reloaded."

sudo umount "\$MOUNT_POINT" &>/dev/null || true

echo "    -> Attempting to mount the WebDisk now..."
if ! sudo -u "\$THE_USER" mount "\$MOUNT_POINT"; then
    echo "❌ MOUNT FAILED. Please verify credentials and network connection." >&2
    exit 1
fi
echo "✅ Mount successful."

echo "--> Current contents of WebDisk:"
sudo -u "\$THE_USER" ls -la "\$MOUNT_POINT"
echo ""

echo "✨ Ritual Complete! Your system is now attuned to the WebDisk."
echo "   It will mount automatically on first access at \$MOUNT_POINT."
`;


export const WebDiskAttunementModal: React.FC<WebDiskAttunementModalProps> = ({ onClose }) => {
  const encodedScript = btoa(unescape(encodeURIComponent(WEBDISK_ATTUNEMENT_SCRIPT_RAW)));
  const finalCommand = `echo "${encodedScript}" | base64 --decode | bash`;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in-fast" onClick={onClose}>
        <div className="bg-forge-panel border-2 border-forge-border rounded-lg shadow-2xl w-full max-w-3xl p-6 m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                 <h2 className="text-xl font-bold text-forge-text-primary flex items-center gap-2 font-display tracking-wider">
                    <LinkIcon className="w-5 h-5 text-dragon-fire" />
                    <span>Attune WebDisk Client</span>
                </h2>
                <button onClick={onClose} className="text-forge-text-secondary hover:text-forge-text-primary">
                    <CloseIcon className="w-5 h-5" />
                </button>
            </div>
            <div className="overflow-y-auto pr-2 text-forge-text-secondary leading-relaxed space-y-4">
                <p>
                    This ritual will permanently attune your local machine to our WebDisk Athenaeum. It configures <code className="font-mono text-xs">davfs2</code>, sets up credentials, and modifies <code className="font-mono text-xs">/etc/fstab</code> to automatically mount the WebDisk on demand.
                </p>
                 <p className="text-sm p-3 bg-magic-purple/10 border-l-4 border-magic-purple rounded">
                    <strong className="text-magic-purple">Connection Resilience Reforged:</strong> I have reforged this ritual to be more resilient, Architect. It now correctly configures <code className="font-mono text-xs">systemd's</code> automount service to ensure the WebDisk reconnects reliably after a reboot or network change.
                </p>
                <p className="text-sm p-3 bg-orc-steel/10 border-l-4 border-orc-steel rounded">
                   This incantation performs six sacred acts:
                   <ol className="list-decimal list-inside pl-2 mt-2 space-y-1">
                        <li><strong className="text-orc-steel">Verify Familiars:</strong> Ensures <code className="font-mono text-xs">davfs2</code> is installed.</li>
                        <li><strong className="text-orc-steel">Grant Authority:</strong> Adds your user to the <code className="font-mono text-xs">davfs2</code> group for mount permissions.</li>
                        <li><strong className="text-orc-steel">Create Sanctum:</strong> Creates the <code className="font-mono text-xs">~/WebDisk</code> mount point.</li>
                        <li><strong className="text-orc-steel">Scribe Secrets:</strong> Securely stores your WebDisk credentials and user configuration.</li>
                        <li><strong className="text-orc-steel">Etch the Rune:</strong> Adds a resilient, automount entry to <code className="font-mono text-xs">/etc/fstab</code>.</li>
                        <li><strong className="text-orc-steel">Verify Connection:</strong> Reloads daemons, mounts the drive, and lists its contents to confirm success.</li>
                   </ol>
                </p>
                <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">The Attunement Incantation</h3>
                <p>
                    Run this single command to re-attune your system for reliable WebDisk access.
                </p>
                 <CodeBlock lang="bash">{finalCommand}</CodeBlock>
            </div>
        </div>
    </div>
  );
};
