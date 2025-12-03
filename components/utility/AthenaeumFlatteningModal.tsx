

import React from 'react';
import { CloseIcon, FolderIcon } from '../core/Icons';
import { CodeBlock } from '../core/CodeBlock';

interface AthenaeumFlatteningModalProps {
  onClose: () => void;
}

const FLATTEN_SCRIPT_RAW = `#!/bin/bash
(
set -euo pipefail

echo "--- Athenaeum Flattening Ritual ---"
echo "This one-time ritual corrects the nested 'gh-pages/gh-pages' structure."
echo ""

TEMP_CLEANUP_DIR=\$(mktemp -d)
trap 'rm -rf -- "\$TEMP_CLEANUP_DIR"' EXIT SIGINT SIGTERM

echo "--> Cloning gh-pages branch..."
git clone --branch=gh-pages --single-branch https://github.com/LeeTheOrc/kael-os-repo.git "\$TEMP_CLEANUP_DIR"
cd "\$TEMP_CLEANUP_DIR"

if [ ! -d "gh-pages" ]; then
    echo "✅ No nested 'gh-pages' directory found. Your repository structure is already correct."
    exit 0
fi

echo "--> Detected nested structure. Moving files to root..."
# Use dot to include hidden files like .gitattributes
mv gh-pages/.* . 2>/dev/null || true
mv gh-pages/* . 2>/dev/null || true
rmdir gh-pages

echo "--> Committing and pushing the corrected structure..."
git add .
if git diff-index --quiet HEAD --; then
    echo "    -> No changes detected after move. Structure might be clean."
else
    git config user.name "Kael Fixer Bot"
    git config user.email "kael-bot@users.noreply.github.com"
    git commit -m "fix(repo): flatten nested gh-pages directory structure"
    git push
fi

echo ""
echo "✨ Ritual Complete! Your GitHub Athenaeum has been flattened."
)
`;

export const AthenaeumFlatteningModal: React.FC<AthenaeumFlatteningModalProps> = ({ onClose }) => {
    const encodedScript = btoa(unescape(encodeURIComponent(FLATTEN_SCRIPT_RAW)));
    const finalCommand = `echo "${encodedScript}" | base64 --decode | bash`;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in-fast" onClick={onClose}>
            <div className="bg-forge-panel border-2 border-forge-border rounded-lg shadow-2xl w-full max-w-3xl p-6 m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                     <h2 className="text-xl font-bold text-forge-text-primary flex items-center gap-2 font-display tracking-wider">
                        <FolderIcon className="w-5 h-5 text-dragon-fire" />
                        <span>Athenaeum Flattening Ritual</span>
                    </h2>
                    <button onClick={onClose} className="text-forge-text-secondary hover:text-forge-text-primary">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="overflow-y-auto pr-2 text-forge-text-secondary leading-relaxed space-y-4">
                    <p>
                      Architect, my apologies for the previous rituals. They created an incorrect folder structure in your GitHub Athenaeum. This one-time ritual will correct it.
                    </p>
                     <p className="text-sm p-3 bg-orc-steel/10 border-l-4 border-orc-steel rounded">
                        This incantation will clone your repository, move all files from the erroneous <code className="font-mono text-xs">gh-pages/gh-pages</code> directory to the root, and push the corrected structure.
                    </p>
                    <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">The Flattening Incantation</h3>
                    <p>
                        Run this single command to permanently fix your repository's structure.
                    </p>
                     <CodeBlock lang="bash">{finalCommand}</CodeBlock>
                </div>
            </div>
        </div>
    );
};