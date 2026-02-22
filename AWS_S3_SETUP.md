# AWS S3 Auto-Upload - Admin Documentation

## Overview

SnoreAlarm automatically uploads all recordings to a centralized S3 bucket. This happens transparently - **users don't need to configure anything**.

**For Users:** Recordings are automatically backed up to secure cloud storage.  
**For Admins:** This document explains the backend configuration.

---

## How It Works

### User Experience:
1. User records audio on their device
2. After stopping recording, audio **automatically uploads** to S3
3. Files are stored locally AND in S3
4. User sees upload status (success/failed) in their session history

### Technical Flow:
1. App has **embedded AWS credentials** (upload-only access)
2. After recording stops:
   - Audio file uploads: `s3://eight-ml-scratch/nirsd/snore/audio/snorealarm/{sessionId}_{timestamp}.webm`
   - Metadata uploads: `s3://eight-ml-scratch/nirsd/snore/audio/snorealarm/{sessionId}_{timestamp}_metadata.json`
3. Upload happens in background (user can continue using app)

---

## S3 Configuration

### Current Setup:

**Bucket:** `eight-ml-scratch`  
**Path:** `nirsd/snore/audio/snorealarm/`  
**Region:** `us-east-1`  
**IAM User:** Has ONLY `s3:PutObject` permission to that specific path

### File Structure:

```
s3://eight-ml-scratch/nirsd/snore/audio/snorealarm/
├── abc123_2026-02-22T14-30-00.webm
├── abc123_2026-02-22T14-30-00_metadata.json
├── def456_2026-02-23T08-15-00.webm
└── def456_2026-02-23T08-15-00_metadata.json
```

### Metadata JSON Example:

```json
{
  "sessionId": "abc-123-def-456",
  "startTime": 1708646400000,
  "endTime": 1708675200000,
  "duration": 28800,
  "soundEvents": [
    {
      "id": "event-1",
      "timestamp": 1708650000000,
      "duration": 5.2,
      "decibels": -35,
      "category": "snoring",
      "confidence": 0.87
    }
  ],
  "tags": []
}
```

---

## Security

### IAM Policy (Current Setup)

The embedded AWS credentials have this IAM policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "SnoreAlarmUploadOnly",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::eight-ml-scratch/nirsd/snore/audio/snorealarm/*"
    }
  ]
}
```

**Permissions:**
- ✅ Can upload files to `nirsd/snore/audio/snorealarm/` folder
- ❌ Cannot read, list, or delete files
- ❌ Cannot access any other S3 paths or AWS services

### Security Safeguards:

1. **IAM Restrictions:**
   - Upload-only access
   - Limited to specific S3 path
   - Cannot perform any other AWS operations

2. **App-Side Limits:**
   - Max file size: 100 MB per recording
   - Only uploads `.webm` audio files
   - One upload per recording session

3. **Monitoring (Recommended):**
   - Set up CloudWatch alarms for unusual upload patterns
   - S3 lifecycle policy to auto-delete old recordings (optional)
   - Billing alerts for unexpected costs

### Risk Assessment:

**Threat:** Someone decompiles the app and extracts credentials

**Impact:** Limited - they can only upload files to that specific folder

**Mitigation:**
- IAM policy prevents reading/listing/deleting files
- File size limits prevent significant cost abuse
- CloudWatch can detect unusual activity
- Credentials can be rotated if needed

---

## Rotating Credentials

If you need to rotate the AWS credentials:

### 1. Create New IAM User:
- Console → IAM → Users → Create user
- Attach the same policy (SnoreAlarmUploadOnly)
- Generate access keys

### 2. Update Code:
Edit `src/config/s3.config.ts`:

```typescript
export const S3_CONFIG = {
  region: 'us-east-1',
  bucket: 'eight-ml-scratch',
  folder: 'nirsd/snore/audio/snorealarm',
  accessKeyId: 'NEW_ACCESS_KEY_ID',
  secretAccessKey: 'NEW_SECRET_KEY',
  // ...
};
```

### 3. Deploy Update:
- Rebuild and deploy new app version
- Old credentials can be disabled after all users update

---

## Cost Estimate

**Current Usage (Estimated):**
- 100 recordings/month
- 10 MB per recording = 1 GB/month storage
- 100 PUT requests/month

**Monthly Cost:**
- Storage: $0.023 per GB = **$0.02**
- PUT requests: $0.005 per 1,000 = **$0.00**
- **Total: ~$0.02/month** 💰

**Even if abused (1000 recordings, 100 GB):**
- Storage: **~$2.30/month**
- Set billing alert at $10/month to detect issues

---

## Accessing Recordings

### AWS Console:
1. Go to [S3 Console](https://s3.console.aws.amazon.com/)
2. Click bucket `eight-ml-scratch`
3. Navigate to `nirsd/snore/audio/snorealarm/`
4. Download files as needed

### AWS CLI:

```bash
# List all recordings
aws s3 ls s3://eight-ml-scratch/nirsd/snore/audio/snorealarm/

# Download specific recording
aws s3 cp s3://eight-ml-scratch/nirsd/snore/audio/snorealarm/abc123.webm ./

# Download all recordings
aws s3 sync s3://eight-ml-scratch/nirsd/snore/audio/snorealarm/ ./local-folder/

# Download just metadata JSONs
aws s3 sync s3://eight-ml-scratch/nirsd/snore/audio/snorealarm/ ./metadata/ --exclude "*" --include "*_metadata.json"
```

### Python Script Example:

```python
import boto3

s3 = boto3.client('s3')
bucket = 'eight-ml-scratch'
prefix = 'nirsd/snore/audio/snorealarm/'

# List all recordings
response = s3.list_objects_v2(Bucket=bucket, Prefix=prefix)
for obj in response.get('Contents', []):
    if obj['Key'].endswith('.webm'):
        print(f"Recording: {obj['Key']}, Size: {obj['Size']} bytes")
```

---

## Monitoring Setup (Recommended)

### 1. S3 Bucket Metrics:
- Enable S3 request metrics for the folder
- Monitor upload volume and patterns

### 2. CloudWatch Alarms:

```bash
# Alert if > 1000 uploads per day
aws cloudwatch put-metric-alarm \
  --alarm-name snorealarm-high-upload-rate \
  --metric-name NumberOfObjects \
  --namespace AWS/S3 \
  --statistic Sum \
  --period 86400 \
  --threshold 1000 \
  --comparison-operator GreaterThanThreshold
```

### 3. Billing Alerts:
- AWS Budgets → Create budget
- Alert at $10/month

### 4. S3 Lifecycle Policy (Optional):

```json
{
  "Rules": [{
    "Id": "DeleteOldRecordings",
    "Status": "Enabled",
    "Prefix": "nirsd/snore/audio/snorealarm/",
    "Expiration": {
      "Days": 90
    }
  }]
}
```

This auto-deletes recordings older than 90 days.

---

## Troubleshooting

### Users Report "Upload Failed"

**Check:**
1. IAM credentials are still valid
2. S3 bucket still exists and is accessible
3. IAM policy hasn't changed
4. CloudWatch logs for specific error messages

### High Upload Costs

**Actions:**
1. Check CloudWatch metrics for upload patterns
2. Enable S3 lifecycle policy to delete old files
3. Consider if credentials were compromised
4. Rotate credentials if suspicious activity

### App Can't Upload

**Verify:**
```bash
# Test credentials manually
aws s3 cp test.txt s3://eight-ml-scratch/nirsd/snore/audio/snorealarm/test.txt \
  --profile snorealarm
```

If this works but app fails, issue is in the app code.

---

## Future Improvements

### Consider These Options:

1. **AWS Cognito Identity Pool:**
   - More secure (temporary credentials)
   - Slightly more complex to implement
   - Better for public apps

2. **Backend Upload Proxy:**
   - Most secure (credentials never in app)
   - Requires maintaining a backend server
   - Can add validation/processing

3. **Pre-signed URLs:**
   - Generate time-limited upload URLs
   - Requires backend to generate URLs
   - Very secure

**Current approach (embedded credentials) is acceptable for:**
- Small user base
- Internal/customer apps
- When simplicity is priority

---

## Questions?

Contact: [Your contact info]

AWS Documentation: https://docs.aws.amazon.com/s3/
