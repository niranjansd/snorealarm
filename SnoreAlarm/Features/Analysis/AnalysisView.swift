import SwiftUI
import AVFoundation

struct AnalysisView: View {
    let session: SleepSession

    @State private var audioService = AudioService()
    @State private var isPlaying = false
    @State private var playbackProgress: Double = 0
    @State private var selectedEvent: SoundEvent?

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Statistics cards
                statisticsSection

                // Timeline graph
                timelineSection

                // Playback controls
                playbackSection

                // Event list
                eventListSection
            }
            .padding()
        }
        .navigationTitle("Analysis")
        .navigationBarTitleDisplayMode(.inline)
    }

    // MARK: - Statistics Section

    private var statisticsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Sleep Statistics")
                .font(.headline)

            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 16) {
                StatCard(
                    title: "Sleep Duration",
                    value: formatDuration(session.duration),
                    icon: "bed.double.fill",
                    color: .blue
                )

                StatCard(
                    title: "Snoring Duration",
                    value: formatDuration(session.snoringDuration),
                    icon: "zzz",
                    color: .red
                )

                StatCard(
                    title: "Snoring Rate",
                    value: String(format: "%.1f%%", session.snoringPercentage),
                    icon: "percent",
                    color: .orange
                )

                StatCard(
                    title: "Avg Loudness",
                    value: String(format: "%.0f dB", session.averageSnoringDecibels),
                    icon: "speaker.wave.2.fill",
                    color: .purple
                )

                StatCard(
                    title: "Max Loudness",
                    value: String(format: "%.0f dB", session.maxSnoringDecibels),
                    icon: "speaker.wave.3.fill",
                    color: .pink
                )

                StatCard(
                    title: "Events",
                    value: "\(session.snoringEvents.count)",
                    icon: "list.bullet",
                    color: .green
                )
            }
        }
    }

    // MARK: - Timeline Section

    private var timelineSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            TimelineGraphView(session: session) { event in
                selectedEvent = event
                playFromEvent(event)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .shadow(color: .black.opacity(0.05), radius: 8)
    }

    // MARK: - Playback Section

    private var playbackSection: some View {
        VStack(spacing: 16) {
            // Progress bar
            VStack(spacing: 4) {
                GeometryReader { geometry in
                    ZStack(alignment: .leading) {
                        Rectangle()
                            .fill(Color.gray.opacity(0.2))
                            .frame(height: 4)

                        Rectangle()
                            .fill(Color.blue)
                            .frame(width: geometry.size.width * playbackProgress, height: 4)
                    }
                    .clipShape(RoundedRectangle(cornerRadius: 2))
                    .gesture(
                        DragGesture(minimumDistance: 0)
                            .onChanged { value in
                                let progress = min(max(0, value.location.x / geometry.size.width), 1)
                                seekTo(progress: progress)
                            }
                    )
                }
                .frame(height: 4)

                HStack {
                    Text(formatTime(playbackProgress * audioService.playbackDuration))
                        .font(.caption2)
                        .foregroundStyle(.secondary)

                    Spacer()

                    Text(formatTime(audioService.playbackDuration))
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }

            // Playback controls
            HStack(spacing: 32) {
                Button(action: skipBackward) {
                    Image(systemName: "gobackward.15")
                        .font(.title2)
                }

                Button(action: togglePlayback) {
                    Image(systemName: isPlaying ? "pause.circle.fill" : "play.circle.fill")
                        .font(.system(size: 56))
                        .foregroundStyle(.blue)
                }

                Button(action: skipForward) {
                    Image(systemName: "goforward.15")
                        .font(.title2)
                }
            }
            .foregroundStyle(.primary)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .shadow(color: .black.opacity(0.05), radius: 8)
    }

    // MARK: - Event List Section

    private var eventListSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Sound Events")
                    .font(.headline)

                Spacer()

                Text("\(session.soundEvents.count) total")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            LazyVStack(spacing: 8) {
                ForEach(session.soundEvents.prefix(20), id: \.id) { event in
                    EventRow(event: event, isSelected: selectedEvent?.id == event.id) {
                        selectedEvent = event
                        playFromEvent(event)
                    }
                }

                if session.soundEvents.count > 20 {
                    Text("+ \(session.soundEvents.count - 20) more events")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .frame(maxWidth: .infinity)
                        .padding()
                }
            }
        }
    }

    // MARK: - Actions

    private func togglePlayback() {
        guard let urlString = session.audioFileURL,
              let url = URL(string: urlString) else { return }

        if isPlaying {
            audioService.pausePlayback()
            isPlaying = false
        } else {
            do {
                try audioService.play(url: url)
                isPlaying = true
                startPlaybackTimer()
            } catch {
                print("Playback error: \(error)")
            }
        }
    }

    private func playFromEvent(_ event: SoundEvent) {
        guard let urlString = session.audioFileURL,
              let url = URL(string: urlString) else { return }

        do {
            try audioService.playAt(url: url, time: event.offsetFromStart)
            isPlaying = true
            startPlaybackTimer()
        } catch {
            print("Playback error: \(error)")
        }
    }

    private func seekTo(progress: Double) {
        let time = progress * audioService.playbackDuration
        audioService.seekTo(time: time)
        playbackProgress = progress
    }

    private func skipBackward() {
        let newTime = max(0, audioService.playbackCurrentTime - 15)
        audioService.seekTo(time: newTime)
        updatePlaybackProgress()
    }

    private func skipForward() {
        let newTime = min(audioService.playbackDuration, audioService.playbackCurrentTime + 15)
        audioService.seekTo(time: newTime)
        updatePlaybackProgress()
    }

    private func startPlaybackTimer() {
        Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { timer in
            if !audioService.isPlaying {
                timer.invalidate()
                isPlaying = false
            }
            updatePlaybackProgress()
        }
    }

    private func updatePlaybackProgress() {
        guard audioService.playbackDuration > 0 else {
            playbackProgress = 0
            return
        }
        playbackProgress = audioService.playbackCurrentTime / audioService.playbackDuration
    }

    // MARK: - Helpers

    private func formatDuration(_ duration: TimeInterval) -> String {
        let hours = Int(duration) / 3600
        let minutes = (Int(duration) % 3600) / 60

        if hours > 0 {
            return "\(hours)h \(minutes)m"
        }
        return "\(minutes)m"
    }

    private func formatTime(_ time: TimeInterval) -> String {
        let minutes = Int(time) / 60
        let seconds = Int(time) % 60
        return String(format: "%d:%02d", minutes, seconds)
    }
}

// MARK: - Supporting Views

struct StatCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .foregroundStyle(color)

                Spacer()
            }

            Text(value)
                .font(.title2)
                .fontWeight(.semibold)

            Text(title)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .shadow(color: .black.opacity(0.05), radius: 8)
    }
}

struct EventRow: View {
    let event: SoundEvent
    let isSelected: Bool
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            HStack {
                // Category icon
                Image(systemName: iconForCategory)
                    .foregroundStyle(colorForCategory)
                    .frame(width: 24)

                // Time
                Text(formatEventTime)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .frame(width: 60, alignment: .leading)

                // Category label
                Text(event.category.rawValue.capitalized)
                    .font(.subheadline)

                Spacer()

                // Decibels
                Text(String(format: "%.0f dB", event.decibels))
                    .font(.caption)
                    .foregroundStyle(.secondary)

                // Play indicator
                Image(systemName: "play.fill")
                    .font(.caption)
                    .foregroundStyle(.blue)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(isSelected ? Color.blue.opacity(0.1) : Color.clear)
            .clipShape(RoundedRectangle(cornerRadius: 8))
        }
        .buttonStyle(.plain)
    }

    private var iconForCategory: String {
        switch event.category {
        case .snoring: return "zzz"
        case .talking: return "waveform"
        case .coughing: return "lungs"
        case .movement: return "figure.walk"
        case .ambient: return "speaker.wave.1"
        case .unknown: return "questionmark"
        }
    }

    private var colorForCategory: Color {
        switch event.category {
        case .snoring: return .red
        case .talking: return .orange
        case .coughing: return .yellow
        case .movement: return .blue
        case .ambient: return .gray
        case .unknown: return .gray
        }
    }

    private var formatEventTime: String {
        let offset = event.offsetFromStart
        let hours = Int(offset) / 3600
        let minutes = (Int(offset) % 3600) / 60
        let seconds = Int(offset) % 60

        if hours > 0 {
            return String(format: "%d:%02d:%02d", hours, minutes, seconds)
        }
        return String(format: "%02d:%02d", minutes, seconds)
    }
}

#Preview {
    let session = SleepSession(
        startTime: Date().addingTimeInterval(-28800),
        endTime: Date(),
        soundEvents: [
            SoundEvent(timestamp: Date().addingTimeInterval(-27000), duration: 30, decibels: -30, category: .snoring, confidence: 0.8),
            SoundEvent(timestamp: Date().addingTimeInterval(-25000), duration: 15, decibels: -25, category: .snoring, confidence: 0.9),
            SoundEvent(timestamp: Date().addingTimeInterval(-20000), duration: 10, decibels: -35, category: .talking, confidence: 0.7),
        ]
    )

    return NavigationStack {
        AnalysisView(session: session)
    }
}
