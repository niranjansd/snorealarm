import SwiftUI
import SwiftData

struct RecordingView: View {
    @Environment(\.modelContext) private var modelContext
    @State private var viewModel = RecordingViewModel()

    var body: some View {
        NavigationStack {
            VStack(spacing: 40) {
                Spacer()

                // Status indicator
                statusView

                // Duration display
                durationView

                // Sound level meter
                soundLevelMeter

                // Detected sound indicator
                detectedSoundView

                Spacer()

                // Record button
                recordButton

                // Battery indicator
                batteryView

                Spacer()
            }
            .padding()
            .navigationTitle("SnoreAlarm")
            .onAppear {
                viewModel.setModelContext(modelContext)
            }
            .alert("Low Battery", isPresented: $viewModel.showLowBatteryAlert) {
                Button("OK", role: .cancel) { }
            } message: {
                Text("Recording stopped due to low battery. Your session has been saved.")
            }
            .alert("Error", isPresented: .constant(viewModel.error != nil)) {
                Button("OK", role: .cancel) {
                    viewModel.error = nil
                }
            } message: {
                Text(viewModel.error ?? "")
            }
        }
    }

    // MARK: - Subviews

    private var statusView: some View {
        HStack(spacing: 12) {
            Circle()
                .fill(viewModel.isRecording ? Color.red : Color.gray)
                .frame(width: 12, height: 12)
                .opacity(viewModel.isRecording ? 1 : 0.5)
                .animation(viewModel.isRecording ? .easeInOut(duration: 0.8).repeatForever() : .default, value: viewModel.isRecording)

            Text(viewModel.isRecording ? "Recording" : "Ready to Record")
                .font(.headline)
                .foregroundStyle(viewModel.isRecording ? .primary : .secondary)
        }
    }

    private var durationView: some View {
        Text(viewModel.formattedDuration)
            .font(.system(size: 64, weight: .thin, design: .monospaced))
            .foregroundStyle(viewModel.isRecording ? .primary : .secondary)
    }

    private var soundLevelMeter: some View {
        VStack(spacing: 8) {
            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    // Background
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color.gray.opacity(0.2))

                    // Level indicator
                    RoundedRectangle(cornerRadius: 4)
                        .fill(levelColor)
                        .frame(width: max(0, geometry.size.width * normalizedLevel))
                        .animation(.linear(duration: 0.1), value: normalizedLevel)
                }
            }
            .frame(height: 20)

            Text(viewModel.formattedDecibels)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding(.horizontal, 40)
    }

    private var normalizedLevel: CGFloat {
        // Convert decibels (-60 to 0) to 0-1 range
        let minDb: Double = -60
        let maxDb: Double = 0
        let clamped = max(minDb, min(maxDb, viewModel.currentDecibels))
        return CGFloat((clamped - minDb) / (maxDb - minDb))
    }

    private var levelColor: Color {
        switch viewModel.lastDetectedSound {
        case .snoring:
            return .red
        case .talking:
            return .orange
        case .coughing:
            return .yellow
        default:
            return .green
        }
    }

    private var detectedSoundView: some View {
        HStack {
            Image(systemName: iconForCategory(viewModel.lastDetectedSound))
                .foregroundStyle(colorForCategory(viewModel.lastDetectedSound))

            Text(labelForCategory(viewModel.lastDetectedSound))
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 8)
        .background(Color.gray.opacity(0.1))
        .clipShape(Capsule())
        .opacity(viewModel.isRecording ? 1 : 0.5)
    }

    private var recordButton: some View {
        Button(action: toggleRecording) {
            ZStack {
                Circle()
                    .fill(viewModel.isRecording ? Color.red.opacity(0.2) : Color.red.opacity(0.1))
                    .frame(width: 120, height: 120)

                Circle()
                    .fill(viewModel.isRecording ? Color.red : Color.red.opacity(0.8))
                    .frame(width: viewModel.isRecording ? 50 : 80, height: viewModel.isRecording ? 50 : 80)
                    .animation(.spring(response: 0.3), value: viewModel.isRecording)

                if viewModel.isRecording {
                    RoundedRectangle(cornerRadius: 6)
                        .fill(Color.white)
                        .frame(width: 24, height: 24)
                }
            }
        }
        .buttonStyle(.plain)
    }

    private var batteryView: some View {
        HStack(spacing: 4) {
            Image(systemName: batteryIcon)
                .foregroundStyle(batteryColor)

            Text("\(viewModel.batteryLevel)%")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
    }

    private var batteryIcon: String {
        switch viewModel.batteryLevel {
        case 0..<25:
            return "battery.25"
        case 25..<50:
            return "battery.50"
        case 50..<75:
            return "battery.75"
        default:
            return "battery.100"
        }
    }

    private var batteryColor: Color {
        viewModel.batteryLevel < 20 ? .red : .green
    }

    // MARK: - Actions

    private func toggleRecording() {
        if viewModel.isRecording {
            viewModel.stopRecording()
        } else {
            viewModel.startRecording()
        }
    }

    // MARK: - Helpers

    private func iconForCategory(_ category: SoundCategory) -> String {
        switch category {
        case .snoring:
            return "zzz"
        case .talking:
            return "waveform"
        case .coughing:
            return "lungs"
        case .movement:
            return "figure.walk"
        case .ambient:
            return "speaker.wave.1"
        case .unknown:
            return "questionmark"
        }
    }

    private func labelForCategory(_ category: SoundCategory) -> String {
        switch category {
        case .snoring:
            return "Snoring Detected"
        case .talking:
            return "Talking Detected"
        case .coughing:
            return "Coughing Detected"
        case .movement:
            return "Movement Detected"
        case .ambient:
            return "Ambient Sound"
        case .unknown:
            return "Unknown Sound"
        }
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
            return .green
        case .unknown:
            return .gray
        }
    }
}

#Preview {
    RecordingView()
        .modelContainer(for: [SleepSession.self, SoundEvent.self], inMemory: true)
}
