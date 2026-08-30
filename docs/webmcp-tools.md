# WebMCP Tool Contract

## Design Rules

- Tools represent user-level capabilities, not internal functions.
- Tool parameters must be small JSON-compatible values.
- Binary audio and video must remain local and be addressed by `assetId`.
- Read-only tools must declare read-only semantics.
- Mutating tools must use the command bus.
- Errors must be structured and actionable.

## Tools (13 Total)

### 1. get_project_state

Purpose: Inspect current project state, tracks, clips, ducking settings, master volume, and assets.

Input:
```json
{}
```

Output:
```json
{
  "projectId": "uuid",
  "name": "Demo Project",
  "durationSec": 60,
  "tracks": [],
  "assets": [],
  "videos": []
}
```
Read-only: yes.

---

### 2. list_video_assets

Purpose: Allow an agent to discover video assets available in the project media library.

Input:
```json
{}
```

Output:
```json
{
  "videos": [
    {
      "assetId": "uuid",
      "name": "product-demo.mp4",
      "durationSec": 82.4,
      "width": 1920,
      "height": 1080,
      "mimeType": "video/mp4",
      "hasAudio": true
    }
  ]
}
```
Read-only: yes.

---

### 3. get_video_metadata

Purpose: Inspect detailed technical metadata of a specific video asset.

Input:
```json
{
  "assetId": "uuid"
}
```

Output:
```json
{
  "assetId": "uuid",
  "name": "product-demo.mp4",
  "durationSec": 82.4,
  "width": 1920,
  "height": 1080,
  "frameRate": 30,
  "mimeType": "video/mp4",
  "sizeBytes": 18273421,
  "hasAudio": true
}
```
Read-only: yes.

---

### 4. get_video_asset

Purpose: Resolve a structured local asset reference (does NOT dump raw binary into JSON).

Input:
```json
{
  "assetId": "uuid"
}
```

Output:
```json
{
  "assetId": "uuid",
  "name": "product-demo.mp4",
  "mimeType": "video/mp4",
  "sizeBytes": 18273421,
  "durationSec": 82.4,
  "width": 1920,
  "height": 1080
}
```
Read-only: yes.

---

### 5. extract_video_audio

Purpose: Extract the audio soundtrack locally from a video asset into a 16-bit PCM WAV asset.

Input:
```json
{
  "assetId": "uuid"
}
```

Output:
```json
{
  "videoAssetId": "uuid",
  "audioAssetId": "uuid",
  "durationSec": 82.4
}
```
Read-only: no (mutating).

---

### 6. get_video_transcript

Purpose: Retrieve existing transcript for a video asset or return structured error if audio has not been transcribed yet.

Input:
```json
{
  "assetId": "uuid"
}
```

Output (Success):
```json
{
  "assetId": "audio_uuid",
  "text": "Full transcribed speech...",
  "segments": [
    { "id": "0", "start": 0.0, "end": 2.4, "text": "Welcome to WebMCP" }
  ]
}
```

Output (Not Found):
```json
{
  "error": "TRANSCRIPT_NOT_FOUND",
  "message": "No audio has been extracted from this video yet. Call extract_video_audio first, then transcribe_audio_asset."
}
```
Read-only: yes.

---

### 7. get_video_frame

Purpose: Capture a canvas-rendered frame snapshot at a specific timestamp.

Input:
```json
{
  "assetId": "uuid",
  "timeSec": 12.5
}
```

Output:
```json
{
  "assetId": "uuid",
  "timeSec": 12.5,
  "width": 1920,
  "height": 1080,
  "dataUrl": "data:image/jpeg;base64,..."
}
```
Read-only: yes.

---

### 8. transcribe_audio_asset

Input:
```json
{
  "assetId": "uuid",
  "language": "en"
}
```
Read-only: no.

---

### 9. generate_voiceover

Input:
```json
{
  "text": "Welcome to our product.",
  "voiceId": "narrator_male",
  "speed": 1.0,
  "pitch": 1.0,
  "autoInsertToTimeline": true
}
```
Read-only: no.

---

### 10. generate_music

Input:
```json
{
  "prompt": "Energetic SaaS product launch",
  "mood": "energetic_tech",
  "durationSec": 30,
  "bpm": 120,
  "autoInsertToTimeline": true
}
```
Read-only: no.

---

### 11. update_audio_track

Input:
```json
{
  "clipId": "uuid",
  "startSec": 2.0,
  "gainDb": -6
}
```
Read-only: no.

---

### 12. mix_audio_project

Input:
```json
{
  "duckingAmountDb": -14,
  "masterGain": 1.0
}
```
Read-only: no.

---

### 13. export_audio

Input:
```json
{
  "format": "wav"
}
```
Read-only: no.
