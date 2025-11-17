import React from 'react';
import { CloseIcon, MagnifyingGlassIcon } from '../core/Icons';
import { CodeBlock } from '../core/CodeBlock';

interface ScryPacmanConfModalProps {
  onClose: () => void;
}

const SCRY_SCRIPT_RAW = `#!/bin/bash
set -euxo pipefail
set -x

# Correctly determine the user's home directory, even under sudo
THE_USER=\\\${SUDO_USER:-\\\$USER}
USER_HOME=\\$(getent passwd \\\$THE_USER | cut -d: -f6)

# Define the new organized path structure
BASE_DIR="\\\$USER_HOME/ChroniclesReports/pacman"
DAILY_DIR="\\\$BASE_DIR/\\$(date +%d%m%Y)"
TIMESTAMP=\\$(date +%H-%M-%S)
OUTPUT_FILE="\\\$DAILY_DIR/pacman-scry-\\\$TIMESTAMP.txt"

echo "--> Scrying the contents of /etc/pacman.conf..."
echo "    -> Destination: \\\$OUTPUT_FILE"

# Create the directory structure as the user to ensure correct ownership.
sudo -u "\\\$THE_USER" mkdir -p "\\\$DAILY_DIR"

# Use sudo to read the system file but redirect output to a file we can own.
sudo cat /etc/pacman.conf > "\\\$OUTPUT_FILE"

# Ensure the final file is owned by the user, not root.
sudo chown "\\\$THE_USER":"\\$(id -gn "\\\$THE_USER")" "\\\$OUTPUT_FILE"

echo "✅ Scrying complete. The configuration has been saved to: \\\$OUTPUT_FILE"
`;

export const ScryPacmanConfModal: React.FC<ScryPacmanConfModalProps> = ({ onClose }) => {
  const encodedScript = btoa(unescape(encodeURIComponent(SCRY_SCRIPT_RAW)));
  const finalCommand = `echo "${encodedScript}" | base64 --decode | bash`;
  
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in-fast" onClick={onClose}>
        <div className="bg-forge-panel border-2 border-forge-border rounded-lg shadow-2xl w-full max-w-2xl p-6 m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                 <h2 className="text-xl font-bold text-forge-text-primary flex items-center gap-2 font-display tracking-wider">
                    <MagnifyingGlassIcon className="w-5 h-5 text-dragon-fire" />
                    <span>Scry Pacman Configuration</span>
                </h2>
                <button onClick={onClose} className="text-forge-text-secondary hover:text-forge-text-primary">
                    <CloseIcon className="w-5 h-5" />
                </button>
            </div>
            <div className="overflow-y-auto pr-2 text-forge-text-secondary leading-relaxed space-y-4">
                <p>
                    This is a simple diagnostic ritual, Architect. It allows us to gaze upon the current state of your <code className="font-mono text-xs">/etc/pacman.conf</code> file.
                </p>
                <p className="text-sm p-3 bg-orc-steel/10 border-l-4 border-orc-steel rounded">
                    The incantation will copy the full contents of the configuration file to a timestamped file within <code className="font-mono text-xs">~/ChroniclesReports/pacman/&lt;DDMMYYYY&gt;/</code>, keeping our scrying results organized. You can then upload this file for my analysis.
                </p>
                
                <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">The Scrying Incantation</h3>
                <p>
                    Run this command to capture the configuration.
                </p>
                <CodeBlock lang="bash">{finalCommand}</CodeBlock>
            </div>
        </div>
    </div>
  );
};