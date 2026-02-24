/**
 * S3 Upload Configuration
 * 
 * IMPORTANT: Credentials are loaded from .env file at build time.
 * See env.example for required variables.
 * 
 * Security: While these credentials are embedded in the built app,
 * the IAM policy ensures minimal risk by allowing only uploads to one folder.
 */

// Load from process.env (injected by webpack or React Native)
const REACT_APP_S3_REGION = process.env.REACT_APP_S3_REGION || 'us-east-1';
const REACT_APP_S3_BUCKET = process.env.REACT_APP_S3_BUCKET || 'eight-ml-scratch';
const REACT_APP_S3_FOLDER = process.env.REACT_APP_S3_FOLDER || 'nirsd/snore/audio/snorealarm';
const REACT_APP_S3_ACCESS_KEY = process.env.REACT_APP_S3_ACCESS_KEY || '';
const REACT_APP_S3_SECRET_KEY = process.env.REACT_APP_S3_SECRET_KEY || '';

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
