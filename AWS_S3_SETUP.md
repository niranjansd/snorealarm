# AWS S3 Auto-Upload Setup

SnoreAlarm can automatically upload your sleep recordings to AWS S3 for backup, archival, or further processing.

## Features

✅ **Auto-Upload** - Recordings automatically upload after stopping  
✅ **Metadata JSON** - Session data (sound events, timestamps) uploaded alongside audio  
✅ **Upload Status Tracking** - See if uploads succeeded or failed  
✅ **Secure** - Credentials stored locally, never shared  
✅ **Optional** - Works completely offline if disabled  

---

## AWS Setup (One-Time)

### Step 1: Create an S3 Bucket

1. Go to [AWS S3 Console](https://s3.console.aws.amazon.com/)
2. Click **Create bucket**
3. Choose a unique name (e.g., `my-snorealarm-recordings`)
4. Select a region (e.g., `us-east-1`)
5. **Block all public access** - Keep this enabled for privacy
6. Click **Create bucket**

### Step 2: Create IAM User with S3 Access

1. Go to [AWS IAM Console](https://console.aws.amazon.com/iam/)
2. Navigate to **Users** → **Create user**
3. User name: `snorealarm-uploader`
4. Select **Access key - Programmatic access**
5. Click **Next**

### Step 3: Attach S3 Permissions

Choose one of these permission options:

#### Option A: Full S3 Access (Simpler)
1. Click **Attach policies directly**
2. Search and select **AmazonS3FullAccess**
3. Click **Next** → **Create user**

#### Option B: Limited Access (More Secure) ⭐ Recommended

1. Click **Create policy**
2. Select **JSON** tab
3. Paste this policy (replace `YOUR-BUCKET-NAME`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl",
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME"
    }
  ]
}
```

4. Click **Next** → Name it `SnoreAlarmS3Upload` → **Create policy**
5. Go back to user creation → Attach the policy you just created

### Step 4: Get Access Keys

1. After creating the user, click on it
2. Go to **Security credentials** tab
3. Click **Create access key**
4. Select **Other** → Click **Next**
5. **Save these credentials securely:**
   - **Access Key ID**: `AKIA...` (20 characters)
   - **Secret Access Key**: `abcd...` (40 characters)

⚠️ **Important**: You can only see the Secret Access Key once! Save it now.

---

## App Configuration

### In SnoreAlarm Settings:

1. Open the app
2. Go to **Settings** tab
3. Scroll to **AWS S3 Upload** section
4. Toggle **Enable S3 Upload** to ON
5. Click **Show S3 Configuration**
6. Fill in your credentials:
   - **Region**: `us-east-1` (or your bucket's region)
   - **Bucket Name**: `my-snorealarm-recordings`
   - **Access Key ID**: `AKIA...` (from Step 4)
   - **Secret Access Key**: `abcd...` (from Step 4)
   - **Folder** (optional): `recordings` (creates a subfolder)
7. Click **Test Connection** to verify
8. Enable **Auto-Upload After Recording**

---

## How It Works

### During Recording:
1. Audio is recorded locally on your device
2. Sound events are detected in real-time

### After Stopping Recording:
1. Session is saved locally
2. If S3 upload is enabled:
   - Audio file uploads to S3: `sessionId_timestamp.webm`
   - Metadata uploads to S3: `sessionId_timestamp_metadata.json`
3. Session shows upload status (success/failed)

### S3 File Structure:

```
your-bucket-name/
└── snorealarm-recordings/          # Your folder
    ├── abc123_2026-02-22.webm      # Audio file
    ├── abc123_2026-02-22_metadata.json  # Session data
    ├── def456_2026-02-23.webm
    └── def456_2026-02-23_metadata.json
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

## Security Best Practices

### ✅ DO:
- Use IAM user with **minimum required permissions** (Option B above)
- Keep your Secret Access Key **private**
- Enable **S3 bucket encryption** at rest
- Enable **S3 versioning** for backup protection
- Use **S3 lifecycle policies** to auto-delete old recordings

### ❌ DON'T:
- Share your AWS credentials with anyone
- Use your root AWS account credentials
- Make your S3 bucket publicly accessible
- Commit credentials to git/GitHub

---

## Accessing Your Recordings

### Via AWS Console:
1. Go to [S3 Console](https://s3.console.aws.amazon.com/)
2. Click your bucket → Navigate to your folder
3. Download files as needed

### Via AWS CLI:

```bash
# List recordings
aws s3 ls s3://your-bucket-name/snorealarm-recordings/

# Download a specific recording
aws s3 cp s3://your-bucket-name/snorealarm-recordings/abc123.webm ./

# Download all recordings
aws s3 sync s3://your-bucket-name/snorealarm-recordings/ ./local-folder/
```

---

## Cost Estimate

AWS S3 pricing (as of 2026, us-east-1):

- **Storage**: $0.023 per GB/month
- **Upload (PUT)**: $0.005 per 1,000 requests
- **Download (GET)**: $0.0004 per 1,000 requests

**Example Monthly Cost:**
- 30 recordings/month
- 10 MB per recording = 300 MB total
- **Cost**: ~$0.01/month 💰 (essentially free!)

First year free tier includes:
- 5 GB of S3 storage
- 20,000 GET requests
- 2,000 PUT requests

---

## Troubleshooting

### "S3 connection test failed"

**Check:**
1. Credentials are correct (no extra spaces)
2. Bucket name matches exactly
3. Region matches your bucket's region
4. IAM user has S3 permissions
5. Bucket exists and you have access

### "Upload failed" after recording

**Check:**
1. Internet connection is working
2. AWS credentials haven't expired
3. S3 bucket still exists
4. Check app logs for detailed error

### "Access Denied" error

**Fix:**
- Verify IAM policy allows `s3:PutObject` on your bucket
- Check bucket policy doesn't block uploads

---

## Disabling S3 Upload

To stop uploading:
1. Settings → AWS S3 Upload
2. Toggle **Enable S3 Upload** to OFF

Your existing local recordings remain unchanged.

---

## Privacy Note

- Recordings are uploaded to **your private S3 bucket**
- AWS credentials stored **locally on device only**
- No data sent to SnoreAlarm servers (there are none!)
- You have complete control over your data

---

## Questions?

See the [AWS S3 Documentation](https://docs.aws.amazon.com/s3/) for more information about S3.
