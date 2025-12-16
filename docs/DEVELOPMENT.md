# Kael-OS-AI Development Guide

Comprehensive guide for developers contributing to or extending Kael-OS-AI.

## Table of Contents

1. [Development Setup](#development-setup)
2. [Project Structure](#project-structure)
3. [Build System](#build-system)
4. [Coding Standards](#coding-standards)
5. [Testing](#testing)
6. [Debugging](#debugging)
7. [Adding New Features](#adding-new-features)
8. [Contribution Guidelines](#contribution-guidelines)
9. [Deployment](#deployment)
10. [Architecture Decisions](#architecture-decisions)

---

## Development Setup

### Required Tools

#### 1. Rust Toolchain

```bash
# Install rustup
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Set default toolchain
rustup default stable

# Verify installation
rustc --version
cargo --version
```

**Required Version**: Rust 1.70+ (2021 edition)

#### 2. System Dependencies

**Arch Linux**:

```bash
sudo pacman -S webkit2gtk gtk3 base-devel openssl libayatana-appindicator
```

**Ubuntu/Debian**:

```bash
sudo apt update
sudo apt install libwebkit2gtk-4.0-dev \
  build-essential \
  curl \
  wget \
  file \
  libssl-dev \
  libgtk-3-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev
```

**macOS**:

```bash
# Xcode Command Line Tools
xcode-select --install

# No additional dependencies needed
```

**Windows**:

- Microsoft Visual C++ Build Tools
- WebView2 Runtime (usually pre-installed on Windows 10/11)

#### 3. Optional Tools

**Ollama (for local AI testing)**:

```bash
curl -fsSL https://ollama.com/install.sh | sh
ollama pull llama3.2
```

**Firebase CLI** (for Firebase features):

```bash
npm install -g firebase-tools
firebase login
```

### IDE Recommendations

#### VS Code (Recommended)

**Extensions**:

- `rust-analyzer` - Rust language server
- `Even Better TOML` - TOML syntax
- `Tauri` - Tauri-specific features
- `Error Lens` - Inline error display
- `CodeLLDB` - Debugging

**Settings** (`.vscode/settings.json`):

```json
{
  "rust-analyzer.checkOnSave.command": "clippy",
  "rust-analyzer.cargo.features": "all",
  "editor.formatOnSave": true,
  "files.associations": {
    "*.rs": "rust"
  }
}
```

#### JetBrains RustRover

- Full Rust support out of the box
- Excellent debugging
- Code completion and refactoring

#### NeoVim/Vim

**Plugins**:

- `rust.vim` - Rust syntax
- `coc-rust-analyzer` - LSP integration
- `vim-cargo` - Cargo integration

### Repository Setup

```bash
# Clone repository
git clone https://github.com/yourusername/Kael-OS-AI
cd Kael-OS-AI

# Install git hooks (if any)
./scripts/install-hooks.sh  # If available

# Create .env.local for development
cp .env.example .env.local
# Edit .env.local with your API keys
```

### Development Build

```bash
# Navigate to Tauri source
cd src-tauri

# First build (downloads dependencies)
cargo build

# Run in development mode
cargo run

# With logging
RUST_LOG=debug cargo run
```

**First Build Time**: ~5-10 minutes (downloads and compiles all dependencies)  
**Subsequent Builds**: ~2-5 seconds (incremental compilation)

---

## Project Structure

### Directory Layout

```
Kael-OS-AI/
├── src-tauri/              # Rust backend (Tauri + Dioxus)
│   ├── Cargo.toml          # Rust dependencies
│   ├── build.rs            # Build script
│   ├── tauri.conf.json     # Tauri configuration
│   ├── src/                # Rust source code
│   │   ├── main.rs         # Entry point
│   │   ├── components/     # Dioxus UI components
│   │   ├── api/            # External API handlers
│   │   ├── auth.rs         # Authentication
│   │   ├── commands.rs     # Tauri IPC commands
│   │   ├── db/             # Database layer
│   │   ├── llm.rs          # LLM provider interface
│   │   ├── services/       # Business logic
│   │   ├── terminal/       # Terminal emulation
│   │   ├── webdav/         # WebDAV client
│   │   ├── firebase/       # Firebase integration
│   │   ├── crypto/         # Cryptography
│   │   └── ...
│   └── target/             # Build outputs (gitignored)
├── crates/                 # Internal workspace crates
│   └── terminal/           # PTY terminal emulation
├── docs/                   # Documentation
│   ├── ARCHITECTURE.md     # System architecture
│   ├── API_REFERENCE.md    # API documentation
│   ├── USER_GUIDE.md       # User documentation
│   ├── DEVELOPMENT.md      # This file
│   └── ...
├── scripts/                # Build and deployment scripts
│   ├── build-arch-installer.sh
│   ├── deploy-webdisk.sh
│   └── ...
├── assets/                 # Application assets
├── website/                # Marketing website
├── .env.example            # Example environment config
├── .gitignore              # Git ignore rules
└── README.md               # Project overview
```

### Module Organization

**Core Modules** (`src-tauri/src/`):

| Module        | Purpose                      | Key Files                                         |
| ------------- | ---------------------------- | ------------------------------------------------- |
| `main.rs`     | Application entry point      | Dioxus launcher                                   |
| `components/` | UI components                | `app.rs`, `chat.rs`, `terminal.rs`, `settings.rs` |
| `commands.rs` | Tauri IPC bridge             | All frontend-accessible commands                  |
| `auth.rs`     | Authentication & encryption  | User management, OAuth                            |
| `llm.rs`      | Multi-provider LLM interface | Ollama, Gemini, Mistral, etc.                     |
| `db/`         | Database layer               | SQLite operations, migrations                     |
| `terminal/`   | Terminal emulation           | PTY management, command execution                 |
| `services/`   | Business logic               | System context, Ollama manager, etc.              |
| `firebase/`   | Firebase integration         | Auth, Firestore, Storage                          |
| `webdav/`     | WebDAV client                | File upload/download                              |
| `crypto/`     | Cryptography                 | AES, PBKDF2, certificates                         |

**Component Structure**:

```
components/
├── mod.rs              # Module exports
├── app.rs              # Root application component
├── header.rs           # Header with branding
├── chat.rs             # Chat interface
├── terminal.rs         # Terminal panel
├── settings.rs         # Settings panel
├── brainstorm.rs       # Brainstorm feature
├── app_tracker.rs      # Project management
├── api_key_manager.rs  # API key UI
└── icons.rs            # Icon components
```

---

## Build System

### Cargo Workspace

**Root Cargo.toml** (workspace):

```toml
[workspace]
members = [
    "src-tauri",
    "crates/terminal",
    "crates/services",
]
```

**Dependencies** (`src-tauri/Cargo.toml`):

```toml
[dependencies]
# Core
tauri = { version = "2.1", features = [] }
dioxus = "0.5"
dioxus-desktop = "0.5"
tokio = { version = "1", features = ["full"] }

# Database
rusqlite = { version = "0.31", features = ["bundled", "chrono"] }

# Serialization
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

# Networking
reqwest = { version = "0.11", features = ["json"] }

# Cryptography
aes-gcm = "0.10"
pbkdf2 = "0.12"
sha2 = "0.10"
rand = "0.8"

# Internal
kael-terminal = { path = "../crates/terminal" }
```

### Build Profiles

#### Development Profile

```toml
[profile.dev]
opt-level = 0      # No optimization
debug = true       # Full debug symbols
```

**Usage**: `cargo build`  
**Build Time**: ~2-5 seconds (incremental)  
**Binary Size**: ~300 MB  
**Use Case**: Active development, debugging

---

#### Release Profile

```toml
[profile.release]
opt-level = 3      # Maximum optimization
lto = true         # Link-time optimization
codegen-units = 1  # Single codegen unit
strip = true       # Strip debug symbols
panic = "abort"    # Abort on panic (smaller binary)
```

**Usage**: `cargo build --release`  
**Build Time**: ~1-2 minutes (clean build)  
**Binary Size**: ~19 MB  
**Use Case**: Production deployment

---

#### Minimal Release Profile

```toml
[profile.release-minimal]
inherits = "release"
opt-level = "z"    # Optimize for size
lto = "fat"        # Aggressive LTO
```

**Usage**: `cargo build --profile release-minimal`  
**Binary Size**: ~15-17 MB  
**Use Case**: Absolute smallest binary (slight performance trade-off)

---

### Build Commands

```bash
# Development build (fast iteration)
cargo build

# Run directly (builds if needed)
cargo run

# Release build (optimized)
cargo build --release

# Minimal build (smallest binary)
cargo build --profile release-minimal

# Build with features
cargo build --features "feature1,feature2"

# Check for errors (no binary output)
cargo check

# Build all workspace crates
cargo build --workspace

# Clean build artifacts
cargo clean
```

### Compilation Optimization

**Faster Development Builds**:

Create `.cargo/config.toml`:

```toml
[build]
# Use all CPU cores
jobs = 8

# Use faster linker (Linux)
[target.x86_64-unknown-linux-gnu]
linker = "clang"
rustflags = ["-C", "link-arg=-fuse-ld=mold"]

# macOS
[target.x86_64-apple-darwin]
rustflags = ["-C", "link-arg=-fuse-ld=zld"]
```

**Install faster linkers**:

```bash
# Linux (mold)
sudo pacman -S mold      # Arch
sudo apt install mold    # Ubuntu

# macOS (zld)
brew install michaeleisel/zld/zld
```

**Result**: 30-50% faster incremental builds

---

## Coding Standards

### Rust Style Guide

Follow the official [Rust Style Guide](https://doc.rust-lang.org/1.0.0/style/README.html).

**Key Points**:

- Use `rustfmt` for automatic formatting
- Use `clippy` for linting
- Follow naming conventions
- Document public APIs

### Naming Conventions

**Modules and Files**:

```rust
// Snake case for modules and files
mod system_context;
mod api_key_manager;
```

**Types**:

```rust
// PascalCase for types
struct UserProfile { }
enum LLMProvider { }
trait DatabaseOperations { }
```

**Functions and Variables**:

```rust
// Snake case
fn get_chat_history() { }
let api_key = "...";
```

**Constants**:

```rust
// SCREAMING_SNAKE_CASE
const MAX_RETRIES: u32 = 3;
const DEFAULT_TIMEOUT: Duration = Duration::from_secs(30);
```

### Code Organization

**Import Ordering**:

```rust
// 1. Standard library
use std::collections::HashMap;
use std::path::PathBuf;

// 2. External crates
use serde::{Deserialize, Serialize};
use tokio::sync::Mutex;

// 3. Internal crates
use kael_terminal::PtyTerminal;

// 4. Local modules
use crate::auth::User;
use crate::db::Connection;
```

**Module Structure**:

```rust
// mod.rs or module file
#![allow(clippy::too_many_arguments)]  // Module-level attributes

// Public types
pub struct MyService { }

// Public API
impl MyService {
    pub fn new() -> Self { }
    pub fn do_something(&self) { }
}

// Private helpers
fn internal_helper() { }

// Tests
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_something() { }
}
```

### Error Handling Patterns

**Return Result<T, E>**:

```rust
pub fn risky_operation() -> Result<String, String> {
    let data = std::fs::read_to_string("file.txt")
        .map_err(|e| format!("Failed to read file: {}", e))?;
    Ok(data)
}
```

**Use thiserror for Custom Errors**:

```rust
use thiserror::Error;

#[derive(Error, Debug)]
pub enum KaelError {
    #[error("Database error: {0}")]
    Database(#[from] rusqlite::Error),

    #[error("Network error: {0}")]
    Network(#[from] reqwest::Error),

    #[error("Invalid API key")]
    InvalidApiKey,
}
```

**Log Errors Before Returning**:

```rust
fn process_request() -> Result<Response, String> {
    match do_something() {
        Ok(result) => Ok(result),
        Err(e) => {
            log::error!("Request failed: {}", e);
            Err(format!("Processing failed: {}", e))
        }
    }
}
```

### Async/Await Best Practices

**Use async for I/O**:

```rust
pub async fn fetch_data(url: &str) -> Result<String, reqwest::Error> {
    let response = reqwest::get(url).await?;
    let text = response.text().await?;
    Ok(text)
}
```

**Spawn background tasks**:

```rust
use tokio::spawn;

spawn(async move {
    // Background work
    let result = long_running_task().await;
    log::info!("Background task completed: {:?}", result);
});
```

**Use spawn_blocking for CPU-intensive work**:

```rust
use tokio::task::spawn_blocking;

let result = spawn_blocking(|| {
    // CPU-intensive work (not async)
    compute_something_expensive()
}).await?;
```

### Documentation Standards

**Document public APIs**:

````rust
/// Sends a request to an LLM provider.
///
/// # Arguments
///
/// * `request` - The LLM request containing provider, model, and prompt
/// * `user` - Optional user for API key retrieval
///
/// # Returns
///
/// Returns `Ok(LLMResponse)` on success, or `Err(String)` with error message.
///
/// # Examples
///
/// ```
/// let request = LLMRequest {
///     provider: LLMProvider::Ollama,
///     model: "llama3.2".to_string(),
///     prompt: "Hello".to_string(),
///     api_key: None,
///     system: None,
/// };
///
/// let response = send_request_single(request, None).await?;
/// println!("Response: {}", response.content);
/// ```
pub async fn send_request_single(
    request: LLMRequest,
    user: Option<&User>,
) -> Result<LLMResponse, String> {
    // Implementation
}
````

### Linting

**Run Clippy**:

```bash
cargo clippy --all-targets --all-features
```

**Fix automatically**:

```bash
cargo clippy --fix --all-targets --all-features
```

**Common Clippy Warnings to Fix**:

- `unused_imports`
- `unused_variables`
- `dead_code`
- `needless_return`
- `redundant_closure`

**Allow Specific Warnings** (when justified):

```rust
#[allow(clippy::too_many_arguments)]
fn complex_function(a: u32, b: u32, c: u32, d: u32, e: u32, f: u32) {
    // Sometimes necessary
}
```

---

## Testing

### Unit Tests

**Location**: Same file as code, in `tests` module

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encrypt_decrypt() {
        let user = User {
            uid: "123".to_string(),
            email: "test@example.com".to_string(),
            name: "Test".to_string(),
            photo_url: None,
            id_token: "test-token".to_string(),
            refresh_token: None,
            expires_in: None,
        };

        let secret = "my-secret-key";
        let encrypted = encrypt_secret(&user, secret);
        let decrypted = decrypt_secret(&user, &encrypted).unwrap();

        assert_eq!(secret, decrypted);
    }
}
```

**Async Tests**:

```rust
#[tokio::test]
async fn test_ollama_ping() {
    let is_running = ping_local().await;
    assert!(is_running, "Ollama should be running for tests");
}
```

### Integration Tests

**Location**: `src-tauri/tests/`

```rust
// tests/integration_test.rs
use kael_os::llm::{LLMRequest, LLMProvider, send_request_single};

#[tokio::test]
async fn test_llm_request_ollama() {
    let request = LLMRequest {
        provider: LLMProvider::Ollama,
        model: "llama3.2".to_string(),
        prompt: "Say 'test'".to_string(),
        api_key: None,
        system: None,
    };

    let response = send_request_single(request, None).await;
    assert!(response.is_ok());
}
```

### Running Tests

```bash
# All tests
cargo test

# Specific test
cargo test test_encrypt_decrypt

# Test with output
cargo test -- --nocapture

# Test specific module
cargo test llm::tests

# Integration tests only
cargo test --test integration_test

# With logging
RUST_LOG=debug cargo test -- --nocapture
```

### Test Coverage

**Install tarpaulin**:

```bash
cargo install cargo-tarpaulin
```

**Generate coverage report**:

```bash
cargo tarpaulin --out Html --output-dir coverage
```

---

## Debugging

### Logging

**Enable logging**:

```bash
RUST_LOG=debug cargo run
```

**Log Levels**:

- `error`: Critical errors
- `warn`: Warnings
- `info`: General information
- `debug`: Detailed debug info
- `trace`: Very verbose

**In Code**:

```rust
log::error!("Critical error: {}", error);
log::warn!("Warning: API key not found");
log::info!("User logged in: {}", user.email);
log::debug!("Request details: {:?}", request);
log::trace!("Low-level detail");
```

### VS Code Debugging

**launch.json**:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "lldb",
      "request": "launch",
      "name": "Debug Kael-OS",
      "cargo": {
        "args": ["build", "--bin=kael-os", "--package=kael-os"],
        "filter": {
          "name": "kael-os",
          "kind": "bin"
        }
      },
      "args": [],
      "cwd": "${workspaceFolder}/src-tauri",
      "env": {
        "RUST_LOG": "debug"
      }
    }
  ]
}
```

**Breakpoints**:

1. Click left margin in VS Code
2. Red dot appears
3. Run debugger (F5)
4. Execution pauses at breakpoint

### Command-Line Debugging

**GDB** (Linux):

```bash
cargo build
gdb ./target/debug/kael-os
(gdb) run
(gdb) backtrace
```

**LLDB** (macOS):

```bash
cargo build
lldb ./target/debug/kael-os
(lldb) run
(lldb) bt
```

### Common Debug Scenarios

**Crash on startup**:

```bash
RUST_BACKTRACE=1 cargo run
```

**Memory leak**:

```bash
valgrind --leak-check=full ./target/debug/kael-os
```

**Performance profiling**:

```bash
cargo install cargo-flamegraph
cargo flamegraph
```

---

## Adding New Features

### Adding a New UI Component

**1. Create Component File**:

```rust
// src-tauri/src/components/my_feature.rs

use dioxus::prelude::*;

#[component]
pub fn MyFeature() -> Element {
    let mut state = use_signal(|| "Initial value".to_string());

    rsx! {
        div {
            class: "my-feature",
            h2 { "My Feature" }
            input {
                value: "{state}",
                oninput: move |evt| state.set(evt.value().clone())
            }
        }
    }
}
```

**2. Export in mod.rs**:

```rust
// src-tauri/src/components/mod.rs
pub mod my_feature;
pub use my_feature::MyFeature;
```

**3. Use in App**:

```rust
// src-tauri/src/components/app.rs
use crate::components::MyFeature;

rsx! {
    MyFeature { }
}
```

### Adding a New Tauri Command

**1. Define Command**:

```rust
// src-tauri/src/commands.rs

#[tauri::command]
pub async fn my_new_command(input: String) -> Result<String, String> {
    log::info!("Command called with: {}", input);

    // Do something
    let result = process_input(&input)
        .map_err(|e| format!("Processing failed: {}", e))?;

    Ok(result)
}
```

**2. Register Command** (if needed):

```rust
// src-tauri/src/main.rs
// Commands are auto-discovered by Tauri
```

**3. Call from Frontend**:

```rust
// In component
let result = use_resource(move || async move {
    // Call Tauri command
    invoke("my_new_command", "test".to_string()).await
});
```

### Adding a New LLM Provider

**1. Add Provider to Enum**:

```rust
// src-tauri/src/llm.rs

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum LLMProvider {
    Ollama,
    Gemini,
    Mistral,
    MyNewProvider,  // Add here
}
```

**2. Implement Request Logic**:

```rust
async fn send_to_my_provider(request: &LLMRequest) -> Result<LLMResponse, String> {
    let client = Client::new();

    let response = client
        .post("https://api.myprovider.com/v1/completions")
        .header("Authorization", format!("Bearer {}", request.api_key.as_ref().unwrap()))
        .json(&serde_json::json!({
            "model": request.model,
            "prompt": request.prompt,
        }))
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    let json: serde_json::Value = response.json().await
        .map_err(|e| format!("Parse failed: {}", e))?;

    Ok(LLMResponse {
        provider: LLMProvider::MyNewProvider,
        content: json["completion"].as_str().unwrap().to_string(),
    })
}
```

**3. Add to match statement**:

```rust
match request.provider {
    LLMProvider::Ollama => send_to_ollama(request).await,
    LLMProvider::Gemini => send_to_gemini(request).await,
    LLMProvider::MyNewProvider => send_to_my_provider(request).await,
    // ...
}
```

**4. Add Default Model**:

```rust
fn default_model_for(provider: &LLMProvider) -> String {
    match provider {
        LLMProvider::MyNewProvider => {
            std::env::var("MY_PROVIDER_MODEL")
                .unwrap_or_else(|_| "default-model".to_string())
        }
        // ...
    }
}
```

### Extending the Database Schema

**1. Create Migration**:

```rust
// src-tauri/src/db/migrations.rs

pub fn run_migrations(conn: &Connection) -> SqlResult<()> {
    // Existing migrations...

    // New migration
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS my_new_table (
            id TEXT PRIMARY KEY,
            data TEXT NOT NULL,
            created_at TEXT NOT NULL
        );"
    )?;

    Ok(())
}
```

**2. Add Functions**:

```rust
// src-tauri/src/db/mod.rs

pub fn add_my_data(conn: &Connection, data: &str) -> SqlResult<String> {
    let id = uuid::Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();

    conn.execute(
        "INSERT INTO my_new_table (id, data, created_at) VALUES (?1, ?2, ?3)",
        params![&id, data, &now],
    )?;

    Ok(id)
}

pub fn get_my_data(conn: &Connection) -> SqlResult<Vec<MyData>> {
    let mut stmt = conn.prepare("SELECT * FROM my_new_table")?;

    let items = stmt.query_map([], |row| {
        Ok(MyData {
            id: row.get(0)?,
            data: row.get(1)?,
            created_at: row.get(2)?,
        })
    })?;

    items.collect()
}
```

---

## Contribution Guidelines

### Git Workflow

**1. Fork and Clone**:

```bash
# Fork on GitHub, then:
git clone https://github.com/YOUR-USERNAME/Kael-OS-AI
cd Kael-OS-AI
git remote add upstream https://github.com/original/Kael-OS-AI
```

**2. Create Feature Branch**:

```bash
git checkout -b feature/my-new-feature
# or
git checkout -b fix/bug-description
```

**3. Make Changes**:

```bash
# Edit code
# Run tests
cargo test

# Format code
cargo fmt

# Check for issues
cargo clippy
```

**4. Commit**:

```bash
git add .
git commit -m "feat: Add new feature X

- Implemented Y
- Added tests for Z
- Updated documentation"
```

**Commit Message Format**:

```
type: Short description (50 chars max)

Longer explanation if needed (wrap at 72 chars)
- Bullet points for details
- Reference issues: #123

Types: feat, fix, docs, style, refactor, test, chore
```

**5. Push and PR**:

```bash
git push origin feature/my-new-feature
# Create Pull Request on GitHub
```

### Pull Request Process

**PR Template**:

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist

- [ ] Code follows project style
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings
```

### Code Review Expectations

**Reviewers Look For**:

- Code correctness
- Test coverage
- Documentation
- Performance implications
- Security considerations
- Breaking changes

**Response Time**:

- Initial review: 2-3 days
- Follow-up: 1-2 days

---

## Deployment

### Building Release Binary

```bash
cd src-tauri
cargo build --release

# Binary location
ls -lh target/release/kael-os
```

### Cross-Platform Build

**Using GitHub Actions**:

`.github/workflows/build.yml`:

```yaml
name: Build

on: [push, pull_request]

jobs:
  build:
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]

    runs-on: ${{ matrix.os }}

    steps:
      - uses: actions/checkout@v3
      - uses: actions-rs/toolchain@v1
        with:
          toolchain: stable

      - name: Install dependencies (Linux)
        if: runner.os == 'Linux'
        run: |
          sudo apt update
          sudo apt install libwebkit2gtk-4.0-dev libgtk-3-dev

      - name: Build
        run: |
          cd src-tauri
          cargo build --release

      - name: Upload artifact
        uses: actions/upload-artifact@v3
        with:
          name: kael-os-${{ matrix.os }}
          path: src-tauri/target/release/kael-os*
```

### Packaging for Distribution

**Arch Linux (PKGBUILD)**:
See `PKGBUILD` in repository root.

**AppImage (Linux)**:

```bash
cargo install cargo-appimage
cargo appimage
```

**macOS Bundle**:

```bash
# Tauri handles this
cargo tauri build
# Creates .app and .dmg in src-tauri/target/release/bundle/
```

**Windows Installer**:

```bash
cargo tauri build
# Creates .msi in src-tauri/target/release/bundle/
```

---

## Architecture Decisions

### Why Dioxus over React/Vue?

**Advantages**:

- Pure Rust (type safety, performance)
- No JavaScript toolchain
- Native desktop integration
- Smaller binary size
- Better security

**Trade-offs**:

- Smaller ecosystem than React
- Learning curve for web developers
- Fewer third-party components

### Why Tauri over Electron?

**Advantages**:

- 10x smaller binary size (19 MB vs 200+ MB)
- Lower memory usage (50 MB vs 200+ MB)
- Better security (no Node.js)
- Faster startup time
- Native performance

**Trade-offs**:

- WebView dependencies (platform-specific)
- Less mature ecosystem
- Fewer plugins

### Why SQLite over PostgreSQL?

**Advantages**:

- Zero configuration
- Single file database
- Bundled (no external dependency)
- Excellent for desktop apps
- Fast for local operations

**Trade-offs**:

- No built-in replication
- Single-user by design
- (Perfect for our use case)

### Offline-First Design Rationale

**Why**:

- Privacy: Data stays local by default
- Performance: No network latency
- Reliability: Works without internet
- Control: User owns their data

**Implementation**:

- SQLite for local storage
- Optional Firebase sync
- Graceful degradation
- Conflict resolution (last-write-wins)

---

**Document Version**: 1.0  
**Last Updated**: December 16, 2025  
**Project**: Kael-OS-AI v1.0.0
