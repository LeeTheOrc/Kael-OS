# Kael-OS Setup Guide

Welcome to the Kael-OS Forge, Architect! This guide will help you get everything running.

## ⚙️ Prerequisites

### System Requirements
- **Rust**: 1.70+ (https://rustup.rs/)
- **Node.js**: 18+ (for pnpm)
- **pnpm**: 8+ (install with: `npm install -g pnpm`)

### On Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install -y libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev
```

### On Fedora
```bash
sudo dnf install openssl-devel gtk3-devel appindicator-gtk3-devel librsvg2-devel
```

### On Arch
```bash
sudo pacman -S openssl gtk3 libappindicator-gtk3 librsvg
```

### On macOS
```bash
brew install openssl
```

## 🚀 Quick Start

### 1. Navigate to Project
```bash
cd /home/leetheorc/Kael-os/kael-os
```

### 2. Install Frontend Dependencies
```bash
pnpm install
```

### 3. Development Mode
```bash
cargo tauri dev
```

This will:
- Start Vite dev server (http://localhost:5173)
- Start Tauri dev window
- Hot reload enabled for React code

### 4. Build for Production
```bash
pnpm build
cargo tauri build
```

Built executables will be in `src-tauri/target/release/bundle/`

## 📁 Project Structure

```
kael-os/
├── src-tauri/              # Rust backend
│   ├── src/
│   │   ├── main.rs         # Entry point
│   │   ├── commands.rs     # IPC commands
│   │   ├── state.rs        # Type definitions
│   │   ├── db/             # Database module
│   │   ├── terminal/       # Terminal module
│   │   ├── kael/           # Kael-AI module
│   │   └── firebase/       # Firebase module
│   ├── Cargo.toml
│   └── tauri.conf.json
├── src/                    # React frontend
│   ├── components/         # React components
│   ├── services/           # Service layer
│   ├── hooks/              # Custom React hooks
│   ├── stores/             # State management
│   ├── types/              # TypeScript types
│   ├── App.tsx
│   └── main.tsx
├── public/                 # Static assets
├── sql/                    # Database migrations
├── package.json            # Frontend dependencies
└── tailwind.config.js      # Styling config
```

## 🔧 Key Features

### Frontend Components
- **TopMenu**: Navigation bar with panel toggles
- **LeftPanel**: Project explorer and script library
- **RightPanel**: Kael-AI configuration and settings
- **CentralArea**: Chat interface with Kael
- **ErrorBoundary**: Graceful error handling

### Backend Modules
- **db**: SQLite database with migrations
- **commands**: IPC handlers for frontend
- **state**: Type definitions (ChatMessage, KaelConfig, etc.)
- **terminal**: Terminal emulation (stub)
- **kael**: AI Guardian logic (stub)
- **firebase**: Cloud sync (stub)

### Services
- **kaelService**: Chat and config management
- **firebaseService**: Cloud synchronization
- **localdbService**: Local database access
- **terminalService**: Command execution

### Styling
- Tailwind CSS with custom dark forge theme
- Colors: `forge-bg` (#120e1a), `dragon-fire` (#ffcc00), etc.
- Responsive design with flexbox

## 📡 IPC Commands

Frontend can invoke these Rust commands:

```typescript
await invoke('send_message', { message: 'Hello Kael!' })
await invoke('get_chat_history')
await invoke('execute_script', { script: '...' })
await invoke('get_kael_config')
await invoke('save_kael_config', { config: {...} })
```

## 🗄️ Database

SQLite database located at (platform-specific):
- **Linux**: `~/.config/kael-os/kael.db`
- **macOS**: `~/Library/Application Support/kael-os/kael.db`
- **Windows**: `%APPDATA%\kael-os\kael.db`

Tables:
- `chat_messages`: id, role, text, timestamp, synced
- `scripts`: id, name, content, created_at, updated_at
- `kael_config`: key, value pairs

## 🔐 Firebase Integration

Firebase stubs are in place. To enable:

1. Create Firebase project at https://firebase.google.com
2. Create a `.env` file in the project root:
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_DB_URL=your_db_url
```

3. Implement Firebase calls in `src/services/firebase/index.ts`

## 🐛 Troubleshooting

### Build Fails with WebKit Errors
Ensure you have all system dependencies installed (see Prerequisites section)

### Vite Dev Server Not Starting
- Clear `node_modules` and `pnpm-lock.yaml`
- Run `pnpm install` again

### Database Permission Errors
- Check directory permissions
- Ensure database directory exists

### IPC Command Not Found
- Verify command is registered in `src-tauri/src/main.rs`
- Check command name matches frontend invoke call

## 📚 Development Tips

### Hot Reload
- React code changes auto-reload via Vite HMR
- Rust changes require recompiling

### Debugging
- Frontend: Browser DevTools (F12)
- Backend: Check Tauri logs in console

### Adding New Commands
1. Create function in `src-tauri/src/commands.rs`
2. Add to `generate_handler!` in `main.rs`
3. Call from frontend with `invoke()`

### Adding New Dependencies
- **Frontend**: `pnpm add package-name`
- **Backend**: Update `src-tauri/Cargo.toml`

## 🚢 Deployment

### Creating Release
```bash
cargo tauri build --release
```

### Distribution
Built binaries are in:
- Linux: `src-tauri/target/release/bundle/deb/`
- macOS: `src-tauri/target/release/bundle/dmg/`
- Windows: `src-tauri/target/release/bundle/msi/`

## 📖 Further Reading

- [Tauri Docs](https://tauri.app/docs/)
- [React Docs](https://react.dev/)
- [Rust Book](https://doc.rust-lang.org/book/)
- [SQLite Docs](https://www.sqlite.org/docs.html)

## 🎯 Next Steps

1. ✅ Set up local development environment
2. ⬜ Integrate Firebase authentication
3. ⬜ Implement terminal emulation
4. ⬜ Connect to Kael-AI (Gemini API)
5. ⬜ Build VM integration
6. ⬜ Create differential updater

---

**Welcome to the Forge, Architect!** The foundation is set. Now let's build something legendary! 🔥
