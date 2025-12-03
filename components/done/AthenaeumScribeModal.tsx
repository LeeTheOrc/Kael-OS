import React from 'react';
import { CloseIcon, BookOpenIcon, ServerIcon } from '../core/Icons';
import { CodeBlock } from '../core/CodeBlock';

interface AthenaeumScribeModalProps {
  onClose: () => void;
}

const SCRIBE_SCRIPT_RAW = `#!/bin/bash
# Grand Concordance Ritual v1.6 - The True Name Pact
set -euo pipefail

# --- CONFIGURATION & GLOBALS ---
PKG_DIR=\$(pwd)
PKG_NAME=\$(basename "\$PKG_DIR")
USER_HOME=\$(getent passwd "\${SUDO_USER:-\$USER}" | cut -d: -f6)
LOCAL_REPO_PATH="\$USER_HOME/forge/repo"
TEMP_GH_DIR=""
TEMP_FTPS_STAGE=""

# --- CLEANUP ---
cleanup() {
    [[ -n "\$TEMP_GH_DIR" && -d "\$TEMP_GH_DIR" ]] && rm -rf -- "\$TEMP_GH_DIR"
    [[ -n "\$TEMP_FTPS_STAGE" && -d "\$TEMP_FTPS_STAGE" ]] && rm -rf -- "\$TEMP_FTPS_STAGE"
}
trap cleanup EXIT SIGINT SIGTERM

echo "--- Grand Concordance Ritual v1.6 (The True Name Pact) ---"
echo "This ritual forges an artifact and synchronizes all Athenaeums."
echo "Target: \${PKG_NAME}"

# --- [1/5] PREPARATION & VALIDATION ---
if [ ! -f "PKGBUILD" ]; then
    echo "❌ ERROR: No PKGBUILD found. Run this from a package directory." >&2
    exit 1
fi
if ! command -v grand-concordance &>/dev/null && [ "\$EUID" -eq 0 ]; then
    echo "❌ ERROR: This script should not be run as root." >&2
    exit 1
fi
echo "✅ Validations passed."
echo ""

# --- [2/5] FORGE ARTIFACT ---
echo "--> [2/5] Forging the artifact (makepkg -sf --sign)..."
updpkgsums
if ! makepkg -sf --sign; then
    echo "❌ ERROR: makepkg failed. Check your PKGBUILD and GPG setup." >&2
    exit 1
fi

# SMART ARTIFACT DETECTION
# We use --packagelist to find WHERE makepkg put the files (e.g. ~/forge/artifacts)
echo "--> Locating forged artifacts..."
mapfile -t PKG_PATHS < <(makepkg --packagelist)

if [ \${#PKG_PATHS[@]} -eq 0 ]; then
    echo "❌ ERROR: Could not locate built packages." >&2
    exit 1
fi

echo "✅ Found artifacts:"
for pkg in "\${PKG_PATHS[@]}"; do
    echo "   - \$pkg"
done
echo ""

# --- [3/5] PUBLISH TO LOCAL ATHENAEUM ---
echo "--> [3/5] Publishing to the Local Athenaeum..."

if [ ! -d "\$LOCAL_REPO_PATH" ]; then
    mkdir -p "\$LOCAL_REPO_PATH"
fi

PKG_BASENAMES=()

for pkg_path in "\${PKG_PATHS[@]}"; do
    pkg_name=\$(basename "\$pkg_path")
    PKG_BASENAMES+=("\$pkg_name")
    
    echo "    -> Copying \$pkg_name to repo..."
    cp "\$pkg_path" "\$LOCAL_REPO_PATH/"
    
    # Handle Signature
    # makepkg --packagelist doesn't list .sig files, so we infer them.
    if [ -f "\${pkg_path}.sig" ]; then
        cp "\${pkg_path}.sig" "\$LOCAL_REPO_PATH/"
    fi
done

# We must cd into the repo path so repo-add uses relative paths correctly
cd "\$LOCAL_REPO_PATH"
echo "    -> Updating database (kael-os-local.db)..."
# Remove old versions from DB first to keep it clean (optional but good)
repo-add --sign --remove "kael-os-local.db.tar.gz" "\${PKG_BASENAMES[@]}"

echo "✅ Published to Local Athenaeum."
echo ""

# --- [4/5] SYNC TO GITHUB ATHENAEUM ---
echo "--> [4/5] Synchronizing with GitHub Athenaeum..."
if ! command -v gh &> /dev/null || ! gh auth status &>/dev/null; then
    echo "    -> GitHub CLI not configured. Skipping."
else
    GH_REPO_URL="https://github.com/LeeTheOrc/kael-os-repo.git"
    TEMP_GH_DIR=\$(mktemp -d)
    
    git clone --branch=gh-pages --depth=1 "\$GH_REPO_URL" "\$TEMP_GH_DIR"
    
    # Sync ONLY the packages we just built to the GitHub dir
    for pkg_base in "\${PKG_BASENAMES[@]}"; do
         cp "\$LOCAL_REPO_PATH/\$pkg_base" "\$TEMP_GH_DIR/"
         if [ -f "\$LOCAL_REPO_PATH/\${pkg_base}.sig" ]; then
            cp "\$LOCAL_REPO_PATH/\${pkg_base}.sig" "\$TEMP_GH_DIR/"
         fi
    done
    
    (
        cd "\$TEMP_GH_DIR"
        # Re-add to the GitHub specific DB - THE TRUE NAME PACT
        repo-add --sign --remove ./kael-os.db.tar.gz "\${PKG_BASENAMES[@]}"
        
        git config user.name "Kael Concordance Bot"
        git config user.email "kael-bot@users.noreply.github.com"
        git add .
        if git diff-index --quiet HEAD --; then
             echo "    -> No changes to commit."
        else
             git commit -m "chore(sync): publish \${PKG_NAME}"
             git push
        fi
    )
    echo "✅ GitHub Athenaeum is in concordance."
fi
echo ""

# --- [5/5] SYNC TO FTPS/WEBDISK ATHENAEUM ---
echo "--> [5/5] Synchronizing with WebDisk Athenaeum..."

# Optimisation: Check for local mount first
LOCAL_WEBDISK_REPO="\$USER_HOME/WebDisk/repo"
USE_LOCAL_WEBDISK=false

if [ -d "\$LOCAL_WEBDISK_REPO" ]; then
    echo "    -> Local WebDisk mount detected at '\$LOCAL_WEBDISK_REPO'."
    # Validate it's actually mounted/writable by creating a temp file
    if touch "\$LOCAL_WEBDISK_REPO/.kael_probe" 2>/dev/null; then
        rm "\$LOCAL_WEBDISK_REPO/.kael_probe"
        USE_LOCAL_WEBDISK=true
    else
        echo "    ⚠️  WebDisk mount appears read-only or unstable. Falling back to network sync."
    fi
fi

if [ "\$USE_LOCAL_WEBDISK" = true ]; then
    echo "    -> 🚀 Accelerating: Syncing via local filesystem..."
    
    # rsync locally with WebDAV compatibility options
    rsync -rtv --delete --copy-links --no-owner --no-group "\$LOCAL_REPO_PATH/" "\$LOCAL_WEBDISK_REPO/"
    
    # Transmute database names in place
    echo "    -> Transmuting database names for WebDisk compatibility..."
    (
        cd "\$LOCAL_WEBDISK_REPO"
        # Since we used --copy-links, the symlinks are now regular files.
        # We rename them to match the WebDisk convention.
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
    echo "    -> 'lftp' not installed and no local mount found. Skipping."
else
    echo "    -> Local mount not found/usable. Initiating FTPS upload..."
    FTP_HOST="leroyonline.co.za"
    FTP_USER="leroy@leroyonline.co.za"
    FTP_PASS='LeRoy0923!'
    FTP_REPO_PATH="/forge/repo"
    TEMP_FTPS_STAGE=\$(mktemp -d)

    # We rsync the WHOLE local repo to stage to ensure we mirror deletions/updates
    rsync -a "\$LOCAL_REPO_PATH/" "\$TEMP_FTPS_STAGE/"
    
    # Transmute DB name
    (
        cd "\$TEMP_FTPS_STAGE"
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
    
    # Mirror up
    COMMANDS="mirror -R -v --delete --only-newer \\"\$TEMP_FTPS_STAGE/\\" \\"\$FTP_REPO_PATH/\\"; quit"
    FTP_OPTIONS="set ftp:ssl-force true; set ssl:verify-certificate no;"
    if ! lftp -c "\$FTP_OPTIONS open -p 2078 -u '\$FTP_USER','\$FTP_PASS' ftp://\$FTP_HOST; \$COMMANDS"; then
        echo "⚠️  WARNING: FTPS sync failed."
    else
        echo "✅ WebDisk Athenaeum synchronized via FTPS."
    fi
fi

echo ""
echo "✨ Grand Concordance Ritual Complete for \${PKG_NAME}!"
`;

const INSTALLER_SCRIPT_RAW = `#!/bin/bash
set -e
# Create the script content in a temporary file
cat > /tmp/grand-concordance << 'EOF'
\${SCRIBE_SCRIPT_RAW}
EOF

# Make it executable and move it to a system-wide path
chmod +x /tmp/grand-concordance
sudo mv /tmp/grand-concordance /usr/local/bin/grand-concordance

echo "✅ 'grand-concordance' command has been installed to /usr/local/bin/"
`;

export const AthenaeumScribeModal: React.FC<AthenaeumScribeModalProps> = ({ onClose }) => {
    const finalInstallerScript = INSTALLER_SCRIPT_RAW.replace('\${SCRIBE_SCRIPT_RAW}', SCRIBE_SCRIPT_RAW);
    
    const encodedInstaller = btoa(unescape(encodeURIComponent(finalInstallerScript)));
    const finalInstallCommand = `echo "${encodedInstaller}" | base64 --decode | bash`;
    
    const runCommand = `grand-concordance`;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in-fast" onClick={onClose}>
            <div className="bg-forge-panel border-2 border-forge-border rounded-lg shadow-2xl w-full max-w-3xl p-6 m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                     <h2 className="text-xl font-bold text-forge-text-primary flex items-center gap-2 font-display tracking-wider">
                        <BookOpenIcon className="w-5 h-5 text-dragon-fire" />
                        <span>Grand Concordance (v1.6)</span>
                    </h2>
                    <button onClick={onClose} className="text-forge-text-secondary hover:text-forge-text-primary">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="overflow-y-auto pr-2 text-forge-text-secondary leading-relaxed space-y-4">
                    <p>
                        Architect, I have updated the Concordance Ritual to <strong className="text-dragon-fire">The True Name Pact (v1.6)</strong>.
                    </p>
                    <p className="text-sm p-3 bg-orc-steel/10 border-l-4 border-orc-steel rounded">
                       <strong className="text-orc-steel">True Name Fix:</strong> The ritual now correctly names the GitHub database <code className="font-mono text-xs">kael-os.db</code>. This will resolve the 404 errors by aligning the server's file name with what `pacman` is requesting.
                    </p>
                    <p className="text-sm text-red-400 font-bold">
                       ⚠️ You MUST run the upgrade script below to update the tool, then re-forge any package to publish the corrected database.
                    </p>

                    <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">Step 1: Upgrade the Scribe</h3>
                    <p>
                        Run this to update the <code className="font-mono text-xs">grand-concordance</code> command on your system.
                    </p>
                    <CodeBlock lang="bash">{finalInstallCommand}</CodeBlock>

                     <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">Step 2: Invoke the Ritual</h3>
                    <p>
                        Navigate to any package directory (e.g., <code className="font-mono text-xs">~/forge/packages/chronicler</code>) and run this to publish a package with the corrected database name:
                    </p>
                    <CodeBlock lang="bash">{runCommand}</CodeBlock>
                </div>
            </div>
        </div>
    );
};
