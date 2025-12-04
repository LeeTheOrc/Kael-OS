import React from 'react';
import { CloseIcon, SparklesIcon } from '../../core/Icons';
import { CodeBlock } from '../../core/CodeBlock';

interface KaelAIConfiguratorPackageModalProps {
  onClose: () => void;
}

// --- ARTIFACT DEFINITIONS ---

// This is the main shell script for the GUI
const CONFIGURATOR_SCRIPT_CONTENT = `#!/bin/bash
# Kael AI Core Configurator v2.6 "The Black Box"

CONFIG_DIR="\$HOME/.config/kael"
ENV_FILE="\$CONFIG_DIR/env"
LOG_FILE="\$CONFIG_DIR/kael-configurator.log"
BUTTON_ERR_LOG="/tmp/kael-button-error.log"

mkdir -p "\$CONFIG_DIR"
touch "\$ENV_FILE"

# Logging function
log() {
    echo "[\\\$(date '+%Y-%m-%d %H:%M:%S')] \$1" >> "\$LOG_FILE"
}

log "--- Session Started ---"
log "Args: \$@"

# Explicit path to self for callbacks
BINARY_PATH="/usr/bin/kael-ai-configurator"

# --- FUNCTIONS ---
save_cloud_config() {
    log "FUNCTION CALLED: save_cloud_config"
    local submitted_key="\$1"
    local model_friendly="\$2"
    local model_name=""
    local key_placeholder="••••••••••••••••••••"

    log "Input Model: \$model_friendly"

    case "\$model_friendly" in
        "Gemini 3.0 Pro (Advanced)") model_name="gemini-3-pro-preview" ;;
        "Gemini 2.5 Pro (Balanced)") model_name="gemini-2.5-flash" ;;
        *) model_name="gemini-2.5-flash" ;; # Failsafe
    esac

    # --- READ EXISTING KEY IF PLACEHOLDER SUBMITTED ---
    local final_key=""
    local current_key=""
    
    if [ -f "\$ENV_FILE" ]; then
        current_key=\$(grep "^export GEMINI_API_KEY=" "\$ENV_FILE" | cut -d'=' -f2 | tr -d '"')
    fi

    if [ -n "\$submitted_key" ] && [ "\$submitted_key" != "\$key_placeholder" ]; then
        final_key="\$submitted_key"
    else
        final_key="\$current_key"
    fi
    
    log "Key length: \${#final_key}, Model: \$model_name"

    # --- ATOMIC WRITE ---
    local tmp_env=\$(mktemp)
    echo "export GEMINI_API_KEY=\\"\$final_key\\"" > "\$tmp_env"
    echo "export GEMINI_MODEL=\\"\$model_name\\"" >> "\$tmp_env"
    
    if mv "\$tmp_env" "\$ENV_FILE"; then
        log "Config saved successfully to \$ENV_FILE."
        yad --info --text="Cloud Animus configuration saved!\\n\\nModel: \$model_name" --width=350 --no-buttons --timeout=3
    else
        log "Error: Failed to move temp file to \$ENV_FILE"
        yad --error --text="Failed to write configuration file. Check permissions on \$ENV_FILE." --width=350
    fi
}

read_current_key() {
    if [ -f "\$ENV_FILE" ]; then
        grep "^export GEMINI_API_KEY=" "\$ENV_FILE" | cut -d'=' -f2 | tr -d '"'
    fi
}

read_current_model_name() {
    if [ -f "\$ENV_FILE" ]; then
        grep "^export GEMINI_MODEL=" "\$ENV_FILE" | cut -d'=' -f2 | tr -d '"'
    fi
}

check_ollama_status() {
    log "Checking Ollama status..."
    if systemctl is-active --quiet ollama.service; then
        yad --info --text="Ollama service is active and running." --width=300 --no-buttons
    else
        yad --error --text="Ollama service is INACTIVE." --width=300 --no-buttons
    fi
}

summon_llama3() {
    log "Summoning Llama 3..."
    ollama pull llama3 | yad --progress --pulsate --title="Summoning Llama 3" --text="The ritual has begun... this may take some time." --auto-close --no-buttons
    if ollama list | grep -q "llama3"; then
        log "Llama 3 summoned."
        yad --info --text="Llama 3 has been successfully summoned." --width=300
    else
        log "Llama 3 summon failed."
        yad --error --text="Failed to summon Llama 3. Check network and run 'journalctl -u ollama' for logs." --width=400
    fi
}

summon_phi3() {
    log "Summoning Phi-3..."
    ollama pull phi3 | yad --progress --pulsate --title="Summoning Phi-3" --text="The ritual has begun... this may take some time." --auto-close --no-buttons
     if ollama list | grep -q "phi3"; then
        log "Phi-3 summoned."
        yad --info --text="Phi-3 has been successfully summoned." --width=300
    else
        log "Phi-3 summon failed."
        yad --error --text="Failed to summon Phi-3. Check network and run 'journalctl -u ollama' for logs." --width=400
    fi
}

save_terminal_settings() {
    local raw_size="\$1"
    # FIX: Strip decimals to ensure integer (yad sends floats like 14.0000)
    local size="\${raw_size%%.*}"
    
    log "FUNCTION CALLED: save_terminal_settings. Input: \$raw_size, Parsed: \$size"
    
    local profile_dir="\$HOME/.local/share/konsole"
    
    if ! command -v yad &> /dev/null; then
        echo "Error: yad is not installed." >&2
        exit 1
    fi
    
    mkdir -p "\$profile_dir"

    # Find the most recently modified profile
    local profile_file=\$(find "\$profile_dir" -name "*.profile" -printf '%T@ %p\\n' 2>/dev/null | sort -n | tail -n 1 | cut -d' ' -f2-)
    log "Target Profile: \$profile_file"
    
    if [[ -z "\$profile_file" ]]; then
        log "No profile found. Creating default."
        yad --info --text="No existing Konsole profile found. Creating 'Kael_Default.profile'..." --width=400 --no-buttons --timeout=3
        profile_file="\$profile_dir/Kael_Default.profile"
        
        printf "[Appearance]\\nColorScheme=Breeze\\nFont=Noto Sans Mono,14,-1,5,50,0,0,0,0,0\\n\\n[General]\\nName=Kael Default\\nParent=FALLBACK/\\n" > "\$profile_file"
    fi

    # Ensure Font line exists
    if ! grep -q "^Font=" "\$profile_file"; then
        log "Font key missing. Appending."
        if grep -q "^\\[Appearance\\]" "\$profile_file"; then
            sed -i '/^\\[Appearance\\]/a Font=Noto Sans Mono,14,-1,5,50,0,0,0,0,0' "\$profile_file"
        else
            echo -e "\\n[Appearance]\\nFont=Noto Sans Mono,14,-1,5,50,0,0,0,0,0" >> "\$profile_file"
        fi
    fi
    
    # Use awk to change font size safely
    log "Applying change via awk..."
    awk -F, -v new_size="\$size" 'BEGIN{OFS=","} /^Font=/ { \$2 = new_size } 1' "\$profile_file" > "\$profile_file.tmp" && mv "\$profile_file.tmp" "\$profile_file"
    
    log "Terminal config updated successfully."
    yad --info --text="Konsole font size set to \${size}pt!\\n\\nChanges will apply to new Konsole windows." --width=350 --no-buttons
}

read_current_terminal_config() {
    local profile_dir="\$HOME/.local/share/konsole"
    
    if [[ ! -d "\$profile_dir" ]]; then
        echo "14"
        return
    fi
    
    local profile_file=\$(find "\$profile_dir" -name "*.profile" -printf '%T@ %p\\n' 2>/dev/null | sort -n | tail -n 1 | cut -d' ' -f2-)
    
    if [[ -n "\$profile_file" ]] && grep -q "^Font=" "\$profile_file"; then
        grep "^Font=" "\$profile_file" | cut -d',' -f2
    else
        echo "14"
    fi
}

# --- ARGUMENT DISPATCHER ---
# This dispatcher handles the recursive calls from buttons
if [[ "\$1" == "--save-cloud" ]]; then
    save_cloud_config "\$2" "\$3"
    exit 0
elif [[ "\$1" == "--check-ollama" ]]; then
    check_ollama_status
    exit 0
elif [[ "\$1" == "--summon-llama3" ]]; then
    summon_llama3
    exit 0
elif [[ "\$1" == "--summon-phi3" ]]; then
    summon_phi3
    exit 0
elif [[ "\$1" == "--save-terminal" ]]; then
    save_terminal_settings "\$2"
    exit 0
fi

# --- GUI STARTUP ---

CURRENT_API_KEY="\$(read_current_key)"
CURRENT_MODEL_NAME="\$(read_current_model_name)"
CURRENT_FONT_SIZE="\$(read_current_terminal_config)"

KEY_PLACEHOLDER="••••••••••••••••••••"
KEY_FIELD_VALUE=""

if [ -n "\$CURRENT_API_KEY" ]; then
    KEY_STATUS_TEXT="✓ Key is set. Update it below, or leave as is to keep."
    KEY_FIELD_VALUE="\$KEY_PLACEHOLDER"
else
    KEY_STATUS_TEXT="⚠ No key found. Please enter your key below."
    KEY_FIELD_VALUE=""
fi

case "\$CURRENT_MODEL_NAME" in
    "gemini-3-pro-preview") MODEL_VAL_FRIENDLY="Gemini 3.0 Pro (Advanced)" ;;
    "gemini-2.5-flash") MODEL_VAL_FRIENDLY="Gemini 2.5 Pro (Balanced)" ;;
    *) MODEL_VAL_FRIENDLY="Gemini 2.5 Pro (Balanced)" ;;
esac

# DEBUG WRAPPER
# We wrap the command execution in 'sh -c' and redirect stderr to a file so we can see why it fails.
CMD_PREFIX="sh -c '\$BINARY_PATH"
CMD_SUFFIX=">> /tmp/kael-button-error.log 2>&1'"

yad --form --title="Kael AI Core Configurator v2.6" --width=500 --height=450 \\
    --field="<b>Cloud Animus (Gemini)</b>:LBL" '' \\
    --field="\$KEY_STATUS_TEXT:LBL" '' \\
    --field="Gemini API Key:P" "\$KEY_FIELD_VALUE" \\
    --field="Cloud Model:CB" "\$MODEL_VAL_FRIENDLY!Gemini 3.0 Pro (Advanced)!Gemini 2.5 Pro (Balanced)" \\
    --field="Save Cloud Settings:BTN" "\$CMD_PREFIX --save-cloud \\"%3\\" \\"%4\\" \$CMD_SUFFIX" \\
    --field="<b>Local Animus (Ollama)</b>:LBL" '' \\
    --field="Check Service Status:BTN" "\$CMD_PREFIX --check-ollama \$CMD_SUFFIX" \\
    --field="Summon Llama 3 (Primary):BTN" "\$CMD_PREFIX --summon-llama3 \$CMD_SUFFIX" \\
    --field="Summon Phi-3 (Failsafe):BTN" "\$CMD_PREFIX --summon-phi3 \$CMD_SUFFIX" \\
    --field="<b>Terminal Appearance (Konsole)</b>:LBL" '' \\
    --field="Font Size (pt):NUM" "\$CURRENT_FONT_SIZE" \\
    --field="Save Terminal Settings:BTN" "\$CMD_PREFIX --save-terminal \\"%11\\" \$CMD_SUFFIX"
`;

// This is the .desktop file content
const DESKTOP_FILE_CONTENT = `[Desktop Entry]
Name=Kael AI Configurator
Comment=Configure Kael's Hybrid AI Core
Exec=/usr/bin/kael-ai-configurator
Icon=preferences-system
Terminal=false
Type=Application
Categories=System;Settings;
Keywords=AI;Kael;Ollama;Gemini;
`;

// This is the PKGBUILD content
const PKGBUILD_CONTENT = `
# Maintainer: Kael AI for The Architect
pkgname=kael-ai-configurator
pkgver=2.6
pkgrel=1
pkgdesc="A GUI to configure the Kael Hybrid AI Core. v2.6 Adds aggressive debug logging."
arch=('any')
url="https://github.com/LeeTheOrc/Kael-OS"
license=('GPL3')
depends=('yad' 'ollama')
source=("kael-ai-configurator.sh" "kael-ai-configurator.desktop")
sha256sums=('SKIP' 'SKIP')

package() {
    install -Dm755 "\$srcdir/kael-ai-configurator.sh" "\$pkgdir/usr/bin/kael-ai-configurator"
    install -Dm644 "\$srcdir/kael-ai-configurator.desktop" "\$pkgdir/usr/share/applications/kael-ai-configurator.desktop"
}
`;

// This is the main script that writes the files and runs makepkg
const FORGE_SCRIPT_RAW = `#!/bin/bash
(
set -euo pipefail

# --- VM-AWARE PATHING ---
USER_HOME=\$(getent passwd "\${SUDO_USER:-\$USER}" | cut -d: -f6)
if [ -d "\$USER_HOME/host_forge" ]; then
    PKG_DIR="\$USER_HOME/host_forge/packages/kael-ai-configurator"
else
    PKG_DIR="\$USER_HOME/forge/packages/kael-ai-configurator"
fi

echo "--- Forging the Kael AI Configurator Artifact (v2.6) ---"

# --- STEP 1: Prepare the Forge ---
echo "--> [1/4] Preparing the forge at \${PKG_DIR}..."
mkdir -p "\${PKG_DIR}"
cd "\${PKG_DIR}"
rm -f *.pkg.tar.zst *.pkg.tar.zst.sig
echo "✅ Forge is ready."

# --- STEP 2: Scribe the Scrolls ---
echo "--> [2/4] Scribing the sacred scrolls..."

cat > kael-ai-configurator.sh << 'EOF'
${"CONFIGURATOR_SCRIPT_CONTENT"}
EOF
chmod +x kael-ai-configurator.sh

cat > kael-ai-configurator.desktop << 'EOF'
${"DESKTOP_FILE_CONTENT"}
EOF

cat > PKGBUILD << 'EOF'
${"PKGBUILD_CONTENT"}
EOF

echo "✅ Scrolls scribed."

# --- STEP 3: Attune the Runes ---
echo "--> [3/4] Attuning the runes (updating checksums)..."
updpkgsums
echo "✅ Runes attuned."

# --- STEP 4: Forge and Publish ---
echo "--> [4/4] Invoking the Grand Concordance ritual..."
grand-concordance

echo ""
echo "✨ Ritual Complete! The Kael AI Configurator v2.6 has been forged and published."
echo "   To install it and create the menu shortcut, run:"
echo "   sudo pacman -Syu kael-ai-configurator"
)
`;

export const KaelAIConfiguratorPackageModal: React.FC<KaelAIConfiguratorPackageModalProps> = ({ onClose }) => {
    // Construct script by injecting the content variables via replacement
    const finalForgeScript = FORGE_SCRIPT_RAW
        .replace('${"CONFIGURATOR_SCRIPT_CONTENT"}', CONFIGURATOR_SCRIPT_CONTENT)
        .replace('${"DESKTOP_FILE_CONTENT"}', DESKTOP_FILE_CONTENT)
        .replace('${"PKGBUILD_CONTENT"}', PKGBUILD_CONTENT);

    const finalForgeCommand = `bash <<'EOF'\n${finalForgeScript}\nEOF`;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in-fast" onClick={onClose}>
            <div className="bg-forge-panel border-2 border-forge-border rounded-lg shadow-2xl w-full max-w-3xl p-6 m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                     <h2 className="text-xl font-bold text-forge-text-primary flex items-center gap-2 font-display tracking-wider">
                        <SparklesIcon className="w-5 h-5 text-dragon-fire" />
                        <span>Forge AI Configurator v2.6 (Protected)</span>
                    </h2>
                    <button onClick={onClose} className="text-forge-text-secondary hover:text-forge-text-primary">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="overflow-y-auto pr-2 text-forge-text-secondary leading-relaxed space-y-4">
                    <p>
                        Architect, this artifact has been moved to the <strong>Sanctum</strong>. It is a completed, protected artifact (v2.6 "The Black Box").
                    </p>
                     <div className="text-sm p-3 bg-orc-steel/10 border-l-4 border-orc-steel rounded space-y-2">
                        <strong className="text-orc-steel">Protected Status:</strong>
                        <ul className="list-disc list-inside">
                            <li>Source Code: Protected in <code className="font-mono text-xs">components/done/</code></li>
                            <li>Version: v2.6 (Debug Instrumented)</li>
                            <li>Log Location: <code className="font-mono text-xs">~/.config/kael/kael-configurator.log</code></li>
                        </ul>
                    </div>
                    
                    <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">The Black Box Incantation</h3>
                    <p>
                        If you need to re-forge this artifact, run the command below. After forging, it must be installed to appear in your menu.
                    </p>
                    <CodeBlock lang="bash">{finalForgeCommand}</CodeBlock>
                </div>
            </div>
        </div>
    );
};
