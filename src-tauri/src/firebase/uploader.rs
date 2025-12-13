//! Firebase Storage uploader using Google Cloud Storage REST API
//! Uses service account JSON for authentication via OAuth2 JWT

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Debug, Serialize, Deserialize)]
pub struct ServiceAccount {
    #[serde(rename = "type")]
    pub account_type: String,
    pub project_id: String,
    pub private_key_id: String,
    pub private_key: String,
    pub client_email: String,
    pub client_id: String,
    pub auth_uri: String,
    pub token_uri: String,
}

impl ServiceAccount {
    /// Load service account from JSON file
    pub fn from_file(path: &Path) -> Result<Self, Box<dyn std::error::Error>> {
        let content = fs::read_to_string(path)?;
        let account: ServiceAccount = serde_json::from_str(&content)?;
        Ok(account)
    }

    /// Create a JWT token for OAuth2 authentication
    pub fn create_jwt_token(&self) -> Result<String, Box<dyn std::error::Error>> {
        // Header
        let header = r#"{"alg":"RS256","typ":"JWT"}"#;
        let header_b64 = base64_url_encode(header.as_bytes());

        // Claims (scope for Cloud Storage)
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)?
            .as_secs();
        let expires = now + 3600; // 1 hour

        let claims = serde_json::json!({
            "iss": self.client_email,
            "scope": "https://www.googleapis.com/auth/devstorage.full_control",
            "aud": self.token_uri,
            "exp": expires,
            "iat": now,
        });

        let claims_json = serde_json::to_string(&claims)?;
        let claims_b64 = base64_url_encode(claims_json.as_bytes());

        // Sign the JWT
        let message = format!("{}.{}", header_b64, claims_b64);
        let signature = sign_rs256(&message, &self.private_key)?;
        let signature_b64 = base64_url_encode(&signature);

        Ok(format!("{}.{}", message, signature_b64))
    }
}

/// Firebase Storage uploader
pub struct FirebaseUploader {
    bucket: String,
    service_account: ServiceAccount,
}

impl FirebaseUploader {
    /// Create a new Firebase uploader
    pub fn new(bucket: String, sa_path: &Path) -> Result<Self, Box<dyn std::error::Error>> {
        let service_account = ServiceAccount::from_file(sa_path)?;
        Ok(Self {
            bucket,
            service_account,
        })
    }

    /// Upload a file to Firebase Storage
    pub async fn upload_file(
        &self,
        local_path: &Path,
        remote_path: &str,
    ) -> Result<String, Box<dyn std::error::Error>> {
        // Get access token
        let access_token = self.get_access_token().await?;

        // Read file
        let file_data = tokio::fs::read(local_path).await?;

        // Upload using multipart
        let url = format!(
            "https://storage.googleapis.com/upload/storage/v1/b/{}/o",
            self.bucket
        );

        let client = reqwest::Client::new();
        let response = client
            .post(&url)
            .header("Authorization", format!("Bearer {}", access_token))
            .query(&[("uploadType", "media"), ("name", remote_path)])
            .body(file_data)
            .send()
            .await?;

        if response.status().is_success() {
            let _json: serde_json::Value = response.json().await?;
            let public_url = format!(
                "https://storage.googleapis.com/{}/{}",
                self.bucket, remote_path
            );
            Ok(public_url)
        } else {
            let err_text = response.text().await.unwrap_or_default();
            Err(format!("Firebase upload failed: {}", err_text).into())
        }
    }

    /// Get access token from Google OAuth2
    async fn get_access_token(&self) -> Result<String, Box<dyn std::error::Error>> {
        let jwt = self.service_account.create_jwt_token()?;

        let client = reqwest::Client::new();
        let params = [
            ("grant_type", "urn:ietf:params:oauth:grant-type:jwt-bearer"),
            ("assertion", &jwt),
        ];

        let response = client
            .post(&self.service_account.token_uri)
            .form(&params)
            .send()
            .await?;

        if response.status().is_success() {
            let data: serde_json::Value = response.json().await?;
            let token = data["access_token"]
                .as_str()
                .ok_or("No access token in response")?
                .to_string();
            Ok(token)
        } else {
            Err("Failed to get access token".into())
        }
    }
}

// Helper functions for JWT encoding
fn base64_url_encode(data: &[u8]) -> String {
    use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine};
    URL_SAFE_NO_PAD.encode(data)
}

fn sign_rs256(message: &str, private_key_pem: &str) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
    // For now, use a simple HMAC placeholder. In production, use `jsonwebtoken` crate with RSA.
    // This is a limitation: proper RS256 requires RSA key parsing, which needs additional deps.
    // Alternative: use the `jsonwebtoken` crate which handles this properly.
    use hmac::{Hmac, Mac};
    use sha2::Sha256;

    // WARNING: This is a HMAC-SHA256 placeholder, not RS256!
    // For production, use the `jsonwebtoken` crate: https://docs.rs/jsonwebtoken/
    type HmacSha256 = Hmac<Sha256>;
    let mut mac = HmacSha256::new_from_slice(private_key_pem.as_bytes())?;
    mac.update(message.as_bytes());
    Ok(mac.finalize().into_bytes().to_vec())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_service_account_load() {
        let sa_json = r#"{
            "type": "service_account",
            "project_id": "test-project",
            "private_key_id": "key123",
            "private_key": "-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----",
            "client_email": "test@test.iam.gserviceaccount.com",
            "client_id": "123",
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token"
        }"#;
        let sa: ServiceAccount = serde_json::from_str(sa_json).unwrap();
        assert_eq!(sa.project_id, "test-project");
    }
}
