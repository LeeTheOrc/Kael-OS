
import React, { useState } from 'react';
import { CloseIcon, ServerIcon } from '../../core/Icons';
import { CodeBlock } from '../../core/CodeBlock';

interface WebDiskAutomountModalProps {
  onClose: () => void;
}

const AUTOMOUNT_SCRIPT_RAW = `#!/bin/bash
set -euo pipefail

echo "--- WebDisk System Automount Ritual (Ghostbuster Edition v12) ---"
echo "Target: ~/WebDisk via native systemd automount."

# --- [1/4] CONFIGURATION ---
if ! command -v mount.davfs &>/dev/null; then
    echo "❌ 'davfs2' missing. Run 'sudo pacman -S davfs2'." >&2
    exit 1
fi

USER_NAME=$(whoami)
USER_GROUP=$(id -gn)
MOUNT_POINT="\$HOME/WebDisk"
# Legacy paths to clean up
OLD_MOUNT_POINT_1="\$HOME/webdisk"
OLD_MOUNT_POINT_2="\$HOME/forge/webdisk"

# URL Updated to include /leroy/ segment for correct parent mapping
WEBDAV_URL="https://leroyonline.co.za:2078/leroy/forge"
FTP_USER="leroy@leroyonline.co.za"
FTP_PASS="LeRoy0923!"

# System-wide config locations
SYS_SECRETS="/etc/davfs2/secrets"
SYS_CONF="/etc/davfs2/davfs2.conf"

# --- [2/4] PREPARE SYSTEM SECRETS ---
echo "--> Configuring system-wide credentials..."

if [ ! -d "/etc/davfs2" ]; then
    echo "❌ ERROR: /etc/davfs2 not found. Is davfs2 installed?" >&2
    exit 1
fi

# Append credentials
if ! sudo grep -Fq "\\$WEBDAV_URL" "\\$SYS_SECRETS"; then
    echo "    -> Adding credentials to \\$SYS_SECRETS..."
    echo "\\$WEBDAV_URL \\"\$FTP_USER\\" \\"\$FTP_PASS\\"" | sudo tee -a "\\$SYS_SECRETS" > /dev/null
    sudo chmod 600 "\\$SYS_SECRETS"
else
    echo "✅ Credentials already present."
fi

# Configure davfs2.conf
# 1. Disable locking (improves stability)
if ! sudo grep -q "use_locks 0" "\\$SYS_CONF"; then
    echo "    -> Disabling use_locks in \\$SYS_CONF..."
    echo "use_locks 0" | sudo tee -a "\\$SYS_CONF" > /dev/null
fi

# 2. Ignore DAV header (Fixes "server does not support WebDAV" errors)
if ! sudo grep -q "ignore_dav_header 1" "\\$SYS_CONF"; then
    echo "    -> Enabling ignore_dav_header in \\$SYS_CONF..."
    echo "ignore_dav_header 1" | sudo tee -a "\\$SYS_CONF" > /dev/null
fi


# --- [3/4] EXORCISM (The Cleanup) ---
echo "--> Exorcising ghosts..."

# EMERGENCY FIX: Aggressive lazy unmount of all potential targets
# We do this multiple times to be sure.
sudo umount -l "\\$MOUNT_POINT" 2>/dev/null || true
sudo umount -l "\\$OLD_MOUNT_POINT_1" 2>/dev/null || true
sudo umount -l "\\$OLD_MOUNT_POINT_2" 2>/dev/null || true

kill_unit() {
    UNIT=\$1
    # System
    if systemctl list-units --full --all | grep -q "\\$UNIT"; then
        sudo systemctl stop "\\$UNIT" 2>/dev/null || true
        sudo systemctl disable "\\$UNIT" 2>/dev/null || true
        sudo systemctl reset-failed "\\$UNIT" 2>/dev/null || true
        sudo rm -f "/etc/systemd/system/\\$UNIT" "/run/systemd/system/\\$UNIT" "/usr/lib/systemd/system/\\$UNIT"
    fi
    # User
    if systemctl --user list-units --full --all | grep -q "\\$UNIT"; then
        systemctl --user stop "\\$UNIT" 2>/dev/null || true
        systemctl --user disable "\\$UNIT" 2>/dev/null || true
        rm -f "\\$HOME/.config/systemd/user/\\$UNIT"
    fi
}

# Cleanup legacy/misnamed units
OLD_UNIT_1=\$(systemd-escape -p --suffix=automount "\\$OLD_MOUNT_POINT_1")
OLD_MOUNT_1="\\\${OLD_UNIT_1%.automount}.mount"
kill_unit "\\$OLD_UNIT_1"
kill_unit "\\$OLD_MOUNT_1"

kill_unit "kael-webdisk.service"
kill_unit "kael-webdisk.mount"
kill_unit "kael-webdisk.automount"
# Also kill current unit name to ensure clean slate
CURRENT_UNIT=\$(systemd-escape -p --suffix=automount "\\$MOUNT_POINT")
CURRENT_MOUNT="\\\${CURRENT_UNIT%.automount}.mount"
kill_unit "\\$CURRENT_UNIT"
kill_unit "\\$CURRENT_MOUNT"

# Reload systemd to drop dead units
sudo systemctl daemon-reload

# Scrub fstab
echo "--> Scrubbing /etc/fstab..."
# Use delimiter # to handle slashes in paths
if grep -q "davfs" /etc/fstab; then
    sudo sed -i "\\#\\$OLD_MOUNT_POINT_1#d" /etc/fstab
    sudo sed -i "\\#\\$OLD_MOUNT_POINT_2#d" /etc/fstab
    sudo sed -i "\\#\\$MOUNT_POINT#d" /etc/fstab
fi

# Cleanup empty old directories
if [ -d "\\$OLD_MOUNT_POINT_1" ] && [ -z "\$(ls -A "\\$OLD_MOUNT_POINT_1")" ]; then
    rmdir "\\$OLD_MOUNT_POINT_1" 2>/dev/null || true
fi


# --- [4/4] SETUP & ACTIVATE ---
echo "--> Scribing fstab..."
mkdir -p "\\$MOUNT_POINT"
# Explicitly set ownership to user NOW, before mounting covers it up.
# This fixes the "Folder is empty" issue if the mount fails or hasn't started.
sudo chown "\\$USER_NAME:\\$USER_GROUP" "\\$MOUNT_POINT"
chmod 755 "\\$MOUNT_POINT"

# OPTIONS:
# rw, uid/gid (map to user), _netdev (network wait), noauto (wait for trigger)
# x-systemd.automount (trigger on access)
# x-systemd.device-timeout=15s (Fail fast if network down)
OPTIONS="rw,uid=\\$USER_NAME,gid=\\$USER_GROUP,file_mode=0644,dir_mode=0755,_netdev,noauto,x-systemd.automount,x-systemd.idle-timeout=600,x-systemd.device-timeout=15s"

echo "\\$WEBDAV_URL \\$MOUNT_POINT davfs \\$OPTIONS 0 0" | sudo tee -a /etc/fstab > /dev/null

echo "--> Activating..."
sudo systemctl daemon-reload
sudo systemctl restart remote-fs.target

# New unit name calculated dynamically
NEW_AUTO_UNIT=\$(systemd-escape -p --suffix=automount "\\$MOUNT_POINT")
sudo systemctl restart "\\$NEW_AUTO_UNIT"

echo "--> Probing..."
# Force access to trigger mount
ls -F "\\$MOUNT_POINT" >/dev/null 2>&1 || true

if mountpoint -q "\\$MOUNT_POINT"; then
    echo "✅ Automount ACTIVE at \\$MOUNT_POINT"
    # Check if empty (ignoring lost+found which is common on remote servers)
    if [ -z "\$(ls -A "\\$MOUNT_POINT" | grep -v "lost+found")" ]; then
        echo "    (Folder is effectively empty. Run 'WebDisk Manual Sync' to populate it.)"
    else
        echo "    (Artifacts detected. Ritual successful.)"
    fi
elif systemctl is-active --quiet "\\$NEW_AUTO_UNIT"; then
    echo "✅ Automount ARMED (Waiting for access)"
    echo "    (Accessing \\$MOUNT_POINT will trigger the connection)"
else
    echo "⚠️  Probe result unclear. Check 'systemctl status \\$NEW_AUTO_UNIT'"
fi

echo ""
echo "✨ Ritual Complete!"
`;


export const WebDiskAutomountModal: React.FC<WebDiskAutomountModalProps> = ({ onClose }) => {
    const encodedAutomount = btoa(unescape(encodeURIComponent(AUTOMOUNT_SCRIPT_RAW)));
    const automountCommand = `echo "${encodedAutomount}" | base64 --decode | bash`;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in-fast" onClick={onClose}>
            <div className="bg-forge-panel border-2 border-forge-border rounded-lg shadow-2xl w-full max-w-3xl p-6 m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                     <h2 className="text-xl font-bold text-forge-text-primary flex items-center gap-2 font-display tracking-wider">
                        <ServerIcon className="w-5 h-5 text-dragon-fire" />
                        <span>System Automount WebDisk</span>
                    </h2>
                    <button onClick={onClose} className="text-forge-text-secondary hover:text-forge-text-primary">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="overflow-y-auto pr-2 text-forge-text-secondary leading-relaxed space-y-4">
                    <p>
                        Architect, this ritual configures a persistent, system-managed connection to your WebDisk.
                    </p>
                    <p className="text-sm p-3 bg-orc-steel/10 border-l-4 border-orc-steel rounded">
                        This <strong className="text-orc-steel">Ghostbuster Edition v12</strong> ritual uses the port and updated path revealed by your scrying to target <code className="font-mono text-xs">https://leroyonline.co.za:2078/leroy/forge</code>. This ensures your local <code className="font-mono text-xs">~/WebDisk</code> correctly maps to the <code className="font-mono text-xs">forge</code> directory.
                    </p>

                    <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">The Exorcism Incantation</h3>
                    <p>
                        Run this command to clear the ghosts and remount correctly.
                    </p>
                    <CodeBlock lang="bash">{automountCommand}</CodeBlock>

                </div>
            </div>
        </div>
    );
};
