# Kael-OS PNG Assets

Production-ready raster images for the Kael-OS application.

## 📁 Directory Structure

```
png/
├── app-icons/          # Application icons (various sizes)
├── backgrounds/        # Background images for different UI areas
├── ui-elements/        # Small UI components
└── README.md          # This file
```

## 🎨 Theme Colors

All assets use the Kael-OS color palette:

- **Primary Purple**: `#e040fb` (224, 64, 251)
- **Accent Cyan**: `#7aebbe` (122, 235, 190)
- **Warning Yellow**: `#ffcc00` (255, 204, 0)
- **Dark Background**: `#120e1a` (18, 14, 26)

## 📱 App Icons

Located in `app-icons/`

### Available Sizes

| File           | Size      | Purpose                 |
| -------------- | --------- | ----------------------- |
| `icon-16.png`  | 16×16px   | System tray, favicon    |
| `icon-32.png`  | 32×32px   | Taskbar (Windows)       |
| `icon-48.png`  | 48×48px   | Alt+Tab switcher        |
| `icon-64.png`  | 64×64px   | Desktop shortcuts       |
| `icon-128.png` | 128×128px | Mac Dock, app lists     |
| `icon-256.png` | 256×256px | High DPI displays       |
| `icon-512.png` | 512×512px | Retina displays, stores |

### Design Features

- Rounded square shape with dark background
- Purple to light-purple vertical gradient
- Cyan "K" letter logo
- Transparent background (RGBA)
- Optimized file sizes

### Usage Example (Tauri)

```json
// tauri.conf.json
{
  "tauri": {
    "bundle": {
      "icon": [
        "assets/generated/png/app-icons/icon-32.png",
        "assets/generated/png/app-icons/icon-128.png",
        "assets/generated/png/app-icons/icon-256.png",
        "assets/generated/png/app-icons/icon-512.png"
      ]
    }
  }
}
```

### Usage Example (HTML)

```html
<link
  rel="icon"
  type="image/png"
  sizes="16x16"
  href="/assets/generated/png/app-icons/icon-16.png"
/>
<link
  rel="icon"
  type="image/png"
  sizes="32x32"
  href="/assets/generated/png/app-icons/icon-32.png"
/>
<link
  rel="icon"
  type="image/png"
  sizes="512x512"
  href="/assets/generated/png/app-icons/icon-512.png"
/>
```

## 🖼️ Background Images

Located in `backgrounds/`

### hero-background.png

- **Size**: 1920×1080px (Full HD)
- **Purpose**: Main landing/splash screen
- **Features**:
  - Radial gradient from dark purple to dark background
  - Subtle circuit-like diagonal lines
  - Low opacity purple overlay
- **File Size**: ~172 KB

**Usage (CSS)**:

```css
.hero-section {
  background-image: url("/assets/generated/png/backgrounds/hero-background.png");
  background-size: cover;
  background-position: center;
}
```

### sidebar-background.png

- **Size**: 400×1080px (Vertical strip)
- **Purpose**: Sidebar gradient overlay
- **Features**:
  - Vertical gradient (dark purple → background)
  - Cyan glow on left edge
  - Optimized for vertical UI
- **File Size**: ~5 KB

**Usage (CSS)**:

```css
.sidebar {
  background-image: url("/assets/generated/png/backgrounds/sidebar-background.png");
  background-repeat: repeat-y;
  background-size: contain;
}
```

### terminal-background.png

- **Size**: 1920×1080px (Full HD)
- **Purpose**: Terminal/code editor background
- **Features**:
  - Dark background with subtle grid pattern
  - Random accent dots (cyan/purple)
  - Tech/matrix aesthetic
- **File Size**: ~11 KB

**Usage (CSS)**:

```css
.terminal-window {
  background-image: url("/assets/generated/png/backgrounds/terminal-background.png");
  background-size: cover;
  opacity: 0.3; /* Use as subtle overlay */
}
```

### chat-background.png

- **Size**: 1920×1080px (Full HD)
- **Purpose**: Chat area background
- **Features**:
  - Soft vertical gradient
  - Very subtle purple tint at bottom
  - Non-distracting for reading
- **File Size**: ~8 KB

**Usage (CSS)**:

```css
.chat-container {
  background-image: url("/assets/generated/png/backgrounds/chat-background.png");
  background-size: cover;
}
```

## 🎯 UI Elements

Located in `ui-elements/`

### avatar-placeholder.png

- **Size**: 100×100px
- **Purpose**: Default user avatar when no image is set
- **Features**:
  - Circular shape with dark purple background
  - Simple cyan user icon silhouette
  - Transparent background
- **File Size**: ~742 bytes

**Usage (React)**:

```jsx
<img
  src={
    user.avatar || "/assets/generated/png/ui-elements/avatar-placeholder.png"
  }
  alt="User avatar"
  className="w-12 h-12 rounded-full"
/>
```

### notification-badge.png

- **Size**: 32×32px
- **Purpose**: Notification indicator badge
- **Features**:
  - Red circle with white border
  - Attention-grabbing color
  - Transparent background
- **File Size**: ~288 bytes

**Usage (HTML)**:

```html
<div class="relative">
  <button>Messages</button>
  <img
    src="/assets/generated/png/ui-elements/notification-badge.png"
    class="absolute top-0 right-0 w-4 h-4"
    alt="New notification"
  />
</div>
```

### status-online.png

- **Size**: 16×16px
- **Purpose**: Online status indicator
- **Features**:
  - Green dot with subtle highlight
  - Small and unobtrusive
  - Transparent background
- **File Size**: ~162 bytes

**Usage (CSS)**:

```css
.user-status.online::before {
  content: url("/assets/generated/png/ui-elements/status-online.png");
  width: 8px;
  height: 8px;
}
```

### status-offline.png

- **Size**: 16×16px
- **Purpose**: Offline status indicator
- **Features**:
  - Gray dot with subtle highlight
  - Small and unobtrusive
  - Transparent background
- **File Size**: ~158 bytes

**Usage (React)**:

```jsx
const StatusIndicator = ({ isOnline }) => (
  <img
    src={`/assets/generated/png/ui-elements/status-${
      isOnline ? "online" : "offline"
    }.png`}
    alt={isOnline ? "Online" : "Offline"}
    className="w-3 h-3"
  />
);
```

## 🔧 Integration Examples

### Tauri App Configuration

```json
{
  "tauri": {
    "bundle": {
      "icon": [
        "assets/generated/png/app-icons/icon-32.png",
        "assets/generated/png/app-icons/icon-128.png",
        "assets/generated/png/app-icons/icon-256.png"
      ],
      "resources": ["assets/generated/png/**/*"]
    }
  }
}
```

### React Component Example

```jsx
import React from "react";

export const KaelOSLayout = () => {
  return (
    <div
      className="app-container"
      style={{
        backgroundImage:
          "url('/assets/generated/png/backgrounds/hero-background.png')",
        backgroundSize: "cover",
      }}
    >
      <aside
        className="sidebar"
        style={{
          backgroundImage:
            "url('/assets/generated/png/backgrounds/sidebar-background.png')",
        }}
      >
        {/* Sidebar content */}
      </aside>

      <main className="content">
        <div
          className="terminal"
          style={{
            backgroundImage:
              "url('/assets/generated/png/backgrounds/terminal-background.png')",
          }}
        >
          {/* Terminal content */}
        </div>

        <div
          className="chat"
          style={{
            backgroundImage:
              "url('/assets/generated/png/backgrounds/chat-background.png')",
          }}
        >
          {/* Chat content */}
        </div>
      </main>
    </div>
  );
};
```

### CSS Variables Approach

```css
:root {
  --icon-16: url("/assets/generated/png/app-icons/icon-16.png");
  --icon-32: url("/assets/generated/png/app-icons/icon-32.png");
  --bg-hero: url("/assets/generated/png/backgrounds/hero-background.png");
  --bg-sidebar: url("/assets/generated/png/backgrounds/sidebar-background.png");
  --bg-terminal: url("/assets/generated/png/backgrounds/terminal-background.png");
  --bg-chat: url("/assets/generated/png/backgrounds/chat-background.png");
  --avatar-placeholder: url("/assets/generated/png/ui-elements/avatar-placeholder.png");
  --status-online: url("/assets/generated/png/ui-elements/status-online.png");
  --status-offline: url("/assets/generated/png/ui-elements/status-offline.png");
}

.hero {
  background-image: var(--bg-hero);
}
.sidebar {
  background-image: var(--bg-sidebar);
}
.terminal {
  background-image: var(--bg-terminal);
}
.chat {
  background-image: var(--bg-chat);
}
```

## 📊 File Statistics

| Category    | Files  | Total Size  |
| ----------- | ------ | ----------- |
| App Icons   | 7      | ~8.7 KB     |
| Backgrounds | 4      | ~196 KB     |
| UI Elements | 4      | ~1.4 KB     |
| **Total**   | **15** | **~206 KB** |

## 🎨 Regeneration

To regenerate all assets with updated parameters:

```bash
cd /home/leetheorc/Kael-os/Kael-OS-AI/assets/generated
python3 generate_pngs.py
```

The script uses Python PIL/Pillow to create all images programmatically. Modify the script to adjust:

- Colors and gradients
- Sizes and dimensions
- Visual effects and patterns
- Icon designs

## 📝 Notes

- All images use PNG format for broad compatibility
- Transparency (alpha channel) is preserved where applicable
- Files are optimized for web delivery (using `optimize=True`)
- Icons maintain consistent visual style with rounded corners
- Backgrounds are designed to be subtle and non-distracting
- All assets follow the Kael-OS design system

## 🔗 Related Files

- `/assets/generated/preview.html` - Visual preview of all assets
- `/assets/generated/generate_pngs.py` - Generation script
- `/src-tauri/icons/` - Additional icon formats (ICO, ICNS)

---

**Generated**: December 16, 2025  
**Version**: 1.0  
**Kael-OS Project** | AI-Powered Operating System Assistant
