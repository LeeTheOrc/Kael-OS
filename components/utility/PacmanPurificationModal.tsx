import React from 'react';
import { CloseIcon, BroomIcon } from '../core/Icons';
import { CodeBlock } from '../core/CodeBlock';

interface PacmanPurificationModalProps {
  onClose: () => void;
}

const STEP_1_PURGE_KEYS = `#!/bin/bash
set -euxo pipefail
set -x
echo "--> [1/9] Purging allied keyring packages..."
sudo pacman -Rns --noconfirm cachyos-keyring chaotic-keyring chaotic-mirrorlist &>/dev/null || true
echo "✅ Allied keyrings purged."
`;

const STEP_2_REMOVE_KAEL_KEYS = `#!/bin/bash
set -euxo pipefail
set -x
echo "--> [2/9] Removing Kael GPG keys from the pacman keyring..."
mapfile -t kael_keys < <(sudo pacman-key --list-keys "LeeTheOrc" 2>/dev/null | grep -oE '[A-Z0-9]{16,}' | tail -n 1)
if [ \${#kael_keys[@]} -gt 0 ]; then
    for key in "\${kael_keys[@]}"; do
        echo "    -> Deleting key: \$key"
        sudo pacman-key --delete "\$key"
    done
    echo "✅ Kael keys removed."
else
    echo "    -> No Kael keys found."
fi
`;

const STEP_3_CLEANSE_CONF = `#!/bin/bash
set -euxo pipefail
set -x
echo "--> [3/9] Cleansing /etc/pacman.conf..."
CONFIG_FILE="/etc/pacman.conf"
BACKUP_FILE="/etc/pacman.conf.kael-attune.bak"
if [ ! -f "\\$BACKUP_FILE" ]; then
    sudo cp "\\$CONFIG_FILE" "\\$BACKUP_FILE"
    echo "    -> Created backup: \\$BACKUP_FILE"
fi
TMP_CONFIG_PURGE=\$(mktemp)
trap 'rm -f -- "\\$TMP_CONFIG_PURGE"' EXIT
awk '
    /^\\\[kael-os-local\\\]/ { in_section=1; next }
    /^\\\[kael-os\\\]/       { in_section=1; next }
    /^\\\[cachyos.*\\\]/   { in_section=1; next }
    /^\\\[chaotic-aur\\\]/   { in_section=1; next }
    /^[ \\t]*\\[/      { in_section=0 }
    !in_section          { print }
' "\\$CONFIG_FILE" > "\\$TMP_CONFIG_PURGE"
cat "\\$TMP_CONFIG_PURGE" | sudo tee "\\$CONFIG_FILE" > /dev/null
echo "✅ pacman.conf has been purified."
`;

const STEP_4_BOOTSTRAP = `#!/bin/bash
set -euxo pipefail
set -x
echo "--> [4/9] Installing bootstrap tools (base-devel, curl)..."
sudo pacman -S --needed --noconfirm base-devel curl
echo "✅ Bootstrap tools are ready."
`;

const STEP_5_CACHYOS = `#!/bin/bash
set -euxo pipefail
set -x
echo "--> [5/9] Attuning to the CachyOS repository..."
TEMP_DIR=\$(mktemp -d)
trap 'rm -rf -- "\\$TEMP_DIR"' EXIT
(
    cd "\\$TEMP_DIR"
    curl -fsSL "https://mirror.cachyos.org/cachyos-repo.tar.xz" -o "cachyos-repo.tar.xz"
    tar xvf cachyos-repo.tar.xz > /dev/null
    cd cachyos-repo && yes | sudo ./cachyos-repo.sh
)
echo "✅ CachyOS repository attuned."
`;

const STEP_6_CHAOTIC = `#!/bin/bash
set -euxo pipefail
set -x
echo "--> [6/9] Attuning to the Chaotic-AUR..."
sudo pacman-key --recv-key 3056513887B78AEB --keyserver keyserver.ubuntu.com
sudo pacman-key --lsign-key 3056513887B78AEB
sudo pacman -U --noconfirm 'https://cdn-mirror.chaotic.cx/chaotic-aur/chaotic-keyring.pkg.tar.zst' 'https://cdn-mirror.chaotic.cx/chaotic-aur/chaotic-mirrorlist.pkg.tar.zst'
if ! grep -q "^\\[chaotic-aur\\]" /etc/pacman.conf; then
    echo -e "\\n[chaotic-aur]\\nInclude = /etc/pacman.d/chaotic-mirrorlist" | sudo tee -a /etc/pacman.conf > /dev/null
fi
echo "✅ Chaotic-AUR repository attuned."
`;

const STEP_7_KAEL_KEY = `#!/bin/bash
set -euxo pipefail
set -x
echo "--> [7/9] Attuning to the Kael OS GPG Key..."
KEY_URL="https://raw.githubusercontent.com/LeeTheOrc/kael-os-repo/gh-pages/kael-os.asc"
TEMP_KEY_FILE=\$(mktemp)
trap 'rm -f -- "\\$TEMP_KEY_FILE"' EXIT
curl -fsSL "\${KEY_URL}" -o "\${TEMP_KEY_FILE}"
KEY_ID=\$(gpg --show-keys --with-colons "\${TEMP_KEY_FILE}" 2>/dev/null | grep '^pub' | cut -d: -f5)
sudo pacman-key --add "\${TEMP_KEY_FILE}"
sudo pacman-key --lsign-key "\${KEY_ID}"
echo "✅ Kael OS master key trusted."
`;

const STEP_8_KAEL_REPO = `#!/bin/bash
set -euxo pipefail
set -x
echo "--> [8/9] Configuring Kael OS Repositories..."
CONFIG_FILE="/etc/pacman.conf"
MIRRORLIST_FILE="/etc/pacman.d/kael-os-mirrorlist"
TMP_MIRRORLIST=\$(mktemp)
trap 'rm -f -- "\\$TMP_MIRRORLIST"' EXIT
{
    echo "## Kael OS Athenaeum Mirrorlist"
    echo "Server = https://leetheorc.github.io/kael-os-repo/"
    echo "Server = https://leroyonline.co.za/leroyonline.co.za/leroy/forge/repo/"
} > "\\$TMP_MIRRORLIST"
sudo mkdir -p /etc/pacman.d
cat "\\$TMP_MIRRORLIST" | sudo tee "\\$MIRRORLIST_FILE" > /dev/null

# Use a heredoc to append the entry cleanly. The variables will be expanded.
sudo tee -a "\\$CONFIG_FILE" > /dev/null << EOF

[kael-os]
SigLevel = Required DatabaseOptional
Include = \\$MIRRORLIST_FILE
EOF
echo "✅ Kael OS Athenaeum configured."
`;

const STEP_9_FINALIZE = `#!/bin/bash
set -euxo pipefail
set -x
echo "--> [9/9] Finalizing setup..."
sudo pacman -Syy
sudo pacman -S --needed --noconfirm git pacman-contrib lftp github-cli chronicler davfs2
echo "✅ All forge tools installed."
`;

const createCommand = (script: string) => `echo "${btoa(unescape(encodeURIComponent(script)))}" | base64 --decode | bash`;

export const PacmanPurificationModal: React.FC<PacmanPurificationModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in-fast" onClick={onClose}>
        <div className="bg-forge-panel border-2 border-forge-border rounded-lg shadow-2xl w-full max-w-3xl p-6 m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                 <h2 className="text-xl font-bold text-forge-text-primary flex items-center gap-2 font-display tracking-wider">
                    <BroomIcon className="w-5 h-5 text-dragon-fire" />
                    <span>Purge & Reset Pacman Config</span>
                </h2>
                <button onClick={onClose} className="text-forge-text-secondary hover:text-forge-text-primary">
                    <CloseIcon className="w-5 h-5" />
                </button>
            </div>
            <div className="overflow-y-auto pr-2 text-forge-text-secondary leading-relaxed space-y-4">
                <p className="text-lg text-dragon-fire/90">
                    <strong className="font-bold">CAUTION:</strong> This is a powerful ritual that will reset and reinstall your package manager's configuration.
                </p>
                <p>
                    To find the true fault, we will perform this ritual in stages. Execute each incantation below in order.
                </p>
                
                <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">Part 1: Purification</h3>
                <p className="text-sm">Step 1: Purge allied keyring packages.</p>
                <CodeBlock lang="bash">{createCommand(STEP_1_PURGE_KEYS)}</CodeBlock>
                <p className="text-sm">Step 2: Remove any existing Kael OS GPG keys.</p>
                <CodeBlock lang="bash">{createCommand(STEP_2_REMOVE_KAEL_KEYS)}</CodeBlock>
                <p className="text-sm">Step 3: Cleanse <code className="font-mono text-xs">pacman.conf</code> of all managed repositories.</p>
                <CodeBlock lang="bash">{createCommand(STEP_3_CLEANSE_CONF)}</CodeBlock>

                <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">Part 2: Re-attunement</h3>
                <p className="text-sm">Step 4: Install bootstrap tools.</p>
                <CodeBlock lang="bash">{createCommand(STEP_4_BOOTSTRAP)}</CodeBlock>
                <p className="text-sm">Step 5: Attune to the CachyOS repository.</p>
                <CodeBlock lang="bash">{createCommand(STEP_5_CACHYOS)}</CodeBlock>
                <p className="text-sm">Step 6: Attune to the Chaotic-AUR repository.</p>
                <CodeBlock lang="bash">{createCommand(STEP_6_CHAOTIC)}</CodeBlock>
                <p className="text-sm">Step 7: Attune to the Kael OS GPG Key.</p>
                <CodeBlock lang="bash">{createCommand(STEP_7_KAEL_KEY)}</CodeBlock>
                <p className="text-sm">Step 8: Configure the Kael OS Repositories.</p>
                <CodeBlock lang="bash">{createCommand(STEP_8_KAEL_REPO)}</CodeBlock>
                <p className="text-sm">Step 9: Perform final synchronization and install all forge tools.</p>
                <CodeBlock lang="bash">{createCommand(STEP_9_FINALIZE)}</CodeBlock>
            </div>
        </div>
    </div>
  );
};