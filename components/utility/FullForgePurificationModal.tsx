import React from 'react';
import { CloseIcon, FlameIcon } from '../core/Icons';
import { CodeBlock } from '../core/CodeBlock';

interface FullForgePurificationModalProps {
  onClose: () => void;
}

const PURGE_SCRIPT_RAW = `#!/bin/bash
set -eu

echo "--- Full Forge Purification Ritual ---"
echo "WARNING: This is a destructive operation. It will remove ALL Kael OS forge"
echo "         files, packages, and configurations from your system."
echo ""

# Use /dev/tty to ensure we get user input even if piped
read -p "Are you absolutely sure you want to continue? (y/N) " -n 1 -r < /dev/tty
echo ""
if [[ ! \$REPLY =~ ^[Yy]$ ]]; then
    echo "Purification aborted."
    exit 1
fi

if [ "\$EUID" -ne 0 ]; then
  echo "❌ This script must be run with sudo." >&2
  exit 1
fi

# Get the original user who ran sudo
THE_USER="\${SUDO_USER:-\$USER}"
USER_HOME=\$(getent passwd "\$THE_USER" | cut -d: -f6)

echo "--> [1/9] Unmounting and disabling services..."
# Unmount first to release files
umount -l "\${USER_HOME}/WebDisk" &>/dev/null || true
umount -l "/var/lib/kael-local-repo" &>/dev/null || true

# Disable systemd units - dynamically find the escaped path
WEB_DISK_UNIT=\$(systemd-escape -p --suffix=automount "\${USER_HOME}/WebDisk")
LOCAL_REPO_UNIT=\$(systemd-escape -p --suffix=automount "/var/lib/kael-local-repo")
systemctl disable --now "\$WEB_DISK_UNIT" &>/dev/null || true
systemctl disable --now "\$LOCAL_REPO_UNIT" &>/dev/null || true
systemctl daemon-reload
echo "✅ Services disabled."

echo "--> [2/9] Removing Kael OS packages..."
# Use pacman to properly uninstall (Added khs to list)
pacman -Rns --noconfirm kaelic-terminal khs kaelic-hardware-scryer kael-shell chronicler kael-ai-configurator kael-cloud-core kael-local-core &>/dev/null || true
echo "✅ Packages removed."

echo "--> [3/9] Restoring system configurations..."
# Restore backups if they exist
if [ -f /etc/pacman.conf.kael-attune.bak ]; then
    mv /etc/pacman.conf.kael-attune.bak /etc/pacman.conf
    echo "    -> Restored pacman.conf from backup."
elif [ -f /etc/pacman.conf.kael-deps.bak ]; then
     mv /etc/pacman.conf.kael-deps.bak /etc/pacman.conf
     echo "    -> Restored pacman.conf from backup."
fi

if [ -f /etc/makepkg.conf.kael-path.bak ]; then
    mv /etc/makepkg.conf.kael-path.bak /etc/makepkg.conf
    echo "    -> Restored makepkg.conf from backup."
fi

# Clean fstab and davfs2
sed -i '/davfs/d' /etc/fstab &>/dev/null || true
sed -i '/leroyonline.co.za/d' /etc/davfs2/secrets &>/dev/null || true
sed -i '/use_locks 0/d' /etc/davfs2/davfs2.conf &>/dev/null || true
sed -i '/ignore_dav_header 1/d' /etc/davfs2/davfs2.conf &>/dev/null || true
echo "✅ System configs restored."

echo "--> [4/9] Removing systemd unit files..."
rm -f /etc/systemd/system/\$WEB_DISK_UNIT /etc/systemd/system/\${WEB_DISK_UNIT%.automount}.mount
rm -f /etc/systemd/system/\$LOCAL_REPO_UNIT /etc/systemd/system/\${LOCAL_REPO_UNIT%.automount}.mount
systemctl daemon-reload
echo "✅ Systemd units removed."

echo "--> [5/9] Removing user directories..."
# Run as the original user to handle permissions correctly
sudo -u "\$THE_USER" rm -rf "\${USER_HOME}/forge"
sudo -u "\$THE_USER" rm -rf "\${USER_HOME}/WebDisk"
sudo -u "\$THE_USER" rm -rf "\${USER_HOME}/.config/kael"
sudo -u "\$THE_USER" rm -f "\${USER_HOME}/.kael_history"
sudo -u "\$THE_USER" rm -rf "\${USER_HOME}/ChroniclesReports"
sudo -u "\$THE_USER" rm -rf "\${USER_HOME}/.local/share/chronicler"
echo "✅ User directories purged."

echo "--> [6/9] Removing installed binaries..."
rm -f /usr/local/bin/grand-concordance
rm -f /usr/local/bin/forge-and-publish
echo "✅ Binaries removed."

echo "--> [7/9] Cleaning shell configurations..."
sed -i '\|/usr/bin/kael-shell|d' /etc/shells &>/dev/null || true
echo "✅ Shell configs cleaned."

echo "--> [8/9] Untrusting GPG keys from pacman keyring..."
# Find the Architect's key
ARCHITECT_KEY=\$(sudo -u "\$THE_USER" gpg --list-secret-keys --with-colons | awk -F: '/^sec/{print \$5; exit}')
if [ -n "\$ARCHITECT_KEY" ]; then
    pacman-key --delete "\$ARCHITECT_KEY" &>/dev/null || true
    echo "    -> Removed Architect key (\$ARCHITECT_KEY) from pacman keyring."
fi
# Find Kael's key
KAEL_KEY_FINGERPRINT=\$(pacman-key -l | grep -B 1 "LeeTheOrc" | head -n 1 | awk '{print \$1}')
if [ -n "\$KAEL_KEY_FINGERPRINT" ]; then
    pacman-key --delete "\$KAEL_KEY_FINGERPRINT" &>/dev/null || true
    echo "    -> Removed Kael key (\$KAEL_KEY_FINGERPRINT) from pacman keyring."
fi
echo "✅ GPG keys untrusted."

echo "--> [9/9] Finalizing..."
pacman-key --refresh-keys &>/dev/null
echo ""
echo "✨ Purification Complete. The forge has been cleansed."
echo "   It is recommended to run 'sudo pacman -Syyu' to refresh your repositories."
`;

export const FullForgePurificationModal: React.FC<FullForgePurificationModalProps> = ({ onClose }) => {
    const finalCommand = `sudo bash <<'EOF'\n${PURGE_SCRIPT_RAW}\nEOF`;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in-fast" onClick={onClose}>
            <div className="bg-forge-panel border-2 border-red-500/50 rounded-lg shadow-2xl w-full max-w-3xl p-6 m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                     <h2 className="text-xl font-bold text-red-400 flex items-center gap-2 font-display tracking-wider">
                        <FlameIcon className="w-5 h-5" />
                        <span>Full Forge Purification Ritual</span>
                    </h2>
                    <button onClick={onClose} className="text-forge-text-secondary hover:text-forge-text-primary">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="overflow-y-auto pr-2 text-forge-text-secondary leading-relaxed space-y-4">
                    <p>
                        Architect, this is the ultimate rite of cleansing. It will <strong className="text-red-400">completely and irreversibly</strong> remove all traces of the Kael OS forge from your local system.
                    </p>
                    <p className="font-semibold text-dragon-fire">
                        This action cannot be undone. It is designed to give you a perfectly clean slate.
                    </p>
                     <div className="text-sm p-3 bg-red-900/20 border-l-4 border-red-500/70 rounded">
                        <strong className="text-red-400">This ritual will purge:</strong>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>All Kael OS packages (kaelic-terminal, chronicler, etc.).</li>
                            <li>The <code className="font-mono text-xs">~/forge</code> and <code className="font-mono text-xs">~/WebDisk</code> directories.</li>
                            <li>All related system configurations (<code className="font-mono text-xs">pacman.conf</code>, <code className="font-mono text-xs">makepkg.conf</code>, etc.).</li>
                            <li>All trusted GPG keys related to the forge.</li>
                            <li>All systemd services for automounting.</li>
                        </ul>
                    </div>
                    <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">The Purification Incantation</h3>
                    <p>
                        Run this single command. It will ask for your password and one final confirmation before proceeding.
                    </p>
                    <CodeBlock lang="bash">{finalCommand}</CodeBlock>
                </div>
            </div>
        </div>
    );
};
