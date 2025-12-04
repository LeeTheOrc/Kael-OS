import React, { useState } from 'react';
import { CloseIcon, CpuChipIcon } from '../core/Icons';
import { CodeBlock } from '../core/CodeBlock';

interface IndividualKernelForgeModalProps {
  onClose: () => void;
}

const KERNEL_BASES = ["linux", "linux-lts", "linux-zen"];
const TARGET_ARCHS = ["x86-64-v2", "x86-64-v3", "x86-64-v4"];

const generateScript = (base: string, arch: string): string => {

    return `#!/bin/bash
(
set -euo pipefail

echo "--- The Single Dragon's Breath Forge (v19) ---"
echo "This ritual forges one specific, optimized kernel from source."
echo ""

# --- [STEP 0/5] CONFIGURATION ---
export USER_HOME=\$(getent passwd "\${SUDO_USER:-\$USER}")
export ARMORY_FORGE="\${USER_HOME}/forge/packages/kael-kernel-armory"
export KERNEL_SOURCE_CACHE="\${ARMORY_FORGE}/source_cache"
export LOCAL_REPO_PATH="\${USER_HOME}/forge/repo"
export KERNEL_BASE="${base}"
export TARGET_ARCH="${arch}"

# --- [STEP 1/5] SUMMON & PREPARE SOURCE ---
echo "--> [1/5] Summoning & Preparing Source for \${KERNEL_BASE}..."
mkdir -p "\${KERNEL_SOURCE_CACHE}"
if [ -d "\${KERNEL_SOURCE_CACHE}/\${KERNEL_BASE}/.git" ]; then
    echo "    -> Existing source found. Updating..."
    if ! (cd "\${KERNEL_SOURCE_CACHE}/\${KERNEL_BASE}" && git fetch && git reset --hard origin/master); then
        echo "    -> ⚠️  Failed to update existing source for \${KERNEL_BASE}. Check network or permissions."
    fi
else
    echo "    -> Cloning new source..."
    if ! git clone --depth=1 "https://gitlab.archlinux.org/archlinux/packaging/packages/\${KERNEL_BASE}.git" "\${KERNEL_SOURCE_CACHE}/\${KERNEL_BASE}"; then
        echo "    -> ❌ FAILED to clone \${KERNEL_BASE}. Check network or permissions."
        exit 1
    fi
fi

# DYNAMIC NAMING
_basever=\$(grep "^pkgver=" "\${KERNEL_SOURCE_CACHE}/\${KERNEL_BASE}/PKGBUILD" | cut -d'=' -f2 | sed -e 's|\\.arch.*||' -e 's|\\.lts.*||' -e 's|\\.zen.*||')
_pkg_suffix=\$(echo "\${TARGET_ARCH}" | sed 's/x86-64-//')
if [ "\${KERNEL_BASE}" == "linux" ]; then
    export PKG_NAME="kaelic-kernel-\${_basever}-\${_pkg_suffix}"
else
    _base_suffix=\$(echo "\${KERNEL_BASE}" | sed 's/linux-//')
    export PKG_NAME="kaelic-kernel-\${_basever}-\${_base_suffix}-\${_pkg_suffix}"
fi
export PKG_NAME_SANITIZED=\$(echo "\${PKG_NAME}" | sed 's/-/_/g')
export BUILD_DIR="\${ARMORY_FORGE}/\${PKG_NAME}"

echo "    -> Scribing blueprint for \${PKG_NAME}..."
rm -rf "\${BUILD_DIR}"
mkdir -p "\${BUILD_DIR}"
rsync -a --delete "\${KERNEL_SOURCE_CACHE}/\${KERNEL_BASE}/" "\${BUILD_DIR}/" --exclude ".git"
cd "\${BUILD_DIR}"
echo "✅ Forge is ready at \${BUILD_DIR}"
echo ""

# --- [STEP 2/5] ATTUNING THE BLUEPRINT ---
echo "--> [2/5] Attuning blueprint with The Phoenix Pact..."
(
    # 1. Docs removal
    perl -i -p0e 's/_package-docs\\s*\\(\\)\\s*\\{[\\s\\S]*?\\}//gm' PKGBUILD
    perl -i -p0e "s/package_\${KERNEL_BASE}-docs\\s*\\(\\)\\s*\\{[\\s\\S]*?\\}//gm" PKGBUILD
    sed -i "s/['\\"]\${KERNEL_BASE}-docs['\\"]//g" PKGBUILD

    # 2. Rename pkgbase
    sed -i "s/^pkgbase=.*/pkgbase='\${PKG_NAME}'/" PKGBUILD

    # 3. Atomically modify main package function
    perl -i -p0e '
        my \$pkg_name_sanitized = "'"\${PKG_NAME_SANITIZED}"'";
        my \$base = "'"\${KERNEL_BASE}"'";
        s/(package_)\\Q\${base}\\E(\\(\\)\\s*\\{)([\\s\\S]*?)(^\\})/\\$1 . \$pkg_name_sanitized . \\$2 . "  provides=(\\x27\${base}\\x27)\\n  conflicts=(\\x27\${base}\\x27)\\n  replaces=(\\x27\${base}\\x27)\\n" . do { my \$s = \$3; \$s =~ s!^[ \t]*(provides|conflicts|replaces)=\\([\\s\\S]*?\\)!!gm; \$s } . \$4/gem;
    ' PKGBUILD
    
    # 4. Atomically modify headers package function
    perl -i -p0e '
        my \$pkg_name_sanitized = "'"\${PKG_NAME_SANITIZED}"'";
        my \$base = "'"\${KERNEL_BASE}"'";
        s/(package_)\\Q\${base}\\E-headers(\\(\\)\\s*\\{)([\\s\\S]*?)(^\\})/\\$1 . \$pkg_name_sanitized . "-headers" . \\$2 . "  provides=(\\x27\${base}-headers\\x27)\\n  conflicts=(\\x27\${base}-headers\\x27)\\n  replaces=(\\x27\${base}-headers\\x27)\\n" . do { my \$s = \$3; \$s =~ s!^[ \t]*(provides|conflicts|replaces)=\\([\\s\\S]*?\\)!!gm; \$s } . \$4/gem;
    ' PKGBUILD

    # 5. Inject compiler flags
    sed -i "/^build() {/a \\  export KBUILD_CFLAGS+=' -march=\${TARGET_ARCH} -O3 -pipe -fno-plt -fexceptions -fstack-protector-strong -fno-semantic-interposition -falign-functions=32'\\n  export KBUILD_CXXFLAGS+=' -march=\${TARGET_ARCH} -O3 -pipe -fno-plt -fexceptions -fstack-protector-strong -fno-semantic-interposition -falign-functions=32'\\n  export LDFLAGS='-Wl,-O1,--sort-common,--as-needed,-z,relro,-z,now'" PKGBUILD
    sed -i "s/!strip/!strip lto/" PKGBUILD

    # 6. Attune .config
    sed -i -e '/CONFIG_HZ_250=y/d' -e '/# CONFIG_HZ_1000 is not set/d' config
    echo "CONFIG_HZ_1000=y" >> config
)
echo "✅ Blueprint is attuned."
echo ""

# --- [STEP 3/5] THE LONG RITUAL (COMPILATION) ---
echo "--> [3/5] Beginning the Long Ritual. This will take significant time."
updpkgsums
makepkg -scf --noconfirm
echo "✅ Kernel forged."
echo ""

# --- [STEP 4/5] LOCAL CONCORDANCE ---
echo "--> [4/5] Signing and publishing to local Athenaeum..."
export GPG_TTY=\$(tty)
gpg-connect-agent updatestartuptty /bye >/dev/null || true
mkdir -p "\${LOCAL_REPO_PATH}"

PKG_PATH=\$(find . -name "\${PKG_NAME}*.pkg.tar.zst" -print -quit)
HEADERS_PATH=\$(find . -name "\${PKG_NAME}-headers*.pkg.tar.zst" -print -quit)

gpg --yes --detach-sign --no-armor "\${PKG_PATH}"
gpg --yes --detach-sign --no-armor "\${HEADERS_PATH}"
cp "\${PKG_PATH}" "\${PKG_PATH}.sig" "\${HEADERS_PATH}" "\${HEADERS_PATH}.sig" "\${LOCAL_REPO_PATH}/"

(
    cd "\${LOCAL_REPO_PATH}"
    repo-add --sign --remove "kael-os-local.db.tar.gz" "\$(basename \${PKG_PATH})" "\$(basename \${HEADERS_PATH})"
)
echo "✅ Published to Local Athenaeum."
echo ""
echo "✨ Ritual Complete! '\${PKG_NAME}' is forged and ready."
)
`;
};

export const IndividualKernelForgeModal: React.FC<IndividualKernelForgeModalProps> = ({ onClose }) => {
    const [activeBase, setActiveBase] = useState(KERNEL_BASES[0]);
    const [activeArch, setActiveArch] = useState(TARGET_ARCHS[0]);

    const script = generateScript(activeBase, activeArch);
    const finalCommand = `bash <<'EOF'\n${script}\nEOF`;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in-fast" onClick={onClose}>
            <div className="bg-forge-panel border-2 border-forge-border rounded-lg shadow-2xl w-full max-w-4xl p-6 m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center mb-4 flex-shrink-0">
                     <h2 className="text-xl font-bold text-forge-text-primary flex items-center gap-2 font-display tracking-wider">
                        <CpuChipIcon className="w-5 h-5 text-dragon-fire" />
                        <span>The Single Forge (Dragon's Breath v19)</span>
                    </h2>
                    <button onClick={onClose} className="text-forge-text-secondary hover:text-forge-text-primary">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </header>

                <div className="flex gap-2 border-b-2 border-forge-border mb-4">
                    {KERNEL_BASES.map(base => (
                        <button 
                            key={base}
                            onClick={() => setActiveBase(base)} 
                            className={`px-4 py-2 text-sm font-semibold transition-colors border-b-4 capitalize ${activeBase === base ? 'border-dragon-fire text-dragon-fire' : 'border-transparent text-forge-text-secondary hover:text-forge-text-primary'}`}
                        >
                            {base.replace('linux-', '')}
                        </button>
                    ))}
                </div>
                
                <div className="flex gap-1 mb-4 flex-wrap">
                     {TARGET_ARCHS.map(arch => (
                        <button 
                            key={arch}
                            onClick={() => setActiveArch(arch)} 
                            className={`px-3 py-1 text-xs font-mono rounded-full border transition-colors ${activeArch === arch ? 'bg-orc-steel text-forge-bg border-orc-steel' : 'bg-forge-bg border-forge-border text-forge-text-secondary hover:border-orc-steel/50 hover:text-orc-steel'}`}
                        >
                           {arch.replace('x86-64-', '')}
                        </button>
                    ))}
                </div>

                <div className="overflow-y-auto pr-2 text-forge-text-secondary leading-relaxed space-y-6">
                    <p>
                        This ritual forges a single, specific kernel using the new <strong className="text-dragon-fire">Dragon's Breath Forge (v19)</strong> logic, including the dynamic version-based naming.
                    </p>
                    <CodeBlock lang="bash">{finalCommand}</CodeBlock>
                </div>
            </div>
        </div>
    );
};
