

import React from 'react';
import { CloseIcon, SignalIcon } from '../core/Icons';
import { CodeBlock } from '../core/CodeBlock';

interface ForgeReconciliationModalProps {
  onClose: () => void;
}

const UNIFIED_SCRIPT_RAW = String.raw`#!/bin/bash
set -euo pipefail

echo "--- Reconcile Repositories (v2.3 - The Raw Pact) ---"
echo "This unified ritual corrects repository configurations to fix 404 errors."

# --- CONFIGURATION & GLOBAL VARS ---
USER_HOME=$(getent passwd "\${SUDO_USER:-\$USER}" | cut -d: -f6)
PACMAN_CONF="/etc/pacman.conf"
TMP_CONFIG=""

# --- GLOBAL CLEANUP TRAP ---
cleanup() {
    [[ -n "\${TMP_CONFIG}" && -f "\${TMP_CONFIG}" ]] && rm -f -- "\${TMP_CONFIG}"
}
trap cleanup EXIT SIGINT SIGTERM


# --- [1/3] PROBING ATHENAEUM REACHABILITY ---
echo ""
echo "--- [1/3] Probing Athenaeum Reachability... ---"
GITHUB_URL="https://leetheorc.github.io/kael-os-repo/kael-os-repo.db"
WEBDISK_URL="https://leroyonline.co.za/leroy/forge/repo/kael-os-repo.db"

if curl --head --silent --fail "\${GITHUB_URL}" > /dev/null; then
    echo "✅ GitHub Athenaeum is reachable."
else
    echo "❌ GitHub Athenaeum appears unreachable. Pacman sync will likely fail."
fi
if curl --head --silent --fail "\${WEBDISK_URL}" > /dev/null; then
    echo "✅ WebDisk Athenaeum is reachable."
else
    echo "❌ WebDisk Athenaeum appears unreachable. Pacman sync will likely fail."
fi


# --- [2/3] TRUST KAEL OS & CONFIGURE PACMAN.CONF ---
echo ""
echo "--- [2/3] Trusting Kael OS & Re-configuring pacman.conf... ---"

# Trust Kael OS master key
if ! sudo pacman-key --list-keys "LeeTheOrc" >/dev/null 2>&1; then
    echo "--> Trusting Kael OS master key..."
    KEY_URL="https://raw.githubusercontent.com/LeeTheOrc/kael-os-repo/gh-pages/kael-os.asc"
    TEMP_KEY_FILE=$(mktemp)
    curl -fsSL "\${KEY_URL}" -o "\${TEMP_KEY_FILE}"
    KAEL_KEY_ID=$(gpg --show-keys --with-colons "\${TEMP_KEY_FILE}" 2>/dev/null | grep '^pub' | cut -d: -f5)
    sudo pacman-key --add "\${TEMP_KEY_FILE}"
    sudo pacman-key --lsign-key "\${KAEL_KEY_ID}"
    rm -f "\${TEMP_KEY_FILE}"
fi
echo "--> Kael OS master key is trusted."

# Atomically update pacman.conf
echo "--> Scribing all repository paths directly into pacman.conf..."
BACKUP_FILE="/etc/pacman.conf.kael-reconcile.bak"
if [ ! -f "\${BACKUP_FILE}" ]; then sudo cp "\${PACMAN_CONF}" "\${BACKUP_FILE}"; fi

TMP_CONFIG=$(mktemp)

# A: Filter old config (regex /kael-os/ matches kael-os and kael-os-repo)
awk '
    /^\[kael-os/ { in_section=1; next }
    /^\s*\[/            { in_section=0 }
    !in_section         { print }
' "\${PACMAN_CONF}" > "\${TMP_CONFIG}"

# B: Append our managed repo section with the TRUE NAME
{
    echo ""
    echo "# -- Kael OS Repository (Managed by Reconciliation Ritual) --"
    echo "[kael-os-repo]"
    echo "SigLevel = Required DatabaseOptional"
    echo "# Primary: GitHub Pages (Fast, Global)"
    echo "Server = https://leetheorc.github.io/kael-os-repo"
    echo "# Secondary: WebDisk (Redundant, Private)"
    echo "Server = https://leroyonline.co.za/leroy/forge/repo"
} >> "\${TMP_CONFIG}"

# C: Apply
cat "\${TMP_CONFIG}" | sudo tee "\${PACMAN_CONF}" > /dev/null
echo "✅ pacman.conf reconciled."


# --- [3/3] SYNCHRONIZE ---
echo ""
echo "--- [3/3] Synchronizing Databases... ---"
sudo pacman -Syyu

echo ""
echo "✨ Reconciliation Ritual Complete! Repository errors should now be resolved."
`;


export const ForgeReconciliationModal: React.FC<ForgeReconciliationModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in-fast" onClick={onClose}>
        <div className="bg-forge-panel border-2 border-forge-border rounded-lg shadow-2xl w-full max-w-3xl p-6 m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                 <h2 className="text-xl font-bold text-forge-text-primary flex items-center gap-2 font-display tracking-wider">
                    <SignalIcon className="w-5 h-5 text-dragon-fire" />
                    <span>Reconcile Repositories (v2.3)</span>
                </h2>
                <button onClick={onClose} className="text-forge-text-secondary hover:text-forge-text-primary">
                    <CloseIcon className="w-5 h-5" />
                </button>
            </div>
            <div className="overflow-y-auto pr-2 text-forge-text-secondary leading-relaxed space-y-6">
                <p>
                    Architect, this ritual will reconcile your system's repository configuration with the <strong className="text-dragon-fire">The Raw Pact (v2.3)</strong> to resolve configuration and 404 errors.
                </p>
                
                <div className="bg-forge-bg/50 p-4 rounded-lg border border-orc-steel/30 shadow-[0_0_15px_rgba(122,235,190,0.1)]">
                    <h3 className="font-bold text-orc-steel font-display flex items-center gap-2 mb-2 text-lg">
                        The Raw Pact (v2.3)
                    </h3>
                    <p className="text-sm mb-3 text-forge-text-primary">
                       This incantation is now the single source of truth for repository configuration. It uses a resilient scribing method to prevent shell syntax errors, guaranteeing a correct and consistent configuration.
                    </p>
                    <CodeBlock lang="bash">{`echo "${btoa(unescape(encodeURIComponent(UNIFIED_SCRIPT_RAW)))}" | base64 --decode | bash`}</CodeBlock>
                </div>
            </div>
        </div>
    </div>
  );
};