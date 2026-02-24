import {S3Client, PutObjectCommand} from '@aws-sdk/client-s3';
import {Upload} from '@aws-sdk/lib-storage';
import {S3_CONFIG} from '../config/s3.config';

export interface S3Config {
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  folder?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

class S3UploadServiceClass {
  private client: S3Client;
  private config: S3Config;

  constructor() {
    // Auto-configure with hardcoded credentials
    this.config = {
      region: S3_CONFIG.region,
      bucket: S3_CONFIG.bucket,
      accessKeyId: S3_CONFIG.accessKeyId,
      secretAccessKey: S3_CONFIG.secretAccessKey,
      folder: S3_CONFIG.folder,
    };

    try {
      this.client = new S3Client({
        region: this.config.region,
        credentials: {
          accessKeyId: this.config.accessKeyId,
          secretAccessKey: this.config.secretAccessKey,
        },
      });

      console.log('[S3Upload] Service initialized with bucket:', this.config.bucket);
      
      if (!this.config.accessKeyId || !this.config.secretAccessKey) {
        console.warn('[S3Upload] AWS credentials not configured - uploads will fail');
      }
    } catch (error) {
      console.error('[S3Upload] Failed to initialize S3 client:', error);
    }
  }

  configure(config: S3Config): void {
    this.config = config;
    this.client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  isConfigured(): boolean {
    return true;
  }

  /**
   * Web-specific: Load audio from IndexedDB
   */
  private async loadAudioFromIndexedDB(filePath: string): Promise<Blob> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['recordings'], 'readonly');
      const store = transaction.objectStore('recordings');
      const request = store.get(filePath);
      
      request.onerror = () => reject(new Error('Failed to load recording from IndexedDB'));
      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result);
        } else {
          reject(new Error('Recording not found in IndexedDB'));
        }
      };
    });
  }

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

  async uploadAudioFile(
    filePath: string,
    sessionId: string,
    onProgress?: (progress: UploadProgress) => void,
  ): Promise<string> {
    try {
      // Load audio blob from IndexedDB (web storage)
      const audioBlob = await this.loadAudioFromIndexedDB(filePath);
      
      // Check file size limit (100 MB)
      const fileSizeMB = audioBlob.size / (1024 * 1024);
      if (fileSizeMB > S3_CONFIG.maxFileSizeMB) {
        throw new Error(
          `File size ${fileSizeMB.toFixed(1)}MB exceeds limit of ${S3_CONFIG.maxFileSizeMB}MB`,
        );
      }

      // Convert blob to buffer for upload
      const arrayBuffer = await audioBlob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Generate S3 key (path in bucket)
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `${sessionId}_${timestamp}.webm`;
      const key = this.config.folder
        ? `${this.config.folder}/${fileName}`
        : fileName;

      // Upload with progress tracking
      const upload = new Upload({
        client: this.client,
        params: {
          Bucket: this.config.bucket,
          Key: key,
          Body: buffer,
          ContentType: 'audio/webm',
          Metadata: {
            sessionId,
            uploadedAt: new Date().toISOString(),
          },
        },
      });

      // Track progress
      upload.on('httpUploadProgress', progress => {
        if (onProgress && progress.loaded && progress.total) {
          onProgress({
            loaded: progress.loaded,
            total: progress.total,
            percentage: (progress.loaded / progress.total) * 100,
          });
        }
      });

      await upload.done();

      // Return S3 URL
      const url = `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${key}`;
      console.log(`[S3Upload] File uploaded successfully: ${url}`);
      return url;
    } catch (error) {
      console.error('[S3Upload] Upload failed:', error);
      throw error;
    }
  }

  async uploadSessionMetadata(
    sessionId: string,
    metadata: any,
  ): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `${sessionId}_${timestamp}_metadata.json`;
      const key = this.config.folder
        ? `${this.config.folder}/${fileName}`
        : fileName;

      const command = new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        Body: JSON.stringify(metadata, null, 2),
        ContentType: 'application/json',
      });

      await this.client.send(command);

      const url = `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${key}`;
      console.log(`[S3Upload] Metadata uploaded: ${url}`);
      return url;
    } catch (error) {
      console.error('[S3Upload] Metadata upload failed:', error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const testData = JSON.stringify({test: true, timestamp: Date.now()});
      const key = this.config.folder
        ? `${this.config.folder}/test-connection.json`
        : 'test-connection.json';
      
      const command = new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        Body: testData,
        ContentType: 'application/json',
      });

      await this.client.send(command);
      console.log('[S3Upload] Connection test successful');
      return true;
    } catch (error) {
      console.error('[S3Upload] Connection test failed:', error);
      return false;
    }
  }
}

export const S3UploadService = new S3UploadServiceClass();
