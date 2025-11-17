import React from 'react';
import { CloseIcon, HammerIcon } from '../core/Icons';
import { CodeBlock } from '../core/CodeBlock';

interface FullForgeAttunementModalProps {
  onClose: () => void;
}

const ATTUNEMENT_SCRIPT_RAW = `#!/bin/bash
set -euo pipefail

echo "--- Full Forge Attunement Ritual ---"
echo "This grand ritual prepares your system, attunes all keyrings, sanctifies your local forge, and installs all required tools."
echo ""

# --- GLOBAL VARS & CLEANUP ---
THE_USER="\${SUDO_USER:-\$USER}"
USER_HOME=\$(getent passwd "\$THE_USER" | cut -d: -f6)
LOCAL_REPO_PATH="\$USER_HOME/forge/repo"
SYSTEM_REPO_DIR="/var/lib/kael-local-repo" # System-level mount point

TEMP_KEY_FILE=""
TMP_CONFIG=""
TEMP_DIR_CACHY=""

cleanup() {
    # Unmount bind mount if it exists
    if mountpoint -q "\$SYSTEM_REPO_DIR" 2>/dev/null; then
        echo "--> Dismantling temporary system-wide access point..."
        sudo umount "\$SYSTEM_REPO_DIR"
    fi
    # Remove system dir if it exists
    if [ -d "\$SYSTEM_REPO_DIR" ]; then
        sudo rm -rf "\$SYSTEM_REPO_DIR"
    fi
    # Remove any temp files/dirs
    [[ -n "\$TEMP_KEY_FILE" && -f "\$TEMP_KEY_FILE" ]] && rm -f -- "\$TEMP_KEY_FILE"
    [[ -n "\$TMP_CONFIG" && -f "\$TMP_CONFIG" ]] && rm -f -- "\$TMP_CONFIG"
    [[ -n "\$TEMP_DIR_CACHY" && -d "\$TEMP_DIR_CACHY" ]] && rm -rf -- "\$TEMP_DIR_CACHY"
}
trap cleanup EXIT SIGINT SIGTERM

# --- [1/8] Define User and Paths (already done) ---
echo "--> [1/8] Identifying the Architect and Forge..."
echo "    -> Operating as user: \$THE_USER"
echo "    -> Local Forge Path: \$USER_HOME/forge"
echo ""

# --- [2/8] Prerequisite Checks ---
echo "--> [2/8] Verifying prerequisites (git, gh, auth)..."
if ! command -v git &>/dev/null || ! command -v gh &>/dev/null; then
    echo "    -> 'git' or 'gh' not found. Installing bootstrap tools..."
    sudo pacman -S --needed --noconfirm git github-cli
fi
if ! gh auth status &>/dev/null; then
    echo "❌ ERROR: You are not authenticated with GitHub." >&2
    echo "   Please run 'gh auth login' and then re-run this ritual." >&2
    exit 1
fi
echo "✅ Prerequisites satisfied."
echo ""

# --- [3/8] GPG Keyring Attunement ---
echo "--> [3/8] Attuning your GPG Key to the system..."
GPG_KEY_ID=\$(gpg --list-secret-keys --with-colons | awk -F: '/^sec/{print \$5; exit}')
if [[ -z "\$GPG_KEY_ID" ]]; then
    echo "❌ ERROR: Could not automatically detect a GPG signing key." >&2
    exit 1
fi
echo "    -> Detected key: \$GPG_KEY_ID"

sudo pacman-key --init
sudo pacman-key --populate archlinux
TEMP_KEY_FILE=\$(mktemp)
gpg --armor --export "\$GPG_KEY_ID" > "\$TEMP_KEY_FILE"
sudo pacman-key --add "\$TEMP_KEY_FILE"
sudo pacman-key --lsign-key "\$GPG_KEY_ID"
echo "✅ Pacman now trusts your key."
echo ""

# --- [4/8] Sanctify Local Athenaeum ---
echo "--> [4/8] Sanctifying Local Athenaeum at '\$LOCAL_REPO_PATH'..."
if [ ! -d "\$LOCAL_REPO_PATH" ]; then
    echo "    -> Creating Athenaeum directory..."
    sudo -u "\$THE_USER" mkdir -p "\$LOCAL_REPO_PATH"
fi
# This section runs as the user to handle GPG operations correctly.
sudo -u "\$THE_USER" bash -c '
    set -euo pipefail
    REPO_DB="\$HOME/forge/repo/kael-os-local.db.tar.gz"
    GPG_KEY_ID=\$(gpg --list-secret-keys --with-colons | awk -F: "/^sec/{print \\\$5; exit}")

    echo "    -> Removing old database files..."
    rm -f \$HOME/forge/repo/kael-os-local.db*
    rm -f \$HOME/forge/repo/kael-os.db*
    
    echo "    -> Priming GPG agent..."
    export GPG_TTY=\$(tty)
    gpg-connect-agent /bye &>/dev/null || true
    echo "Kael is priming the agent" | gpg --clearsign --default-key "\$GPG_KEY_ID" > /dev/null
    
    echo "    -> Building and signing new database..."
    shopt -s nullglob
    PKG_FILES=(\$HOME/forge/repo/*.pkg.tar.zst)
    shopt -u nullglob
    
    if [ \${#PKG_FILES[@]} -gt 0 ]; then
        repo-add --sign --remove "\$REPO_DB" "\${PKG_FILES[@]}"
    else
        tar -czf "\$REPO_DB" --files-from /dev/null
        gpg --default-key "\$GPG_KEY_ID" --detach-sign "\$REPO_DB"
    fi
    
    echo "    -> Creating compatibility symlinks..."
    (
        cd \$HOME/forge/repo
        ln -sf kael-os-local.db.tar.gz kael-os-local.db
        ln -sf kael-os-local.db.tar.gz.sig kael-os-local.db.sig
        ln -sf kael-os-local.db.tar.gz kael-os.db
        ln -sf kael-os-local.db.tar.gz.sig kael-os.db.sig
    )
'
echo "✅ Local Athenaeum is sanctified."
echo ""

# --- [5/8] & [6/8] Attune Allied Repos ---
echo "--> [5/8] Attuning to CachyOS..."
if ! pacman -Q cachyos-keyring > /dev/null 2>&1; then
    TEMP_DIR_CACHY=\$(mktemp -d)
    (
        cd "\$TEMP_DIR_CACHY"
        curl -fsSL "https://mirror.cachyos.org/cachyos-repo.tar.xz" -o c.tar.xz && tar xf c.tar.xz && cd cachyos-repo && yes | sudo ./cachyos-repo.sh
    )
fi
echo "✅ CachyOS attuned."

echo "--> [6/8] Attuning to Chaotic-AUR..."
if ! pacman -Q chaotic-keyring > /dev/null 2>&1; then
    sudo pacman-key --recv-key 3056513887B78AEB --keyserver keyserver.ubuntu.com
    sudo pacman-key --lsign-key 3056513887B78AEB
    sudo pacman -U --noconfirm 'https://cdn-mirror.chaotic.cx/chaotic-aur/chaotic-keyring.pkg.tar.zst' 'https://cdn-mirror.chaotic.cx/chaotic-aur/chaotic-mirrorlist.pkg.tar.zst'
fi
echo "✅ Chaotic-AUR attuned."
echo ""

# --- [7/8] Configure All Repositories ---
echo "--> [7/8] Re-scribing /etc/pacman.conf with correct priority..."
CONFIG_FILE="/etc/pacman.conf"
sudo cp "\$CONFIG_FILE" "\$CONFIG_FILE.attune.bak"

echo "    -> Creating system-wide access point for local forge..."
sudo mkdir -p "\$SYSTEM_REPO_DIR"
sudo mount --bind "\$LOCAL_REPO_PATH" "\$SYSTEM_REPO_DIR"
LOCAL_REPO_SERVER="file://\$SYSTEM_REPO_DIR"

TMP_CONFIG=\$(mktemp)
(
    # Local Repo
    echo "[kael-os-local]"
    echo "SigLevel = Required DatabaseRequired"
    echo "Server = \$LOCAL_REPO_SERVER"
    echo ""
    # Online Repo
    echo "[kael-os]"
    echo "SigLevel = Required DatabaseOptional"
    echo "Include = /etc/pacman.d/kael-os-mirrorlist"
    echo ""
    # Chaotic-AUR
    echo "[chaotic-aur]"
    echo "Include = /etc/pacman.d/chaotic-mirrorlist"
    echo ""
    # Append the rest of the original config, filtering out our managed sections
    awk '/^\\\[(kael-os-local|kael-os|chaotic-aur)\\]/{p=0;next} /^\\[/{p=1} p' "\$CONFIG_FILE"
) > "\$TMP_CONFIG"
cat "\$TMP_CONFIG" | sudo tee "\$CONFIG_FILE" > /dev/null
# Create the Kael mirrorlist
{
    echo "## Kael OS Athenaeum Mirrorlist"
    echo "Server = https://leetheorc.github.io/kael-os-repo/"
    echo "Server = https://leroyonline.co.za/leroyonline.co.za/leroy/forge/repo/"
} | sudo tee /etc/pacman.d/kael-os-mirrorlist > /dev/null
echo "✅ pacman.conf re-forged."
echo ""

# --- [8/8] Finalize ---
echo "--> [8/8] Synchronizing databases and installing tools..."
sudo pacman -Syyu --noconfirm
sudo pacman -S --needed --noconfirm pacman-contrib lftp chronicler davfs2
echo "✅ All forge tools installed."
echo ""
echo "✨ Grand Attunement Ritual Complete! Your forge is ready."
`

export const FullForgeAttunementModal: React.FC<FullForgeAttunementModalProps> = ({ onClose }) => {
    const finalCommand = `echo "${btoa(unescape(encodeURIComponent(ATTUNEMENT_SCRIPT_RAW)))}" | base64 --decode | bash`;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in-fast" onClick={onClose}>
        <div className="bg-forge-panel border-2 border-forge-border rounded-lg shadow-2xl w-full max-w-3xl p-6 m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                 <h2 className="text-xl font-bold text-forge-text-primary flex items-center gap-2 font-display tracking-wider">
                    <HammerIcon className="w-5 h-5 text-dragon-fire" />
                    <span>Full Forge Attunement</span>
                </h2>
                <button onClick={onClose} className="text-forge-text-secondary hover:text-forge-text-primary">
                    <CloseIcon className="w-5 h-5" />
                </button>
            </div>
            <div className="overflow-y-auto pr-2 text-forge-text-secondary leading-relaxed space-y-4">
                <p>
                    This is the grand ritual of attunement, Architect. It replaces three older rituals with a single, intelligent incantation that fully prepares your system for forging artifacts.
                </p>
                <p className="text-sm p-3 bg-orc-steel/10 border-l-4 border-orc-steel rounded">
                   This unified ritual performs every necessary step:
                   <ol className="list-decimal list-inside pl-2 mt-2 space-y-1">
                        <li><strong className="text-orc-steel">Verifies Prerequisites:</strong> Checks for git, gh, and GitHub authentication.</li>
                        <li><strong className="text-orc-steel">Attunes GPG Key:</strong> Makes your personal GPG key trusted by the system.</li>
                        <li><strong className="text-orc-steel">Sanctifies Local Athenaeum:</strong> Creates and signs your local package repository database.</li>
                        <li><strong className="text-orc-steel">Attunes Allied Repos:</strong> Configures CachyOS and Chaotic-AUR repositories.</li>
                        <li><strong className="text-orc-steel">Configures Kael Repos:</strong> Rebuilds <code className="font-mono text-xs">pacman.conf</code> to grant your local and online Athenaeums top priority.</li>
                        <li><strong className="text-orc-steel">Installs All Tools:</strong> Synchronizes databases and installs all required forge tools.</li>
                   </ol>
                </p>
                <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">The Attunement Incantation</h3>
                <p>
                    After running the 'Setup Local Forge' ritual, run this single command to complete your forge's preparation.
                </p>
                <CodeBlock lang="bash">{finalCommand}</CodeBlock>
            </div>
        </div>
    </div>
  );
};