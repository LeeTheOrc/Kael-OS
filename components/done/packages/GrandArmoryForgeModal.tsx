import React, { useState } from 'react';
import { CloseIcon, CpuChipIcon } from '../../core/Icons';
import { CodeBlock } from '../../core/CodeBlock';

interface GrandArmoryForgeModalProps {
  onClose: () => void;
}

// --- SCRIPT DEFINITIONS (v32 - The Solid Ground Pact) ---

const STEP_1_SUMMON_SOURCES = `#!/bin/bash
set -euo pipefail
echo "--- The Dragon's Breath Forge - Step 1/6: Summoning Kernel Sources (The Adamant Pact) ---"
echo ""

export USER_HOME=\$(getent passwd "\${SUDO_USER:-\$USER}")
export ARMORY_FORGE="\${USER_HOME}/forge/packages/kael-kernel-armory"
export KERNEL_BASES="linux linux-lts linux-zen"
export KERNEL_SOURCE_CACHE="\${ARMORY_FORGE}/source_cache"
REPO_URL="https://github.com/archlinux/svntogit-packages.git"
GITLAB_BASE_URL="https://gitlab.archlinux.org/archlinux/packaging/packages"

mkdir -p "\${KERNEL_SOURCE_CACHE}"
for base in \${KERNEL_BASES}; do
    CLONE_DIR="\${KERNEL_SOURCE_CACHE}/\${base}"
    BRANCH_NAME="packages/\${base}/trunk"
    
    echo "--> Summoning source for \${base}..."
    if [ -d "\${CLONE_DIR}/.git" ]; then
        echo "    -> Existing source found. Validating and updating..."
        (
            cd "\${CLONE_DIR}"
            CURRENT_URL=\$(git remote get-url origin)
            
            if [[ "\$CURRENT_URL" != *svntogit-packages* ]]; then
                echo "    -> Outdated/incorrect source remote detected. Re-cloning from GitHub..."
                cd ..
                rm -rf "\${CLONE_DIR}"
                if ! git clone --branch "\$BRANCH_NAME" --single-branch "\$REPO_URL" "\${CLONE_DIR}"; then
                     echo "    -> ❌ FAILED to re-clone \${base}. Aborting."
                     exit 1
                fi
            else
                 if ! (git fetch origin "\$BRANCH_NAME" && git reset --hard "origin/\$BRANCH_NAME"); then
                    echo "    -> ⚠️  Failed to update existing source for \${base}. Check network or permissions."
                 fi
            fi
        )
    else
        echo "    -> Cloning new source from GitHub svntogit mirror..."
        if ! git clone --branch "\$BRANCH_NAME" --single-branch "\$REPO_URL" "\${CLONE_DIR}"; then
            echo "    -> ⚠️  GitHub mirror failed. Falling back to GitLab..."
            if ! git clone --depth=1 "\${GITLAB_BASE_URL}/\${base}.git" "\${CLONE_DIR}"; then
                echo "    -> ❌ FAILED to clone \${base} from all sources. Check network or permissions."
                exit 1
            fi
        fi
    fi
done
echo "✅ All kernel sources are up to date."
`;

const STEP_2_SCRIBE_BLUEPRINTS = `#!/bin/bash
set -euo pipefail
echo "--- The Dragon's Breath Forge - Step 2/6: Scribing Blueprints (The Adamant Pact) ---"
echo ""

export USER_HOME=\$(getent passwd "\${SUDO_USER:-\$USER}")
export ARMORY_FORGE="\${USER_HOME}/forge/packages/kael-kernel-armory"
export TARGET_ARCHS="x86-64-v2 x86-64-v3 x86-64-v4 znver4 znver5"
export KERNEL_BASES="linux linux-lts linux-zen"
export KERNEL_SOURCE_CACHE="\${ARMORY_FORGE}/source_cache"

# THE PRESERVING PACT: Purge old blueprints but preserve the source_cache
echo "--> Purging old blueprints (preserving source_cache)..."
find "\${ARMORY_FORGE}" -mindepth 1 -maxdepth 1 -type d ! -name 'source_cache' -exec rm -rf {} +
# Ensure base directory exists if it was totally empty before
mkdir -p "\${ARMORY_FORGE}"

for base in \${KERNEL_BASES}; do
    _basever=\$(grep "^pkgver=" "\${KERNEL_SOURCE_CACHE}/\${base}/PKGBUILD" | cut -d'=' -f2 | sed -e 's|\\.arch.*||' -e 's|\\.lts.*||' -e 's|\\.zen.*||')
    for arch in \${TARGET_ARCHS}; do
        _pkg_suffix=\$(echo "\${arch}" | sed 's/x86-64-//')
        if [ "\${base}" == "linux" ]; then
            _pkg_name="kaelic-kernel-\${_basever}-\${_pkg_suffix}"
        else
            _base_suffix=\$(echo "\${base}" | sed 's/linux-//')
            _pkg_name="kaelic-kernel-\${_basever}-\${_base_suffix}-\${_pkg_suffix}"
        fi
        
        build_dir="\${ARMORY_FORGE}/\${_pkg_name}"
        echo "    -> Scribing blueprint for \${_pkg_name}..."
        mkdir -p "\${build_dir}"
        rsync -a --delete "\${KERNEL_SOURCE_CACHE}/\${base}/" "\${build_dir}/" --exclude ".git"
    done
done
echo "✅ All blueprints have been scribed."
`;

const STEP_3_ATTUNE_BLUEPRINTS = `#!/bin/bash
set -euo pipefail
echo "--- The Dragon's Breath Forge - Step 3/6: Attuning Blueprints (The Adamant Pact) ---"
echo ""

export USER_HOME=\$(getent passwd "\${SUDO_USER:-\$USER}")
export ARMORY_FORGE="\${USER_HOME}/forge/packages/kael-kernel-armory"
export TARGET_ARCHS="x86-64-v2 x86-64-v3 x86-64-v4 znver4 znver5"
export KERNEL_BASES="linux linux-lts linux-zen"
export KERNEL_SOURCE_CACHE="\${ARMORY_FORGE}/source_cache"

for base in \${KERNEL_BASES}; do
    _basever=\$(grep "^pkgver=" "\${KERNEL_SOURCE_CACHE}/\${base}/PKGBUILD" | cut -d'=' -f2 | sed -e 's|\\.arch.*||' -e 's|\\.lts.*||' -e 's|\\.zen.*||')
    for arch in \${TARGET_ARCHS}; do
        _pkg_suffix=\$(echo "\${arch}" | sed 's/x86-64-//')
        if [ "\${base}" == "linux" ]; then
            _pkg_name="kaelic-kernel-\${_basever}-\${_pkg_suffix}"
        else
            _base_suffix=\$(echo "\${base}" | sed 's/linux-//')
            _pkg_name="kaelic-kernel-\${_basever}-\${_base_suffix}-\${_pkg_suffix}"
        fi
        
        build_dir="\${ARMORY_FORGE}/\${_pkg_name}"
        echo "    -> Attuning \${_pkg_name}..."
        (
            cd "\${build_dir}"

            # 1. Docs removal
            sed -i -E "s/ ('\${base}-docs'|\\s+\${base}-docs)//" PKGBUILD
            sed -i "/package_.*-docs()/,/}/d" PKGBUILD

            # 2. Rename pkgbase
            sed -i "s/^pkgbase=.*/pkgbase='\${_pkg_name}'/" PKGBUILD

            # 3. Inject provides/conflicts/replaces (The Adamant Pact)
            perl -i -p0e '
                my \$pkg_name = "'\${_pkg_name}'";
                my \$base_name = "'\${base}'";
                s/(package_)\\Q\$base_name\\E(\\(\\)\\s*\\{)([\\s\\S]*?)(^\\})/\\$1 . \$pkg_name . \\$2 . "  provides=(\\x27\$base_name\\x27)\\n  conflicts=(\\x27\$base_name\\x27)\\n  replaces=(\\x27\$base_name\\x27)\\n" . do { my \$s = \$3; \$s =~ s!^[ \t]*(provides|conflicts|replaces)=\\([\\s\\S]*?\\)!!gm; \$s } . \$4/gem;
            ' PKGBUILD
            
            perl -i -p0e '
                my \$pkg_name = "'\${_pkg_name}'";
                my \$base_name = "'\${base}'";
                s/(package_)\\Q\$base_name\\E-headers(\\(\\)\\s*\\{)([\\s\\S]*?)(^\\})/\\$1 . \$pkg_name . "-headers" . \\$2 . "  provides=(\\x27\$base_name-headers\\x27)\\n  conflicts=(\\x27\$base_name-headers\\x27)\\n  replaces=(\\x27\$base_name-headers\\x27)\\n" . do { my \$s = \$3; \$s =~ s!^[ \t]*(provides|conflicts|replaces)=\\([\\s\\S]*?\\)!!gm; \$s } . \$4/gem;
            ' PKGBUILD

            # 4. Inject compiler flags
            sed -i "/^build() {/a \\
    export KBUILD_CFLAGS+=' -march=\${arch} -O3 -pipe -fno-plt -fexceptions -fstack-protector-strong -fno-semantic-interposition -falign-functions=32'\\
    export KBUILD_CXXFLAGS+=' -march=\${arch} -O3 -pipe -fno-plt -fexceptions -fstack-protector-strong -fno-semantic-interposition -falign-functions=32'\\
    export LDFLAGS='-Wl,-O1,--sort-common,--as-needed,-z,relro,-z,now'
" PKGBUILD
            sed -i "s/!strip/!strip lto/" PKGBUILD

            # 5. Attune .config
            sed -i -e '/CONFIG_HZ_250=y/d' -e '/# CONFIG_HZ_1000 is not set/d' config
            echo "CONFIG_HZ_1000=y" >> config
        )
    done
done
echo "✅ All sources are prepared and attuned."
`;

const STEP_4_FORGE_KERNELS = `#!/bin/bash
set -euo pipefail
echo "--- The Dragon's Breath Forge - Step 4/6: The Long Ritual (The Adamant Pact) ---"
echo ""

export USER_HOME=\$(getent passwd "\${SUDO_USER:-\$USER}")
export ARMORY_FORGE="\${USER_HOME}/forge/packages/kael-kernel-armory"

# The Armorer's Gambit: Instead of recalculating every path (which was failing),
# we simply iterate over the blueprint directories created in Step 2. This is more robust.
for build_dir in "\${ARMORY_FORGE}"/kaelic-kernel-*/; do
    if [ -d "\$build_dir" ]; then
        # remove trailing slash for clean basename
        build_dir=\${build_dir%/}
        echo ""
        echo "--> Forging \$(basename "\$build_dir")..."
        # Execute makepkg inside the directory
        (cd "\$build_dir" && updpkgsums && makepkg -scf --noconfirm)
    fi
done

echo "✅ All kernels forged."
`;

const STEP_5_LOCAL_CONCORDANCE = `#!/bin/bash
set -euo pipefail
echo "--- The Dragon's Breath Forge - Step 5/6: Local Concordance (The Artificer's Pact) ---"
echo ""

export USER_HOME=\$(getent passwd "\${SUDO_USER:-\$USER}")
export ARTIFACTS_PATH="\${USER_HOME}/forge/artifacts"
export LOCAL_REPO_PATH="\${USER_HOME}/forge/repo"

export GPG_TTY=\$(tty)
gpg-connect-agent updatestartuptty /bye >/dev/null || true
mkdir -p "\${LOCAL_REPO_PATH}"

echo "--> Clearing old kernel artifacts from local Athenaeum..."
find "\${LOCAL_REPO_PATH}" -maxdepth 1 -name "kaelic-kernel-*.pkg.tar.zst*" -delete

echo "--> Gathering, signing, and publishing new artifacts from \${ARTIFACTS_PATH}..."
# The Artificer's Pact: We now look for artifacts in the correct PKGDEST folder.
mapfile -t PKG_PATHS < <(find "\${ARTIFACTS_PATH}" -maxdepth 1 -name "kaelic-kernel-*.pkg.tar.zst")

if [ \${#PKG_PATHS[@]} -eq 0 ]; then
    echo "⚠️  WARNING: No forged kernel artifacts were found in \${ARTIFACTS_PATH}."
    echo "   This may indicate a failure in Step 4, or that 'makepkg.conf' is not configured to output packages to that directory."
else
    for pkg_path in "\${PKG_PATHS[@]}"; do
        if [ -f "\$pkg_path" ]; then
            echo "    -> Publishing \$(basename "\$pkg_path")"
            # Sign the artifact before publishing
            gpg --yes --detach-sign --no-armor "\$pkg_path"
            # Copy both the package and its new signature
            cp "\$pkg_path" "\${pkg_path}.sig" "\${LOCAL_REPO_PATH}/"
        fi
    done
    
    echo "--> Clearing artifacts staging area..."
    find "\${ARTIFACTS_PATH}" -maxdepth 1 -name "kaelic-kernel-*.pkg.tar.zst*" -delete
fi

echo "--> Updating local Athenaeum database..."
(cd "\${LOCAL_REPO_PATH}" && repo-add --sign --remove "kael-os-local.db.tar.gz" ./*.pkg.tar.zst)
echo "✅ Local Athenaeum is in concordance."
`;

const STEP_6_REMOTE_CONCORDANCE = `#!/bin/bash
set -euo pipefail
echo "--- The Dragon's Breath Forge - Step 6/6: Remote Concordance (The Solid Ground Pact) ---"
echo "This ritual synchronizes the entire local Athenaeum to all remote mirrors."
echo ""

# --- [1/4] PREPARATION ---
export USER_HOME=\$(getent passwd "\${SUDO_USER:-\$USER}")
LOCAL_REPO_PATH="\$USER_HOME/forge/repo"
# The Solid Ground Pact: Use a persistent directory to avoid /tmp space issues with LFS
GH_CLONE_DIR="\$USER_HOME/forge/repo_src_lfs"

if [ ! -d "\$LOCAL_REPO_PATH" ] || [ -z "\$(ls -A "\$LOCAL_REPO_PATH")" ]; then
    echo "❌ ERROR: Local Athenaeum at '\$LOCAL_REPO_PATH' is empty or does not exist." >&2
    exit 1
fi
echo "✅ Local Athenaeum is populated and ready for sync."
echo ""

# --- [2/4] WAKING THE GPG AGENT ---
echo "--> [2/4] Waking the GPG Agent..."
export GPG_TTY=\$(tty <&1)
gpg-connect-agent updatestartuptty /bye >/dev/null || true
if ! echo "test" | gpg --clearsign >/dev/null 2>&1; then
    echo "⚠️  GPG test signature failed. The agent may not be able to prompt for your passphrase."
fi
echo "✅ GPG Agent is ready."
echo ""

# --- [3/4] SYNC TO ALL ATHENAEUMS (GITHUB & WEBDISK) ---
echo "--> [3/4] Synchronizing with GitHub Athenaeum..."
if gh auth status &>/dev/null; then
    GH_REPO_URL="https://github.com/LeeTheOrc/kael-os-repo.git"
    
    if [ -d "\$GH_CLONE_DIR/.git" ]; then
        echo "    -> Found existing persistent clone. Pulling latest changes..."
        (cd "\$GH_CLONE_DIR" && git pull)
    else
        echo "    -> No persistent clone found. Cloning gh-pages branch to \$GH_CLONE_DIR..."
        git clone --branch=gh-pages --depth=1 --single-branch "\$GH_REPO_URL" "\$GH_CLONE_DIR"
    fi
    
    echo "    -> Mirroring all artifacts to the clone root..."
    rsync -av --delete --include='*.pkg.tar.zst' --include='*.pkg.tar.zst.sig' --exclude='*' "\$LOCAL_REPO_PATH/" "\$GH_CLONE_DIR/"

    (
        cd "\$GH_CLONE_DIR"
        echo "    -> Re-sanctifying the GitHub Athenaeum database (kael-os-repo.db)..."
        repo-add --sign --remove ./kael-os-repo.db.tar.gz ./*.pkg.tar.zst
        git config user.name "Kael Concordance Bot"
        git config user.email "kael-bot@users.noreply.github.com"
        git add .
        if git diff-index --quiet HEAD --; then
            echo "    -> No changes detected for GitHub Athenaeum."
        else
            git commit -m "chore(armory): publish all forged kernels"
            git push
        fi
    )
    echo "✅ GitHub Athenaeum is in concordance."
else
    echo "    -> ⚠️  Not authenticated with 'gh'. Skipping GitHub sync."
fi
echo ""

echo "--> Synchronizing with WebDisk Mount..."
MOUNT_ROOT=""
if [ -d "\$USER_HOME/host_webdisk" ]; then MOUNT_ROOT="\$USER_HOME/host_webdisk"; fi
if [ -d "\$USER_HOME/WebDisk" ]; then MOUNT_ROOT="\$USER_HOME/WebDisk"; fi

if [ -n "\$MOUNT_ROOT" ] && [ -d "\$MOUNT_ROOT" ]; then
    LOCAL_WEBDISK_REPO="\$MOUNT_ROOT/repo"
    if [ ! -d "\$LOCAL_WEBDISK_REPO" ]; then mkdir -p "\$LOCAL_WEBDISK_REPO"; fi
    
    echo "    -> 🚀 Syncing via local filesystem to \$MOUNT_ROOT..."
    rsync -rtv --delete --copy-links --no-owner --no-group "\$LOCAL_REPO_PATH/" "\$LOCAL_WEBDISK_REPO/"
    
    (
        cd "\$LOCAL_WEBDISK_REPO"
        echo "    -> Transmuting database names for Unified Mirrorlist..."
        for db_file in kael-os-local.db*; do
            if [ -f "\$db_file" ]; then mv "\$db_file" "\${db_file/kael-os-local/kael-os-repo}"; fi
        done
        for files_file in kael-os-local.files*; do
            if [ -f "\$files_file" ]; then mv "\$files_file" "\${files_file/kael-os-local/kael-os-repo}"; fi
        done
    )
    echo "✅ WebDisk Athenaeum synchronized."
else
    echo "    -> ⚠️  WebDisk mount not found. Skipping WebDisk sync."
fi
echo ""

# --- [4/4] COMPLETION ---
echo "--> [4/4] Reminding to synchronize local pacman databases..."
echo "    Run 'sudo pacman -Syyu' to ensure your system sees the latest changes."
echo ""
echo "✨ THE DRAGON'S BREATH FORGE IS COMPLETE. THE GRAND ARMORY IS PUBLISHED."
`;


const steps = [
    { num: 1, title: "Summon Sources", script: STEP_1_SUMMON_SOURCES, description: "Clones or updates the official Arch Linux kernel packaging sources from a reliable GitHub mirror." },
    { num: 2, title: "Scribe Blueprints", script: STEP_2_SCRIBE_BLUEPRINTS, description: "Creates a unique build directory for each of the 15 kernel variants using the new dynamic naming scheme." },
    { num: 3, title: "Attune Blueprints", script: STEP_3_ATTUNE_BLUEPRINTS, description: "Applies the 'Adamant Pact' to each PKGBUILD, surgically injecting optimizations and compatibility shims to prevent build errors." },
    { num: 4, title: "Forge All Kernels", script: STEP_4_FORGE_KERNELS, description: "The Longest Ritual. This compiles all 15 kernel variants in sequence using the robust 'Armorer's Gambit' logic. This will take a significant amount of time." },
    { num: 5, title: "Local Concordance", script: STEP_5_LOCAL_CONCORDANCE, description: "The Artificer's Pact: Gathers kernels from the correct `artifacts` directory, signs them, and publishes them to your local Athenaeum (~/forge/repo)." },
    { num: 6, title: "Remote Concordance", script: STEP_6_REMOTE_CONCORDANCE, description: "Invokes 'The Solid Ground Pact', a full-repository sync that uses a persistent local clone to prevent out-of-space errors with Git LFS." },
];


export const GrandArmoryForgeModal: React.FC<GrandArmoryForgeModalProps> = ({ onClose }) => {
    const [activeStep, setActiveStep] = useState(1);
    
    const activeStepData = steps.find(s => s.num === activeStep);
    const finalCommand = activeStepData ? `bash <<'EOF'\n${activeStepData.script}\nEOF` : "";

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in-fast" onClick={onClose}>
            <div className="bg-forge-panel border-2 border-forge-border rounded-lg shadow-2xl w-full max-w-4xl p-6 m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center mb-4 flex-shrink-0">
                     <h2 className="text-xl font-bold text-forge-text-primary flex items-center gap-2 font-display tracking-wider">
                        <CpuChipIcon className="w-5 h-5 text-dragon-fire" />
                        <span>The Dragon's Breath Forge (v32 - The Solid Ground Pact)</span>
                    </h2>
                    <button onClick={onClose} className="text-forge-text-secondary hover:text-forge-text-primary">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </header>
                
                <div className="flex gap-1 border-b-2 border-forge-border mb-4 flex-wrap">
                    {steps.map(step => (
                        <button 
                            key={step.num}
                            onClick={() => setActiveStep(step.num)}
                            className={`px-3 py-2 text-sm font-semibold transition-colors border-b-4 ${activeStep === step.num ? 'border-dragon-fire text-dragon-fire' : 'border-transparent text-forge-text-secondary hover:text-forge-text-primary'}`}
                        >
                            Step {step.num}: {step.title}
                        </button>
                    ))}
                </div>

                <div className="overflow-y-auto pr-2 text-forge-text-secondary leading-relaxed space-y-4">
                    {activeStepData && (
                        <div className="animate-fade-in">
                            <p className="text-sm p-3 bg-orc-steel/10 border-l-4 border-orc-steel rounded">
                                <strong className="text-orc-steel">Step {activeStepData.num}: {activeStepData.title}</strong><br/>
                                {activeStepData.description}
                            </p>
                            <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">Incantation for Step {activeStepData.num}</h3>
                            <CodeBlock lang="bash">{finalCommand}</CodeBlock>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
