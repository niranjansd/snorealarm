import XCTest
import SwiftData
@testable import SnoreAlarm

final class SoundEventTests: XCTestCase {

    // MARK: - Initialization Tests

    func testEventInitialization() {
        let event = SoundEvent()

        XCTAssertNotNil(event.id)
        XCTAssertNotNil(event.timestamp)
        XCTAssertEqual(event.duration, 0)
        XCTAssertEqual(event.decibels, 0)
        XCTAssertEqual(event.category, .unknown)
        XCTAssertEqual(event.confidence, 0)
        XCTAssertNil(event.session)
    }

    func testEventWithCustomValues() {
        let timestamp = Date()
        let event = SoundEvent(
            timestamp: timestamp,
            duration: 30,
            decibels: -25,
            category: .snoring,
            confidence: 0.85
        )

        XCTAssertEqual(event.timestamp, timestamp)
        XCTAssertEqual(event.duration, 30)
        XCTAssertEqual(event.decibels, -25)
        XCTAssertEqual(event.category, .snoring)
        XCTAssertEqual(event.confidence, 0.85)
    }

    // MARK: - Category Tests

    func testSoundCategoryRawValues() {
        XCTAssertEqual(SoundCategory.snoring.rawValue, "snoring")
        XCTAssertEqual(SoundCategory.talking.rawValue, "talking")
        XCTAssertEqual(SoundCategory.coughing.rawValue, "coughing")
        XCTAssertEqual(SoundCategory.movement.rawValue, "movement")
        XCTAssertEqual(SoundCategory.ambient.rawValue, "ambient")
        XCTAssertEqual(SoundCategory.unknown.rawValue, "unknown")
    }

    func testCategoryGetterSetter() {
        let event = SoundEvent()

        event.category = .snoring
        XCTAssertEqual(event.category, .snoring)
        XCTAssertEqual(event.categoryRaw, "snoring")

        event.category = .talking
        XCTAssertEqual(event.category, .talking)
        XCTAssertEqual(event.categoryRaw, "talking")
    }

    func testCategoryWithInvalidRawValue() {
        let event = SoundEvent()
        event.categoryRaw = "invalid_category"

        XCTAssertEqual(event.category, .unknown)
    }

    // MARK: - Offset Calculation Tests

    func testOffsetFromStart() {
        let sessionStart = Date()
        let eventTime = sessionStart.addingTimeInterval(3600) // 1 hour later

        let session = SleepSession(startTime: sessionStart)
        let event = SoundEvent(timestamp: eventTime)
        event.session = session

        XCTAssertEqual(event.offsetFromStart, 3600, accuracy: 0.1)
    }

    func testOffsetFromStartWithNoSession() {
        let event = SoundEvent()

        XCTAssertEqual(event.offsetFromStart, 0)
    }

    // MARK: - Decibel Range Tests

    func testDecibelRanges() {
        // Test typical snoring decibel range (-40 to -20 dB)
        let quietSnore = SoundEvent(decibels: -40, category: .snoring)
        let loudSnore = SoundEvent(decibels: -20, category: .snoring)

        XCTAssertLessThan(quietSnore.decibels, loudSnore.decibels)
    }

    // MARK: - Confidence Tests

    func testConfidenceRange() {
        let lowConfidence = SoundEvent(confidence: 0.3)
        let highConfidence = SoundEvent(confidence: 0.9)

        XCTAssertLessThan(lowConfidence.confidence, highConfidence.confidence)
        XCTAssertGreaterThanOrEqual(lowConfidence.confidence, 0)
        XCTAssertLessThanOrEqual(highConfidence.confidence, 1)
    }
}
