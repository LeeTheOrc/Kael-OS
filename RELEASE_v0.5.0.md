# Kael-OS v0.5.0-beta Release Notes

**Release Date:** December 16, 2025  
**Package:** kael-os-0.5.0-x86_64.tar.gz  
**Size:** 7.6 MB  
**SHA-256:** `aaa04d8b18369d2a3c9a0f7ab52be464a590a8daedb7f43e887435786a7ba597`

## 🎨 Major New Features

### Theme Integration System
- **Settings → Themes Tab**: New dedicated tab for OS customization
- **One-Click Wallpaper Installer**: Automatically detects and configures:
  - KDE Plasma (via plasma-apply-wallpaperimage)
  - GNOME (via gsettings)
  - XFCE (via xfconf-query)
  - Generic fallback (feh, nitrogen, or manual copy)
- **GRUB Bootloader Theme**: Professional dragon theme with installation instructions
- **Included Assets**:
  - Dragon wallpaper (1536x1024, 236KB) - semi-sideways cyberpunk design
  - GRUB theme (1536x1024, 109KB) - optimized for boot menu

## 🐉 Dragon Branding Complete

All three DALL-E 3 dragon variants now integrated:
1. **App Icon** (front-facing, 1024x1024) - Application branding
2. **Desktop Wallpaper** (semi-sideways, 1536x1024) - Desktop customization
3. **GRUB Theme** (semi-sideways, 1536x1024) - Bootloader theming

## 🔧 Technical Changes

### New Modules
- `src-tauri/src/commands/theme_installer.rs` - Desktop environment detection and theme installation
- Desktop detection via XDG_CURRENT_DESKTOP, DESKTOP_SESSION, and process checks
- Multi-DE support with graceful fallbacks

### Package Structure
```
kael-os-0.5.0-x86_64/
├── bin/kael-os (22MB binary)
├── share/
│   ├── applications/kael-os.desktop
│   ├── icons/hicolor/512x512/apps/kael-os.png (265KB dragon icon)
│   └── kael-os/
│       ├── wallpapers/kael-dragon-wallpaper.jpg (236KB)
│       └── grub/kael-dragon-grub.jpg (109KB)
├── install.sh
├── INSTALL.txt
└── README.md
```

### Build Process Updates
- `scripts/build-release.sh` now includes theme assets
- Version updated: 1.0.0 → 0.5.0 (continuing beta testing)
- Install instructions updated with theme asset paths

## 📦 Installation

### Download
```bash
wget https://leroyonline.co.za/kael/downloads/desktop/kael-os-0.5.0-x86_64.tar.gz
echo "aaa04d8b18369d2a3c9a0f7ab52be464a590a8daedb7f43e887435786a7ba597  kael-os-0.5.0-x86_64.tar.gz" | sha256sum -c
```

### Install
```bash
tar -xzf kael-os-0.5.0-x86_64.tar.gz
cd kael-os-0.5.0-x86_64
sudo cp bin/kael-os /usr/bin/
sudo cp share/applications/kael-os.desktop /usr/share/applications/
sudo cp share/icons/hicolor/512x512/apps/kael-os.png /usr/share/icons/hicolor/512x512/apps/
sudo cp -r share/kael-os /usr/share/
```

### Using Themes
1. Launch Kael-OS
2. Go to Settings (gear icon)
3. Click "Themes" tab
4. Click "Install Wallpaper" for desktop background
5. Click "Prepare GRUB Theme" for bootloader (follow sudo instructions)

## 🌐 Deployment

- **WebDAV:** https://leroyonline.co.za/kael/downloads/desktop/kael-os-0.5.0-x86_64.tar.gz
- **GitHub Pages:** https://leetheorc.github.io/kael-os/
- **Discord Community:** https://discord.gg/9mRjPxpShW

## ⚠️ Breaking Changes

- **Version Numbering**: Changed from 1.0.0 to 0.5.0 to reflect beta status
- **Old Packages**: v1.0.0 packages are deprecated and removed from download servers
- **API Compatibility**: No breaking API changes, binary is forward compatible

## 🎯 Beta Status

Kael-OS remains in **BETA testing phase**. This release focuses on:
- User experience enhancements (theme customization)
- System integration improvements
- Cross-desktop environment compatibility
- User feedback collection

## 🐛 Known Issues

- Install script expects AUR package (not yet published) - use manual install
- GRUB theme requires manual sudo installation (by design for security)
- Some desktop environments may require manual wallpaper selection

## 📝 Next Steps

1. Test theme installation across multiple desktop environments
2. Gather user feedback on customization features
3. Prepare AUR package for easier installation
4. Consider auto-wallpaper rotation feature
5. ISO distribution with pre-configured themes

## 🙏 Testing Request

Please test the theme installation on your system and report:
- Desktop environment (KDE, GNOME, XFCE, etc.)
- Installation success/failure
- Wallpaper quality and appearance
- Any errors or issues encountered

Report issues: https://github.com/LeeTheOrc/kael-os/issues  
Join Discord: https://discord.gg/9mRjPxpShW

---

**Previous Release:** v1.0.0-beta (deprecated)  
**Next Expected:** v0.6.0-beta (feature additions based on feedback)
