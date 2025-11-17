import React from 'react';
import { CloseIcon, SignalIcon } from '../core/Icons';
import { CodeBlock } from '../core/CodeBlock';

interface GrandConcordanceModalProps {
  onClose: () => void;
}

const CONCORDANCE_SCRIPT_RAW = `#!/bin/bash
set -euo pipefail

echo "--- Grand Concordance Ritual ---"
echo "This intelligent ritual forges an artifact (if in a package directory) and then synchronizes the entire forge with all remotes."

# --- [1/4] PREPARATION ---
THE_USER="\${SUDO_USER:-\$USER}"
USER_HOME=\$(getent passwd "\$THE_USER" | cut -d: -f6)
FORGE_BASE="\$USER_HOME/forge"
LOCAL_REPO_PATH="\$FORGE_BASE/repo"
LOCAL_PACKAGES_PATH="\$FORGE_BASE/packages"
LOCAL_KAEL_PATH="\$FORGE_BASE/kael"
REPO_DB_LOCAL="\$LOCAL_REPO_PATH/kael-os-local.db.tar.gz"

MASTER_TEMP_DIR=\$(mktemp -d)
cleanup() {
    [[ -n "\$MASTER_TEMP_DIR" && -d "\$MASTER_TEMP_DIR" ]] && rm -rf -- "\$MASTER_TEMP_DIR"
}
trap cleanup EXIT SIGINT SIGTERM

if [ ! -d "\$FORGE_BASE" ]; then
    echo "❌ ERROR: Local forge at '\$FORGE_BASE' does not exist." >&2
    exit 1
fi
echo "✅ Local Forge found."
echo ""

# --- [2/4] FORGE ARTIFACT (if applicable) ---
if [ -f "PKGBUILD" ]; then
    echo "--> [2/4] PKGBUILD detected. Forging artifact first..."
    
    if ! makepkg -sf --sign; then
        echo "❌ ERROR: makepkg failed to build or sign the artifact." >&2
        exit 1
    fi

    mapfile -t PKG_FILES < <(find . -maxdepth 1 -name "*.pkg.tar.zst" ! -name "*.sig")
    if [ \${#PKG_FILES[@]} -eq 0 ]; then
        echo "❌ ERROR: No package file found after build." >&2
        exit 1
    fi
    echo "    -> Forged artifact: \$(basename "\${PKG_FILES[0]}")"

    if [ ! -d "\$LOCAL_REPO_PATH" ]; then
        mkdir -p "\$LOCAL_REPO_PATH"
    fi

    COPIED_PKG_PATHS=()
    for pkg_path in "\${PKG_FILES[@]}"; do
        pkg_basename=\$(basename "\$pkg_path")
        sig_path="\${pkg_path}.sig"
        
        cp "\$pkg_path" "\$LOCAL_REPO_PATH/"
        COPIED_PKG_PATHS+=("\$LOCAL_REPO_PATH/\$pkg_basename")

        if [ ! -f "\$sig_path" ]; then
            echo "❌ FATAL: Signature file '\$sig_path' not found!" >&2
            exit 1
        fi
        cp "\$sig_path" "\$LOCAL_REPO_PATH/"
    done

    echo "    -> Scribing artifact into the local database..."
    repo-add --sign "\$REPO_DB_LOCAL" "\${COPIED_PKG_PATHS[@]}"
    
    echo "✅ Artifact forged and added to local Athenaeum."
    echo ""
else
    echo "--> [2/4] No PKGBUILD detected. Proceeding directly to synchronization."
    echo ""
fi

# --- [3/4] SYNC TO GITHUB ---
echo "--> [3/4] Synchronizing with all GitHub Athenaeums..."
if gh auth status &>/dev/null; then
    # Function to handle git push logic
    sync_git_repo() {
        local repo_name=\$1
        local local_path=\$2
        local remote_url=\$3
        local branch=\$4
        
        echo "    -> Syncing \$repo_name..."
        if [ ! -d "\$local_path/.git" ]; then
            echo "       -> ⚠️ SKIPPED: '\$local_path' is not a git repository."
            return
        fi
        (
            cd "\$local_path"
            git add .
            if git diff-index --quiet HEAD --; then
                echo "       -> No changes detected."
            else
                git commit -m "chore(sync): synchronize \$repo_name" -m "Full repository synchronization via Grand Concordance Ritual."
                git push "\$remote_url" "HEAD:\$branch"
                echo "       -> Pushed updates to \$branch branch."
            fi
        )
    }

    # Sync Kael OS Source
    sync_git_repo "Kael OS Project" "\$LOCAL_KAEL_PATH" "https://github.com/LeeTheOrc/Kael-OS.git" "main"

    # Sync Pacman Repo Sources (PKGBUILDs)
    sync_git_repo "Athenaeum Sources" "\$LOCAL_PACKAGES_PATH" "https://github.com/LeeTheOrc/kael-os-repo.git" "main"

    # Sync Pacman Repo Binaries (gh-pages)
    echo "    -> Syncing Athenaeum Binaries (gh-pages)..."
    TEMP_GH_PAGES_DIR="\$MASTER_TEMP_DIR/gh-pages"
    git clone --branch=gh-pages --depth=1 --single-branch "https://github.com/LeeTheOrc/kael-os-repo.git" "\$TEMP_GH_PAGES_DIR"
    rsync -av --delete --include='*.pkg.tar.zst' --include='*.pkg.tar.zst.sig' --exclude='*' "\$LOCAL_REPO_PATH/" "\$TEMP_GH_PAGES_DIR/"
    (
        cd "\$TEMP_GH_PAGES_DIR"
        # Rebuild the database from scratch to ensure integrity
        repo-add --sign --remove ./kael-os.db.tar.gz ./*.pkg.tar.zst
        git config user.name "Kael Concordance Bot"
        git config user.email "kael-bot@users.noreply.github.com"
        git add .
        if git diff-index --quiet HEAD --; then
            echo "       -> No changes detected."
        else
            git commit -m "chore(sync): synchronize pacman repository binaries"
            git push
            echo "       -> Pushed updates to gh-pages."
        fi
    )
    echo "✅ GitHub Athenaeums are now in concordance."
else
    echo "    -> Not authenticated with 'gh'. Skipping GitHub sync."
fi
echo ""

# --- [4/4] SYNC TO WEBDISK ---
echo "--> [4/4] Synchronizing full forge with WebDisk Athenaeum..."
if ! command -v mount.davfs &> /dev/null; then
    echo "    -> ⚠️ SKIPPED: 'davfs2' is not installed."
else
    ( # Subshell for WebDisk logic
        MOUNT_POINT="\$USER_HOME/WebDisk"
        WEBDAV_FORGE_PATH="\$MOUNT_POINT/forge"
        
        if ! mountpoint -q "\$MOUNT_POINT"; then
            echo "       -> WebDisk not mounted. Attempting to mount..."
            if ! sudo -u "\$THE_USER" mount "\$MOUNT_POINT"; then
                echo "    ❌ ERROR: Failed to mount WebDisk. Aborting WebDisk sync." >&2; exit 1
            fi
        fi

        mkdir -p "\$WEBDAV_FORGE_PATH"
        echo "    -> Synchronizing local forge to WebDisk..."
        rsync -avL --delete --checksum --exclude=".git" "\$FORGE_BASE/" "\$WEBDAV_FORGE_PATH/"
        
        echo "✅ Full forge synchronized to WebDisk Athenaeum."
    )
    if [ \$? -ne 0 ]; then
         echo "⚠️  WARNING: WebDisk sync failed."
    fi
fi
echo ""

echo "✨ Grand Concordance Ritual Complete! All Athenaeums are synchronized."
`;

const INSTALLER_SCRIPT_RAW = `#!/bin/bash
set -euo pipefail

# Using a heredoc with a quoted delimiter prevents shell expansion of the inner script.
cat > /tmp/grand-concordance << 'EOF'
${CONCORDANCE_SCRIPT_RAW}
EOF

chmod +x /tmp/grand-concordance
sudo mv /tmp/grand-concordance /usr/local/bin/grand-concordance

echo "✅ 'grand-concordance' command has been forged and is now globally available."
`;


export const GrandConcordanceModal: React.FC<GrandConcordanceModalProps> = ({ onClose }) => {
    const finalInstallerScript = INSTALLER_SCRIPT_RAW.replace('${CONCORDANCE_SCRIPT_RAW}', CONCORDANCE_SCRIPT_RAW);
    const encodedInstaller = btoa(unescape(encodeURIComponent(finalInstallerScript)));
    const finalInstallCommand = `echo "${encodedInstaller}" | base64 --decode | bash`;
    const runCommand = `grand-concordance`;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in-fast" onClick={onClose}>
            <div className="bg-forge-panel border-2 border-forge-border rounded-lg shadow-2xl w-full max-w-3xl p-6 m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                     <h2 className="text-xl font-bold text-forge-text-primary flex items-center gap-2 font-display tracking-wider">
                        <SignalIcon className="w-5 h-5 text-dragon-fire" />
                        <span>Grand Concordance Ritual</span>
                    </h2>
                    <button onClick={onClose} className="text-forge-text-secondary hover:text-forge-text-primary">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="overflow-y-auto pr-2 text-forge-text-secondary leading-relaxed space-y-4">
                    <p>
                        Architect, this is our new master "push" command. It intelligently forges an artifact if you are in a package directory, then synchronizes your entire local forge with all remote Athenaeums.
                    </p>
                    <p className="text-sm p-3 bg-orc-steel/10 border-l-4 border-orc-steel rounded">
                       This single, unified incantation now handles the complete publishing workflow:
                        <ul className="list-disc list-inside pl-2 mt-2 space-y-1">
                            <li><strong className="text-orc-steel">Forge (Contextual):</strong> If a <code className="font-mono text-xs">PKGBUILD</code> is present, it forges the artifact and adds it to your local Athenaeum first.</li>
                            <li><strong className="text-orc-steel">Synchronize GitHub:</strong> Pushes compiled packages (`gh-pages`), package sources (`main`), and the Kael UI source (`main`) to their respective repositories.</li>
                            <li><strong className="text-orc-steel">Synchronize WebDisk:</strong> Mirrors the entire local <code className="font-mono text-xs">~/forge</code> directory as a complete backup, activating the persistent connection if needed.</li>
                       </ul>
                    </p>

                    <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">Step 1: Forge the Command (One-Time Setup)</h3>
                    <p>
                        Run this incantation once to create the global <code className="font-mono text-xs">grand-concordance</code> command, making it available everywhere in your terminal.
                    </p>
                    <CodeBlock lang="bash">{finalInstallCommand}</CodeBlock>

                     <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">Step 2: Run the Concordance Ritual</h3>
                    <p>
                        Run this command from anywhere in your forge to synchronize everything, or run it from a package directory to forge a new artifact before synchronizing.
                    </p>
                    <CodeBlock lang="bash">{runCommand}</CodeBlock>
                </div>
            </div>
        </div>
    );
};
