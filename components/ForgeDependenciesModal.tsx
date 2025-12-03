

import React, { useState } from 'react';
import { CloseIcon, PackageIcon } from './core/Icons';
import { CodeBlock } from './core/CodeBlock';

interface ForgeDependenciesModalProps {
  onClose: () => void;
}

// --- PHASE 1: THE FOUNDATION (v3.3 - The Raw Pact) ---
const PHASE_1_SCRIPT = String.raw`#!/bin/bash
set -euo pipefail

echo "--- Forge Dependencies Phase 1: The Foundation v3.3 (The Raw Pact) ---"
echo "Target: Config Purification, Keyring Refresh, Standard Tools, Chaotic-AUR."

# --- [1/5] THE FINAL PACT (Purification) ---
echo ""
echo "--> [1/5] Invoking The Final Pact to purify pacman configuration..."
BACKUP_FILE="/etc/pacman.conf.kael-deps.bak"
if [ ! -f "\${BACKUP_FILE}" ]; then
    sudo cp /etc/pacman.conf "\${BACKUP_FILE}"
fi

TMP_CLEAN=$(mktemp)
# This awk script removes known-bad diagnostic lines AND all [kael-os*] sections.
# It is more robust by not relying on start-of-line anchors.
awk '
    /-> Sanctified/ { next }
    /^\[kael-os/ { in_section=1; next }
    /^\[/ { in_section=0 }
    !in_section { print }
' "/etc/pacman.conf" > "\${TMP_CLEAN}"
sudo cp "\${TMP_CLEAN}" /etc/pacman.conf
rm "\${TMP_CLEAN}"
echo "✅ pacman.conf purified."

# --- [2/5] KEYRING REFRESH & BOOTSTRAP ---
echo ""
echo "--> [2/5] Refreshing Keyring & Installing Core..."
sudo pacman -Sy --needed --noconfirm archlinux-keyring
sudo pacman-key --init
sudo pacman-key --populate archlinux

echo "--> Installing Core Dependencies..."
sudo pacman -S --needed --noconfirm base-devel curl git openssh pacman-contrib pinentry
echo "✅ Core ready."

# --- [3/5] CHAOTIC-AUR & PARU ---
echo ""
echo "--> [3/5] Attuning Chaotic-AUR & Installing Paru..."
if ! grep -q "^\[chaotic-aur\]" /etc/pacman.conf; then
    echo "    -> Retrieving primary keys..."
    sudo pacman-key --recv-key 3056513887B78AEB --keyserver keyserver.ubuntu.com
    sudo pacman-key --lsign-key 3056513887B78AEB
    echo "    -> Installing chaotic-keyring and chaotic-mirrorlist..."
    sudo pacman -U --noconfirm 'https://cdn-mirror.chaotic.cx/chaotic-aur/chaotic-keyring.pkg.tar.zst' 'https://cdn-mirror.chaotic.cx/chaotic-aur/chaotic-mirrorlist.pkg.tar.zst'
    echo -e "\n[chaotic-aur]\nInclude = /etc/pacman.d/chaotic-mirrorlist" | sudo tee -a /etc/pacman.conf > /dev/null
fi
sudo pacman -Syu --noconfirm
sudo pacman -S --needed --noconfirm paru
echo "✅ Paru ready."

# --- [4/5] INSTALLING FORGE DEPENDENCIES ---
echo ""
echo "--> [4/5] Installing All Forge Dependencies..."
echo "    -> Network & Source Tools (rsync, davfs2, gh, git-lfs)..."
sudo pacman -S --needed --noconfirm rsync davfs2 github-cli git-lfs
echo "    -> Virtualization Stack (QEMU, Archiso)..."
sudo pacman -S --needed --noconfirm archiso qemu-desktop virt-manager virt-viewer dnsmasq vde2 bridge-utils openbsd-netcat libguestfs
echo "    -> Build & Asset Tools (Rust, Unzip, Fonts)..."
sudo pacman -S --needed --noconfirm unzip fontconfig gtk-update-icon-cache rust cargo
echo "✅ Tools installed."

# --- [5/5] GITHUB IDENTITY CHECK ---
echo ""
echo "--> [5/5] Verifying GitHub Identity..."
if command -v gh &> /dev/null && gh auth status &>/dev/null; then
    echo "✅ GitHub CLI is authenticated."
else
    echo "⚠️  GitHub CLI is not authenticated. Run 'gh auth login' to enable remote publishing."
fi

echo ""
echo "✨ Phase 1 Complete! Your system has all tools required to Forge."
`;

// --- PHASE 2: THE ATTUNEMENT (v3.3 - The Raw Pact) ---
const PHASE_2_SCRIPT = String.raw`#!/bin/bash
set -euo pipefail

echo "--- Forge Dependencies Phase 2: The Attunement v3.3 (The Raw Pact) ---"
echo "Target: Kael OS Repositories (Online-Only), GPG Trust, Sovereign Assets."

# --- [1/5] THE FINAL PACT (Purification) ---
echo ""
echo "--> [1/5] Invoking The Final Pact to ensure a clean slate..."
BACKUP_FILE="/etc/pacman.conf.kael-attune.bak"
if [ ! -f "\${BACKUP_FILE}" ]; then
    sudo cp /etc/pacman.conf "\${BACKUP_FILE}"
fi

TMP_CLEAN=$(mktemp)
# This awk script removes known-bad diagnostic lines AND all [kael-os*] sections.
awk '
    /-> Sanctified/ { next }
    /^\[kael-os/ { in_section=1; next }
    /^\[/ { in_section=0 }
    !in_section { print }
' "/etc/pacman.conf" > "\${TMP_CLEAN}"
sudo cp "\${TMP_CLEAN}" /etc/pacman.conf
rm "\${TMP_CLEAN}"
echo "✅ pacman.conf purified."


# --- [2/5] PROBING ATHENAEUM REACHABILITY ---
echo ""
echo "--> [2/5] Probing Athenaeum Reachability..."
GITHUB_URL="https://leetheorc.github.io/kael-os-repo/kael-os-repo.db"
WEBDISK_URL="https://leroyonline.co.za/leroy/forge/repo/kael-os-repo.db"

if curl --head --silent --fail "$GITHUB_URL" > /dev/null; then
    echo "✅ GitHub Athenaeum is reachable."
else
    echo "❌ GitHub Athenaeum appears unreachable."
fi
if curl --head --silent --fail "$WEBDISK_URL" > /dev/null; then
    echo "✅ WebDisk Athenaeum is reachable."
else
    echo "❌ WebDisk Athenaeum appears unreachable."
fi


# --- [3/5] ATTUNING ATHENAEUMS (THE UNIFYING PACT) ---
echo ""
echo "--> [3/5] Attuning to Kael OS Athenaeum..." >&2

# Trust Kael OS master key
if ! sudo pacman-key --list-keys "LeeTheOrc" >/dev/null 2>&1; then
    echo "    -> Trusting Kael OS master key..." >&2
    KEY_URL="https://raw.githubusercontent.com/LeeTheOrc/kael-os-repo/gh-pages/kael-os.asc"
    TEMP_KEY_FILE=$(mktemp)
    curl -fsSL "\${KEY_URL}" -o "\${TEMP_KEY_FILE}"
    KEY_ID=$(gpg --show-keys --with-colons "\${TEMP_KEY_FILE}" 2>/dev/null | grep '^pub' | cut -d: -f5)
    sudo pacman-key --add "\${TEMP_KEY_FILE}"
    sudo pacman-key --lsign-key "\${KEY_ID}"
    rm "\${TEMP_KEY_FILE}"
    echo "    ✅ Master key trusted." >&2
fi

# Update pacman.conf directly
echo "    -> Configuring pacman.conf directly..." >&2
# Enable Multilib
sudo sed -i "/^\[multilib\]/,/Include/"'s/^#//' /etc/pacman.conf
echo "    -> Multiverse (multilib) enabled." >&2

# We already cleaned the file, so we can just append. (NO TRAILING SLASHES)
{
    echo ""
    echo "# -- Kael OS Repository (Managed by Forge Dependencies Ritual) --"
    echo "[kael-os-repo]"
    echo "SigLevel = Required DatabaseOptional"
    echo "# Primary: GitHub Pages (Fast, Global)"
    echo "Server = https://leetheorc.github.io/kael-os-repo"
    echo "# Secondary: WebDisk (Redundant, Private)"
    echo "Server = https://leroyonline.co.za/leroy/forge/repo"
} | sudo tee -a /etc/pacman.conf > /dev/null
echo "    ✅ Repositories configured (Online-Only)." >&2

# --- [4/5] SYNC & INSTALL ARTIFACTS ---
echo ""
echo "--> [4/5] Syncing & Installing Kael Artifacts..." >&2
sudo pacman -Syy || echo "⚠️  Warning: Remote sync had errors. Proceeding..."

echo "    -> Attempting to install Sovereign Assets (Fonts & Icons)..." >&2
if sudo pacman -S --needed --noconfirm kaelic-fonts kaelic-icons; then
    echo "✅ Sovereign Assets installed from Athenaeum."
else
    echo "⚠️  Artifact install failed (Online repo might be empty or unreachable)."
fi

# --- [5/5] Final Message ---
echo ""
echo "✨ Phase 2 Complete. The Forge is Attuned."
`;

export const ForgeDependenciesModal: React.FC<ForgeDependenciesModalProps> = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState<'phase1' | 'phase2'>('phase1');

    const cmd1 = `echo "${btoa(unescape(encodeURIComponent(PHASE_1_SCRIPT)))}" | base64 --decode | bash`;
    const cmd2 = `echo "${btoa(unescape(encodeURIComponent(PHASE_2_SCRIPT)))}" | base64 --decode | bash`;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in-fast" onClick={onClose}>
            <div className="bg-forge-panel border-2 border-forge-border rounded-lg shadow-2xl w-full max-w-3xl p-6 m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                     <h2 className="text-xl font-bold text-forge-text-primary flex items-center gap-2 font-display tracking-wider">
                        <PackageIcon className="w-5 h-5 text-dragon-fire" />
                        <span>Install Forge Dependencies (v3.3 - The Raw Pact)</span>
                    </h2>
                    <button onClick={onClose} className="text-forge-text-secondary hover:text-forge-text-primary">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="flex gap-4 border-b border-forge-border mb-4">
                    <button 
                        onClick={() => setActiveTab('phase1')}
                        className={`pb-2 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'phase1' ? 'border-dragon-fire text-dragon-fire' : 'border-transparent text-forge-text-secondary hover:text-forge-text-primary'}`}
                    >
                        Phase 1: Foundation (v3.3)
                    </button>
                    <button 
                        onClick={() => setActiveTab('phase2')}
                        className={`pb-2 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'phase2' ? 'border-orc-steel text-orc-steel' : 'border-transparent text-forge-text-secondary hover:text-forge-text-primary'}`}
                    >
                        Phase 2: Attunement (v3.3)
                    </button>
                </div>

                <div className="overflow-y-auto pr-2 text-forge-text-secondary leading-relaxed space-y-4">
                    {activeTab === 'phase1' && (
                        <div className="animate-fade-in">
                            <p>
                                <strong className="text-dragon-fire">The Foundation:</strong> This ritual prepares a raw system. It installs standard build tools and sets up the <strong className="text-forge-text-primary">Chaotic-AUR</strong>.
                            </p>
                            <div className="text-sm p-3 bg-dragon-fire/10 border-l-4 border-dragon-fire rounded">
                                <strong className="text-dragon-fire">Update v3.3 (The Raw Pact):</strong> The incantation is now scribed using a more resilient method to prevent shell syntax errors.
                            </div>
                            <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">Phase 1 Incantation</h3>
                            <CodeBlock lang="bash">{cmd1}</CodeBlock>
                        </div>
                    )}

                    {activeTab === 'phase2' && (
                        <div className="animate-fade-in">
                            <p>
                                <strong className="text-orc-steel">The Attunement:</strong> This ritual connects your system to the <strong className="text-forge-text-primary">Kael OS Athenaeum</strong>.
                            </p>
                            <div className="text-sm p-3 bg-orc-steel/10 border-l-4 border-orc-steel rounded space-y-2">
                                <strong className="text-orc-steel">Update v3.3 (The Raw Pact):</strong>
                                <p>This ritual's logic is unified with 'Reconcile Repositories' and now uses a resilient scribing method to prevent shell errors.</p>
                            </div>
                            <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">Phase 2 Incantation</h3>
                            <CodeBlock lang="bash">{cmd2}</CodeBlock>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};