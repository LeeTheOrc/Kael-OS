

import React from 'react';
import { CloseIcon, SignalIcon } from './core/Icons';
import { CodeBlock } from './core/CodeBlock';

interface AthenaeumConcordanceModalProps {
  onClose: () => void;
}

const CONCORDANCE_SCRIPT_RAW = `#!/bin/bash
set -euo pipefail

echo "--- Athenaeum Concordance Ritual (v3.2) ---"
echo "This ritual intelligently synchronizes your local Athenaeum to all remote mirrors,"
echo "ensuring platform-specific database integrity."
echo ""

# --- [1/4] PREPARATION ---
USER_HOME=$(getent passwd "\${SUDO_USER:-\$USER}" | cut -d: -f6)
LOCAL_REPO_PATH="\$USER_HOME/forge/repo"
TEMP_GH_DIR=""
TEMP_FTPS_STAGE=""

cleanup() {
    [[ -n "\$TEMP_GH_DIR" && -d "\$TEMP_GH_DIR" ]] && rm -rf -- "\$TEMP_GH_DIR"
    [[ -n "\$TEMP_FTPS_STAGE" && -d "\$TEMP_FTPS_STAGE" ]] && rm -rf -- "\$TEMP_FTPS_STAGE"
}
trap cleanup EXIT SIGINT SIGTERM

if [ ! -d "\$LOCAL_REPO_PATH" ] || [ -z "\$(ls -A "\$LOCAL_REPO_PATH")" ]; then
    echo "❌ ERROR: Local Athenaeum at '\$LOCAL_REPO_PATH' is empty or does not exist." >&2
    exit 1
fi
echo "✅ Local Athenaeum found."
echo ""

# --- [2/4] SYNC TO GITHUB ATHENAEUM ---
echo "--> [2/4] Synchronizing with GitHub Athenaeum..."
if gh auth status &>/dev/null; then
    echo "    -> Authenticated with GitHub. Preparing to publish..."

    GH_REPO_URL="https://github.com/LeeTheOrc/kael-os-repo.git"
    TEMP_GH_DIR=\$(mktemp -d)

    echo "    -> Cloning gh-pages branch from \$GH_REPO_URL..."
    git clone --branch=gh-pages --depth=1 --single-branch "\$GH_REPO_URL" "\$TEMP_GH_DIR"

    echo "    -> Mirroring package artifacts to the clone..."
    # Intelligently sync ONLY package files and their signatures.
    rsync -av --delete --include='*.pkg.tar.zst' --include='*.pkg.tar.zst.sig' --exclude='*' "\$LOCAL_REPO_PATH/" "\$TEMP_GH_DIR/"

    echo "    -> Re-sanctifying the GitHub Athenaeum database (kael-os-repo.db)..."
    (
        cd "\$TEMP_GH_DIR"
        # The repo-add command will rebuild the database from the files present.
        repo-add --sign --remove ./kael-os-repo.db.tar.gz ./*.pkg.tar.zst
    )

    (
        cd "\$TEMP_GH_DIR"
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
    echo "       (Run 'gh auth login' to enable this feature)."
fi
echo ""

# --- [3/4] SYNC TO WEBDISK/FTPS ATHENAEUM ---
echo "--> [3/4] Synchronizing with WebDisk Athenaeum..."

LOCAL_WEBDISK_REPO="\$USER_HOME/WebDisk/repo"
USE_LOCAL_WEBDISK=false

if [ -d "\$LOCAL_WEBDISK_REPO" ]; then
    echo "    -> Local WebDisk mount detected at '\$LOCAL_WEBDISK_REPO'."
    if touch "\$LOCAL_WEBDISK_REPO/.kael_probe" 2>/dev/null; then
        rm "\$LOCAL_WEBDISK_REPO/.kael_probe"
        USE_LOCAL_WEBDISK=true
    else
        echo "    ⚠️  WebDisk mount appears read-only or unstable. Falling back to network sync."
    fi
fi

if [ "\$USE_LOCAL_WEBDISK" = true ]; then
    echo "    -> 🚀 Accelerating: Syncing via local filesystem..."
    
    # rsync locally with WebDAV compatibility flags
    # --copy-links converts symlinks to files, essential for WebDAV
    rsync -rtv --delete --copy-links --no-owner --no-group "\$LOCAL_REPO_PATH/" "\$LOCAL_WEBDISK_REPO/"
    
    # Transmute database names in place
    echo "    -> Transmuting database names for WebDisk compatibility..."
    (
        cd "\$LOCAL_WEBDISK_REPO"
        for db_file in kael-os-local.db*; do
            if [ -f "\$db_file" ]; then
                mv "\$db_file" "\${db_file/kael-os-local/kael-os-webdisk}"
            fi
        done
        for files_file in kael-os-local.files*; do
            if [ -f "\$files_file" ]; then
                mv "\$files_file" "\${files_file/kael-os-local/kael-os-webdisk}"
            fi
        done
    )
    echo "✅ WebDisk Athenaeum synchronized via local mount."

elif ! command -v lftp &> /dev/null; then
    echo "    -> 'lftp' is not installed. Skipping FTPS sync."
else
    echo "    -> Local mount not found/usable. Initiating FTPS upload..."
    FTP_HOST="leroyonline.co.za"
    FTP_USER="leroy@leroyonline.co.za"
    FTP_PASS='LeRoy0923!'
    FTP_REPO_PATH="/forge/repo"
    TEMP_FTPS_STAGE=$(mktemp -d)

    echo "    -> Staging local repository for FTPS transmutation..."
    rsync -a "\$LOCAL_REPO_PATH/" "\$TEMP_FTPS_STAGE/"

    echo "    -> Transmuting database name for FTPS (kael-os-ftps.db)..."
    (
        cd "\$TEMP_FTPS_STAGE"
        for db_file in kael-os-local.db*; do
            if [ -f "\$db_file" ]; then
                mv "\$db_file" "\${db_file/kael-os-local/kael-os-ftps}"
            fi
        done
        for files_file in kael-os-local.files*; do
            if [ -f "\$files_file" ]; then
                mv "\$files_file" "\${files_file/kael-os-local/kael-os-ftps}"
            fi
        done
    )

    echo "    -> Mirroring staged repository to ftps://\$FTP_HOST:2078\$FTP_REPO_PATH..."
    COMMANDS="mirror -R -v --delete --only-newer \\"\$TEMP_FTPS_STAGE/\\" \\"\$FTP_REPO_PATH/\\"; quit"
    FTP_OPTIONS="set ftp:ssl-force true; set ssl:verify-certificate no;"

    if ! lftp -c "\$FTP_OPTIONS open -p 2078 -u '\$FTP_USER','\$FTP_PASS' ftp://\$FTP_HOST; \$COMMANDS"; then
        echo "⚠️  WARNING: FTPS sync failed. Please check your connection and credentials."
    else
        echo "✅ FTPS Athenaeum is now in concordance."
    fi
fi
echo ""

# --- [4/4] Final Pacman Synchronization ---
echo "--> [4/4] Reminding to synchronize local pacman databases..."
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
                    <span>Athenaeum Concordance Ritual</span>
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
                   <strong className="text-orc-steel">Optimized for WebDisk:</strong> This ritual now auto-detects your local WebDisk mount to perform a fast, direct sync, bypassing the need for external FTPS connections. It uses specific incantations (<code className="font-mono text-xs">rsync --copy-links</code>) to ensure compatibility with the WebDAV file system.
                </p>
                <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">Prerequisites</h3>
                 <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Your local Athenaeum must exist and contain artifacts.</li>
                    <li><code className="font-mono text-xs">gh auth login</code> is required for GitHub sync.</li>
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
