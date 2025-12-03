import React from 'react';
import { CloseIcon, ShieldCheckIcon } from '../core/Icons';
import { CodeBlock } from '../core/CodeBlock';

interface GpgPersistenceModalProps {
  onClose: () => void;
}

const PACT_SCRIPT_RAW = `#!/bin/bash
set -euo pipefail

echo "--- The GPG Persistence Pact (v1.0) ---"
echo "This one-time ritual binds the GPG agent to your systemd user session, ensuring it is always ready."
echo ""

# --- [1/4] Banish Old Ghosts ---
echo "--> [1/4] Terminating any lingering gpg-agent processes..."
pkill gpg-agent || true
# Ensure the user socket is also stopped before we reconfigure it
systemctl --user stop gpg-agent.socket &>/dev/null || true
echo "✅ Old agents banished."
echo ""

# --- [2/4] Scribe the Pact ---
echo "--> [2/4] Scribing gpg-agent.conf for persistence..."
GPG_CONF_DIR="$HOME/.gnupg"
GPG_AGENT_CONF="$GPG_CONF_DIR/gpg-agent.conf"
mkdir -p "$GPG_CONF_DIR"
cat > "$GPG_AGENT_CONF" << 'EOF'
# Use the terminal-based pinentry
pinentry-program /usr/bin/pinentry-curses
# Cache passphrase for a very long time (1 year)
default-cache-ttl 31536000
max-cache-ttl 31536000
EOF
echo "✅ Pact scribed. Passphrase will be cached for one year."
echo ""

# --- [3/4] Bind the Warden ---
echo "--> [3/4] Binding the agent to the systemd user session..."
systemctl --user enable --now gpg-agent.socket
systemctl --user enable --now gpg-agent-browser.socket
systemctl --user enable --now gpg-agent-ssh.socket
systemctl --user enable --now gpg-agent-extra.socket
echo "✅ GPG agent is now managed by systemd and will start on login."
echo ""

# --- [4/4] Awaken the Animus ---
echo "--> [4/4] Attuning shell environment..."
BASH_PROFILE="$HOME/.bash_profile"
if ! grep -q "GPG_TTY" "$BASH_PROFILE"; then
    echo "    -> Adding GPG_TTY to $BASH_PROFILE..."
    echo '' >> "$BASH_PROFILE"
    echo '# Set GPG TTY for pinentry' >> "$BASH_PROFILE"
    echo 'export GPG_TTY=$(tty)' >> "$BASH_PROFILE"
else
    echo "    -> GPG_TTY is already configured in $BASH_PROFILE."
fi
echo "✅ Shell is attuned."
echo ""

echo "✨ Ritual Complete! The GPG Persistence Pact is sealed."
echo "   IMPORTANT: Please run 'source ~/.bash_profile' or log out and back in to apply changes."
`;


export const GpgPersistenceModal: React.FC<GpgPersistenceModalProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in-fast" onClick={onClose}>
            <div className="bg-forge-panel border-2 border-forge-border rounded-lg shadow-2xl w-full max-w-3xl p-6 m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                     <h2 className="text-xl font-bold text-forge-text-primary flex items-center gap-2 font-display tracking-wider">
                        <ShieldCheckIcon className="w-5 h-5 text-dragon-fire" />
                        <span>Setup GPG Persistence</span>
                    </h2>
                    <button onClick={onClose} className="text-forge-text-secondary hover:text-forge-text-primary">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="overflow-y-auto pr-2 text-forge-text-secondary leading-relaxed space-y-4">
                    <p>
                        Architect, this is the definitive fix for the "sleeping GPG agent." This one-time ritual binds the agent to your user session using <code className="font-mono text-xs">systemd</code>, ensuring it starts on login and remains awake.
                    </p>
                    <div className="text-sm p-3 bg-orc-steel/10 border-l-4 border-orc-steel rounded space-y-2">
                        <strong className="text-orc-steel">Effects of this Ritual:</strong>
                        <ul className="list-disc list-inside">
                            <li>Configures the agent to use a terminal-based password prompt (<code className="font-mono text-xs">pinentry-curses</code>).</li>
                            <li>Sets the passphrase cache to <strong className="text-forge-text-primary">one year</strong>.</li>
                            <li>Enables the <code className="font-mono text-xs">gpg-agent.socket</code> so it starts automatically.</li>
                            <li>Updates your shell profile to ensure the agent can always find your terminal.</li>
                        </ul>
                    </div>

                    <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">The Persistence Incantation</h3>
                    <p>
                        Run this inside your VM. After it completes, run <code className="font-mono text-xs">source ~/.bash_profile</code> or log out and back in to finalize the pact. This will permanently solve your GPG signing issues.
                    </p>
                    <CodeBlock lang="bash">{PACT_SCRIPT_RAW}</CodeBlock>
                </div>
            </div>
        </div>
    );
};