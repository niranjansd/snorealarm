#!/bin/bash
# SnoreAlarm Development Environment Setup Script

echo "🚀 Setting up SnoreAlarm development environment..."

# Activate conda environment (includes Java)
echo "📦 Activating conda environment..."
eval "$(conda shell.bash hook)"
conda activate snorealarm

# Setup Node.js via nvm
echo "📦 Loading Node.js..."
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 18 2>/dev/null || echo "Node 18 already active"

# Setup Android SDK (install separately)
export ANDROID_HOME="$HOME/Android/Sdk"
export PATH="$PATH:$ANDROID_HOME/emulator"
export PATH="$PATH:$ANDROID_HOME/platform-tools"
export PATH="$PATH:$ANDROID_HOME/cmdline-tools/latest/bin"

# Verify Java
echo ""
echo "✅ Environment ready!"
echo ""
echo "Java version:"
java -version 2>&1 | head -1
echo ""
echo "Node version:"
node -v
echo ""
echo "npm version:"
npm -v
echo ""

if [ -d "$ANDROID_HOME" ]; then
    echo "✅ Android SDK found at: $ANDROID_HOME"
else
    echo "⚠️  Android SDK not found. Install it with:"
    echo "   1. Download from: https://developer.android.com/studio"
    echo "   2. Or install via snap: sudo snap install android-studio --classic"
fi

echo ""
echo "🎯 Ready to develop! Use these commands:"
echo "   npm start          - Start Metro bundler"
echo "   npm run android    - Run on Android emulator/device"
echo "   npm run ios        - Run on iOS (Mac only)"
echo "   npm run web        - Run web version"
