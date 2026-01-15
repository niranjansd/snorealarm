import UIKit
import Combine

@Observable
final class BatteryMonitor {
    var batteryLevel: Float = 1.0
    var batteryState: UIDevice.BatteryState = .unknown
    var isLowBattery: Bool = false

    private let lowBatteryThreshold: Float = 0.10 // 10%
    private var cancellables = Set<AnyCancellable>()

    var onLowBattery: (() -> Void)?

    init() {
        UIDevice.current.isBatteryMonitoringEnabled = true
        batteryLevel = UIDevice.current.batteryLevel
        batteryState = UIDevice.current.batteryState

        startMonitoring()
    }

    private func startMonitoring() {
        NotificationCenter.default.publisher(for: UIDevice.batteryLevelDidChangeNotification)
            .sink { [weak self] _ in
                self?.updateBatteryLevel()
            }
            .store(in: &cancellables)

        NotificationCenter.default.publisher(for: UIDevice.batteryStateDidChangeNotification)
            .sink { [weak self] _ in
                self?.updateBatteryState()
            }
            .store(in: &cancellables)
    }

    private func updateBatteryLevel() {
        batteryLevel = UIDevice.current.batteryLevel

        let wasLowBattery = isLowBattery
        isLowBattery = batteryLevel <= lowBatteryThreshold && batteryState != .charging

        // Trigger callback when transitioning to low battery
        if isLowBattery && !wasLowBattery {
            onLowBattery?()
        }
    }

    private func updateBatteryState() {
        batteryState = UIDevice.current.batteryState
        updateBatteryLevel() // Re-check low battery status when charging state changes
    }

    var batteryPercentage: Int {
        Int(batteryLevel * 100)
    }

    var batteryStateDescription: String {
        switch batteryState {
        case .unknown:
            return "Unknown"
        case .unplugged:
            return "Unplugged"
        case .charging:
            return "Charging"
        case .full:
            return "Full"
        @unknown default:
            return "Unknown"
        }
    }

    deinit {
        UIDevice.current.isBatteryMonitoringEnabled = false
    }
}
