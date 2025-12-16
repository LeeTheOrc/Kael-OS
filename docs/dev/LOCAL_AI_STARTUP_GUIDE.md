# 🚀 Local AI Auto-Startup System

## Overview

The Kael-OS app now includes an intelligent local AI startup manager that runs automatically when the app launches. This system:

- ✅ **Detects your system capabilities** (CPU cores, RAM, GPU, NVMe)
- ✅ **Checks for installed local AI services** (currently Ollama, extensible for others)
- ✅ **Automatically starts services** that fit your system
- ✅ **Downloads recommended models** based on your hardware
- ✅ **Warms up models** for instant first-request performance
- ✅ **Falls back to cloud AI** if local services fail

## How It Works

### 1. **System Detection Phase** (Fast - ~100ms)

When the app opens, it detects:

- **CPU Cores**: Number of processor cores available
- **RAM**: Total system memory (in GB)
- **GPU**: Type (NVIDIA, AMD ROCm, Intel iGPU) and name
- **Storage**: Whether you have NVMe storage (important for model loading speed)

```bash
# What you'll see in logs:
📊 System Capabilities: 16 cores, 32.0GB RAM, GPU: NVIDIA: RTX 3090, NVMe: Yes
```

### 2. **Service Check Phase** (Fast - ~1-2s)

Checks if Ollama (or other local AI services) is:

- ✅ Installed
- ✅ Running
- ✅ Has models downloaded

```bash
# Possible states:
✅ Ollama already running
⚠️  Ollama installed but not running (will attempt to start)
❌ Ollama not installed (will suggest installation)
```

### 3. **Service Startup Phase** (Medium - 2-10s)

If Ollama isn't running, the system tries to start it using:

1. **systemctl --user** (preferred - user service)
2. **sudo systemctl** (if user service unavailable)
3. **nohup** (direct spawn as fallback)

```bash
# You'll see:
🔵 Attempting to start Ollama service...
⏳ Waiting for Ollama to be ready (max 10 retries)...
✅ Ollama is ready!
```

### 4. **Model Recommendation Phase** (Fast - ~100ms)

If Ollama is running but has no models, the system recommends models based on your hardware:

**For 16GB+ RAM systems:**

- `llama2:13b` - Powerful reasoning model
- `mistral` - Fast, balanced model

**For 8-16GB RAM systems:**

- `llama2:7b` - Good balance of speed/quality
- `neural-chat` - Optimized for conversation

**For <8GB RAM systems:**

- `phi` - Tiny, fast model
- `orca-mini` - Efficient reasoning model

**With GPU available:**

- Additional `wizard-vicuna-uncensored` for GPU acceleration

### 5. **Model Download Phase** (Slow - 5-30 minutes depending on model size)

Recommended models are automatically downloaded if needed:

```bash
📦 Attempting to download model: llama2:13b
⏳ Downloading... (this is a large file, be patient)
✅ Downloaded model: llama2:13b
```

### 6. **Model Warmup Phase** (Medium - 1-5s)

Once a model is ready, the system loads it into memory so the first request is instant:

```bash
✅ Local AI model warmup complete for: llama2:13b
```

## What You'll See in the App

### Startup Log Example:

```
🚀 === LOCAL AI STARTUP SEQUENCE ===
🚀 Initializing local AI services...
📊 System: 16 cores, 32.0GB RAM, GPU: NVIDIA: RTX 3090, NVMe: Yes
🔍 Checking Ollama...
✅ Ollama already running!
✅ Ollama ready with models: llama2:13b, mistral:latest, neural-chat
✅ Local AI model warmup complete for: llama2:13b
🏁 Startup completed in 2450ms
```

### If Ollama isn't installed:

```
🚀 === LOCAL AI STARTUP SEQUENCE ===
📊 System: 16 cores, 32.0GB RAM, GPU: NVIDIA, NVMe: Yes
🔍 Checking Ollama...
⚠️  Ollama not installed. Install from: https://ollama.ai
🏁 Startup completed in 150ms
```

### If Ollama needs models downloaded:

```
🚀 === LOCAL AI STARTUP SEQUENCE ===
🔍 Checking Ollama...
🔵 Starting Ollama service...
✅ Ollama is running!
⚠️  Ollama running but no models installed
📦 Recommended models: llama2:13b, mistral:latest
📥 Downloading models (this takes time, be patient)...
📦 Attempting to download model: llama2:13b
✅ Downloaded: llama2:13b
✅ Local AI model warmup complete for: llama2:13b
🏁 Startup completed in 18500ms
```

## Configuration

### Environment Variables

You can customize the startup behavior with these variables:

```bash
# Specify which model to warmup (default: llama3:latest)
export OLLAMA_WARMUP_MODEL=llama2:13b

# Disable local AI entirely (for testing cloud-only)
export KAEL_DISABLE_LOCAL_AI=1

# Increase startup verbosity
export RUST_LOG=debug
```

### Timeout Behavior

- **Service startup timeout**: 10 retries with exponential backoff (max 5s per retry)
- **Model download timeout**: No timeout (models will download completely)
- **Model warmup timeout**: 30 seconds

If services don't start within the timeout, the app will:

1. Log a warning
2. Mark local AI as unavailable
3. Use cloud AI fallbacks instead
4. Continue normal operation

## Manual Operations

If you want to manage Ollama manually:

```bash
# Start Ollama service
ollama serve

# In another terminal, list models
ollama list

# Download a specific model
ollama pull llama2:13b

# Stop Ollama
pkill ollama
```

## Troubleshooting

### "Ollama not found"

**Solution**: Install from https://ollama.ai

```bash
# On Linux (most distros)
curl https://ollama.ai/install.sh | sh

# On Arch Linux
sudo pacman -S ollama
```

### "Ollama starts but has no models"

**Solution**: The system will try to download them. If it doesn't:

```bash
# Manually download a model
ollama pull llama2:13b

# Or download faster model if low on bandwidth
ollama pull phi
```

### "Ollama crashes or won't start"

**Solution**: Check if Ollama service is configured correctly:

```bash
# Check if systemd service exists
systemctl --user status ollama

# If not, you may need to install it properly
# Reinstall: curl https://ollama.ai/install.sh | sh
```

### "First request still takes 5+ seconds with local AI"

**Solution**: The model isn't loaded in memory. This can happen if:

- Ollama service restarted
- System ran out of VRAM/RAM
- Model file was moved

**Fix**: Let the app warmup the model again on next restart, or manually:

```bash
# This forces the model to load
ollama run llama2:13b "hello"
```

### "App is slow during startup"

**Solution**: This is normal! The app is:

1. Starting Ollama (1-3s)
2. Downloading models if needed (5-30 minutes, one-time only)
3. Loading model into VRAM (1-5s)

**Total first-time startup**: 5 minutes to 30+ minutes depending on your connection and model size.

**Subsequent startups**: 2-5 seconds (just loading model from disk to VRAM)

## Performance Tips

### Optimize for Speed

```bash
# Use a smaller, faster model
ollama pull phi        # ~2.3GB, very fast
ollama pull orca-mini  # ~1.4GB, still capable

# Use quantized models (smaller, faster, less VRAM)
ollama pull neural-chat  # Optimized quantization
```

### Optimize for Quality

```bash
# Use larger models if you have the RAM
ollama pull llama2:13b   # 8.5GB, excellent quality
ollama pull mistral      # 4.7GB, very good quality

# With GPU, you can run bigger models faster
# Check: nvidia-smi (for NVIDIA cards)
```

### For Low-Resource Systems

```bash
# Disable local AI completely and use cloud
# Set in app settings: Use cloud AI only

# Or use the tiniest model
ollama pull orca-mini
```

## Next Steps

Once local AI is running, you can:

1. **Test local AI**: Ask simple questions like "How do I install Discord?"
2. **Check the logs**: Open Developer Tools (F12) to see detailed startup info
3. **Switch providers**: In Settings, toggle between Ollama, Mistral, Gemini
4. **Add API keys**: In Settings, add keys for cloud fallbacks
5. **Configure cache**: The app caches provider keys locally for offline use

## Future Enhancements

The startup system is designed to be extensible. Future local AI services that could be added:

- **LM Studio**: GUI-based local LLM manager
- **Jan**: User-friendly LLM desktop application
- **llama.cpp**: Ultra-fast C++ inference
- **vLLM**: Production-grade inference engine
- **Ollama alternatives**: Other local model runners

The current architecture makes it easy to add new services by implementing the same interface as Ollama.

---

**Last Updated**: December 15, 2025
**Kael-OS Version**: 0.3.0-beta
