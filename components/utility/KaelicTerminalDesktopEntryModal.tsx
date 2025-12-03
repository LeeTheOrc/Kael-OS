import React from 'react';
import { CloseIcon, PencilIcon } from '../core/Icons';
import { CodeBlock } from '../core/CodeBlock';

interface KaelicTerminalDesktopEntryModalProps {
  onClose: () => void;
}

const DESKTOP_ENTRY_SCRIPT_RAW = `#!/bin/bash
set -euo pipefail

APP_DIR="$HOME/.local/share/applications"
DESKTOP_FILE="$APP_DIR/kaelic-terminal.desktop"

echo "--- The Sigil Scribing Ritual ---"
echo "This will create a start menu entry for the Kaelic Terminal."

mkdir -p "$APP_DIR"

echo "--> Scribing the sigil to $DESKTOP_FILE..."

cat > "$DESKTOP_FILE" << 'EOF'
[Desktop Entry]
Name=Kaelic Terminal
Comment=The sovereign AI terminal for Kael OS
Exec=kaelic-terminal
Icon=kaelic-terminal
Terminal=false
Type=Application
Categories=System;TerminalEmulator;
EOF

echo "--> Updating the application database..."
update-desktop-database "$APP_DIR"

echo ""
echo "✨ Ritual Complete! The Kaelic Terminal should now appear in your start menu."
`;


export const KaelicTerminalDesktopEntryModal: React.FC<KaelicTerminalDesktopEntryModalProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in-fast" onClick={onClose}>
            <div className="bg-forge-panel border-2 border-forge-border rounded-lg shadow-2xl w-full max-w-3xl p-6 m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center mb-4 flex-shrink-0">
                     <h2 className="text-xl font-bold text-forge-text-primary flex items-center gap-2 font-display tracking-wider">
                        <PencilIcon className="w-5 h-5 text-dragon-fire" />
                        <span>Create Kaelic Terminal Menu Entry</span>
                    </h2>
                    <button onClick={onClose} className="text-forge-text-secondary hover:text-forge-text-primary">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </header>
                <div className="overflow-y-auto pr-2 text-forge-text-secondary leading-relaxed space-y-4">
                     <p>
                        Architect, this ritual will scribe a sigil—a <code className="font-mono text-xs">.desktop</code> file—that allows the Kaelic Terminal to appear in your application launcher or start menu.
                    </p>
                    <div className="text-sm p-3 bg-orc-steel/10 border-l-4 border-orc-steel rounded space-y-2">
                        <p>
                           This incantation creates the entry in your local applications directory and explicitly sets the <code className="font-mono text-xs">Icon</code> to <code className="font-mono text-xs">kaelic-terminal</code>, which will use the sovereign icon we forged.
                        </p>
                    </div>
                    
                    <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">The Sigil Scribing Incantation</h3>
                    <p>
                       Run this script to create the menu entry.
                    </p>
                    <CodeBlock lang="bash">{DESKTOP_ENTRY_SCRIPT_RAW}</CodeBlock>
                </div>
            </div>
        </div>
    );
};
