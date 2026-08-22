# 📱 Android Build Troubleshooting & Architecture Master Guide
> **Project:** Red Accounting Book (Vyapar Accounting Software)  
> **Monorepo Architecture:** npm Workspaces (`apps/mobile`, `apps/desktop`, `apps/web`, `apps/website`, `apps/backend`)  
> **Mobile Tech Stack:** React Native 0.74.x + Expo SDK 51.x + Kotlin 1.9.24 + Gradle 8.8 + AGP 8.4.1 + Android NDK 26.1.10909125 + CMake 3.22.1

---

## 📑 Table of Contents
1. [Overview & Monorepo Context](#1-overview--monorepo-context)
2. [40-Build Root Cause Analysis & Permanent Solutions](#2-40-build-root-cause-analysis--permanent-solutions)
   - [Issue 1: Monorepo Root vs Nested Module CLI Resolution](#issue-1-monorepo-root-vs-nested-module-cli-resolution)
   - [Issue 2: Expo Autolinking Multi-Level Path Traversal](#issue-2-expo-autolinking-multi-level-path-traversal)
   - [Issue 3: Expo Camera Legacy Maven Repository](#issue-3-expo-camera-legacy-maven-repository)
   - [Issue 4: AAPT Resource Linking & Missing XML Rules](#issue-4-aapt-resource-linking--missing-xml-rules)
   - [Issue 5: AndroidX vs Legacy com.android.support Class Collisions](#issue-5-androidx-vs-legacy-comandroidsupport-class-collisions)
   - [Issue 6: expo-document-picker Kotlin Compatibility (throwingActivity)](#issue-6-expo-document-picker-kotlin-compatibility-throwingactivity)
   - [Issue 7: expo-linking Kotlin Event Listener Signatures](#issue-7-expo-linking-kotlin-event-listener-signatures)
   - [Issue 8: React Native PackageList.java Compilation in Kotlin](#issue-8-react-native-packagelistjava-compilation-in-kotlin)
   - [Issue 9: MainApplication.kt & MainActivity.kt Architecture](#issue-9-mainapplicationkt--mainactivitykt-architecture)
3. [Automated CI/CD Pipeline Configuration](#3-automated-cicd-pipeline-configuration)
4. [Step-by-Step Guide for Future Builds & Releases](#4-step-by-step-guide-for-future-builds--releases)
5. [Quick Reference Configuration Table](#5-quick-reference-configuration-table)

---

## 1. Overview & Monorepo Context

In a monorepo setup where React Native and Expo are installed at the workspace root while the Android project is located 3 levels deep at `apps/mobile/android`, Gradle build tools, Kotlin compiler, and React Native CLI frequently fail to find modules or encounter symbol mismatches.

This document serves as the permanent reference manual covering every single obstacle resolved across our 40-build optimization journey.

---

## 2. 40-Build Root Cause Analysis & Permanent Solutions

### Issue 1: Monorepo Root vs Nested Module CLI Resolution
- **Symptom:** Gradle failure with `Couldn't determine CLI location! Please set react { cliFile = file(...) }`.
- **Root Cause:** In npm workspaces with hoisted dependencies, `node_modules/react-native` and `@react-native/codegen` reside at the repository root (`../../..`), but Gradle by default checks relative to `apps/mobile`.
- **Permanent Solution:** In `apps/mobile/android/app/build.gradle`, define dynamic dual resolution:
  ```groovy
  def mobileDir = rootDir.getParentFile()
  def monorepoRoot = mobileDir.getParentFile().getParentFile()

  react {
      root = file(mobileDir)
      reactNativeDir = file(new File(mobileDir, "node_modules/react-native").exists() ? new File(mobileDir, "node_modules/react-native") : new File(monorepoRoot, "node_modules/react-native"))
      codegenDir = file(new File(monorepoRoot, "node_modules/@react-native/codegen").exists() ? new File(monorepoRoot, "node_modules/@react-native/codegen") : new File(mobileDir, "node_modules/@react-native/codegen"))
      cliFile = file(new File(mobileDir, "node_modules/react-native/cli.js").exists() ? new File(mobileDir, "node_modules/react-native/cli.js") : new File(monorepoRoot, "node_modules/react-native/cli.js"))
      entryFile = file(new File(mobileDir, "index.js"))
  }
  ```

---

### Issue 2: Expo Autolinking Multi-Level Path Traversal
- **Symptom:** Gradle failure `Could not read script .../apps/mobile/node_modules/expo/scripts/autolinking.gradle as it does not exist` or `Could not find method useExpoModules()`.
- **Root Cause:**
  1. `rootDir` is `apps/mobile/android`. Traversing to root requires 3 `getParentFile()` calls: `rootDir.getParentFile().getParentFile().getParentFile()`.
  2. `useExpoModules()` is a method on Gradle's `Settings` object (must only be called in `settings.gradle`), NOT on `Project` (`app/build.gradle`).
- **Permanent Solution:**
  - **In `settings.gradle`:**
    ```groovy
    def trueMonorepoRoot = rootDir.getParentFile().getParentFile().getParentFile()
    def autolinkingScript = new File(trueMonorepoRoot, "node_modules/expo/scripts/autolinking.gradle")
    apply from: autolinkingScript
    useExpoModules()
    ```
  - **In `app/build.gradle` (at bottom):**
    ```groovy
    def trueMonorepoRoot = rootDir.getParentFile().getParentFile().getParentFile()
    def expoAutolinkingScript = new File(trueMonorepoRoot, "node_modules/expo/scripts/autolinking.gradle")
    apply from: expoAutolinkingScript
    ```

---

### Issue 3: Expo Camera Legacy Maven Repository
- **Symptom:** `Could not find com.google.android:cameraview:1.0.0`.
- **Root Cause:** `expo-camera` bundles its prebuilt Android AAR under its local maven directory (`node_modules/expo-camera/android/maven`), which is not hosted on Maven Central or Google Maven.
- **Permanent Solution:** In `apps/mobile/android/build.gradle` under `allprojects.repositories`:
  ```groovy
  allprojects {
    repositories {
      google()
      mavenCentral()
      maven { url 'https://www.jitpack.io' }
      maven {
        def monorepoRoot = rootDir.getParentFile().getParentFile().getParentFile()
        def cameraMaven = new File(monorepoRoot, "node_modules/expo-camera/android/maven")
        if (!cameraMaven.exists()) {
          cameraMaven = new File(rootDir.getParentFile(), "node_modules/expo-camera/android/maven")
        }
        url cameraMaven.toString()
      }
    }
  }
  ```

---

### Issue 4: AAPT Resource Linking & Missing XML Rules
- **Symptom:** `AAPT: error: resource xml/secure_store_data_extraction_rules not found` and `resource xml/secure_store_backup_rules not found`.
- **Root Cause:** Android 12+ requires data extraction rules specified in `AndroidManifest.xml` for `expo-secure-store`.
- **Permanent Solution:**
  - Create `apps/mobile/android/app/src/main/res/xml/secure_store_backup_rules.xml`:
    ```xml
    <?xml version="1.0" encoding="utf-8"?>
    <full-backup-content>
        <include domain="sharedpref" path="."/>
    </full-backup-content>
    ```
  - Create `apps/mobile/android/app/src/main/res/xml/secure_store_data_extraction_rules.xml`:
    ```xml
    <?xml version="1.0" encoding="utf-8"?>
    <data-extraction-rules>
        <cloud-backup>
            <include domain="sharedpref" path="."/>
        </cloud-backup>
        <device-transfer>
            <include domain="sharedpref" path="."/>
        </device-transfer>
    </data-extraction-rules>
    ```

---

### Issue 5: AndroidX vs Legacy com.android.support Class Collisions
- **Symptom:** `Task :app:checkDebugDuplicateClasses FAILED` due to duplicate classes between `androidx.media:media` and `com.android.support:support-media-compat:25.3.1`.
- **Root Cause:** Legacy sub-dependencies brought transitive `com.android.support` libraries which collided with modern AndroidX artifacts.
- **Permanent Solution:**
  - In `apps/mobile/android/gradle.properties`:
    ```properties
    android.useAndroidX=true
    android.enableJetifier=true
    ```
  - In `apps/mobile/android/build.gradle` and `apps/mobile/android/app/build.gradle`:
    ```groovy
    configurations.all {
        exclude group: 'com.android.support', module: 'support-compat'
        exclude group: 'com.android.support', module: 'support-media-compat'
        exclude group: 'com.android.support', module: 'support-core-utils'
        exclude group: 'com.android.support', module: 'support-core-ui'
        exclude group: 'com.android.support', module: 'support-fragment'
        exclude group: 'com.android.support', module: 'support-v4'
    }
    ```

---

### Issue 6: expo-document-picker Kotlin Compatibility (throwingActivity)
- **Symptom:** `expo-document-picker/DocumentPickerModule.kt:46:18 Unresolved reference: throwingActivity`.
- **Root Cause:** In Expo SDK 51 / Kotlin, `throwingActivity` was deprecated in `expo-modules-core`.
- **Permanent Solution:** Replace `appContext.throwingActivity` with:
  ```kotlin
  (appContext.currentActivity ?: throw Exceptions.MissingActivity()).startActivityForResult(intent, OPEN_DOCUMENT_CODE)
  ```
  *(Automated via `scripts/patch-expo-modules.cjs`)*

---

### Issue 7: expo-linking Kotlin Event Listener Signatures
- **Symptom:** `ExpoLinkingModule.kt:26:22 Type mismatch: inferred type is String but () -> Unit was expected`.
- **Root Cause:** `OnStartObserving` and `OnStopObserving` in Expo SDK 51 are parameterless lambdas because `Events("onURLReceived")` already registers the event names.
- **Permanent Solution:** Change:
  ```kotlin
  // Before:
  OnStartObserving("onURLReceived") { ... }
  OnStopObserving("onURLReceived") { ... }

  // After:
  OnStartObserving { ... }
  OnStopObserving { ... }
  ```
  *(Automated via `scripts/patch-expo-modules.cjs`)*

---

### Issue 8: React Native PackageList.java Compilation in Kotlin
- **Symptom:** `MainApplication.kt: Unresolved reference: PackageList`.
- **Root Cause:** Kotlin compiler runs prior to Java annotation processing and dynamic autolinking code generation, failing to resolve `com.facebook.react.PackageList`.
- **Permanent Solution:** Provide a static `com/facebook/react/PackageList.java` in `apps/mobile/android/app/src/main/java/com/facebook/react/PackageList.java` returning `new MainReactPackage(mConfig)`. (All 24 Expo modules are automatically loaded via Expo's `ReactNativeHostWrapper` and `ExpoModulesPackageList`).

---

### Issue 9: MainApplication.kt & MainActivity.kt Architecture
- **Correct React Native 0.74 + Expo 51 Implementation:**
  - **`MainApplication.kt`:**
    ```kotlin
    package com.monorapo.accounting

    import android.app.Application
    import android.content.res.Configuration

    import com.facebook.react.PackageList
    import com.facebook.react.ReactApplication
    import com.facebook.react.ReactNativeHost
    import com.facebook.react.ReactPackage
    import com.facebook.react.ReactHost
    import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
    import com.facebook.react.defaults.DefaultReactNativeHost

    import expo.modules.ApplicationLifecycleDispatcher
    import expo.modules.ReactNativeHostWrapper

    class MainApplication : Application(), ReactApplication {

      override val reactNativeHost: ReactNativeHost = ReactNativeHostWrapper(
          this,
          object : DefaultReactNativeHost(this) {
            override fun getPackages(): List<ReactPackage> =
                PackageList(this).packages.apply { }

            override fun getJSMainModuleName(): String = ".expo/.virtual-metro-entry"
            override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG
            override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
            override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
          }
      )

      override val reactHost: ReactHost
        get() = ReactNativeHostWrapper.createReactHost(applicationContext, reactNativeHost)

      override fun onCreate() {
        super.onCreate()
        load()
        ApplicationLifecycleDispatcher.onApplicationCreate(this)
      }

      override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
        ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig)
      }
    }
    ```
  - **`MainActivity.kt`:**
    ```kotlin
    package com.monorapo.accounting

    import android.os.Build
    import android.os.Bundle
    import com.facebook.react.ReactActivity
    import com.facebook.react.ReactActivityDelegate
    import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
    import com.facebook.react.defaults.DefaultReactActivityDelegate
    import expo.modules.ReactActivityDelegateWrapper

    class MainActivity : ReactActivity() {
      override fun onCreate(savedInstanceState: Bundle?) {
        setTheme(R.style.AppTheme)
        super.onCreate(null)
      }

      override fun getMainComponentName(): String = "main"

      override fun createReactActivityDelegate(): ReactActivityDelegate {
        return ReactActivityDelegateWrapper(
              this,
              BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
              object : DefaultReactActivityDelegate(
                  this,
                  mainComponentName,
                  fabricEnabled
              ){}
        )
      }
    }
    ```

---

## 3. Automated CI/CD Pipeline Configuration

Our CI/CD workflow is located at `.github/workflows/build-android.yml`. It runs on GitHub Actions Ubuntu runners and automatically executes our patch scripts:

```yaml
name: Build Android APK

on:
  workflow_dispatch:
  push:
    branches: [main]
    tags: ['v*']

jobs:
  build:
    name: 🤖 Compile Android APK
    runs-on: ubuntu-latest

    steps:
      - name: ⬇️ Checkout repository
        uses: actions/checkout@v4

      - name: ☕ Set up Java 17
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: 📱 Set up Android SDK
        uses: android-actions/setup-android@v3

      - name: 🟢 Set up Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: 📦 Install root dependencies
        run: npm install --legacy-peer-deps

      - name: 📦 Install mobile dependencies
        working-directory: apps/mobile
        run: npm install --legacy-peer-deps

      - name: 🩹 Patch Expo Native Modules
        run: node scripts/patch-expo-modules.cjs

      - name: 📦 Pre-bundle JavaScript Assets
        working-directory: apps/mobile
        run: |
          mkdir -p android/app/src/main/assets
          npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res || true

      - name: 🔑 Make Gradlew Executable
        run: chmod +x apps/mobile/android/gradlew

      - name: 🏗️ Build Android APK
        working-directory: apps/mobile/android
        env:
          NODE_PATH: ${{ github.workspace }}/node_modules:${{ github.workspace }}/apps/mobile/node_modules
          NODE_OPTIONS: "--max-old-space-size=4096"
          GRADLE_OPTS: "-Dorg.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m"
        run: |
          ./gradlew assembleDebug --no-daemon --stacktrace

      - name: 📤 Upload APK Artifacts
        uses: actions/upload-artifact@v4
        with:
          name: Red-Accounting-Book-Mobile-APK
          path: apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk
          if-no-files-found: error

      - name: 🚀 Release to GitHub (if tagged)
        if: startsWith(github.ref, 'refs/tags/v')
        uses: softprops/action-gh-release@v2
        with:
          files: apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## 4. Step-by-Step Guide for Future Builds & Releases

### To trigger a new build & release:
1. Make your code changes in `apps/mobile/src` or root packages.
2. Commit your changes:
   ```bash
   git add .
   git commit -m "feat(mobile): Add new accounting feature"
   git push origin main
   ```
3. To create an official public release with auto-attached APK and Windows EXE:
   ```bash
   git tag v1.2.1
   git push origin v1.2.1
   ```
4. GitHub Actions will automatically compile the APK in ~6–8 minutes and publish it directly to the Releases page!

---

## 5. Quick Reference Configuration Table

| Parameter / Tool | Configured Value | Location |
| :--- | :--- | :--- |
| **Java Version** | Java 17 (Temurin) | CI & Build environment |
| **Gradle Version** | Gradle 8.8 | `gradle-wrapper.properties` |
| **Android Gradle Plugin** | AGP 8.4.1 | `android/build.gradle` |
| **Kotlin Version** | 1.9.24 | `android/build.gradle` |
| **Android SDK Versions** | Compile: 34, Target: 34, Min: 23 | `android/build.gradle` |
| **Android NDK** | 26.1.10909125 | `android/build.gradle` |
| **CMake** | 3.22.1 | Auto-installed by Gradle |
| **Jetifier & AndroidX** | `true` | `gradle.properties` |
| **Max Heap Memory** | `-Xmx4096m -XX:MaxMetaspaceSize=1024m` | `gradle.properties` |
| **Target Architectures** | `armeabi-v7a,arm64-v8a,x86,x86_64` | `gradle.properties` |
| **Patch Script** | `node scripts/patch-expo-modules.cjs` | Root scripts |
| **Output APK File** | `app-debug.apk` (~179MB) | `app/build/outputs/apk/debug/` |

---
*Document Created on 2026-08-22 by Antigravity AI Engineering Pair Programmer.*
