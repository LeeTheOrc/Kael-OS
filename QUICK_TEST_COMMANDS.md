# ⚡ Quick Test Commands - Copy & Paste Ready

**App Location**: `/home/leetheorc/Kael-os/Kael-OS-AI/target/release/kael-os`

---

## 🎯 THE TWO KEY TEST COMMANDS

### TEST 1: LOCAL AI (Ollama)
Copy & paste this exactly:

```
How do I install Discord?
```

**Expected Result**:
- ✅ Provider shows: "Ollama" or "local"
- ✅ Response time: < 5 seconds
- ✅ No cloud API call made
- ✅ Hardware detection shown: "16 cores, NVMe, nvidia GPU, fish shell"

**What This Tests**:
- Local AI decision tree (should stay local)
- Hardware context detection working
- Ollama connectivity
- Key storage working (if you added keys)

---

### TEST 2: CLOUD AI (Mistral/Gemini)
Copy & paste this exactly:

```
Write a Rust function that sorts arrays efficiently
```

**Expected Result**:
- ✅ Provider shows: "Mistral" or "Gemini"
- ✅ Response time: 2-5 seconds (network delay expected)
- ✅ Cloud API call made (visible in logs/chat)
- ✅ Complete Rust code with explanation
- ✅ Shows "Escalating to cloud AI for this task"

**What This Tests**:
- Cloud AI escalation working correctly
- Pattern matching decision tree
- Cloud API keys working
- Code generation quality
- Context awareness in response

---

## 🔐 KEY STORAGE TEST

Before running tests:

```bash
# Check if keys persist
# 1. Launch app and ADD your API keys
# 2. Close app completely
# 3. Relaunch app
# 4. Keys should be filled in automatically

# If keys disappeared:
# Run this diagnostic:
./test_key_storage.sh
```

---

## 📊 SMART REFORMATTING TESTS

### Test 3: Network Interface Auto-Fix
```
ip link set wlan0 up
```
**Expected Correction Note**:
```
"Updated network interface: wlan0 → wlp4s0 (your actual interface)"
```

### Test 4: Package Manager Auto-Fix
```
yay -S nginx
```
**Expected Correction Note**:
```
"Changed yay → paru (your preferred AUR helper)"
```

### Test 5: Shell Syntax Auto-Fix
```
export MY_VAR=value
```
**Expected Correction Note** (if using fish):
```
"Converted bash export syntax → fish set syntax"
```
**Response should show**:
```
set -x MY_VAR value
```

---

## ✅ WHAT YOU'LL SEE IN CHAT

### When Local AI Handles It:
```
🤖 Kael: I'll handle this locally with Ollama.

Smart context detected:
• System: Arch Linux
• CPU: 16 cores
• Storage: NVMe SSD
• GPU: NVIDIA
• Shell: fish
• WiFi: wlan0

[Response from Ollama...]

ℹ️ via Ollama (local AI)
```

### When Cloud AI Escalates:
```
🤖 Kael: This requires deeper reasoning - escalating to cloud AI.

Smart context detected:
• System: Arch Linux
• CPU: 16 cores
• Storage: NVMe SSD
• GPU: NVIDIA
• Shell: fish
• WiFi: wlan0

[Making request to Mistral API...]

[Complete code response...]

ℹ️ via Mistral (cloud AI)
```

### With Corrections Applied:
```
🤖 Kael: Found some improvements to make:

Correction: Updated network interface: wlan0 → wlp4s0 (your actual interface)
Correction: Changed yay → paru (your preferred AUR helper)

[Sending corrected command to AI...]

[Response...]
```

---

## 🚀 QUICK START

### Step 1: Launch
```bash
/home/leetheorc/Kael-os/Kael-OS-AI/target/release/kael-os
```

## 📦 Package Install (Arch/AUR)

### Build + Install from PKGBUILD
```bash
cd /home/leetheorc/Kael-os/Kael-OS-AI
makepkg -si
```

**What happens automatically:**
- Installs `ollama` dependency
- Starts `ollama` service
- Downloads `llama3:latest` (~4.7GB)
- Downloads `phi3:latest` (~2.3GB)

### Verify models
```bash
ollama list
```
Expect to see `llama3:latest` and `phi3:latest`.

### Step 2: Test Local AI
```
Type: How do I install Discord?
Wait: Response from Ollama
Verify: Says "via Ollama"
```

### Step 3: Test Cloud AI
```
Type: Write a Rust function that sorts arrays efficiently
Wait: Response from Mistral/Gemini
Verify: Says "via Mistral" or "via Gemini"
```

### Step 4: Test Smart Reformatting
```
Type: yay -S discord
Verify: Shows correction "yay → paru"
```

### Step 5: Test Key Storage
```
1. Close app
2. Relaunch app
3. Check: Are API keys still there?
4. Result: YES = Encryption working! ✅
```

---

## 📈 PERFORMANCE CHECKLIST

```
⏱️ Launch to ready screen: ___ seconds (expect: <2s)
⏱️ First LOCAL response: ___ seconds (expect: <5s)
⏱️ First CLOUD response: ___ seconds (expect: 2-5s)
⏱️ Hardware detection: ___ ms (expect: ~50ms first, <1ms cached)
💾 Keys saved between restarts: [YES/NO]
🔄 Provider switching works: [YES/NO]
```

---

## ❌ TROUBLESHOOTING

### "Ollama error - can't connect"
```
# Make sure Ollama is running:
ollama serve

# In another terminal, test:
curl http://localhost:11434/api/tags
```

### "Cloud API error - check keys"
```
# Verify your keys in the settings panel
# Check they're copied exactly (no extra spaces)
# Test API key directly if needed
```

### "Hardware detection shows wrong values"
```
# Run diagnostic:
./test_hardware_detection.sh

# Compare actual vs detected
# Report differences to us
```

### "Keys not saving/loading"
```
# Run diagnostic:
./test_key_storage.sh

# Check: ~/.config/kael-os/keys.db exists
# Report: Any encryption errors
```

---

## 📝 REPORT TEMPLATE

When you're done, tell us:

```
✅ LOCAL AI TEST:
   Command: "How do I install Discord?"
   Result: [Worked/Failed]
   Provider: [Ollama/Mistral/Neither]
   Time: ___ seconds

✅ CLOUD AI TEST:
   Command: "Write a Rust function..."
   Result: [Worked/Failed]
   Provider: [Ollama/Mistral/Gemini]
   Time: ___ seconds
   Code Quality: [Good/OK/Poor]

✅ KEY STORAGE:
   Saved on restart: [YES/NO]

✅ SMART REFORMATTING:
   Package manager fix: [Worked/Failed]
   Interface fix: [Worked/Failed]
   Shell fix: [Worked/Failed]

❌ ANY ISSUES:
   [List bugs, crashes, weird behavior]

💡 FEEDBACK:
   [What was good? What needs work?]
```

---

**Build Status**: ✅ Complete (33.91s)  
**Tests Included**: 4/4 Passing  
**Ready**: YES - Go test it! 🚀

---

*Kael-OS v0.3.0-beta*  
*Quick Test Guide - December 14, 2025*
