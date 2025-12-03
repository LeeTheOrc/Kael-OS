
import React from 'react';
import { CloseIcon, ServerIcon } from '../core/Icons';
import { CodeBlock } from '../core/CodeBlock';

interface GitLfsSetupModalProps {
  onClose: () => void;
}

const LFS_SETUP_SCRIPT_RAW = `#!/bin/bash
(
set -euo pipefail

echo "--- Git LFS Attunement Ritual (v2.0) ---"
echo "This one-time ritual prepares your GitHub repo to handle massive artifacts."
echo ""

# --- [1/3] Prerequisite Check & Install ---
echo "--> [1/3] Checking for git-lfs..."
if ! command -v git-lfs &> /dev/null; then
    echo "⚠️  'git-lfs' not found. Installing now..."
    sudo pacman -S --needed --noconfirm git-lfs
fi
# One-time per-user setup
git lfs install
echo "✅ Git LFS is ready."
echo ""

# --- [2/3] Repository Attunement (on gh-pages) ---
USER_HOME=$(getent passwd "\${SUDO_USER:-$USER}" | cut -d: -f6)
REPO_DIR="$USER_HOME/forge/repo-src-lfs" 
ATTRIBUTES_FILE="$REPO_DIR/.gitattributes"

echo "--> [2/3] Attuning the 'gh-pages' branch of the Kael OS repository..."
if [ ! -d "$REPO_DIR" ]; then
    echo "    -> Cloning gh-pages branch..."
    git clone --branch=gh-pages --single-branch https://github.com/LeeTheOrc/kael-os-repo.git "$REPO_DIR"
else
    echo "    -> Found existing clone. Pulling latest changes..."
    (cd "$REPO_DIR" && git pull)
fi

cd "$REPO_DIR"

if ! grep -q "*.pkg.tar.zst" "$ATTRIBUTES_FILE" &>/dev/null; then
    echo "    -> Scribing the LFS pact into .gitattributes..."
    git lfs track "*.pkg.tar.zst"
    git add .gitattributes
    git commit -m "chore(lfs): begin tracking large package artifacts"
    echo "    -> Pact scribed and committed."
else
    echo "✅ Repository is already attuned to track large artifacts."
fi
echo ""

# --- [3/3] Push to GitHub ---
echo "--> [3/3] Pushing attunement to GitHub..."
if git diff-index --quiet origin/gh-pages --; then
    echo "    -> No changes to push."
else
    if git push; then
        echo "✅ Attunement has been published to GitHub."
    else
        echo "❌ ERROR: Failed to push. You may need to resolve conflicts manually in '$REPO_DIR'."
    fi
fi

echo ""
echo "✨ Ritual Complete! Your forge is now ready for massive artifacts."
echo "   If you have already pushed large files, you must now run the 'Athenaeum LFS Repair Ritual'."
)
`;

export const GitLfsSetupModal: React.FC<GitLfsSetupModalProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in-fast" onClick={onClose}>
            <div className="bg-forge-panel border-2 border-forge-border rounded-lg shadow-2xl w-full max-w-3xl p-6 m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                     <h2 className="text-xl font-bold text-forge-text-primary flex items-center gap-2 font-display tracking-wider">
                        <ServerIcon className="w-5 h-5 text-dragon-fire" />
                        <span>Setup Git LFS (v2.0)</span>
                    </h2>
                    <button onClick={onClose} className="text-forge-text-secondary hover:text-forge-text-primary">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="overflow-y-auto pr-2 text-forge-text-secondary leading-relaxed space-y-4">
                    <p>
                        Architect, to forge our own kernel, we must prepare the Athenaeum for massive artifacts. This one-time ritual attunes your local forge to <strong className="text-dragon-fire">Git LFS (Large File Storage)</strong>.
                    </p>
                    <p className="text-sm p-3 bg-orc-steel/10 border-l-4 border-orc-steel rounded">
                        <strong className="text-orc-steel">Update v2.0:</strong> This ritual now correctly targets the `gh-pages` branch, ensuring the LFS pact (`.gitattributes`) is scribed in the correct location to prevent future push failures.
                    </p>
                    
                    <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">The LFS Attunement Incantation</h3>
                    <p>
                        Copy and run this entire script in your terminal on your **host machine**. This should be your first step before forging large artifacts.
                    </p>
                    <CodeBlock lang="bash">{LFS_SETUP_SCRIPT_RAW}</CodeBlock>
                </div>
            </div>
        </div>
    );
};