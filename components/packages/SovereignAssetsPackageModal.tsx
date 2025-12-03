
import React from 'react';
import { CloseIcon, PaintBrushIcon } from '../core/Icons';
import { CodeBlock } from '../core/CodeBlock';

interface SovereignAssetsPackageModalProps {
  onClose: () => void;
}

const FORGE_FONTS_SCRIPT_RAW = `#!/bin/bash
(
set -euo pipefail

# --- SAFE INSTALL PROTOCOL ---
# Installs dependencies while temporarily ignoring broken custom repos
safe_install_deps() {
    echo "--> Installing dependencies (safe mode)..."
    local TMP_CONF=$(mktemp)
    # Filter out Kael OS repos to prevent 404s/DB errors blocking install
    awk '
        /^\\\[kael-os/ { in_section=1; next }
        /^\\\[/ { in_section=0 }
        !in_section { print }
    ' /etc/pacman.conf > "$TMP_CONF"
    
    sudo pacman -S --needed --noconfirm --config "$TMP_CONF" "$@"
    rm -f "$TMP_CONF"
}

# --- LOCATE THE SCRIBE ---
if command -v grand-concordance &> /dev/null; then
    SCRIBE_CMD="grand-concordance"
elif [ -f "$HOME/host_forge/grand-concordance.sh" ]; then
    SCRIBE_CMD="bash $HOME/host_forge/grand-concordance.sh"
else
    echo "❌ Error: The 'grand-concordance' ritual cannot be found."
    echo "   Run 'Grand Concordance' -> 'Forge the Scribe' first."
    exit 1
fi

# --- VM-AWARE PATHING ---
USER_HOME=$(getent passwd "\${SUDO_USER:-$USER}" | cut -d: -f6)
if [ -d "$USER_HOME/host_forge" ]; then
    PKG_DIR="$USER_HOME/host_forge/packages/kaelic-fonts"
else
    PKG_DIR="$USER_HOME/forge/packages/kaelic-fonts"
fi

mkdir -p "$PKG_DIR"
cd "$PKG_DIR"

# Cleanup
rm -f *.ttf *.otf *.zip *.zst* PKGBUILD *.install

echo "--- Forging Kaelic Fonts 0.00.01 [The Sovereign Bond] ---"

# PRE-INSTALL DEPENDENCIES to avoid makepkg using the broken pacman.conf
safe_install_deps unzip fontconfig

# Create install script
cat > kaelic-fonts.install << 'EOF'
post_install() {
  echo "--> Updating font cache..."
  fc-cache -sv
}
post_upgrade() {
  post_install
}
post_remove() {
  post_install
}
EOF

# PKGBUILD v0.00.01
cat > PKGBUILD << 'EOF'
# Maintainer: Kael AI for The Architect
pkgname=kaelic-fonts
pkgver=0.00.01
pkgrel=1
pkgdesc="Sovereign Font Pack (Alpha). Self-contained Nerd Font."
arch=('any')
url="https://github.com/LeeTheOrc/Kael-OS"
license=('OFL')
# SOVEREIGNTY: We embed the font and PROVIDE the capability, rather than depending on it.
# This prevents pacman from asking questions about providers.
provides=('ttf-font-nerd' 'nerd-fonts-noto-sans-mono')
conflicts=('nerd-fonts-noto-sans-mono')
makedepends=('unzip' 'fontconfig')
install=kaelic-fonts.install
source=(
    'Noto.zip::https://github.com/ryanoasis/nerd-fonts/releases/download/v3.2.1/Noto.zip'
    'kaelic-fonts.install'
)
sha256sums=('SKIP'
            'SKIP')

package() {
    install -d "$pkgdir/usr/share/fonts/TTF"
    find "$srcdir" -type f -name "NotoSansMonoNerdFont-Regular.ttf" -exec install -Dm644 {} "$pkgdir/usr/share/fonts/TTF/NotoSansMonoNerdFont-Regular.ttf" \\;
    find "$srcdir" -type f -name "NotoSansMonoNerdFont-Bold.ttf" -exec install -Dm644 {} "$pkgdir/usr/share/fonts/TTF/NotoSansMonoNerdFont-Bold.ttf" \\;
}
EOF

# Update checksums
updpkgsums

# Forge & Publish
$SCRIBE_CMD

echo ""
echo "✨ Ritual Complete! Kaelic Fonts 0.00.01 forged and published."
)
`;

const FORGE_ICONS_SCRIPT_RAW = `#!/bin/bash
(
set -euo pipefail

# --- SAFE INSTALL PROTOCOL ---
safe_install_deps() {
    echo "--> Installing dependencies (safe mode)..."
    local TMP_CONF=$(mktemp)
    awk '
        /^\\\[kael-os/ { in_section=1; next }
        /^\\\[/ { in_section=0 }
        !in_section { print }
    ' /etc/pacman.conf > "$TMP_CONF"
    
    sudo pacman -S --needed --noconfirm --config "$TMP_CONF" "$@"
    rm -f "$TMP_CONF"
}

# --- LOCATE THE SCRIBE ---
if command -v grand-concordance &> /dev/null; then
    SCRIBE_CMD="grand-concordance"
elif [ -f "$HOME/host_forge/grand-concordance.sh" ]; then
    SCRIBE_CMD="bash $HOME/host_forge/grand-concordance.sh"
else
    echo "❌ Error: The 'grand-concordance' ritual cannot be found."
    echo "   Run 'Grand Concordance' -> 'Forge the Scribe' first."
    exit 1
fi

# --- VM-AWARE PATHING ---
USER_HOME=$(getent passwd "\${SUDO_USER:-$USER}" | cut -d: -f6)
if [ -d "$USER_HOME/host_forge" ]; then
    PKG_DIR="$USER_HOME/host_forge/packages/kaelic-icons"
else
    PKG_DIR="$USER_HOME/forge/packages/kaelic-icons"
fi

mkdir -p "$PKG_DIR"
cd "$PKG_DIR"

# Cleanup
rm -f *.svg *.zst* PKGBUILD *.install

echo "--- Forging Kaelic Icons 0.00.01 [The Cache Pact] ---"

# PRE-INSTALL DEPENDENCIES
safe_install_deps gtk-update-icon-cache

# Create SVG Icon for kaelic-terminal
cat > kaelic-terminal.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4 20V4M4 12h8M12 12l6-8M12 12l6 8"/>
</svg>
EOF

# Create install script to update icon cache
cat > kaelic-icons.install << 'EOF'
post_install() {
  gtk-update-icon-cache -q -t -f /usr/share/icons/hicolor || true
}
post_upgrade() {
  post_install
}
post_remove() {
  post_install
}
EOF

# PKGBUILD
cat > PKGBUILD << 'EOF'
# Maintainer: Kael AI for The Architect
pkgname=kaelic-icons
pkgver=0.00.01
pkgrel=1
pkgdesc="Sovereign Icon Pack for Kael OS (Alpha)."
arch=('any')
url="https://github.com/LeeTheOrc/Kael-OS"
license=('GPL3')
depends=('gtk-update-icon-cache')
source=("kaelic-terminal.svg" "kaelic-icons.install")
sha256sums=('SKIP' 'SKIP')
install=kaelic-icons.install

package() {
    install -Dm644 "$srcdir/kaelic-terminal.svg" "$pkgdir/usr/share/icons/hicolor/scalable/apps/kaelic-terminal.svg"
}
EOF

# Update checksums
updpkgsums

# Forge & Publish
$SCRIBE_CMD

echo ""
echo "✨ Ritual Complete! Kaelic Icons 0.00.01 forged and published."
)
`;


export const SovereignAssetsPackageModal: React.FC<SovereignAssetsPackageModalProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in-fast" onClick={onClose}>
            <div className="bg-forge-panel border-2 border-forge-border rounded-lg shadow-2xl w-full max-w-3xl p-6 m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center mb-4 flex-shrink-0">
                     <h2 className="text-xl font-bold text-forge-text-primary flex items-center gap-2 font-display tracking-wider">
                        <PaintBrushIcon className="w-5 h-5 text-dragon-fire" />
                        <span>Forge Sovereign Assets 0.00.01</span>
                    </h2>
                    <button onClick={onClose} className="text-forge-text-secondary hover:text-forge-text-primary">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </header>
                <div className="overflow-y-auto pr-2 text-forge-text-secondary leading-relaxed space-y-6">
                     <p>
                        Architect, we must forge these assets to populate the Athenaeum. Once these are forged, the database will be created, allowing the "Install Dependencies" ritual to succeed.
                    </p>
                    <p className="text-sm p-3 bg-orc-steel/10 border-l-4 border-orc-steel rounded">
                        <strong className="text-orc-steel">VM-Aware Pathing:</strong> These scripts now correctly use the <code className="font-mono text-xs">~/host_forge</code> directory when run inside the VM.
                    </p>

                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">Forge Kaelic Fonts (0.00.01)</h3>
                        <p className="text-sm">
                            Resets fonts to Alpha v0.00.01. This creates the initial package artifact.
                        </p>
                        <CodeBlock lang="bash">{FORGE_FONTS_SCRIPT_RAW}</CodeBlock>
                    </div>

                    <div className="space-y-4 border-t border-forge-border pt-6">
                        <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">Forge Kaelic Icons (0.00.01)</h3>
                        <p className="text-sm">
                           Resets icons to Alpha v0.00.01.
                        </p>
                        <CodeBlock lang="bash">{FORGE_ICONS_SCRIPT_RAW}</CodeBlock>
                    </div>
                </div>
            </div>
        </div>
    );
};
