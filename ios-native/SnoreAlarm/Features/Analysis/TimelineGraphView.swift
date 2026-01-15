import SwiftUI
import Charts

struct TimelineGraphView: View {
    let session: SleepSession
    var onTapEvent: ((SoundEvent) -> Void)?

    @State private var selectedEvent: SoundEvent?
    @State private var zoomScale: CGFloat = 1.0
    @State private var scrollOffset: CGFloat = 0

    private var sessionDurationHours: Double {
        session.duration / 3600
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Header with statistics
            headerView

            // Timeline chart
            chartView

            // Legend
            legendView
        }
    }

    // MARK: - Header

    private var headerView: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text("Sleep Timeline")
                    .font(.headline)

                Text(formattedDateRange)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Spacer()

            // Zoom controls
            HStack(spacing: 16) {
                Button(action: zoomOut) {
                    Image(systemName: "minus.magnifyingglass")
                }
                .disabled(zoomScale <= 0.5)

                Button(action: zoomIn) {
                    Image(systemName: "plus.magnifyingglass")
                }
                .disabled(zoomScale >= 4.0)
            }
            .buttonStyle(.bordered)
        }
    }

    // MARK: - Chart

    private var chartView: some View {
        GeometryReader { geometry in
            ScrollView(.horizontal, showsIndicators: true) {
                Chart {
                    ForEach(session.soundEvents, id: \.id) { event in
                        // Bar mark for each sound event
                        RectangleMark(
                            x: .value("Time", event.offsetFromStart / 60), // Convert to minutes
                            y: .value("Level", event.decibels),
                            width: .fixed(max(4, CGFloat(event.duration / 60) * 10 * zoomScale)),
                            height: .fixed(40)
                        )
                        .foregroundStyle(colorForCategory(event.category))
                        .opacity(selectedEvent?.id == event.id ? 1.0 : 0.8)
                    }
                }
                .chartXAxis {
                    AxisMarks(values: .automatic(desiredCount: Int(sessionDurationHours * 2))) { value in
                        AxisGridLine()
                        AxisValueLabel {
                            if let minutes = value.as(Double.self) {
                                Text(formatMinutesToTime(minutes))
                                    .font(.caption2)
                            }
                        }
                    }
                }
                .chartYAxis {
                    AxisMarks(values: [-60, -40, -20, 0]) { value in
                        AxisGridLine()
                        AxisValueLabel {
                            if let db = value.as(Double.self) {
                                Text("\(Int(db)) dB")
                                    .font(.caption2)
                            }
                        }
                    }
                }
                .chartYScale(domain: -60...0)
                .chartXScale(domain: 0...(session.duration / 60))
                .chartOverlay { proxy in
                    GeometryReader { innerGeometry in
                        Rectangle()
                            .fill(.clear)
                            .contentShape(Rectangle())
                            .onTapGesture { location in
                                handleTap(at: location, proxy: proxy, geometry: innerGeometry)
                            }
                    }
                }
                .frame(width: geometry.size.width * zoomScale, height: 200)
            }
        }
        .frame(height: 220)
    }

    // MARK: - Legend

    private var legendView: some View {
        HStack(spacing: 24) {
            legendItem(color: .red, label: "Snoring")
            legendItem(color: .orange, label: "Talking")
            legendItem(color: .yellow, label: "Coughing")
            legendItem(color: .gray, label: "Other")
        }
        .font(.caption)
    }

    private func legendItem(color: Color, label: String) -> some View {
        HStack(spacing: 4) {
            RoundedRectangle(cornerRadius: 2)
                .fill(color)
                .frame(width: 12, height: 12)
            Text(label)
                .foregroundStyle(.secondary)
        }
    }

    // MARK: - Actions

    private func zoomIn() {
        withAnimation {
            zoomScale = min(4.0, zoomScale * 1.5)
        }
    }

    private func zoomOut() {
        withAnimation {
            zoomScale = max(0.5, zoomScale / 1.5)
        }
    }

    private func handleTap(at location: CGPoint, proxy: ChartProxy, geometry: GeometryProxy) {
        guard let minuteValue: Double = proxy.value(atX: location.x) else { return }
        let tappedOffset = minuteValue * 60 // Convert minutes to seconds

        // Find closest event
        let closestEvent = session.soundEvents.min(by: { event1, event2 in
            abs(event1.offsetFromStart - tappedOffset) < abs(event2.offsetFromStart - tappedOffset)
        })

        if let event = closestEvent {
            selectedEvent = event
            onTapEvent?(event)
        }
    }

    // MARK: - Helpers

    private var formattedDateRange: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM d, h:mm a"

        let start = formatter.string(from: session.startTime)

        if let endTime = session.endTime {
            formatter.dateFormat = "h:mm a"
            let end = formatter.string(from: endTime)
            return "\(start) - \(end)"
        }

        return start
    }

    private func formatMinutesToTime(_ minutes: Double) -> String {
        let hours = Int(minutes) / 60
        let mins = Int(minutes) % 60

        if hours > 0 {
            return "\(hours)h\(mins)m"
        }
        return "\(mins)m"
    }

    private func colorForCategory(_ category: SoundCategory) -> Color {
        switch category {
        case .snoring:
            return .red
        case .talking:
            return .orange
        case .coughing:
            return .yellow
        case .movement:
            return .blue
        case .ambient:
            return .gray.opacity(0.5)
        case .unknown:
            return .gray
        }
    }
}

#Preview {
    let session = SleepSession(
        startTime: Date().addingTimeInterval(-28800), // 8 hours ago
        endTime: Date(),
        soundEvents: [
            SoundEvent(timestamp: Date().addingTimeInterval(-27000), duration: 30, decibels: -30, category: .snoring, confidence: 0.8),
            SoundEvent(timestamp: Date().addingTimeInterval(-25000), duration: 15, decibels: -25, category: .snoring, confidence: 0.9),
            SoundEvent(timestamp: Date().addingTimeInterval(-20000), duration: 10, decibels: -35, category: .talking, confidence: 0.7),
            SoundEvent(timestamp: Date().addingTimeInterval(-15000), duration: 45, decibels: -28, category: .snoring, confidence: 0.85),
            SoundEvent(timestamp: Date().addingTimeInterval(-10000), duration: 5, decibels: -40, category: .coughing, confidence: 0.6),
        ]
    )

    return TimelineGraphView(session: session)
        .padding()
}
