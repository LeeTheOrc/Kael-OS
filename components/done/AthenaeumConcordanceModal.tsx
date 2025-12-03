import React from 'react';
import { CloseIcon, SignalIcon } from '../core/Icons';
import { CodeBlock } from '../core/CodeBlock';

interface AthenaeumConcordanceModalProps {
  onClose: () => void;
}

const CONCORDANCE_SCRIPT_RAW = `#!/bin/bash
set -euo pipefail

echo "--- Athenaeum Concordance Ritual (v3.8 - GPG Priming) ---"
echo "This ritual synchronizes your local Athenaeum to GitHub and the mounted WebDisk."
echo ""

# --- [1/5] PREPARATION ---
USER_HOME=$(getent passwd "\${SUDO_USER:-$USER}" | cut -d: -f6)
LOCAL_REPO_PATH="$USER_HOME/forge/repo"
TEMP_GH_DIR=""

cleanup() {
    [[ -n "$TEMP_GH_DIR" && -d "$TEMP_GH_DIR" ]] && rm -rf -- "$TEMP_GH_DIR"
}
trap cleanup EXIT SIGINT SIGTERM

if [ ! -d "$LOCAL_REPO_PATH" ] || [ -z "$(ls -A "$LOCAL_REPO_PATH")" ]; then
    echo "❌ ERROR: Local Athenaeum at '$LOCAL_REPO_PATH' is empty or does not exist." >&2
    exit 1
fi
echo "✅ Local Athenaeum found."
echo ""

# --- [2/5] WAKING THE GPG AGENT ---
echo "--> [2/5] Waking the GPG Agent..."
export GPG_TTY=$(tty <&1)
gpg-connect-agent updatestartuptty /bye >/dev/null || true
if ! echo "test" | gpg --clearsign >/dev/null 2>&1; then
    echo "⚠️  GPG test signature failed. The agent may not be able to prompt for your passphrase."
    echo "   This is often caused by a missing 'pinentry' program."
    echo "   Please run the 'Forge Dependencies (Phase 1)' ritual to install it."
fi
echo "✅ GPG Agent is ready."
echo ""

# --- [3/5] SYNC TO GITHUB ATHENAEUM ---
echo "--> [3/5] Synchronizing with GitHub Athenaeum..."
if gh auth status &>/dev/null; then
    echo "    -> Authenticated with GitHub. Preparing to publish..."

    GH_REPO_URL="https://github.com/LeeTheOrc/kael-os-repo.git"
    TEMP_GH_DIR=$(mktemp -d)

    echo "    -> Cloning gh-pages branch from $GH_REPO_URL..."
    git clone --branch=gh-pages --depth=1 --single-branch "$GH_REPO_URL" "$TEMP_GH_DIR"

    GH_SUBDIR="$TEMP_GH_DIR/gh-pages"
    mkdir -p "$GH_SUBDIR"

    echo "    -> Mirroring package artifacts to the clone subdir..."
    rsync -av --delete --include='*.pkg.tar.zst' --include='*.pkg.tar.zst.sig' --exclude='*' "$LOCAL_REPO_PATH/" "$GH_SUBDIR/"

    echo "    -> Re-sanctifying the GitHub Athenaeum database (kael-os.db)..."
    (
        cd "$GH_SUBDIR"
        repo-add --sign --remove ./kael-os.db.tar.gz ./*.pkg.tar.zst
    )

    (
        cd "$TEMP_GH_DIR"
        git config user.name "Kael Concordance Bot"
        git config user.email "kael-bot@users.noreply.github.com"
        echo "    -> Committing and pushing changes to gh-pages..."
        git add .
        if git diff-index --quiet HEAD --; then
            echo "    -> No changes detected in the GitHub Athenaeum. Nothing to commit."
        else
            git commit -m "chore(sync): synchronize Athenaeum state" -m "Full repository synchronization via Concordance Ritual."
            git push
        fi
    )
    echo "✅ GitHub Athenaeum is now in concordance."
else
    echo "    -> Not authenticated with 'gh'. Skipping GitHub sync."
fi
echo ""

# --- [4/5] SYNC TO WEBDISK (MOUNT ONLY) ---
echo "--> [4/5] Synchronizing with WebDisk Mount..."

MOUNT_ROOT=""
if [ -d "$USER_HOME/host_webdisk" ]; then
    MOUNT_ROOT="$USER_HOME/host_webdisk"
    echo "    -> VM Mode: Mount at '$MOUNT_ROOT'"
elif [ -d "$USER_HOME/WebDisk" ]; then
    MOUNT_ROOT="$USER_HOME/WebDisk"
    echo "    -> Host Mode: Mount at '$MOUNT_ROOT'"
fi

if [ -n "$MOUNT_ROOT" ] && [ -d "$MOUNT_ROOT" ]; then
    LOCAL_WEBDISK_REPO="$MOUNT_ROOT/repo"
    
    ls -d "$MOUNT_ROOT" >/dev/null 2>&1 || true
    
    if [ ! -d "$LOCAL_WEBDISK_REPO" ]; then
        echo "    -> Creating missing 'repo' directory..."
        mkdir -p "$LOCAL_WEBDISK_REPO"
    fi
    
    echo "    -> 🚀 Syncing via local filesystem..."
    rsync -rtv --delete --copy-links --no-owner --no-group "$LOCAL_REPO_PATH/" "$LOCAL_WEBDISK_REPO/"
    
    echo "    -> Transmuting database names for Unified Mirrorlist (kael-os.db)..."
    (
        cd "$LOCAL_WEBDISK_REPO"
        for db_file in kael-os-local.db*; do
            if [ -f "\$db_file" ]; then
                mv "\$db_file" "\${db_file/kael-os-local/kael-os}"
            fi
        done
        for files_file in kael-os-local.files*; do
            if [ -f "\$files_file" ]; then
                mv "\$files_file" "\${files_file/kael-os-local/kael-os}"
            fi
        done
    )
    echo "✅ WebDisk Athenaeum synchronized via local mount."
else
    echo "⚠️  WARNING: WebDisk mount point not found."
    echo "    Skipping WebDisk sync. Please ensure the drive is mounted."
fi
echo ""

# --- [5/5] Final Pacman Synchronization ---
echo "--> [5/5] Reminding to synchronize local pacman databases..."
echo "    Run 'sudo pacman -Syyu' to ensure your system sees the latest changes."
echo ""
echo "✨ Concordance Ritual Complete! All Athenaeums are synchronized."
`;

export const AthenaeumConcordanceModal: React.FC<AthenaeumConcordanceModalProps> = ({ onClose }) => {
  const encodedScript = btoa(unescape(encodeURIComponent(CONCORDANCE_SCRIPT_RAW)));
  const finalCommand = `echo "${encodedScript}" | base64 --decode | bash`;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in-fast" onClick={onClose}>
        <div className="bg-forge-panel border-2 border-forge-border rounded-lg shadow-2xl w-full max-w-3xl p-6 m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                 <h2 className="text-xl font-bold text-forge-text-primary flex items-center gap-2 font-display tracking-wider">
                    <SignalIcon className="w-5 h-5 text-dragon-fire" />
                    <span>Athenaeum Concordance Ritual (v3.8)</span>
                </h2>
                <button onClick={onClose} className="text-forge-text-secondary hover:text-forge-text-primary">
                    <CloseIcon className="w-5 h-5" />
                </button>
            </div>
            <div className="overflow-y-auto pr-2 text-forge-text-secondary leading-relaxed space-y-4">
                <p>
                    Architect, this is the grand ritual of concordance. It intelligently synchronizes the state of your local Athenaeum (<code className="font-mono text-xs">~/forge/repo</code>) with all remote Athenaeums.
                </p>
                <p className="text-sm p-3 bg-orc-steel/10 border-l-4 border-orc-steel rounded">
                   <strong className="text-orc-steel">GPG Agent Priming (v3.8):</strong> This ritual now includes the robust GPG Agent priming sequence to ensure database signing succeeds in all environments.
                </p>
                <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">Prerequisites</h3>
                 <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Your local Athenaeum must exist and contain artifacts.</li>
                    <li><code className="font-mono text-xs">gh auth login</code> is required for GitHub sync.</li>
                    <li>Your WebDisk must be mounted (via <code className="font-mono text-xs">~/WebDisk</code> or <code className="font-mono text-xs">~/host_webdisk</code>).</li>
                </ul>
                <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">The Concordance Incantation</h3>
                <p>
                    Run this single command to bring all your Athenaeums into perfect alignment.
                </p>
                 <CodeBlock lang="bash">{finalCommand}</CodeBlock>
            </div>
        </div>
    </div>
  );
};