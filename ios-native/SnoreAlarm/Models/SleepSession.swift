import Foundation
import SwiftData

@Model
final class SleepSession {
    var id: UUID
    var startTime: Date
    var endTime: Date?
    var audioFileURL: String?
    var tags: [String]

    @Relationship(deleteRule: .cascade, inverse: \SoundEvent.session)
    var soundEvents: [SoundEvent]

    // Computed statistics
    var duration: TimeInterval {
        guard let endTime = endTime else { return 0 }
        return endTime.timeIntervalSince(startTime)
    }

    var snoringEvents: [SoundEvent] {
        soundEvents.filter { $0.category == .snoring }
    }

    var snoringDuration: TimeInterval {
        snoringEvents.reduce(0) { $0 + $1.duration }
    }

    var snoringPercentage: Double {
        guard duration > 0 else { return 0 }
        return (snoringDuration / duration) * 100
    }

    var averageSnoringDecibels: Double {
        let snoring = snoringEvents
        guard !snoring.isEmpty else { return 0 }
        return snoring.reduce(0) { $0 + $1.decibels } / Double(snoring.count)
    }

    var maxSnoringDecibels: Double {
        snoringEvents.map { $0.decibels }.max() ?? 0
    }

    init(
        id: UUID = UUID(),
        startTime: Date = Date(),
        endTime: Date? = nil,
        audioFileURL: String? = nil,
        tags: [String] = [],
        soundEvents: [SoundEvent] = []
    ) {
        self.id = id
        self.startTime = startTime
        self.endTime = endTime
        self.audioFileURL = audioFileURL
        self.tags = tags
        self.soundEvents = soundEvents
    }
}
