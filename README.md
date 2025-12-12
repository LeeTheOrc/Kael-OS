# Kael-OS

A hybrid AI-native operating system forge built with Tauri, React, and Rust.

## Features

- **Tauri Frontend**: Modern React + TypeScript interface with Vite
- **Rust Backend**: High-performance backend with SQLite and async support
- **Kael-AI**: Your AI Guardian integrated throughout
- **Offline-First**: Local SQLite database with Firebase cloud sync
- **Modular UI**: Configurable panels (Top Menu, Left/Right Sidebars, Central Chat/Terminal)
- **No NPM**: Uses pnpm only to avoid dependency hell

## Quick Start

### Prerequisites
- Rust 1.70+
- Node.js 18+
- pnpm

### Installation

```bash
cd kael-os
pnpm install
cargo build --manifest-path src-tauri/Cargo.toml
```

### Development

```bash
pnpm dev
```

Or with Tauri directly:

```bash
cargo tauri dev
```

### Build

```bash
pnpm build
cargo tauri build
```

## Project Structure

- `src-tauri/`: Rust backend (Tauri + SQLite)
- `src/`: React frontend (TypeScript + Tailwind CSS)
- `sql/`: Database migrations
- `public/`: Static assets

## Architecture

### Frontend (React/TypeScript)
- Modular component-based UI
- Services layer for Firebase, LocalDB, Terminal, Kael-AI
- Tailwind CSS with dark forge theme
- Type-safe with TypeScript

### Backend (Rust/Tauri)
- IPC commands for frontend communication
- SQLite database with migration system
- Module-based architecture (db, terminal, kael, firebase, api)
- Async/await with Tokio

## Technologies

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Tauri 1.5, Rust, SQLite, Tokio
- **Database**: SQLite (local) + Firebase (cloud)
- **Styling**: Tailwind CSS

## License

MIT
