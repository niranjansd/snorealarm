import SwiftUI
import SwiftData

struct SettingsView: View {
    @AppStorage("lowBatteryThreshold") private var lowBatteryThreshold: Double = 10
    @AppStorage("minConfidenceThreshold") private var minConfidenceThreshold: Double = 0.4
    @AppStorage("maxRecordingHours") private var maxRecordingHours: Double = 11

    @Environment(\.modelContext) private var modelContext
    @State private var showingClearDataAlert = false
    @State private var showingAbout = false

    var body: some View {
        NavigationStack {
            Form {
                // Recording settings
                Section("Recording") {
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Text("Max Recording Duration")
                            Spacer()
                            Text("\(Int(maxRecordingHours)) hours")
                                .foregroundStyle(.secondary)
                        }

                        Slider(value: $maxRecordingHours, in: 1...12, step: 1)
                    }

                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Text("Low Battery Threshold")
                            Spacer()
                            Text("\(Int(lowBatteryThreshold))%")
                                .foregroundStyle(.secondary)
                        }

                        Slider(value: $lowBatteryThreshold, in: 5...25, step: 5)
                    }

                    Text("Recording will automatically stop when battery drops below this level.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                // Detection settings
                Section("Sound Detection") {
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Text("Detection Sensitivity")
                            Spacer()
                            Text(sensitivityLabel)
                                .foregroundStyle(.secondary)
                        }

                        Slider(value: $minConfidenceThreshold, in: 0.2...0.8, step: 0.1)
                    }

                    Text("Lower sensitivity detects more sounds but may include false positives. Higher sensitivity is more accurate but may miss some snoring events.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                // Data management
                Section("Data") {
                    Button(role: .destructive) {
                        showingClearDataAlert = true
                    } label: {
                        Label("Clear All Recordings", systemImage: "trash")
                    }

                    NavigationLink {
                        StorageInfoView()
                    } label: {
                        Label("Storage Info", systemImage: "internaldrive")
                    }
                }

                // About
                Section("About") {
                    Button {
                        showingAbout = true
                    } label: {
                        Label("About SnoreAlarm", systemImage: "info.circle")
                    }

                    Link(destination: URL(string: "https://apple.com/privacy")!) {
                        Label("Privacy Policy", systemImage: "hand.raised")
                    }
                }

                // Version
                Section {
                    HStack {
                        Text("Version")
                        Spacer()
                        Text("1.0.0")
                            .foregroundStyle(.secondary)
                    }
                }
            }
            .navigationTitle("Settings")
            .alert("Clear All Data", isPresented: $showingClearDataAlert) {
                Button("Cancel", role: .cancel) { }
                Button("Clear", role: .destructive) {
                    clearAllData()
                }
            } message: {
                Text("This will permanently delete all your sleep recordings. This action cannot be undone.")
            }
            .sheet(isPresented: $showingAbout) {
                AboutView()
            }
        }
    }

    private var sensitivityLabel: String {
        switch minConfidenceThreshold {
        case 0..<0.4:
            return "High"
        case 0.4..<0.6:
            return "Medium"
        default:
            return "Low"
        }
    }

    private func clearAllData() {
        // Delete all audio files
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        if let files = try? FileManager.default.contentsOfDirectory(at: documentsPath, includingPropertiesForKeys: nil) {
            for file in files where file.pathExtension == "m4a" {
                try? FileManager.default.removeItem(at: file)
            }
        }

        // Delete all sessions from database
        do {
            try modelContext.delete(model: SleepSession.self)
            try modelContext.save()
        } catch {
            print("Failed to clear data: \(error)")
        }
    }
}

// MARK: - Storage Info View

struct StorageInfoView: View {
    @State private var totalSize: Int64 = 0
    @State private var fileCount: Int = 0

    var body: some View {
        List {
            Section("Recordings") {
                HStack {
                    Text("Total Files")
                    Spacer()
                    Text("\(fileCount)")
                        .foregroundStyle(.secondary)
                }

                HStack {
                    Text("Storage Used")
                    Spacer()
                    Text(formatBytes(totalSize))
                        .foregroundStyle(.secondary)
                }
            }

            Section {
                Text("All recordings are stored locally on your device. No data is uploaded to the cloud.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .navigationTitle("Storage")
        .onAppear {
            calculateStorage()
        }
    }

    private func calculateStorage() {
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]

        guard let files = try? FileManager.default.contentsOfDirectory(
            at: documentsPath,
            includingPropertiesForKeys: [.fileSizeKey]
        ) else { return }

        var total: Int64 = 0
        var count = 0

        for file in files where file.pathExtension == "m4a" {
            if let attributes = try? FileManager.default.attributesOfItem(atPath: file.path),
               let size = attributes[.size] as? Int64 {
                total += size
                count += 1
            }
        }

        totalSize = total
        fileCount = count
    }

    private func formatBytes(_ bytes: Int64) -> String {
        let formatter = ByteCountFormatter()
        formatter.countStyle = .file
        return formatter.string(fromByteCount: bytes)
    }
}

// MARK: - About View

struct AboutView: View {
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    // App icon placeholder
                    ZStack {
                        RoundedRectangle(cornerRadius: 24)
                            .fill(LinearGradient(
                                colors: [.blue, .purple],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ))
                            .frame(width: 100, height: 100)

                        Image(systemName: "zzz")
                            .font(.system(size: 44))
                            .foregroundStyle(.white)
                    }

                    VStack(spacing: 8) {
                        Text("SnoreAlarm")
                            .font(.title)
                            .fontWeight(.bold)

                        Text("Version 1.0.0")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }

                    VStack(alignment: .leading, spacing: 16) {
                        Text("SnoreAlarm helps you understand your sleep by recording and analyzing sounds throughout the night.")

                        Text("Features:")
                            .fontWeight(.semibold)

                        VStack(alignment: .leading, spacing: 8) {
                            FeatureRow(icon: "mic.fill", text: "Record up to 11 hours of sleep")
                            FeatureRow(icon: "waveform", text: "ML-powered snore detection")
                            FeatureRow(icon: "chart.bar.fill", text: "Detailed sleep statistics")
                            FeatureRow(icon: "lock.shield", text: "100% private - all data stays on device")
                        }
                    }
                    .padding()
                    .background(Color(.systemBackground))
                    .clipShape(RoundedRectangle(cornerRadius: 12))

                    Text("SnoreAlarm is not a medical device and is intended for informational purposes only. It does not provide medical advice, diagnosis, or treatment.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)
                }
                .padding()
            }
            .background(Color(.systemGroupedBackground))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

struct FeatureRow: View {
    let icon: String
    let text: String

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundStyle(.blue)
                .frame(width: 24)

            Text(text)
                .font(.subheadline)
        }
    }
}

#Preview {
    SettingsView()
        .modelContainer(for: [SleepSession.self, SoundEvent.self], inMemory: true)
}
