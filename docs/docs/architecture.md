# Technical Architecture

## 1. Architectural Principles

1. Client-first: no application database or mandatory backend for MVP.
2. Local-first: media and project state live in IndexedDB.
3. Worker-first for expensive ML/audio preparation.
4. Contract-first: public application operations use Zod schemas and TypeScript types.
5. Single command path: UI and WebMCP invoke the same commands.
6. No binary audio payloads through WebMCP tool parameters. Tools reference local `assetId` values.
7. Workers never import UI, React, Zustand, or route modules.
8. Audio buffers do not live in Zustand.
9. Adapters never import UI components directly.
10. Browser-only APIs must be isolated behind browser/platform adapters.

## 2. High-Level Data Flow

```text
UI
 │
 ├──────────────┐
 │              │
 ▼              ▼
Command Bus   WebMCP Tools
 │              │
 └──────┬───────┘
        ▼
 Application Services
        │
 ┌──────┼─────────┐
 ▼      ▼         ▼
STT    TTS      Music
Worker Worker   Worker
 │      │         │
 └──────┼─────────┘
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
- Generation status.
- Progress state.
- Playback UI state.
- Error state.

### IndexedDB owns
- Original audio assets.
- Generated audio assets.
- Transcription results.
- Project snapshots.
- Asset metadata.

### Web Audio API owns
- Decoded AudioBuffers used for playback.
- Audio nodes.
- Gain.
- Compression / ducking.
- Analyser state.
- Master output.

Large binary buffers must never be placed in Zustand.

## 4. Command Bus

All user mutations must resolve through application commands.

Example command categories:
- `project.create`
- `asset.import`
- `transcription.run`
- `voiceover.generate`
- `music.generate`
- `timeline.addClip`
- `timeline.updateClip`
- `timeline.removeClip`
- `mixer.setDucking`
- `project.mix`
- `project.export`

The WebMCP layer is an adapter over these commands, not a second business-logic implementation.

## 5. Contract Layer

Use Zod schemas as runtime validation and TypeScript inference.

Contracts should cover:
- Project.
- Asset.
- Track.
- Clip.
- Transcript.
- Voiceover request.
- Music request.
- Export request.
- Command results.
- Application errors.

WebMCP tool schemas should remain compatible with the browser WebMCP API and should not expose internal implementation details.

## 6. WebMCP Architecture

Use the browser WebMCP registration API:

```typescript
document.modelContext.registerTool(...)
```

Do not create a custom `/api/webmcp` server for MVP.

Tool registration belongs in:

```text
src/webmcp/register-tools.ts
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

### UI
- Button
- IconButton
- Slider
- Select
- Textarea
- Dialog
- Toast
- Progress
- Tabs

### Studio
- StudioShell
- ProjectHeader
- AssetPanel
- Timeline
- TimelineTrack
- TimelineClip
- PlaybackControls
- MasterMeter

### Editor
- ScriptEditor
- VoiceSelector
- MusicPrompt
- GenerationProgress

### Agent
- AgentInspector
- ToolCallLog
- ToolStatus

Components consume feature APIs and never directly manipulate worker internals.

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
│   ├── editor/
│   └── agent/
├── features/
│   ├── transcription/
│   ├── voiceover/
│   ├── music/
│   ├── mixer/
│   └── export/
├── workers/
│   ├── whisper.worker.ts
│   ├── tts.worker.ts
│   └── music.worker.ts
├── audio/
│   ├── audio-context.ts
│   ├── graph.ts
│   ├── ducking.ts
│   ├── timeline.ts
│   └── exporters/
├── webmcp/
│   ├── register-tools.ts
│   ├── tool-definitions.ts
│   ├── tool-executors.ts
│   └── types.ts
├── contracts/
│   ├── project.ts
│   ├── audio.ts
│   ├── transcription.ts
│   ├── voiceover.ts
│   └── music.ts
├── stores/
│   ├── project-store.ts
│   └── playback-store.ts
├── storage/
│   ├── indexed-db.ts
│   ├── asset-store.ts
│   └── project-store.ts
└── lib/
    ├── errors/
    ├── browser/
    └── utils/
```

## 9. Boundary Rules

### Workers
Workers may import:
- ML libraries.
- Audio codecs / DSP libraries.
- Shared contracts.
- Pure utility functions.

Workers may not import:
- React.
- UI components.
- Zustand stores.
- Route modules.
- Browser UI state.

### Audio layer
Audio modules may import:
- Contracts.
- Pure utilities.
- Browser audio APIs.

Audio modules may not import:
- React components.
- WebMCP registration code.

### Storage
Storage adapters may import:
- IndexedDB APIs.
- Contracts.

Storage adapters may not import:
- UI.
- WebMCP.
- Zustand.

### WebMCP
WebMCP may import:
- Contracts.
- Command bus.
- Application services.

WebMCP may not contain duplicated business logic.

### UI
UI may call:
- Feature hooks.
- Command APIs.
- Store selectors.

UI must not directly create ML workers unless the feature abstraction requires it.

## 10. Netlify

Deploy as a frontend-only TanStack Start SPA.

Required:
- Static client build.
- SPA fallback.
- Cross-origin isolation headers when required by the chosen WebGPU/WASM execution path.
- No application database.
- No server-side audio processing in MVP.
