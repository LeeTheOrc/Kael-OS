# System Context & AI Personality System

## 🎯 Overview

This system teaches local AIs about your hardware/software environment on first launch, providing them with context to give better, system-appropriate recommendations.

## 📁 Files Created

### 1. `src-tauri/src/services/system_context.rs`

**Comprehensive system detection:**

- ✅ **Hardware**: CPU (brand, cores, threads), RAM, GPU (NVIDIA/AMD), Storage type (NVMe/SSD/HDD)
- ✅ **Software**: OS, distro, package managers, shell, installed tools
- ✅ **AI Tools**: Ollama detection + available models
- ✅ **Capabilities**: GPU acceleration, local AI readiness, RAM sufficiency

**Generates AI system prompt** with:

```
SYSTEM CONTEXT:
Hardware: AMD Ryzen 9 5900X (12 cores, 24 threads)
RAM: 32.0GB total, 28.5GB available
GPU: NVIDIA GeForce RTX 4060 Laptop GPU (NVIDIA CUDA)
Storage: NVMe (512GB)

OS: Linux 6.12.4-arch1-1
Distribution: Arch Linux
Shell: fish
Package managers: paru, pacman

Installed tools:
- Ollama (local AI)
  Models: deepseek-coder:33b, phi3:latest
- Docker
- Python
- Rust

CAPABILITIES:
- Can run GPU-accelerated local AI models (CUDA)
- Local AI available for privacy-sensitive tasks
- Sufficient RAM for large language models
- Fast storage for quick model loading

INSTRUCTIONS:
- Use this context to provide system-appropriate recommendations
- Suggest local AI when available for privacy
- Consider hardware limits when recommending models/tools
- Use appropriate package manager commands (paru/pacman)
```

### 2. `src-tauri/src/services/first_launch.rs`

**First launch orchestration:**

- ✅ Detects if this is the first app launch
- ✅ Runs full system detection
- ✅ Saves context to `~/.local/share/kael-os/system_context.json`
- ✅ Provides refresh function (after installing Ollama, etc.)

## 🔧 Integration Steps

### 1. Add to `services/mod.rs`

```rust
pub mod system_context;
pub mod first_launch;
```

### 2. Add dependencies to `Cargo.toml`

```toml
sysinfo = "0.30"
chrono = { version = "0.4", features = ["serde"] }
```

### 3. Wire into `main.rs` startup

```rust
use crate::services::first_launch;

fn main() {
    dotenv::from_filename(".env.local").ok();
    env_logger::init();

    // Initialize OAuth callback server
    oauth_server::start_oauth_server();

    // NEW: Initialize system context on first launch
    let rt = tokio::runtime::Runtime::new().unwrap();
    rt.block_on(async {
        match first_launch::get_or_init_context(&app_handle).await {
            Ok(ctx) => {
                println!("✅ System context ready");
                // Context is now available for all AI interactions
            }
            Err(e) => {
                eprintln!("⚠️ Failed to init system context: {}", e);
                // App continues to work, just without optimized AI context
            }
        }
    });

    dioxus_desktop::launch::launch(app, Default::default(), Default::default());
}
```

### 4. Use in AI chat commands

```rust
// In chat.rs or wherever you send to AI
use crate::services::first_launch;

async fn send_to_ai(app: &AppHandle, user_message: &str) -> String {
    // Load system context
    let context = first_launch::get_or_init_context(app).await.ok();

    // Prepend to AI prompt
    let full_prompt = if let Some(ctx) = context {
        format!("{}\n\nUser: {}", ctx.system_prompt, user_message)
    } else {
        user_message.to_string()
    };

    // Send to AI provider...
}
```

## 🎯 Benefits

**For Local AIs:**

- Know what hardware they're running on
- Suggest GPU-optimized models when NVIDIA/AMD detected
- Recommend appropriate model sizes based on RAM
- Use correct package manager commands

**For Cloud AIs:**

- Understand user's environment for better help
- Suggest compatible tools/software
- Give system-specific troubleshooting

**For Users:**

- Better, context-aware AI responses
- No need to explain "I'm on Arch Linux" every time
- AI automatically suggests local models when available
- Privacy-focused recommendations

## 📊 What Gets Detected

```json
{
  "first_launch": "2025-12-16T09:15:00Z",
  "last_updated": "2025-12-16T09:15:00Z",
  "system_prompt": "SYSTEM CONTEXT:\n...",
  "hardware": {
    "cpu_brand": "AMD Ryzen 9 5900X 12-Core Processor",
    "cpu_cores": 12,
    "cpu_threads": 24,
    "total_ram_gb": 32.0,
    "available_ram_gb": 28.5,
    "gpu_type": "NVIDIA",
    "gpu_name": "NVIDIA GeForce RTX 4060 Laptop GPU",
    "has_nvidia": true,
    "has_amd": false,
    "storage_type": "NVMe",
    "total_storage_gb": 512.0
  },
  "software": {
    "os_name": "linux",
    "os_version": "6.12.4-arch1-1",
    "distro": "Arch Linux",
    "package_manager": ["paru", "pacman"],
    "shell": "fish",
    "has_docker": true,
    "has_ollama": true,
    "ollama_models": ["deepseek-coder:33b", "phi3:latest", "codellama:34b"],
    "has_python": true,
    "has_node": false,
    "has_rust": true
  },
  "preferences": {
    "prefer_local_ai": true,
    "max_local_model_size_gb": 8,
    "enable_gpu": true,
    "gaming_mode_default": false,
    "language": "en"
  }
}
```

## 🔄 Refreshing Context

After installing new tools:

```rust
// Tauri command
#[tauri::command]
async fn refresh_system_context(app: AppHandle) -> Result<String, String> {
    let ctx = first_launch::refresh_context(&app).await?;
    Ok("System context refreshed".to_string())
}
```

## 🚀 Next Steps

1. **Add dependencies** to Cargo.toml
2. **Wire into main.rs** startup sequence
3. **Integrate with chat** to prepend system context
4. **Test** first launch detection
5. **Optional**: Add settings UI to view/edit context

---

**This gives every AI in your app instant knowledge of your system!** 🧠

Website building is happening in the background via local AI. Check `website/` folder soon! 🌐
