import React from 'react';
import { CloseIcon, BroomIcon } from '../core/Icons';
import { CodeBlock } from '../core/CodeBlock';

interface AthenaeumPurificationModalProps {
  onClose: () => void;
}

const PURGE_SCRIPT_RAW = `#!/bin/bash
set -euo pipefail

echo "--- Athenaeum Purification Ritual ---"
echo "This ritual permanently removes artifacts from your local Athenaeum."

USER_HOME=\$(getent passwd "\${SUDO_USER:-\$USER}" | cut -d: -f6)
LOCAL_REPO_PATH="\${USER_HOME}/forge/repo"

if [ ! -d "\$LOCAL_REPO_PATH" ]; then
    echo "❌ ERROR: Local Athenaeum not found at '\$LOCAL_REPO_PATH'." >&2
    exit 1
fi
cd "\$LOCAL_REPO_PATH"

echo "Current artifacts in the Athenaeum:"
ls -1 *.pkg.tar.zst 2>/dev/null || echo "(No artifacts found)"

echo ""
read -p "Enter the base name of the artifact(s) to purge (e.g., 'linux-6.17.9' or 'kaelic-fonts'): " ARTIFACT_BASE_NAME < /dev/tty

if [ -z "\$ARTIFACT_BASE_NAME" ]; then
    echo "Purge aborted. No name provided."
    exit 1
fi

# Use find to be safer and more explicit than rm with wildcards
mapfile -t TARGETS < <(find . -maxdepth 1 -name "\${ARTIFACT_BASE_NAME}*.pkg.tar.zst*")

if [ \${#TARGETS[@]} -eq 0 ]; then
    echo "No artifacts found matching '\${ARTIFACT_BASE_NAME}*'. Nothing to do."
    exit 0
fi

echo ""
echo "The following files will be PERMANENTLY REMOVED:"
printf '%s\\n' "\${TARGETS[@]}"
echo ""

read -p "Are you sure you want to proceed? (y/N) " -n 1 -r < /dev/tty
echo ""
if [[ ! \$REPLY =~ ^[Yy]$ ]]; then
    echo "Purification aborted."
    exit 1
fi

echo "--> Removing artifact files..."
rm -f "\${TARGETS[@]}"

echo "--> Re-sanctifying the database..."
# GPG agent priming
export GPG_TTY=\$(tty <&1)
gpg-connect-agent updatestartuptty /bye >/dev/null || true
# Rebuild DB
repo-add --sign --remove kael-os-local.db.tar.gz *.pkg.tar.zst

echo ""
echo "✨ Local Athenaeum purified."
echo "   NEXT STEP: Run 'Remote Concordance' (Step 6) to sync deletions to your online Athenaeums."
`;

export const AthenaeumPurificationModal: React.FC<AthenaeumPurificationModalProps> = ({ onClose }) => {
    const encodedScript = btoa(unescape(encodeURIComponent(PURGE_SCRIPT_RAW)));
    const finalCommand = `echo "${encodedScript}" | base64 --decode | bash`;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in-fast" onClick={onClose}>
            <div className="bg-forge-panel border-2 border-forge-border rounded-lg shadow-2xl w-full max-w-3xl p-6 m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                     <h2 className="text-xl font-bold text-forge-text-primary flex items-center gap-2 font-display tracking-wider">
                        <BroomIcon className="w-5 h-5 text-dragon-fire" />
                        <span>Athenaeum Purification Ritual</span>
                    </h2>
                    <button onClick={onClose} className="text-forge-text-secondary hover:text-forge-text-primary">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="overflow-y-auto pr-2 text-forge-text-secondary leading-relaxed space-y-4">
                    <p>
                        This ritual allows you to purge any unwanted artifacts from your local Athenaeum (<code className="font-mono text-xs">~/forge/repo</code>).
                    </p>
                    <p className="text-sm p-3 bg-orc-steel/10 border-l-4 border-orc-steel rounded">
                       This incantation will ask you for the base name of the package you wish to remove. It will then delete all associated files and safely re-sign the repository database.
                    </p>
                    <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">The Purification Incantation</h3>
                    <p>
                        Run this script to begin the interactive purification process. After it is complete, run the <strong>Remote Concordance (Step 6)</strong> ritual to sync these deletions to your online repositories.
                    </p>
                    <CodeBlock lang="bash">{finalCommand}</CodeBlock>
                </div>
            </div>
        </div>
    );
};