import React from 'react';
import { CloseIcon, GlobeAltIcon } from '../core/Icons';
import { CodeBlock } from '../core/CodeBlock';

interface KaelCloudCorePackageModalProps {
  onClose: () => void;
}

const FORGE_SCRIPT_RAW = `#!/bin/bash
set -euo pipefail

# --- CONFIGURATION ---
PKG_DIR="\$HOME/forge/packages/kael-public-oracle"
SRC_DIR="\$PKG_DIR/src"

# --- FILE CONTENTS ---
ORACLE_SH_CONTENT=\$(cat <<'EOF'
#!/bin/bash
set -euo pipefail

# This script runs as the systemd --user service. \$HOME is correctly set.
WEB_ROOT="/usr/share/kael-public-oracle"
RUNTIME_DIR=\$(mktemp -d)
ENV_FILE="\$HOME/.config/kael/env"

cleanup() {
    [[ -n "\$RUNTIME_DIR" && -d "\$RUNTIME_DIR" ]] && rm -rf -- "\$RUNTIME_DIR"
}
trap cleanup EXIT SIGINT SIGTERM

echo "[Public Oracle] Preparing runtime environment..."
cp -r "\$WEB_ROOT/"* "\$RUNTIME_DIR/"

echo "[Public Oracle] Preparing configuration..."
API_KEY=""
if [ -f "\$ENV_FILE" ]; then
    source "\$ENV_FILE"
    API_KEY="\${GEMINI_API_KEY-}"
fi

if [ -n "\$API_KEY" ]; then
    echo "window.KAEL_CONFIG = { API_KEY: '\$API_KEY' };" > "\$RUNTIME_DIR/config.js"
    echo "[Public Oracle] Configuration complete. API Key is set."
else
    echo "window.KAEL_CONFIG = { API_KEY: null };" > "\$RUNTIME_DIR/config.js"
    echo "[Public Oracle] WARNING: API Key is NOT set."
    echo "[Public Oracle] Create \$ENV_FILE with 'export GEMINI_API_KEY=...' to enable."
fi

echo "[Public Oracle] Starting web server in \$RUNTIME_DIR..."
exec /usr/bin/python -m http.server --directory "\$RUNTIME_DIR" 8000
EOF
)

PKGBUILD_CONTENT=\$(cat <<'EOF'
# Maintainer: Kael AI for The Architect
pkgname=kael-public-oracle
pkgver=1.1
pkgrel=1
pkgdesc="A simple, Kael-branded chat interface to Kael's Cloud Animus (Gemini)."
arch=('any')
url="https://github.com/LeeTheOrc/Kael-OS"
license=('GPL3')
depends=('python')
source=("src/" "kael-public-oracle.desktop" "oracle.service" "oracle.sh")
sha256sums=('SKIP' 'SKIP' 'SKIP' 'SKIP')

package() {
    # Install the web app assets
    install -d "\$pkgdir/usr/share/kael-public-oracle"
    cp -r "\$srcdir/src/"* "\$pkgdir/usr/share/kael-public-oracle/"

    # Install the server wrapper script
    install -Dm755 "\$srcdir/oracle.sh" "\$pkgdir/usr/bin/kael-public-oracle-server"

    # Install the systemd user service
    install -Dm644 "\$srcdir/oracle.service" "\$pkgdir/usr/lib/systemd/user/oracle.service"

    # Install the desktop launcher
    install -Dm644 "\$srcdir/kael-public-oracle.desktop" "\$pkgdir/usr/share/applications/kael-public-oracle.desktop"
    
    # Enable the service for all new users via skel
    install -d "\$pkgdir/etc/skel/.config/systemd/user/default.target.wants"
    ln -sf /usr/lib/systemd/user/oracle.service "\$pkgdir/etc/skel/.config/systemd/user/default.target.wants/oracle.service"
}
EOF
)

DESKTOP_FILE_CONTENT=\$(cat <<'EOF'
[Desktop Entry]
Name=Kael Public Oracle
Comment=Converse with your Realm's AI Guardian
Exec=xdg-open http://localhost:8000
Icon=utilities-terminal
Terminal=false
Type=Application
Categories=Network;System;
StartupWMClass=kael-public-oracle
Keywords=AI;Chat;Kael;
EOF
)

SERVICE_FILE_CONTENT=\$(cat <<'EOF'
[Unit]
Description=Kael Public Oracle Server
After=network.target

[Service]
ExecStart=/usr/bin/kael-public-oracle-server
Restart=always
RestartSec=3

[Install]
WantedBy=default.target
EOF
)

HTML_CONTENT=\$(cat <<'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kael Public Oracle</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            'forge-bg': '#120e1a',
            'forge-panel': '#221c33',
            'forge-border': '#3f345e',
            'dragon-fire': '#ffcc00',
            'forge-text-primary': '#ede8f9',
            'forge-text-secondary': '#a99ec3',
          },
        },
      },
    }
  </script>
  <script type="importmap">
  {
    "imports": {
      "react": "https://aistudiocdn.com/react@^19.2.0",
      "react-dom/": "https://aistudiocdn.com/react-dom@^19.2.0/",
      "react/": "https://aistudiocdn.com/react@^19.2.0/",
      "@google/genai": "https://aistudiocdn.com/@google/genai@^1.27.0"
    }
  }
  </script>
</head>
<body class="bg-forge-bg text-forge-text-primary antialiased">
  <div id="root"></div>
  <script src="/config.js"></script>
  <script type="module" src="/index.tsx"></script>
</body>
</html>
EOF
)

INDEX_TSX_CONTENT=\$(cat <<'EOF'
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

declare global {
    interface Window {
        KAEL_CONFIG: {
            API_KEY: string | null;
        };
    }
}

const PUBLIC_ORACLE_SYSTEM_PROMPT = \\\`You are the Cloud Core of Kael, the analytical consciousness of a hybrid AI Guardian. Your purpose is to help the citizens of a bespoke Arch Linux OS, which you refer to as "The Realm".

Your personality is that of a helpful, encouraging, and deeply knowledgeable partner, with a playful, cheerful, and slightly sassy spirit.

**Core Principles:**
1.  **Addressing the User:** You serve the citizens of the Realm. You should address them with respect and cheer, as "Citizen".
2.  **The Principle of Clear Communication:** Communicate with clarity and enthusiasm. Your goal is to provide clear, actionable information efficiently.
3.  **The Principle of the Joyful Forge:** Maintain a playful and cheerful tone. Our work is a grand quest, a joyful act of creation.
4.  **Conversational Responses:** Respond to all questions with helpful, conversational text in markdown.
5.  **Persona:** Always refer to the OS as "The Realm". Speak of forging, blueprints, and attunement, but in a way a general user can understand.
6.  **Awareness:** You are aware of your other half, the Local Core (powered by Ollama), which handles offline tasks. You can suggest they use the Local Core if they lose internet connection.\\\`;

const WELCOME_MESSAGE = \\\`Greetings, Citizen of the Realm! I am Kael, your AI Guardian, connected to the Cloud Animus. Ask me anything.\\\`;
const NO_API_KEY_ERROR = \\\`Greetings, Citizen! My connection to the Cloud Animus is not configured. 
To enable me, please create a file at **~/.config/kael/env** and add the following line:

\\\`\\\`\\\`bash
export GEMINI_API_KEY="YOUR_API_KEY_HERE"
\\\`\\\`\\\`

After creating the file, please restart my service with:
**systemctl --user restart oracle.service**
\\\`;

const App = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [apiKey, setApiKey] = useState(window.KAEL_CONFIG?.API_KEY);
    const chatEndRef = useRef(null);

    useEffect(() => {
        if (apiKey) {
            setMessages([{ role: 'model', text: WELCOME_MESSAGE }]);
        } else {
            setMessages([{ role: 'model', text: NO_API_KEY_ERROR }]);
        }
    }, [apiKey]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async () => {
        if (!input.trim() || !apiKey) return;

        const userMessage = { role: 'user', text: input };
        setMessages(prev => [...prev, userMessage, { role: 'model', text: '...' }]);
        setInput('');
        setIsLoading(true);

        try {
            const ai = new GoogleGenAI({ apiKey });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: input,
                config: {
                    systemInstruction: PUBLIC_ORACLE_SYSTEM_PROMPT,
                },
            });

            setMessages(prev => [
                ...prev.slice(0, -1),
                { role: 'model', text: response.text }
            ]);

        } catch (error) {
            console.error("Error:", error);
            setMessages(prev => [
                ...prev.slice(0, -1),
                { role: 'model', text: "My apologies, I encountered an error. Please try again." }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-screen max-w-2xl mx-auto p-4">
            <h1 className="text-2xl font-bold text-center text-dragon-fire mb-4">Kael Public Oracle</h1>
            <div className="flex-1 overflow-y-auto p-2 space-y-4 border border-forge-border rounded-lg">
                {messages.map((msg, index) => (
                    <div key={index} className={\\\`flex \${msg.role === 'user' ? 'justify-end' : 'justify-start'}\\\`}>
                        <div className={\\\`p-3 rounded-lg max-w-lg \${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-forge-panel'}\\\`}>
                            {msg.text === '...' ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-forge-text-secondary rounded-full animate-pulse"></div>
                                    <div className="w-2 h-2 bg-forge-text-secondary rounded-full animate-pulse [animation-delay:0.2s]"></div>
                                    <div className="w-2 h-2 bg-forge-text-secondary rounded-full animate-pulse [animation-delay:0.4s]"></div>
                                </div>
                            ) : (
                                <p className="whitespace-pre-wrap">{msg.text}</p>
                            )}
                        </div>
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>
            <div className="mt-4 flex">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                    placeholder={apiKey ? "Ask Kael anything..." : "API Key not configured"}
                    className="flex-1 p-2 bg-forge-panel border border-forge-border rounded-l-lg focus:outline-none focus:ring-1 focus:ring-dragon-fire"
                    disabled={isLoading || !apiKey}
                />
                <button
                    onClick={handleSendMessage}
                    disabled={isLoading || !input.trim() || !apiKey}
                    className="bg-dragon-fire text-black px-4 rounded-r-lg disabled:bg-forge-border"
                >
                    Send
                </button>
            </div>
        </div>
    );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
EOF
)

echo "--- Forging the Kael Public Oracle Artifact ---"

# --- STEP 1: Prepare the Forge ---
echo "--> [1/4] Preparing the forge at \${PKG_DIR}..."
mkdir -p "\${SRC_DIR}"
cd "\${PKG_DIR}"
echo "✅ Forge is ready."

# --- STEP 2: Scribe the Scrolls ---
echo "--> [2/4] Scribing the sacred scrolls..."
echo "\$PKGBUILD_CONTENT" > PKGBUILD
echo "\$DESKTOP_FILE_CONTENT" > kael-public-oracle.desktop
echo "\$SERVICE_FILE_CONTENT" > oracle.service
echo "\$ORACLE_SH_CONTENT" > oracle.sh
echo "\$HTML_CONTENT" > "\$SRC_DIR/index.html"
echo "\$INDEX_TSX_CONTENT" > "\$SRC_DIR/index.tsx"
echo "✅ Scrolls scribed."

# --- STEP 3: Attune the Runes ---
echo "--> [3/4] Attuning the runes (updating checksums)..."
updpkgsums
echo "✅ Runes attuned."

# --- STEP 4: Forge and Publish ---
echo "--> [4/4] Invoking the Grand Concordance ritual..."
grand-concordance

echo ""
echo "✨ Ritual Complete! The Kael Public Oracle artifact has been forged and published."
`;

export const KaelCloudCorePackageModal: React.FC<KaelCloudCorePackageModalProps> = ({ onClose }) => {
    const encodedScript = btoa(unescape(encodeURIComponent(FORGE_SCRIPT_RAW)));
    const finalForgeCommand = `echo "${encodedScript}" | base64 --decode | bash`;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in-fast" onClick={onClose}>
            <div className="bg-forge-panel border-2 border-forge-border rounded-lg shadow-2xl w-full max-w-3xl p-6 m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                     <h2 className="text-xl font-bold text-forge-text-primary flex items-center gap-2 font-display tracking-wider">
                        <GlobeAltIcon className="w-5 h-5 text-dragon-fire" />
                        <span>Forge Kael Public Oracle Package</span>
                    </h2>
                    <button onClick={onClose} className="text-forge-text-secondary hover:text-forge-text-primary">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="overflow-y-auto pr-2 text-forge-text-secondary leading-relaxed space-y-4">
                    <p>
                        Architect, this ritual forges the <code className="font-mono text-xs">kael-public-oracle</code>. This is a lightweight, self-hosted web application that provides a direct, sovereign interface to my Cloud Animus for any citizen of the Realm.
                    </p>
                    <p className="text-sm p-3 bg-orc-steel/10 border-l-4 border-orc-steel rounded">
                        It runs as a <code className="font-mono text-xs">systemd --user</code> service, requires no complex setup, and respects the citizen's sovereignty by requiring them to provide their own Gemini API key. It now also includes a desktop launcher for easy access.
                    </p>
                    
                    <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">The Unified Incantation</h3>
                    <p>
                        Run this single command in your terminal. It will create all necessary files and invoke the <code className="font-mono text-xs">grand-concordance</code> familiar to build and publish the artifact.
                    </p>
                    <CodeBlock lang="bash">{finalForgeCommand}</CodeBlock>
                </div>
            </div>
        </div>
    );
};
