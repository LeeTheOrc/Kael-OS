#!/usr/bin/env bash
set -e

VERSION="1.0.0"
PACKAGE_NAME="kael-os-${VERSION}-x86_64"
BASE_DIR="/home/leetheorc/Kael-os/Kael-OS-AI"
# Binary is built at workspace root level
BINARY_PATH="/home/leetheorc/Kael-os/target/release/kael-os"

cd "$BASE_DIR"

echo "📦 Creating release package: $PACKAGE_NAME"

# Create directory structure
mkdir -p "dist/${PACKAGE_NAME}/bin"
mkdir -p "dist/${PACKAGE_NAME}/share/applications"
mkdir -p "dist/${PACKAGE_NAME}/share/icons/hicolor/512x512/apps"

# Copy binary
echo "  ✓ Copying binary..."
cp "$BINARY_PATH" "dist/${PACKAGE_NAME}/bin/"
chmod +x "dist/${PACKAGE_NAME}/bin/kael-os"

# Copy icon
echo "  ✓ Copying icon..."
cp assets/generated/png/app-icons/icon-512.png "dist/${PACKAGE_NAME}/share/icons/hicolor/512x512/apps/kael-os.png"

# Create desktop file
echo "  ✓ Creating desktop entry..."
cat > "dist/${PACKAGE_NAME}/share/applications/kael-os.desktop" << 'EOF'
[Desktop Entry]
Name=Kael-OS
Comment=AI-Powered Terminal and Chat Interface
Exec=/usr/bin/kael-os
Icon=kael-os
Type=Application
Categories=Utility;Development;Chat;
Terminal=false
EOF

# Copy docs and installer
echo "  ✓ Copying documentation..."
cp README.md "dist/${PACKAGE_NAME}/"
cp website/install.sh "dist/${PACKAGE_NAME}/"
chmod +x "dist/${PACKAGE_NAME}/install.sh"

# Create install instructions
cat > "dist/${PACKAGE_NAME}/INSTALL.txt" << 'EOF'
=== Kael-OS Installation Instructions ===

QUICK INSTALL (Recommended):
  sudo ./install.sh

MANUAL INSTALL:
  sudo cp bin/kael-os /usr/bin/
  sudo cp share/applications/kael-os.desktop /usr/share/applications/
  sudo cp share/icons/hicolor/512x512/apps/kael-os.png /usr/share/icons/hicolor/512x512/apps/

UNINSTALL:
  sudo rm /usr/bin/kael-os
  sudo rm /usr/share/applications/kael-os.desktop
  sudo rm /usr/share/icons/hicolor/512x512/apps/kael-os.png

REQUIREMENTS:
  - Arch Linux (or compatible)
  - Ollama (optional, for local AI)
  - GPU drivers (optional, for GPU status)

For more information: https://leroyonline.co.za/kael/
EOF

# Create tarball
echo "  ✓ Creating tarball..."
cd dist
tar czf "${PACKAGE_NAME}.tar.gz" "${PACKAGE_NAME}"

# Show results
echo ""
echo "✅ Package created successfully!"
ls -lh "${PACKAGE_NAME}.tar.gz"
echo ""
echo "SHA-256:"
sha256sum "${PACKAGE_NAME}.tar.gz"
echo ""
echo "📦 Package location: dist/${PACKAGE_NAME}.tar.gz"
