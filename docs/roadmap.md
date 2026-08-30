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

## Milestone 1 — Local Project & Audio Foundation

### Prerequisites
Milestone 0.

### Work
- Project model.
- IndexedDB repositories.
- Asset import.
- Audio decoding.
- AudioContext lifecycle.
- Timeline model.
- Basic playback.
- WAV exporter.

### Definition of Done
- User can create a project.
- User can import an audio asset.
- Asset survives reload.
- Audio can be played.
- Clip can be positioned on timeline.
- Master WAV can be exported.

## Milestone 2 — Speech-to-Text

### Prerequisites
Milestone 1.

### Work
- Whisper Web Worker.
- Hugging Face Transformers.js.
- WebGPU capability detection.
- WASM fallback.
- Progress reporting.
- Cancellation.
- Worker recovery.

### Definition of Done
- Supported audio can be transcribed without blocking the UI.
- Transcript contains timestamps.
- Progress is visible.
- WebGPU is preferred when available.
- WASM fallback works.
- Worker failure does not corrupt project state.

## Milestone 3 — Text-to-Speech

### Prerequisites
Milestone 1.

### Work
- TTS worker.
- Voice selection.
- Speed controls.
- Voiceover asset persistence.
- Timeline insertion.

### Definition of Done
- User can enter narration.
- User can select a voice.
- Voiceover can be generated.
- Generated audio is playable.
- Generated audio can be inserted into timeline.
- Failed generation leaves the previous project intact.

## Milestone 4 — Music Generation

### Prerequisites
Milestone 1.

### Work
- Music prompt.
- Mood / genre presets.
- Procedural/preset MVP generator.
- Music worker where computation requires it.
- Generated asset persistence.

### Definition of Done
- User can enter a prompt.
- User can select mood.
- Generator returns playable audio.
- Audio can be added to timeline.
- Browser memory usage remains bounded.

## Milestone 5 — Mixer & Ducking

### Prerequisites
Milestones 2, 3, and 4.

### Work
- Voice bus.
- Music bus.
- Gain controls.
- Sidechain ducking.
- Master analyser.
- Final WAV rendering.

### Definition of Done
- Voice and music play together.
- Music automatically lowers during speech.
- Ducking amount is adjustable.
- Master preview matches exported audio within expected encoder/rendering tolerances.

## Milestone 6 — WebMCP

### Prerequisites
Milestones 1–5.

### Work
- WebMCP registration.
- Tool definitions.
- Tool validation.
- Command delegation.
- Tool-call inspector.
- Structured errors.
- Cancellation.

### Definition of Done
- Agent can inspect project state.
- Agent can trigger transcription.
- Agent can generate voiceover.
- Agent can generate music.
- Agent can modify timeline.
- Agent can mix/export.
- UI and agent use identical command implementations.
- Tool calls are observable in the UI.

## Milestone 7 — Hackathon Hardening

### Prerequisites
Milestone 6.

### Work
- Performance testing.
- Browser compatibility testing.
- Error-state polish.
- Demo project.
- README.
- Architecture documentation.
- Demo video.
- Devpost submission.

### Definition of Done
- Production deployment works.
- Core demo flow can be completed from a clean browser session.
- WebMCP agent workflow is demonstrable.
- No critical console errors.
- Documentation is complete.
- Public repository is ready.
- Hackathon submission assets are ready.
