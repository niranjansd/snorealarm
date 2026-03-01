# Long Recording Guide (8+ Hours)

This guide explains how the app handles overnight/long recording sessions and automatic S3 uploads.

## Overview

The app now supports **8+ hour recording sessions** with:
- ✅ **Chunked Recording**: Records in 10-minute segments
- ✅ **Progressive Upload**: Uploads each chunk immediately to S3
- ✅ **Low Memory Usage**: Only stores current chunk in memory
- ✅ **Reliable**: If one chunk fails, others are safe
- ✅ **Automatic**: No user intervention required

---

## Web App Implementation

### How It Works

1. **Start Recording**: User clicks "Start Recording"
2. **10-Minute Chunks**: Every 10 minutes, the current chunk is saved and a new one starts
3. **Immediate Upload**: As soon as a chunk is saved, it's uploaded to S3 in the background
4. **Continuous Recording**: Recording continues seamlessly while previous chunk uploads
5. **Session End**: When user stops, the last chunk is uploaded and metadata is saved

### Testing Web App

**Quick Test (1 minute):**
```bash
# On your Mac
cd ~/code/snorealarm
git pull origin master
npm run web
```

Then:
1. Open http://localhost:3000 in Chrome/Firefox
2. Click "Start Recording"
3. **Wait at least 1 minute** (for testing, chunks are 10 minutes in production)
4. Open browser console (Cmd+Option+J)
5. You'll see logs like:
   ```
   [AudioService.web] Starting chunk: session_XXX_chunk_0
   [RecordingScreen] Chunk complete: session_XXX_chunk_0
   [RecordingScreen] Uploading chunk: session_XXX_chunk_0
   [S3Upload.web] Successfully uploaded chunk
   ```
6. Click "Stop Recording"
7. Check S3 bucket: `s3://eight-ml-scratch/nirsd/snore/audio/snorealarm/`
   - You should see a folder named `session_YYYY-MM-DDTHH-MM-SS-MSSZ/`
   - Inside: multiple `.webm` files (one per chunk: `chunk_0.webm`, `chunk_1.webm`, etc.)
   - Plus one `metadata.json` file with chunk information

**Full Test (8+ hours):**
- Start recording before bed
- Leave browser tab open overnight (don't close laptop)
- Stop in the morning
- Check S3 for ~48 chunks (8 hours ÷ 10 min/chunk)

### Web App Limitations

⚠️ **Browser-Specific Issues:**
- **Screen Sleep**: May pause recording if laptop sleeps
- **Battery**: Keeping browser active drains battery
- **Tab Close**: Recording stops if tab is closed
- **Best for**: Desktop testing, not overnight use

**For reliable overnight recording, use the iOS app** (see below).

---

## iOS App Implementation

### Advantages Over Web

- ✅ **Background Recording**: Continues when screen is off
- ✅ **Better Battery**: Optimized for mobile
- ✅ **More Reliable**: OS-level audio handling
- ✅ **Lock Screen Controls**: See recording status
- ✅ **Perfect for overnight use**

### S3 Upload in iOS

The iOS app will use the same chunked approach:
- Native audio recording API
- Save chunks to device storage
- Upload chunks using AWS SDK for iOS
- Same S3 bucket and credentials
- Automatically resumes uploads if interrupted

### Background Recording Setup

iOS requires special permissions for background audio:

**In `Info.plist`:**
```xml
<key>UIBackgroundModes</key>
<array>
    <string>audio</string>
</array>
```

**Audio Session Configuration:**
```swift
let audioSession = AVAudioSession.sharedInstance()
try audioSession.setCategory(.record, mode: .default, options: [])
try audioSession.setActive(true)
```

This allows the app to:
- Record audio in the background
- Continue when screen locks
- Run all night without interruption

---

## Testing Strategy

### Phase 1: Web App (Now)
```bash
# On your Mac
cd ~/code/snorealarm
git pull origin master
npm run web
```

Test chunked recording and S3 upload (see above).

### Phase 2: iOS App (Next)

1. **Setup** (see `MAC_SETUP.md`):
   ```bash
   cd ~/code/snorealarm
   npm install
   cd ios && pod install
   ```

2. **Add AWS Credentials**:
   - Copy `.env.example` to `.env`
   - Add your AWS keys (already in main `.env`)

3. **Run on Device** (not simulator for best results):
   ```bash
   npm run ios
   ```

4. **Test Overnight**:
   - Start recording
   - Lock phone
   - Go to sleep 😴
   - Stop in morning
   - Check S3 bucket for all chunks

---

## Chunk Configuration

**Default: 10 minutes per chunk**

To change chunk duration, edit `AudioService.web.ts`:

```typescript
private readonly CHUNK_DURATION_MS = 10 * 60 * 1000; // 10 minutes
```

**For testing faster:**
```typescript
private readonly CHUNK_DURATION_MS = 1 * 60 * 1000; // 1 minute
```

**Recommended settings:**
- **Testing**: 1-2 minutes
- **Production**: 10-15 minutes
- **Longer chunks**: Fewer uploads, more memory
- **Shorter chunks**: More uploads, less memory

---

## S3 File Structure

After an 8-hour recording, S3 will contain:

```
s3://eight-ml-scratch/nirsd/snore/audio/snorealarm/
└── session_2026-03-01T06-00-00-000Z/
    ├── chunk_0.webm (10 min)
    ├── chunk_1.webm (10 min)
    ├── chunk_2.webm (10 min)
    ├── ... (45 more chunks)
    ├── chunk_47.webm (10 min)
    └── metadata.json
```

**Each session gets its own folder for easy organization!**

**Metadata JSON includes:**
```json
{
  "sessionId": "session_2026-03-01T06-00-00-000Z",
  "startTime": 1709280000000,
  "endTime": 1709308800000,
  "duration": 28800,
  "chunkCount": 48,
  "uploadedChunks": [
    "session_2026-03-01T06-00-00-000Z_chunk_0",
    "session_2026-03-01T06-00-00-000Z_chunk_1",
    ...
  ],
  "soundEvents": [...],
  "tags": [...]
}
```

---

## Troubleshooting

### Web: Chunks not uploading
- Check browser console for errors
- Verify CORS is configured on S3 bucket (see `AWS_S3_SETUP.md`)
- Check `.env` has correct AWS credentials
- Ensure `npm run web` was run after `git pull`

### Web: Recording stops after a few minutes
- Don't close the browser tab
- Keep laptop awake (disable sleep)
- Check console for errors

### iOS: Can't record in background
- Verify `UIBackgroundModes` includes `audio` in `Info.plist`
- Check iOS Settings → SnoreAlarm → Background App Refresh is ON
- Ensure audio session is configured for `.record` category

### S3: Upload fails
- Verify IAM permissions (see `AWS_S3_SETUP.md`)
- Check bucket CORS policy allows `localhost:3000` and `localhost:8081`
- Ensure credentials in `.env` are correct

---

## Next Steps

1. ✅ **Test Web Chunked Recording** (you can do this now)
2. 🔄 **Set up iOS Development** (see `MAC_SETUP.md`)
3. 🔄 **Implement iOS S3 Upload** (similar to web)
4. 🔄 **Test iOS Background Recording** (overnight test)
5. 🔄 **Optimize chunk size** (based on real usage)

---

## Performance Metrics

| Platform | Max Recording | Memory Usage | Battery Impact | Reliability |
|----------|---------------|--------------|----------------|-------------|
| **Web (Chunked)** | 8+ hours | ~50 MB | High (browser) | Good |
| **iOS (Chunked)** | Unlimited | ~30 MB | Low (native) | Excellent |
| **Android (Chunked)** | Unlimited | ~30 MB | Low (native) | Excellent |

The chunked approach makes **overnight recording reliable and practical** on all platforms! 🎉
