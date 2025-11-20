
import React from 'react';
import { CloseIcon, UsbDriveIcon } from '../core/Icons';
import { CodeBlock } from '../core/CodeBlock';

interface KeyBackupModalProps {
  onClose: () => void;
}

const BACKUP_SCRIPT_RAW = `#!/bin/bash
set -euo pipefail

echo "--- GPG Key Backup Ritual ---"
read -p "Enter the email or Key ID of the GPG key to back up: " GPG_IDENTIFIER
read -p "Enter path for the backup file (e.g., /media/usb/mykey.asc): " BACKUP_PATH

if [ -z "\$GPG_IDENTIFIER" ] || [ -z "\$BACKUP_PATH" ]; then
    echo "❌ ERROR: Key identifier and backup path cannot be empty." >&2
    exit 1
fi

echo "--> Exporting public and private keys for '\$GPG_IDENTIFIER'..."
gpg --export-secret-keys --armor "\$GPG_IDENTIFIER" > "\$BACKUP_PATH"

echo "✅ Backup Complete! The key has been backed up to \$BACKUP_PATH"
echo "   Keep this file safe and secure."
`;

const RESTORE_SCRIPT_RAW = `#!/bin/bash
set -euo pipefail

echo "--- GPG Key Restore Ritual ---"
read -p "Enter the path to the backup file to restore (e.g., /media/usb/mykey.asc): " BACKUP_PATH

if [ ! -f "\$BACKUP_PATH" ]; then
    echo "❌ ERROR: Backup file not found at '\$BACKUP_PATH'" >&2
    exit 1
fi

echo "--> Importing key from backup..."
gpg --import "\$BACKUP_PATH"

echo "--> You may need to trust the newly imported key. To do so:"
echo "    1. Get the key ID: gpg --list-keys"
echo "    2. Edit the key: gpg --edit-key <KEY_ID>"
echo "    3. In the gpg prompt, type: trust"
echo "    4. Choose level 5 (ultimate trust), then type: quit"
echo "✅ Restore Complete!"
`;

export const KeyBackupModal: React.FC<KeyBackupModalProps> = ({ onClose }) => {
    const encodedBackup = btoa(unescape(encodeURIComponent(BACKUP_SCRIPT_RAW)));
    const backupCommand = `echo "${encodedBackup}" | base64 --decode | bash`;
    
    const encodedRestore = btoa(unescape(encodeURIComponent(RESTORE_SCRIPT_RAW)));
    const restoreCommand = `echo "${encodedRestore}" | base64 --decode | bash`;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in-fast" onClick={onClose}>
            <div className="bg-forge-panel border-2 border-forge-border rounded-lg shadow-2xl w-full max-w-3xl p-6 m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                     <h2 className="text-xl font-bold text-forge-text-primary flex items-center gap-2 font-display tracking-wider">
                        <UsbDriveIcon className="w-5 h-5 text-dragon-fire" />
                        <span>GPG Key Backup & Restore</span>
                    </h2>
                    <button onClick={onClose} className="text-forge-text-secondary hover:text-forge-text-primary">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="overflow-y-auto pr-2 text-forge-text-secondary leading-relaxed space-y-4">
                    <p>
                        A wise precaution, Architect. A GPG key is the heart of your identity in the forge. These rituals allow you to create a secure, portable backup of your key and restore it when needed.
                    </p>
                    
                    <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">Backup Ritual</h3>
                    <p>
                        This incantation will export your secret GPG key to a single armored file. Store this file on a secure, external device.
                    </p>
                    <CodeBlock lang="bash">{backupCommand}</CodeBlock>

                     <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">Restore Ritual</h3>
                    <p>
                        This incantation will import a GPG key from a backup file, restoring your identity to a new system.
                    </p>
                    <CodeBlock lang="bash">{restoreCommand}</CodeBlock>
                </div>
            </div>
        </div>
    );
};
