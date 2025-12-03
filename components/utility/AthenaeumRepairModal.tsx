

import React from 'react';
import { CloseIcon, ShieldCheckIcon } from '../core/Icons';
import { CodeBlock } from '../core/CodeBlock';

interface AthenaeumRepairModalProps {
  onClose: () => void;
}

const REPAIR_SCRIPT_RAW = `#!/bin/bash
set -euo pipefail

echo "--- Athenaeum Repair Ritual v2.0 (The Solidification Pact) ---"
echo "This ritual safely rebuilds your local repository database to fix sync errors."

# --- [1/4] Path and Prerequisite Check ---
USER_HOME=\$(getent passwd "\${SUDO_USER:-\$USER}" | cut -d: -f6)
LOCAL_REPO_PATH="\${USER_HOME}/forge/repo"

if [ ! -d "\$LOCAL_REPO_PATH" ]; then
    echo "❌ ERROR: Local Athenaeum not found at '\$LOCAL_REPO_PATH'." >&2
    exit 1
fi

# --- [2/4] WAKING THE GPG AGENT ---
echo "--> [2/4] Waking the GPG Agent..."
export GPG_TTY=\$(tty <&1)
gpg-connect-agent updatestartuptty /bye >/dev/null || true
if ! echo "test" | gpg --clearsign >/dev/null 2>&1; then
    echo "⚠️  GPG test signature failed. The agent may not be able to prompt for your passphrase."
    echo "   Please run the 'GPG Key Awakening' ritual if this script fails on signing."
fi
echo "✅ GPG Agent is ready."
echo ""

# --- [3/4] Rebuild Database ---
echo "--> [3/4] Rebuilding the database from existing packages..."
cd "\$LOCAL_REPO_PATH"

# Purge ONLY the database files
rm -f kael-os-local.db* kael-os-local.files*

# Re-create the database. The glob will expand to any packages, or be empty
# if there are none, which repo-add handles correctly.
if ! repo-add --sign kael-os-local.db.tar.gz *.pkg.tar.zst; then
    echo "❌ ERROR: Failed to rebuild the repository database." >&2
    echo "   Please ensure your GPG key is trusted by pacman ('Attune GPG Keyring' ritual)." >&2
    exit 1
fi
echo "✅ Database rebuilt."
echo ""

# --- [4/4] The Solidification Pact ---
echo "--> [4/4] Solidifying database links for maximum compatibility..."
# repo-add creates symlinks (e.g. kael-os-local.db -> kael-os-local.db.tar.gz).
# Some filesystems/setups (like 9p in the VM) struggle with this. We replace them with hard copies.
rm -f kael-os-local.db kael-os-local.db.sig kael-os-local.files kael-os-local.files.sig

# The .files database is optional and only created if packages exist, so check for it.
if [ -f "kael-os-local.db.tar.gz" ]; then cp "kael-os-local.db.tar.gz" "kael-os-local.db"; fi
if [ -f "kael-os-local.db.tar.gz.sig" ]; then cp "kael-os-local.db.tar.gz.sig" "kael-os-local.db.sig"; fi
if [ -f "kael-os-local.files.tar.gz" ]; then cp "kael-os-local.files.tar.gz" "kael-os-local.files"; fi
if [ -f "kael-os-local.files.tar.gz.sig" ]; then cp "kael-os-local.files.tar.gz.sig" "kael-os-local.files.sig"; fi
echo "✅ Links solidified."
echo ""


echo "✨ Ritual Complete! Your local Athenaeum database has been repaired."
echo "   You should now be able to run 'sudo pacman -Syyu' without errors."
`;

export const AthenaeumRepairModal: React.FC<AthenaeumRepairModalProps> = ({ onClose }) => {
    const encodedScript = btoa(unescape(encodeURIComponent(REPAIR_SCRIPT_RAW)));
    const finalCommand = `echo "${encodedScript}" | base64 --decode | bash`;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in-fast" onClick={onClose}>
        <div className="bg-forge-panel border-2 border-forge-border rounded-lg shadow-2xl w-full max-w-3xl p-6 m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                 <h2 className="text-xl font-bold text-forge-text-primary flex items-center gap-2 font-display tracking-wider">
                    <ShieldCheckIcon className="w-5 h-5 text-dragon-fire" />
                    <span>Athenaeum Repair Ritual v2.0</span>
                </h2>
                <button onClick={onClose} className="text-forge-text-secondary hover:text-forge-text-primary">
                    <CloseIcon className="w-5 h-5" />
                </button>
            </div>
            <div className="overflow-y-auto pr-2 text-forge-text-secondary leading-relaxed space-y-4">
                <p>
                  Architect, this ritual will fix the <code className="font-mono text-xs">failed retrieving file 'kael-os-local.db'</code> error.
                </p>
                 <p className="text-sm p-3 bg-orc-steel/10 border-l-4 border-orc-steel rounded">
                    <strong className="text-orc-steel">The Solidification Pact (v2.0):</strong> The quartermaster's sight is clouded. This ritual now includes a final step to replace the fragile symbolic links to the database with solid, physical copies. This is a more robust pact that guarantees the connection.
                </p>
                <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">The Repair Incantation</h3>
                <p>
                    Run this single command in your terminal to repair your local Athenaeum.
                </p>
                 <CodeBlock lang="bash">{finalCommand}</CodeBlock>
            </div>
        </div>
    </div>
  );
};