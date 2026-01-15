# SnoreAlarm

A cross-platform app that records and analyzes snoring during sleep using machine learning.

**Available on iOS, Android, and Web.**

## Features

- **Sleep Recording** - Record up to 11 hours of audio with background support
- **ML Snore Detection** - Automatic snoring detection using machine learning
- **Sound Classification** - Distinguishes snoring from talking, coughing, and ambient sounds
- **Timeline Visualization** - Interactive graph showing sound events throughout the night
- **Sleep Statistics** - Track sleep duration, snoring percentage, and loudness (dB)
- **Session History** - Review past recordings with 7-day trend analysis
- **Battery Safe** - Auto-stops recording on low battery
- **Privacy First** - All data processed and stored locally on device

## Screenshots

*Coming soon*

## Project Structure

This repository contains two implementations:

```
snorealarm/
├── src/                    # React Native (Cross-platform)
│   ├── screens/            # UI screens
│   ├── services/           # Audio, classification, storage
│   ├── models/             # TypeScript types
│   ├── navigation/         # React Navigation setup
│   └── utils/              # Helper functions
├── ios/                    # React Native iOS build
├── android/                # React Native Android build
└── ios-native/             # Native iOS app (SwiftUI)
    ├── SnoreAlarm/         # Swift source files
    └── SnoreAlarmTests/    # Unit tests
```

---

## React Native (Cross-Platform)

### Requirements

- Node.js 18+
- npm or yarn
- For iOS: macOS, Xcode 15+, CocoaPods
- For Android: Android Studio, JDK 17

### Installation

```bash
# Clone the repository
git clone https://github.com/niranjansd/snorealarm.git
cd snorealarm

# Install dependencies
npm install

# iOS only: Install pods
cd ios && pod install && cd ..
```

### Running the App

```bash
# Start Metro bundler
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

### Tech Stack

- **React Native** - Cross-platform mobile framework
- **TypeScript** - Type-safe JavaScript
- **React Navigation** - Navigation library
- **AsyncStorage** - Local data persistence
- **react-native-chart-kit** - Data visualization
- **react-native-fs** - File system access

---

## Native iOS (SwiftUI)

For the best iOS experience with native performance and Apple's SoundAnalysis framework.

### Requirements

- iOS 17.0+
- Xcode 15.0+
- Swift 5.0+

### Installation

```bash
cd ios-native
open SnoreAlarm.xcodeproj
```

Set your Development Team in Signing & Capabilities, then build and run.

### Tech Stack

- **SwiftUI** - Modern declarative UI
- **SwiftData** - Local persistence
- **Swift Charts** - Data visualization
- **AVFoundation** - Audio recording/playback
- **SoundAnalysis** - Apple's ML-powered sound classification

### Testing

```bash
cd ios-native
xcodebuild test -scheme SnoreAlarm -destination 'platform=iOS Simulator,name=iPhone 15'
```

---

## Privacy

SnoreAlarm is designed with privacy in mind:

- No account or registration required
- All audio processing happens on-device
- No data is uploaded to any server
- Recordings are stored locally and can be deleted at any time

## Disclaimer

SnoreAlarm is not a medical device. It is intended for informational purposes only and does not provide medical advice, diagnosis, or treatment. If you have concerns about your sleep or snoring, please consult a healthcare professional.

## License

MIT License - see [LICENSE](LICENSE) for details.
