# Maintainer: LeeTheOrc <you@example.com>
pkgname=kael-os
pkgver=0.2.0
pkgrel=1
pkgdesc="Kael-OS: AI Terminal + Brainstorm Companion (Rust/Dioxus) - Native Arch Linux"
arch=('x86_64')
url="https://github.com/LeeTheOrc/kael-os"
license=('GPL3')
depends=(
    'openssl'
    'gtk3'
    'libappindicator-gtk3'
    'librsvg'
    'webkit2gtk'
    'ollama'
)
optdepends=(
    'ollama-cuda: NVIDIA GPU acceleration for local AI'
    'ollama-rocm: AMD GPU acceleration for local AI'
)
makedepends=(
    'rust'
    'cargo'
    'base-devel'
    'git'
    'pkg-config'
    'clang'
    'llvm'
    'lld'
)
provides=("${pkgname}")
conflicts=("${pkgname}-bin" "${pkgname}-git")

# Clone latest from GitHub (master branch)
source=("git+${url}.git#branch=master")
sha256sums=('SKIP')

build() {
    cd "${pkgname}/src-tauri"

    # Prefer clang/llvm toolchain for ring/crypto build stability
    export CC=clang
    export CXX=clang++
    export RUSTFLAGS="-Clink-arg=-fuse-ld=lld"
    
    # Build native release binary with full optimizations
    cargo build \
        --release \
        --locked
}

package() {
    cd "${srcdir}/${pkgname}"
    
    # Install native binary to /usr/bin
    install -Dm755 \
        "target/release/kael-os" \
        "${pkgdir}/usr/bin/kael-os"
    
    # Install desktop file for application menu
    install -Dm644 /dev/stdin "${pkgdir}/usr/share/applications/kael-os.desktop" << 'EOF'
[Desktop Entry]
Type=Application
Name=Kael-OS
Comment=AI Terminal + Brainstorm Companion
Exec=/usr/bin/kael-os
Icon=kael-os
Terminal=false
Categories=Development;Utility;
StartupNotify=true
EOF

    # Install icons (for app launcher)
    install -Dm644 "src-tauri/icons/icon.png" \
        "${pkgdir}/usr/share/pixmaps/kael-os.png"
    install -Dm644 "src-tauri/icons/128x128.png" \
        "${pkgdir}/usr/share/icons/hicolor/128x128/apps/kael-os.png"
    install -Dm644 "src-tauri/icons/128x128@2x.png" \
        "${pkgdir}/usr/share/icons/hicolor/256x256/apps/kael-os.png"
    
    # Install documentation
    install -Dm644 "README.md" \
        "${pkgdir}/usr/share/doc/kael-os/README.md"
    install -Dm644 "SETUP.md" \
        "${pkgdir}/usr/share/doc/kael-os/SETUP.md"
}

post_install() {
    echo ""
    echo "=========================================="
    echo "✅ Kael-OS v${pkgver} installed!"
    echo "=========================================="
    echo ""
    echo "📍 Run:          kael-os"
    echo "📁 Config:       ~/.config/kael-os/"
    echo "🗄️  Database:     ~/.config/kael-os/kael.db"
    echo ""
    
    # Start Ollama service and pull models
    echo "🤖 Setting up local AI models..."
    echo "   (This may take 10-15 minutes for ~7GB download)"
    echo ""
    
    # Ensure ollama service is running
    if systemctl is-active --quiet ollama.service 2>/dev/null; then
        echo "✅ Ollama service already running"
    else
        echo "🔄 Starting Ollama service..."
        sudo systemctl start ollama.service 2>/dev/null || {
            echo "⚠️  Could not start ollama service via systemd"
            echo "   Starting ollama manually..."
            ollama serve &>/dev/null &
            sleep 3
        }
    fi
    
    # Pull required models
    echo ""
    echo "📥 Downloading llama3:latest (~4.7GB)..."
    ollama pull llama3:latest || echo "⚠️  Failed to pull llama3:latest"
    
    echo "📥 Downloading phi3:latest (~2.3GB)..."
    ollama pull phi3:latest || echo "⚠️  Failed to pull phi3:latest"
    
    echo ""
    echo "✅ Local AI models installed!"
    echo ""
    echo "🚀 Quick Start:"
    echo "   1. Run: kael-os"
    echo "   2. Open Settings (⚙️)"
    echo "   3. Configure AI Providers (Mistral, Gemini, etc.)"
    echo "   4. Start chatting with local or cloud AI!"
    echo ""
    echo "💡 Local models available:"
    echo "   • llama3:latest (Meta's flagship model)"
    echo "   • phi3:latest (Microsoft's efficient model)"
    echo ""
    echo "📱 Brainstorm on phone, execute on desktop"
    echo "   (Android app coming soon)"
    echo ""
    echo "=========================================="
    echo ""
}

post_upgrade() {
    echo ""
    echo "✅ Kael-OS updated to v${pkgver}"
    echo "   Run: kael-os"
    echo ""
}
