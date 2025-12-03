
import React from 'react';
import { CloseIcon, ArchiveBoxIcon } from '../core/Icons';
import { CodeBlock } from '../core/CodeBlock';

interface GrandArchiveRitualModalProps {
  onClose: () => void;
}

const ARCHIVE_SCRIPT_RAW = `#!/bin/bash
set -e

echo "--- The Grand Archive Ritual (v2.2) ---"
echo "This ritual moves all current artifacts (Repo & Packages) to a Legacy Archive,"
echo "resetting the forge for the new cycle (v0.00.01)."
echo ""

# --- CONFIGURATION ---
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LEGACY_ID="archive_$TIMESTAMP"

USER_HOME=$(getent passwd "\${SUDO_USER:-$USER}" | cut -d: -f6)
FORGE_BASE="$USER_HOME/forge"
LOCAL_LEGACY_DIR="$FORGE_BASE/legacy/$LEGACY_ID"

echo "--> Archive ID: $LEGACY_ID"
echo ""

# ===================================================================
# PART 1: LOCAL FORGE ARCHIVAL
# ===================================================================
echo "--> [1/3] Archiving Local Forge..."
mkdir -p "$LOCAL_LEGACY_DIR"

# List of folders to archive if they exist
TARGETS=("packages" "repo" "artifacts" "build" "logs" "sources" "temp")

for target in "\${TARGETS[@]}"; do
    if [ -d "$FORGE_BASE/$target" ]; then
        echo "    -> Archiving local '$target'..."
        mv "$FORGE_BASE/$target" "$LOCAL_LEGACY_DIR/"
    fi
done

# EXCLUSION CHECK
if [ -d "$FORGE_BASE/kael" ]; then
    echo "    -> Preserving 'kael' source directory (Untouched)."
fi

# Re-create empty structures for the new cycle
echo "    -> Re-creating fresh forge structures..."
mkdir -p "$FORGE_BASE/packages"
mkdir -p "$FORGE_BASE/repo"

echo "✅ Local Forge archived and reset."
echo ""

# ===================================================================
# PART 2: GITHUB ATHENAEUM ARCHIVAL
# ===================================================================
echo "--> [2/3] Archiving GitHub Athenaeum..."
if command -v gh &> /dev/null && gh auth status &>/dev/null; then
    GH_REPO_URL="https://github.com/LeeTheOrc/kael-os-repo.git"
    TEMP_GH_DIR=$(mktemp -d)
    
    echo "    -> Cloning repository..."
    git clone --branch=gh-pages --single-branch "$GH_REPO_URL" "$TEMP_GH_DIR" >/dev/null 2>&1
    
    cd "$TEMP_GH_DIR"
    
    # Create legacy structure
    mkdir -p "legacy/$LEGACY_ID/repo"
    mkdir -p "legacy/$LEGACY_ID/packages"
    
    echo "    -> Moving binary artifacts to legacy/repo..."
    # Move binaries if they exist
    git mv *.pkg.tar.zst "legacy/$LEGACY_ID/repo/" 2>/dev/null || true
    git mv *.pkg.tar.zst.sig "legacy/$LEGACY_ID/repo/" 2>/dev/null || true
    git mv *.db* "legacy/$LEGACY_ID/repo/" 2>/dev/null || true
    git mv *.files* "legacy/$LEGACY_ID/repo/" 2>/dev/null || true
    
    echo "    -> Moving source directories to legacy/packages..."
    # Move all directories except .git and legacy
    for dir in */ ; do
        [ -d "$dir" ] || continue # handle case where no dirs exist
        dirname=\${dir%/}
        if [[ "$dirname" != "legacy" && "$dirname" != ".git" ]]; then
            git mv "$dirname" "legacy/$LEGACY_ID/packages/" 2>/dev/null || true
        fi
    done
    
    # Commit changes
    git config user.name "Kael Archivist"
    git config user.email "kael-bot@users.noreply.github.com"
    
    if ! git diff-index --quiet HEAD --; then
        git commit -m "chore(archive): The Grand Archive $LEGACY_ID"
        echo "    -> Pushing changes..."
        git push
        echo "✅ GitHub Athenaeum archived."
    else
        echo "    -> No artifacts found to archive."
    fi
    
    cd "$USER_HOME"
    rm -rf "$TEMP_GH_DIR"
else
    echo "⚠️  GitHub CLI not configured. Skipping GitHub archival."
fi
echo ""

# ===================================================================
# PART 3: WEBDISK ATHENAEUM ARCHIVAL (LOCAL MOUNT)
# ===================================================================
echo "--> [3/3] Archiving WebDisk Athenaeum (via Local Mount)..."

LOCAL_WEBDISK="$USER_HOME/WebDisk"

if [ -d "$LOCAL_WEBDISK" ]; then
    echo "    -> Detected WebDisk folder at $LOCAL_WEBDISK"
    
    # Trigger access to wake up automount if needed
    ls -d "$LOCAL_WEBDISK" >/dev/null 2>&1 || true
    
    WEBDISK_LEGACY="$LOCAL_WEBDISK/legacy/$LEGACY_ID"
    
    echo "    -> Creating legacy directory structure at $WEBDISK_LEGACY..."
    mkdir -p "$WEBDISK_LEGACY"
    
    # List of folders to archive from WebDisk root
    # We include 'forge' here in case it was a mistake folder
    WD_TARGETS=("repo" "packages" "artifacts" "build" "logs" "sources" "temp" "forge")
    
    for item in "\${WD_TARGETS[@]}"; do
        if [ -d "$LOCAL_WEBDISK/$item" ]; then
            echo "    -> Archiving WebDisk item: $item..."
            mv "$LOCAL_WEBDISK/$item" "$WEBDISK_LEGACY/"
        fi
    done

    # Purge trash
    if ls "$LOCAL_WEBDISK"/_TRASH_* 1> /dev/null 2>&1; then
        echo "    -> Purging _TRASH_ items..."
        rm -rf "$LOCAL_WEBDISK"/_TRASH_*
    fi
    
    echo "    -> Preserving 'kael' folder (Untouched)."
    
    echo "    -> Re-creating fresh directories on WebDisk..."
    mkdir -p "$LOCAL_WEBDISK/repo"
    mkdir -p "$LOCAL_WEBDISK/packages"
    
    echo "✅ WebDisk Athenaeum archived and reset via local filesystem."
else
    echo "⚠️  '$LOCAL_WEBDISK' not found. Skipping WebDisk archival."
    echo "    (Make sure your WebDisk is mounted or synced to this location using the Automount Ritual)."
fi

echo ""
echo "✨ The Grand Archive Ritual is complete."
echo "   Your forge is now a blank slate, ready for version 0.00.01."
`;

export const GrandArchiveRitualModal: React.FC<GrandArchiveRitualModalProps> = ({ onClose }) => {
    const encodedScript = btoa(unescape(encodeURIComponent(ARCHIVE_SCRIPT_RAW)));
    const finalCommand = `echo "${encodedScript}" | base64 --decode | bash`;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in-fast" onClick={onClose}>
            <div className="bg-forge-panel border-2 border-forge-border rounded-lg shadow-2xl w-full max-w-3xl p-6 m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                     <h2 className="text-xl font-bold text-forge-text-primary flex items-center gap-2 font-display tracking-wider">
                        <ArchiveBoxIcon className="w-5 h-5 text-dragon-fire" />
                        <span>The Grand Archive Ritual (v2.2)</span>
                    </h2>
                    <button onClick={onClose} className="text-forge-text-secondary hover:text-forge-text-primary">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="overflow-y-auto pr-2 text-forge-text-secondary leading-relaxed space-y-4">
                    <p>
                        Architect, this is a <strong className="text-dragon-fire">System-Wide Reset (Corrected)</strong>.
                    </p>
                    <p className="text-sm text-forge-text-secondary">
                        Based on the scrying of your WebDisk, I have adjusted the target coordinates. This ritual will now correctly target the <strong>root</strong> of your WebDisk mount, moving artifacts to legacy while preserving the <code className="font-mono text-xs">kael</code> folder.
                    </p>
                    <div className="text-sm p-3 bg-orc-steel/10 border-l-4 border-orc-steel rounded space-y-2">
                        <strong className="text-orc-steel">The Cleanup Scope:</strong>
                        <ul className="list-disc list-inside">
                            <li><strong>Local & WebDisk:</strong> <code className="font-mono text-xs">repo</code>, <code className="font-mono text-xs">packages</code>, <code className="font-mono text-xs">artifacts</code>, <code className="font-mono text-xs">build</code>, <code className="font-mono text-xs">logs</code>, <code className="font-mono text-xs">sources</code>, <code className="font-mono text-xs">temp</code>.</li>
                            <li><strong>WebDisk Anomaly:</strong> Also archives the duplicate <code className="font-mono text-xs">forge</code> folder if present.</li>
                            <li><strong>Preserved:</strong> <code className="font-mono text-xs">kael</code> folder, <code className="font-mono text-xs">legacy</code> folder.</li>
                            <li><strong>Reset:</strong> Fresh <code className="font-mono text-xs">repo</code> and <code className="font-mono text-xs">packages</code> folders will be created.</li>
                        </ul>
                    </div>
                    
                    <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">The Archiving Incantation</h3>
                    <p>
                        Execute this command to archive the old era and begin the new.
                    </p>
                    <CodeBlock lang="bash">{finalCommand}</CodeBlock>
                </div>
            </div>
        </div>
    );
};
