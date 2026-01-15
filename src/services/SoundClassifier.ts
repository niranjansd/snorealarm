import {SoundCategory, SoundEvent} from '../models/types';
import {v4 as uuidv4} from 'uuid';

export interface ClassificationResult {
  category: SoundCategory;
  confidence: number;
  decibels: number;
}

type ClassificationCallback = (result: ClassificationResult) => void;

class SoundClassifierClass {
  private isAnalyzing: boolean = false;
  private analysisInterval: NodeJS.Timeout | null = null;
  private callbacks: ClassificationCallback[] = [];
  private lastCategory: SoundCategory = 'ambient';
  private lastEventTime: number = 0;
  private eventDebounceMs: number = 2000;

  async startAnalyzing(): Promise<void> {
    if (this.isAnalyzing) return;

    this.isAnalyzing = true;

    // Simulate sound classification
    // In real implementation, this would use native ML models (TensorFlow Lite on Android,
    // Core ML on iOS) to classify audio in real-time
    this.analysisInterval = setInterval(() => {
      const result = this.simulateClassification();
      this.callbacks.forEach(callback => callback(result));
    }, 1500);
  }

  stopAnalyzing(): void {
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
      this.analysisInterval = null;
    }
    this.isAnalyzing = false;
  }

  private simulateClassification(): ClassificationResult {
    // Simulate random classifications with weighted probabilities
    // In real app, this would be actual ML inference
    const random = Math.random();
    let category: SoundCategory;
    let confidence: number;

    if (random < 0.15) {
      category = 'snoring';
      confidence = 0.6 + Math.random() * 0.35;
    } else if (random < 0.2) {
      category = 'talking';
      confidence = 0.5 + Math.random() * 0.4;
    } else if (random < 0.22) {
      category = 'coughing';
      confidence = 0.5 + Math.random() * 0.4;
    } else {
      category = 'ambient';
      confidence = 0.7 + Math.random() * 0.25;
    }

    const decibels = -50 + Math.random() * 40; // -50 to -10 dB range

    return {category, confidence, decibels};
  }

  onClassification(callback: ClassificationCallback): () => void {
    this.callbacks.push(callback);
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  createSoundEvent(
    result: ClassificationResult,
    sessionStartTime: number,
  ): SoundEvent | null {
    const now = Date.now();

    // Debounce events
    if (now - this.lastEventTime < this.eventDebounceMs) {
      return null;
    }

    // Only create events for significant sounds
    if (result.category === 'ambient' || result.confidence < 0.4) {
      return null;
    }

    this.lastEventTime = now;
    this.lastCategory = result.category;

    return {
      id: uuidv4(),
      timestamp: now,
      duration: 1.5, // Default duration based on analysis window
      decibels: result.decibels,
      category: result.category,
      confidence: result.confidence,
    };
  }

  getLastCategory(): SoundCategory {
    return this.lastCategory;
  }

  isRunning(): boolean {
    return this.isAnalyzing;
  }
}

export const SoundClassifier = new SoundClassifierClass();
