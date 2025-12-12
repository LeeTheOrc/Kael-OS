#!/bin/bash

# Kael-OS Setup Script
# This script installs all system dependencies for Kael-OS development

set -e

echo "🔥 Kael-OS System Dependencies Installer"
echo "=========================================="

# Detect OS
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "📦 Installing for Linux..."
    
    if command -v apt-get &> /dev/null; then
        echo "🐧 Debian/Ubuntu detected"
        sudo apt-get update
        sudo apt-get install -y \
            libssl-dev \
            libgtk-3-dev \
            libayatana-appindicator3-dev \
            librsvg2-dev \
            libwebkit2gtk-4.1-dev \
            curl \
            build-essential
    elif command -v dnf &> /dev/null; then
        echo "🎩 Fedora detected"
        sudo dnf install -y \
            openssl-devel \
            gtk3-devel \
            appindicator-gtk3-devel \
            librsvg2-devel \
            webkit2gtk3-devel \
            curl \
            gcc \
            make
    elif command -v pacman &> /dev/null; then
        echo "🐲 Arch Linux detected"
        sudo pacman -Syu --noconfirm
        sudo pacman -S --noconfirm \
            openssl \
            gtk3 \
            libappindicator-gtk3 \
            librsvg \
            webkit2gtk \
            base-devel \
            curl
    fi
elif [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🍎 macOS detected"
    brew install openssl
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    echo "🪟 Windows detected - using MSVC toolchain"
fi

echo ""
echo "✅ System dependencies installed!"
echo ""
echo "Next steps:"
echo "1. cd /home/leetheorc/Kael-os/kael-os"
echo "2. pnpm install"
echo "3. cargo tauri dev"
echo ""
