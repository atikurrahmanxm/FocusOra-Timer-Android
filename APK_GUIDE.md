# Android APK Packaging Guide - FocusOra Timer

This guide details how to turn your mobile-first **FocusOra** web application into a standalone, installable Android APK (`FocusOra_Timer.apk`) file using **Capacitor** and the automated `build_apk.bat` tool.

---

## 🛠️ Prerequisites

Before you start, make sure you have the following installed on your computer:

1. **Node.js** (LTS Version recommended): [Download Node.js](https://nodejs.org/)
   - This installs `npm` (Node Package Manager).
2. **Android Studio**: [Download Android Studio](https://developer.android.com/studio)
   - During setup, make sure you install the standard **Android SDK**, **Android SDK Command-line Tools**, and **Build-Tools**.
   - Configure your system environment variable `ANDROID_HOME` pointing to your SDK path (e.g. `C:\Users\<YourUsername>\AppData\Local\Android\Sdk`).
3. **Java Development Kit (JDK 17+)**: Packaged with Android Studio or installed separately.

---

## ⚡ Quick 1-Click Build (Recommended)

You don't need to manually run long commands! 
Just double-click **`build_apk.bat`** in the project directory.

The script will automatically:
1. Validate Node.js, Android SDK, and Java environment.
2. Synchronize web assets (`index.html`, `styles.css`, `app.js`) to the Android platform.
3. Automatically generate all mipmap launcher icons from `logo.png`.
4. Compile the project with Gradle.
5. Produce **`FocusOra_Timer.apk`** in your root folder and highlight it in File Explorer!

---

## 🚀 Manual Step-by-Step Build Instructions

If you prefer to run commands manually in PowerShell or Terminal:

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Synchronize Web Assets to Android
```bash
npx cap sync
```

### Step 3: Compile via Gradle Wrapper
Navigate to the `android` folder and build:
```bash
cd android
.\gradlew.bat assembleDebug
cd ..
```
The compiled APK will be located at:
`android\app\build\outputs\apk\debug\app-debug.apk`

---

## 🎨 Customizing the App Icon
To change the app icon:
1. Replace **`logo.png`** in the root project folder with your own square PNG image (recommended: 512x512 or 1024x1024 px).
2. Run **`build_apk.bat`** or run PowerShell script:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\generate_icons.ps1
   ```
3. Rebuild the APK.
