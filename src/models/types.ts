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
  s3Url?: string; // S3 URL if uploaded
  s3MetadataUrl?: string; // S3 URL for metadata
  uploadStatus?: 'pending' | 'uploading' | 'success' | 'failed';
  uploadError?: string;
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

export interface S3Settings {
  enabled: boolean;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  folder?: string;
  autoUpload: boolean; // Auto-upload after recording
}

export interface AppSettings {
  lowBatteryThreshold: number;
  minConfidenceThreshold: number;
  maxRecordingHours: number;
  detectionSensitivity: 'low' | 'medium' | 'high';
  s3?: S3Settings;
}

export const DEFAULT_SETTINGS: AppSettings = {
  lowBatteryThreshold: 10,
  minConfidenceThreshold: 0.4,
  maxRecordingHours: 11,
  detectionSensitivity: 'medium',
  s3: {
    enabled: false,
    region: 'us-east-1',
    bucket: '',
    accessKeyId: '',
    secretAccessKey: '',
    folder: 'snorealarm-recordings',
    autoUpload: true,
  },
};
