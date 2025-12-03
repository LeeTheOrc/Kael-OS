

import React from 'react';
import { CloseIcon, ServerIcon } from '../core/Icons';
import { CodeBlock } from '../core/CodeBlock';

interface AthenaeumLfsRepairModalProps {
  onClose: () => void;
}

const REPAIR_SCRIPT_RAW = `#!/bin/bash
set -euo pipefail

echo "--- Athenaeum LFS Repair Ritual ---"
echo "This one-time ritual reconfigures your GitHub repository to use Git LFS"
echo "and migrates existing large files, which requires rewriting history."
echo ""

# --- CONFIGURATION & VALIDATION ---
USER_HOME=\$(getent passwd "\${SUDO_USER:-\$USER}" | cut -d: -f6)
REPO_DIR="\${USER_HOME}/forge/repo-src-lfs-fix"
GH_REPO_URL="https://github.com/LeeTheOrc/kael-os-repo.git"

if ! command -v git-lfs &> /dev/null; then
    echo "❌ ERROR: 'git-lfs' is not installed. Please run 'Install Forge Dependencies (Phase 1)'." >&2
    exit 1
fi
if ! gh auth status &>/dev/null; then
    echo "❌ ERROR: You are not logged into GitHub. Please run 'gh auth login'." >&2
    exit 1
fi
echo "✅ Prerequisites met."
echo ""

# --- [1/4] CLONE REPOSITORY ---
echo "--> [1/4] Cloning the 'gh-pages' branch to a temporary location..."
rm -rf "\$REPO_DIR" # Clean slate
git clone --branch=gh-pages --single-branch "\$GH_REPO_URL" "\$REPO_DIR"
cd "\$REPO_DIR"
echo "✅ Cloned to \$REPO_DIR."
echo ""

# --- [2/4] ATTUNE .gitattributes ---
echo "--> [2/4] Attuning repository to track large artifacts..."
git lfs install
git lfs track "*.pkg.tar.zst"
git add .gitattributes
if git diff-index --quiet HEAD --; then
    echo "    -> .gitattributes is already up to date."
else
    git commit -m "chore(lfs): enable LFS tracking for package artifacts"
    echo "✅ LFS tracking enabled."
fi
echo ""


# --- [3/4] MIGRATE HISTORY ---
echo "--> [3/4] Migrating existing large artifacts to LFS..."
echo "    This may take some time as it rewrites repository history."
git lfs migrate import --everything --include="*.pkg.tar.zst"
echo "✅ History migrated."
echo ""

# --- [4/4] PUSH CHANGES ---
echo "--> [4/4] Force-pushing the updated history to GitHub..."
echo "⚠️  This will overwrite the remote history for the 'gh-pages' branch."
read -p "    Proceed? (y/N) " -n 1 -r < /dev/tty
echo ""
if [[ ! \$REPLY =~ ^[Yy]$ ]]; then
    echo "Push aborted. Your local changes are in \$REPO_DIR."
    exit 1
fi

if ! git push --force; then
    echo "❌ ERROR: Failed to push changes. Please check for errors above."
    exit 1
fi

echo "✅ Push complete."
echo ""
echo "✨ Athenaeum LFS Attunement is complete!"
echo "   You can now safely delete the '\$REPO_DIR' directory."
echo "   The 'Grand Concordance' ritual will now work correctly for large files."
`;


export const AthenaeumLfsRepairModal: React.FC<AthenaeumLfsRepairModalProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in-fast" onClick={onClose}>
            <div className="bg-forge-panel border-2 border-forge-border rounded-lg shadow-2xl w-full max-w-3xl p-6 m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                     <h2 className="text-xl font-bold text-forge-text-primary flex items-center gap-2 font-display tracking-wider">
                        <ServerIcon className="w-5 h-5 text-dragon-fire" />
                        <span>Athenaeum LFS Repair Ritual</span>
                    </h2>
                    <button onClick={onClose} className="text-forge-text-secondary hover:text-forge-text-primary">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="overflow-y-auto pr-2 text-forge-text-secondary leading-relaxed space-y-4">
                    <p>
                        Architect, your Athenaeum has grown too heavy for GitHub. This one-time repair ritual will attune it to Git LFS and migrate the massive kernel artifacts you've already forged.
                    </p>
                    <p className="text-sm p-3 bg-red-500/10 border-l-4 border-red-500/70 rounded">
                        <strong className="text-red-400">Warning:</strong> This ritual will <strong className="font-bold">rewrite the history</strong> of your `kael-os-repo`'s `gh-pages` branch. This is necessary to fix the error, but it is a powerful action.
                    </p>
                    
                    <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">The LFS Repair Incantation</h3>
                    <p>
                        Run this script on your host machine. It will clone your repository, perform the migration, and guide you through force-pushing the corrected history.
                    </p>
                    <CodeBlock lang="bash">{REPAIR_SCRIPT_RAW}</CodeBlock>
                </div>
            </div>
        </div>
    );
};