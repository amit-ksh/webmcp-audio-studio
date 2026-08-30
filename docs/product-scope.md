# Product Scope: WebMCP Audio Studio

## 1. Executive Summary

A client-first browser audio studio for creating audio assets for product demos, launch videos, feature explainers, and other video content.

The application provides:
- Speech-to-text transcription
- Text-to-speech voiceover generation
- Text-to-song / backing-track generation
- Multi-track timeline editing and mixing
- Client-side audio export
- WebMCP tools that let browser-based AI agents inspect and operate the studio

The MVP is frontend-only and stores project state and media locally in the browser.

## 2. Core MVP

### 2.1 Speech-to-Text
- Upload an audio asset.
- Decode audio to model-compatible PCM.
- Run Whisper in a Web Worker.
- Prefer WebGPU when available.
- Fall back to WASM.
- Produce timestamped transcription segments.
- Display transcription in the editor.
- Report model loading and processing progress.
- Support cancellation and worker recovery.

### 2.2 Text-to-Speech
- Enter narration text.
- Select a voice.
- Control speech speed.
- Generate voiceover in a Web Worker.
- Preview generated audio.
- Add generated audio to the timeline.

### 2.3 Text-to-Song / Backing Track
- Enter a music prompt.
- Select mood / genre preset.
- Generate a backing track in the browser.
- Preview and add it to the timeline.
- MVP may use procedural/preset-driven generation to keep browser resource usage predictable.

### 2.4 Timeline & Mixer
- Voiceover track.
- Music track.
- Clip positioning.
- Independent volume controls.
- Playback controls.
- Automatic music ducking during speech.
- Master mix preview.
- WAV export.

### 2.5 WebMCP
Expose browser tools through the WebMCP API rather than a custom `/api/webmcp` JSON-RPC endpoint.

Initial tools:
- `get_project_state`
- `transcribe_audio_asset`
- `generate_voiceover`
- `generate_music`
- `update_audio_track`
- `mix_audio_project`
- `export_audio`

The UI and WebMCP tools must call the same application command bus.

## 3. Post-MVP

- Zero-shot voice cloning.
- Video-to-speech synchronization.
- Scene-aware voiceover generation.
- Stem separation.
- WebCodecs video/audio compositing.
- More advanced neural music generation.
- Additional export formats.
- Project sharing / cloud persistence.

## 4. Primary User Flow

1. User opens the studio.
2. User creates or loads a local project.
3. User uploads audio or records source audio.
4. User transcribes source audio when required.
5. User writes or imports a narration script.
6. User generates a voiceover.
7. User enters a music prompt and generates backing audio.
8. User arranges voice and music on the timeline.
9. User adjusts levels and ducking.
10. User previews the master mix.
11. User exports WAV.

## 5. Agent Flow

1. Agent discovers registered WebMCP tools.
2. Agent reads project state.
3. Agent calls one or more generation / editing tools.
4. Tool validates input.
5. Command bus executes the operation.
6. Worker performs expensive processing where applicable.
7. Result is persisted locally.
8. Project state is updated.
9. Tool returns a structured result to the agent.

## 6. Permission Model

The MVP is anonymous and client-side.

### Browser permissions
- Microphone permission is required only for microphone recording.
- No microphone permission is requested on initial page load.
- Local file access is initiated by explicit user interaction.
- WebGPU availability is detected without requesting unnecessary permissions.

### Agent permissions
Read-only tools:
- `get_project_state`

Mutating tools:
- `transcribe_audio_asset`
- `generate_voiceover`
- `generate_music`
- `update_audio_track`
- `mix_audio_project`
- `export_audio`

Mutating operations must be explicit, observable, and cancellable where possible.

## 7. Error States

### Unsupported WebGPU
Fall back to WASM and show processing status.

### WASM / WebGPU failure
Return a structured processing error and preserve the existing project.

### Worker failure / OOM
Terminate the affected worker, release intermediate buffers, recreate the worker, and retry only when safe.

### Invalid WebMCP input
Return a structured validation error. Never execute partially parsed parameters.

### Missing asset
Return an asset-not-found error without mutating the project.

### Export failure
Preserve the project and allow the user to retry.

### Browser storage unavailable
Run in-memory where possible and clearly warn that persistence is unavailable.

## 8. MVP Acceptance Criteria

- A user can create a project without an account.
- Audio assets remain local to the browser.
- STT works through a worker.
- TTS can produce playable narration.
- Music generation produces a playable backing track.
- Voice and music can be mixed.
- Automatic ducking is audible and configurable.
- A WAV master can be exported.
- WebMCP tools can inspect and mutate the project.
- UI and agent actions use the same command implementations.
