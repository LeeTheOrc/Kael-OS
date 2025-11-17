import React from 'react';
import { CloseIcon, ArrowDownTrayIcon } from '../core/Icons';
import { CodeBlock } from '../core/CodeBlock';

interface ForgeReconciliationModalProps {
  onClose: () => void;
}

const GRAND_SETUP_SCRIPT_RAW = `#!/bin/bash
set -euo pipefail

echo "--- Grand Forge Setup & Reconciliation Ritual ---"
echo "This unified ritual prepares your local forge, configures paths, and synchronizes with all remote sources."
echo ""

# --- [1/6] Prerequisite Check ---
echo "--> [1/6] Checking for required familiars (git, gh) and authentication..."
if ! command -v git &> /dev/null || ! command -v gh &> /dev/null; then
    echo "    -> 'git' or 'gh' not found. Installing..."
    sudo pacman -S --needed --noconfirm git github-cli
fi
if ! gh auth status &>/dev/null; then
    echo "❌ ERROR: You are not logged into GitHub." >&2
    echo "   Please run 'gh auth login' and follow the prompts, then re-run this ritual." >&2
    exit 1
fi
echo "✅ Prerequisites satisfied."
echo ""

# --- [2/6] Directory Structure ---
THE_USER="\${SUDO_USER:-\$USER}"
USER_HOME=\$(getent passwd "\$THE_USER" | cut -d: -f6)
FORGE_BASE="\$USER_HOME/forge"
echo "--> [2/6] Forging the directory structure at \${FORGE_BASE}..."
mkdir -p "\$FORGE_BASE/kael"
mkdir -p "\$FORGE_BASE/repo"
mkdir -p "\$FORGE_BASE/packages"
mkdir -p "\$FORGE_BASE/sources"
mkdir -p "\$FORGE_BASE/build"
mkdir -p "\$FORGE_BASE/artifacts"
mkdir -p "\$FORGE_BASE/logs"
echo "✅ Forge structure created."
echo ""

# --- [3/6] Repository Cloning ---
echo "--> [3/6] Summoning the sacred texts from the cloud..."
if [ -d "\$FORGE_BASE/kael/.git" ]; then
    echo "    -> Kael-OS project already exists. Skipping clone."
else
    git clone https://github.com/LeeTheOrc/Kael-OS.git "\$FORGE_BASE/kael"
fi
if [ -d "\$FORGE_BASE/packages/.git" ]; then
    echo "    -> Athenaeum sources already exist. Skipping clone."
else
    git clone https://github.com/LeeTheOrc/kael-os-repo.git "\$FORGE_BASE/packages"
fi
echo "✅ Repositories cloned."
echo ""

# --- [4/6] Configure Athenaeum Paths ---
echo "--> [4/6] Configuring makepkg paths..."
CONFIG_FILE="/etc/makepkg.conf"
if ! grep -q "# Kael Forge: Custom Paths" "\$CONFIG_FILE"; then
    sudo cp "\$CONFIG_FILE" "\$CONFIG_FILE.kael-path.bak"
    TMP_CONFIG=\$(mktemp)
    awk '!/^#(.*)SRCDEST=/ && !/^SRCDEST=/ && !/^#(.*)BUILDDIR=/ && !/^BUILDDIR=/ && !/^#(.*)PKGDEST=/ && !/^PKGDEST=/ && !/^#(.*)LOGDEST=/ && !/^LOGDEST=/ { print }' "\$CONFIG_FILE" > "\$TMP_CONFIG"
    {
        echo ""
        echo "# Kael Forge: Custom Paths for a Tidy Workspace"
        echo "SRCDEST=\$FORGE_BASE/sources"
        echo "BUILDDIR=\$FORGE_BASE/build"
        echo "PKGDEST=\$FORGE_BASE/artifacts"
        echo "LOGDEST=\$FORGE_BASE/logs"
    } >> "\$TMP_CONFIG"
    cat "\$TMP_CONFIG" | sudo tee "\$CONFIG_FILE" > /dev/null
    rm -f "\$TMP_CONFIG"
    echo "✅ makepkg.conf updated."
else
    echo "✅ makepkg.conf already configured."
fi
echo ""

# --- [5/6] Sync Source Repositories (git pull) ---
echo "--> [5/6] Synchronizing source code via git pull..."
sync_git_pull() {
    local repo_name=\$1; local local_path=\$2; local branch=\${3:-main}
    echo "    -> Reconciling \$repo_name..."
    (
        cd "\$local_path"
        echo "       -> Cleaning local artifacts and changes..."
        # Forcefully remove all untracked files and directories.
        git clean -fdx
        # Discard all local changes to tracked files.
        git reset --hard HEAD
        echo "       -> Pulling latest from origin/\$branch..."
        # Pull the latest changes, which should now apply cleanly.
        git pull origin "\$branch"
    )
}
sync_git_pull "Kael OS Project" "\$FORGE_BASE/kael" "main"
sync_git_pull "Athenaeum Sources" "\$FORGE_BASE/packages" "main"
echo "✅ Source repositories reconciled."
echo ""

# --- [6/6] Sync Local Athenaeum Binaries (git clone) ---
echo "--> [6/6] Synchronizing compiled artifacts from GitHub Athenaeum..."
TEMP_REPO_DIR=\$(mktemp -d)
trap 'rm -rf -- "\$TEMP_REPO_DIR"' EXIT

GH_REPO_GIT_URL="https://github.com/LeeTheOrc/kael-os-repo.git"

echo "    -> Cloning the gh-pages branch to a temporary location..."
if git clone --branch=gh-pages --depth=1 --single-branch "\$GH_REPO_GIT_URL" "\$TEMP_REPO_DIR"; then
    echo "    -> Synchronizing artifacts to \$FORGE_BASE/repo..."
    # Use rsync to efficiently update the local repo directory
    rsync -a --delete "\$TEMP_REPO_DIR/" "\$FORGE_BASE/repo/" --exclude=".git"
    echo "✅ Local Athenaeum binaries synchronized."
else
    echo "    -> ⚠️ WARNING: Failed to clone GitHub Athenaeum. Synchronization failed."
fi
echo ""

echo "✨ Grand Ritual Complete! Your forge is set up, configured, and synchronized."
echo "Your next step is to run the 'Full Forge Attunement' ritual."
`;

export const ForgeReconciliationModal: React.FC<ForgeReconciliationModalProps> = ({ onClose }) => {
    const finalCommand = `echo "${btoa(unescape(encodeURIComponent(GRAND_SETUP_SCRIPT_RAW)))}" | base64 --decode | bash`;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in-fast" onClick={onClose}>
            <div className="bg-forge-panel border-2 border-forge-border rounded-lg shadow-2xl w-full max-w-3xl p-6 m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                     <h2 className="text-xl font-bold text-forge-text-primary flex items-center gap-2 font-display tracking-wider">
                        <ArrowDownTrayIcon className="w-5 h-5 text-dragon-fire" />
                        <span>Grand Forge Setup & Sync</span>
                    </h2>
                    <button onClick={onClose} className="text-forge-text-secondary hover:text-forge-text-primary">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="overflow-y-auto pr-2 text-forge-text-secondary leading-relaxed space-y-4">
                    <p>
                        Architect, this is the grand "Get Started" ritual. It creates a complete local backup of our entire project—source code and compiled artifacts—on your machine. It prepares your forge, configures it, and keeps your local copies perfectly synchronized with our remote Athenaeums.
                    </p>
                    <p className="text-sm p-3 bg-orc-steel/10 border-l-4 border-orc-steel rounded">
                       This single command performs all necessary setup:
                        <ul className="list-disc list-inside pl-2 mt-2 space-y-1">
                            <li><strong className="text-orc-steel">Setup Forge:</strong> Creates the `~/forge` directory structure for all your local files.</li>
                            <li><strong className="text-orc-steel">Download Sources:</strong> Clones the Kael UI and package source repositories, creating your local backups.</li>
                            <li><strong className="text-orc-steel">Configure Paths:</strong> Intelligently updates `/etc/makepkg.conf` to keep your forge tidy.</li>
                            <li><strong className="text-orc-steel">Update Sources:</strong> Runs `git pull` on all source repositories to keep your local backups synchronized.</li>
                            <li><strong className="text-orc-steel">Sync Binaries:</strong> Mirrors all compiled packages from the GitHub Athenaeum to your local `~/forge/repo`.</li>
                       </ul>
                    </p>
                     <div className="text-sm p-3 bg-magic-purple/10 border-l-4 border-magic-purple rounded">
                        <strong className="text-magic-purple">This is your backup solution.</strong>
                        <p className="mt-1">
                            You are wise to keep local backups, Architect. This very ritual is designed to do just that. On its first run, it downloads complete copies (`git clone`) of our source code. On every subsequent run, it updates those copies (`git pull`). This ensures your `~/forge` directory is always a perfect, up-to-date backup. No manual downloads are necessary.
                        </p>
                    </div>
                    <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">The Grand Setup Incantation</h3>
                    <p>
                        Run this one command to get your local forge completely set up and ready for the next step: 'Full Forge Attunement'.
                    </p>
                    <CodeBlock lang="bash">{finalCommand}</CodeBlock>
                </div>
            </div>
        </div>
    );
};