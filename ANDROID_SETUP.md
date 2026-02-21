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

## Step 4: Testing Options

You have two options for testing your app: **Emulator** or **Physical Device**

### Option A: Android Emulator (Good for Quick Testing)

#### Handling KVM Access Issues on WSL2

On WSL2, you'll likely see `/dev/kvm access denied`. This is normal - WSL2 doesn't support hardware acceleration.

**Solution: Use Software Rendering**

When creating your Virtual Device in Android Studio:

1. After selecting device and system image
2. Click **"Show Advanced Settings"**
3. Under **"Emulated Performance"**:
   - **Graphics:** `Software - GLES 2.0` (NOT Automatic or Hardware)
   - **Boot option:** `Cold boot`
4. Click **Finish**

**Note:** The emulator will be slower but fully functional.

#### Running on Emulator:

```bash
cd /home/lebeast/code/snorealarm
source ./setup-dev.sh

# Terminal 1: Start Metro bundler
npm start

# Terminal 2: Launch emulator and run app
npm run android
```

---

### Option B: Physical Android Device (Recommended for Real Testing) 🎯

**Advantages:**
- ✅ Faster than emulator
- ✅ Tests microphone with real hardware
- ✅ No KVM issues
- ✅ Real-world performance

#### Setup USB Debugging on Your Phone:

1. **Enable Developer Options:**
   - Settings → About Phone
   - Tap "Build Number" 7 times
   - You'll see "You are now a developer!"

2. **Enable USB Debugging:**
   - Settings → Developer Options
   - Toggle **USB Debugging** ON

3. **Connect Phone to Computer**

#### Setup USB Passthrough (WSL2 → Phone):

**On Windows (PowerShell as Administrator):**

```powershell
# Install USB/IP tool (one-time setup)
winget install --interactive --exact dorssel.usbipd-win

# List USB devices to find your phone
usbipd list

# Bind your Android device (replace X-Y with your device's bus ID)
usbipd bind --busid X-Y

# Attach to WSL2
usbipd attach --wsl --busid X-Y
```

**In WSL2, verify connection:**

```bash
source ~/code/snorealarm/setup-dev.sh
adb devices
# Should show: XXXXXXXXX  device
```

**Allow USB Debugging on Phone:**
- When you connect, your phone will show a popup
- Check "Always allow from this computer"
- Tap **OK**

#### Running on Physical Device:

```bash
cd /home/lebeast/code/snorealarm
source ./setup-dev.sh

# Terminal 1: Start Metro bundler
npm start

# Terminal 2: Deploy to phone
npm run android
```

The app will install and launch on your phone automatically!

---

## Step 5: Daily Development Workflow

### Start your dev session:
```bash
cd /home/lebeast/code/snorealarm
source ./setup-dev.sh
```

This activates:
- ✅ Conda environment (Java)
- ✅ Node.js via nvm
- ✅ Android SDK paths

## Step 6: Verifying Setup

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
- **For emulator:** Open Android Studio → Device Manager → Launch emulator
- **For physical device:** 
  - Check USB debugging is enabled on phone
  - On Windows: Verify `usbipd attach --wsl --busid X-Y` is run
  - In WSL2: Run `adb devices` to verify connection
  - Try unplugging and replugging the USB cable

### "SDK not found"
Check that `~/Android/Sdk` exists. If not, reinstall Android Studio and SDK.

### "/dev/kvm access denied" or "KVM not available"
This is normal on WSL2. Use **Software rendering** for your emulator (see Step 4, Option A above), or use a physical device instead.

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
