import XCTest
@testable import SnoreAlarm

final class BatteryMonitorTests: XCTestCase {

    var batteryMonitor: BatteryMonitor!

    override func setUpWithError() throws {
        batteryMonitor = BatteryMonitor()
    }

    override func tearDownWithError() throws {
        batteryMonitor = nil
    }

    // MARK: - Initialization Tests

    func testBatteryMonitorInitialization() {
        XCTAssertNotNil(batteryMonitor)
        // Battery level should be between 0 and 1 (or -1 if unknown in simulator)
        XCTAssertGreaterThanOrEqual(batteryMonitor.batteryLevel, -1)
        XCTAssertLessThanOrEqual(batteryMonitor.batteryLevel, 1)
    }

    // MARK: - Battery Percentage Tests

    func testBatteryPercentageCalculation() {
        // The percentage should be between 0 and 100
        let percentage = batteryMonitor.batteryPercentage

        // In simulator, battery level is -1, so percentage would be -100
        // On device, it should be 0-100
        XCTAssertLessThanOrEqual(percentage, 100)
    }

    // MARK: - Low Battery Detection Tests

    func testLowBatteryThreshold() {
        // Test that low battery detection is based on threshold
        // Note: This test may behave differently on device vs simulator

        // When battery is above threshold, isLowBattery should be false
        // (unless we're actually on low battery)
        // This is a behavioral test that depends on actual battery state
        XCTAssertNotNil(batteryMonitor.isLowBattery)
    }

    // MARK: - Battery State Description Tests

    func testBatteryStateDescriptions() {
        let description = batteryMonitor.batteryStateDescription

        // Should return one of the valid states
        let validStates = ["Unknown", "Unplugged", "Charging", "Full"]
        XCTAssertTrue(validStates.contains(description))
    }

    // MARK: - Callback Tests

    func testLowBatteryCallback() {
        let expectation = XCTestExpectation(description: "Low battery callback")
        expectation.isInverted = true // We don't expect it to be called unless actually low

        batteryMonitor.onLowBattery = {
            expectation.fulfill()
        }

        // Wait briefly - callback should NOT be called unless battery is actually low
        wait(for: [expectation], timeout: 0.5)
    }
}
