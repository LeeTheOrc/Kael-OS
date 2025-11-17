import React from 'react';
import { CloseIcon, KeyIcon } from '../core/Icons';
import { CodeBlock } from '../core/CodeBlock';

interface KeyBackupModalProps {
  onClose: () => void;
}

const BACKUP_SCRIPT_RAW = `#!/bin/bash
set -euo pipefail

echo "--- GPG Key Backup Ritual ---"
echo -e "\\n\\033[1;31mWARNING: Your private key is extremely sensitive. Keep this backup in a secure location.\\033[0m\\n"

# --- [1/4] Detect GPG Key ---
echo "--> [1/4] Detecting default GPG signing key..."
GPG_KEY_ID=""
if [ -f /etc/makepkg.conf ] && grep -q -E '^GPGKEY=' /etc/makepkg.conf; then
    GPG_KEY_ID=\$(grep -E '^GPGKEY=' /etc/makepkg.conf | head -1 | cut -d'=' -f2 | tr -d '[:space:]"')
fi
if [[ -z "\$GPG_KEY_ID" ]] && command -v git &>/dev/null && git config --global user.signingkey &>/dev/null; then
    GPG_KEY_ID=\$(git config --global user.signingkey)
fi
if [[ -z "\$GPG_KEY_ID" ]]; then
    GPG_KEY_ID=\$(gpg --list-secret-keys --with-colons | awk -F: '/^sec/{print \$5; exit}')
fi

if [[ -z "\$GPG_KEY_ID" ]]; then
    echo "❌ ERROR: Could not automatically detect a GPG signing key." >&2
    exit 1
fi
echo "✅ Key to be backed up: \$GPG_KEY_ID"
echo ""

# --- [2/4] Identify USB Drive ---
echo "--> [2/4] Identifying backup device..."
echo "Available storage devices:"
lsblk -dno NAME,SIZE,MODEL | sed 's/^/  /'
echo ""
read -p "Please enter the device name for your USB drive (e.g., sdb): " DEVICE_NAME < /dev/tty

if [[ -z "\$DEVICE_NAME" ]]; then
    echo "No device entered. Aborting."
    exit 1
fi

DEVICE_PATH="/dev/\$DEVICE_NAME"
if [ ! -b "\$DEVICE_PATH" ]; then
    echo "❌ ERROR: Device '\$DEVICE_PATH' is not a valid block device." >&2
    exit 1
fi
PARTITION_PATH=\$(ls \${DEVICE_PATH}?* 2>/dev/null | head -n 1)
if [[ -z "\$PARTITION_PATH" || ! -b "\$PARTITION_PATH" ]]; then
    echo "❌ ERROR: Could not find a partition on '\$DEVICE_PATH'. Please ensure it is partitioned and formatted." >&2
    exit 1
fi
echo "✅ Target partition selected: \$PARTITION_PATH"
echo ""

# --- [3/4] Confirmation ---
echo "--> [3/4] Confirmation"
echo "The following key will be exported:"
echo "  - GPG Key ID: \$GPG_KEY_ID"
echo "To the following partition:"
echo "  - Device: \$PARTITION_PATH"
read -p "Are you sure you want to proceed? (y/N) " -n 1 -r < /dev/tty
echo
if [[ ! \$REPLY =~ ^[Yy]$ ]]; then
    echo "Backup aborted."
    exit 0
fi
echo ""

# --- [4/4] Mount, Export, Unmount ---
echo "--> [4/4] Performing backup..."
MOUNT_POINT=\$(mktemp -d)
cleanup() {
    if mountpoint -q "\$MOUNT_POINT"; then
        echo "    -> Unmounting device..."
        sudo umount "\$MOUNT_POINT"
    fi
    sudo rmdir "\$MOUNT_POINT"
}
trap cleanup EXIT SIGINT SIGTERM

echo "    -> Mounting \$PARTITION_PATH at \$MOUNT_POINT..."
if ! sudo mount "\$PARTITION_PATH" "\$MOUNT_POINT"; then
    echo "❌ ERROR: Failed to mount the device." >&2
    echo "   Please ensure the partition is formatted with a readable filesystem (e.g., ext4, vfat)." >&2
    exit 1
fi

PUBLIC_KEY_FILE="\$MOUNT_POINT/kael_gpg_backup_\$(date +%F)_public.asc"
PRIVATE_KEY_FILE="\$MOUNT_POINT/kael_gpg_backup_\$(date +%F)_private.asc"

echo "    -> Exporting public key..."
gpg --armor --export "\$GPG_KEY_ID" > "\$PUBLIC_KEY_FILE"

echo "    -> Exporting private key..."
gpg --armor --export-secret-keys "\$GPG_KEY_ID" > "\$PRIVATE_KEY_FILE"

# The trap will handle unmounting.
# We call it explicitly here for clarity before disabling the trap for a clean exit.
cleanup
trap - EXIT

echo ""
echo "✨ Ritual Complete! Your GPG keys have been backed up."
echo "   Files are located on your USB drive:"
echo "     - \$(basename \$PUBLIC_KEY_FILE)"
echo "     - \$(basename \$PRIVATE_KEY_FILE)"
echo -e "\\n\\033[1;33mRemember to eject the USB drive safely and store it in a secure location.\\033[0m"
`;

export const KeyBackupModal: React.FC<KeyBackupModalProps> = ({ onClose }) => {
  const encodedScript = btoa(unescape(encodeURIComponent(BACKUP_SCRIPT_RAW)));
  const finalCommand = `echo "${encodedScript}" | base64 --decode | bash`;
  
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in-fast" onClick={onClose}>
        <div className="bg-forge-panel border-2 border-forge-border rounded-lg shadow-2xl w-full max-w-2xl p-6 m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                 <h2 className="text-xl font-bold text-forge-text-primary flex items-center gap-2 font-display tracking-wider">
                    <KeyIcon className="w-5 h-5 text-dragon-fire" />
                    <span>GPG Key Backup Ritual</span>
                </h2>
                <button onClick={onClose} className="text-forge-text-secondary hover:text-forge-text-primary">
                    <CloseIcon className="w-5 h-5" />
                </button>
            </div>
            <div className="overflow-y-auto pr-2 text-forge-text-secondary leading-relaxed space-y-4">
                <p className="text-lg text-dragon-fire/90">
                    <strong className="font-bold">CAUTION:</strong> This ritual will export your <strong className="text-dragon-fire">private GPG key</strong>. This key is the master key to your digital identity. Guard it well.
                </p>
                <p>
                    This incantation will guide you through safely exporting both your public and private GPG keys to a connected USB drive.
                </p>
                 <p className="text-sm p-3 bg-orc-steel/10 border-l-4 border-orc-steel rounded">
                   The ritual will first identify your GPG key and list all available storage devices. It will then ask you to confirm the target device before mounting it, exporting the keys, and safely unmounting it.
                </p>
                
                <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">The Backup Incantation</h3>
                <p>
                    Ensure your USB drive is connected, then run this command.
                </p>
                <CodeBlock lang="bash">{finalCommand}</CodeBlock>
            </div>
        </div>
    </div>
  );
};