import SwiftUI
import SwiftData

struct HistoryView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \SleepSession.startTime, order: .reverse) private var sessions: [SleepSession]

    @State private var showingDeleteAlert = false
    @State private var sessionToDelete: SleepSession?

    var body: some View {
        NavigationStack {
            Group {
                if sessions.isEmpty {
                    emptyStateView
                } else {
                    sessionListView
                }
            }
            .navigationTitle("History")
            .alert("Delete Session", isPresented: $showingDeleteAlert) {
                Button("Cancel", role: .cancel) { }
                Button("Delete", role: .destructive) {
                    if let session = sessionToDelete {
                        deleteSession(session)
                    }
                }
            } message: {
                Text("Are you sure you want to delete this recording? This action cannot be undone.")
            }
        }
    }

    // MARK: - Empty State

    private var emptyStateView: some View {
        VStack(spacing: 16) {
            Image(systemName: "moon.zzz")
                .font(.system(size: 64))
                .foregroundStyle(.secondary)

            Text("No Recordings Yet")
                .font(.headline)

            Text("Start your first sleep recording to see your history here.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
        }
    }

    // MARK: - Session List

    private var sessionListView: some View {
        List {
            // Summary section
            Section {
                summaryCard
            }

            // Sessions by date
            ForEach(groupedSessions.keys.sorted(by: >), id: \.self) { date in
                Section(header: Text(formatSectionDate(date))) {
                    ForEach(groupedSessions[date] ?? [], id: \.id) { session in
                        NavigationLink(destination: AnalysisView(session: session)) {
                            SessionRow(session: session)
                        }
                        .swipeActions(edge: .trailing) {
                            Button(role: .destructive) {
                                sessionToDelete = session
                                showingDeleteAlert = true
                            } label: {
                                Label("Delete", systemImage: "trash")
                            }
                        }
                    }
                }
            }
        }
        .listStyle(.insetGrouped)
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Last 7 Days")
                .font(.headline)

            HStack(spacing: 24) {
                SummaryItem(
                    value: "\(recentSessions.count)",
                    label: "Sessions",
                    icon: "bed.double.fill"
                )

                SummaryItem(
                    value: String(format: "%.0f%%", averageSnoringPercentage),
                    label: "Avg Snoring",
                    icon: "chart.line.uptrend.xyaxis"
                )

                SummaryItem(
                    value: formatDuration(totalSleepDuration),
                    label: "Total Sleep",
                    icon: "clock.fill"
                )
            }
        }
        .padding(.vertical, 8)
    }

    // MARK: - Computed Properties

    private var groupedSessions: [Date: [SleepSession]] {
        Dictionary(grouping: sessions) { session in
            Calendar.current.startOfDay(for: session.startTime)
        }
    }

    private var recentSessions: [SleepSession] {
        let sevenDaysAgo = Calendar.current.date(byAdding: .day, value: -7, to: Date()) ?? Date()
        return sessions.filter { $0.startTime >= sevenDaysAgo }
    }

    private var averageSnoringPercentage: Double {
        guard !recentSessions.isEmpty else { return 0 }
        let total = recentSessions.reduce(0) { $0 + $1.snoringPercentage }
        return total / Double(recentSessions.count)
    }

    private var totalSleepDuration: TimeInterval {
        recentSessions.reduce(0) { $0 + $1.duration }
    }

    // MARK: - Actions

    private func deleteSession(_ session: SleepSession) {
        // Delete audio file
        if let urlString = session.audioFileURL, let url = URL(string: urlString) {
            try? FileManager.default.removeItem(at: url)
        }

        // Delete from database
        modelContext.delete(session)

        do {
            try modelContext.save()
        } catch {
            print("Failed to delete session: \(error)")
        }
    }

    // MARK: - Helpers

    private func formatSectionDate(_ date: Date) -> String {
        let calendar = Calendar.current
        if calendar.isDateInToday(date) {
            return "Today"
        } else if calendar.isDateInYesterday(date) {
            return "Yesterday"
        } else {
            let formatter = DateFormatter()
            formatter.dateFormat = "EEEE, MMM d"
            return formatter.string(from: date)
        }
    }

    private func formatDuration(_ duration: TimeInterval) -> String {
        let hours = Int(duration) / 3600
        let minutes = (Int(duration) % 3600) / 60

        if hours > 0 {
            return "\(hours)h \(minutes)m"
        }
        return "\(minutes)m"
    }
}

// MARK: - Supporting Views

struct SessionRow: View {
    let session: SleepSession

    var body: some View {
        HStack(spacing: 12) {
            // Snoring indicator
            ZStack {
                Circle()
                    .fill(snoringColor.opacity(0.2))
                    .frame(width: 44, height: 44)

                Image(systemName: "zzz")
                    .foregroundStyle(snoringColor)
            }

            VStack(alignment: .leading, spacing: 4) {
                // Time range
                Text(formatTimeRange)
                    .font(.subheadline)
                    .fontWeight(.medium)

                // Duration and snoring percentage
                HStack(spacing: 8) {
                    Label(formatDuration, systemImage: "clock")
                    Text("•")
                    Label(String(format: "%.0f%% snoring", session.snoringPercentage), systemImage: "chart.bar")
                }
                .font(.caption)
                .foregroundStyle(.secondary)
            }

            Spacer()

            // Tags indicator
            if !session.tags.isEmpty {
                Image(systemName: "tag.fill")
                    .font(.caption)
                    .foregroundStyle(.blue)
            }
        }
        .padding(.vertical, 4)
    }

    private var snoringColor: Color {
        switch session.snoringPercentage {
        case 0..<10:
            return .green
        case 10..<25:
            return .yellow
        case 25..<50:
            return .orange
        default:
            return .red
        }
    }

    private var formatTimeRange: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "h:mm a"

        let start = formatter.string(from: session.startTime)
        if let endTime = session.endTime {
            let end = formatter.string(from: endTime)
            return "\(start) - \(end)"
        }
        return start
    }

    private var formatDuration: String {
        let hours = Int(session.duration) / 3600
        let minutes = (Int(session.duration) % 3600) / 60

        if hours > 0 {
            return "\(hours)h \(minutes)m"
        }
        return "\(minutes)m"
    }
}

struct SummaryItem: View {
    let value: String
    let label: String
    let icon: String

    var body: some View {
        VStack(spacing: 4) {
            Image(systemName: icon)
                .foregroundStyle(.blue)

            Text(value)
                .font(.headline)

            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
}

#Preview {
    HistoryView()
        .modelContainer(for: [SleepSession.self, SoundEvent.self], inMemory: true)
}
