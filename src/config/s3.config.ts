/**
 * S3 Upload Configuration
 * 
 * IMPORTANT: Credentials are loaded from .env file at build time.
 * See env.example for required variables.
 * 
 * Security: While these credentials are embedded in the built app,
 * the IAM policy ensures minimal risk by allowing only uploads to one folder.
 */

import {
  REACT_APP_S3_REGION,
  REACT_APP_S3_BUCKET,
  REACT_APP_S3_FOLDER,
  REACT_APP_S3_ACCESS_KEY,
  REACT_APP_S3_SECRET_KEY,
} from '@env';

export const S3_CONFIG = {
  region: REACT_APP_S3_REGION || 'us-east-1',
  bucket: REACT_APP_S3_BUCKET || 'eight-ml-scratch',
  folder: REACT_APP_S3_FOLDER || 'nirsd/snore/audio/snorealarm',
  accessKeyId: REACT_APP_S3_ACCESS_KEY || '',
  secretAccessKey: REACT_APP_S3_SECRET_KEY || '',
  
  // Upload constraints
  maxFileSizeMB: 100,
  allowedFileTypes: ['audio/webm', 'audio/wav', 'audio/mp4'],
} as const;
