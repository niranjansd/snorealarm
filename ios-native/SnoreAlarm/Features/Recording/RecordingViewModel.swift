import Foundation
import SwiftData
import Combine

@Observable
final class RecordingViewModel: SoundClassifierDelegate {
    private let audioService: AudioService
    private let soundClassifier: SoundClassifier
    private let batteryMonitor: BatteryMonitor
    private var modelContext: ModelContext?

    private var currentSession: SleepSession?
    private var soundEventBuffer: [SoundEvent] = []
    private var meteringTimer: Timer?
    private var lastEventTime: Date?
    private var eventDebounceInterval: TimeInterval = 2.0 // Minimum time between events

    var isRecording: Bool = false
    var recordingDuration: TimeInterval = 0
    var currentDecibels: Double = -60
    var lastDetectedSound: SoundCategory = .ambient
    var batteryLevel: Int = 100
    var showLowBatteryAlert: Bool = false
    var error: String?

    init(
        audioService: AudioService = AudioService(),
        soundClassifier: SoundClassifier = SoundClassifier(),
        batteryMonitor: BatteryMonitor = BatteryMonitor()
    ) {
        self.audioService = audioService
        self.soundClassifier = soundClassifier
        self.batteryMonitor = batteryMonitor

        soundClassifier.delegate = self
        setupBatteryMonitoring()
    }

    func setModelContext(_ context: ModelContext) {
        self.modelContext = context
    }

    private func setupBatteryMonitoring() {
        batteryMonitor.onLowBattery = { [weak self] in
            self?.handleLowBattery()
        }
    }

    private func handleLowBattery() {
        guard isRecording else { return }
        showLowBatteryAlert = true
        stopRecording()
    }

    // MARK: - Recording Control

    func startRecording() {
        guard !isRecording else { return }

        do {
            let audioURL = try audioService.startRecording()
            try soundClassifier.startAnalyzing()

            currentSession = SleepSession(
                startTime: Date(),
                audioFileURL: audioURL.absoluteString
            )

            soundEventBuffer = []
            isRecording = true
            error = nil

            startMeteringTimer()

        } catch {
            self.error = "Failed to start recording: \(error.localizedDescription)"
        }
    }

    func stopRecording() {
        guard isRecording else { return }

        stopMeteringTimer()
        audioService.stopRecording()
        soundClassifier.stopAnalyzing()

        currentSession?.endTime = Date()

        // Save buffered events and session
        saveSession()

        isRecording = false
        recordingDuration = 0
    }

    private func saveSession() {
        guard let session = currentSession, let context = modelContext else { return }

        // Add all buffered events to session
        session.soundEvents = soundEventBuffer

        context.insert(session)

        do {
            try context.save()
        } catch {
            self.error = "Failed to save session: \(error.localizedDescription)"
        }

        currentSession = nil
        soundEventBuffer = []
    }

    // MARK: - Metering

    private func startMeteringTimer() {
        meteringTimer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { [weak self] _ in
            self?.updateMetering()
        }
    }

    private func stopMeteringTimer() {
        meteringTimer?.invalidate()
        meteringTimer = nil
    }

    private func updateMetering() {
        audioService.updateMetering()
        recordingDuration = audioService.recordingDuration
        currentDecibels = Double(audioService.currentDecibels)
        batteryLevel = batteryMonitor.batteryPercentage
    }

    // MARK: - SoundClassifierDelegate

    func soundClassifier(_ classifier: SoundClassifier, didDetectSound category: SoundCategory, confidence: Double, decibels: Double) {
        lastDetectedSound = category
        currentDecibels = decibels

        // Debounce events - don't create too many
        let now = Date()
        if let lastTime = lastEventTime, now.timeIntervalSince(lastTime) < eventDebounceInterval {
            // If same category, just update the last event's duration
            if let lastEvent = soundEventBuffer.last, lastEvent.category == category {
                lastEvent.duration = now.timeIntervalSince(lastEvent.timestamp)
                if decibels > lastEvent.decibels {
                    lastEvent.decibels = decibels
                }
            }
            return
        }

        // Create new event for significant sounds
        if category != .ambient && confidence > 0.4 {
            let event = SoundEvent(
                timestamp: now,
                duration: 1.0,
                decibels: decibels,
                category: category,
                confidence: confidence
            )
            soundEventBuffer.append(event)
            lastEventTime = now
        }
    }

    // MARK: - Formatting

    var formattedDuration: String {
        let hours = Int(recordingDuration) / 3600
        let minutes = (Int(recordingDuration) % 3600) / 60
        let seconds = Int(recordingDuration) % 60

        if hours > 0 {
            return String(format: "%d:%02d:%02d", hours, minutes, seconds)
        } else {
            return String(format: "%02d:%02d", minutes, seconds)
        }
    }

    var formattedDecibels: String {
        String(format: "%.0f dB", currentDecibels)
    }
}
