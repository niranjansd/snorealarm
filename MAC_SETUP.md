# SnoreAlarm - Mac Setup & Testing Guide

Complete guide for setting up and running SnoreAlarm on macOS.

---

## Prerequisites

- **macOS**: 12.0 (Monterey) or later
- **Xcode**: 15.0+ (for iOS development)
- **Command Line Tools**: Installed via Xcode

---

## Step 1: Install Node.js

### Option A: Using nvm (Recommended)

nvm allows you to manage multiple Node.js versions easily.

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Add nvm to your shell configuration
echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.zshrc
echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> ~/.zshrc
echo '[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"' >> ~/.zshrc

# Reload shell configuration
source ~/.zshrc

# Install Node.js 18
nvm install 18
nvm use 18

# Set Node 18 as default
nvm alias default 18
```

### Option B: Using Homebrew

```bash
# Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node@18
```

### Verify Installation

```bash
node -v    # Should show v18.x.x
npm -v     # Should show 10.x.x
```

---

## Step 2: Clone or Pull Repository

### If First Time (Clone)

```bash
git clone https://github.com/niranjansd/snorealarm.git
cd snorealarm
```

### If Already Cloned (Pull Latest)

```bash
cd ~/snorealarm  # or wherever you cloned it
git pull origin master
```

---

## Step 3: Set Up Environment Variables (For S3 Upload)

The app automatically uploads recordings to AWS S3. You need to configure credentials:

```bash
# Copy the example file
cp env.example .env

# Edit with your credentials
nano .env
```

**Required `.env` contents:**

```
REACT_APP_S3_REGION=us-east-1
REACT_APP_S3_BUCKET=eight-ml-scratch
REACT_APP_S3_FOLDER=nirsd/snore/audio/snorealarm
REACT_APP_S3_ACCESS_KEY=YOUR_ACCESS_KEY_HERE
REACT_APP_S3_SECRET_KEY=YOUR_SECRET_KEY_HERE
```

**Note:** Contact the admin for AWS credentials. The `.env` file is gitignored and won't be committed.

---

## Step 4: Install Dependencies

```bash
cd ~/snorealarm
npm install
```

This will take a few minutes to download all packages.

---

## Testing Options

You have three ways to test the app:

---

## Option 1: Web Version (Fastest to Test) 🌐

**Best for:** Quick testing, verifying S3 upload, development

```bash
cd ~/snorealarm
npm run web
```

**What happens:**
- Webpack dev server starts
- Browser opens automatically at http://localhost:3000
- Hot reload enabled (changes reflect instantly)

**Testing:**
1. Click the red record button
2. Allow microphone access when prompted
3. Make some sounds (talk, tap desk, etc.)
4. Stop recording
5. Check that it uploads to S3 (status shown in History)

**Stop server:** Press `Ctrl+C` in terminal

---

## Option 2: iOS Native App (Recommended) 📱

**Best for:** Best performance, real device testing, production-ready

### Requirements

Install Xcode from App Store if you haven't already.

### Setup & Run

```bash
cd ~/snorealarm/ios-native
open SnoreAlarm.xcodeproj
```

**In Xcode:**

1. **Select Target Device:**
   - Top toolbar: Click device selector
   - Choose: iPhone 15 (or any simulator)
   - Or connect your physical iPhone and select it

2. **Configure Signing (First Time Only):**
   - Select project in left sidebar
   - Go to "Signing & Capabilities"
   - Select your **Team** (Apple ID)
   - Xcode will auto-generate provisioning

3. **Run the App:**
   - Click ▶️ **Run** button (or press `Cmd+R`)
   - App builds and launches in simulator/device

### Testing on Physical iPhone

1. Connect iPhone via USB
2. On iPhone: Settings → General → VPN & Device Management
3. Trust your developer certificate
4. In Xcode: Select your iPhone as target
5. Click Run

**Features to Test:**
- Record audio
- Stop recording
- View timeline graph
- Check statistics
- Verify S3 upload in History tab

---

## Option 3: React Native iOS (Cross-Platform) ⚛️

**Best for:** Testing React Native code, cross-platform development

### Install iOS Dependencies

```bash
cd ~/snorealarm

# Install CocoaPods (if not installed)
sudo gem install cocoapods

# Install iOS pods (React Native dependencies)
cd ios-native
pod install
cd ..
```

### Run the App

**Terminal 1 (Metro Bundler):**
```bash
cd ~/snorealarm
npm start
```

**Terminal 2 (iOS Simulator):**
```bash
cd ~/snorealarm
npm run ios
```

**Or specify simulator:**
```bash
npx react-native run-ios --simulator="iPhone 15 Pro"
```

### Available Simulators

List all installed simulators:
```bash
xcrun simctl list devices
```

---

## Troubleshooting

### "command not found: npm"

Node.js not installed or not in PATH. Re-run Step 1.

### "command not found: pod"

CocoaPods not installed:
```bash
sudo gem install cocoapods
```

### "Metro bundler port already in use"

Kill existing Metro process:
```bash
lsof -ti:8081 | xargs kill -9
```

### "Failed to build iOS app"

Clean and rebuild:
```bash
cd ios-native
xcodebuild clean
cd ..
npm run ios
```

### Xcode: "No signing certificate found"

1. Xcode → Preferences → Accounts
2. Add your Apple ID
3. Download Manual Profiles
4. Select your team in project settings

### "Module not found" errors

Clear caches and reinstall:
```bash
npm run clean  # if available
rm -rf node_modules
rm -rf ios-native/Pods
npm install
cd ios-native && pod install && cd ..
```

### S3 Upload Fails

**Check:**
1. `.env` file exists with correct credentials
2. Internet connection is active
3. Check app logs in Console for detailed errors

**Test S3 credentials manually:**
```bash
# Install AWS CLI
brew install awscli

# Configure with your credentials
aws configure

# Test upload
echo "test" > test.txt
aws s3 cp test.txt s3://eight-ml-scratch/nirsd/snore/audio/snorealarm/test.txt
```

---

## Development Workflow

### Daily Development

```bash
# Pull latest changes
cd ~/snorealarm
git pull

# Install any new dependencies
npm install

# Start development
npm run web  # for web
# OR
open ios-native/SnoreAlarm.xcodeproj  # for iOS
```

### Making Changes

1. Edit code in `src/` directory
2. Web version hot-reloads automatically
3. iOS: Save file → Xcode rebuilds automatically
4. Test your changes
5. Commit when ready:
   ```bash
   git add .
   git commit -m "Your change description"
   git push
   ```

### Switching Node Versions (if using nvm)

```bash
nvm use 18  # Use Node 18 for this project
```

---

## Project Structure

```
snorealarm/
├── src/                      # React Native source code
│   ├── screens/              # App screens (Recording, History, Settings)
│   ├── services/             # Business logic (Audio, S3, Storage)
│   ├── models/               # TypeScript types
│   ├── components/           # Reusable UI components
│   ├── config/               # Configuration (S3 credentials)
│   └── utils/                # Helper functions
├── ios-native/               # Native iOS app (SwiftUI)
│   ├── SnoreAlarm/           # Swift source files
│   └── SnoreAlarm.xcodeproj  # Xcode project
├── web/                      # Web-specific files
├── android/                  # Android project (for future)
├── .env                      # AWS credentials (gitignored)
├── env.example               # Template for .env
└── package.json              # Node.js dependencies
```

---

## Useful Commands

### Development

```bash
npm start           # Start Metro bundler
npm run web         # Start web dev server
npm run ios         # Build and run iOS
npm run android     # Build and run Android (future)
```

### Maintenance

```bash
npm install         # Install/update dependencies
npm audit fix       # Fix security vulnerabilities
npm run lint        # Check code style
npm run clean       # Clean build artifacts
```

### Xcode Commands (from terminal)

```bash
# List simulators
xcrun simctl list devices

# Open simulator
open -a Simulator

# Build from command line
xcodebuild -workspace ios-native/SnoreAlarm.xcworkspace \
           -scheme SnoreAlarm \
           -configuration Debug \
           -destination 'platform=iOS Simulator,name=iPhone 15' \
           build
```

---

## Next Steps

After testing:

1. **iOS Native App** - Best for production use
2. **Web Version** - Good for quick testing and debugging
3. **React Native** - If you need Android in the future

**For production deployment:**
- iOS: Archive in Xcode → Upload to App Store Connect
- Web: Run `npm run web:build` → Deploy `dist/` folder

---

## Getting Help

- **AWS Issues**: See `AWS_S3_SETUP.md`
- **Android Setup**: See `ANDROID_SETUP.md`
- **General Questions**: Check GitHub Issues

---

## Summary - Quick Start

```bash
# 1. Install Node.js (one-time)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.zshrc
nvm install 18

# 2. Clone & Setup
git clone https://github.com/niranjansd/snorealarm.git
cd snorealarm
cp env.example .env
# Edit .env with credentials

# 3. Install & Run
npm install

# Option A: Web
npm run web

# Option B: iOS Native
open ios-native/SnoreAlarm.xcodeproj
# Press ▶️ in Xcode
```

**That's it! 🎉**
