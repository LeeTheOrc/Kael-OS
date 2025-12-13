# {{APP_NAME}} Project Structure

This project adheres to **strict semantic versioning**:

- `v0.0.1-alpha.N` — Alpha releases (internal testing, features incomplete)
- `v0.1.0-beta.N` — Beta releases (feature-complete, testing phase)
- `v1.0.0-release.N` — Production releases (stable, battle-tested)

## Versioning Workflow

### 1. During Development (Alpha)
```bash
bash scripts/bump-version.sh alpha
```
Increments the build number within alpha (e.g., v0.0.1-alpha.1 → v0.0.1-alpha.2).

### 2. Ready for Testing (Beta)
```bash
bash scripts/bump-version.sh beta
```
Moves to beta and increments minor version (e.g., v0.0.1-alpha.2 → v0.1.0-beta.1).

### 3. Production Release
```bash
bash scripts/bump-version.sh release
```
Moves to release and increments major version (e.g., v0.1.0-beta.3 → v1.0.0-release.1).

### 4. Subsequent Releases
```bash
bash scripts/bump-version.sh release
```
Increments patch within release (e.g., v1.0.0-release.1 → v1.0.0-release.2).

## Current Version

See `version.json` for the current version, timestamp, and description.

```bash
cat version.json | jq .
```

## Automatic Version Tracking

- `version.json` is updated automatically on each `bump-version.sh` call.
- Build systems and CI/CD should read from `version.json` for tag names, artifact naming, and release notes.
- Never manually edit `version.json` — always use `bash scripts/bump-version.sh`.
