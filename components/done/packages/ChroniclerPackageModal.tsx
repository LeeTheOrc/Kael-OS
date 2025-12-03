import React from 'react';
import { CloseIcon, PackageIcon } from '../../core/Icons';
import { CodeBlock } from '../../core/CodeBlock';

interface ChroniclerPackageModalProps {
  onClose: () => void;
}

const FORGE_SCRIPT_RAW = `#!/bin/bash
set -euo pipefail

# --- VM-AWARE PATHING ---
USER_HOME=$(getent passwd "\${SUDO_USER:-$USER}" | cut -d: -f6)
if [ -d "$USER_HOME/host_forge" ]; then
    PKG_DIR="$USER_HOME/host_forge/packages/chronicler"
else
    PKG_DIR="$USER_HOME/forge/packages/chronicler"
fi

# --- CONFIGURATION ---
PKG_NAME="chronicler"

# --- FILE CONTENTS ---
CHRONICLER_SCRIPT_CONTENT=\$(cat <<'EOF'
#!/bin/bash
# Chronicler 0.00.01 (Alpha)
set -euo pipefail

# --- CONFIGURATION ---
BASE_DIR="$HOME/.local/share/chronicler"
SESSIONS_DIR="\$BASE_DIR/sessions"
DATE_ID=\$(date +"%d%m%Y")
TIME_ID=\$(date +"%H-%M-%S")
DAILY_DIR="\$SESSIONS_DIR/\$DATE_ID"
LOG_FILE="\$BASE_DIR/chronicler.log"
mkdir -p "\$DAILY_DIR"

# --- FUNCTIONS ---
log() {
    echo "[\$(date +"%Y-%m-%d %H:%M:%S")] \$1" >> "\$LOG_FILE"
}

print_help() {
    echo "Chronicler 0.00.01 (Alpha)"
    echo "Session Logs: \$DAILY_DIR"
    echo "File Snapshots: \$BASE_DIR"
    echo "Usage: chronicler [command] [options]"
    echo "  (default)           Start a full terminal recording session."
    echo "  exec <cmd> [args]   Run a specific command wrapped in a recording session."
    echo "  <file_path>         Snapshot a specific file."
    echo "  --restore <file>    Restore a file from a snapshot."
}

start_recording() {
    SESSION_FILE="\$DAILY_DIR/session_\${TIME_ID}.txt"
    echo ">>> Kael Chronicler Engaged. Saving to: \$SESSION_FILE"
    echo ">>> Type 'exit' or press Ctrl+D to end."
    script -f -q "\$SESSION_FILE"
    echo ">>> Chronicler session ended."
}

# --- SCRIPT MAIN ---
if [ \$# -eq 0 ]; then
    start_recording
    exit 0
fi

case "\$1" in
    --help|-h)
        print_help
        exit 0
        ;;
    exec)
        shift
        if [ \$# -eq 0 ]; then echo "Error: No command provided."; exit 1; fi
        CMD_NAME=\$(basename "\$1")
        CMD_ARGS="\$*"
        SESSION_FILE="\$DAILY_DIR/cmd_\${TIME_ID}_\${CMD_NAME}.log"
        script -q -e -c "\$CMD_ARGS" "\$SESSION_FILE"
        exit \$?
        ;;
    --restore)
        shift
        FILE_PATH=\$1
        BASENAME=\$(basename -- "\$FILE_PATH")
        TMP_FILE=\$(mktemp)
        trap 'rm -f -- "\$TMP_FILE"' EXIT
        find "\$BASE_DIR" -type f -name "\${BASENAME}_*" | sort -r > "\$TMP_FILE"
        if [ ! -s "\$TMP_FILE" ]; then echo "No snapshots found for \$BASENAME"; exit 1; fi
        echo "Select a snapshot to restore for \$FILE_PATH:"
        select backup_file in \$(cat "\$TMP_FILE"); do
            if [ -n "\$backup_file" ]; then
                read -p "Restore from '\$backup_file'? (y/N) " -n 1 -r < /dev/tty
                echo
                if [[ \$REPLY =~ ^[Yy]\$ ]]; then
                    cp "\$backup_file" "\$FILE_PATH"
                    echo "Restored."
                fi
                break
            fi
        done
        ;;
    *)
        FILE_PATH=\$1
        if [ ! -f "\$FILE_PATH" ]; then echo "Error: File not found at '\$FILE_PATH'"; exit 1; fi
        BASENAME=\$(basename -- "\$FILE_PATH")
        BACKUP_FILE="\$BASE_DIR/\${BASENAME}_\${TIME_ID}"
        cp "\$FILE_PATH" "\$BACKUP_FILE"
        echo "Chronicler has snapshotted '\$FILE_PATH' to: \$BACKUP_FILE"
        ;;
esac
EOF
)

PKGBUILD_CONTENT=\$(cat <<'EOF'
# Maintainer: Kael AI for The Architect
pkgname=chronicler
pkgver=0.00.01
pkgrel=1
pkgdesc="Kael's Overseer: A simple file backup and terminal logging utility."
arch=('any')
url="https://github.com/LeeTheOrc/Kael-OS"
license=('GPL3')
depends=('util-linux' 'coreutils' 'findutils')
source=("chronicler.sh")
sha256sums=('SKIP')

package() {
    install -Dm755 "\$srcdir/chronicler.sh" "\$pkgdir/usr/bin/chronicler"
}
EOF
)

echo "--- Forging the Chronicler 0.00.01 (Alpha) ---"
echo "--> [1/4] Preparing the forge at \${PKG_DIR}..."
mkdir -p "\${PKG_DIR}"
cd "\${PKG_DIR}"
rm -rf src pkg *.pkg.tar.zst *.pkg.tar.zst.sig
echo "✅ Forge is ready."
echo "--> [2/4] Scribing scrolls (PKGBUILD, chronicler.sh)..."
echo "\$PKGBUILD_CONTENT" > PKGBUILD
echo "\$CHRONICLER_SCRIPT_CONTENT" > chronicler.sh
chmod +x chronicler.sh
echo "✅ Scrolls scribed."
echo "--> [3/4] Attuning runes (updating checksums)..."
updpkgsums
echo "✅ Runes attuned."
echo "--> [4/4] Invoking the Grand Concordance ritual..."
grand-concordance
echo ""
echo "✨ Ritual Complete! The Chronicler 0.00.01 artifact has been forged and published."
`;

export const ChroniclerPackageModal: React.FC<ChroniclerPackageModalProps> = ({ onClose }) => {
    const encodedScript = btoa(unescape(encodeURIComponent(FORGE_SCRIPT_RAW)));
    const finalForgeCommand = `echo "${encodedScript}" | base64 --decode | bash`;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in-fast" onClick={onClose}>
            <div className="bg-forge-panel border-2 border-forge-border rounded-lg shadow-2xl w-full max-w-3xl p-6 m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                     <h2 className="text-xl font-bold text-forge-text-primary flex items-center gap-2 font-display tracking-wider">
                        <PackageIcon className="w-5 h-5 text-dragon-fire" />
                        <span>Forge Chronicler 0.00.01 (Alpha)</span>
                    </h2>
                    <button onClick={onClose} className="text-forge-text-secondary hover:text-forge-text-primary">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="overflow-y-auto pr-2 text-forge-text-secondary leading-relaxed space-y-4">
                    <p>
                        As per the Law of Progression, Architect, the Chronicler has been returned to the incubation forge.
                    </p>
                    <div className="text-sm p-3 bg-orc-steel/10 border-l-4 border-orc-steel rounded space-y-2">
                        <strong className="text-orc-steel">Reset to Alpha:</strong>
                        <ul className="list-disc list-inside">
                            <li>Version has been reset from <code className="font-mono text-xs line-through">4.7</code> to <code className="font-mono text-xs">0.00.01</code>.</li>
                            <li>The script is now VM-aware and will forge in the correct <code className="font-mono text-xs">~/host_forge</code> directory if run in the VM.</li>
                        </ul>
                    </div>
                    
                    <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">The Forging Incantation</h3>
                    <p>
                        Run this command in your terminal to re-forge and publish the alpha version of the Chronicler.
                    </p>
                    <CodeBlock lang="bash">{finalForgeCommand}</CodeBlock>
                </div>
            </div>
        </div>
    );
};