# SnoreAlarm

An iOS app that records and analyzes snoring during sleep using machine learning.

## Features

- **Sleep Recording** - Record up to 11 hours of audio with background support
- **ML Snore Detection** - Automatic snoring detection using Apple's SoundAnalysis framework
- **Sound Classification** - Distinguishes snoring from talking, coughing, and ambient sounds
- **Timeline Visualization** - Interactive graph with pinch-to-zoom and tap-to-play
- **Sleep Statistics** - Track sleep duration, snoring percentage, and loudness (dB)
- **Session History** - Review past recordings with 7-day trend analysis
- **Battery Safe** - Auto-stops recording on low battery
- **Privacy First** - All data processed and stored locally on device

## Screenshots

*Coming soon*

## Requirements

- iOS 17.0+
- Xcode 15.0+
- Swift 5.0+

## Installation

1. Clone the repository
   ```bash
   git clone https://github.com/niranjansd/snorealarm.git
   ```

2. Open `SnoreAlarm.xcodeproj` in Xcode

3. Set your Development Team in Signing & Capabilities

4. Build and run on your device or simulator

## Project Structure

```
SnoreAlarm/
├── App/
│   ├── SnoreAlarmApp.swift       # App entry point
│   └── ContentView.swift         # Tab navigation
├── Features/
│   ├── Recording/                # Recording UI and logic
│   ├── Analysis/                 # Timeline graph and statistics
│   ├── History/                  # Session history list
│   └── Settings/                 # App settings
├── Services/
│   ├── AudioService.swift        # AVFoundation recording/playback
│   ├── SoundClassifier.swift     # ML-based sound classification
│   └── BatteryMonitor.swift      # Battery level monitoring
├── Models/
│   ├── SleepSession.swift        # Sleep session data model
│   └── SoundEvent.swift          # Sound event data model
└── Assets.xcassets/              # App icons and colors
```

## Tech Stack

- **SwiftUI** - Modern declarative UI framework
- **SwiftData** - Local data persistence
- **Swift Charts** - Data visualization
- **AVFoundation** - Audio recording and playback
- **SoundAnalysis** - Apple's ML-powered sound classification

## Testing

Run unit tests with `Cmd + U` in Xcode or:

```bash
xcodebuild test -scheme SnoreAlarm -destination 'platform=iOS Simulator,name=iPhone 15'
```

### Test Coverage

- `SleepSessionTests` - Session model and statistics
- `SoundEventTests` - Sound event handling
- `AudioServiceTests` - Audio recording service
- `BatteryMonitorTests` - Battery monitoring
- `RecordingViewModelTests` - Recording view model

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
