# Kael-OS-AI User Guide

Welcome to Kael-OS-AI! This guide will help you get started and make the most of your AI-powered desktop companion.

## Table of Contents

1. [Introduction](#introduction)
2. [Installation](#installation)
3. [Getting Started](#getting-started)
4. [Core Features](#core-features)
5. [Configuration](#configuration)
6. [Troubleshooting](#troubleshooting)
7. [Tips & Best Practices](#tips--best-practices)

---

## Introduction

### What is Kael-OS-AI?

Kael-OS-AI is an AI-native desktop application that provides:

- **Multi-Provider AI Chat**: Talk to local (Ollama) and cloud AI (Gemini, Mistral, GitHub Copilot)
- **Integrated Terminal**: Execute shell commands with AI assistance
- **Hybrid Intelligence**: Combine local privacy with cloud capabilities
- **Project Management**: Track your apps and projects
- **Offline-First Design**: Core features work without internet
- **Secure by Default**: Encrypted API key storage, local data

### Who Is This For?

- **Developers**: Code assistance, terminal commands, project planning
- **Power Users**: System automation, multi-AI workflows
- **Privacy-Conscious Users**: Local AI option with no cloud dependency
- **AI Enthusiasts**: Experiment with multiple AI providers in one app

---

## Installation

### Prerequisites

Before installing Kael-OS-AI, ensure you have:

1. **Operating System**:

   - Linux (recommended: Arch Linux, Ubuntu 22.04+)
   - macOS 10.15+
   - Windows 10+

2. **System Libraries** (Linux):

   ```bash
   # Arch Linux
   sudo pacman -S webkit2gtk gtk3 libayatana-appindicator

   # Ubuntu/Debian
   sudo apt install libwebkit2gtk-4.0-dev libgtk-3-dev libayatana-appindicator3-dev
   ```

3. **Rust Toolchain** (for building from source):

   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

4. **Optional - Ollama** (for local AI):

   ```bash
   # Linux
   curl -fsSL https://ollama.com/install.sh | sh

   # macOS
   brew install ollama

   # Then pull a model
   ollama pull llama3.2
   ```

### Building from Source

```bash
# Clone repository
git clone https://github.com/yourusername/Kael-OS-AI
cd Kael-OS-AI

# Build release binary
cd src-tauri
cargo build --release

# Binary location
./target/release/kael-os
```

### Running the Application

```bash
# From source (development)
cd src-tauri
cargo run

# Pre-built binary
./kael-os

# With debug logging
RUST_LOG=debug ./kael-os
```

---

## Getting Started

### First Launch

When you first launch Kael-OS-AI:

1. **System Detection**: The app automatically detects your:

   - CPU, RAM, and GPU
   - Operating system
   - Installed Ollama models
   - Available AI capabilities

2. **Local AI Initialization**: If Ollama is installed:

   - Checks if Ollama service is running
   - Starts Ollama if needed
   - Warms up default model for faster responses
   - Reports available models

3. **Interface Layout**:
   - **Header**: Kael branding and user info
   - **Chat Panel** (center): AI conversation interface
   - **Terminal Panel** (bottom): Integrated shell
   - **Settings** (gear icon): Configuration and API keys

### Your First Chat

1. Type a message in the chat input at the bottom
2. Press Enter or click Send
3. The AI responds using:
   - Local Ollama (if available)
   - Cloud providers (if API keys configured)

**Example First Message**:

```
Tell me about this system
```

The AI will respond with information about your hardware and software, detected automatically!

### Understanding Hybrid Mode

**Hybrid Mode** combines local and cloud AI:

- **Enabled** (🔄 icon): Tries local AI first, falls back to cloud if needed
- **Disabled** (🏠 icon): Uses only local Ollama (fully offline)

Toggle in Settings → Hybrid Assist

---

## Core Features

### 1. AI Chat Panel

The main chat interface for conversing with AI.

#### Using Different Providers

1. Click **Settings** (gear icon)
2. Scroll to **AI Providers**
3. Select provider:
   - **Ollama** (local, free, private)
   - **Google Gemini** (requires API key)
   - **Mistral AI** (requires API key)
   - **GitHub Copilot** (requires GitHub auth)

#### Provider-Specific Features

**Ollama (Local)**:

- ✅ Completely offline
- ✅ No API costs
- ✅ Full privacy
- ⚠️ Slower than cloud (depends on hardware)
- ⚠️ Requires local installation

**Google Gemini**:

- ✅ Fast responses
- ✅ Advanced reasoning
- ✅ Free tier available
- ⚠️ Requires API key
- ⚠️ Data sent to Google

**Mistral AI**:

- ✅ European-based
- ✅ Fast and efficient
- ⚠️ Requires API key
- ⚠️ Paid service

**GitHub Copilot**:

- ✅ Code-focused
- ✅ Integration with GitHub
- ⚠️ Requires GitHub subscription
- ⚠️ GitHub account needed

#### Chat Features

**Message History**:

- All messages stored locally in SQLite
- Survives app restart
- Clear history: Settings → Clear Chat

**Context Awareness**:

- AI knows your system specs (CPU, RAM, OS)
- Provides system-specific advice
- Suggests compatible commands for your OS

**Markdown Support**:

- Code blocks with syntax highlighting
- Lists and formatting
- Links and emphasis

### 2. Terminal Integration

Execute shell commands directly from the app.

#### Basic Usage

1. Click Terminal panel (bottom)
2. Type command
3. Press Enter
4. Output appears below

**Example Commands**:

```bash
ls -la                    # List files
df -h                     # Disk usage
ps aux | grep kael        # Process list
uname -a                  # System info
```

#### Terminal Features

**PTY Emulation**:

- Full pseudo-terminal
- Interactive programs work (vim, nano, htop)
- ANSI color support
- Command history (up/down arrows)

**Sudo Support**:

- Commands requiring root access
- Password prompt appears
- Secure password handling

**Arch Linux Translation**:

- Automatically translates package manager commands
- `apt install` → `pacman -S` or `paru -S`
- `brew install` → `paru -S`
- Suggests Arch equivalents

**Example Translation**:

```
You type:    sudo apt install nodejs
Kael sees:   sudo pacman -S nodejs
```

#### AI-Assisted Commands

Ask the AI to help with commands:

```
User: "How do I find large files?"
AI:   "Use: find / -type f -size +100M 2>/dev/null"
```

Then run the suggested command directly in terminal!

### 3. Settings Panel

Configure the application to your preferences.

#### API Key Management

**Adding API Keys**:

1. Click Settings (gear icon)
2. Scroll to **API Keys**
3. Click **Add API Key**
4. Select provider (Gemini, Mistral, etc.)
5. Paste your API key
6. Click **Save**

**Security**:

- Keys encrypted with your user token
- Never stored in plaintext
- Cleared on logout

**Getting API Keys**:

- **Google Gemini**:
  1. Visit [ai.google.dev](https://ai.google.dev)
  2. Click "Get API Key"
  3. Create key in Google Cloud Console
- **Mistral AI**:

  1. Visit [console.mistral.ai](https://console.mistral.ai)
  2. Sign up
  3. Create API key in dashboard

- **GitHub Copilot**:
  1. Subscribe to GitHub Copilot
  2. Authenticate with `gh auth login`
  3. No additional setup needed

#### Authentication (Optional)

**Google/GitHub Sign-In**:

1. Settings → **Sign In**
2. Choose provider (Google or GitHub)
3. Browser opens for authentication
4. Return to app after successful login

**Benefits of Signing In**:

- Sync API keys across devices (via Firebase)
- Cloud backup of chat history
- Multi-device project tracking

**Privacy Note**: Sign-in is **optional**. All features work without it.

#### Provider Selection

**Setting Default Provider**:

1. Settings → **AI Providers**
2. Click on preferred provider
3. It becomes active for new chats

**Model Selection**:

- Each provider has multiple models
- Change in Settings → Provider → Model dropdown
- Example: Gemini Pro vs Gemini Flash

#### Hybrid Mode Settings

**Enable/Disable Hybrid Mode**:

Settings → **Hybrid Assist** toggle

- **ON**: Try local first, fallback to cloud
- **OFF**: Local Ollama only (full privacy)

**Automatic Behavior**:

- If no API keys: Hybrid mode auto-disabled
- If API keys present: Hybrid mode enabled
- Manual override always respected

### 4. Project Management (App Tracker)

Track your software projects and their status.

#### Project Statuses

- **Want**: Ideas you want to build
- **Making**: Currently in development
- **Testing**: Under testing/QA
- **Complete**: Finished projects

#### Managing Projects

**Add Project**:

1. Click **+ New Project**
2. Enter name and description
3. Select status
4. Click **Create**

**Update Status**:

1. Click on project
2. Change status dropdown
3. Auto-saves

**Delete Project**:

1. Click project
2. Click **Delete** button
3. Confirm

**Firebase Sync** (if signed in):

- Projects sync across devices
- Real-time updates
- Automatic backup

### 5. Brainstorm Panel

Collaborative AI brainstorming for ideas and planning.

#### Using Brainstorm

1. Click **Brainstorm** tab
2. Enter your topic or challenge
3. AI generates:

   - Problem breakdown
   - Solution ideas
   - Action items
   - Pros/cons analysis

4. Refine with follow-up prompts
5. Export results

**Example Workflow**:

```
Topic: "Build a habit tracking app"

AI generates:
- Feature ideas (reminders, streaks, analytics)
- Tech stack suggestions
- User interface concepts
- Development roadmap
```

#### Export Options

- **Markdown**: Download as .md file
- **Plain Text**: Copy to clipboard
- **JSON**: Structured data export

---

## Configuration

### Environment Variables

Create `.env.local` in the root directory:

```bash
# Ollama Configuration
OLLAMA_ENDPOINT=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2

# Google Gemini
GEMINI_API_KEY=your-gemini-key-here
GEMINI_MODEL=gemini-1.5-pro

# Mistral AI
MISTRAL_API_KEY=your-mistral-key-here
MISTRAL_MODEL=mistral-small

# Firebase (optional)
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id

# GitHub OAuth (optional)
GITHUB_OAUTH_CLIENT_ID=your-github-client-id
GITHUB_OAUTH_CLIENT_SECRET=your-github-client-secret

# Google OAuth (optional)
GOOGLE_OAUTH_CLIENT_ID=your-google-client-id
GOOGLE_OAUTH_CLIENT_SECRET=your-google-client-secret
```

### File Locations

**User Data Directory**:

- Linux: `~/.local/share/kael-os/`
- macOS: `~/Library/Application Support/com.kael.os/`
- Windows: `%APPDATA%\com.kael.os\`

**Files**:

- `kael.db`: SQLite database (chat history)
- `user.json`: Encrypted user session
- `api_keys.json`: Encrypted API keys
- `system_context.json`: Detected system info

### Firebase Setup (Optional)

For cloud sync and OAuth:

1. **Create Firebase Project**:

   - Visit [console.firebase.google.com](https://console.firebase.google.com)
   - Create new project
   - Enable Authentication (Google, GitHub)
   - Enable Firestore

2. **Get Credentials**:

   - Project Settings → General
   - Copy API key, Auth domain, Project ID

3. **Configure App**:

   - Add to `.env.local` (see above)
   - Restart Kael-OS-AI

4. **Verify**:
   - Sign in with Google/GitHub
   - Check Settings → Account info

---

## Troubleshooting

### Common Issues

#### "Ollama not found" Error

**Symptoms**: Chat says "Local AI unavailable"

**Solutions**:

1. Install Ollama:

   ```bash
   curl -fsSL https://ollama.com/install.sh | sh
   ```

2. Start Ollama service:

   ```bash
   ollama serve
   ```

3. Pull a model:

   ```bash
   ollama pull llama3.2
   ```

4. Restart Kael-OS-AI

---

#### "API Key Invalid" Error

**Symptoms**: Cloud provider fails with auth error

**Solutions**:

1. Verify API key in provider's console
2. Re-enter key in Settings
3. Check key has correct permissions
4. Ensure billing enabled (if required)

---

#### Terminal Commands Not Working

**Symptoms**: Commands fail or produce no output

**Solutions**:

1. Check command syntax
2. Verify you have permissions
3. Try with `sudo` if needed
4. Check if command exists: `which <command>`

**Linux-specific**:

```bash
# Install missing commands
sudo pacman -S <package>    # Arch
sudo apt install <package>  # Ubuntu
```

---

#### High CPU/Memory Usage

**Symptoms**: System slowdown during AI responses

**Solutions**:

1. Use smaller Ollama models (e.g., `phi3:mini`)
2. Enable hybrid mode (offload to cloud)
3. Close terminal if many PTY sessions open
4. Limit chat history length

**Check Memory**:

```bash
ps aux | grep kael-os
```

---

#### Firebase Sync Not Working

**Symptoms**: Projects/API keys don't sync across devices

**Solutions**:

1. Verify internet connection
2. Check Firebase credentials in `.env.local`
3. Sign out and sign back in
4. Check browser console for errors (press F12)

---

### Logging and Debugging

**Enable Debug Logs**:

```bash
RUST_LOG=debug ./kael-os 2>&1 | tee kael-debug.log
```

**View Logs**:

- Printed to terminal/console
- Saved to `kael-debug.log` if redirected
- Includes: API calls, database ops, system events

**Important Log Markers**:

- `🔍 Initializing system context` - System detection
- `🚀 Starting local AI initialization` - Ollama startup
- `🔄 Hybrid mode enabled` - Provider selection
- `✅ Message stored` - Chat history save

---

### Getting Help

**Resources**:

- **Documentation**: `/docs/` directory
- **GitHub Issues**: [github.com/yourrepo/issues](https://github.com/yourrepo/issues)
- **Community**: Discord/Forum link here

**Reporting Bugs**:

1. Enable debug logging
2. Reproduce the issue
3. Save log file
4. Create GitHub issue with:
   - OS and version
   - Kael-OS-AI version
   - Steps to reproduce
   - Log excerpt
   - Screenshots (if UI issue)

---

## Tips & Best Practices

### Performance Optimization

**For Faster Local AI**:

1. Use smaller models (phi3, gemma)
2. Pre-warm models at startup (automatic)
3. Keep Ollama running in background
4. Increase RAM allocation to Ollama:
   ```bash
   # In Ollama Modelfile
   PARAMETER num_ctx 4096
   ```

**For Better Cloud AI**:

1. Use API keys (faster than OAuth each time)
2. Choose appropriate model:
   - Fast: Gemini Flash, Mistral Small
   - Smart: Gemini Pro, Mistral Medium
3. Enable hybrid mode for automatic fallback

### Privacy Best Practices

**Maximum Privacy**:

1. Use only local Ollama (disable hybrid mode)
2. Don't sign in with Google/GitHub
3. No Firebase configuration
4. All data stays on your machine

**Balanced Privacy**:

1. Local AI for sensitive queries
2. Cloud AI for general questions
3. Review API provider privacy policies
4. Manually switch providers per conversation

### Workflow Tips

**For Developers**:

1. Keep terminal open for quick commands
2. Ask AI to generate code snippets
3. Use brainstorm for architecture planning
4. Track projects with App Tracker

**For System Administration**:

1. Ask AI for command help before running
2. Use terminal translations for cross-platform work
3. Save complex commands in chat history
4. System context helps AI suggest correct syntax

**For Content Creation**:

1. Brainstorm panel for idea generation
2. Multiple AI providers for different perspectives
3. Export brainstorms to Markdown
4. Use chat history as research archive

### Cost Management (Cloud AI)

**Minimizing API Costs**:

1. Use local Ollama when possible
2. Choose cheaper models (Gemini Flash, Mistral Small)
3. Enable hybrid mode (local first)
4. Monitor usage in provider dashboards
5. Set up billing alerts

**Free Tiers**:

- **Gemini**: 60 requests/minute free tier
- **Mistral**: Trial credits for new users
- **Copilot**: Included with GitHub subscription

### Security Best Practices

**API Key Safety**:

- Never share API keys
- Rotate keys periodically
- Use separate keys per app
- Revoke unused keys
- Monitor usage for anomalies

**System Security**:

- Don't run Kael-OS as root
- Review terminal commands before executing
- Use sudo only when necessary
- Keep system updated

**Data Backup**:

- Backup `~/.local/share/kael-os/` directory
- Export important chats to Markdown
- GPG-encrypt backups for security:
  ```bash
  tar czf kael-backup.tar.gz ~/.local/share/kael-os
  gpg -c kael-backup.tar.gz
  ```

---

## Keyboard Shortcuts

_Coming Soon_

| Shortcut     | Action         |
| ------------ | -------------- |
| `Ctrl+N`     | New chat       |
| `Ctrl+K`     | Clear chat     |
| `Ctrl+T`     | Focus terminal |
| `Ctrl+,`     | Open settings  |
| `Ctrl+Enter` | Send message   |

---

## Advanced Usage

### Custom Ollama Models

**Install Custom Model**:

```bash
# Pull from Ollama library
ollama pull codellama

# Use in Kael-OS
# Settings → Ollama → Model → codellama
```

**Create Custom Modelfile**:

```bash
# Create Modelfile
cat > Modelfile << EOF
FROM llama3.2
SYSTEM "You are a Rust programming expert."
PARAMETER temperature 0.7
EOF

# Build custom model
ollama create rust-expert -f Modelfile

# Use in Kael-OS
# Settings → Ollama → Model → rust-expert
```

### Scripting and Automation

**Export Chat to Script**:

1. Have conversation with AI about automation
2. AI provides commands
3. Copy from chat to script file
4. Make executable: `chmod +x script.sh`

**Example Workflow**:

```
User: "Create a backup script for my home directory"
AI: [Provides script]
User: [Copies to backup.sh]
Terminal: chmod +x backup.sh && ./backup.sh
```

---

## Updating Kael-OS-AI

### Check for Updates

```bash
# From source
git pull origin main
cd src-tauri
cargo build --release
```

### Version Info

Settings → About → Version

Shows:

- Current version
- Build date
- Rust version
- Available update (if any)

---

## Conclusion

Kael-OS-AI is designed to enhance your productivity while respecting your privacy. Start with local AI for privacy, add cloud providers for power, and customize to your workflow.

**Quick Start Checklist**:

- ✅ Install Ollama (optional but recommended)
- ✅ Pull an Ollama model
- ✅ Launch Kael-OS-AI
- ✅ Try a chat message
- ✅ Add API keys (if using cloud AI)
- ✅ Explore terminal integration
- ✅ Customize settings to your preferences

**Happy AI-assisted computing!**

---

**Document Version**: 1.0  
**Last Updated**: December 16, 2025  
**Project**: Kael-OS-AI v1.0.0
