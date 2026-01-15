import {Platform} from 'react-native';
import RNFS from 'react-native-fs';

export interface AudioServiceState {
  isRecording: boolean;
  isPlaying: boolean;
  recordingDuration: number;
  currentDecibels: number;
  recordingPath: string | null;
}

type AudioEventCallback = (decibels: number) => void;

class AudioServiceClass {
  private isRecording: boolean = false;
  private isPlaying: boolean = false;
  private recordingPath: string | null = null;
  private recordingStartTime: number = 0;
  private meteringInterval: NodeJS.Timeout | null = null;
  private audioEventCallbacks: AudioEventCallback[] = [];
  private currentDecibels: number = -60;

  getState(): AudioServiceState {
    return {
      isRecording: this.isRecording,
      isPlaying: this.isPlaying,
      recordingDuration: this.getRecordingDuration(),
      currentDecibels: this.currentDecibels,
      recordingPath: this.recordingPath,
    };
  }

  getRecordingDuration(): number {
    if (!this.isRecording || !this.recordingStartTime) return 0;
    return (Date.now() - this.recordingStartTime) / 1000;
  }

  async startRecording(): Promise<string> {
    if (this.isRecording) {
      throw new Error('Already recording');
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `sleep_${timestamp}.m4a`;
    const path =
      Platform.OS === 'ios'
        ? `${RNFS.DocumentDirectoryPath}/${fileName}`
        : `${RNFS.ExternalDirectoryPath}/${fileName}`;

    this.recordingPath = path;
    this.recordingStartTime = Date.now();
    this.isRecording = true;

    // Start simulated metering (in real app, this would come from native module)
    this.startMetering();

    return path;
  }

  async stopRecording(): Promise<string | null> {
    if (!this.isRecording) {
      return null;
    }

    this.stopMetering();
    this.isRecording = false;
    const path = this.recordingPath;
    this.recordingPath = null;
    this.recordingStartTime = 0;

    return path;
  }

  private startMetering(): void {
    this.meteringInterval = setInterval(() => {
      // Simulate audio level changes
      // In real implementation, this would come from native audio module
      const variation = (Math.random() - 0.5) * 20;
      this.currentDecibels = Math.max(-60, Math.min(0, -40 + variation));

      this.audioEventCallbacks.forEach(callback => {
        callback(this.currentDecibels);
      });
    }, 100);
  }

  private stopMetering(): void {
    if (this.meteringInterval) {
      clearInterval(this.meteringInterval);
      this.meteringInterval = null;
    }
    this.currentDecibels = -60;
  }

  onAudioLevel(callback: AudioEventCallback): () => void {
    this.audioEventCallbacks.push(callback);
    return () => {
      const index = this.audioEventCallbacks.indexOf(callback);
      if (index > -1) {
        this.audioEventCallbacks.splice(index, 1);
      }
    };
  }

  async play(_filePath: string): Promise<void> {
    if (this.isPlaying) {
      await this.stopPlayback();
    }

    this.isPlaying = true;
    // In real implementation, would use react-native-sound or similar
  }

  async playAt(_filePath: string, _timeSeconds: number): Promise<void> {
    await this.play(_filePath);
    // Seek to time
  }

  async stopPlayback(): Promise<void> {
    this.isPlaying = false;
  }

  async pausePlayback(): Promise<void> {
    this.isPlaying = false;
  }

  async deleteRecording(filePath: string): Promise<void> {
    try {
      const exists = await RNFS.exists(filePath);
      if (exists) {
        await RNFS.unlink(filePath);
      }
    } catch (error) {
      console.error('Error deleting recording:', error);
    }
  }

  normalizeDecibels(db: number): number {
    const minDb = -60;
    const maxDb = 0;
    const clamped = Math.max(minDb, Math.min(maxDb, db));
    return (clamped - minDb) / (maxDb - minDb);
  }
}

export const AudioService = new AudioServiceClass();
