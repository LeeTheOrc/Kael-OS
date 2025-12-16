# Kael-OS Asset Library

Generated assets for the Kael-OS AI Desktop Application

## Color Palette

- **Primary Purple**: `#e040fb`
- **Cyan Accent**: `#7aebbe`
- **Yellow Highlight**: `#ffcc00`
- **Dark Background**: `#120e1a`

## Assets Inventory

### 🎨 Vector Graphics (SVG) - ✅ Created

1. **logo.svg** - Kael-OS wordmark with animated AI indicator
2. **loading-spinner.svg** - Animated gradient spinner with pulsing center
3. **success-icon.svg** - Checkmark with glowing effect
4. **error-icon.svg** - Alert triangle with exclamation mark
5. **info-icon.svg** - Information circle symbol
6. **chat-icon.svg** - Speech bubble with text lines
7. **terminal-icon.svg** - Terminal window with command prompt
8. **settings-icon.svg** - Gear/cog configuration icon
9. **ollama-icon.svg** - Neural network brain for local AI
10. **cloud-icon.svg** - Cloud with animated sparkles for cloud AI

### 📐 Raster Icons (PNG) - ⚠️ Specifications Provided

Required sizes for app icons (all with transparent backgrounds):

- **kael-icon-16.png** (16x16px)
- **kael-icon-32.png** (32x32px)
- **kael-icon-64.png** (64x64px)
- **kael-icon-128.png** (128x128px)
- **kael-icon-256.png** (256x256px)
- **kael-icon-512.png** (512x512px)

**Design Specification:**

- Letter "K" in bold, modern font
- Purple to cyan gradient (#e040fb → #7aebbe)
- Optional: Circuit pattern or AI brain silhouette in background
- Clean, recognizable at small sizes
- Transparent background

### 🖼️ Background Images - ⚠️ Specifications Provided

1. **hero-background.png** (1920x1080px)

   - Dark gradient from #120e1a to darker purple
   - Subtle circuit board pattern overlay
   - Glowing nodes in purple/cyan
   - Opacity: 15-20% for pattern layer

2. **sidebar-background.png** (400x1080px)

   - Vertical gradient: #120e1a to #1a1520
   - Minimal tech pattern
   - Slight noise texture for depth

3. **terminal-background.png** (1920x400px)
   - Dark background (#0d0a12)
   - Matrix-style code rain effect (very subtle)
   - Green/cyan accent colors at 10% opacity

## Usage Guidelines

### SVG Icons

All SVG files support:

- Scaling to any size without quality loss
- Theme color customization via CSS
- Animated elements where applicable
- Can be used inline in HTML or as `<img>` tags

Example usage:

```html
<img src="assets/generated/logo.svg" alt="Kael-OS" width="200" />
<object
  data="assets/generated/loading-spinner.svg"
  type="image/svg+xml"
></object>
```

### PNG Icons

Use appropriate size for context:

- 16px, 32px: Favicons, taskbar
- 64px, 128px: Toolbar, lists
- 256px, 512px: App launcher, splash screens

### Background Images

Apply with CSS:

```css
.hero {
  background-image: url("assets/generated/hero-background.png");
  background-size: cover;
  background-position: center;
}
```

## Creating PNG Assets

Since PNG files require image editing software, use one of these methods:

### Option 1: GIMP (Free, Open Source)

```bash
sudo pacman -S gimp
# Open logo.svg in GIMP
# Export at desired resolution with transparency
```

### Option 2: Inkscape + ImageMagick

```bash
sudo pacman -S inkscape imagemagick
# Convert SVG to PNG at specific size
inkscape logo.svg --export-png=kael-icon-256.png --export-width=256 --export-height=256
```

### Option 3: AI Image Generation

Use tools like:

- DALL-E, Midjourney, Stable Diffusion
- Prompt: "Modern minimalist app icon, letter K, purple cyan gradient, AI theme, circuit pattern, transparent background"

### Option 4: Online Conversion

- CloudConvert.com
- Online-convert.com
- Upload SVG, export as PNG at various sizes

## File Structure

```
assets/generated/
├── README.md (this file)
├── preview.html (visual gallery)
│
├── SVG Icons (UI Elements)
├── logo.svg
├── loading-spinner.svg
├── success-icon.svg
├── error-icon.svg
├── info-icon.svg
├── chat-icon.svg
├── terminal-icon.svg
├── settings-icon.svg
├── ollama-icon.svg
└── cloud-icon.svg
│
└── PNG Icons (To Be Created)
    ├── kael-icon-16.png
    ├── kael-icon-32.png
    ├── kael-icon-64.png
    ├── kael-icon-128.png
    ├── kael-icon-256.png
    └── kael-icon-512.png
│
└── Backgrounds (To Be Created)
    ├── hero-background.png
    ├── sidebar-background.png
    └── terminal-background.png
```

## Integration with Tauri

Add icons to `src-tauri/tauri.conf.json`:

```json
{
  "tauri": {
    "bundle": {
      "icon": [
        "assets/generated/kael-icon-32.png",
        "assets/generated/kael-icon-128.png",
        "assets/generated/kael-icon-256.png",
        "assets/generated/kael-icon-512.png"
      ]
    }
  }
}
```

## License

Assets created for Kael-OS project. Match project license terms.

## Next Steps

1. ✅ SVG icons created and ready to use
2. ⚠️ Generate PNG icons using one of the methods above
3. ⚠️ Create background images (use GIMP, Photoshop, or AI generation)
4. 🔄 Update Tauri config with icon paths
5. 🔄 Import assets into React/Svelte components

---

**Created:** December 16, 2025  
**Version:** 1.0  
**Total SVG Assets:** 10  
**Total PNG Assets Needed:** 9
