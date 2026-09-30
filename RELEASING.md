# Releasing Rock Battery

This document describes how to create and publish official releases for **Rock Battery** on GitHub.

---

## 🏷️ Release Automation via GitHub Actions

Rock Battery uses an automated release pipeline defined in [`.github/workflows/release.yml`](.github/workflows/release.yml).

Whenever a Git tag following the pattern `v*.*.*` is pushed to GitHub, the workflow automatically:
1. Validates types and linting (`npm run lint`).
2. Compiles the production build bundle (`npm run build`).
3. Packages the production assets into:
   - `rock-battery-vX.Y.Z-bundle.zip`
   - `rock-battery-vX.Y.Z-bundle.tar.gz`
4. Publishes a new **GitHub Release** with automated changelog notes and attaches the binary bundles.

---

## 🚀 How to Publish a New Release

### Step 1: Ensure Working Tree is Clean & Tested
```bash
npm run lint
npm run build
```

### Step 2: Update Version & Changelog
Update `package.json` and document changes in `CHANGELOG.md`:
```json
{
  "version": "1.4.0"
}
```

### Step 3: Create an Annotated Git Tag
```bash
git tag -a v1.4.0 -m "Release v1.4.0: Production Telemetry & CI Stabilization"
```

### Step 4: Push the Commit and Tag to GitHub
```bash
git push origin main
git push origin v1.4.0
```

---

## ⚡ Manual Release via GitHub Actions UI

You can also trigger a release directly from the GitHub web interface:
1. Navigate to your repository on GitHub: `https://github.com/sayanth/rock-battery`.
2. Click **Actions** &rarr; select **Release Application** in the left sidebar.
3. Click **Run workflow**.
4. Enter the tag name (e.g., `v1.4.0`) and click **Run workflow**.

The workflow will build, package, and publish the release to `https://github.com/sayanth/rock-battery/releases`.
