# IntentionalSpace — Complete Project Documentation

> **For:** Developers, future you, or any AI assistant  
> **Reading level:** Simple English (10th class friendly)  
> **Last updated:** Based on codebase scan (React Native 0.85.3, Android-only features)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Folder Structure Analysis](#2-folder-structure-analysis)
3. [Important Files Report](#3-important-files-report)
4. [React Native Flow Explained](#4-react-native-flow-explained)
5. [Screen-by-Screen Analysis](#5-screen-by-screen-analysis)
6. [Component Analysis](#6-component-analysis)
7. [Redux Analysis](#7-redux-analysis)
8. [API Documentation](#8-api-documentation)
9. [Database / Storage Analysis](#9-database--storage-analysis)
10. [Android Native Changes Report](#10-android-native-changes-report)
11. [Kotlin Files Analysis](#11-kotlin-files-analysis)
12. [Permissions Report](#12-permissions-report)
13. [Android Manifest Analysis](#13-android-manifest-analysis)
14. [Gradle Analysis](#14-gradle-analysis)
15. [External Libraries Report](#15-external-libraries-report)
16. [Assets Analysis](#16-assets-analysis)
17. [Feature Dependency Map](#17-feature-dependency-map)
18. [Security Review](#18-security-review)
19. [Beginner Maintenance Guide](#19-beginner-maintenance-guide)
20. [Deployment Guide](#20-deployment-guide)
21. [AI Handover Report](#21-ai-handover-report)

---

## 1. Project Overview

### What is IntentionalSpace?

**IntentionalSpace** is a **digital wellbeing** Android app. It helps people use their phone **on purpose**, not on autopilot.

**Simple explanation:** When you try to open apps like YouTube or Instagram too much, the app **stops you for a moment**, asks you to breathe, and lets you choose **how many minutes** you really want to use that app.

### Main purpose

| Goal | How the app does it |
|------|---------------------|
| Reduce mindless scrolling | Shows a full-screen **block modal** before you enter a distracting app |
| Set intentional time | You pick 1 min, 5 min, 10 min (or custom session time) |
| Track usage | Counts screen time and “attempts” to open blocked apps |
| Re-block after session | When your chosen minutes end, the block modal appears again |

### Core features

1. **Block list** — Turn blocking ON/OFF per app (Instagram, YouTube, etc.)
2. **Block modal (intervention)** — Native overlay OR React Native modal
3. **Session timer** — Temporary unlock for X minutes
4. **Daily time limits** — Per-app daily caps (onboarding + time bank)
5. **Overview stats** — Screen time, attempts, time “saved”
6. **Permissions setup** — Overlay, Accessibility, Usage Access

### There is NO login

This app does **not** use email/password login. Everything is stored **on the phone**.

### User flow (main journey)

```
Install app
    ↓
Open IntentionalSpace (first time)
    ↓
Welcome modal → explains 3 permissions
    ↓
Time Setup (per app daily limits) — first time only
    ↓
Main app (3 tabs: Overview | Block | Customize)
    ↓
User enables Accessibility + Overlay + Usage Access in phone Settings
    ↓
User opens YouTube (example)
    ↓
Android detects app open (AccessibilityService)
    ↓
Block modal appears ON TOP of YouTube
    ↓
User picks "5 min" OR taps "Exit app"
    ↓
If 5 min → YouTube works for 5 minutes → then blocked again
```

### Two UIs for the same “block modal”

| UI | When used | File |
|----|-----------|------|
| **Native overlay** (breathing countdown, Ready, 1/5/10 min) | Normal case — Overlay permission ON | `OverlayService.kt` + `overlay_intervention.xml` |
| **React Native modal** | Fallback — no overlay permission | `BlockedAppInterventionModal.js` |

Most users see the **native overlay** (purple buttons, “Ready” text — like your screenshots).

---

## 2. Folder Structure Analysis

> **Note:** This project puts most JavaScript code inside `android/app/src/` instead of a root `src/` folder. That is unusual but intentional in this repo.

```
IntentionalSpace/
├── App.js                          ← Main React entry (root)
├── index.js                        ← Registers app with React Native
├── app.json                        ← App display name
├── package.json                    ← NPM dependencies
├── PROJECT_DOCUMENTATION.md        ← This file
│
├── android/                        ← ALL Android native code + much JS code
│   ├── app/
│   │   ├── build.gradle            ← App-level Android build
│   │   └── src/
│   │       ├── main/
│   │       │   ├── AndroidManifest.xml
│   │       │   ├── java/com/intentionalspace/   ← Kotlin (brain of blocking)
│   │       │   └── res/            ← Layouts, strings, accessibility XML
│   │       ├── components/         ← Reusable UI (JS)
│   │       ├── constants/        ← Colors (JS)
│   │       ├── navigation/       ← Navigators (JS)
│   │       ├── screens/            ← All app screens (JS)
│   │       ├── services/         ← Timer, notifications, time bank (JS)
│   │       ├── store/              ← Redux (JS)
│   │       └── utils/              ← Storage, native bridge (JS)
│   ├── build.gradle                ← Project-level Android build
│   └── gradle.properties           ← Hermes, new arch flags
│
├── ios/                            ← Default RN iOS (not used for blocking features)
└── __tests__/                      ← Jest test stub
```

### Folder purposes

| Folder | Why it exists | Important files |
|--------|---------------|-------------------|
| `/` (root) | React Native project entry | `App.js`, `index.js`, `package.json` |
| `android/app/src/main/java/...` | **Custom Android logic** — blocking, overlay, timers | All `.kt` files |
| `android/app/src/screens/` | App pages user sees inside IntentionalSpace | `BlockScreen.js`, `OverviewScreen.js`, etc. |
| `android/app/src/services/` | Background logic in JavaScript | `TimerService.js`, `PerAppTimeService.js` |
| `android/app/src/utils/` | Helpers + bridge to Kotlin | `nativeSync.js`, `storage.js` |
| `android/app/src/store/` | Redux state (lightly used) | `store.js`, slices |
| `android/app/src/navigation/` | Which screen shows when | `RootNavigator.js`, `AppNavigator.js` |
| `android/app/src/main/res/` | Android XML layouts & images | `overlay_intervention.xml` |

---

## 3. Important Files Report

| File | Purpose | Critical Level | Beginner can edit? |
|------|---------|----------------|-------------------|
| `index.js` | Registers app with OS | **High** | No |
| `App.js` | Root UI, permissions modal, intervention state | **High** | Careful |
| `android/.../AccessibilityService.kt` | Detects when user opens blocked apps | **CRITICAL** | No |
| `android/.../OverlayService.kt` | Shows native block screen over other apps | **CRITICAL** | No |
| `android/.../InterventionLauncher.kt` | Starts overlay service | **CRITICAL** | No |
| `android/.../UnlockStateStore.kt` | Saves “unlocked for X min” | **High** | No |
| `android/.../UnlockExpiryScheduler.kt` | Re-blocks when timer ends | **High** | No |
| `android/.../IntentionalSpaceModule.kt` | JS ↔ Kotlin bridge | **High** | Careful |
| `android/app/src/utils/nativeSync.js` | JS calls to Kotlin | **High** | Careful |
| `android/app/src/utils/storage.js` | AsyncStorage save/load | **High** | Yes (keys) |
| `android/app/src/utils/appConfig.js` | App list (Instagram, YouTube…) | **Medium** | Yes (add apps) |
| `android/app/src/screens/Block/BlockScreen.js` | Block toggles & session minutes | **Medium** | Yes (UI) |
| `android/app/src/navigation/RootNavigator.js` | Onboarding vs main tabs | **Medium** | Careful |
| `android/app/src/services/timer/TimerService.js` | JS-side unlock timers | **High** | Careful |
| `AndroidManifest.xml` | Permissions, services, receivers | **CRITICAL** | No |

### What breaks if deleted?

| If you delete… | What happens |
|----------------|--------------|
| `AccessibilityService.kt` | App never detects YouTube/Instagram opens — **app useless** |
| `OverlayService.kt` | No native block screen (only RN fallback) |
| `nativeSync.js` | JS cannot talk to Android — settings won't apply to blocking |
| `App.js` | App won't start |
| `storage.js` | No saved settings |
| `BlockedAppsHelper.kt` | Native side doesn't know which apps to block |

---

## 4. React Native Flow Explained

### How the app starts (step by step)

```
1. User taps app icon on phone
        ↓
2. Android launches MainActivity.kt
        ↓
3. MainApplication.kt loads React Native
        ↓
4. index.js runs → AppRegistry.registerComponent('IntentionalSpace', App)
        ↓
5. App.js renders
        ↓
6. Redux Provider wraps everything
        ↓
7. RootNavigator.js decides: TimeSetup OR main tabs
        ↓
8. User sees Overview / Block / Customize
```

**Meanwhile (always running in background):**
- `AccessibilityService` listens for app switches
- If user opens blocked app → `OverlayService` shows block modal

### Navigation structure

```
RootNavigator
├── TimeSetupScreen (first launch only)
└── AppNavigator (bottom tabs)
    ├── Overview
    ├── Block
    └── Customize
```

**Plus (outside navigation):** `App.js` renders `BlockedAppInterventionModal` on top of everything when needed.

### How data moves (settings example)

```
User toggles YouTube OFF in BlockScreen
        ↓
saveData(STORAGE_KEYS.BLOCKED_APPS, {...})
        ↓
syncAllToNative() → IntentionalSpaceModule.syncBlockedApps(json)
        ↓
Kotlin saves to SharedPreferences "blocked_apps"
        ↓
AccessibilityService reads BlockedAppsHelper.shouldIntervene()
        ↓
YouTube blocking ON or OFF on device
```

### Block modal flow (the most important flow)

```
User opens YouTube
        ↓
AccessibilityService.onAccessibilityEvent
        ↓
maybeIntervene("com.google.android.youtube")
        ↓
InterventionLauncher.showOverlay(...)
        ↓ (150ms delay)
OverlayService shows XML layout (breathing → Ready → buttons)
        ↓
User taps "5 min"
        ↓
UnlockStateStore.grantUnlock(5 min)
        ↓
TimerService.js syncs via APP_UNLOCKED broadcast
        ↓
After 5 min: UnlockExpiryScheduler → show overlay again
```

---

## 5. Screen-by-Screen Analysis

### 5.1 Time Setup — `android/app/src/screens/TimeSetupScreen.js`

| Item | Detail |
|------|--------|
| **Purpose** | First-time onboarding: set **daily** time limit per app |
| **When shown** | `TIME_SETUP_COMPLETE` is not saved in storage |
| **User actions** | Pick minutes, Next, Skip |
| **API** | None (local only) |
| **Redux** | Not used |
| **Navigation** | Fake `navigation.replace('Main')` → `RootNavigator` sets `setupComplete` |
| **Services** | `PerAppTimeService.setAppTimeLimit()` |

---

### 5.2 Overview — `android/app/src/screens/Overview/OverviewScreen.js`

| Item | Detail |
|------|--------|
| **Purpose** | Dashboard: screen time, attempts, time saved |
| **User actions** | Scroll stats (auto-refreshes every 10 seconds) |
| **Native calls** | `getTodayOverviewStatsNative()` → `IntentionalSpaceModule.getTodayOverviewStats` |
| **Redux** | Not used |
| **Data source** | `UsageStatsHelper` + `DailyStatsStore` on Android |

---

### 5.3 Block — `android/app/src/screens/Block/BlockScreen.js`

| Item | Detail |
|------|--------|
| **Purpose** | **Main control panel** — which apps blocked, session pause minutes, permissions |
| **User actions** | Toggle apps, edit session minutes, open permission settings, strict mode |
| **Storage** | `BLOCKED_APPS`, `APP_SESSION_LIMITS`, `USER_SETTINGS` |
| **Native sync** | `syncAllToNative()` on every change |
| **Redux** | Not used (uses local `useState`) |

This screen is what makes blocking work — always sync to native after changes.

---

### 5.4 Customize — `android/app/src/screens/Customize/CustomizeScreen.js`

| Item | Detail |
|------|--------|
| **Purpose** | Extra settings UI (haptic, delay placeholders) |
| **Note** | Permission checks here are partly **placeholders** — real checks are on Block screen |
| **Storage** | `USER_SETTINGS` |

---

### 5.5 Blocked App Intervention (RN Modal) — `android/app/src/screens/Intervention/BlockedAppInterventionModal.js`

| Item | Detail |
|------|--------|
| **Purpose** | Full-screen React Native version of block modal |
| **When shown** | `App.js` when `intervention.visible === true` (fallback path) |
| **User actions** | Pick time grid, confirm, exit |
| **Calls** | `onComplete(minutes)` → `grantNativeUnlock` + `TimerService.unlockApp` |

---

### 5.6 All Apps — `android/app/src/screens/AllAppsScreen.js`

| Item | Detail |
|------|--------|
| **Purpose** | Lists installed apps (helper screen) |
| **Usage** | May not be in main tab navigator — check if linked from elsewhere |

---

## 6. Component Analysis

### `AppTimePickerGrid.js` — `android/app/src/components/AppTimePickerGrid.js`

| Item | Detail |
|------|--------|
| **What it does** | Grid of minute buttons (5, 15, 30, 60…) |
| **Used in** | `TimeSetupScreen`, `BlockedAppInterventionModal` |
| **Props** | `selectedTime`, `onSelectTime` |
| **Risk if changed** | Onboarding and intervention time picking breaks |

---

## 7. Redux Analysis

### Is Redux important here?

**Partially.** Redux is set up but **most screens use `useState` + AsyncStorage** instead of Redux.

### Store setup — `android/app/src/store/store.js`

```javascript
configureStore({
  reducer: {
    app: appReducer,    // blocked apps, strict mode
    timer: timerReducer // timers (mostly unused in UI)
  }
})
```

### Slices

| Slice | File | State | Actually used? |
|-------|------|-------|----------------|
| `app` | `appSlice.js` | `blockedApps`, `strictMode` | Rarely — BlockScreen uses local state |
| `timer` | `timerSlice.js` | `activeTimers`, `unlockedApps` | Rarely — `TimerService.js` is a singleton class instead |

### State flow (if you used Redux properly)

```
User Clicks Button
        ↓
dispatch(toggleApp('youtube'))
        ↓
appReducer updates state
        ↓
Component re-renders from useSelector
```

**Current reality:** `TimerService` and `PerAppTimeService` are **JavaScript classes** that save to AsyncStorage directly.

---

## 8. API Documentation

### Important: This app has NO traditional REST API

There is **no backend server**, no `fetch('https://api...')`, no login API.

All “API-like” communication is:

| Type | What it is |
|------|------------|
| **Native Module Bridge** | JavaScript calls Kotlin methods |
| **Broadcast** | Kotlin sends `APP_UNLOCKED` to JS |
| **DeviceEventEmitter** | Kotlin sends `INTERVENTION_REQUIRED` to JS |

### Native Module Methods (JavaScript → Kotlin)

| JS function (`nativeSync.js`) | Kotlin method | Purpose |
|------------------------------|---------------|---------|
| `syncBlockedAppsToNative()` | `syncBlockedApps(json)` | Save which apps are blocked |
| `syncSessionLimitsToNative()` | `syncSessionLimits(json)` | Save pause/session minutes |
| `syncAppTimeDataToNative()` | `syncAppTimeData(json)` | Daily limits + used time |
| `grantNativeUnlock(pkg, min)` | `grantUnlock(pkg, min)` | Allow app for X minutes |
| `clearNativeUnlock(pkg)` | `clearUnlock(pkg)` | Remove temporary unlock |
| `notifyNativeUnlockExpired(pkg)` | `notifyUnlockExpired(pkg)` | Timer ended — re-block |
| `exitTargetAppNative(pkg)` | `exitTargetApp(pkg)` | Send user to HOME |
| `launchTargetAppNative(pkg)` | `launchTargetApp(pkg)` | Open target app |
| `getTodayOverviewStatsNative()` | `getTodayOverviewStats()` | Dashboard numbers |
| `getInterventionStatus()` | `getInterventionStatus()` | Permission checks |

### Events (Kotlin → JavaScript)

| Event name | When fired | JS listener |
|------------|------------|-------------|
| `APP_UNLOCKED` | User picked time on native overlay | `AppUnlockReceiver.js` |
| `INTERVENTION_REQUIRED` | Fallback: open RN modal | `App.js` DeviceEventEmitter |

---

## 9. Database / Storage Analysis

### Storage type: AsyncStorage only

**AsyncStorage** = data saved as small text files on the phone (like a simple notepad).

**No SQLite, No Realm, No Firebase** in this project.

### Storage helper — `android/app/src/utils/storage.js`

| Function | What it does |
|----------|--------------|
| `saveData(key, value)` | `JSON.stringify` → save |
| `loadData(key)` | load → `JSON.parse` |
| `removeData(key)` | delete one key |
| `clearAllData()` | wipe everything |

### All storage keys

| Key | What is stored |
|-----|----------------|
| `@blocked_apps` | `{ instagram: true, youtube: true, ... }` |
| `@app_session_limits` | Minutes before pause per app |
| `@app_time_limits` | Daily cap per app |
| `@app_used_time` | Minutes used today per app |
| `@time_setup_complete` | Onboarding done? |
| `@active_timers` | JS timer list |
| `@unlocked_apps` | Apps temporarily unlocked |
| `@user_settings` | Strict mode, etc. |
| `@has_launched` | First launch flag |

### Native storage (Kotlin)

Kotlin uses **SharedPreferences** file named `IntentionalSpace`:

| Key | Content |
|-----|---------|
| `blocked_apps` | JSON synced from JS |
| `session_limits` | JSON synced from JS |
| `unlock_expiry_com.instagram.android` | Timestamp when unlock ends |

---

## 10. Android Native Changes Report

Compared to a **default React Native 0.85** project, these are **custom additions** (not from template):

| Change | Path | Why | If reverted |
|--------|------|-----|-------------|
| Accessibility Service | `AccessibilityService.kt` + manifest | Detect app opens | **Blocking stops** |
| Overlay Service | `OverlayService.kt` + layout XML | Block screen over apps | No native modal |
| Unlock scheduler | `UnlockExpiryScheduler.kt` + `UnlockExpiryReceiver.kt` | Re-block after timer | Users stay unlocked forever |
| Custom native modules | `IntentionalSpacePackage.kt`, etc. | JS bridge | Settings don't sync |
| Extra permissions | `AndroidManifest.xml` | Overlay, usage stats | Features break |
| JS code inside `android/app/src` | Unusual folder layout | Project structure choice | Import paths break |

### Default files that WERE modified

| File | Changes |
|------|---------|
| `MainApplication.kt` | Added `IntentionalSpacePackage()` to packages |
| `MainActivity.kt` | Handles intervention intents, `APP_UNLOCKED` broadcast |
| `AndroidManifest.xml` | Services, receiver, permissions |
| `app/build.gradle` | Extra AndroidX dependencies |

---

## 11. Kotlin Files Analysis

### Core blocking (MUST understand)

#### `AccessibilityService.kt`
- **Purpose:** Watches which app window is open (like a security camera for app switches).
- **Main functions:** `onAccessibilityEvent`, `maybeIntervene`, `handleForegroundChange`
- **Custom?** Yes — entirely custom.
- **Why needed:** Without this, nothing knows user opened YouTube.

#### `OverlayService.kt`
- **Purpose:** Draws full-screen block UI **on top of** YouTube/Instagram.
- **Main functions:** `showInterventionUI`, `completeUnlock`, `declineAndExit`, `dismissOverlayOnly`
- **Custom?** Yes.
- **Layout:** `res/layout/overlay_intervention.xml`

#### `InterventionLauncher.kt`
- **Purpose:** Starts `OverlayService` after tiny delay (150ms).
- **Custom?** Yes.

#### `BlockedAppsHelper.kt`
- **Purpose:** Reads blocked app list from SharedPreferences; checks daily limit.
- **Custom?** Yes.

#### `UnlockStateStore.kt`
- **Purpose:** Remembers “YouTube unlocked until 3:45 PM”.
- **Custom?** Yes.

#### `UnlockExpiryScheduler.kt` + `UnlockExpiryReceiver.kt`
- **Purpose:** When unlock time ends, trigger block modal again (uses AlarmManager).
- **Custom?** Yes.

#### `UsageStatsHelper.kt`
- **Purpose:** Reads Android “Usage Access” data for screen time stats.
- **Custom?** Yes.

#### `TriggerAppsHelper.kt`
- **Purpose:** Maps package names → friendly names (YouTube, Instagram).
- **Custom?** Yes.

#### `TargetAppLauncher.kt`
- **Purpose:** Send user HOME or launch an app after unlock.
- **Custom?** Yes.

### Bridge modules (JS ↔ Kotlin)

| File | Exposes to JS as |
|------|------------------|
| `IntentionalSpaceModule.kt` | `IntentionalSpaceModule` |
| `PendingAppModule.kt` | `PendingAppModule` |
| `AppListModule.kt` | (installed apps list) |
| `BatteryOptimizationModule.kt` | (battery settings helper) |

### Default RN files (minor changes)

| File | Purpose |
|------|---------|
| `MainActivity.kt` | App window + intervention events |
| `MainApplication.kt` | Registers custom packages |

### Manifest note: `TimerService`

`AndroidManifest.xml` declares `.TimerService` but there is **no `TimerService.kt`** file. Timers run in JS (`TimerService.js`) + `UnlockExpiryScheduler.kt`. The manifest entry may be leftover.

---

## 12. Permissions Report

| Permission | Why needed | Where requested | Feature |
|------------|------------|-----------------|---------|
| **Accessibility Service** | Know when user opens Instagram/YouTube | Phone Settings (manual) | Core blocking |
| **Display over other apps (Overlay)** | Show block screen on top | Phone Settings | Native block modal |
| **Usage Access** | Screen time statistics | Phone Settings | Overview + daily limits |
| `INTERNET` | React Native dev/debug | Auto | RN packager |
| `POST_NOTIFICATIONS` | Unlock/lock notifications | Android 13+ | Notifications |
| `FOREGROUND_SERVICE` | OverlayService runs legally | Auto | Overlay |
| `VIBRATE` | Haptic (planned) | Auto | Customize |

**Accessibility** is the most sensitive — users must enable it manually in Settings.

---

## 13. Android Manifest Analysis

File: `android/app/src/main/AndroidManifest.xml`

| Section | Meaning (simple) |
|---------|----------------|
| `<uses-permission INTERNET>` | Allow network (for RN) |
| `<uses-permission SYSTEM_ALERT_WINDOW>` | Draw over other apps |
| `<uses-permission PACKAGE_USAGE_STATS>` | Read app usage times |
| `<activity MainActivity>` | Main app window; `LAUNCHER` = home screen icon |
| `<service AccessibilityService>` | Background watcher for app switches |
| `<service OverlayService>` | Shows block UI overlay |
| `<receiver UnlockExpiryReceiver>` | Alarm fires when unlock expires |

---

## 14. Gradle Analysis

### `android/build.gradle` (project)
- Sets SDK 36, Kotlin 2.1.20, build tools.

### `android/app/build.gradle` (app)
- `applicationId "com.intentionalspace"`
- `minSdkVersion 24` (Android 7.0+)
- **Release signing still uses debug keystore** — change before Play Store!
- Extra deps: AndroidX activity, fragment, swiperefreshlayout

### `android/gradle.properties`
- `hermesEnabled=true` — faster JS engine
- `newArchEnabled=true` — React Native new architecture ON

---

## 15. External Libraries Report

| Library | Why used | Where used |
|---------|----------|------------|
| `react-native` 0.85.3 | Core framework | Everywhere |
| `@react-navigation/native` + `bottom-tabs` | Tab navigation | `AppNavigator.js` |
| `@reduxjs/toolkit` + `react-redux` | State management | `store.js` (light use) |
| `@react-native-async-storage/async-storage` | Save settings on phone | `storage.js` |
| `react-native-toast-message` | Pop-up messages | `toast.js`, screens |
| `react-native-screens` | Faster navigation | Navigation |
| `react-native-safe-area-context` | Notch/status bar | Navigation |

**If removed:**
- AsyncStorage → no saved settings
- Navigation → can't switch tabs
- Toast → errors silent

---

## 16. Assets Analysis

| Asset type | Location | Used for |
|------------|----------|----------|
| App icon | `android/app/src/main/res/mipmap-*` | Launcher icon |
| `overlay_intervention.xml` | `res/layout/` | Native block modal UI |
| `accessibility_service_config.xml` | `res/xml/` | Accessibility settings text |
| `strings.xml` | `res/values/` | Accessibility description |
| Emojis in UI | In JS code | Tab icons (📊 🛡️ ⚙️) |

No custom fonts folder. No large image assets in JS.

---

## 17. Feature Dependency Map

### Feature: Block YouTube when opened

```
User opens YouTube
    ↓
AccessibilityService.kt (detect)
    ↓
BlockedAppsHelper.kt (is youtube blocked?)
    ↓
UnlockStateStore.kt (already unlocked?)
    ↓
InterventionLauncher.kt
    ↓
OverlayService.kt (show UI)
    ↓
User picks minutes
    ↓
UnlockStateStore.grantUnlock + TimerService.js
    ↓
UnlockExpiryScheduler.kt (re-block later)
```

### Feature: Change which apps are blocked

```
BlockScreen.js (toggle)
    ↓
storage.js (AsyncStorage)
    ↓
nativeSync.js → IntentionalSpaceModule.syncBlockedApps
    ↓
BlockedAppsHelper.kt (native reads prefs)
```

### Feature: Overview statistics

```
OverviewScreen.js
    ↓
getTodayOverviewStatsNative()
    ↓
UsageStatsHelper.kt + DailyStatsStore.kt
```

---

## 18. Security Review

| Risk | Level | Notes |
|------|-------|-------|
| Accessibility access | **High sensitivity** | Can detect all app usage — explain clearly to users |
| Overlay | **Medium** | Can draw over any app — required for feature |
| No backend | **Low** | Data stays on device |
| Release signing with debug key | **High for production** | Change before publishing |
| Hardcoded secrets | **None found** | No API keys in repo |
| `CustomizeScreen` placeholder permissions | **Low** | May show wrong permission state |

**Recommendations:**
1. Use real release keystore for Play Store.
2. Privacy policy explaining Accessibility + Usage data.
3. Don't log sensitive data in production.

---

## 19. Beginner Maintenance Guide

### Change UI colors
- Edit: `android/app/src/constants/colors.js`
- Safe: ✅ Yes

### Add a new tracked app (e.g. Snapchat)
1. `android/app/src/utils/appConfig.js` — add to `TRACKED_APPS`
2. `BlockedAppsHelper.kt` — add to `KEY_TO_PACKAGE`
3. `TriggerAppsHelper.kt` — add package name
4. Rebuild Android app

### Add a new screen
1. Create file in `android/app/src/screens/`
2. Add to `AppNavigator.js` or new stack
3. Wire navigation

### Change block modal text (native)
- Edit: `android/app/src/main/res/layout/overlay_intervention.xml`
- Or strings inside `OverlayService.kt`

### Change session timer behavior
- Kotlin: `UnlockExpiryScheduler.kt`, `UnlockStateStore.kt`
- JS: `android/app/src/services/timer/TimerService.js`

### Build APK
```bash
cd android
.\gradlew.bat assembleRelease
```
Output: `android/app/build/outputs/apk/release/app-release.apk`

---

## 20. Deployment Guide

| Build type | Command | Output |
|------------|---------|--------|
| Debug (dev) | `npx react-native run-android` | Installs debug APK |
| Release APK | `cd android && .\gradlew.bat assembleRelease` | `app-release.apk` |
| Release AAB (Play Store) | `.\gradlew.bat bundleRelease` | `app-release.aab` |

**Signing:** Edit `android/app/build.gradle` `signingConfigs` for production.

**Before release:**
1. Test Accessibility + Overlay on real device
2. Replace debug signing
3. Test block flow for YouTube + Instagram

---

## 21. AI Handover Report

> **Paste this section into a new AI chat** to give instant project context.

### Architecture summary

- **React Native 0.85.3** Android-focused digital wellbeing app.
- **No backend, no login.** Settings in AsyncStorage; native blocking in Kotlin.
- **Unusual structure:** JS lives under `android/app/src/` not root `src/`.
- **Dual block UI:** Native `OverlayService` (primary) + RN `BlockedAppInterventionModal` (fallback).

### Critical files (do not break)

1. `AccessibilityService.kt` — app open detection  
2. `OverlayService.kt` — block modal UI  
3. `InterventionLauncher.kt` — starts overlay  
4. `BlockedAppsHelper.kt` + `UnlockStateStore.kt` — block rules & temp unlock  
5. `UnlockExpiryScheduler.kt` — re-block after timer  
6. `nativeSync.js` — JS/Kotlin bridge  
7. `BlockScreen.js` — user-facing block settings  
8. `App.js` — root + RN intervention fallback  

### Native Android customizations

- Full accessibility + overlay + usage stats pipeline
- `UnlockExpiryReceiver` for AlarmManager timer expiry
- Custom React packages: `IntentionalSpacePackage`, `PendingAppPackage`, etc.

### Data flow one-liner

`BlockScreen` → AsyncStorage → `nativeSync` → SharedPreferences → `AccessibilityService` → `OverlayService`

### Known risks / tech debt

1. Redux set up but mostly unused — state in services + useState  
2. `CustomizeScreen` permission UI is placeholder  
3. `TimerService` in manifest without Kotlin implementation  
4. Block modal on wrong screen (HOME) — timing/foreground edge cases  
5. Release build uses debug keystore  
6. iOS not implemented for blocking features  

### Future improvements

1. Single source of truth for app list (one config file synced to Kotlin)  
2. Use Redux OR remove it  
3. Fix CustomizeScreen to use `IntentionalSpaceModule.getInterventionStatus`  
4. Add instrumentation tests for overlay lifecycle  
5. Production signing + privacy policy  

### Package names reference

| App | Android package |
|-----|-----------------|
| Instagram | `com.instagram.android` |
| YouTube | `com.google.android.youtube` |
| Twitter/X | `com.twitter.android` |
| Reddit | `com.reddit.frontpage` |
| Facebook | `com.facebook.katana` |

---

## Quick glossary

| Term | Simple meaning |
|------|----------------|
| **React Native** | Write app in JavaScript; runs on Android/iOS |
| **Kotlin** | Language for Android native code |
| **Native Module** | Bridge so JS can call Android functions |
| **Accessibility Service** | Android feature to assist users; here used to detect app changes |
| **Overlay** | Drawing on top of other apps |
| **AsyncStorage** | Save small data on phone |
| **SharedPreferences** | Android's save-small-data (Kotlin side) |
| **Intervention / Block modal** | The “take a breath” full screen |

---

*End of documentation. For code changes to blocking behavior, always test on a real Android device with Accessibility + Overlay permissions enabled.*
