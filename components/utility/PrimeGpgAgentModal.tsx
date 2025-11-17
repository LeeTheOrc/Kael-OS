import React from 'react';
import { CloseIcon, KeyIcon } from '../core/Icons';
import { CodeBlock } from '../core/CodeBlock';

interface PrimeGpgAgentModalProps {
  onClose: () => void;
}

const PRIME_AGENT_SCRIPT_RAW = `#!/bin/bash
set -euo pipefail

echo "--- GPG Agent Priming Ritual ---"
echo "This ritual awakens the GPG agent and caches your key's passphrase for this session."
echo ""

# --- [1/2] Detect GPG Key ---
echo "--> [1/2] Detecting default GPG signing key..."
GPG_KEY_ID=""

# Method 1: Check makepkg.conf (most specific)
if [ -f /etc/makepkg.conf ] && grep -q -E '^GPGKEY=' /etc/makepkg.conf; then
    GPG_KEY_ID=\$(grep -E '^GPGKEY=' /etc/makepkg.conf | head -1 | cut -d'=' -f2 | tr -d '[:space:]"')
    echo "    -> Found key in /etc/makepkg.conf: \$GPG_KEY_ID"
fi

# Method 2: Check git config (common for developers)
if [[ -z "\$GPG_KEY_ID" ]] && command -v git &>/dev/null && git config --global user.signingkey &>/dev/null; then
    GPG_KEY_ID=\$(git config --global user.signingkey)
    echo "    -> Found key in git config: \$GPG_KEY_ID"
fi

# Method 3: Fallback to the first available secret key
if [[ -z "\$GPG_KEY_ID" ]]; then
    GPG_KEY_ID=\$(gpg --list-secret-keys --with-colons | awk -F: '/^sec/{print \$5; exit}')
    if [[ -n "\$GPG_KEY_ID" ]]; then
      echo "    -> Found first available secret key: \$GPG_KEY_ID"
    fi
fi

if [[ -z "\$GPG_KEY_ID" ]]; then
    echo "❌ ERROR: Could not automatically detect a GPG signing key." >&2
    exit 1
fi
echo "✅ Key to be primed: \$GPG_KEY_ID"
echo ""

# --- [2/2] Prime the Agent ---
echo "--> [2/2] Awakening the agent..."
# This command ensures the agent is started and GPG_TTY is set for the current shell.
export GPG_TTY=\$(tty)
gpg-connect-agent /bye &>/dev/null || true
echo "    -> Agent is awake."

echo "--> Please enter your GPG passphrase if prompted."
echo "    This will cache it for future signing operations in this session."

# Create a dummy file to sign
TEMP_FILE=\$(mktemp)
trap 'rm -f -- "\$TEMP_FILE" "\$TEMP_FILE.sig"' EXIT

echo "Kael was here." > "\$TEMP_FILE"

# The signing operation. This is what triggers the pinentry prompt.
if ! gpg --default-key "\$GPG_KEY_ID" --detach-sign "\$TEMP_FILE"; then
    echo "❌ ERROR: GPG signing failed. The agent could not be primed." >&2
    echo "   Please check your GPG configuration and ensure a pinentry program is working." >&2
    exit 1
fi

echo ""
echo "✨ Ritual Complete! Your GPG key is now primed and ready for signing."
`;

export const PrimeGpgAgentModal: React.FC<PrimeGpgAgentModalProps> = ({ onClose }) => {
  const encodedScript = btoa(unescape(encodeURIComponent(PRIME_AGENT_SCRIPT_RAW)));
  const finalCommand = `echo "${encodedScript}" | base64 --decode | bash`;
  
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in-fast" onClick={onClose}>
        <div className="bg-forge-panel border-2 border-forge-border rounded-lg shadow-2xl w-full max-w-2xl p-6 m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
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
                    Architect, this ritual awakens and primes your GPG Agent. The agent is a magical familiar that remembers your secret key's passphrase, so you don't have to type it for every single signing action.
                </p>
                <p className="text-sm p-3 bg-orc-steel/10 border-l-4 border-orc-steel rounded">
                    This is especially useful after a reboot or when you first open a new terminal, as it ensures other rituals like <strong className="text-orc-steel">'Sanctify Athenaeum'</strong> can sign artifacts without interruption.
                </p>
                
                <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">The Priming Incantation</h3>
                <p>
                    Run this command to awaken the agent. You will be prompted for your GPG passphrase, which will then be cached for the rest of your terminal session.
                </p>
                <CodeBlock lang="bash">{finalCommand}</CodeBlock>
            </div>
        </div>
    </div>
  );
};