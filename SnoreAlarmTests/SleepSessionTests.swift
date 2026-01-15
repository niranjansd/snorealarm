import XCTest
import SwiftData
@testable import SnoreAlarm

final class SleepSessionTests: XCTestCase {

    var modelContainer: ModelContainer!
    var modelContext: ModelContext!

    override func setUpWithError() throws {
        let schema = Schema([SleepSession.self, SoundEvent.self])
        let config = ModelConfiguration(isStoredInMemoryOnly: true)
        modelContainer = try ModelContainer(for: schema, configurations: [config])
        modelContext = ModelContext(modelContainer)
    }

    override func tearDownWithError() throws {
        modelContainer = nil
        modelContext = nil
    }

    // MARK: - Initialization Tests

    func testSessionInitialization() {
        let session = SleepSession()

        XCTAssertNotNil(session.id)
        XCTAssertNotNil(session.startTime)
        XCTAssertNil(session.endTime)
        XCTAssertNil(session.audioFileURL)
        XCTAssertTrue(session.tags.isEmpty)
        XCTAssertTrue(session.soundEvents.isEmpty)
    }

    func testSessionWithCustomValues() {
        let startTime = Date()
        let endTime = Date().addingTimeInterval(28800) // 8 hours
        let audioURL = "file:///path/to/recording.m4a"
        let tags = ["Test", "Sleep"]

        let session = SleepSession(
            startTime: startTime,
            endTime: endTime,
            audioFileURL: audioURL,
            tags: tags
        )

        XCTAssertEqual(session.startTime, startTime)
        XCTAssertEqual(session.endTime, endTime)
        XCTAssertEqual(session.audioFileURL, audioURL)
        XCTAssertEqual(session.tags, tags)
    }

    // MARK: - Duration Tests

    func testDurationCalculation() {
        let startTime = Date()
        let endTime = startTime.addingTimeInterval(28800) // 8 hours

        let session = SleepSession(startTime: startTime, endTime: endTime)

        XCTAssertEqual(session.duration, 28800, accuracy: 0.1)
    }

    func testDurationWithNoEndTime() {
        let session = SleepSession(startTime: Date())

        XCTAssertEqual(session.duration, 0)
    }

    // MARK: - Snoring Statistics Tests

    func testSnoringEventsFilter() {
        let session = SleepSession()
        let snoringEvent1 = SoundEvent(category: .snoring)
        let snoringEvent2 = SoundEvent(category: .snoring)
        let talkingEvent = SoundEvent(category: .talking)
        let ambientEvent = SoundEvent(category: .ambient)

        session.soundEvents = [snoringEvent1, snoringEvent2, talkingEvent, ambientEvent]

        XCTAssertEqual(session.snoringEvents.count, 2)
    }

    func testSnoringDuration() {
        let session = SleepSession(
            startTime: Date(),
            endTime: Date().addingTimeInterval(3600) // 1 hour
        )

        let event1 = SoundEvent(duration: 60, category: .snoring) // 1 minute
        let event2 = SoundEvent(duration: 120, category: .snoring) // 2 minutes
        let event3 = SoundEvent(duration: 30, category: .talking)

        session.soundEvents = [event1, event2, event3]

        XCTAssertEqual(session.snoringDuration, 180, accuracy: 0.1) // 3 minutes total
    }

    func testSnoringPercentage() {
        let session = SleepSession(
            startTime: Date(),
            endTime: Date().addingTimeInterval(3600) // 1 hour = 3600 seconds
        )

        let event = SoundEvent(duration: 360, category: .snoring) // 6 minutes = 360 seconds
        session.soundEvents = [event]

        // 360 / 3600 * 100 = 10%
        XCTAssertEqual(session.snoringPercentage, 10, accuracy: 0.1)
    }

    func testSnoringPercentageWithZeroDuration() {
        let session = SleepSession() // No end time, so duration is 0

        XCTAssertEqual(session.snoringPercentage, 0)
    }

    func testAverageSnoringDecibels() {
        let session = SleepSession()

        let event1 = SoundEvent(decibels: -30, category: .snoring)
        let event2 = SoundEvent(decibels: -20, category: .snoring)
        let event3 = SoundEvent(decibels: -10, category: .talking) // Should not count

        session.soundEvents = [event1, event2, event3]

        XCTAssertEqual(session.averageSnoringDecibels, -25, accuracy: 0.1)
    }

    func testAverageSnoringDecibelsWithNoSnoring() {
        let session = SleepSession()
        let event = SoundEvent(decibels: -30, category: .talking)
        session.soundEvents = [event]

        XCTAssertEqual(session.averageSnoringDecibels, 0)
    }

    func testMaxSnoringDecibels() {
        let session = SleepSession()

        let event1 = SoundEvent(decibels: -30, category: .snoring)
        let event2 = SoundEvent(decibels: -15, category: .snoring)
        let event3 = SoundEvent(decibels: -5, category: .talking) // Should not count

        session.soundEvents = [event1, event2, event3]

        XCTAssertEqual(session.maxSnoringDecibels, -15)
    }

    // MARK: - Persistence Tests

    func testSessionPersistence() throws {
        let session = SleepSession(
            startTime: Date(),
            endTime: Date().addingTimeInterval(28800),
            tags: ["Test"]
        )

        modelContext.insert(session)
        try modelContext.save()

        let fetchDescriptor = FetchDescriptor<SleepSession>()
        let sessions = try modelContext.fetch(fetchDescriptor)

        XCTAssertEqual(sessions.count, 1)
        XCTAssertEqual(sessions.first?.tags, ["Test"])
    }
}
