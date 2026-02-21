// Web-specific AudioService implementation using Web Audio API

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
  private audioEventCallbacks: AudioEventCallback[] = [];
  private currentDecibels: number = -60;

  // Web Audio API
  private audioContext: AudioContext | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private analyser: AnalyserNode | null = null;
  private animationFrameId: number | null = null;
  private audioElement: HTMLAudioElement | null = null;

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
    if (!this.isRecording || !this.recordingStartTime) {
      return 0;
    }
    return (Date.now() - this.recordingStartTime) / 1000;
  }

  async startRecording(): Promise<string> {
    console.log('[AudioService.web] startRecording called');
    if (this.isRecording) {
      throw new Error('Already recording');
    }

    try {
      console.log('[AudioService.web] Requesting microphone access...');
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({audio: true});
      console.log('[AudioService.web] Microphone access granted');

      // Create audio context and analyser for metering
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;

      const source = this.audioContext.createMediaStreamSource(stream);
      source.connect(this.analyser);

      // Create MediaRecorder
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(1000); // Collect data every second

      // Generate a unique path/ID for this recording
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      this.recordingPath = `recording_${timestamp}`;
      this.recordingStartTime = Date.now();
      this.isRecording = true;

      // Start metering
      this.startMetering();

      return this.recordingPath;
    } catch (error) {
      console.warn('Microphone not available, using simulation mode:', error);
      return this.startSimulatedRecording();
    }
  }

  private startSimulatedRecording(): string {
    console.log('[AudioService.web] Starting simulated recording (no microphone)');

    // Generate a unique path/ID for this recording
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.recordingPath = `recording_${timestamp}`;
    this.recordingStartTime = Date.now();
    this.isRecording = true;

    // Start simulated metering
    this.startSimulatedMetering();

    return this.recordingPath;
  }

  private simulatedMeteringInterval: number | null = null;

  private startSimulatedMetering(): void {
    this.simulatedMeteringInterval = window.setInterval(() => {
      if (!this.isRecording) {
        return;
      }

      // Simulate audio levels with some variation
      const baseLevel = -40;
      const variation = (Math.random() - 0.5) * 30;
      this.currentDecibels = Math.max(-60, Math.min(0, baseLevel + variation));

      this.audioEventCallbacks.forEach((callback) => {
        callback(this.currentDecibels);
      });
    }, 100);
  }

  private stopSimulatedMetering(): void {
    if (this.simulatedMeteringInterval) {
      clearInterval(this.simulatedMeteringInterval);
      this.simulatedMeteringInterval = null;
    }
  }

  async stopRecording(): Promise<string | null> {
    if (!this.isRecording) {
      return null;
    }

    // Handle simulated recording (no mediaRecorder)
    if (!this.mediaRecorder) {
      this.stopSimulatedMetering();
      const path = this.recordingPath;
      this.isRecording = false;
      this.recordingPath = null;
      this.recordingStartTime = 0;
      return path;
    }

    return new Promise((resolve) => {
      this.mediaRecorder!.onstop = async () => {
        // Create blob from chunks
        const audioBlob = new Blob(this.audioChunks, {type: 'audio/webm'});

        // Store in IndexedDB
        if (this.recordingPath) {
          await this.saveToIndexedDB(this.recordingPath, audioBlob);
        }

        this.stopMetering();
        const path = this.recordingPath;
        this.isRecording = false;
        this.recordingPath = null;
        this.recordingStartTime = 0;
        this.audioChunks = [];

        // Close audio context
        if (this.audioContext) {
          this.audioContext.close();
          this.audioContext = null;
        }

        resolve(path);
      };

      this.mediaRecorder!.stop();
      this.mediaRecorder!.stream.getTracks().forEach((track) => track.stop());
    });
  }

  private startMetering(): void {
    const updateMeter = () => {
      if (!this.analyser || !this.isRecording) {
        return;
      }

      const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      this.analyser.getByteFrequencyData(dataArray);

      // Calculate RMS and convert to decibels
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const normalized = dataArray[i] / 255;
        sum += normalized * normalized;
      }
      const rms = Math.sqrt(sum / dataArray.length);
      const db = rms > 0 ? 20 * Math.log10(rms) : -60;
      this.currentDecibels = Math.max(-60, Math.min(0, db));

      this.audioEventCallbacks.forEach((callback) => {
        callback(this.currentDecibels);
      });

      this.animationFrameId = requestAnimationFrame(updateMeter);
    };

    updateMeter();
  }

  private stopMetering(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
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

    try {
      const audioBlob = await this.loadFromIndexedDB(_filePath);
      if (!audioBlob) {
        throw new Error('Recording not found');
      }

      const audioUrl = URL.createObjectURL(audioBlob);
      this.audioElement = new Audio(audioUrl);
      this.audioElement.onended = () => {
        this.isPlaying = false;
      };
      await this.audioElement.play();
      this.isPlaying = true;
    } catch (error) {
      console.error('Failed to play audio:', error);
    }
  }

  async playAt(_filePath: string, _timeSeconds: number): Promise<void> {
    await this.play(_filePath);
    if (this.audioElement) {
      this.audioElement.currentTime = _timeSeconds;
    }
  }

  async stopPlayback(): Promise<void> {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement = null;
    }
    this.isPlaying = false;
  }

  async pausePlayback(): Promise<void> {
    if (this.audioElement) {
      this.audioElement.pause();
    }
    this.isPlaying = false;
  }

  async deleteRecording(filePath: string): Promise<void> {
    await this.deleteFromIndexedDB(filePath);
  }

  normalizeDecibels(db: number): number {
    const minDb = -60;
    const maxDb = 0;
    const clamped = Math.max(minDb, Math.min(maxDb, db));
    return (clamped - minDb) / (maxDb - minDb);
  }

  // IndexedDB helpers for web storage
  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('SnoreAlarmDB', 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('recordings')) {
          db.createObjectStore('recordings');
        }
      };
    });
  }

  private async saveToIndexedDB(key: string, blob: Blob): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['recordings'], 'readwrite');
      const store = transaction.objectStore('recordings');
      const request = store.put(blob, key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  private async loadFromIndexedDB(key: string): Promise<Blob | null> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['recordings'], 'readonly');
      const store = transaction.objectStore('recordings');
      const request = store.get(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  private async deleteFromIndexedDB(key: string): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['recordings'], 'readwrite');
      const store = transaction.objectStore('recordings');
      const request = store.delete(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

export const AudioService = new AudioServiceClass();
