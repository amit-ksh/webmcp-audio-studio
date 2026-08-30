# Implementation Roadmap

## Milestone 0 — Repository & Architecture Baseline (Status: COMPLETED)

### Prerequisites
None.

### Work
- Scaffold with the official TanStack CLI.
- Configure pnpm.
- Configure TypeScript strict mode.
- Configure ESLint and Prettier.
- Configure Tailwind/CSS design tokens.
- Configure TanStack Start SPA mode.
- Configure Netlify with COOP/COEP headers.
- Create documentation and ADRs.
- Establish source directory boundaries and contracts.

### Definition of Done
- [x] `pnpm lint` passes.
- [x] `pnpm typecheck` passes.
- [x] `pnpm build` passes.
- [x] Clean repository contains no generated secrets.
- [x] Netlify preview can build successfully.
- [x] Documentation matches the implemented architecture.

## Milestone 1 — Local Project & Audio Foundation (Status: COMPLETED)

### Prerequisites
Milestone 0.

### Work
- Project, Track, Clip, AudioAsset Zod models.
- IndexedDB repositories (`projects`, `assets_meta`, `assets_blob`, `transcripts`).
- Audio asset file drag-and-drop & file picker import.
- Audio decoding into in-memory `AudioBuffer` pool.
- AudioContext lifecycle and user-gesture auto-resume.
- Multi-track timeline model and interactive scrubbing/drag.
- Real-time stereo VU level meter using `AnalyserNode`.
- Offline master mixdown renderer and 16-bit PCM WAV exporter.
- Unified Command Bus.

### Definition of Done
- [x] User can create a project.
- [x] User can import an audio asset.
- [x] Asset survives reload (IndexedDB).
- [x] Audio can be auditioned and played.
- [x] Clip can be positioned on timeline.
- [x] Master WAV can be exported.

## Milestone 2 — Speech-to-Text (Status: COMPLETED)

### Prerequisites
Milestone 1.

### Work
- Whisper Web Worker with `@huggingface/transformers`.
- WebGPU detection with WASM fallback.
- Audio downmix and 16kHz Float32 PCM conversion via `OfflineAudioContext`.
- Chunked timestamped inference reporting progress.
- Cancellation and error recovery.
- Transcript viewer with click-to-seek, copy text, and "Send to Narration".
- IndexedDB transcript persistence and Command Bus integration.

### Definition of Done
- [x] Supported audio can be transcribed without blocking the UI.
- [x] Transcript contains timestamps.
- [x] Progress is visible.
- [x] WebGPU is preferred when available.
- [x] WASM fallback works.
- [x] Worker failure does not corrupt project state.

## Milestone 3 — Text-to-Speech (Status: COMPLETED)

### Prerequisites
Milestone 1.

### Work
- TTS speech acoustic synthesis Web Worker.
- Multi-timbre vocal personas (Tech Narrator, SaaS Host, Launch Energy, Executive Calm).
- Speed (0.5x - 1.75x) and Pitch (0.75x - 1.25x) controls.
- Script templates (SaaS Launch, Feature Explainer, Developer Demo).
- Audio asset persistence in IndexedDB and in-memory cache.
- Timeline automatic clip placement on Voiceover track.
- Command Bus integration (`voiceover.generate`).

### Definition of Done
- [x] User can enter narration script.
- [x] User can select vocal persona.
- [x] Voiceover can be generated in Web Worker.
- [x] Generated audio is playable in asset audition player.
- [x] Generated audio is inserted into timeline.
- [x] Failed generation leaves previous project intact.

## Milestone 4 — Music Generation (Status: COMPLETED)

### Prerequisites
Milestone 1.

### Work
- Multi-layer procedural harmonic music synthesizer in Web Worker.
- 4 rich mood presets (`energetic_tech`, `cinematic_reveal`, `ambient_minimal`, `upbeat_fun`).
- Sub-bass, polyphonic pads, stereo arpeggiator, and dynamic percussion.
- Duration (10s - 120s) and Tempo (70 - 160 BPM) controls.
- Stereo 16-bit WAV persistence in IndexedDB and in-memory cache.
- Timeline automatic placement on Backing Music track.
- Command Bus integration (`music.generate`).

### Definition of Done
- [x] User can enter a music prompt.
- [x] User can select mood preset and tempo.
- [x] Generator returns playable stereo backing track.
- [x] Audio can be added to timeline.
- [x] Browser memory usage remains bounded.

## Milestone 5 — Mixer & Ducking (Status: COMPLETED)

### Prerequisites
Milestones 2, 3, and 4.

### Work
- Dual audio sub-buses (Voice Bus, Music Bus with Sidechain Ducking, SFX Bus -> Master).
- Live real-time sidechain ducking dynamic envelope automation during playback.
- Offline sample-accurate sidechain ducking curve for WAV export.
- Ducking depth (-3dB to -30dB), attack, and release parameters.
- Channel strips with track faders, solo, and mute.
- Visual ducking curve SVG diagram in MixerPanel and shaded ducking zones on timeline.
- Master VU peak and RMS analyzer.

### Definition of Done
- [x] Voice and music play together with sample accuracy.
- [x] Music automatically lowers during speech and recovers smoothly.
- [x] Ducking amount, attack, and release are adjustable.
- [x] Master preview matches exported audio within expected encoder tolerances.

## Milestone 6 — WebMCP (Status: COMPLETED)

### Prerequisites
Milestones 1–5.

### Work
- Browser WebMCP registration (`document.modelContext.registerTool`, `window.modelContext`, and `window.__webmcp_callTool`).
- All 7 WebMCP Tool definitions with schemas, parameters, and `readOnlyHint` flags.
- WebMCP tool executors delegating to the unified Command Bus (`UI === Agent`).
- Agent Studio Inspector dashboard with interactive JSON tool runner.
- 1-Click Autonomous Agent Demo workflow sequence.
- Live tool call logs with duration, payloads, and status badges.

### Definition of Done
- [x] Agent can inspect project state (`get_project_state`).
- [x] Agent can trigger transcription (`transcribe_audio_asset`).
- [x] Agent can generate voiceover (`generate_voiceover`).
- [x] Agent can generate music (`generate_music`).
- [x] Agent can modify timeline (`update_audio_track`).
- [x] Agent can mix and export (`mix_audio_project`, `export_audio`).
- [x] UI and agent use identical command implementations.
- [x] Tool calls are observable in the UI.

## Milestone 7 — Hackathon Hardening (Status: COMPLETED)

### Prerequisites
Milestone 6.

### Work
- Performance optimization and lazy chunked loading.
- Browser compatibility fallbacks for WebGPU and WASM.
- Polished DAW aesthetics, glassmorphism layout, and accessible keybindings (Space = play/pause).
- 1-Click Autonomous Demo Sequence in WebMCP Inspector.
- Comprehensive README and updated architectural documentation.
- Netlify SPA deployment with COOP/COEP isolation headers.

### Definition of Done
- [x] Production deployment configuration is verified (`netlify.toml`).
- [x] Core demo flow can be completed from a clean browser session.
- [x] WebMCP agent workflow is demonstrable.
- [x] No critical console errors.
- [x] Documentation is complete.
- [x] Public repository is ready.
- [x] Hackathon submission assets are ready.
