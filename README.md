# Waveframe

> A local-first, agent-ready audio studio for turning product videos into narrated, scored, exportable media—entirely in the browser.

[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-149eca.svg)](https://react.dev/)
[![WebMCP](https://img.shields.io/badge/WebMCP-13_tools-0891b2.svg)](./docs/webmcp-tools.md)

Waveframe is the product experience built by **WebMCP Audio Studio**. It combines local video handling, speech recognition, neural voice generation, procedural music, timeline mixing, and browser-native media export in one client-first application.

The same capabilities are available to a person through the interface and to a browser agent through WebMCP. Both enter through one command bus, so an agent does not get a separate or less trustworthy implementation of the studio.

## Vision

Creating a soundtrack for a product demo should feel like directing a collaborator, not assembling a server-side media pipeline. Import a video, understand its speech, write or generate narration, score it, balance the mix, and export the result without sending the source media to an application backend.

Waveframe is built around three ideas:

- **The browser is the workstation.** Media, project state, inference, mixing, and export stay on the user's device.
- **Agents are first-class operators.** Every meaningful studio action should be discoverable, structured, observable, and safe to invoke through WebMCP.
- **Human and agent actions converge.** `UI === Agent`: both use the same validated commands and application services.

Today, Waveframe is a working local production studio for product demos and launch videos. The longer-term direction is a scene-aware media workspace with voice cloning, stem separation, richer generative music, video-to-speech synchronization, and optional project sharing.

## What works today

### Video-first workflow

- Drag and drop a local video and preview it with synchronized timeline playback.
- Persist video metadata and binary media in IndexedDB across reloads.
- Generate a thumbnail, inspect metadata, and capture a frame at a timestamp.
- Extract the soundtrack locally into a reusable 16-bit PCM WAV asset.
- Transcribe extracted speech with Whisper and associate the result with the source video.
- Composite the selected video with the finished audio mix using Canvas, Web Audio, and MediaRecorder. The exporter uses MP4 when the browser supports the requested codec and otherwise falls back to a supported WebM format.

### Speech, voice, and music

- Run `onnx-community/whisper-tiny` in a dedicated worker, preferring WebGPU and falling back to WASM.
- Generate neural narration with Kokoro 82M and four mapped voice personas.
- Control narration speed and add or replace voiceover clips.
- Generate stereo procedural backing music in a worker with four mood presets, configurable duration, and tempo.
- Keep generation progress and failures visible without blocking the React main thread.

### Timeline, mix, and export

- Arrange voiceover, backing music, and SFX tracks on a shared timeline.
- Scrub playback, move clips, set clip and track gain, and mute or solo tracks.
- Apply configurable sidechain ducking so music yields to narration.
- Preview through the Web Audio graph with master metering.
- Export the full mix, voiceover stem, or music stem as 16-bit PCM WAV.
- Export the video with the rendered master audio using browser-supported media codecs.

### Agent operation

- Discover 13 registered tools through `document.modelContext.registerTool`.
- Inspect tool schemas in the built-in WebMCP panel.
- Execute the same commands used by the UI and observe structured results.
- Inspect project, video, and transcript state without exposing raw media blobs in tool arguments or responses.

## Architecture

```text
 Human UI                                  Browser agent
 React studio                              WebMCP tools
     │                                          │
     └──────────────────┬───────────────────────┘
                        ▼
               Unified command bus
              validation + orchestration
                        │
        ┌───────────────┼────────────────┐
        ▼               ▼                ▼
 Audio services     Video service    Project services
 STT / TTS / music  decode / frames  timeline / export
        │               │                │
        ├───────────────┼────────────────┤
        ▼               ▼                ▼
 Web Workers        Web Audio API     IndexedDB
 ML + synthesis     playback + mix    projects + media
```

### Architectural boundaries

1. **Client-first and local-first**

   There is no mandatory application server or cloud database. Project snapshots and media are stored locally in IndexedDB. Model files may be downloaded on first use, but imported and generated media is not uploaded by the application.

2. **Metadata and binary data are separated**

   Zustand owns serializable UI and project metadata. Audio and video `Blob` objects live in IndexedDB; decoded `AudioBuffer` objects live in the Web Audio memory cache. Large binary payloads never enter Zustand or WebMCP JSON.

3. **Expensive work leaves the main thread**

   Whisper transcription, Kokoro speech synthesis, and procedural music generation run in isolated Web Workers. Workers communicate through typed messages and do not import React, routes, or Zustand stores.

4. **One command path**

   UI events and WebMCP executors delegate to the same `CommandBus.execute(...)` pipeline. The WebMCP layer validates and adapts; it does not duplicate product behavior.

5. **Contracts at the boundaries**

   Zod schemas and inferred TypeScript types define projects, tracks, clips, audio assets, transcripts, video assets, generation requests, and command results.

### Data ownership

| Layer | Owns | Must not own |
| --- | --- | --- |
| Zustand | Project, track, clip, playback, video-selection, progress, and agent-log state | Audio/video blobs and decoded audio buffers |
| IndexedDB | Project snapshots, transcripts, asset metadata, audio blobs, and video blobs | Live Web Audio nodes |
| Web Audio | Decoded buffers, playback graph, gain, analysis, ducking, and offline rendering | Durable project state |
| Web Workers | STT, TTS, and music computation | UI components, routes, or stores |
| WebMCP | Small JSON inputs, local asset IDs, structured results | Raw audio/video binaries |

## WebMCP surface

Waveframe registers tools with the browser's model context API. Read-only tools inspect local state; mutating tools pass through the unified command bus.

| Area | Read-only tools | Mutating tools |
| --- | --- | --- |
| Project | `get_project_state` | `update_audio_track`, `mix_audio_project`, `export_audio` |
| Video | `list_video_assets`, `get_video_metadata`, `get_video_asset`, `get_video_transcript`, `get_video_frame` | `extract_video_audio` |
| Generation | — | `transcribe_audio_asset`, `generate_voiceover`, `generate_music` |

Tool parameters, examples, and result shapes are documented in [docs/webmcp-tools.md](./docs/webmcp-tools.md).

## Repository map

```text
src/
├── audio/          Web Audio engine, buffer pool, and audio/video exporters
├── components/     Studio shell, timeline, controls, modals, and agent inspector
├── contracts/      Zod schemas and TypeScript domain types
├── features/       Video, transcription, voiceover, music, and mixer features
├── routes/         TanStack Router entry points
├── storage/        IndexedDB repositories and migrations
├── stores/         Zustand project, playback, video, and agent state
├── webmcp/         Tool definitions, registration, executors, and command bus
└── workers/        Whisper, Kokoro TTS, and procedural music workers
```

For the full component and data-flow design, see [docs/architecture.md](./docs/architecture.md). Architectural decisions are recorded under [docs/adr](./docs/adr), and shipped milestones are tracked in [docs/roadmap.md](./docs/roadmap.md).

## Technology

- React 19, TypeScript, TanStack Start/Router, Vite, and Tailwind CSS
- Zustand for application state and `idb` for IndexedDB access
- Web Audio API, OfflineAudioContext, Canvas, and MediaRecorder
- `@huggingface/transformers` for Whisper and `kokoro-js` for neural TTS
- Zod for runtime contracts
- Web Workers for inference and synthesis
- Netlify deployment with cross-origin isolation headers

## Getting started

### Prerequisites

- Node.js 20 or newer
- pnpm 9 or 10
- A modern Chromium-based browser is recommended for WebGPU and the broadest media-codec support

### Run locally

```bash
git clone https://github.com/amit-ksh/webmcp-audio-studio.git
cd webmcp-audio-studio
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000), import a video, then add narration and background music from the studio controls. The first transcription or voice-generation run can take longer while model assets are downloaded and cached by the browser.

### Validate and build

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm preview
```

## Browser and privacy notes

- Media decoding and export depend on codecs supported by the current browser and operating system.
- WebGPU is optional; Whisper falls back to WASM when WebGPU is unavailable or initialization fails.
- Local projects and media are browser data. Clearing site storage removes them.
- Large or long media files are constrained by the device's available memory and browser limits.
- COOP/COEP headers are configured for local development and Netlify to support cross-origin-isolated browser workloads.

## Product direction

The next layer of the vision is to make the studio understand the video, not merely host it. Planned explorations include:

- scene-aware narration and video-to-speech timing;
- zero-shot voice cloning with explicit consent controls;
- stem separation and more advanced neural music generation;
- broader audio and video export options;
- optional cloud persistence and project sharing without weakening the local-first default.

The current product scope is in [docs/product-scope.md](./docs/product-scope.md).
