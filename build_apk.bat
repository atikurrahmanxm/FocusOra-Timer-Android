@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo   FocusOra - Android APK Build Automation Tool   
echo ===================================================
echo.

:: 1. Check Node.js
where node >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js was not found. Please install Node.js LTS version from:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: 2. Check Java (JDK) & Android Studio JBR fallback
java -version >nul 2>&1
if errorlevel 1 (
    echo Java not found in system PATH. Searching Android Studio directories...
    if exist "C:\Program Files\Android\Android Studio\jbr" (
        set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
        set "PATH=C:\Program Files\Android\Android Studio\jbr\bin;!PATH!"
        echo [OK] Found and configured Java JBR from Android Studio.
    ) else if exist "C:\Program Files\Android\Android Studio\jre" (
        set "JAVA_HOME=C:\Program Files\Android\Android Studio\jre"
        set "PATH=C:\Program Files\Android\Android Studio\jre\bin;!PATH!"
        echo [OK] Found and configured Java JRE from Android Studio.
    ) else (
        echo WARNING: Java JDK 17 or higher was not found in PATH or Android Studio.
        echo If the build fails, install Java or configure JDK in Android Studio.
    )
) else (
    echo [OK] Java is already configured in PATH.
)

:: 3. Configure ANDROID_HOME automatically if missing
if "%ANDROID_HOME%"=="" (
    if exist "%LOCALAPPDATA%\Android\Sdk" (
        set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
        echo [OK] Automatically configured ANDROID_HOME environment path.
    ) else (
        echo WARNING: ANDROID_HOME is not set and Sdk was not found in the default AppData directory.
        echo Please ensure Android Studio SDK is installed.
    )
)

:: 4. Initialize package.json if missing
if not exist "package.json" (
    echo.
    echo [1/5] Initializing NPM configuration package.json...
    call npm init -y >nul
)

:: 5. Install Capacitor Core, Screen Orientation, & Status Bar if missing
if not exist "node_modules\@capacitor\screen-orientation" (
    echo.
    echo [2/5] Installing Capacitor Core, Screen Orientation, and Status Bar plugins...
    call npm install @capacitor/core @capacitor/screen-orientation @capacitor/status-bar --save
    call npm install @capacitor/cli --save-dev
) else (
    echo.
    echo [2/5] Capacitor dependencies already installed.
)

:: 6. Initialize Capacitor config if missing
if not exist "capacitor.config.json" (
    echo.
    echo [3/5] Initializing Capacitor Project config...
    call npx cap init "FocusOra" "com.focusspace.timer" --web-dir=www
)

:: 7. Install and Add Android Native Platform if missing
if not exist "android" (
    echo.
    echo [4/5] Adding Android Native Platform...
    call npm install @capacitor/android --save
    call npx cap add android
) else (
    echo.
    echo [4/5] Android native platform folder already exists.
)

:: Generate custom app icons using logo.png
if exist "android" (
    echo.
    echo Generating custom application icons from logo.png...
    powershell -NoProfile -ExecutionPolicy Bypass -File .\generate_icons.ps1
)

:: 7.5. Prepare www directory with web assets
echo.
echo Preparing web assets in 'www' folder...
if exist "www" rd /s /q "www"
mkdir "www"
copy /y "index.html" "www\" >nul
copy /y "styles.css" "www\" >nul
copy /y "app.js" "www\" >nul
copy /y "logo.png" "www\" >nul

:: 8. Synchronize web assets
echo.
echo [5/5] Syncing latest HTML, CSS, and JS web assets to Android...
call npx cap sync

:: 9. Build the Android APK using Gradle
echo.
echo ===================================================
echo   Compiling standalone Android APK...
echo ===================================================
echo.

cd android
call .\gradlew.bat assembleDebug
if errorlevel 1 (
    echo.
    echo ERROR: Gradle build failed.
    echo Please make sure Android Studio is installed and the Gradle Sync is completed.
    echo.
    cd ..
    pause
    exit /b 1
)

cd ..

:: 10. Copy and locate compiled APK
if exist "android\app\build\outputs\apk\debug\app-debug.apk" (
    copy /y "android\app\build\outputs\apk\debug\app-debug.apk" "FocusOra_Timer.apk" >nul
    echo.
    echo ===================================================
    echo   SUCCESS: Standalone APK Compiled successfully!   
    echo ===================================================
    echo.
    echo Output File: "FocusOra_Timer.apk" located in the project folder
    echo.
    echo Transfer this file to your phone to install the app.
    echo.
    explorer.exe /select,"FocusOra_Timer.apk"
) else (
    echo.
    echo ERROR: Compiled APK file could not be found.
)

pause
