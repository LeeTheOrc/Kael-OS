import React, { useState } from 'react';
import { CloseIcon, CpuChipIcon } from '../core/Icons';
import { CodeBlock } from '../core/CodeBlock';

interface PersonalizedKernelForgeModalProps {
  onClose: () => void;
}

type KernelBlade = 'work' | 'gaming' | 'lts';
type ForgeStep = 'blueprint' | 'tempering' | 'honing';

const KERNEL_SOURCES: Record<KernelBlade, string> = {
    work: 'linux',
    gaming: 'linux-zen',
    lts: 'linux-lts',
};

const generateScript = (blade: KernelBlade, step: ForgeStep): string => {
    const source = KERNEL_SOURCES[blade];
    
    const PGO_FLAGS_GENERATE = `-fprofile-generate=/tmp/kael-pgo/${source}`;
    const PGO_FLAGS_USE = `-fprofile-use=/tmp/kael-pgo/${source}/${blade}.data`;
    const LTO_FLAGS = `-flto=thin`;

    // --- Systemd Timer Files for The Chronicler's Bell ---
    const REMINDER_SCRIPT_CONTENT = `#!/bin/bash
notify-send -u normal -i emblem-system "Kael's Chronicler Bell" "It has been a month since you forged your sovereign '${blade}' kernel. It is wise to re-forge it soon to receive the latest updates and security patches."
`;
    const REMINDER_SERVICE_CONTENT = `[Unit]
Description=Kael's monthly reminder to re-forge the sovereign ${blade} kernel.

[Service]
Type=oneshot
ExecStart=/usr/local/bin/kael-reforge-reminder-${blade}.sh
`;
    const REMINDER_TIMER_CONTENT = `[Unit]
Description=Run Kael's re-forge reminder monthly.

[Timer]
OnCalendar=monthly
Persistent=true

[Install]
WantedBy=timers.target
`;


    const commonSetup = `#!/bin/bash
set -euo pipefail
export USER_HOME=$(getent passwd "\${SUDO_USER:-\$USER}" | cut -d: -f6)
export FORGE_BASE="\$USER_HOME/forge"
export PKG_DIR="\$FORGE_BASE/packages/kaelic-kernel-sovereign-${source}"
export REPO_URL="https://github.com/archlinux/svntogit-packages.git"
export BRANCH_NAME="packages/${source}/trunk"
mkdir -p "\$PKG_DIR"
cd "\$PKG_DIR"
`;

    if (step === 'blueprint') {
        return `${commonSetup}
echo "--- The Sovereign Blade Forge - Step 1: The Blueprint ---"
echo "Kernel: ${source} | Optimizations: localmodconfig, LTO, PGO (Instrument)"
echo ""

echo "--> Summoning and preparing source code..."
if [ ! -d ".git" ]; then
    git clone --branch "\$BRANCH_NAME" --single-branch "\$REPO_URL" .
else
    git fetch origin "\$BRANCH_NAME" && git reset --hard "origin/\$BRANCH_NAME"
fi

echo "--> Scribing a fresh PKGBUILD..."
cp PKGBUILD PKGBUILD.orig

echo "--> Running 'make localmodconfig' to streamline for your hardware..."
echo "    This will create a .config file based on your currently loaded modules."
cp config .config
make localmodconfig

echo "--> Attuning PKGBUILD with LTO and PGO instrumentation flags..."
sed -i 's/^pkgrel=.*/pkgrel=0/' PKGBUILD
sed -i "/^build() {/a \\
    export CFLAGS+=' -march=native -O3 ${LTO_FLAGS} ${PGO_FLAGS_GENERATE}'\\
    export CXXFLAGS+=' -march=native -O3 ${LTO_FLAGS} ${PGO_FLAGS_GENERATE}'\\
    export LDFLAGS+=' -Wl,-O1,--sort-common,--as-needed,-z,relro,-z,now'
" PKGBUILD
sed -i "/^prepare() {/a \\    sed -i -e '/CONFIG_HZ_250=y/d' -e '/# CONFIG_HZ_1000 is not set/d' .config\\n    echo 'CONFIG_HZ_1000=y' >> .config" PKGBUILD
sed -i "s/pkgname=.*/pkgname=kaelic-kernel-sovereign-${source}-pgo-instrumented/" PKGBUILD
echo "✅ Blueprint is ready. Proceed to 'The Tempering'."
`;
    }

    if (step === 'tempering') {
        return `${commonSetup}
echo "--- The Sovereign Blade Forge - Step 2: The Tempering ---"
echo "This will compile and install the INSTRUMENTED kernel."
echo ""
echo "--> Forging the instrumented artifact..."
makepkg -sfi --noconfirm
echo "--> Setting the next boot to be the instrumented kernel..."
# Find the new menu entry
INSTRUMENTED_ENTRY=\$(grep "menuentry 'Arch Linux, with Linux kaelic-kernel-sovereign-${source}-pgo-instrumented'" /boot/grub/grub.cfg | head -1 | cut -d"'" -f2)
if [ -n "\$INSTRUMENTED_ENTRY" ]; then
    grub-reboot "\$INSTRUMENTED_ENTRY"
    echo "✅ Instrumented kernel forged, installed, and set as the next boot option."
    echo "--> NEXT: REBOOT your system NOW."
    echo "--> AFTER REBOOT: Open a terminal and run 'sudo khs --temper-${blade}'"
else
    echo "⚠️  Could not find the instrumented kernel in GRUB. Please select it manually on reboot."
fi
`;
    }

    if (step === 'honing') {
        // Using replace to inject the multi-line script content into the main script
        return `${commonSetup}
echo "--- The Sovereign Blade Forge - Step 3: The Honing ---"
echo "This will forge the FINAL, optimized kernel using your performance data."
echo ""
echo "--> Rebooting back to your original kernel..."
grub-reboot 0 # Set default entry (usually your main kernel) for the next boot
echo "    System will now reboot to a stable kernel to perform the final compilation."
echo "    After reboot, please re-run this same command to continue."
# A simple mechanism to check if we've already rebooted
if [ ! -f .honing_rebooted ]; then
    touch .honing_rebooted
    reboot
    exit 0
fi
rm .honing_rebooted

echo "--> Merging performance data..."
if ! llvm-profdata merge -o "/tmp/kael-pgo/${source}/${blade}.data" /tmp/kael-pgo/${source}/*.profraw; then
    echo "❌ ERROR: No performance data found. Did you run 'sudo khs --temper-${blade}' on the instrumented kernel?"
    exit 1
fi

echo "--> Re-attuning PKGBUILD for optimization and warding..."
cp PKGBUILD.orig PKGBUILD
# Guardian's Ward: Add provides/conflicts/replaces to prevent pacman from overwriting it.
sed -i 's/^pkgrel=.*/pkgrel=1/' PKGBUILD
sed -i "s/^depends=(/depends=(libnotify /" PKGBUILD
sed -i "s/^pkgname=.*/pkgname=kaelic-kernel-sovereign-${source}\\nprovides=('${source}')\\nconflicts=('${source}')\\nreplaces=('${source}')/" PKGBUILD

# Inject compiler flags
sed -i "/^build() {/a \\
    export CFLAGS+=' -march=native -O3 ${LTO_FLAGS} ${PGO_FLAGS_USE}'\\
    export CXXFLAGS+=' -march=native -O3 ${LTO_FLAGS} ${PGO_FLAGS_USE}'\\
    export LDFLAGS+=' -Wl,-O1,--sort-common,--as-needed,-z,relro,-z,now'
" PKGBUILD
sed -i "/^prepare() {/a \\    sed -i -e '/CONFIG_HZ_250=y/d' -e '/# CONFIG_HZ_1000 is not set/d' .config\\n    echo 'CONFIG_HZ_1000=y' >> .config" PKGBUILD

# Scribe the Chronicler's Bell (Reminder scripts)
echo "--> Scribing the Chronicler's Bell (Monthly Re-forge Reminder)..."
sudo mkdir -p /usr/local/bin
sudo tee /usr/local/bin/kael-reforge-reminder-${blade}.sh > /dev/null <<'EOF_REMINDER'
${REMINDER_SCRIPT_CONTENT}
EOF_REMINDER
sudo chmod +x /usr/local/bin/kael-reforge-reminder-${blade}.sh

sudo tee /etc/systemd/user/kael-reforge-reminder-${blade}.service > /dev/null <<'EOF_SERVICE'
${REMINDER_SERVICE_CONTENT}
EOF_SERVICE
sudo tee /etc/systemd/user/kael-reforge-reminder-${blade}.timer > /dev/null <<'EOF_TIMER'
${REMINDER_TIMER_CONTENT}
EOF_TIMER

# Add install script to enable the timer
cat > kael-sovereign.install << 'EOF_INSTALL'
post_install() {
    echo "--> Arming the Chronicler's Bell (Monthly Re-forge Reminder)..."
    systemctl --user enable --now kael-reforge-reminder-${blade}.timer || echo "Could not enable user timer. You may need to do it manually."
}
post_upgrade() {
    post_install
}
post_remove() {
    systemctl --user disable --now kael-reforge-reminder-${blade}.timer || true
}
EOF_INSTALL
sed -i '/^package() {/i install=kael-sovereign.install' PKGBUILD
sed -i '/^source=(/a \\    "kael-sovereign.install"' PKGBUILD
sed -i '/^sha256sums=(/a \\    "SKIP"' PKGBUILD
updpkgsums

echo "--> Forging the final, honed artifact..."
makepkg -sf --noconfirm

echo "--> Publishing to local Athenaeum..."
# Use Grand Concordance to publish AND INSTALL the final kernel
grand-concordance --install

echo "--> Invoking the Bladesmith's Familiar..."
khs --scry-drivers
khs --attune-bootloader

echo "✅ Honed kernel forged, published, installed, and attuned!"
`.replace(/\${REMINDER_SCRIPT_CONTENT}/g, REMINDER_SCRIPT_CONTENT)
 .replace(/\${REMINDER_SERVICE_CONTENT}/g, REMINDER_SERVICE_CONTENT)
 .replace(/\${REMINDER_TIMER_CONTENT}/g, REMINDER_TIMER_CONTENT)
    }
    return "# Invalid Step";
};

export const PersonalizedKernelForgeModal: React.FC<PersonalizedKernelForgeModalProps> = ({ onClose }) => {
    const [activeBlade, setActiveBlade] = useState<KernelBlade>('work');

    const steps: { id: ForgeStep, title: string, description: string }[] = [
        { 
            id: 'blueprint', 
            title: "Step 1: The Blueprint", 
            description: "Prepare the source, streamline drivers with 'localmodconfig', and apply PGO instrumentation flags." 
        },
        { 
            id: 'tempering', 
            title: "Step 2: The Tempering", 
            description: `Compile and install the instrumented kernel. This will automatically set it as the next boot option. You must then REBOOT, then run 'sudo khs --temper-${activeBlade}' to automatically gather performance data.`
        },
        { 
            id: 'honing', 
            title: "Step 3: The Honing", 
            description: "After gathering data, run this script. It will auto-reboot back to your stable kernel, then re-compile using the data, install the final artifact (replacing the old one), and invoke the 'khs' familiar to build drivers and attune the bootloader." 
        }
    ];

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in-fast" onClick={onClose}>
            <div className="bg-forge-panel border-2 border-forge-border rounded-lg shadow-2xl w-full max-w-4xl p-6 m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center mb-4 flex-shrink-0">
                     <h2 className="text-xl font-bold text-forge-text-primary flex items-center gap-2 font-display tracking-wider">
                        <CpuChipIcon className="w-5 h-5 text-dragon-fire" />
                        <span>The Sovereign Blade Forge</span>
                    </h2>
                    <button onClick={onClose} className="text-forge-text-secondary hover:text-forge-text-primary">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </header>
                
                <div className="flex gap-2 border-b-2 border-forge-border mb-4 flex-wrap">
                    {(['work', 'gaming', 'lts'] as KernelBlade[]).map(blade => (
                        <button 
                            key={blade}
                            onClick={() => setActiveBlade(blade)}
                            className={`px-4 py-2 text-sm font-semibold transition-colors border-b-4 capitalize ${activeBlade === blade ? 'border-dragon-fire text-dragon-fire' : 'border-transparent text-forge-text-secondary hover:text-forge-text-primary'}`}
                        >
                            {blade} Blade
                        </button>
                    ))}
                </div>

                <div className="overflow-y-auto pr-2 text-forge-text-secondary leading-relaxed space-y-6">
                    {steps.map(step => {
                        const script = generateScript(activeBlade, step.id);
                        const finalCommand = `bash <<'EOF'\n${script.trim()}\nEOF`;
                        return (
                            <div key={step.id} className="bg-forge-bg/50 p-4 rounded-lg border border-forge-border/50">
                                <h3 className="font-semibold text-lg text-orc-steel mb-2">{step.title}</h3>
                                <p className="text-sm mb-3">{step.description}</p>
                                {activeBlade === 'gaming' && step.id === 'tempering' &&
                                    <div className="text-xs p-2 mb-3 bg-dragon-fire/10 border-l-4 border-dragon-fire rounded">
                                        The <code className="font-mono text-dragon-fire">--temper-gaming</code> command will automatically install and run the <code className="font-mono">glmark2</code> benchmark to create a representative gaming profile.
                                    </div>
                                }
                                {activeBlade === 'work' && step.id === 'tempering' &&
                                    <div className="text-xs p-2 mb-3 bg-dragon-fire/10 border-l-4 border-dragon-fire rounded">
                                    Note: The <code className="font-mono text-dragon-fire">--temper-work</code> command now uses <code className="font-mono text-dragon-fire">stress-ng</code> to generate a more versatile, general-purpose profile suitable for mixed workloads.
                                    </div>
                                }
                                <CodeBlock lang="bash">{finalCommand}</CodeBlock>
                            </div>
                        );
                    })}
                     <div className="text-xs p-3 bg-red-900/20 border-l-4 border-red-500/70 rounded mt-4">
                        <strong className="text-red-400">Important:</strong> This is an expert ritual. Each step must be completed in order. This process involves rebooting your machine multiple times.
                    </div>
                </div>
            </div>
        </div>
    );
};
