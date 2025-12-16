# Kael-OS-AI API Reference

This document provides comprehensive API documentation for all public modules and functions in Kael-OS-AI.

## Table of Contents

1. [LLM Module](#llm-module)
2. [Auth Module](#auth-module)
3. [Terminal Module](#terminal-module)
4. [Database Module](#database-module)
5. [WebDAV Module](#webdav-module)
6. [Commands Module](#commands-module)
7. [Services Module](#services-module)
8. [Crypto Module](#crypto-module)

---

## LLM Module

**Location**: `src-tauri/src/llm.rs`

Provides unified interface for interacting with multiple LLM providers (local and cloud).

### Types

#### `LLMProvider`

```rust
pub enum LLMProvider {
    Ollama,        // Local Ollama service
    Mistral,       // Mistral AI
    Gemini,        // Google Gemini
    Copilot,       // GitHub Copilot
    CopilotAgent,  // GitHub Copilot CLI
    Office365AI,   // Microsoft Office 365 AI
    GoogleOneAI,   // Google One AI
    Minstrel,      // Minstrel AI
}
```

**Serialization**: Implements `Serialize`, `Deserialize`, `Debug`, `Clone`, `PartialEq`

#### `LLMRequest`

```rust
pub struct LLMRequest {
    pub provider: LLMProvider,
    pub model: String,
    pub prompt: String,
    pub api_key: Option<String>,
    pub system: Option<String>,
}
```

**Fields**:

- `provider`: Which LLM provider to use
- `model`: Model name (e.g., "llama3.2", "gemini-pro")
- `prompt`: User's prompt/question
- `api_key`: Optional API key (required for cloud providers)
- `system`: Optional system prompt to guide AI behavior

#### `LLMResponse`

```rust
pub struct LLMResponse {
    pub provider: LLMProvider,
    pub content: String,
}
```

**Fields**:

- `provider`: Provider that generated the response
- `content`: AI-generated text response

### Functions

#### `ping_local()`

Check if local Ollama service is running.

```rust
pub async fn ping_local() -> bool
```

**Returns**: `true` if Ollama is accessible, `false` otherwise

**Example**:

```rust
if llm::ping_local().await {
    println!("Ollama is ready!");
} else {
    println!("Ollama is not running");
}
```

**Notes**:

- Checks `http://127.0.0.1:11434/api/tags` by default
- Respects `OLLAMA_ENDPOINT` environment variable
- 3-second timeout

---

#### `warm_local_model()`

Pre-warm a local Ollama model to reduce first-request latency.

```rust
pub async fn warm_local_model(model: &str) -> bool
```

**Parameters**:

- `model`: Name of the Ollama model to warm (e.g., "llama3.2")

**Returns**: `true` if warming succeeded, `false` otherwise

**Example**:

```rust
// Warm up llama3.2 model
if llm::warm_local_model("llama3.2").await {
    println!("Model is ready for fast responses");
}
```

**Notes**:

- Sends a minimal "ping" prompt
- Model stays loaded in memory for faster subsequent requests
- Non-blocking operation

---

#### `send_request_with_fallback()`

Send LLM request with automatic fallback to other providers on failure.

```rust
pub async fn send_request_with_fallback(
    initial_request: LLMRequest,
    user: Option<&User>,
    enabled_providers: Vec<(LLMProvider, Option<String>)>,
) -> Result<LLMResponse, String>
```

**Parameters**:

- `initial_request`: Primary request to attempt first
- `user`: Optional user for API key retrieval
- `enabled_providers`: List of fallback providers with their API keys

**Returns**:

- `Ok(LLMResponse)` if any provider succeeds
- `Err(String)` if all providers fail

**Example**:

```rust
use crate::llm::{LLMRequest, LLMProvider, send_request_with_fallback};

let request = LLMRequest {
    provider: LLMProvider::Ollama,
    model: "llama3.2".to_string(),
    prompt: "What is the capital of France?".to_string(),
    api_key: None,
    system: Some("You are a helpful assistant.".to_string()),
};

let fallbacks = vec![
    (LLMProvider::Gemini, Some("gemini-api-key".to_string())),
    (LLMProvider::Mistral, Some("mistral-api-key".to_string())),
];

match send_request_with_fallback(request, None, fallbacks).await {
    Ok(response) => println!("Response: {}", response.content),
    Err(e) => eprintln!("All providers failed: {}", e),
}
```

**Fallback Logic**:

1. Try initial provider
2. On failure, try each fallback provider in order
3. Skip providers already tried
4. Return first successful response
5. Return error only if all fail

---

#### `send_request_single()`

Send request to a single LLM provider (no fallback).

```rust
pub async fn send_request_single(
    request: LLMRequest,
    user: Option<&User>,
) -> Result<LLMResponse, String>
```

**Parameters**:

- `request`: LLM request with provider, model, and prompt
- `user`: Optional user for API key retrieval from Firebase

**Returns**:

- `Ok(LLMResponse)` on success
- `Err(String)` with error message on failure

**Example**:

```rust
let request = LLMRequest {
    provider: LLMProvider::Ollama,
    model: "llama3.2".to_string(),
    prompt: "Explain Rust ownership".to_string(),
    api_key: None,
    system: None,
};

let response = send_request_single(request, None).await?;
println!("AI says: {}", response.content);
```

**Provider-Specific Details**:

**Ollama**:

- Endpoint: `http://127.0.0.1:11434/api/generate`
- No API key required
- Streams response (assembled into single string)

**Gemini**:

- Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
- Requires `GEMINI_API_KEY` or `api_key` in request
- Default model: `gemini-1.5-pro`

**Mistral**:

- Endpoint: `https://api.mistral.ai/v1/chat/completions`
- Requires `MISTRAL_API_KEY`
- Default model: `mistral-small`

**GitHub Copilot**:

- Uses GitHub CLI (`gh copilot suggest`)
- Requires GitHub authentication
- Default model: `gpt-4o-mini`

---

### Model Selection

Models are auto-selected based on:

1. **Request's `model` field** (if non-empty)
2. **Environment variables** (e.g., `OLLAMA_MODEL`, `GEMINI_MODEL`)
3. **Auto-detection** (for Ollama, detects installed models)
4. **Provider defaults** (fallback values)

**Ollama Model Priority** (auto-detection):

1. `llama` family
2. `phi` family
3. `mistral` family
4. `qwen` family
5. `granite` family
6. `gemma` family
7. First available model

**Environment Variables**:

- `OLLAMA_MODEL`: Default Ollama model
- `OLLAMA_ENDPOINT`: Ollama server URL (default: `http://127.0.0.1:11434`)
- `GEMINI_MODEL`: Default Gemini model
- `GEMINI_API_KEY`: Gemini API key
- `MISTRAL_MODEL`: Default Mistral model
- `MISTRAL_API_KEY`: Mistral API key
- `GITHUB_COPILOT_MODEL`: Default Copilot model

---

## Auth Module

**Location**: `src-tauri/src/auth.rs`

Handles user authentication, session management, and API key encryption.

### Types

#### `User`

```rust
pub struct User {
    pub uid: String,
    pub email: String,
    pub name: String,
    pub photo_url: Option<String>,
    pub id_token: String,
    pub refresh_token: Option<String>,
    pub expires_in: Option<i64>,
}
```

**Fields**:

- `uid`: Unique user identifier (from OAuth provider)
- `email`: User's email address
- `name`: Display name
- `photo_url`: Profile picture URL (optional)
- `id_token`: JWT ID token for authentication
- `refresh_token`: Token for refreshing expired ID tokens
- `expires_in`: Unix timestamp when token expires

#### `EncryptedKey`

```rust
pub struct EncryptedKey {
    pub provider: String,       // "openai", "anthropic", "gemini", etc.
    pub encrypted_key: String,  // Base64-encoded encrypted API key
    pub created_at: String,     // ISO 8601 timestamp
}
```

#### `AuthService`

```rust
pub struct AuthService {
    current_user: Arc<Mutex<Option<User>>>,
    provider_keys: Arc<Mutex<Vec<EncryptedKey>>>,
}
```

Main authentication service managing user sessions and encrypted API keys.

### Functions

#### `AuthService::new()`

Create a new authentication service.

```rust
pub fn new() -> Self
```

**Example**:

```rust
let auth_service = AuthService::new();
```

**Notes**:

- Automatically loads user from `~/.local/share/kael-os/user.json`
- Checks token expiration and refreshes if needed
- Thread-safe with `Arc<Mutex<>>`

---

#### `get_user()`

Get the currently authenticated user.

```rust
pub fn get_user(&self) -> Option<User>
```

**Returns**: `Some(User)` if logged in, `None` otherwise

**Example**:

```rust
if let Some(user) = auth_service.get_user() {
    println!("Logged in as: {}", user.name);
} else {
    println!("Not logged in");
}
```

---

#### `set_user()`

Set the current user and persist to storage.

```rust
pub fn set_user(&self, user: User)
```

**Parameters**:

- `user`: User object to store

**Example**:

```rust
let user = User {
    uid: "12345".to_string(),
    email: "user@example.com".to_string(),
    name: "John Doe".to_string(),
    photo_url: None,
    id_token: "jwt-token-here".to_string(),
    refresh_token: Some("refresh-token".to_string()),
    expires_in: Some(1734422400), // Unix timestamp
};

auth_service.set_user(user);
```

**Notes**:

- Saves to `~/.local/share/kael-os/user.json`
- Persists across application restarts

---

#### `logout()`

Clear current user and delete local session data.

```rust
pub fn logout(&self)
```

**Example**:

```rust
auth_service.logout();
println!("User logged out");
```

---

#### `encrypt_secret()`

Encrypt a secret (e.g., API key) using the user's ID token.

```rust
pub fn encrypt_secret(user: &User, plaintext: &str) -> String
```

**Parameters**:

- `user`: User whose ID token is used as encryption key
- `plaintext`: Secret to encrypt

**Returns**: Base64-encoded encrypted string

**Example**:

```rust
let user = auth_service.get_user().unwrap();
let api_key = "sk-1234567890abcdef";
let encrypted = encrypt_secret(&user, api_key);
```

**Security**:

- Uses XOR encryption with user's ID token as key material
- Base64 encoding for storage
- Key rotates automatically when user re-authenticates

---

#### `decrypt_secret()`

Decrypt a previously encrypted secret.

```rust
pub fn decrypt_secret(user: &User, ciphertext_b64: &str) -> Option<String>
```

**Parameters**:

- `user`: User whose ID token is used as decryption key
- `ciphertext_b64`: Base64-encoded encrypted secret

**Returns**:

- `Some(String)` with decrypted plaintext
- `None` if decryption fails

**Example**:

```rust
let user = auth_service.get_user().unwrap();
let encrypted = "SGVsbG8gV29ybGQ="; // From storage
if let Some(api_key) = decrypt_secret(&user, encrypted) {
    println!("Decrypted API key: {}", api_key);
}
```

---

#### `add_provider_key()`

Add an encrypted API key for a provider.

```rust
pub fn add_provider_key(&self, provider: String, encrypted_key: String)
```

**Parameters**:

- `provider`: Provider name (e.g., "openai", "gemini")
- `encrypted_key`: Base64-encoded encrypted API key

**Example**:

```rust
let user = auth_service.get_user().unwrap();
let api_key = "sk-my-secret-key";
let encrypted = encrypt_secret(&user, api_key);
auth_service.add_provider_key("openai".to_string(), encrypted);
```

---

#### `get_provider_keys()`

Retrieve all stored provider keys (encrypted).

```rust
pub fn get_provider_keys(&self) -> Vec<EncryptedKey>
```

**Returns**: Vector of encrypted API keys

**Example**:

```rust
let keys = auth_service.get_provider_keys();
for key in keys {
    println!("Provider: {}", key.provider);
}
```

---

## Terminal Module

**Location**: `src-tauri/src/terminal/mod.rs`

Provides terminal emulation and command execution.

### Types

#### `TerminalManager`

```rust
pub struct TerminalManager
```

Simple command execution interface.

#### `PtyTerminal`

```rust
pub struct PtyTerminal
```

Full PTY (pseudo-terminal) emulation for interactive shell sessions.

### Functions

#### `TerminalManager::new()`

Create a new terminal manager.

```rust
pub fn new() -> Self
```

**Example**:

```rust
let term_mgr = TerminalManager::new();
```

---

#### `run_command()`

Execute a shell command and return output.

```rust
pub fn run_command(&self, cmd: &str) -> String
```

**Parameters**:

- `cmd`: Shell command to execute

**Returns**: Command output (stdout + stderr)

**Example**:

```rust
let term_mgr = TerminalManager::new();
let output = term_mgr.run_command("ls -la");
println!("Files:\n{}", output);
```

**Notes**:

- Uses `/bin/sh -c` for execution
- Supports pipes, redirects, and shell syntax
- Blocks until command completes
- Returns "(no output)" if command produces no output

---

#### `run_sudo_command()`

Execute a command with sudo, providing password via stdin.

```rust
pub fn run_sudo_command(&self, cmdline: &str, password: &str) -> String
```

**Parameters**:

- `cmdline`: Full command line (must start with "sudo")
- `password`: User's sudo password

**Returns**: Command output

**Example**:

```rust
let term_mgr = TerminalManager::new();
let output = term_mgr.run_sudo_command(
    "sudo pacman -Syu",
    "my-password"
);
println!("Update output:\n{}", output);
```

**Notes**:

- Uses `sudo -S` (read password from stdin)
- If command doesn't start with "sudo", falls back to `run_command()`
- Synchronous operation

---

#### `PtyTerminal::new()`

Create a new PTY terminal instance.

```rust
pub fn new() -> Self
```

**Example**:

```rust
use crate::terminal::PtyTerminal;

let pty = PtyTerminal::new();
```

**Notes**:

- Spawns a real shell process (bash/sh)
- Supports interactive sessions
- ANSI escape code handling

---

## Database Module

**Location**: `src-tauri/src/db/mod.rs`

SQLite database operations for local storage.

### Functions

#### `get_db_path()`

Get the path to the SQLite database file.

```rust
pub fn get_db_path(app: &tauri::AppHandle) -> PathBuf
```

**Parameters**:

- `app`: Tauri application handle

**Returns**: Path to `kael.db` in app data directory

**Example**:

```rust
let db_path = get_db_path(&app);
println!("Database at: {:?}", db_path);
```

**Platform-specific Locations**:

- Linux: `~/.local/share/kael-os/kael.db`
- macOS: `~/Library/Application Support/com.kael.os/kael.db`
- Windows: `%APPDATA%\com.kael.os\kael.db`

---

#### `init_db()`

Initialize database connection and run migrations.

```rust
pub fn init_db(app: &tauri::AppHandle) -> SqlResult<Connection>
```

**Parameters**:

- `app`: Tauri application handle

**Returns**:

- `Ok(Connection)` if successful
- `Err(rusqlite::Error)` on failure

**Example**:

```rust
let conn = init_db(&app)?;
println!("Database initialized");
```

**Notes**:

- Enables WAL (Write-Ahead Logging) mode
- Runs all pending migrations
- Creates tables if they don't exist
- Safe to call multiple times

---

#### `add_message()`

Store a chat message in the database.

```rust
pub fn add_message(conn: &Connection, role: &str, text: &str) -> SqlResult<String>
```

**Parameters**:

- `conn`: Database connection
- `role`: Message role ("user", "assistant", "system")
- `text`: Message content

**Returns**: UUID of created message

**Example**:

```rust
let msg_id = add_message(&conn, "user", "Hello, AI!")?;
println!("Message stored with ID: {}", msg_id);
```

**Schema**:

```sql
INSERT INTO chat_messages (id, role, text, timestamp, synced)
VALUES (uuid, role, text, ISO8601_timestamp, 0)
```

---

#### `get_chat_history()`

Retrieve all chat messages in chronological order.

```rust
pub fn get_chat_history(conn: &Connection) -> SqlResult<Vec<ChatMessage>>
```

**Parameters**:

- `conn`: Database connection

**Returns**: Vector of chat messages

**Example**:

```rust
let messages = get_chat_history(&conn)?;
for msg in messages {
    println!("[{}] {}: {}", msg.timestamp, msg.role, msg.text);
}
```

**ChatMessage Structure**:

```rust
pub struct ChatMessage {
    pub id: String,
    pub role: String,
    pub text: String,
    pub timestamp: DateTime<Utc>,
    pub synced: bool,
}
```

---

## WebDAV Module

**Location**: `src-tauri/src/webdav/mod.rs`

WebDAV client for file transfer to cPanel or other WebDAV servers.

### Types

#### `WebDavConfig`

```rust
pub struct WebDavConfig {
    pub url: String,
    pub username: String,
    pub password: String,
}
```

**Fields**:

- `url`: WebDAV server URL (e.g., `https://example.com/webdav`)
- `username`: HTTP Basic Auth username
- `password`: HTTP Basic Auth password

#### `WebDavClient`

```rust
pub struct WebDavClient
```

WebDAV client for file operations.

### Functions

#### `WebDavClient::new()`

Create a new WebDAV client.

```rust
pub fn new(config: WebDavConfig) -> Self
```

**Example**:

```rust
use crate::webdav::{WebDavClient, WebDavConfig};

let config = WebDavConfig {
    url: "https://example.com/webdav".to_string(),
    username: "myuser".to_string(),
    password: "mypassword".to_string(),
};

let client = WebDavClient::new(config);
```

---

#### `upload_file()`

Upload a local file to the WebDAV server.

```rust
pub async fn upload_file(
    &self,
    local_path: &Path,
    remote_path: &str,
) -> Result<(), Box<dyn Error>>
```

**Parameters**:

- `local_path`: Path to local file
- `remote_path`: Destination path on server (e.g., "/releases/app-v1.0.0")

**Example**:

```rust
use std::path::Path;

let client = WebDavClient::new(config);
client.upload_file(
    Path::new("/tmp/release.zip"),
    "/releases/release-v1.0.0.zip"
).await?;

println!("File uploaded successfully");
```

**Notes**:

- Uses HTTP PUT method
- Automatically creates parent directories if needed
- HTTP Basic authentication

---

#### `download_file()`

Download a file from the WebDAV server.

```rust
pub async fn download_file(
    &self,
    remote_path: &str,
    local_path: &Path,
) -> Result<(), Box<dyn Error>>
```

**Parameters**:

- `remote_path`: Path on server
- `local_path`: Where to save file locally

**Example**:

```rust
client.download_file(
    "/backups/config.json",
    Path::new("/tmp/config.json")
).await?;
```

---

#### `create_directory()`

Create a directory on the WebDAV server.

```rust
pub async fn create_directory(&self, remote_path: &str) -> Result<(), Box<dyn Error>>
```

**Parameters**:

- `remote_path`: Directory path to create

**Example**:

```rust
client.create_directory("/releases/v1.0.0").await?;
```

**Notes**:

- Uses MKCOL WebDAV method
- Returns success if directory already exists (405 status code)

---

#### `delete_file()`

Delete a file from the WebDAV server.

```rust
pub async fn delete_file(&self, remote_path: &str) -> Result<(), Box<dyn Error>>
```

**Parameters**:

- `remote_path`: File path to delete

**Example**:

```rust
client.delete_file("/old-releases/v0.1.0.zip").await?;
```

---

#### `list_directory()`

List contents of a directory.

```rust
pub async fn list_directory(&self, remote_path: &str) -> Result<Vec<String>, Box<dyn Error>>
```

**Parameters**:

- `remote_path`: Directory path to list

**Returns**: Vector of file/directory names

**Example**:

```rust
let files = client.list_directory("/releases").await?;
for file in files {
    println!("- {}", file);
}
```

**Notes**:

- Uses PROPFIND WebDAV method
- Returns basenames only (not full paths)

---

## Commands Module

**Location**: `src-tauri/src/commands.rs`

Tauri commands exposed to the frontend via IPC.

All commands are tagged with `#[tauri::command]` and can be called from JavaScript/Dioxus.

### Chat Commands

#### `send_message`

```rust
#[tauri::command]
pub fn send_message(message: String, db: State<Mutex<Connection>>) -> Result<ChatMessage, String>
```

Send a chat message and store in database.

**Frontend Usage** (Dioxus):

```rust
// Not directly called - internal use only
```

---

#### `get_chat_history`

```rust
#[tauri::command]
pub fn get_chat_history(db: State<Mutex<Connection>>) -> Result<Vec<ChatMessage>, String>
```

Retrieve all chat messages.

---

### Terminal Commands

#### `execute_terminal_command`

```rust
#[tauri::command]
pub fn execute_terminal_command(command: String) -> Result<String, String>
```

Execute a shell command.

**Parameters**:

- `command`: Shell command to run

**Returns**: Command output

---

### OAuth Commands

#### `initiate_oauth`

```rust
#[tauri::command]
pub async fn initiate_oauth(
    provider: String,
    _app_handle: tauri::AppHandle,
) -> Result<String, String>
```

Generate OAuth URL for authentication.

**Parameters**:

- `provider`: "google" or "github"

**Returns**: OAuth URL to open in browser/webview

---

#### `oauth_result`

```rust
#[tauri::command]
pub fn oauth_result(
    _window: Window,
    state: State<'_, OauthResultState>,
    result: OauthResult,
) -> Result<(), String>
```

Store OAuth result after successful authentication.

---

#### `get_oauth_result`

```rust
#[tauri::command]
pub fn get_oauth_result(state: State<'_, OauthResultState>) -> Result<Option<OauthResult>, String>
```

Retrieve stored OAuth result.

---

### Configuration Commands

#### `get_kael_config`

```rust
#[tauri::command]
pub fn get_kael_config() -> Result<KaelConfig, String>
```

Get application configuration.

---

#### `save_kael_config`

```rust
#[tauri::command]
pub fn save_kael_config(config: KaelConfig) -> Result<(), String>
```

Save application configuration.

---

## Services Module

**Location**: `src-tauri/src/services/`

Business logic services for various features.

### System Context Service

**Location**: `src-tauri/src/services/system_context.rs`

#### `detect_system_context()`

Detect hardware and software environment.

```rust
pub async fn detect_system_context() -> Result<SystemContext, String>
```

**Returns**: SystemContext with CPU, RAM, GPU, OS, Ollama models, etc.

**Example**:

```rust
let context = detect_system_context().await?;
println!("CPU: {}", context.hardware.cpu_brand);
println!("RAM: {:.1} GB", context.hardware.total_ram_gb);
```

---

### Ollama Manager Service

**Location**: `src-tauri/src/services/ollama_manager.rs`

#### `ensure_ollama_running()`

Check if Ollama is running and start if needed.

```rust
pub async fn ensure_ollama_running() -> Result<bool, String>
```

**Returns**: `true` if Ollama is now running

---

#### `list_installed_models()`

Get list of installed Ollama models.

```rust
pub fn list_installed_models() -> Vec<String>
```

**Example**:

```rust
let models = list_installed_models();
println!("Installed models: {:?}", models);
```

---

### Local AI Startup Service

**Location**: `src-tauri/src/services/local_ai_startup.rs`

#### `initialize_local_ai()`

Comprehensive local AI initialization.

```rust
pub async fn initialize_local_ai() -> StartupResult
```

**Returns**: Startup status with messages and recommendations

**Example**:

```rust
let result = initialize_local_ai().await;
for msg in result.startup_messages {
    println!("{}", msg);
}
```

---

## Crypto Module

**Location**: `src-tauri/src/crypto/mod.rs`

Cryptographic utilities (AES-GCM, PBKDF2, HMAC, etc.)

### Functions

Available cryptographic primitives:

- AES-GCM encryption/decryption
- PBKDF2 key derivation
- HMAC authentication
- Random number generation
- X.509 certificate generation

_Detailed crypto API documentation available in source code._

---

## Error Handling

### Error Types

Most functions return `Result<T, E>` where:

- `T` is the success type
- `E` is typically `String` (error message) or `Box<dyn Error>`

### Error Handling Patterns

```rust
// Pattern 1: Propagate with ?
pub fn my_function() -> Result<String, String> {
    let result = risky_operation()?;
    Ok(result)
}

// Pattern 2: Match and handle
match risky_operation() {
    Ok(value) => println!("Success: {}", value),
    Err(e) => eprintln!("Error: {}", e),
}

// Pattern 3: Unwrap with default
let value = risky_operation().unwrap_or_else(|_| "default".to_string());
```

---

## Async/Await

Most I/O operations are asynchronous using Tokio runtime.

### Async Function Example

```rust
use tokio;

#[tokio::main]
async fn main() {
    let response = llm::send_request_single(request, None).await;
    match response {
        Ok(resp) => println!("AI: {}", resp.content),
        Err(e) => eprintln!("Error: {}", e),
    }
}
```

### Spawning Background Tasks

```rust
use tokio::spawn;

spawn(async move {
    // Background work here
    let result = some_async_operation().await;
    println!("Background task completed: {:?}", result);
});
```

---

## Testing

### Unit Testing

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encrypt_decrypt() {
        let user = create_test_user();
        let secret = "my-api-key";
        let encrypted = encrypt_secret(&user, secret);
        let decrypted = decrypt_secret(&user, &encrypted).unwrap();
        assert_eq!(secret, decrypted);
    }

    #[tokio::test]
    async fn test_ollama_ping() {
        let is_running = ping_local().await;
        assert!(is_running, "Ollama should be running for tests");
    }
}
```

### Running Tests

```bash
# Run all tests
cargo test

# Run specific module tests
cargo test llm::tests

# Run with output
cargo test -- --nocapture
```

---

## Best Practices

### Memory Management

- Use `Arc<Mutex<>>` for shared mutable state
- Prefer `&str` over `String` for function parameters
- Clone only when necessary

### Error Messages

- Provide context in error messages
- Use `thiserror` crate for custom error types
- Log errors with `log::error!` before returning

### Async Code

- Use `async/await` for I/O-bound operations
- Avoid blocking in async functions
- Use `spawn_blocking` for CPU-intensive work

### Security

- Never log sensitive data (API keys, passwords)
- Encrypt secrets before storage
- Use HTTPS for all external API calls
- Validate user input

---

**Document Version**: 1.0  
**Last Updated**: December 16, 2025  
**Project**: Kael-OS-AI v1.0.0
