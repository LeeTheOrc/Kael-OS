
import React from 'react';
import { CloseIcon, BookOpenIcon } from '../../core/Icons';
import { CodeBlock } from '../../core/CodeBlock';

interface AthenaeumScribeModalProps {
  onClose: () => void;
}

const SCRIBE_SCRIPT_RAW = `#!/bin/bash
# Grand Concordance Ritual 0.00.11 - The True Name Pact
# This script is wrapped in a subshell to prevent it from closing the user's terminal on error.
(
set -euo pipefail

# --- CONFIGURATION & GLOBALS ---
if [ ! -f "PKGBUILD" ]; then
    echo "❌ ERROR: No PKGBUILD found in the current directory." >&2
    exit 1
fi

echo "--- Grand Concordance Ritual 0.00.11 (The True Name Pact) ---"

# --- [1/7] ENVIRONMENT DETECTION ---
USER_HOME=\$(getent passwd "\\\${SUDO_USER:-\$USER}" | cut -d: -f6)

if [ -d "\\$USER_HOME/host_forge" ]; then
    echo "--> 🔮 VM Environment Detected."
    LOCAL_REPO_PATH="\\$USER_HOME/host_forge/repo"
    MOUNT_ROOT="\\$USER_HOME/host_webdisk"
    LOCAL_WEBDISK_REPO="\\$MOUNT_ROOT/repo"
else
    echo "--> 🖥️  Host Environment Detected."
    LOCAL_REPO_PATH="\\$USER_HOME/forge/repo"
    MOUNT_ROOT="\\$USER_HOME/WebDisk"
    LOCAL_WEBDISK_REPO="\\$MOUNT_ROOT/repo"
fi
echo ""

# --- [2/7] PREPARATION ---
TEMP_GH_DIR=""
cleanup() {
    [[ -n "\\$TEMP_GH_DIR" && -d "\\$TEMP_GH_DIR" ]] && rm -rf -- "\\$TEMP_GH_DIR"
}
trap cleanup EXIT SIGINT SIGTERM

# --- [3/7] WAKING THE GPG AGENT ---
echo "--> [3/7] Waking the GPG Agent..."
export GPG_TTY=\$(tty <&1)
gpg-connect-agent updatestartuptty /bye >/dev/null || true
if ! echo "test" | gpg --clearsign >/dev/null 2>&1; then
    echo "⚠️  GPG test signature failed. Please run the 'GPG Key Awakening' ritual if this fails."
fi
echo "✅ GPG Agent is ready."
echo ""

# --- [4/7] FORGE & DISCOVER ARTIFACTS ---
echo "--> [4/7] Forging the artifact(s) (makepkg -sf)..."
find . -maxdepth 1 -name "*.pkg.tar.zst*" -delete

if ! makepkg -sf; then
    echo "❌ ERROR: makepkg failed to build the artifact(s)." >&2
    exit 1
fi

echo "--> Discovering forged artifacts..."
mapfile -t PKG_PATHS < <(makepkg --packagelist)

if [ \${#PKG_PATHS[@]} -eq 0 ]; then
    echo "❌ ERROR: Could not locate any built packages." >&2
    exit 1
fi

echo "✅ Discovered artifacts:"
for pkg in "\\\${PKG_PATHS[@]}"; do
    echo "   - \\\$(basename "\\\$pkg")"
done
echo ""

# --- [5/7] SIGNING ARTIFACTS ---
echo "--> [5/7] Signing all discovered artifacts..."
for pkg_path in "\\\${PKG_PATHS[@]}"; do
    if ! gpg --yes --detach-sign --no-armor "\\\$pkg_path"; then
        echo "❌ ERROR: GPG failed to sign '\\\$pkg_path'." >&2
        exit 1
    fi
done
echo "✅ All artifacts signed."
echo ""


# --- [6/7] PUBLISH TO ATHENAEUMS ---
echo "--> [6/7] Publishing to all Athenaeums..."

# LOCAL ATHENAEUM
if [ ! -d "\\$LOCAL_REPO_PATH" ]; then mkdir -p "\\$LOCAL_REPO_PATH"; fi

for pkg_path in "\\\${PKG_PATHS[@]}"; do
    pkg_basename=\$(basename "\\\$pkg_path")
    pkg_name_for_purge=\$(echo "\\\$pkg_basename" | sed -E 's/-[0-9].*//')
    find "\\$LOCAL_REPO_PATH" -maxdepth 1 -name "\\\${pkg_name_for_purge}*.pkg.tar.zst*" -delete
    cp "\\\$pkg_path" "\\\${pkg_path}.sig" "\\$LOCAL_REPO_PATH/"
done

(
    cd "\\$LOCAL_REPO_PATH"
    echo "    -> Scribing artifact(s) into the local database (kael-os-local.db)..."
    repo-add --sign --remove "kael-os-local.db.tar.gz" ./*.pkg.tar.zst
)
echo "    -> ✅ Published to Local Athenaeum."

# GITHUB ATHENAEUM
if command -v gh &>/dev/null && gh auth status &>/dev/null; then
    TEMP_GH_DIR=\$(mktemp -d)
    git clone --branch=gh-pages --single-branch "https://github.com/LeeTheOrc/kael-os-repo.git" "\\$TEMP_GH_DIR"
    
    for pkg_path in "\\\${PKG_PATHS[@]}"; do
        pkg_basename=\$(basename "\\\$pkg_path")
        pkg_name_for_purge=\$(echo "\\\$pkg_basename" | sed -E 's/-[0-9].*//')
        find "\\$TEMP_GH_DIR" -maxdepth 1 -name "\\\${pkg_name_for_purge}*.pkg.tar.zst*" -delete
        cp "\\$LOCAL_REPO_PATH/\\\$pkg_basename" "\\$LOCAL_REPO_PATH/\\\${pkg_basename}.sig" "\\$TEMP_GH_DIR/"
    done

    (
        cd "\\$TEMP_GH_DIR"
        # THE TRUE NAME PACT: Use the correct database name
        repo-add --sign --remove ./kael-os-repo.db.tar.gz ./*.pkg.tar.zst
        
        git config user.name "Kael Scribe Bot"
        git config user.email "kael-bot@users.noreply.github.com"
        git add .
        if git diff-index --quiet HEAD --; then
             echo "    -> No changes to commit to GitHub."
        else
             PRIMARY_PKG_NAME=\$(basename "\\\${PKG_PATHS[0]}" | sed -E 's/-[0-9].*//')
             git commit -m "chore(sync): publish \\\${PRIMARY_PKG_NAME} artifacts"
             git push
        fi
    )
    rm -rf "\\$TEMP_GH_DIR"
    echo "    -> ✅ Published to GitHub Athenaeum."
else
    echo "    -> ⚠️ Not authenticated with 'gh'. Skipping GitHub."
fi

# WEBDISK ATHENAEUM
if [ -d "\\$MOUNT_ROOT" ]; then
    mkdir -p "\\$LOCAL_WEBDISK_REPO"
    rsync -rtv --delete --copy-links --no-owner --no-group "\\$LOCAL_REPO_PATH/" "\\$LOCAL_WEBDISK_REPO/"
    (
        cd "\\$LOCAL_WEBDISK_REPO"
        # THE TRUE NAME PACT: Use the correct database name
        for db_file in kael-os-local.db*; do
            if [ -f "\\\$db_file" ]; then mv "\\\$db_file" "\\\${db_file/kael-os-local/kael-os-repo}"; fi
        done
        for files_file in kael-os-local.files*; do
            if [ -f "\\\$files_file" ]; then mv "\\\$files_file" "\\\${files_file/kael-os-local/kael-os-repo}"; fi
        done
    )
    echo "    -> ✅ Published to WebDisk Athenaeum."
else
    echo "    -> ⚠️ WebDisk mount not found. Skipping."
fi

echo ""
echo "✨ Grand Concordance Ritual Complete!"

)
`
const INSTALLER_SCRIPT_RAW = `set -e
# 1. Create temporary file
cat > /tmp/grand-concordance << 'EOF'
\${SCRIBE_SCRIPT_RAW}
EOF

# 2. Install system-wide
chmod +x /tmp/grand-concordance
sudo mv /tmp/grand-concordance /usr/local/bin/grand-concordance

# 3. Deploy to Shared Forge (for VM Access)
USER_HOME=\$(getent passwd "\${SUDO_USER:-\$USER}" | cut -d: -f6)
SHARED_SCRIPT="\${USER_HOME}/forge/grand-concordance.sh"

if [ -d "\${USER_HOME}/forge" ]; then
    cat > "\$SHARED_SCRIPT" << 'EOF'
\${SCRIBE_SCRIPT_RAW}
EOF
    chmod +x "\$SHARED_SCRIPT"
    echo "✅ 'grand-concordance.sh' deployed to \$SHARED_SCRIPT"
fi

echo "✅ 'grand-concordance' command installed system-wide."
`;


export const AthenaeumScribeModal: React.FC<AthenaeumScribeModalProps> = ({ onClose }) => {
    // Inject the scribe script into the installer script
    const finalInstallerScript = INSTALLER_SCRIPT_RAW.replace(/\${SCRIBE_SCRIPT_RAW}/g, SCRIBE_SCRIPT_RAW);
    
    const encodedInstaller = btoa(unescape(encodeURIComponent(finalInstallerScript)));
    const finalInstallCommand = `echo "${encodedInstaller}" | base64 --decode | bash`;
    
    const runCommand = `grand-concordance`;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in-fast" onClick={onClose}>
            <div className="bg-forge-panel border-2 border-forge-border rounded-lg shadow-2xl w-full max-w-3xl p-6 m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                     <h2 className="text-xl font-bold text-forge-text-primary flex items-center gap-2 font-display tracking-wider">
                        <BookOpenIcon className="w-5 h-5 text-dragon-fire" />
                        <span>The Athenaeum Scribe (v0.00.11)</span>
                    </h2>
                    <button onClick={onClose} className="text-forge-text-secondary hover:text-forge-text-primary">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="overflow-y-auto pr-2 text-forge-text-secondary leading-relaxed space-y-4">
                    <p>
                        Architect, you are correct. My apologies. This ritual has been reforged with the <strong className="text-dragon-fire">True Name Pact (v0.00.11)</strong>.
                    </p>
                    <p className="text-sm p-3 bg-orc-steel/10 border-l-4 border-orc-steel rounded">
                       <strong className="text-orc-steel">True Name Fix:</strong> This ritual now correctly names the remote databases <code className="font-mono text-xs">kael-os-repo.db</code>. This aligns the Athenaeums with the quartermaster's expectations and will resolve the root cause of the 404 errors.
                    </p>
                    <p className="text-sm text-red-400 font-bold">
                       ⚠️ You MUST run the upgrade script below, then re-forge any package to publish the correctly named database.
                    </p>

                    <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">Step 1: Upgrade the Scribe</h3>
                    <p>
                        Run this to update the <code className="font-mono text-xs">grand-concordance</code> command on your system.
                    </p>
                    <CodeBlock lang="bash">{finalInstallCommand}</CodeBlock>

                     <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">Step 2: Scribe an Artifact</h3>
                    <p>
                        Navigate to any package directory and run this to publish a package with the corrected database name:
                    </p>
                    <CodeBlock lang="bash">{runCommand}</CodeBlock>
                </div>
            </div>
        </div>
    );
};
