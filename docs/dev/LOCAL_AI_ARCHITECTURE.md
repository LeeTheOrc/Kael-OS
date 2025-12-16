# 🚀 Local AI Startup System - Complete Architecture

## System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     App Launch (main.rs)                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────────┐
        │   App Component (app.rs)           │
        │   use_effect() on mount            │
        └────────────┬───────────────────────┘
                     │
                     ▼
     ┌───────────────────────────────────────────────┐
     │  initialize_local_ai() [ASYNC]                │
     │  src-tauri/src/services/local_ai_startup.rs   │
     └───────────────┬───────────────────────────────┘
                     │
         ┌───────────┴────────────┬─────────────────┬─────────────┐
         │                        │                 │             │
         ▼                        ▼                 ▼             ▼
   ┌──────────────┐      ┌──────────────┐   ┌──────────────┐  ┌──────────┐
   │   PHASE 1    │      │   PHASE 2    │   │   PHASE 3    │  │ PHASE 4  │
   │ Detect Sys   │      │ Check Svc    │   │ Start Svc    │  │ Download │
   │ Capabilities │      │ Status       │   │ (if needed)  │  │ Models   │
   └──────┬───────┘      └──────┬───────┘   └──────┬───────┘  └─────┬────┘
          │                     │                   │                │
          ▼                     ▼                   ▼                ▼
    ┌──────────────┐      ┌──────────────┐   ┌──────────────┐  ┌──────────┐
    │ • CPU cores  │      │ • Ollama     │   │ systemctl    │  │ ollama   │
    │ • RAM (GB)   │      │   installed? │   │   --user     │  │ pull     │
    │ • GPU type   │      │ • Running?   │   │ systemctl    │  │ <model>  │
    │ • NVMe?      │      │ • Models?    │   │   (sudo)     │  │          │
    │              │      │ • Model list │   │ nohup        │  │ Reports  │
    └──────┬───────┘      │              │   │ (fallback)   │  │ progress │
           │              │ Returns:     │   └──────┬───────┘  └─────┬────┘
           │              │ LocalAIStatus│          │                │
           │              └──────┬───────┘          │                │
           │                     │                   │                │
           └─────────────┬───────┴───────────────────┴────────────────┘
                         │
                         ▼
        ┌────────────────────────────────────┐
        │      PHASE 5: Model Warmup         │
        │   Load into VRAM/Memory            │
        │  llm::warm_local_model()           │
        └────────────┬───────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────┐
        │   Return StartupResult             │
        │  • all_systems_ready: bool         │
        │  • statuses: Vec<LocalAIStatus>    │
        │  • startup_messages: Vec<String>   │
        │  • total_startup_time_ms: u128     │
        └────────────┬───────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────┐
        │  App continues normally            │
        │  Users can now use local AI        │
        │  (or cloud fallbacks if failed)    │
        └────────────────────────────────────┘
```

---

## Decision Tree

```
┌─ Is Ollama installed?
│  ├─ NO  → Return "Not installed" message
│  │       Users can install from ollama.ai
│  │
│  └─ YES → Is Ollama running?
│     ├─ NO  → Attempt to start
│     │       ├─ Try systemctl --user
│     │       ├─ Try sudo systemctl
│     │       └─ Try nohup spawn
│     │
│     │       Is it running now?
│     │       ├─ NO  → Return "Failed to start"
│     │       │       App uses cloud fallbacks
│     │       │
│     │       └─ YES → Continue...
│     │
│     └─ YES → Does it have models?
│        ├─ NO  → Get system capabilities
│        │       ├─ RAM ≥ 16GB → Download llama2:13b, mistral
│        │       ├─ RAM 8-16GB → Download llama2:7b, neural-chat
│        │       └─ RAM < 8GB  → Download phi, orca-mini
│        │
│        │       Wait for downloads...
│        │       ├─ Success → Warm model
│        │       └─ Fail    → Return failure (cloud fallback)
│        │
│        └─ YES → Find best model
│               ├─ Prefer: llama, neural-chat, mistral, phi
│               └─ Warm selected model
│
└─ Mark startup complete
   ├─ all_systems_ready = true (if any service is running)
   └─ all_systems_ready = false (if nothing works)
```

---

## Service State Transitions

### Ollama State Machine

```
┌─────────────┐
│ Not Checked │  ← Initial state
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│ Check Installed  │
└──────┬───────┬──────┘
       │       │
    NO│       │YES
       │       │
       ▼       ▼
  ┌─────┐  ┌────────────┐
  │ END │  │ Check      │
  │ :❌ │  │ Running    │
  └─────┘  └──────┬──────┘
                  │
            ┌─────┴─────┐
         NO │           │ YES
           ▼           ▼
        ┌─────────┐  ┌──────────────┐
        │ Attempt │  │ Check Models │
        │ Start   │  └──────┬───────┘
        └────┬────┘         │
             │          ┌───┴───┐
        ┌────┴──────┐ NO│       │YES
        │           │   ▼       ▼
     ┌──┴──┐    ┌──────────┐  ┌──────┐
     │SUCCESS   │ Download │  │ End  │
     │     │    │ Models   │  │:✅   │
     │     │    └──┬───────┘  └──────┘
     │     │       │
     │     │    ┌──┴──┐
     │     │ OK │     │FAIL
     │     │    ▼      ▼
     │     │  ┌──┐   ┌──┐
     │     │  │✅│   │❌│
     │     │  └──┘   └──┘
     └─────┘
      │ FAIL
      ▼
    ┌──┐
    │❌│
    └──┘
```

---

## Data Flow

### Request Example: Download Models

```
User System:
  CPU: 16 cores
  RAM: 32 GB
  GPU: NVIDIA RTX 3090

         │
         ▼
Recommend Models:
  - llama2:13b (16GB model, needs high RAM)
  - mistral (7GB model, balanced)
  - wizard-vicuna (GPU optimized)

         │
         ▼
Download Each Model:
  [████████░░░░░░░░░░] llama2:13b  (65%)
  [██████████████████] mistral    (100%)

         │
         ▼
Warmup Best Model:
  Load llama2:13b into VRAM (8.5GB)
  Ready for instant responses

         │
         ▼
Return Results:
  StartupResult {
    all_systems_ready: true,
    statuses: [LocalAIStatus {
      running: true,
      available_models: [...],
      recommended_model: "llama2:13b"
    }],
    total_startup_time_ms: 18500,
    startup_messages: [...]
  }
```

---

## File Structure & Responsibilities

```
src-tauri/src/
│
├── main.rs
│   └─ Entry point
│      └─ Launches OAuth server
│      └─ Launches Dioxus desktop app
│
├── components/
│   └── app.rs  [MODIFIED]
│       └─ App component
│       └─ use_effect() calls initialize_local_ai()
│       └─ Logs startup results
│       └─ Warms model after startup
│
├── services/
│   ├── mod.rs  [MODIFIED]
│   │   └─ Added: pub mod local_ai_startup;
│   │
│   └── local_ai_startup.rs  [NEW - 600+ lines]
│       ├─ detect_system_capabilities()
│       │  └─ CPU cores, RAM, GPU, NVMe detection
│       │
│       ├─ check_ollama_status()
│       │  └─ Installed? Running? Models available?
│       │
│       ├─ start_ollama()
│       │  └─ Try systemctl, sudo, nohup
│       │
│       ├─ wait_for_ollama_ready()
│       │  └─ Exponential backoff retries
│       │
│       ├─ recommend_models_to_download()
│       │  └─ RAM-based model selection
│       │
│       ├─ download_recommended_models()
│       │  └─ Run ollama pull <model>
│       │
│       ├─ initialize_local_ai()  [MAIN ENTRY]
│       │  └─ Orchestrates entire startup
│       │
│       └─ Unit tests
│          └─ 3 tests covering core logic
│
└── llm.rs
    └─ warm_local_model() [Already exists]
       └─ Called after startup by app.rs
```

---

## Configuration Options

### Environment Variables

```bash
# Control which model to warm (default: llama3:latest)
OLLAMA_WARMUP_MODEL=llama2:13b

# Disable local AI entirely
KAEL_DISABLE_LOCAL_AI=1

# Increase verbosity
RUST_LOG=debug
RUST_LOG=services::local_ai_startup=debug
```

### Future Configuration File

```json
// ~/.config/kael-os/local_ai.json
{
  "enabled": true,
  "auto_download_models": true,
  "prefer_smaller_models": false,
  "max_startup_time_ms": 120000,
  "gpu_enabled": true,
  "retry_count": 10,
  "retry_backoff_ms": 500
}
```

---

## Integration with Other Systems

### Chat System (llm.rs)

```
local_ai_startup.rs
    │
    ├─ Provides recommended model
    │
    └─→ app.rs
        │
        ├─ Calls llm::warm_local_model()
        │
        └─→ chat.rs / llm.rs
            │
            ├─ If local ready: Use Ollama
            │
            └─ If local unavailable: Use cloud fallback
                (Mistral → Gemini → Copilot)
```

### Firebase Integration

```
local_ai_startup.rs
    [Detects capabilities]
        │
        └─→ logs to Firebase (optional future)
            Tracks:
            - User system specs
            - Startup success/failure
            - Model preferences
            - Performance metrics
```

---

## Error Handling Strategy

```
┌─ Ollama Check
│  ├─ Error: Installation missing
│  │  └─ Log warning, return gracefully
│  │     User can install later
│  │
│  ├─ Error: Service won't start
│  │  └─ Log error, return gracefully
│  │     Use cloud fallbacks
│  │
│  ├─ Error: Models won't download
│  │  └─ Log error, return gracefully
│  │     User can download manually
│  │
│  └─ Success: Everything ready
│     └─ Return full status
│        App uses local AI
│
└─ No Exceptions Thrown
   App always continues normally
   Falls back to cloud if needed
```

---

## Performance Optimization

### Current Optimizations

1. **Async/Await**: Non-blocking startup
2. **Exponential Backoff**: Reduces spam on retry
3. **Early Exit**: Skips phases if not needed
4. **Caching**: System capabilities detected once
5. **Timeout Handling**: Max wait time prevents hanging

### Future Optimizations

1. **Parallel Checks**: Check multiple services simultaneously
2. **Model Predownload**: Download in background after launch
3. **Metrics Collection**: Track startup times over time
4. **Smart Caching**: Cache model availability
5. **Selective Startup**: Only start models user prefers

---

## Troubleshooting Flowchart

```
App Starts
    │
    ▼
Local AI Startup Begins
    │
    ├─ "❌ Ollama not installed"
    │  └─ User action: Install from ollama.ai
    │
    ├─ "⚠️  Ollama won't start"
    │  └─ Check logs: systemctl status ollama
    │
    ├─ "⚠️  No models found"
    │  └─ Models auto-downloading...
    │
    ├─ "✅ Ollama ready"
    │  └─ Everything good, enjoy local AI!
    │
    └─ "⚠️  Startup timed out"
       └─ Cloud fallbacks active
          (App works, just slower)
```

---

## Testing Strategy

```
Unit Tests (in local_ai_startup.rs):
├─ test_system_capabilities_detection()
│  └─ Verifies CPU, RAM detection accuracy
│
├─ test_recommend_model()
│  └─ Verifies model selection logic
│
└─ test_model_recommendations_by_ram()
   └─ Verifies RAM-based recommendations

Integration Tests (via app.rs):
├─ Full startup sequence works
├─ Graceful degradation if no local AI
└─ Warm model is available after startup

Manual Tests:
├─ Desktop app launches
├─ Check logs for startup messages
├─ Test with local models available
├─ Test without Ollama installed
└─ Test with limited RAM systems
```

---

## Future Enhancement Path

### Phase 1 (Current)

- ✅ Ollama support
- ✅ System detection
- ✅ Auto-startup
- ✅ Model recommendations

### Phase 2 (Next)

- LM Studio support
- Jan app integration
- Model predownloading
- Startup metrics

### Phase 3 (Long-term)

- llama.cpp native support
- vLLM integration
- Distributed model serving
- Custom model hosting

---

**Last Updated**: December 15, 2025
**Architecture Revision**: 1.0
**Status**: Production Ready ✅
