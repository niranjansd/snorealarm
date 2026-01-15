import AVFoundation
import SoundAnalysis
import Foundation

protocol SoundClassifierDelegate: AnyObject {
    func soundClassifier(_ classifier: SoundClassifier, didDetectSound category: SoundCategory, confidence: Double, decibels: Double)
}

@Observable
final class SoundClassifier: NSObject {
    private var audioEngine: AVAudioEngine?
    private var analyzer: SNAudioStreamAnalyzer?
    private var classificationRequest: SNClassifySoundRequest?

    weak var delegate: SoundClassifierDelegate?

    var isAnalyzing: Bool = false
    var lastDetectedCategory: SoundCategory = .ambient
    var lastConfidence: Double = 0
    var lastDecibels: Double = -60

    // Sound categories we care about from Apple's classifier
    private let snoringIdentifiers = ["snoring", "snore"]
    private let talkingIdentifiers = ["speech", "talking", "conversation"]
    private let coughingIdentifiers = ["cough", "coughing"]

    override init() {
        super.init()
    }

    func startAnalyzing() throws {
        guard !isAnalyzing else { return }

        audioEngine = AVAudioEngine()
        guard let audioEngine = audioEngine else { return }

        let inputNode = audioEngine.inputNode
        let recordingFormat = inputNode.outputFormat(forBus: 0)

        // Create the sound classification request using Apple's built-in classifier
        classificationRequest = try SNClassifySoundRequest(classifierIdentifier: .version1)
        classificationRequest?.windowDuration = CMTimeMakeWithSeconds(1.5, preferredTimescale: 48000)
        classificationRequest?.overlapFactor = 0.5

        analyzer = SNAudioStreamAnalyzer(format: recordingFormat)

        if let request = classificationRequest, let analyzer = analyzer {
            try analyzer.add(request, withObserver: self)
        }

        inputNode.installTap(onBus: 0, bufferSize: 8192, format: recordingFormat) { [weak self] buffer, time in
            self?.analyzeBuffer(buffer)
        }

        try audioEngine.start()
        isAnalyzing = true
    }

    func stopAnalyzing() {
        audioEngine?.stop()
        audioEngine?.inputNode.removeTap(onBus: 0)
        analyzer?.removeAllRequests()

        audioEngine = nil
        analyzer = nil
        classificationRequest = nil
        isAnalyzing = false
    }

    private func analyzeBuffer(_ buffer: AVAudioPCMBuffer) {
        // Calculate decibels from the buffer
        let decibels = calculateDecibels(from: buffer)
        DispatchQueue.main.async {
            self.lastDecibels = Double(decibels)
        }

        // Analyze for sound classification
        analyzer?.analyze(buffer, atAudioFramePosition: AVAudioFramePosition(0))
    }

    private func calculateDecibels(from buffer: AVAudioPCMBuffer) -> Float {
        guard let channelData = buffer.floatChannelData?[0] else { return -160 }
        let frameLength = Int(buffer.frameLength)

        var sum: Float = 0
        for i in 0..<frameLength {
            let sample = channelData[i]
            sum += sample * sample
        }

        let rms = sqrt(sum / Float(frameLength))
        let decibels = 20 * log10(rms)

        return max(-160, min(0, decibels))
    }

    private func categorize(identifier: String) -> SoundCategory {
        let lowercased = identifier.lowercased()

        if snoringIdentifiers.contains(where: { lowercased.contains($0) }) {
            return .snoring
        } else if talkingIdentifiers.contains(where: { lowercased.contains($0) }) {
            return .talking
        } else if coughingIdentifiers.contains(where: { lowercased.contains($0) }) {
            return .coughing
        }

        return .ambient
    }
}

// MARK: - SNResultsObserving

extension SoundClassifier: SNResultsObserving {
    func request(_ request: SNRequest, didProduce result: SNResult) {
        guard let classificationResult = result as? SNClassificationResult else { return }

        // Get the top classification
        guard let topClassification = classificationResult.classifications.first else { return }

        let category = categorize(identifier: topClassification.identifier)
        let confidence = topClassification.confidence

        // Only report if confidence is above threshold
        let minimumConfidence: Double = 0.3

        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }

            if confidence >= minimumConfidence {
                self.lastDetectedCategory = category
                self.lastConfidence = confidence

                self.delegate?.soundClassifier(
                    self,
                    didDetectSound: category,
                    confidence: confidence,
                    decibels: self.lastDecibels
                )
            }
        }
    }

    func request(_ request: SNRequest, didFailWithError error: Error) {
        print("Sound classification error: \(error)")
    }

    func requestDidComplete(_ request: SNRequest) {
        // Classification completed
    }
}
