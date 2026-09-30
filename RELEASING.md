# Releasing Rock Battery

This document describes how to create and publish official releases for **Rock Battery** on GitHub, including the **Automatic Android APK Build**.

---

## 🏷️ Release Automation via GitHub Actions

Rock Battery features an automated multi-platform release pipeline defined in [`.github/workflows/release.yml`](.github/workflows/release.yml).

Whenever a Git tag following the pattern `v*.*.*` is pushed to GitHub, the workflow automatically:
1. **Android APK Compilation**:
   - Boots Java 17 Temurin and the official Android SDK.
   - Executes Gradle build (`./gradlew assembleRelease`).
   - Automatically outputs `rock-battery-vX.Y.Z.apk`.
2. **Web Companion Build**:
   - Runs linting and static type checking (`npm run lint`).
   - Compiles production distribution (`npm run build`).
   - Generates `rock-battery-vX.Y.Z-web-bundle.zip` and `.tar.gz`.
3. **GitHub Release Publication**:
   - Creates the release on GitHub with release notes.
   - Attaches `rock-battery-vX.Y.Z.apk` directly to the release assets for instant user download and installation.

---

## 📱 Release Assets

Every release includes:
- **`rock-battery-vX.Y.Z.apk`**: Installable Android application (Kotlin + Jetpack Compose, Material 3, Hilt, DataStore).
- **`rock-battery-vX.Y.Z-web-bundle.zip`**: Standalone web telemetry companion bundle.
- **`rock-battery-vX.Y.Z-web-bundle.tar.gz`**: Gzipped archive of web distribution.

---

## 🚀 How to Publish a New Release

### Step 1: Ensure Working Tree is Clean & Tested
```bash
npm run lint
npm run build
```

### Step 2: Update Version & Changelog
Update `package.json` and `android/app/build.gradle.kts`:
```json
{
  "version": "1.4.0"
}
```

### Step 3: Create an Annotated Git Tag
```bash
git tag -a v1.4.0 -m "Release v1.4.0: Native Android APK & Hardware Telemetry Engine"
```

### Step 4: Push Commit and Tag to GitHub
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

The workflow will compile the APK, build the web assets, and publish both to `https://github.com/sayanth/rock-battery/releases`.
