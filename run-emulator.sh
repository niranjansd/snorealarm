#!/bin/bash
# Android Emulator Launch Script for WSL2

cd ~/Android/Sdk/emulator

# Set library paths for emulator's bundled libraries
export LD_LIBRARY_PATH="$PWD/lib64:$PWD/lib64/qt/lib:$PWD/lib64/gles_swiftshader:$LD_LIBRARY_PATH"

# Set QT to use offscreen platform (no GUI)
export QT_QPA_PLATFORM=offscreen

# Launch emulator in headless mode (no window - perfect for WSL2)
./emulator -avd Pixel_7 -no-audio -no-window -gpu swiftshader_indirect "$@"
