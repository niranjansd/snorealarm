import Foundation
import SwiftData

enum SoundCategory: String, Codable {
    case snoring
    case talking
    case coughing
    case movement
    case ambient
    case unknown
}

@Model
final class SoundEvent {
    var id: UUID
    var timestamp: Date
    var duration: TimeInterval
    var decibels: Double
    var categoryRaw: String
    var confidence: Double
    var session: SleepSession?

    var category: SoundCategory {
        get { SoundCategory(rawValue: categoryRaw) ?? .unknown }
        set { categoryRaw = newValue.rawValue }
    }

    // Offset from session start in seconds
    var offsetFromStart: TimeInterval {
        guard let session = session else { return 0 }
        return timestamp.timeIntervalSince(session.startTime)
    }

    init(
        id: UUID = UUID(),
        timestamp: Date = Date(),
        duration: TimeInterval = 0,
        decibels: Double = 0,
        category: SoundCategory = .unknown,
        confidence: Double = 0,
        session: SleepSession? = nil
    ) {
        self.id = id
        self.timestamp = timestamp
        self.duration = duration
        self.decibels = decibels
        self.categoryRaw = category.rawValue
        self.confidence = confidence
        self.session = session
    }
}
