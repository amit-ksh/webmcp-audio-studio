# ADR 004: Browser Video Assets & WebMCP Video Isolation

## Context

Video files are significantly larger than audio files (tens or hundreds of megabytes). We must support video ingestion, metadata inspection, native video playback, in-browser audio extraction, Whisper STT transcription, and agent discovery without overloading React state, crashing the browser, or compromising user privacy.

## Decision

1. **Storage Separation**:
   - Video binary data (`Blob`) is stored exclusively in IndexedDB under `video_assets_blob`.
   - Metadata (`VideoAsset`, dimensions, duration, frame rate, mime type) is stored in `video_assets_meta`.
   - Zustand stores only serializable metadata and temporary object URLs, never large binary Blobs.

2. **Web Audio Audio Extraction**:
   - Audio soundtracks are decoded locally in the browser using `AudioContext.decodeAudioData` on array buffers sliced from the IndexedDB video blob.
   - The resulting decoded audio is converted into standard 16-bit PCM WAV assets, saved into `assets_blob`/`assets_meta`, and linked to the video asset.
   - The existing Whisper STT worker transcribes the extracted audio without duplicating worker pipelines.

3. **WebMCP Boundary Enforcement**:
   - WebMCP video tools (`list_video_assets`, `get_video_metadata`, `get_video_asset`, `extract_video_audio`, `get_video_transcript`, `get_video_frame`) strictly return metadata and structured references.
   - Raw binary video data is never returned as huge JSON payloads.

4. **Security & Privacy**:
   - Video files remain 100% on the user's local browser machine. No remote server uploads occur.

## Consequences

- Zero backend infrastructure is required for video ingestion and audio extraction.
- Browser memory footprint is strictly controlled by revoking object URLs and caching audio buffers on-demand.
- WebMCP agents and human users share identical command bus operations.
