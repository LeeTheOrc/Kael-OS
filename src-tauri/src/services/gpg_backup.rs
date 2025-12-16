// GPG Key Backup/Restore Module
// Saves GPG private key to Firebase for OS reinstall recovery

use crate::auth::User;
use crate::firebase;
use reqwest::Client;
use serde_json::json;
use std::process::Command;

/// Export GPG private key
pub fn export_gpg_key(key_id: &str) -> Result<String, String> {
    let output = Command::new("gpg")
        .args(&["--export-secret-keys", "--armor", key_id])
        .output()
        .map_err(|e| format!("Failed to export GPG key: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("GPG export failed: {}", stderr));
    }

    let key_data = String::from_utf8(output.stdout)
        .map_err(|e| format!("Invalid UTF-8 in GPG key: {}", e))?;

    if key_data.is_empty() {
        return Err(format!("GPG key '{}' not found", key_id));
    }

    Ok(key_data)
}

/// Import GPG private key
pub fn import_gpg_key(key_data: &str) -> Result<String, String> {
    let mut child = Command::new("gpg")
        .args(&["--import", "--batch"])
        .stdin(std::process::Stdio::piped())
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to spawn GPG import: {}", e))?;

    if let Some(mut stdin) = child.stdin.take() {
        use std::io::Write;
        stdin
            .write_all(key_data.as_bytes())
            .map_err(|e| format!("Failed to write to GPG stdin: {}", e))?;
    }

    let output = child
        .wait_with_output()
        .map_err(|e| format!("Failed to wait for GPG: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("GPG import failed: {}", stderr));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    Ok(stdout.to_string())
}

/// List available GPG keys
pub fn list_gpg_keys() -> Result<Vec<String>, String> {
    let output = Command::new("gpg")
        .args(&["--list-secret-keys", "--with-colons"])
        .output()
        .map_err(|e| format!("Failed to list GPG keys: {}", e))?;

    if !output.status.success() {
        return Ok(Vec::new()); // No keys available
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut keys = Vec::new();

    for line in stdout.lines() {
        if line.starts_with("sec:") {
            let parts: Vec<&str> = line.split(':').collect();
            if parts.len() > 4 {
                let key_id = parts[4].to_string();
                keys.push(key_id);
            }
        }
    }

    Ok(keys)
}

/// Save GPG key to Firebase
pub async fn backup_gpg_key(user: &User, key_id: &str) -> Result<(), String> {
    log::info!("🔐 Backing up GPG key: {}", key_id);

    // Export the GPG key
    let key_data = export_gpg_key(key_id)?;

    // Encrypt the key data before uploading
    let encrypted_key = crate::auth::encrypt_secret(user, &key_data);

    // Get project ID
    let project_id = std::env::var("VITE_FIREBASE_PROJECT_ID")
        .map_err(|_| "Missing VITE_FIREBASE_PROJECT_ID".to_string())?;
        
    let url = format!(
        "https://firestore.googleapis.com/v1/projects/{}/databases/(default)/documents/users/{}/gpg_keys/{}",
        project_id, user.uid, key_id
    );

    let payload = json!({
        "fields": {
            "key_id": {"stringValue": key_id},
            "key_data": {"stringValue": encrypted_key},
            "backed_up_at": {"timestampValue": chrono::Utc::now().to_rfc3339()},
        }
    });

    let client = Client::new();
    let response = client
        .patch(&url)
        .bearer_auth(&user.id_token)
        .query(&[("updateMask.fieldPaths", "key_id")])
        .query(&[("updateMask.fieldPaths", "key_data")])
        .query(&[("updateMask.fieldPaths", "backed_up_at")])
        .json(&payload)
        .send()
        .await
        .map_err(|e| format!("Failed to backup GPG key: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(format!("Firestore error ({}): {}", status, text));
    }

    log::info!("✅ GPG key backed up to Firebase");
    Ok(())
}

/// Restore GPG key from Firebase
pub async fn restore_gpg_key(user: &User, key_id: &str) -> Result<String, String> {
    log::info!("🔐 Restoring GPG key: {}", key_id);

    // Get project ID
    let project_id = std::env::var("VITE_FIREBASE_PROJECT_ID")
        .map_err(|_| "Missing VITE_FIREBASE_PROJECT_ID".to_string())?;
        
    let url = format!(
        "https://firestore.googleapis.com/v1/projects/{}/databases/(default)/documents/users/{}/gpg_keys/{}",
        project_id, user.uid, key_id
    );

    let client = Client::new();
    let response = client
        .get(&url)        .bearer_auth(&user.id_token)        .send()
        .await
        .map_err(|e| format!("Failed to restore GPG key: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        return Err(format!("GPG key not found in backup ({})", status));
    }

    #[derive(serde::Deserialize)]
    struct GpgKeyDoc {
        fields: GpgKeyFields,
    }

    #[derive(serde::Deserialize)]
    struct GpgKeyFields {
        key_data: StringValue,
    }

    #[derive(serde::Deserialize)]
    #[allow(non_snake_case)]
    struct StringValue {
        stringValue: String,
    }

    let doc: GpgKeyDoc = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse GPG key: {}", e))?;

    let encrypted_key = doc.fields.key_data.stringValue;

    // Decrypt the key data
    let key_data = crate::auth::decrypt_secret(user, &encrypted_key)
        .ok_or_else(|| "Failed to decrypt GPG key".to_string())?;

    // Import the key
    let result = import_gpg_key(&key_data)?;

    log::info!("✅ GPG key restored from Firebase");
    Ok(result)
}

/// List all backed up GPG keys
pub async fn list_backed_up_keys(user: &User) -> Result<Vec<String>, String> {
    let project_id = std::env::var("VITE_FIREBASE_PROJECT_ID")
        .map_err(|_| "Missing VITE_FIREBASE_PROJECT_ID".to_string())?;
        
    let url = format!(
        "https://firestore.googleapis.com/v1/projects/{}/databases/(default)/documents/users/{}/gpg_keys",
        project_id, user.uid
    );

    let client = Client::new();
    let response = client
        .get(&url)
        .bearer_auth(&user.id_token)
        .send()
        .await
        .map_err(|e| format!("Failed to list GPG keys: {}", e))?;

    if !response.status().is_success() {
        return Ok(Vec::new()); // No keys backed up yet
    }

    #[derive(serde::Deserialize)]
    struct ListResponse {
        documents: Option<Vec<KeyDoc>>,
    }

    #[derive(serde::Deserialize)]
    struct KeyDoc {
        fields: KeyFields,
    }

    #[derive(serde::Deserialize)]
    struct KeyFields {
        key_id: StringValue,
    }

    #[derive(serde::Deserialize)]
    #[allow(non_snake_case)]
    struct StringValue {
        stringValue: String,
    }

    let list: ListResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse key list: {}", e))?;

    let keys = list
        .documents
        .unwrap_or_default()
        .into_iter()
        .map(|doc| doc.fields.key_id.stringValue)
        .collect();

    Ok(keys)
}
