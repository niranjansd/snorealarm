import XCTest
import AVFoundation
@testable import SnoreAlarm

final class AudioServiceTests: XCTestCase {

    var audioService: AudioService!

    override func setUpWithError() throws {
        audioService = AudioService()
    }

    override func tearDownWithError() throws {
        if audioService.isRecording {
            audioService.stopRecording()
        }
        if audioService.isPlaying {
            audioService.stopPlayback()
        }
        audioService = nil
    }

    // MARK: - Initialization Tests

    func testAudioServiceInitialState() {
        XCTAssertFalse(audioService.isRecording)
        XCTAssertFalse(audioService.isPlaying)
        XCTAssertNil(audioService.currentRecordingURL)
    }

    // MARK: - Metering Tests

    func testInitialDecibelLevel() {
        // Initial decibels should be at silence level (-160)
        XCTAssertEqual(audioService.currentDecibels, -160)
    }

    func testNormalizedDecibels() {
        // At silence (-160 dB clamped to -60), normalized should be 0
        let normalized = audioService.normalizedDecibels()
        XCTAssertGreaterThanOrEqual(normalized, 0)
        XCTAssertLessThanOrEqual(normalized, 1)
    }

    func testNormalizedDecibelsRange() {
        // Normalized value should always be between 0 and 1
        audioService.currentDecibels = -60 // Min threshold
        XCTAssertEqual(audioService.normalizedDecibels(), 0, accuracy: 0.01)

        audioService.currentDecibels = 0 // Max threshold
        XCTAssertEqual(audioService.normalizedDecibels(), 1, accuracy: 0.01)

        audioService.currentDecibels = -30 // Middle value
        XCTAssertEqual(audioService.normalizedDecibels(), 0.5, accuracy: 0.01)
    }

    // MARK: - Recording Duration Tests

    func testRecordingDurationWhenNotRecording() {
        XCTAssertEqual(audioService.recordingDuration, 0)
    }

    // MARK: - Playback Duration Tests

    func testPlaybackDurationWhenNotPlaying() {
        XCTAssertEqual(audioService.playbackDuration, 0)
        XCTAssertEqual(audioService.playbackCurrentTime, 0)
    }

    // MARK: - File URL Generation Tests

    func testGetRecordingURLWithNoURL() {
        let session = SleepSession()
        let url = audioService.getRecordingURL(for: session)
        XCTAssertNil(url)
    }

    func testGetRecordingURLWithValidURL() {
        let session = SleepSession(audioFileURL: "file:///path/to/recording.m4a")
        let url = audioService.getRecordingURL(for: session)
        XCTAssertNotNil(url)
        XCTAssertEqual(url?.lastPathComponent, "recording.m4a")
    }

    // MARK: - Seek Tests

    func testSeekWhenNotPlaying() {
        // Seeking when not playing should not crash
        audioService.seekTo(time: 30)
        XCTAssertEqual(audioService.playbackCurrentTime, 0)
    }

    // MARK: - Stop Tests

    func testStopRecordingWhenNotRecording() {
        // Stopping when not recording should not crash
        audioService.stopRecording()
        XCTAssertFalse(audioService.isRecording)
    }

    func testStopPlaybackWhenNotPlaying() {
        // Stopping when not playing should not crash
        audioService.stopPlayback()
        XCTAssertFalse(audioService.isPlaying)
    }

    func testPausePlaybackWhenNotPlaying() {
        // Pausing when not playing should not crash
        audioService.pausePlayback()
        XCTAssertFalse(audioService.isPlaying)
    }
}
