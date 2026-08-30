# WebMCP Tool Contract

## Design Rules

- Tools represent user-level capabilities, not internal functions.
- Tool parameters must be small JSON-compatible values.
- Binary audio must remain local and be addressed by `assetId`.
- Read-only tools must declare read-only semantics.
- Mutating tools must use the command bus.
- Errors must be structured and actionable.

## Tools

### get_project_state

Purpose: inspect the current project.

Input:
```json
{}
```

Output:
```json
{
  "projectId": "uuid",
  "tracks": [],
  "durationSec": 0
}
```

Read-only: yes.

### transcribe_audio_asset

Input:
```json
{
  "assetId": "uuid",
  "language": "en"
}
```

Read-only: no.

### generate_voiceover

Input:
```json
{
  "text": "Welcome to our product.",
  "voiceId": "default",
  "speed": 1
}
```

Read-only: no.

### generate_music

Input:
```json
{
  "prompt": "Energetic SaaS product launch",
  "mood": "energetic_tech",
  "durationSec": 30
}
```

Read-only: no.

### update_audio_track

Input:
```json
{
  "clipId": "uuid",
  "startSec": 2,
  "gainDb": -6
}
```

Read-only: no.

### mix_audio_project

Input:
```json
{
  "duckingAmountDb": -14
}
```

Read-only: no.

### export_audio

Input:
```json
{
  "format": "wav"
}
```

Read-only: no.
