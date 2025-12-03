
import React from 'react';
import { CloseIcon, DocumentDuplicateIcon } from '../core/Icons';
import { CodeBlock } from '../core/CodeBlock';

interface LogSplitterModalProps {
  onClose: () => void;
}

const SPLIT_SCRIPT_RAW = `#!/bin/bash
set -euo pipefail

echo "--- The Cleaving Ritual (Log Splitter) ---"
echo "This ritual breaks a massive text file into smaller shards for safe upload."
echo ""

# --- [1/3] INPUT ---
FILE_PATH=""

while true; do
    # Force read from TTY to bypass pipe issues (fixing the "File not found" error)
    # When running 'echo script | bash', stdin is the script, so we must read from /dev/tty.
    if [ -c /dev/tty ]; then
        read -e -p "Enter the path to the massive log file: " FILE_PATH < /dev/tty
    else
        read -e -p "Enter the path to the massive log file: " FILE_PATH
    fi

    # Trim whitespace
    FILE_PATH="\$(echo "\${FILE_PATH}" | xargs)"

    # Expand tilde at the start of the path
    # Bash substitution: if starts with ~, replace with $HOME
    FILE_PATH="\${FILE_PATH/#\\~/\$HOME}"
    
    if [ -z "\$FILE_PATH" ]; then
        echo "❌ Path cannot be empty."
        continue
    fi

    if [ -f "\$FILE_PATH" ]; then
        break
    else
        echo "❌ Error: File not found at '\$FILE_PATH'"
        echo "   Please check the path and try again."
        echo ""
    fi
done

# --- [2/3] PREPARATION ---
BASENAME=\$(basename "\$FILE_PATH")
DIRNAME=\$(dirname "\$FILE_PATH")
# Create a specific folder for the shards to keep things tidy
OUTPUT_DIR="\$DIRNAME/\${BASENAME}_shards"

echo ""
echo "--> Creating shard container at: \$OUTPUT_DIR"
mkdir -p "\$OUTPUT_DIR"

# --- [3/3] THE CLEAVING ---
# -b 500k: Split into 500KB chunks (safe for most AI inputs)
# -d: Use numeric suffixes (00, 01, 02...)
# --additional-suffix: Add .txt so editors recognize them
echo "--> Cleaving the artifact into 500KB shards..."

split -b 500k -d --additional-suffix=.txt "\$FILE_PATH" "\$OUTPUT_DIR/shard_"

# Count the shards
COUNT=\$(ls "\$OUTPUT_DIR" | wc -l)

echo ""
echo "✨ Ritual Complete!"
echo "✅ The log has been split into \$COUNT shards."
echo "📂 Location: \$OUTPUT_DIR"
echo ""
echo "--> Instructions:"
echo "    Upload 'shard_00.txt' first, then 'shard_01.txt', etc."
`;

export const LogSplitterModal: React.FC<LogSplitterModalProps> = ({ onClose }) => {

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in-fast" onClick={onClose}>
            <div className="bg-forge-panel border-2 border-forge-border rounded-lg shadow-2xl w-full max-w-3xl p-6 m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                     <h2 className="text-xl font-bold text-forge-text-primary flex items-center gap-2 font-display tracking-wider">
                        <DocumentDuplicateIcon className="w-5 h-5 text-dragon-fire" />
                        <span>The Cleaving Ritual (Log Splitter)</span>
                    </h2>
                    <button onClick={onClose} className="text-forge-text-secondary hover:text-forge-text-primary">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="overflow-y-auto pr-2 text-forge-text-secondary leading-relaxed space-y-4">
                    <p>
                        Architect, massive scrolls (like your 2MB log) are too heavy for the browser to handle in one piece. This ritual allows you to <strong className="text-dragon-fire">cleave</strong> the file into smaller, safe-to-upload shards.
                    </p>
                    <p className="text-sm p-3 bg-orc-steel/10 border-l-4 border-orc-steel rounded">
                        This script will take your target file and split it into <strong className="text-orc-steel">500KB chunks</strong> inside a new folder. You can then copy/paste or upload these shards one by one without crashing the interface.
                    </p>
                    
                    <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">The Cleaving Incantation</h3>
                    <p>
                        Copy and run this entire script. It is interactive and will ask for the file path.
                    </p>
                    <CodeBlock lang="bash">{SPLIT_SCRIPT_RAW}</CodeBlock>
                </div>
            </div>
        </div>
    );
};
