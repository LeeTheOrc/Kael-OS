#!/bin/bash
# Deploy Firestore Security Rules
# This script deploys the updated security rules to Firebase

set -e

echo "🔒 Deploying Firestore Security Rules..."

# Check if firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found"
    echo "💡 Install with: npm install -g firebase-tools"
    exit 1
fi

# Check if logged in
if ! firebase projects:list &> /dev/null; then
    echo "🔐 Not logged in to Firebase"
    echo "💡 Running: firebase login"
    firebase login
fi

# Deploy rules
echo "📤 Deploying Firestore rules..."
firebase deploy --only firestore:rules

echo "✅ Firestore rules deployed successfully!"
echo ""
echo "📋 Rules now allow access to:"
echo "   - users/{userId}/credentials/{credentialId}"
echo "   - users/{userId}/api_keys/{keyId}"
echo "   - users/{userId}/gpg_keys/{keyId}"
echo "   - users/{userId}/projects/{projectId}"
echo ""
echo "🔒 Security: All collections are protected - users can only access their own data"
