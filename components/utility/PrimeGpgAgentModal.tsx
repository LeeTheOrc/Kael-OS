
import React from 'react';
import { CloseIcon, KeyIcon } from '../core/Icons';
import { CodeBlock } from '../core/CodeBlock';

interface PrimeGpgAgentModalProps {
  onClose: () => void;
}

const PRIME_SCRIPT_RAW = `#!/bin/bash
set -euo pipefail

echo "--- GPG Agent Priming Ritual ---"
echo "This ritual ensures the GPG agent is running and configured for this session."
echo ""

# --- [1/2] Ensure GPG Agent is Running ---
echo "--> [1/2] Checking and starting GPG agent..."
if ! gpg-agent-info &>/dev/null; then
    echo "    -> GPG agent not found. Starting it now..."
    # The eval is crucial to export the variables into the current shell
    eval \$(gpg-agent --daemon)
else
    echo "    -> GPG agent is already running."
fi
echo "✅ GPG agent is active."
echo ""

# --- [2/2] Test Signature ---
echo "--> [2/2] Performing a test signature to cache passphrase..."
# We sign a simple piece of data and send it to /dev/null
# This forces the agent to ask for the passphrase if it's not cached
if echo "test" | gpg --clearsign > /dev/null; then
    echo "✅ GPG key is unlocked and ready for signing."
    echo ""
    echo "✨ Ritual Complete! The GPG agent is primed."
else
    echo "❌ ERROR: Test signature failed." >&2
    echo "   Please check your GPG key configuration and passphrase." >&2
    exit 1
fi
`;

export const PrimeGpgAgentModal: React.FC<PrimeGpgAgentModalProps> = ({ onClose }) => {
    const encodedScript = btoa(unescape(encodeURIComponent(PRIME_SCRIPT_RAW)));
    const finalCommand = `echo "${encodedScript}" | base64 --decode | bash`;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in-fast" onClick={onClose}>
            <div className="bg-forge-panel border-2 border-forge-border rounded-lg shadow-2xl w-full max-w-3xl p-6 m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                     <h2 className="text-xl font-bold text-forge-text-primary flex items-center gap-2 font-display tracking-wider">
                        <KeyIcon className="w-5 h-5 text-dragon-fire" />
                        <span>Prime GPG Agent</span>
                    </h2>
                    <button onClick={onClose} className="text-forge-text-secondary hover:text-forge-text-primary">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="overflow-y-auto pr-2 text-forge-text-secondary leading-relaxed space-y-4">
                    <p>
                        Architect, sometimes the GPG agent—the familiar that holds your secret key's passphrase—falls asleep. This ritual awakens it and ensures it's ready for a signing session.
                    </p>
                    <p className="text-sm p-3 bg-orc-steel/10 border-l-4 border-orc-steel rounded">
                        This is useful if you are repeatedly being asked for your GPG passphrase when signing packages. This incantation will ensure the agent is running and perform a test signature, which will cache your passphrase for a while.
                    </p>
                    <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">The Priming Incantation</h3>
                    <p>
                        Run this command in the terminal session where you'll be signing packages.
                    </p>
                    <CodeBlock lang="bash">{finalCommand}</CodeBlock>
                </div>
            </div>
        </div>
    );
};
