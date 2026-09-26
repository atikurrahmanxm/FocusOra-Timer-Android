<p align="center">
  <img src="logo.png" width="130" height="130" alt="FocusOra Logo" style="border-radius: 28px; box-shadow: 0 10px 30px rgba(59, 130, 246, 0.4);" />
</p>

<h1 align="center">FocusOra - Premium Study Clock & Focus Timer</h1>

<p align="center">
  <b>A minimalist, distraction-free focus clock & study session companion for Android.</b><br>
  <i>Designed for deep work, exam candidates, IELTS test-takers, and daily productivity routines.</i>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Version-1.1.0-3b82f6.svg?style=for-the-badge" alt="Version 1.1.0" />
  <img src="https://img.shields.io/badge/Platform-Android-10b981.svg?style=for-the-badge&logo=android" alt="Platform Android" />
  <img src="https://img.shields.io/badge/Framework-Capacitor_8-8b5cf6.svg?style=for-the-badge" alt="Capacitor 8" />
  <img src="https://img.shields.io/badge/Privacy-100%25_Offline-06b6d4.svg?style=for-the-badge" alt="100% Offline" />
  <img src="https://img.shields.io/badge/License-MIT-f59e0b.svg?style=for-the-badge" alt="License MIT" />
</p>

<p align="center">
  <a href="FocusOra_Timer.apk">
    <img src="https://img.shields.io/badge/Direct_Download-FocusOra_Timer.apk-2563eb?style=for-the-badge&logo=android&logoColor=white" alt="Download APK" />
  </a>
  <a href="#-key-features">
    <img src="https://img.shields.io/badge/Explore-Features-475569?style=for-the-badge" alt="Explore Features" />
  </a>
  <a href="#-how-to-build-from-source">
    <img src="https://img.shields.io/badge/Build-From_Source-059669?style=for-the-badge" alt="Build from source" />
  </a>
</p>

---

## 📑 Table of Contents
* [📖 Overview](#-overview)
* [📸 Visual Showcase](#-visual-showcase)
* [🚀 Key Features](#-key-features)
* [📥 Quick Installation](#-quick-installation)
* [🛠️ Tech Stack & Architecture](#-tech-stack--architecture)
* [📁 Project Structure](#-project-structure)
* [⚡ How to Build from Source](#-how-to-build-from-source)
* [👨‍💻 Developer & Credits](#-developer--credits)
* [📄 License](#-license)

---

## 📖 Overview

**FocusOra** is a modern, high-precision study timer built specifically to transform any Android device into an aesthetic, distraction-free productivity space. Whether you are studying for **IELTS, university exams, programming sessions, or deep work**, FocusOra eliminates clutter and provides:

* A **live-updating notification bar countdown** so you never lose track of time when checking references.
* A **5-second warning pre-alarm with gentle haptics** before timer completion.
* An immersive **pitch-black AMOLED landscape desk clock** with zero notifications or distractions.
* **Smart Study Analytics** with custom SVG charts for daily and monthly performance tracking.
* **10 Procedural Ambient Alarms** generated 100% offline via the Web Audio API without consuming cellular data or downloading audio clips.

---

## 📸 Visual Showcase

<table align="center" width="100%">
  <tr>
    <td align="center" width="50%" valign="top">
      <h3>⏱️ Precision Focus Timer</h3>
      <p><i>Quick presets (30m, 1h, 2h, 4h), custom duration picker, and fluid progress indicators.</i></p>
      <img src="screenshots/01_timer_portrait.png" width="300" alt="FocusOra Timer Portrait" style="border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.5);" />
    </td>
    <td align="center" width="50%" valign="top">
      <h3>🌙 AMOLED Desk Clock Mode</h3>
      <p><i>Ultra-crisp high-contrast digits on a true-black canvas for distraction-free study desks.</i></p>
      <img src="screenshots/02_amoled_desk_clock.png" width="460" alt="FocusOra AMOLED Desk Clock" style="border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.5);" />
    </td>
  </tr>
  <tr>
    <td align="center" width="50%" valign="top">
      <h3>📊 Study Activity Dashboard</h3>
      <p><i>7-day daily activity breakdown, monthly trends, and subject distribution donut rings.</i></p>
      <img src="screenshots/03_analytics_dashboard.png" width="300" alt="FocusOra Analytics Dashboard" style="border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.5);" />
    </td>
    <td align="center" width="50%" valign="top">
      <h3>⚙️ Sound Synthesizer & Settings</h3>
      <p><i>10 offline procedural ambient chimes, custom vibration toggle, and full JSON data backup.</i></p>
      <img src="screenshots/04_settings_sounds.png" width="300" alt="FocusOra Settings and Sounds" style="border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.5);" />
    </td>
  </tr>
</table>

---

## 🚀 Key Features

### ⏱️ Precision Study Timer
* Instant quick presets: **30m**, **1h**, **2h**, and **4h**.
* Custom time picker for setting any arbitrary hours and minutes.
* Accurate timer loop with background elapsed-time compensation.

### 🔔 Live Background Countdown Notification (Android Foreground Service)
* Minimizing the app will **not** interrupt your study flow.
* A native Android foreground service displays a persistent, ticking status entry: `FocusOra Session Active - [Subject Name]: MM:SS remaining`, updating every second.
* Automatically dismisses once paused, reset, or completed.

### ⚠️ Final 5-Second Warning Alarm & Haptic Vibration
* At 5 seconds remaining, a gentle warning chime sequence (5, 4, 3, 2, 1) and light haptic pulses alert you before completion.
* Ensures you finish your current sentence or paragraph smoothly before the main alarm sounds.

### 🌙 AMOLED Fullscreen Landscape Desk Clock
* One tap triggers a distraction-free desk clock mode.
* Optimized for AMOLED displays to conserve battery with pure `#000000` pitch black pixels.
* Double-tap anywhere to exit cleanly.

### 📱 Keep-Screen-Awake
* Built-in native Android window flags and HTML5 Screen Wake Lock ensure the display stays illuminated throughout your session.

### 📊 Comprehensive Study Analytics
* **Daily Breakdown:** Visual 7-day study activity bar chart with active-day neon highlight.
* **Monthly Comparison:** 6-month historical study trend chart.
* **Subject Share Donut:** Dynamic proportional ring displaying exact study time and percentage per topic.
* **History Feed:** Chronological list of completed focus logs with safe confirmation dialogs.

### 📚 15 Academic & IELTS Subject Categories
* Create and color-code custom subjects.
* Includes dedicated academic emojis:
  * 📖 Reading, 📝 Writing, 🎧 Listening, 🗣️ Speaking, 🎓 Exam, 📚 Study, 📐 Math, 💻 Coding, 🧪 Science, 🎨 Art, and more.

### 🎵 10 Built-In Procedural Ambient Alarms
* 100% offline, zero audio files to download—generated mathematically in real time via the Web Audio API:
  * *Gentle Chime, Retro Digital, Zen Singing Bowl, Happy Sunrise, Cosmic Glow, Classic Clock, Forest Chirp, Elevate Arpeggio, Echo Bell, Victory Fanfare.*
* Master volume control and instant test preview.

### 💾 Private, Safe & 100% Offline
* Zero accounts, zero cloud logins, zero tracking, and zero ads.
* Complete JSON export and import for hassle-free data backups.

---

## 📥 Quick Installation

You can install and use FocusOra on your Android device immediately:

1. Download the pre-built standalone APK: **[`FocusOra_Timer.apk`](FocusOra_Timer.apk)**.
2. Transfer the `.apk` file to your Android phone via USB, Google Drive, or messaging.
3. Tap the file in your phone's File Manager and select **Install**.
4. *(If prompted, enable "Install unknown apps" for your file manager)*.

---

## 🛠️ Tech Stack & Architecture

* **UI Layer:** HTML5, CSS3 (Modern Glassmorphic Dark UI), JavaScript (ES6+).
* **Native Runtime:** [Capacitor 8](https://capacitorjs.com/) cross-platform Android container.
* **Native Android Java:**
  * `TimerService.java`: Android Foreground Service for live notification countdown.
  * `TimerPlugin.java`: Native Capacitor plugin bridge.
  * `MainActivity.java`: Keep-screen-on window management.
* **Audio Engine:** Pure Web Audio API (`OscillatorNode`, `GainNode`, `BiquadFilterNode`).
* **Visualizations:** Lightweight responsive vector SVGs with zero external charting dependencies.

---

## 📁 Project Structure

```text
FocusOra/
├── android/                             # Native Android Studio Project
│   ├── app/src/main/AndroidManifest.xml # Native service declarations & permissions
│   └── app/src/main/java/               # Native Java plugins (TimerService, TimerPlugin)
├── screenshots/                         # UI preview showcase images
│   ├── 01_timer_portrait.png
│   ├── 02_amoled_desk_clock.png
│   ├── 03_analytics_dashboard.png
│   └── 04_settings_sounds.png
├── app.js                               # Application logic, timer loop & Web Audio synthesis
├── index.html                           # Semantic HTML5 markup & modal definitions
├── styles.css                           # Glassmorphic dark styling & responsive layouts
├── build_apk.bat                        # 1-Click automated APK compilation batch tool
├── generate_icons.ps1                   # Automated Android launcher mipmap icon generator
├── capacitor.config.json                # Capacitor native bridge configuration
├── package.json                         # Project dependencies & metadata
├── FocusOra_Timer.apk                   # Standalone installable Android APK
└── LICENSE                              # Open-source MIT License
```

---

## ⚡ How to Build from Source

### Prerequisites:
* **Node.js (v18+)**: [Download Node.js](https://nodejs.org/)
* **Android Studio & SDK**: [Download Android Studio](https://developer.android.com/studio) with `ANDROID_HOME` configured.

### Quick 1-Click Build (Windows):
Simply double-click **`build_apk.bat`** in the project folder. The automated script will:
1. Validate Node.js, Java JDK, and Android SDK environments.
2. Automatically synchronize all web assets into the Android native build.
3. Generate all Android launcher icon mipmap sizes from `logo.png`.
4. Compile the release APK using Gradle and place **`FocusOra_Timer.apk`** in the root directory.

### Manual Command Line Build:
```bash
# 1. Install dependencies
npm install

# 2. Sync web assets to Android
npx cap sync

# 3. Compile Android debug APK via Gradle Wrapper
cd android
.\gradlew.bat assembleDebug
cd ..
```
The compiled output will be located at:
`android/app/build/outputs/apk/debug/app-debug.apk`

---

## 🤝 Contributing & Feedback

Contributions, feature suggestions, and bug reports are warmly welcome!
* ⭐️ **Star this repository** if you found FocusOra helpful!
* 🐛 **Report a bug** or request a feature via [GitHub Issues](../../issues).
* 🔀 **Submit a Pull Request** to propose code improvements.

---

## 👨‍💻 Developer & Credits

* **Developer:** **Atikur Rahman**
* **Project Name:** FocusOra
* **Current Version:** v1.1.0

## 📄 License
This project is open-source and released under the terms of the [MIT License](LICENSE).
