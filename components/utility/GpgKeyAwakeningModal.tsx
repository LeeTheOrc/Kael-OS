
import React from 'react';
import { CloseIcon, KeyIcon } from '../core/Icons';
import { CodeBlock } from '../core/CodeBlock';

interface GpgKeyAwakeningModalProps {
  onClose: () => void;
}

const AWAKENING_SCRIPT_RAW = `#!/bin/bash
set -euo pipefail

echo "--- GPG Key Awakening Ritual (v1.2 - Loopback) ---"
echo "This ritual uses a direct method to unlock your GPG key, bypassing pinentry issues."

# --- [1/1] Securely Unlock Key ---
echo "--> Please enter your GPG passphrase to awaken the agent:"
# Use /dev/tty to ensure prompt appears even when the script is piped
read -sp "Passphrase: " PASSPHRASE < /dev/tty
echo "" # Newline after password entry

if [ -z "$PASSPHRASE" ]; then
    echo "❌ ERROR: Passphrase cannot be empty. Aborting." >&2
    exit 1
fi

# Use a test signature with --pinentry-mode loopback.
# This forces GPG to read the passphrase from stdin (--passphrase-fd 0).
# This single action will unlock the key and the agent will cache it for the session.
if echo "test" | gpg --clearsign --pinentry-mode loopback --passphrase-fd 0 <<< "$PASSPHRASE" >/dev/null 2>&1; then
    echo ""
    echo "✨ Ritual Complete! The GPG agent is awake and your key is unlocked."
    echo "   You can now run signing commands without a password prompt for this session."
else
    echo "❌ ERROR: The agent did not accept the passphrase. Please check your passphrase and try again." >&2
    exit 1
fi
`;

export const GpgKeyAwakeningModal: React.FC<GpgKeyAwakeningModalProps> = ({ onClose }) => {
    const encodedScript = btoa(unescape(encodeURIComponent(AWAKENING_SCRIPT_RAW)));
    const finalCommand = `echo "${encodedScript}" | base64 --decode | bash`;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in-fast" onClick={onClose}>
            <div className="bg-forge-panel border-2 border-forge-border rounded-lg shadow-2xl w-full max-w-3xl p-6 m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                     <h2 className="text-xl font-bold text-forge-text-primary flex items-center gap-2 font-display tracking-wider">
                        <KeyIcon className="w-5 h-5 text-dragon-fire" />
                        <span>Awaken GPG Agent (v1.2)</span>
                    </h2>
                    <button onClick={onClose} className="text-forge-text-secondary hover:text-forge-text-primary">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="overflow-y-auto pr-2 text-forge-text-secondary leading-relaxed space-y-4">
                    <p>
                        Architect, this is the definitive fix. This ritual bypasses all the complex `pinentry` issues by providing your passphrase directly to the GPG agent in a secure way.
                    </p>
                    <div className="text-sm p-3 bg-orc-steel/10 border-l-4 border-orc-steel rounded">
                        Run this at the start of a forging session. It will securely ask for your passphrase and unlock your key, allowing all subsequent signing commands to succeed.
                    </div>

                    <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">The Awakening Incantation (v1.2)</h3>
                    <CodeBlock lang="bash">{finalCommand}</CodeBlock>
                </div>
            </div>
        </div>
    );
};
