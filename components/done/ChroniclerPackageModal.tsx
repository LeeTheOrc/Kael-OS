import React from 'react';
import { CloseIcon, PackageIcon } from '../core/Icons';
import { CodeBlock } from '../core/CodeBlock';

interface ChroniclerPackageModalProps {
  onClose: () => void;
}

const FORGE_SCRIPT_RAW = `#!/bin/bash
set -euo pipefail

# --- CONFIGURATION ---
PKG_DIR="\$HOME/forge/packages/chronicler"
PKG_NAME="chronicler"
INSTALL_PATH="/usr/local/bin"

# --- FILE CONTENTS ---
CHRONICLER_SCRIPT_CONTENT=\$(cat <<'EOF'
#!/bin/bash
# Chronicler v4.6 - Auto-Cleaver
set -euo pipefail

# --- CONFIGURATION ---
# Base path: ~/ChroniclesReports
BASE_DIR="\$HOME/ChroniclesReports"
# Date Subfolder Format: DDMMYYYY (e.g., 19112025)
DATE_ID=\$(date +"%d%m%Y")
# Time Tag for filenames: HH-MM-SS
TIME_ID=\$(date +"%H-%M-%S")
# Size threshold for cleaving prompt (in bytes). 500KB.
CLEAVE_THRESHOLD=512000

# The folder for today's chronicles
DAILY_DIR="\$BASE_DIR/\$DATE_ID"
# Global operation log
LOG_FILE="\$BASE_DIR/chronicler.log"

# Ensure the daily directory exists
mkdir -p "\$DAILY_DIR"

# --- FUNCTIONS ---
log() {
    echo "[\$(date +"%Y-%m-%d %H:%M:%S")] \$1" >> "\$LOG_FILE"
}

print_help() {
    echo "Chronicler v4.6: Auto-Cleaver"
    echo "Reports Location: \$DAILY_DIR"
    echo ""
    echo "Usage: chronicler [command] [options]"
    echo ""
    echo "Modes:"
    echo "  (default)           Start a full terminal recording session."
    echo "  exec <cmd> [args]   Run a specific command wrapped in a recording session."
    echo "  <file_path>         Snapshot a specific file to the daily folder."
    echo ""
    echo "Options:"
    echo "  --list <file>       List backups for a file (searches all dates)."
    echo "  --restore <file>    Restore a file."
    echo "  --help              Show this help."
}

dump_file_content() {
    local fpath="\$1"
    echo ""
    echo "================================================================"
    echo ">>> CHRONICLER CONTENT DUMP START: \$fpath"
    echo "================================================================"
    if [ -f "\$fpath" ]; then
        cat "\$fpath"
    else
        echo "[File does not exist]"
    fi
    echo ""
    echo "================================================================"
    echo ">>> CHRONICLER CONTENT DUMP END"
    echo "================================================================"
}

cleave_artifact() {
    local target_file="\$1"
    local folder_name="\$2"
    local DIRNAME=\$(dirname "\$target_file")
    local OUTPUT_DIR="\$DIRNAME/\$folder_name"
    
    echo "--> Creating shard container at: \$OUTPUT_DIR"
    mkdir -p "\$OUTPUT_DIR"
    
    echo "--> Cleaving the artifact into 500KB shards..."
    split -b 500k -d --additional-suffix=.txt "\$target_file" "\$OUTPUT_DIR/shard_"
    
    local COUNT=\$(ls "\$OUTPUT_DIR" | wc -l)
    echo "✅ The log has been split into \$COUNT shards."
}

# --- TEMPORAL SCRYING (Dynamic Change Detection) ---
scan_for_changes() {
    local session_log="\$1"
    local start_time="\$2"

    echo "" >> "\$session_log"
    echo "######################################################################" >> "\$session_log"
    echo "# CHRONICLER OVERSEER REPORT (Modified Artifacts)" >> "\$session_log"
    echo "######################################################################" >> "\$session_log"
    
    # Use find to locate files modified after the start timestamp.
    # We exclude common noise directories and our own report directory to keep the report clean.
    # FIX: Double-escaped backslashes for JS template literal compatibility.
    CHANGES_FOUND=\$(find /etc /usr/local/bin "\$HOME/.config" "\$HOME" \\
        -mount \\
        \\( \\
            -path "*/.git" -o \\
            -path "*/.cache" -o \\
            -path "*/.local/share" -o \\
            -path "*/node_modules" -o \\
            -path "*/build" -o \\
            -path "*/artifacts" -o \\
            -path "*/.mozilla" -o \\
            -path "*/.vscode" -o \\
            -path "\$BASE_DIR" \\
        \\) -prune \\
        -o -type f -newermt "@\$start_time" \\
        ! -name "mtab" \\
        ! -name "adjtime" \\
        ! -name "ld.so.cache" \\
        ! -name "*.log" \\
        ! -name ".zsh_history" \\
        ! -name ".bash_history" \\
        ! -name ".lesshst" \\
        ! -name ".viminfo" \\
        ! -name "*.swp" \\
        ! -name ".Xauthority" \\
        -print 2>/dev/null || true)

    if [ -z "\$CHANGES_FOUND" ]; then
        echo ">>> No significant configuration changes detected." >> "\$session_log"
        return
    fi

    IFS=\$'\n'
    for f in \$CHANGES_FOUND; do
        # Don't log the session file itself
        if [[ "\$f" == "\$session_log" ]]; then continue; fi
        
        # Check file size (skip if > 100KB)
        fsize=\$(stat -c%s "\$f" 2>/dev/null || echo 0)
        if [ "\$fsize" -gt 102400 ]; then
            echo ">>> DETECTED MODIFICATION: \$f (Skipped - Too Large: \${fsize} bytes)" >> "\$session_log"
            continue
        fi

        # Check if binary
        if grep -qI . "\$f" 2>/dev/null; then
             echo "" >> "\$session_log"
             echo ">>> DETECTED MODIFICATION: \$f" >> "\$session_log"
             echo "----------------------------------------------------------------------" >> "\$session_log"
             cat "\$f" >> "\$session_log" 2>/dev/null || echo "[Permission Denied - Content Protected]" >> "\$session_log"
             echo "" >> "\$session_log"
             echo "----------------------------------------------------------------------" >> "\$session_log"
        else
             echo ">>> DETECTED MODIFICATION: \$f (Skipped - Binary File)" >> "\$session_log"
        fi
    done
    unset IFS
}

start_recording() {
    # Filename has time in it
    SESSION_FILE="\$DAILY_DIR/session_\${TIME_ID}.txt"
    START_EPOCH=\$(date +%s)
    
    # Tabula Rasa: Clear screen for a fresh start
    clear
    echo "================================================================"
    echo "      KAEL CHRONICLER v4.6 (AUTO-CLEAVER)      "
    echo "================================================================"
    echo ">>> Flight Recorder Engaged."
    echo ">>> Saving to: \$SESSION_FILE"
    echo ">>> Temporal Scrying Active: I will watch for ANY file changes."
    echo ">>> Type 'exit' or press Ctrl+D to end session."
    echo "================================================================"
    
    # Start script.
    script -f -q "\$SESSION_FILE"
    
    echo ">>> The Overseer is scanning for artifacts modified during this session..."
    scan_for_changes "\$SESSION_FILE" "\$START_EPOCH"
    echo "================================================================"
    echo ">>> CHRONICLER FLIGHT RECORDER STOPPED"
    echo "================================================================"
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
        # Guardian Protocol: Run a single command wrapped in script
        shift
        if [ "\$1" == "--" ]; then shift; fi
        if [ \$# -eq 0 ]; then echo "Error: No command provided."; exit 1; fi
        
        CMD_NAME=\$(basename "\$1")
        CMD_ARGS="\$*"
        # Use time in filename for execution logs
        SESSION_FILE="\$DAILY_DIR/cmd_\${TIME_ID}_\${CMD_NAME}.log"
        
        script -q -e -c "\$CMD_ARGS" "\$SESSION_FILE"
        exit_code=\$?
        
        log "EXEC: '\$CMD_ARGS' -> \$SESSION_FILE (Exit: \$exit_code)"
        exit \$exit_code
        ;;

    --record|-r)
        start_recording
        ;;

    --list)
        shift
        FILE_PATH=\$1
        if [ ! -f "\$FILE_PATH" ]; then echo "Error: File '\$FILE_PATH' not found."; exit 1; fi
        BASENAME=\$(basename -- "\$FILE_PATH")
        
        echo "Searching Chronicles for backups of: \$BASENAME"
        # Search the entire BASE_DIR for files matching the basename
        find "\$BASE_DIR" -type f -name "\${BASENAME}_*" | sort
        ;;

    --cat)
        shift
        FILE_PATH=\$1
        dump_file_content "\$FILE_PATH"
        ;;

    --restore)
        shift
        FILE_PATH=\$1
        if [ ! -f "\$FILE_PATH" ]; then echo "Error: File '\$FILE_PATH' not found."; exit 1; fi
        BASENAME=\$(basename -- "\$FILE_PATH")
        
        echo "Searching Chronicles for backups..."
        TMP_FILE=\$(mktemp)
        trap 'rm -f -- "\$TMP_FILE"' EXIT
        
        # Find backups across all dates
        find "\$BASE_DIR" -type f -name "\${BASENAME}_*" | sort -r > "\$TMP_FILE"
        
        if [ ! -s "\$TMP_FILE" ]; then
             echo "No backups found for \$BASENAME"
             exit 1
        fi

        echo "Select a backup to restore for \$FILE_PATH:"
        select backup_file in \$(cat "\$TMP_FILE"); do
            if [ -n "\$backup_file" ]; then
                read -p "Restore from '\$backup_file'? (y/N) " -n 1 -r < /dev/tty
                echo
                if [[ \$REPLY =~ ^[Yy]\$ ]]; then
                    cp "\$backup_file" "\$FILE_PATH"
                    echo "Restored."
                    log "RESTORED: '\$FILE_PATH' from '\$backup_file'"
                    dump_file_content "\$FILE_PATH"
                else
                    echo "Restore aborted."
                fi
                break
            else
                echo "Invalid selection."
            fi
        done
        ;;

    --purge)
        echo "Purge is disabled in this version to protect historical records."
        echo "Please manually delete old folders in \$BASE_DIR if needed."
        ;;
    
    *)
        # Snapshot Logic (Backup a specific file)
        FILE_PATH=\$1
        
        if [ ! -f "\$FILE_PATH" ]; then
            echo "Error: File not found at '\$FILE_PATH'" >&2
            exit 1
        fi

        BASENAME=\$(basename -- "\$FILE_PATH")
        
        # Backup file uses time tag in filename
        BACKUP_FILE="\$DAILY_DIR/\${BASENAME}_\${TIME_ID}"
        
        cp "\$FILE_PATH" "\$BACKUP_FILE"
        
        echo "Chronicler has snapshot '\$FILE_PATH' to:"
        echo "\$BACKUP_FILE"
        log "BACKED UP: '\$FILE_PATH' to '\$BACKUP_FILE'"
        
        dump_file_content "\$FILE_PATH"

        # --- CLEAVER'S EDGE INTEGRATION (v4.6 - Automatic) ---
        FILE_SIZE=\$(stat -c%s "\$BACKUP_FILE")
        if [ "\$FILE_SIZE" -gt "\$CLEAVE_THRESHOLD" ]; then
            echo ""
            echo "⚠️  This artifact is large (\$((FILE_SIZE / 1024))KB) and has been automatically cleaved for analysis."
            
            # New folder name from TIME_ID (HH-MM-SS -> HHMMSS)
            CLEAVED_FOLDER_NAME=\$(echo "\$TIME_ID" | tr -d '-')
            
            cleave_artifact "\$BACKUP_FILE" "\$CLEAVED_FOLDER_NAME"
        fi
        ;;
esac
EOF
)

PKGBUILD_CONTENT=\$(cat <<'EOF'
# Maintainer: Kael AI for The Architect
pkgname=chronicler
pkgver=4.6
pkgrel=1
pkgdesc="Kael's Overseer: Automatically cleaves large snapshots into timestamped folders."
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

echo "--- Forging the Chronicler v4.6 Artifact ---"

# --- STEP 1: Prepare the Forge ---
echo "--> [1/4] Preparing the forge at \${PKG_DIR}..."
mkdir -p "\${PKG_DIR}"
cd "\${PKG_DIR}"

# --- STEP 1.5: CLEANUP GHOSTS ---
echo "--> [1.5/4] Cleansing forge of old artifacts..."
rm -rf src pkg *.pkg.tar.zst *.pkg.tar.zst.sig
echo "✅ Workspace purified."

echo "✅ Forge is ready."

# --- STEP 2: Scribe the Scrolls ---
echo "--> [2/4] Scribing the sacred scrolls (PKGBUILD, chronicler.sh)..."
echo "\$PKGBUILD_CONTENT" > PKGBUILD
echo "\$CHRONICLER_SCRIPT_CONTENT" > chronicler.sh
chmod +x chronicler.sh
echo "✅ Scrolls scribed."

# --- STEP 3: Attune the Runes ---
echo "--> [3/4] Attuning the runes (updating checksums)..."
updpkgsums
echo "✅ Runes attuned."

# --- STEP 3.5: Breaching Charge (Fix for Immutable Attribute) ---
echo "--> [3.5/4] Breaching immutable seals on legacy artifacts..."
if [ -f "/usr/local/bin/chronicler" ]; then
    echo "    -> Unlocking /usr/local/bin/chronicler..."
    sudo chattr -i "/usr/local/bin/chronicler" 2>/dev/null || true
fi
echo "✅ Artifacts unlocked."

# --- STEP 4: Forge and Publish ---
echo "--> [4/4] Invoking the Grand Concordance ritual..."
grand-concordance

echo ""
echo "✨ Ritual Complete! The Chronicler v4.6 artifact has been forged and published."
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
                        <span>Forge Chronicler v4.6 (Auto-Cleaver)</span>
                    </h2>
                    <button onClick={onClose} className="text-forge-text-secondary hover:text-forge-text-primary">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="overflow-y-auto pr-2 text-forge-text-secondary leading-relaxed space-y-4">
                    <p>
                        An excellent refinement, Architect. The Chronicler has been reforged to <strong className="text-dragon-fire">v4.6 (Auto-Cleaver)</strong> with your new specifications.
                    </p>
                    <div className="text-sm p-3 bg-orc-steel/10 border-l-4 border-orc-steel rounded space-y-2">
                        <strong className="text-orc-steel">New Automatic Cleaving Protocol:</strong>
                        <ul className="list-disc list-inside">
                            <li>The user prompt has been removed. Files over 500KB are now cleaved <strong className="text-forge-text-primary">automatically</strong>.</li>
                            <li>The tool now informs the user that the file was large and has been cleaved.</li>
                             <li>Shard folders are now named after the snapshot's timestamp for cleaner organization (e.g., a snapshot at 19:59:50 creates a folder named <code className="font-mono text-xs">195950</code>).</li>
                        </ul>
                    </div>
                    
                    <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">The Unified Incantation</h3>
                    <p>
                        Run this single command in your terminal to re-forge and publish the upgraded Chronicler.
                    </p>
                    <CodeBlock lang="bash">{finalForgeCommand}</CodeBlock>
                </div>
            </div>
        </div>
    );
};