#![allow(dead_code)]

//! Version management module for Kael-OS
//! Reads version.json and provides version info to the app

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Version {
    pub major: u32,
    pub minor: u32,
    pub patch: u32,
    pub stage: String, // "alpha", "beta", "release"
    pub build: u32,
    pub timestamp: String,
    pub description: Option<String>,
}

impl Version {
    /// Load version from version.json
    pub fn load(path: &Path) -> Result<Self, Box<dyn std::error::Error>> {
        let content = fs::read_to_string(path)?;
        let version: Version = serde_json::from_str(&content)?;
        Ok(version)
    }

    /// Get full version string (e.g., "0.0.1-alpha.1")
    pub fn to_string(&self) -> String {
        format!(
            "{}.{}.{}-{}.{}",
            self.major, self.minor, self.patch, self.stage, self.build
        )
    }

    /// Get semantic version only (e.g., "0.0.1")
    pub fn semver(&self) -> String {
        format!("{}.{}.{}", self.major, self.minor, self.patch)
    }

    /// Check if this is a release version
    pub fn is_release(&self) -> bool {
        self.stage == "release"
    }

    /// Check if this is a beta version
    pub fn is_beta(&self) -> bool {
        self.stage == "beta"
    }

    /// Check if this is an alpha version
    pub fn is_alpha(&self) -> bool {
        self.stage == "alpha"
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_version_string() {
        let v = Version {
            major: 0,
            minor: 0,
            patch: 1,
            stage: "alpha".to_string(),
            build: 1,
            timestamp: "2025-12-14T00:00:00Z".to_string(),
            description: None,
        };
        assert_eq!(v.to_string(), "0.0.1-alpha.1");
        assert_eq!(v.semver(), "0.0.1");
        assert!(v.is_alpha());
    }
}
