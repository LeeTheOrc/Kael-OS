#![allow(dead_code)]

//! App scaffolding module for creating new versioned projects
//! When users create a new app in Kael-OS, it automatically inherits the versioning system

use serde_json::json;
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone)]
pub struct AppTemplate {
    pub name: String,
    pub path: PathBuf,
    pub description: String,
}

impl AppTemplate {
    /// Create a new versioned app project
    pub fn scaffold(
        app_name: &str,
        app_path: &Path,
        description: &str,
    ) -> Result<(), Box<dyn std::error::Error>> {
        // Create root directory
        fs::create_dir_all(app_path)?;

        // Create version.json with template substitutions
        let timestamp = chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Secs, true);
        let version_json = json!({
            "major": 0,
            "minor": 0,
            "patch": 1,
            "stage": "alpha",
            "build": 1,
            "timestamp": timestamp,
            "description": format!("Initial alpha release of {}", app_name),
            "app_name": app_name
        });

        let version_path = app_path.join("version.json");
        fs::write(&version_path, serde_json::to_string_pretty(&version_json)?)?;

        // Create scripts directory
        let scripts_dir = app_path.join("scripts");
        fs::create_dir_all(&scripts_dir)?;

        // Create bump-version.sh script inline
        let bump_script_content = format!(
            r#"#!/usr/bin/env bash
set -euo pipefail

# Version bump utility for {}
# Strict semantic versioning: v0.0.1-alpha → v0.1.0-beta → v1.0.0-release

VERSION_FILE="version.json"
if [[ ! -f "$VERSION_FILE" ]]; then
  echo "Error: $VERSION_FILE not found" >&2
  exit 1
fi

STAGE="${{1:-alpha}}"

if [[ ! "$STAGE" =~ ^(alpha|beta|release)$ ]]; then
  echo "Usage: bash scripts/bump-version.sh [alpha|beta|release]" >&2
  exit 1
fi

MAJOR=$(jq -r '.major' "$VERSION_FILE")
MINOR=$(jq -r '.minor' "$VERSION_FILE")
PATCH=$(jq -r '.patch' "$VERSION_FILE")
CURRENT_STAGE=$(jq -r '.stage' "$VERSION_FILE")
BUILD=$(jq -r '.build' "$VERSION_FILE")

case "$CURRENT_STAGE:$STAGE" in
  alpha:alpha)
    BUILD=$((BUILD + 1))
    ;;
  alpha:beta|beta:beta)
    if [[ "$CURRENT_STAGE" == "alpha" ]]; then
      MINOR=$((MINOR + 1))
      PATCH=0
      BUILD=1
    else
      BUILD=$((BUILD + 1))
    fi
    ;;
  beta:release|release:release|alpha:release)
    if [[ "$CURRENT_STAGE" != "release" ]]; then
      MAJOR=$((MAJOR + 1))
      MINOR=0
      PATCH=0
      BUILD=1
    else
      PATCH=$((PATCH + 1))
      BUILD=$((BUILD + 1))
    fi
    ;;
  *)
    echo "Invalid stage transition: $CURRENT_STAGE → $STAGE" >&2
    exit 1
    ;;
esac

VERSION="${{MAJOR}}.${{MINOR}}.${{PATCH}}"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

jq --arg major "$MAJOR" --arg minor "$MINOR" --arg patch "$PATCH" --arg stage "$STAGE" --arg build "$BUILD" --arg ts "$TIMESTAMP" \
   '.major = ($major | tonumber) | .minor = ($minor | tonumber) | .patch = ($patch | tonumber) | .stage = $stage | .build = ($build | tonumber) | .timestamp = $ts' \
   "$VERSION_FILE" > "$VERSION_FILE.tmp" && mv "$VERSION_FILE.tmp" "$VERSION_FILE"

echo "✓ Bumped to v${{VERSION}}-${{STAGE}}.${{BUILD}}"
cat "$VERSION_FILE" | jq .
"#,
            app_name
        );
        let bump_script_path = scripts_dir.join("bump-version.sh");
        fs::write(&bump_script_path, bump_script_content)?;
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            fs::set_permissions(&bump_script_path, fs::Permissions::from_mode(0o755))?;
        }

        // Create README with versioning info
        let readme_content = format!(
            r#"# {}

{}

## Versioning

This project uses strict semantic versioning:
- `v0.0.1-alpha.N` — Alpha (development)
- `v0.1.0-beta.N` — Beta (testing)
- `v1.0.0-release.N` — Production

### Bump Version
```bash
bash scripts/bump-version.sh [alpha|beta|release]
```

**alpha → beta**: Increments minor version
**beta → release**: Increments major version
**release → release**: Increments patch version
"#,
            app_name, description
        );
        fs::write(app_path.join("README.md"), readme_content)?;

        // Create basic structure
        for dir in &["src", "dist", "docs"] {
            let dir_path = app_path.join(dir);
            fs::create_dir_all(&dir_path)?;
            fs::write(dir_path.join(".gitkeep"), "")?;
        }

        Ok(())
    }
}
