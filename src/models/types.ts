export type SoundCategory =
  | 'snoring'
  | 'talking'
  | 'coughing'
  | 'movement'
  | 'ambient'
  | 'unknown';

export interface SoundEvent {
  id: string;
  timestamp: number; // Unix timestamp
  duration: number; // seconds
  decibels: number;
  category: SoundCategory;
  confidence: number;
}

export interface SleepSession {
  id: string;
  startTime: number; // Unix timestamp
  endTime?: number;
  audioFilePath?: string;
  tags: string[];
  soundEvents: SoundEvent[];
}

export interface SessionStatistics {
  duration: number;
  snoringDuration: number;
  snoringPercentage: number;
  averageSnoringDecibels: number;
  maxSnoringDecibels: number;
  eventCount: number;
}

export interface AppSettings {
  lowBatteryThreshold: number;
  minConfidenceThreshold: number;
  maxRecordingHours: number;
  detectionSensitivity: 'low' | 'medium' | 'high';
}

export const DEFAULT_SETTINGS: AppSettings = {
  lowBatteryThreshold: 10,
  minConfidenceThreshold: 0.4,
  maxRecordingHours: 11,
  detectionSensitivity: 'medium',
};
