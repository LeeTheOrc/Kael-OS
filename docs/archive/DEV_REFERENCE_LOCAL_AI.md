# 🔧 Local AI Startup System - Developer Reference

## Quick API Reference

### Main Entry Point

```rust
// In app.rs or anywhere you want to initialize local AI
let startup_result = crate::services::local_ai_startup::initialize_local_ai().await;

// Returns StartupResult struct with:
startup_result.all_systems_ready          // bool: Is any local AI running?
startup_result.statuses                   // Vec<LocalAIStatus>: Per-service status
startup_result.total_startup_time_ms      // u128: Total time in milliseconds
startup_result.startup_messages           // Vec<String>: Human-readable log messages
```

### System Capability Detection

```rust
let caps = crate::services::local_ai_startup::detect_system_capabilities();

// Access capabilities:
caps.cpu_cores          // usize: Number of CPU cores
caps.total_ram_gb       // f64: Total RAM in gigabytes
caps.gpu_available      // bool: Is a GPU detected?
caps.gpu_type           // Option<String>: Type (e.g., "NVIDIA: RTX 3090")
caps.has_nvme           // bool: Is NVMe storage available?
```

### Check Specific Service Status

```rust
// Check Ollama specifically
let status = crate::services::local_ai_startup::check_ollama_status().await;

status.ai_type           // LocalAIType::Ollama
status.installed         // bool
status.running           // bool
status.available_models  // Vec<String>: List of models
status.recommended_model // Option<String>: Best model for system
status.status_message    // String: Human-readable message
```

### Get Recommended Models

```rust
let caps = detect_system_capabilities();
let recommendations = recommend_models_to_download(&caps);

// Returns Vec<String> like:
// ["llama2:13b", "mistral", "wizard-vicuna-uncensored"]
```

### Start/Stop Services

```rust
// Start Ollama
let result = crate::services::local_ai_startup::start_ollama().await;
match result {
    Ok(()) => println!("Started!"),
    Err(e) => println!("Failed: {}", e),
}

// Wait for it to be ready
let ready = crate::services::local_ai_startup::wait_for_ollama_ready(10).await;
if ready {
    println!("Service is up!");
}
```

### Download Models

```rust
let models_to_download = vec![
    "llama2:13b".to_string(),
    "mistral".to_string(),
];

let downloaded = crate::services::local_ai_startup::download_recommended_models(&models_to_download).await;

println!("Successfully downloaded: {:?}", downloaded);
// Only includes models that actually completed
```

---

## Data Structures

### StartupResult

```rust
pub struct StartupResult {
    pub all_systems_ready: bool,           // Any service available?
    pub statuses: Vec<LocalAIStatus>,      // Per-service details
    pub total_startup_time_ms: u128,       // Total duration
    pub startup_messages: Vec<String>,     // Readable log messages
}
```

### LocalAIStatus

```rust
pub struct LocalAIStatus {
    pub ai_type: LocalAIType,              // Which service (Ollama, etc)
    pub installed: bool,                   // Is it installed?
    pub running: bool,                     // Is it currently running?
    pub available_models: Vec<String>,     // Installed model names
    pub recommended_model: Option<String>, // Best for this system
    pub status_message: String,            // "✅ Running", "⚠️  Not installed", etc
}
```

### SystemCapabilities

```rust
pub struct SystemCapabilities {
    pub cpu_cores: usize,           // e.g., 16
    pub total_ram_gb: f64,          // e.g., 32.0
    pub gpu_available: bool,        // e.g., true
    pub gpu_type: Option<String>,   // e.g., "NVIDIA: RTX 3090"
    pub has_nvme: bool,             // e.g., true
}
```

### LocalAIType

```rust
pub enum LocalAIType {
    Ollama,
    // Future: LMStudio, Jan, LlamaCpp, etc
}
```

---

## Integration Example

### Complete Startup in App Component

```rust
use_effect(move || {
    spawn(async move {
        // Run startup
        let startup_result = crate::services::local_ai_startup::initialize_local_ai().await;

        // Log all messages
        for msg in &startup_result.startup_messages {
            log::info!("{}", msg);
        }

        // If something is ready, warm it up
        if startup_result.all_systems_ready {
            if let Some(recommended) = startup_result.statuses
                .iter()
                .find_map(|s| s.recommended_model.clone())
            {
                log::info!("Warming model: {}", recommended);
                llm::warm_local_model(&recommended).await;
            }
        } else {
            log::warn!("No local AI available, using cloud only");
        }
    });
});
```

### Custom Startup Strategy

```rust
// Only download if user explicitly wants it
async fn optional_model_download(user_wants_local_ai: bool) {
    if !user_wants_local_ai {
        return;
    }

    let caps = detect_system_capabilities();
    let models = recommend_models_to_download(&caps);

    log::info!("Downloading: {:?}", models);
    let downloaded = download_recommended_models(&models).await;
    log::info!("Complete: {:?}", downloaded);
}
```

### Check Before Using Local AI

```rust
// In a command handler
async fn handle_user_request(prompt: &str) -> String {
    let status = check_ollama_status().await;

    if status.running && status.recommended_model.is_some() {
        // Use local AI
        use_local_ai(prompt).await
    } else {
        // Fall back to cloud
        use_cloud_ai(prompt).await
    }
}
```

---

## Environment Variables

Control startup behavior:

```bash
# Which model to warmup after startup
export OLLAMA_WARMUP_MODEL=llama2:13b

# Disable local AI entirely (for testing)
export KAEL_DISABLE_LOCAL_AI=1

# Increase logging verbosity
export RUST_LOG=debug
```

---

## Async Usage

All functions are async and should be used with `.await`:

```rust
// ✅ CORRECT
let status = check_ollama_status().await;

// ❌ WRONG - will not compile
let status = check_ollama_status();  // Type mismatch
```

Always call within an async context:

```rust
// ✅ In use_effect with spawn
use_effect(move || {
    spawn(async move {
        let result = initialize_local_ai().await;
        // ...
    });
});

// ✅ In async function
pub async fn my_function() {
    let result = initialize_local_ai().await;
}
```

---

## Error Handling

Most functions return `Result<T, String>` or `Option<T>`:

```rust
// Handle Result
match start_ollama().await {
    Ok(()) => println!("Started"),
    Err(e) => eprintln!("Error: {}", e),
}

// Handle Option
if let Some(model) = recommended_model {
    println!("Best model: {}", model);
}

// Log and continue
let status = check_ollama_status().await;
if !status.running {
    log::warn!("Ollama not running: {}", status.status_message);
}
```

---

## Common Patterns

### Check and Start (Atomic)

```rust
let status = check_ollama_status().await;
if status.installed && !status.running {
    start_ollama().await.ok();  // Ignore errors, app continues
}
```

### Get Best Model

```rust
let status = check_ollama_status().await;
let model = status.recommended_model
    .unwrap_or_else(|| "llama3:latest".to_string());
```

### Smart Fallback

```rust
let startup = initialize_local_ai().await;
let use_local = startup.all_systems_ready;

let provider = if use_local {
    "ollama"
} else {
    "mistral"  // cloud fallback
};
```

---

## Troubleshooting

### Service won't start?

```rust
// Check why
let status = check_ollama_status().await;
log::error!("Status: {}", status.status_message);

// Try manual start
match start_ollama().await {
    Ok(()) => log::info!("Started"),
    Err(e) => log::error!("Start failed: {}", e),
}

// Wait for ready
let ready = wait_for_ollama_ready(10).await;
log::info!("Ready: {}", ready);
```

### Models not downloading?

```rust
let recommended = recommend_models_to_download(&caps);
log::info!("Will download: {:?}", recommended);

let downloaded = download_recommended_models(&recommended).await;
log::info!("Successfully downloaded: {:?}", downloaded);

// downloaded will only include successful ones
```

### Check capabilities

```rust
let caps = detect_system_capabilities();
log::info!("CPU: {}", caps.cpu_cores);
log::info!("RAM: {:.1}GB", caps.total_ram_gb);
log::info!("GPU: {:?}", caps.gpu_type);
log::info!("NVMe: {}", caps.has_nvme);
```

---

## Testing

### Run tests

```bash
cargo test --workspace
```

### Included tests

- `test_system_capabilities_detection()` - Verifies detection works
- `test_recommend_model()` - Verifies recommendation logic
- `test_model_recommendations_by_ram()` - Verifies RAM-based selection

### Add custom test

```rust
#[tokio::test]
async fn test_my_startup_logic() {
    let startup = initialize_local_ai().await;
    assert!(startup.total_startup_time_ms > 0);
}
```

---

## Performance Notes

- **First check**: ~500ms (service status)
- **Service startup**: 1-5s (starting Ollama)
- **Model download**: 5-30 min (depends on model)
- **Model warmup**: 1-5s (depends on model size)

Cache results when possible to avoid repeated checks:

```rust
// ✅ GOOD - check once
let startup = initialize_local_ai().await;
// use startup.statuses multiple times

// ❌ BAD - checking multiple times
for _ in 0..10 {
    let status = check_ollama_status().await;  // Slow!
}
```

---

## Module Location

```
src-tauri/src/services/local_ai_startup.rs
├── pub fn detect_system_capabilities()
├── pub async fn check_ollama_status()
├── pub async fn start_ollama()
├── pub async fn wait_for_ollama_ready()
├── pub fn recommend_models_to_download()
├── pub async fn download_recommended_models()
├── pub async fn initialize_local_ai()
└── tests module
```

Access via: `crate::services::local_ai_startup::<function>`

---

**Last Updated**: December 15, 2025
**Kael-OS Version**: 0.3.0-beta
