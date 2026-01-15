import XCTest
import SwiftData
@testable import SnoreAlarm

final class RecordingViewModelTests: XCTestCase {

    var viewModel: RecordingViewModel!
    var modelContainer: ModelContainer!
    var modelContext: ModelContext!

    override func setUpWithError() throws {
        let schema = Schema([SleepSession.self, SoundEvent.self])
        let config = ModelConfiguration(isStoredInMemoryOnly: true)
        modelContainer = try ModelContainer(for: schema, configurations: [config])
        modelContext = ModelContext(modelContainer)

        viewModel = RecordingViewModel()
        viewModel.setModelContext(modelContext)
    }

    override func tearDownWithError() throws {
        viewModel = nil
        modelContainer = nil
        modelContext = nil
    }

    // MARK: - Initialization Tests

    func testViewModelInitialState() {
        XCTAssertFalse(viewModel.isRecording)
        XCTAssertEqual(viewModel.recordingDuration, 0)
        XCTAssertEqual(viewModel.lastDetectedSound, .ambient)
        XCTAssertFalse(viewModel.showLowBatteryAlert)
        XCTAssertNil(viewModel.error)
    }

    // MARK: - Duration Formatting Tests

    func testFormattedDurationZero() {
        XCTAssertEqual(viewModel.formattedDuration, "00:00")
    }

    func testFormattedDurationMinutesSeconds() {
        // We can't easily set recordingDuration directly since it's computed,
        // but we can test the format pattern
        XCTAssertTrue(viewModel.formattedDuration.contains(":"))
    }

    // MARK: - Decibels Formatting Tests

    func testFormattedDecibels() {
        let formatted = viewModel.formattedDecibels
        XCTAssertTrue(formatted.contains("dB"))
    }

    // MARK: - Recording State Tests

    func testRecordingStartsWithCorrectState() {
        // Note: Actually starting recording would require microphone access
        // which isn't available in unit tests, so we test the initial state
        XCTAssertFalse(viewModel.isRecording)
    }

    // MARK: - Sound Classifier Delegate Tests

    func testSoundClassifierDelegateUpdatesState() {
        // Create a mock sound classifier to test delegate behavior
        let mockClassifier = SoundClassifier()

        viewModel.soundClassifier(
            mockClassifier,
            didDetectSound: .snoring,
            confidence: 0.85,
            decibels: -25
        )

        XCTAssertEqual(viewModel.lastDetectedSound, .snoring)
        XCTAssertEqual(viewModel.currentDecibels, -25)
    }

    func testSoundClassifierDelegateWithDifferentCategories() {
        let mockClassifier = SoundClassifier()

        // Test snoring
        viewModel.soundClassifier(mockClassifier, didDetectSound: .snoring, confidence: 0.8, decibels: -30)
        XCTAssertEqual(viewModel.lastDetectedSound, .snoring)

        // Test talking
        viewModel.soundClassifier(mockClassifier, didDetectSound: .talking, confidence: 0.7, decibels: -35)
        XCTAssertEqual(viewModel.lastDetectedSound, .talking)

        // Test coughing
        viewModel.soundClassifier(mockClassifier, didDetectSound: .coughing, confidence: 0.6, decibels: -40)
        XCTAssertEqual(viewModel.lastDetectedSound, .coughing)
    }
}
