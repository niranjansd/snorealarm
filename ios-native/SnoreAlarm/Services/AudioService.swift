import AVFoundation
import Foundation

@Observable
final class AudioService: NSObject {
    private var audioRecorder: AVAudioRecorder?
    private var audioPlayer: AVAudioPlayer?
    private var recordingURL: URL?

    var isRecording: Bool = false
    var isPlaying: Bool = false
    var currentRecordingURL: URL? { recordingURL }
    var recordingDuration: TimeInterval {
        audioRecorder?.currentTime ?? 0
    }

    // Audio metering for decibel levels
    var currentDecibels: Float = -160

    override init() {
        super.init()
        setupAudioSession()
    }

    private func setupAudioSession() {
        let session = AVAudioSession.sharedInstance()
        do {
            try session.setCategory(.playAndRecord, mode: .default, options: [.defaultToSpeaker, .allowBluetooth])
            try session.setActive(true)
        } catch {
            print("Failed to setup audio session: \(error)")
        }
    }

    // MARK: - Recording

    func startRecording() throws -> URL {
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd_HH-mm-ss"
        let fileName = "sleep_\(dateFormatter.string(from: Date())).m4a"
        let audioURL = documentsPath.appendingPathComponent(fileName)

        let settings: [String: Any] = [
            AVFormatIDKey: Int(kAudioFormatMPEG4AAC),
            AVSampleRateKey: 44100.0,
            AVNumberOfChannelsKey: 1,
            AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue
        ]

        audioRecorder = try AVAudioRecorder(url: audioURL, settings: settings)
        audioRecorder?.delegate = self
        audioRecorder?.isMeteringEnabled = true
        audioRecorder?.record()

        recordingURL = audioURL
        isRecording = true

        return audioURL
    }

    func stopRecording() {
        audioRecorder?.stop()
        isRecording = false
    }

    func updateMetering() {
        guard let recorder = audioRecorder, recorder.isRecording else {
            currentDecibels = -160
            return
        }
        recorder.updateMeters()
        currentDecibels = recorder.averagePower(forChannel: 0)
    }

    // Convert decibels to a normalized value (0-1)
    func normalizedDecibels() -> Float {
        // Audio power ranges from -160 dB (silence) to 0 dB (max)
        let minDb: Float = -60
        let maxDb: Float = 0
        let clampedDb = max(minDb, min(maxDb, currentDecibels))
        return (clampedDb - minDb) / (maxDb - minDb)
    }

    // MARK: - Playback

    func play(url: URL) throws {
        audioPlayer = try AVAudioPlayer(contentsOf: url)
        audioPlayer?.delegate = self
        audioPlayer?.play()
        isPlaying = true
    }

    func playAt(url: URL, time: TimeInterval) throws {
        audioPlayer = try AVAudioPlayer(contentsOf: url)
        audioPlayer?.delegate = self
        audioPlayer?.currentTime = time
        audioPlayer?.play()
        isPlaying = true
    }

    func stopPlayback() {
        audioPlayer?.stop()
        isPlaying = false
    }

    func pausePlayback() {
        audioPlayer?.pause()
        isPlaying = false
    }

    var playbackDuration: TimeInterval {
        audioPlayer?.duration ?? 0
    }

    var playbackCurrentTime: TimeInterval {
        audioPlayer?.currentTime ?? 0
    }

    func seekTo(time: TimeInterval) {
        audioPlayer?.currentTime = time
    }

    // MARK: - File Management

    func getRecordingURL(for session: SleepSession) -> URL? {
        guard let urlString = session.audioFileURL else { return nil }
        return URL(string: urlString)
    }

    func deleteRecording(at url: URL) throws {
        try FileManager.default.removeItem(at: url)
    }
}

// MARK: - AVAudioRecorderDelegate

extension AudioService: AVAudioRecorderDelegate {
    func audioRecorderDidFinishRecording(_ recorder: AVAudioRecorder, successfully flag: Bool) {
        isRecording = false
        if !flag {
            print("Recording failed")
        }
    }

    func audioRecorderEncodeErrorDidOccur(_ recorder: AVAudioRecorder, error: Error?) {
        isRecording = false
        if let error = error {
            print("Recording encode error: \(error)")
        }
    }
}

// MARK: - AVAudioPlayerDelegate

extension AudioService: AVAudioPlayerDelegate {
    func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
        isPlaying = false
    }

    func audioPlayerDecodeErrorDidOccur(_ player: AVAudioPlayer, error: Error?) {
        isPlaying = false
        if let error = error {
            print("Playback decode error: \(error)")
        }
    }
}
