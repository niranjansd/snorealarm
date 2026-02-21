# Android Development Setup

## Overview

This project uses a **hybrid setup**:
- **Conda environment** - Manages Java/JDK and Python
- **System install** - Android Studio and Android SDK
- **nvm** - Manages Node.js versions

## Step 1: Environment Setup (Already Done ✅)

```bash
# Conda environment with Java 17 is already created
conda activate snorealarm
```

## Step 2: Install Android Studio

### Option A: Using snap (Recommended)
```bash
sudo snap install android-studio --classic
```

### Option B: Manual Download
1. Download from https://developer.android.com/studio
2. Extract and run `studio.sh`

## Step 3: Configure Android Studio

1. **First Launch**:
   - Open Android Studio
   - Follow the setup wizard
   - Install Android SDK

2. **SDK Manager** (Tools → SDK Manager):
   - ✅ Android SDK Platform 33 (or latest)
   - ✅ Android SDK Build-Tools
   - ✅ Android Emulator
   - ✅ Android SDK Platform-Tools
   - ✅ Android SDK Command-line Tools

3. **Create Virtual Device** (Tools → Device Manager):
   - Click "Create Device"
   - Choose a phone (e.g., Pixel 5)
   - Download a system image (e.g., Android 13 - API 33)
   - Finish setup

## Step 4: Daily Development Workflow

### Start your dev session:
```bash
cd /home/lebeast/code/snorealarm
source ./setup-dev.sh
```

This activates:
- ✅ Conda environment (Java)
- ✅ Node.js via nvm
- ✅ Android SDK paths

### Run the app:

**For emulator development:**
```bash
# In terminal 1: Start Metro bundler
npm start

# In terminal 2: Launch app on emulator
npm run android
```

**For physical device testing (when ready):**
1. Enable Developer Options on your Android phone:
   - Settings → About Phone → Tap "Build Number" 7 times
2. Enable USB Debugging:
   - Settings → Developer Options → USB Debugging
3. Connect phone via USB
4. Run:
```bash
adb devices  # Should show your device
npm run android
```

## Step 5: Verifying Setup

Run these commands to verify everything:

```bash
# Should show Java 17
java -version

# Should show Node 18
node -v

# Should show Android SDK location
echo $ANDROID_HOME

# Should list connected devices/emulators
adb devices
```

## Troubleshooting

### "ANDROID_HOME not set"
Make sure you run `source ./setup-dev.sh` first

### "No devices found"
- For emulator: Open Android Studio → Device Manager → Launch emulator
- For physical: Check USB debugging is enabled and cable is connected

### "SDK not found"
Check that `~/Android/Sdk` exists. If not, reinstall Android Studio and SDK.

## What's in Conda vs System

**In Conda Environment (`snorealarm`):**
- ✅ Java/JDK 17
- ✅ Python 3.11 (for future tools/scripts)

**System-wide:**
- ✅ Android Studio (GUI app)
- ✅ Android SDK (~$HOME/Android/Sdk)
- ✅ Node.js (via nvm)

This hybrid approach gives you the best of both worlds:
- Conda manages language runtimes
- System handles IDE and SDK tools
