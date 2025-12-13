//! GitHub Releases API uploader
//! Creates releases and uploads assets without requiring the `gh` CLI

use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Clone)]
pub struct GitHubUploader {
    owner: String,
    repo: String,
    token: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GitHubRelease {
    pub id: u64,
    pub tag_name: String,
    pub name: String,
    pub body: String,
    pub draft: bool,
    pub prerelease: bool,
}

#[derive(Debug, Serialize)]
pub struct CreateReleaseRequest {
    pub tag_name: String,
    pub name: String,
    pub body: String,
    pub draft: bool,
    pub prerelease: bool,
}

impl GitHubUploader {
    /// Create a new GitHub uploader
    pub fn new(owner: String, repo: String, token: String) -> Self {
        Self { owner, repo, token }
    }

    /// Create a release (or fetch existing if it already exists)
    pub async fn create_or_get_release(
        &self,
        tag: &str,
        name: &str,
        body: &str,
    ) -> Result<GitHubRelease, Box<dyn std::error::Error>> {
        // First, try to fetch existing release
        if let Ok(release) = self.get_release(tag).await {
            return Ok(release);
        }

        // Create new release
        let url = format!(
            "https://api.github.com/repos/{}/{}/releases",
            self.owner, self.repo
        );

        let request = CreateReleaseRequest {
            tag_name: tag.to_string(),
            name: name.to_string(),
            body: body.to_string(),
            draft: false,
            prerelease: tag.contains("alpha") || tag.contains("beta"),
        };

        let client = reqwest::Client::new();
        let response = client
            .post(&url)
            .header("Authorization", format!("token {}", self.token))
            .header("Accept", "application/vnd.github.v3+json")
            .header("User-Agent", "kael-os")
            .json(&request)
            .send()
            .await?;

        if response.status().is_success() {
            Ok(response.json().await?)
        } else {
            let err_text = response.text().await.unwrap_or_default();
            Err(format!("Failed to create release: {}", err_text).into())
        }
    }

    /// Get an existing release by tag
    pub async fn get_release(
        &self,
        tag: &str,
    ) -> Result<GitHubRelease, Box<dyn std::error::Error>> {
        let url = format!(
            "https://api.github.com/repos/{}/{}/releases/tags/{}",
            self.owner, self.repo, tag
        );

        let client = reqwest::Client::new();
        let response = client
            .get(&url)
            .header("Authorization", format!("token {}", self.token))
            .header("Accept", "application/vnd.github.v3+json")
            .header("User-Agent", "kael-os")
            .send()
            .await?;

        if response.status().is_success() {
            Ok(response.json().await?)
        } else {
            Err("Release not found".into())
        }
    }

    /// Upload an asset to a release
    pub async fn upload_asset(
        &self,
        release_id: u64,
        file_path: &Path,
        file_name: &str,
    ) -> Result<String, Box<dyn std::error::Error>> {
        let file_data = tokio::fs::read(file_path).await?;

        let url = format!(
            "https://uploads.github.com/repos/{}/{}/releases/{}/assets?name={}",
            self.owner, self.repo, release_id, file_name
        );

        let client = reqwest::Client::new();
        let response = client
            .post(&url)
            .header("Authorization", format!("token {}", self.token))
            .header("Accept", "application/vnd.github.v3+json")
            .header("Content-Type", "application/octet-stream")
            .header("User-Agent", "kael-os")
            .body(file_data)
            .send()
            .await?;

        if response.status().is_success() {
            let json: serde_json::Value = response.json().await?;
            let download_url = json["browser_download_url"]
                .as_str()
                .unwrap_or("https://github.com/releases")
                .to_string();
            Ok(download_url)
        } else {
            let err_text = response.text().await.unwrap_or_default();
            Err(format!("Failed to upload asset: {}", err_text).into())
        }
    }

    /// Upload multiple files to a release
    pub async fn upload_assets(
        &self,
        release_id: u64,
        files: Vec<(String, String)>, // (file_path, file_name)
    ) -> Result<Vec<String>, Box<dyn std::error::Error>> {
        let mut urls = Vec::new();
        for (file_path, file_name) in files {
            let path = Path::new(&file_path);
            let url = self.upload_asset(release_id, path, &file_name).await?;
            urls.push(url);
        }
        Ok(urls)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_uploader_creation() {
        let uploader = GitHubUploader::new(
            "LeeTheOrc".to_string(),
            "kael-os".to_string(),
            "test-token".to_string(),
        );
        assert_eq!(uploader.owner, "LeeTheOrc");
        assert_eq!(uploader.repo, "kael-os");
    }

    #[test]
    fn test_release_request_serialization() {
        let req = CreateReleaseRequest {
            tag_name: "v1.0.0".to_string(),
            name: "Release 1.0.0".to_string(),
            body: "Stable release".to_string(),
            draft: false,
            prerelease: false,
        };

        let json = serde_json::to_string(&req).unwrap();
        assert!(json.contains("v1.0.0"));
    }
}
