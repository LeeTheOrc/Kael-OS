# 🔥 Firebase Setup & Troubleshooting Guide

## Quick Fix for 403 Permission Errors

If you're seeing `403 Forbidden - Missing or insufficient permissions` errors, follow these steps:

### Option 1: Deploy Rules via CLI (Recommended)

```bash
# 1. Install Firebase CLI (if not already installed)
npm install -g firebase-tools

# 2. Login to Firebase
firebase login

# 3. Deploy the updated rules
./deploy-firestore-rules.sh
```

### Option 2: Update Rules Manually in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Firestore Database** → **Rules**
4. Replace the rules with the content from `firestore.rules`
5. Click **Publish**

## What the Rules Do

The updated Firestore security rules allow authenticated users to access:

- ✅ `/users/{userId}/credentials/{credentialId}` - OAuth credentials
- ✅ `/users/{userId}/api_keys/{keyId}` - Encrypted API keys (Gemini, Mistral, etc.)
- ✅ `/users/{userId}/gpg_keys/{keyId}` - Encrypted GPG private keys
- ✅ `/users/{userId}/projects/{projectId}` - Project data

**Security:** Each user can ONLY access their own data. The rules enforce this with:
```javascript
allow read, write: if request.auth != null && request.auth.uid == userId;
```

## Environment Variables Required

Make sure these are set (check `.env` or `.env.local`):

```bash
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app
```

## Testing the Fix

After deploying the rules:

1. **Start the app:**
   ```bash
   cargo run --bin kael-os
   ```

2. **Login with Firebase** (if not already logged in)

3. **Test GPG Backup:**
   - Go to **Settings** → **Security** tab
   - Click **"List Local Keys"** - should show your GPG keys
   - Click **"Backup to Firebase"** - should succeed with ✅ message
   - Click **"List Cloud Backups"** - should show backed up keys

4. **Test API Key Storage:**
   - Go to **Settings** → **API Keys** tab
   - Save a test API key
   - Refresh the app - key should persist

## Common Issues

### Issue: "Firebase CLI not found"
**Solution:**
```bash
npm install -g firebase-tools
```

### Issue: "Not authenticated"
**Solution:**
```bash
firebase login
```

### Issue: "No default project"
**Solution:**
```bash
firebase use --add
# Select your project from the list
```

### Issue: "Rules deployment failed"
**Solution:**
1. Check that `firebase.json` exists in the project root
2. Make sure you're in the correct directory
3. Try deploying from Firebase Console instead (Option 2 above)

### Issue: Still getting 403 after deploying rules
**Solution:**
1. Wait 1-2 minutes for rules to propagate
2. Check Firebase Console → Firestore → Rules to verify they were deployed
3. Make sure you're logged in with the correct Firebase account
4. Verify `VITE_FIREBASE_PROJECT_ID` matches your actual project ID

## Firebase Project Structure

After successful setup, your Firestore database will have:

```
firestore
└── users
    └── {user_id}
        ├── credentials/
        │   └── {credential_id}
        │       ├── name: "google_oauth"
        │       └── value: "encrypted_token_data"
        ├── api_keys/
        │   └── {key_id}
        │       ├── name: "gemini_api_key"
        │       └── value: "encrypted_api_key"
        ├── gpg_keys/
        │   └── {key_id}
        │       ├── key_id: "ABCD1234..."
        │       ├── key_data: "encrypted_gpg_private_key"
        │       └── backed_up_at: "2025-12-16T10:00:00Z"
        └── projects/
            └── {project_id}
                ├── name: "My Project"
                ├── path: "/home/user/project"
                └── ...
```

## Security Notes

🔒 **All sensitive data is encrypted before upload:**
- API keys are encrypted with `AES-256-GCM` using your Firebase UID as the key
- GPG private keys are encrypted with the same method
- Only you (with your Firebase UID) can decrypt your data

🔒 **Firestore rules enforce user isolation:**
- You can only read/write your own `/users/{your_uid}/` documents
- Other users cannot access your encrypted data
- Even if someone got your encrypted data, they need your Firebase UID to decrypt it

## Verification

To verify everything is working:

```bash
# 1. Check if rules are deployed
firebase firestore:rules:get

# 2. Test authentication
curl -X GET \
  "https://firestore.googleapis.com/v1/projects/YOUR_PROJECT_ID/databases/(default)/documents/users/YOUR_UID/api_keys" \
  -H "Authorization: Bearer YOUR_ID_TOKEN"

# Should return 200 OK with your encrypted keys
```

## Need Help?

If you're still having issues:

1. Check the [Firebase Console](https://console.firebase.google.com) for error logs
2. Look at the app terminal output for detailed error messages
3. Verify your environment variables are set correctly
4. Make sure you're logged in with Firebase Authentication (not just Firestore)

---

**Last Updated:** 2025-12-16  
**Status:** ✅ Rules updated to support all required collections
