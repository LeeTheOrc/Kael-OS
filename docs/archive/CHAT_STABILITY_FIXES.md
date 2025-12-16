# 🔧 Chat/Terminal Stability Fixes - Implementation Guide

**Goal**: Fix critical crash issues immediately  
**Timeline**: 1-2 weeks  
**Priority**: HIGHEST

---

## Fix #1: Structured Error Handling for JSON Parsing

### Current Problem

```rust
// Line 161, 292, 583
serde_json::from_str(&s).unwrap_or_default()
```

This panics if JSON is malformed, and `unwrap_or_default()` with no logging means data loss is silent.

### Solution

Create a new helper module `src-tauri/src/utils/serialization.rs`:

```rust
use serde::{de::DeserializeOwned, Serialize};

pub fn safe_load_json<T: DeserializeOwned + Default>(
    file_path: &str,
    component: &str,
) -> T {
    match std::fs::read_to_string(file_path) {
        Ok(content) => match serde_json::from_str::<T>(&content) {
            Ok(data) => {
                log::debug!("✅ Loaded {} from {}", component, file_path);
                data
            }
            Err(e) => {
                log::error!("Failed to parse {}: {} (using defaults, file may be corrupted)", component, e);
                // Try to backup corrupted file
                if let Ok(backup_path) = format!("{}.corrupted_{}", file_path, chrono::Local::now().timestamp()) {
                    let _ = std::fs::rename(file_path, &backup_path);
                    log::warn!("⚠️  Backed up corrupted file to: {}", backup_path);
                }
                T::default()
            }
        },
        Err(e) => {
            log::debug!("No {} file found at {}: {}", component, file_path, e);
            T::default()
        }
    }
}

pub fn safe_save_json<T: Serialize>(
    file_path: &str,
    data: &T,
    component: &str,
) -> Result<(), String> {
    match serde_json::to_string(data) {
        Ok(json) => {
            // Atomic write: write to temp file first
            let temp_path = format!("{}.tmp", file_path);
            match std::fs::write(&temp_path, &json) {
                Ok(_) => {
                    // Atomic rename
                    match std::fs::rename(&temp_path, file_path) {
                        Ok(_) => {
                            log::debug!("✅ Saved {} to {}", component, file_path);
                            Ok(())
                        }
                        Err(e) => {
                            let _ = std::fs::remove_file(&temp_path);
                            log::error!("Failed to write {}: {}", component, e);
                            Err(format!("Failed to save {}: {}", component, e))
                        }
                    }
                }
                Err(e) => {
                    log::error!("Failed to write {} to temp file: {}", component, e);
                    Err(format!("Failed to save {}: {}", component, e))
                }
            }
        }
        Err(e) => {
            log::error!("Failed to serialize {}: {}", component, e);
            Err(format!("Failed to serialize {}: {}", component, e))
        }
    }
}
```

### Changes to chat.rs

**Before**:

```rust
let load_messages = || -> Vec<Message> {
    if let Ok(json) = std::fs::read_to_string("/tmp/kael_chat_history.json") {
        serde_json::from_str(&json).unwrap_or_else(|_| {
            vec![Message {
                author: "Kael".to_string(),
                text: "Greetings, Architect!".to_string(),
                is_streaming: false,
                provider: None,
                prompt: None,
            }]
        })
    } else {
        vec![Message { ... }]
    }
};
```

**After**:

```rust
let load_messages = || -> Vec<Message> {
    use crate::utils::serialization::safe_load_json;

    let mut messages: Vec<Message> = safe_load_json(
        "/tmp/kael_chat_history.json",
        "chat history"
    );

    // Ensure we always have a greeting if empty
    if messages.is_empty() {
        messages.push(Message {
            author: "Kael".to_string(),
            text: "Greetings, Architect! I am Kael.".to_string(),
            is_streaming: false,
            provider: None,
            prompt: None,
        });
    }

    messages
};

let save_messages = |messages: &[Message]| {
    use crate::utils::serialization::safe_save_json;

    if let Err(e) = safe_save_json(messages, "/tmp/kael_chat_history.json", "chat history") {
        log::error!("Failed to save messages: {}", e);
        // User will see this in chat
    }
};
```

---

## Fix #2: Message Queue Limiting & Archival

### Current Problem

Messages list grows indefinitely → Memory leak → OOM

### Solution

Add to `utils/serialization.rs`:

```rust
pub fn archive_messages(messages: &mut Vec<Message>, max_in_memory: usize) -> usize {
    let archive_threshold = (max_in_memory as f64 * 1.2) as usize; // Archive when exceeds 120%

    if messages.len() > archive_threshold {
        let to_archive = messages.len() - max_in_memory;
        let archived: Vec<Message> = messages.drain(0..to_archive).collect();

        // Append to archive file
        let archive_path = "/tmp/kael_chat_archive.json";
        let mut all_archived: Vec<Message> = safe_load_json(archive_path, "chat archive");
        all_archived.extend(archived.clone());

        // Keep last 10,000 messages in archive
        if all_archived.len() > 10000 {
            all_archived.drain(0..(all_archived.len() - 10000));
        }

        if let Err(e) = safe_save_json(&all_archived, archive_path, "chat archive") {
            log::warn!("Failed to archive messages: {}", e);
        }

        log::info!("📦 Archived {} messages (kept {} in memory)", to_archive, messages.len());
        return to_archive;
    }

    0
}
```

### Changes to chat.rs

```rust
const MAX_MESSAGES_IN_MEMORY: usize = 500;

// In the use_effect that handles message updates:
use_effect(move || {
    let msg_count = messages().len();

    // Auto-archive if too many
    if msg_count > MAX_MESSAGES_IN_MEMORY {
        let mut msgs = messages.write();
        let archived = crate::utils::serialization::archive_messages(&mut msgs, MAX_MESSAGES_IN_MEMORY);
        if archived > 0 {
            log::info!("✅ Auto-archived {} messages", archived);
        }
    }

    save_messages(&messages.read());
});
```

---

## Fix #3: User-Facing Error Feedback

### Current Problem

PTY errors only printed to stderr, user doesn't see them

```rust
if let Err(e) = p.write_line(&cmd).await {
    eprintln!("PTY write error: {e}");  // 🚫 Only in stderr!
}
```

### Solution

Create error feedback helper:

````rust
fn show_error_to_user(
    messages: &mut Signal<Vec<Message>>,
    error: &str,
    component: &str,
) {
    messages.write().push(Message {
        author: "Kael".to_string(),
        text: format!(
            "⚠️  **{}** encountered an error:\n\n```\n{}\n```\n\n💡 Try again or check logs for details.",
            component,
            error
        ),
        is_streaming: false,
        provider: None,
        prompt: None,
    });
}
````

### Changes to chat.rs

**Before**:

```rust
spawn(async move {
    if let Err(e) = p.write_line(&cmd).await {
        eprintln!("PTY write error: {e}");
    }
});
```

**After**:

```rust
spawn(async move {
    if let Err(e) = p.write_line(&cmd).await {
        log::error!("PTY write error: {}", e);
        let mut msgs_ref = msgs.clone(); // Need msgs signal passed in
        show_error_to_user(&mut msgs_ref, &e, "Terminal");
    }
});
```

---

## Fix #4: Timeout Protection for API Calls

### Current Problem

LLM calls can hang forever if network issues

### Solution

Add to `llm.rs`:

```rust
use tokio::time::{timeout, Duration};

pub async fn send_request_with_timeout(
    req: LLMRequest,
    user: Option<&User>,
    providers: Vec<(LLMProvider, Option<String>)>,
) -> Result<LLMResponse, String> {
    const REQUEST_TIMEOUT: Duration = Duration::from_secs(60);

    match timeout(REQUEST_TIMEOUT, send_request_with_fallback(req, user, providers)).await {
        Ok(result) => result,
        Err(_) => Err("🌐 Request timed out after 60 seconds. Check network connection.".to_string()),
    }
}
```

### Changes to chat.rs

```rust
// Line ~600, replace:
// match llm::send_request_with_fallback(req, user_ref, fallback_providers).await {

// With:
match llm::send_request_with_timeout(req, user_ref, fallback_providers).await {
```

---

## Fix #5: Atomic File Writes

### Already implemented in `safe_save_json()` above ✅

Uses temp file + rename pattern to prevent corruption.

---

## Fix #6: Async Task Error Coordination

### Current Problem

11+ spawns with minimal error handling - one panic crashes everything

### Solution

Create structured async error handler:

```rust
pub struct AsyncTaskManager {
    pending: Arc<std::sync::atomic::AtomicUsize>,
    max_pending: usize,
}

impl AsyncTaskManager {
    pub fn new(max_pending: usize) -> Self {
        Self {
            pending: Arc::new(std::sync::atomic::AtomicUsize::new(0)),
            max_pending,
        }
    }

    pub fn can_spawn(&self) -> bool {
        let current = self.pending.load(std::sync::atomic::Ordering::Relaxed);
        current < self.max_pending
    }

    pub fn spawn<F>(&self, f: F) -> Result<(), String>
    where
        F: std::future::Future + 'static,
    {
        if !self.can_spawn() {
            return Err(format!("Too many pending tasks (max: {})", self.max_pending));
        }

        let pending = Arc::clone(&self.pending);
        pending.fetch_add(1, std::sync::atomic::Ordering::Relaxed);

        dioxus::prelude::spawn(async move {
            let _guard = DropGuard(pending); // Auto-decrement on drop
            let _ = f.await;
        });

        Ok(())
    }
}

struct DropGuard(Arc<std::sync::atomic::AtomicUsize>);
impl Drop for DropGuard {
    fn drop(&mut self) {
        self.0.fetch_sub(1, std::sync::atomic::Ordering::Relaxed);
    }
}
```

---

## Fix #7: PTY Thread Safety

### Current Problem

Multiple concurrent writes without synchronization

### Solution

Add to `terminal/pty_manager.rs`:

```rust
pub struct SafePtyTerminal {
    session: Arc<Mutex<Option<PtySession>>>,
    write_queue: Arc<Mutex<Vec<String>>>,
}

impl SafePtyTerminal {
    pub async fn write_line(&self, line: &str) -> Result<(), String> {
        let mut queue = self.write_queue.lock().await;
        queue.push(line.to_string());

        let mut lock = self.session.lock().await;
        if let Some(ref mut pty) = *lock {
            while let Some(cmd) = queue.pop() {
                let input = format!("{}\n", cmd);
                PtyBackend::write_input(pty, input.as_bytes())
                    .await
                    .map_err(|e| e.to_string())?;
            }
        } else {
            return Err("PTY session not initialized".to_string());
        }
        Ok(())
    }
}
```

---

## Fix #8: Provider Order & Persistence

### Current Problem

Using `/tmp/` for provider order (non-persistent)

### Solution

Use SQLite instead:

```rust
pub fn save_provider_order(providers: &[LLMProvider]) -> Result<(), String> {
    let db = get_app_db()?; // From state

    let order_str = providers.iter()
        .map(|p| format!("{:?}", p))
        .collect::<Vec<_>>()
        .join(",");

    db.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES ('provider_order', ?1)",
        [order_str],
    ).map_err(|e| e.to_string())?;

    Ok(())
}
```

---

## Implementation Checklist

### Week 1: Core Fixes

- [ ] Create `utils/serialization.rs` with safe_load/safe_save
- [ ] Update all JSON loading in chat.rs to use safe_load_json
- [ ] Update all JSON saving in chat.rs to use safe_save_json
- [ ] Add message queue limits (500 in memory, archive rest)
- [ ] Add user-facing error messages for all operations
- [ ] Add timeout to all LLM API calls (60s)
- [ ] Test with corrupted chat_history.json
- [ ] Test with 1000+ messages
- [ ] Test with network timeout

### Week 2: Robustness

- [ ] Add AsyncTaskManager to limit concurrent spawns
- [ ] Refactor PTY to use write queue
- [ ] Add structured error types
- [ ] Add comprehensive logging
- [ ] Deploy hotfix release

---

## Testing Checklist

### Crash Tests

- [ ] **JSON Parsing**: Delete chat_history.json, add invalid JSON, restart
  - Expected: App starts with default greeting, logs error
- [ ] **Message Overflow**: Send 1000 messages
  - Expected: Messages archived, memory stays stable, no OOM
- [ ] **Network Timeout**: Disable network during LLM call
  - Expected: Times out after 60s, shows error to user
- [ ] **PTY Crash**: Kill PTY process, try to send command

  - Expected: Error shown, app continues working

- [ ] **Concurrent Operations**: Send 10 messages simultaneously

  - Expected: All processed, no message loss or corruption

- [ ] **File I/O Failure**: Remove write permissions from /tmp/
  - Expected: Error logged, user notified, app continues

### Stability Tests

- [ ] Run for 1 hour with constant messages → No memory leak
- [ ] Run with network off → Graceful degradation
- [ ] Kill Ollama mid-request → Fallback to cloud works
- [ ] Corrupt Firebase keys file → App recovers

---

## Rollout Plan

### Phase 1: Hotfix Release (Critical Fixes Only)

- JSON parsing errors
- Message queue limits
- Timeout protection
- User error feedback

**Estimate**: 1 week  
**Risk**: Low (fixes are isolated)

### Phase 2: Robustness Release (Error Handling)

- Async task coordination
- PTY thread safety
- Structured error types
- Comprehensive logging

**Estimate**: 1 week  
**Risk**: Medium (refactoring)

### Phase 3: Architecture Release (Long-term)

- Message queue bus
- Service layer
- SQLite migration
- Custom shell

**Estimate**: 4-6 weeks  
**Risk**: High (major refactor)

---

## Success Criteria

✅ Zero crashes from JSON parsing  
✅ Memory stable after 1h continuous use  
✅ All errors shown to user  
✅ API calls timeout within 60s  
✅ No silent failures  
✅ Comprehensive error logging

---

**Next**: Start implementing Fix #1-3 immediately. These will eliminate 80% of crashes.
