# Cloud Code Extension Setup Guide

## Current Status

✅ **Cloud Code Extension Installed**
- Extension ID: `googlecloudtools.cloudcode-2.37.0`
- Firebase Data Connect: `googlecloudtools.firebase-dataconnect-vscode-2.0.0`

✅ **VS Code Settings Configured**
- Project ID: `kael-os`
- Project Number: `623895641528`
- Firebase project linked

## What You Can Do Now

### 1. Access Cloud Code Features in VS Code

The Cloud Code extension gives you access to:
- 🔥 **Firebase Management** - Deploy functions, rules, and view data
- ☁️ **Cloud Run** - Deploy containerized applications
- 📊 **Cloud APIs** - Enable and manage Google Cloud APIs
- 🔍 **Cloud Monitoring** - View logs and metrics
- 🗄️ **Firestore** - Browse and edit database directly in VS Code

### 2. View Firebase Project

In VS Code:
1. Open Command Palette (`Ctrl+Shift+P`)
2. Type: "Firebase: Open Project in Console"
3. Opens `https://console.firebase.google.com/project/kael-os`

### 3. Deploy Firestore Rules (Alternative to CLI)

You can now use Cloud Code UI:
1. Open Command Palette
2. Type: "Firebase: Deploy"
3. Select "Firestore Rules"

### 4. Browse Firestore Database

1. Open Firebase Explorer in the sidebar (🔥 icon)
2. Navigate to your collections:
   - `users/{userId}/api_keys`
   - `users/{userId}/gpg_keys`
   - `users/{userId}/projects`

## Optional: Install gcloud CLI

For more advanced features, you can install the Google Cloud CLI:

```bash
# On Arch/CachyOS
paru -S google-cloud-sdk

# Or using install script
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud init
```

Then authenticate and set project:
```bash
gcloud auth login
gcloud config set project kael-os
```

## What's Already Working

Without gcloud CLI, you can still:
- ✅ Deploy Firebase rules via Firebase CLI (`firebase deploy`)
- ✅ Use Firebase emulators
- ✅ View Firebase console from VS Code
- ✅ Edit and deploy Firebase functions
- ✅ Manage Firestore data visually

The Cloud Code extension uses Firebase CLI (which you have installed) for most operations, so you're already fully functional!

## Verification

Your configuration is correct:
- **Project ID**: `kael-os` ✅
- **Project Number**: `623895641528` ✅
- **Firebase CLI**: Authenticated ✅
- **Firestore Rules**: Deployed ✅

## Quick Actions

### Deploy Firestore Rules (3 ways)

**Method 1: Script (Recommended)**
```bash
cd /home/leetheorc/Kael-os/Kael-OS-AI
./deploy-firestore-rules.sh
```

**Method 2: Firebase CLI**
```bash
firebase deploy --only firestore:rules
```

**Method 3: VS Code Command Palette**
- `Ctrl+Shift+P` → "Firebase: Deploy"

### View Firestore Data

**Method 1: VS Code Firebase Explorer**
- Click Firebase icon in sidebar
- Browse collections

**Method 2: Firebase Console**
- `Ctrl+Shift+P` → "Firebase: Open Project in Console"
- Navigate to Firestore Database

**Method 3: Direct Link**
- https://console.firebase.google.com/project/kael-os/firestore

---

**Status**: ✅ Cloud Code extension is configured correctly!  
**Project**: `kael-os` (623895641528)  
**Last Updated**: 2025-12-16
