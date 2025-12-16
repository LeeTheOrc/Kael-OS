# VS Code Continue Extension - Local AI Configuration

## Install Continue Extension

1. Open VS Code Extensions (Ctrl+Shift+X)
2. Search for "Continue"
3. Install "Continue - Codestral, Claude, and more"

## Configure for Local Ollama

After installation, create/edit: `~/.continue/config.json`

```json
{
  "models": [
    {
      "title": "DeepSeek Coder (Local GPU)",
      "provider": "ollama",
      "model": "deepseek-coder:33b",
      "apiBase": "http://localhost:11434"
    },
    {
      "title": "CodeLlama (Local GPU)",
      "provider": "ollama",
      "model": "codellama:34b",
      "apiBase": "http://localhost:11434"
    },
    {
      "title": "Phi3 Quick (CPU)",
      "provider": "ollama",
      "model": "phi3:latest",
      "apiBase": "http://localhost:11434"
    }
  ],
  "tabAutocompleteModel": {
    "title": "Phi3 Autocomplete",
    "provider": "ollama",
    "model": "phi3:latest",
    "apiBase": "http://localhost:11434"
  },
  "embeddingsProvider": {
    "provider": "ollama",
    "model": "nomic-embed-text",
    "apiBase": "http://localhost:11434"
  },
  "slashCommands": [
    {
      "name": "edit",
      "description": "Edit selected code"
    },
    {
      "name": "comment",
      "description": "Write comments for code"
    },
    {
      "name": "share",
      "description": "Export chat history"
    },
    {
      "name": "cmd",
      "description": "Generate shell commands"
    }
  ]
}
```

## Model GPU/CPU Configuration

Create Modelfile for each model to control GPU usage:

### Big Models (GPU) - deepseek-coder, codellama, mixtral

```bash
# These automatically use GPU with num_gpu layers
ollama show --modelfile deepseek-coder:33b
ollama show --modelfile codellama:34b
ollama show --modelfile mixtral:8x7b
```

### Small Models (CPU) - phi3, llama3

Force CPU-only by creating custom Modelfile:

```bash
# Phi3 CPU-only
cat > /tmp/phi3-cpu.Modelfile << 'EOF'
FROM phi3:latest
PARAMETER num_gpu 0
EOF

ollama create phi3-cpu -f /tmp/phi3-cpu.Modelfile

# Llama3 CPU-only
cat > /tmp/llama3-cpu.Modelfile << 'EOF'
FROM llama3:latest
PARAMETER num_gpu 0
EOF

ollama create llama3-cpu -f /tmp/llama3-cpu.Modelfile
```

## VS Code Settings

Add to `.vscode/settings.json`:

```json
{
  "continue.telemetryEnabled": false,
  "continue.enableTabAutocomplete": true
}
```

## Usage

- **Ctrl+L**: Open Continue chat
- **Ctrl+I**: Inline code edit
- Select code → Right-click → "Continue: Edit"
- Type `/` in chat for slash commands

## Cost Savings

- ✅ 100% local - no API costs
- ✅ GPU acceleration for big models (fast responses)
- ✅ CPU for small models (saves GPU for gaming/heavy tasks)
- ✅ Auto-complete with phi3 (instant, no latency)
