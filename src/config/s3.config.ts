/**
 * S3 Upload Configuration
 * 
 * IMPORTANT: Credentials are loaded from .env file at build time.
 * See env.example for required variables.
 * 
 * Security: While these credentials are embedded in the built app,
 * the IAM policy ensures minimal risk by allowing only uploads to one folder.
 */

// Try to import env variables, but don't fail if they're not available
let REACT_APP_S3_REGION = 'us-east-1';
let REACT_APP_S3_BUCKET = 'eight-ml-scratch';
let REACT_APP_S3_FOLDER = 'nirsd/snore/audio/snorealarm';
let REACT_APP_S3_ACCESS_KEY = '';
let REACT_APP_S3_SECRET_KEY = '';

try {
  const env = require('@env');
  REACT_APP_S3_REGION = env.REACT_APP_S3_REGION || REACT_APP_S3_REGION;
  REACT_APP_S3_BUCKET = env.REACT_APP_S3_BUCKET || REACT_APP_S3_BUCKET;
  REACT_APP_S3_FOLDER = env.REACT_APP_S3_FOLDER || REACT_APP_S3_FOLDER;
  REACT_APP_S3_ACCESS_KEY = env.REACT_APP_S3_ACCESS_KEY || REACT_APP_S3_ACCESS_KEY;
  REACT_APP_S3_SECRET_KEY = env.REACT_APP_S3_SECRET_KEY || REACT_APP_S3_SECRET_KEY;
} catch (e) {
  console.warn('[S3Config] Environment variables not loaded, using defaults');
}

export const S3_CONFIG = {
  region: REACT_APP_S3_REGION,
  bucket: REACT_APP_S3_BUCKET,
  folder: REACT_APP_S3_FOLDER,
  accessKeyId: REACT_APP_S3_ACCESS_KEY,
  secretAccessKey: REACT_APP_S3_SECRET_KEY,
  
  // Upload constraints
  maxFileSizeMB: 100,
  allowedFileTypes: ['audio/webm', 'audio/wav', 'audio/mp4'],
} as const;
