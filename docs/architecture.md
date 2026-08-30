# Technical Architecture

## 1. Architectural Principles

1. Client-first: no application database or mandatory backend for MVP.
2. Local-first: media (audio and video) and project state live in IndexedDB.
3. Worker-first for expensive ML/audio preparation.
4. Contract-first: public application operations use Zod schemas and TypeScript types.
5. Single command path: UI and WebMCP invoke the same commands.
6. No binary audio or video payloads through WebMCP tool parameters. Tools reference local `assetId` values.
7. Workers never import UI, React, Zustand, or route modules.
8. Audio and video binary Blobs do not live in Zustand.
9. Adapters never import UI components directly.
10. Browser-only APIs must be isolated behind browser/platform adapters.

## 2. High-Level Data Flow

```text
UI (Audio & Video)
 │
 ├──────────────┐
 │              │
 ▼              ▼
Command Bus   WebMCP Tools
 │              │
 └──────┬───────┘
        ▼
 Application Services (Audio & Video)
        │
 ┌──────┼─────────┬──────────────┐
 ▼      ▼         ▼              ▼
STT    TTS      Music          Video
Worker Worker   Worker        Service (Web Audio decode)
 │      │         │              │
 └──────┼─────────┴──────────────┘
        ▼
    Audio Engine
        │
   ┌────┴────┐
   ▼         ▼
Timeline   Mixer/Ducking
   │         │
   └────┬────┘
        ▼
   Master Export
```

## 3. State Management

### Zustand owns
- Project metadata.
- Track metadata.
- Clip metadata.
- Selected clip / track.
- Selected video ID & playback state (time, play, mute, volume).
- Generation status.
- Progress state.
- Playback UI state.
- Error state.

### IndexedDB owns
- Original audio assets (`assets_blob`, `assets_meta`).
- Original video assets (`video_assets_blob`, `video_assets_meta`).
- Generated audio assets.
- Transcription results.
- Project snapshots.
- Asset metadata.

### Web Audio API owns
- Decoded AudioBuffers used for playback.
- Video audio decoding via `AudioContext.decodeAudioData`.
- Audio nodes.
- Gain.
- Compression / ducking.
- Analyser state.
- Master output.

Large binary buffers and video files must never be placed in Zustand.

## 4. Command Bus

All user and agent mutations must resolve through application commands.

Example command categories:
- `project.create`, `project.load`, `project.delete`, `project.rename`
- `asset.import`, `asset.delete`
- `video.import`, `video.delete`, `video.extractAudio`, `video.getFrame`
- `transcription.run`
- `voiceover.generate`
- `music.generate`
- `timeline.addClip`, `timeline.updateClip`, `timeline.removeClip`, `timeline.updateTrack`
- `mixer.setDucking`, `project.mix`
- `project.export`

The WebMCP layer is an adapter over these commands, not a second business-logic implementation.

## 5. Contract Layer

Use Zod schemas as runtime validation and TypeScript inference.

Contracts cover:
- Project (`Project`, `Track`, `Clip`, `DuckingConfig`).
- Audio Asset (`AudioAsset`, `Transcript`).
- Video Asset (`VideoAsset`, `VideoMetadata`, `VideoAssetReference`).
- Request schemas (`VoiceoverRequest`, `MusicRequest`, `ExportRequest`, `ImportVideoRequest`, `ExtractAudioRequest`, `VideoFrameRequest`).
- Command results & WebMCP tool definitions.

## 6. WebMCP Architecture

Use the browser WebMCP registration API:

```typescript
document.modelContext.registerTool(...)
```

Tool execution delegates to application commands:

```text
WebMCP tool
   ↓
input validation
   ↓
command
   ↓
application service
   ↓
repository / worker
   ↓
structured result
```

## 7. Component Registry

### Studio
- `StudioShell`
- `PlaybackControls`
- `AssetPanel` (Audio & Video tabs)
- `MasterMeter`
- `Timeline`, `TimelineTrack`, `TimelineClip`

### Video Workspace
- `VideoPanel`
- `VideoUploader`
- `VideoPlayer`
- `VideoAssetList`
- `VideoMetadata`

### Audio Features
- `TranscriptionPanel`
- `VoiceoverPanel`
- `MusicPanel`
- `MixerPanel`

### Agent
- `AgentInspector` (Interactive tool runner & 1-Click AI Demo flows)
- `ToolCallLog`

## 8. Directory Layout

```text
src/
├── routes/
│   ├── __root.tsx
│   └── index.tsx
├── components/
│   ├── ui/
│   ├── studio/
│   ├── timeline/
│   └── agent/
├── features/
│   ├── video/
│   │   ├── components/
│   │   └── services/
│   ├── transcription/
│   ├── voiceover/
│   ├── music/
│   └── mixer/
├── workers/
│   ├── whisper.worker.ts
│   ├── tts.worker.ts
│   └── music.worker.ts
├── audio/
│   ├── audio-context.ts
│   ├── audio-buffer-pool.ts
│   ├── engine.ts
│   ├── ducking.ts
│   └── exporters/
├── webmcp/
│   ├── register-tools.ts
│   ├── tool-definitions.ts
│   ├── tool-executors.ts
│   └── types.ts
├── contracts/
│   ├── project.ts
│   ├── audio.ts
│   └── video.ts
├── stores/
│   ├── project-store.ts
│   ├── video-store.ts
│   ├── playback-store.ts
│   └── agent-store.ts
├── storage/
│   └── indexed-db.ts
└── lib/
    └── utils.ts
```
