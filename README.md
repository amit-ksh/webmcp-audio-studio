# 🎙️ WebMCP Audio Studio

> **Browser-First AI Audio Production Studio for SaaS Launch Videos, Product Demos & Agentic Workflows**

[![License: MIT](https://img.shields.io/badge/License-MIT-indigo.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue.svg)](https://www.typescriptlang.org/)
[![WebMCP Ready](https://img.shields.io/badge/WebMCP-Autonomous%20Agent%20Ready-cyan.svg)](https://github.com/)

**WebMCP Audio Studio** is a client-first, browser-only digital audio workstation (DAW) and AI media generation suite. It allows users and autonomous WebMCP browser agents to create, transcribe, synthesize, arrange, duck, and master complete audio soundtracks for product demos, feature explainers, and marketing launch videos without any server-side infrastructure.

---

## 🚀 Key Capabilities

1. **Speech-to-Text (STT):** In-browser Whisper AI running inside a dedicated Web Worker with WebGPU acceleration and WASM fallback. Produces timestamped dialogue segments with click-to-seek playback.
2. **Text-to-Speech (TTS):** Multi-timbre neural speech acoustic synthesis in Web Worker supporting multiple personas (*Tech Narrator*, *SaaS Host*, *Launch Energy*, *Executive Calm*) with speed and pitch controls.
3. **AI Procedural Music Generation:** Stereo harmonic synthesizer generating layered backing tracks with sub-bass, polyphonic chord pads, arpeggios, and dynamic percussion across 4 mood presets (*Energetic Tech*, *Cinematic Reveal*, *Ambient Minimal*, *Upbeat & Fun*).
4. **Interactive Multi-Track Timeline:** Multi-lane arrangement (Voiceover, Backing Music, SFX), clip drag-and-drop repositioning, trimming handles, volume faders, mute ('M'), solo ('S'), and time ruler with real-time scrub playhead.
5. **Automatic Sidechain Ducking:** Real-time and offline DSP sidechain compression that automatically attenuates backing music during speech clips and smoothly recovers during pauses.
6. **Master Metering & WAV Export:** Real-time stereo VU peak/RMS level analyzer and client-side 16-bit PCM master mixdown WAV exporter.
7. **WebMCP Agent Integration (`UI === Agent`):** 7 registered WebMCP tools (`document.modelContext`) backed by a unified Command Bus, paired with a live Agent Studio Inspector and 1-Click Autonomous Demo runner.

---

## 🏗️ Architecture & Data Flow

```
┌────────────────────────────────────────────────────────┐
│                   Studio UI (React)                    │
│  ┌───────────────┐  ┌────────────────┐  ┌───────────┐  │
│  │ StudioShell   │  │ Timeline/Mixer │  │ Inspectors│  │
│  └───────┬───────┘  └───────┬────────┘  └─────┬─────┘  │
└──────────┼──────────────────┼─────────────────┼────────┘
           │                  │                 │
           ▼                  ▼                 ▼
┌────────────────────────────────────────────────────────┐
│                   Unified Command Bus                  │
│       (project.*, asset.*, voice.*, music.*, etc.)     │
└─────────────────────────────▲──────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │   WebMCP Tools    │
                    │ (modelContext API)│
                    └───────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────┐
│                  Application Services                  │
│  ┌─────────────────┐ ┌─────────────────┐ ┌───────────┐ │
│  │ ProjectService  │ │ AudioEngine     │ │ ExportSvc │ │
│  └────────┬────────┘ └────────┬────────┘ └─────┬─────┘ │
└───────────┼───────────────────┼────────────────┼───────┘
            │                   │                │
    ┌───────┴───────┐     ┌─────┴─────┐    ┌─────┴─────┐
    ▼               ▼     ▼           ▼    ▼           ▼
┌────────┐    ┌─────────┐ ┌────────┐ ┌────────┐ ┌─────────┐
│Zustand │    │IndexedDB│ │WebAudio│ │Workers │ │MasterWAV│
│(Meta)  │    │(Blobs)  │ │Graph   │ │(STT/TTS│ │(Offline)│
└────────┘    └─────────┘ └────────┘ └────────┘ └─────────┘
```

### Strict Architectural Boundaries

- **Zero Binary Payloads in State:** Zustand stores hold metadata only. Audio binary Blobs and ArrayBuffers are persisted in IndexedDB and cached in an in-memory `AudioBuffer` pool.
- **Worker Isolation:** ML inference and acoustic synthesis run entirely in Web Workers (`whisper.worker.ts`, `tts.worker.ts`, `music.worker.ts`), preventing main thread jank.
- **Unified Command Bus:** Both UI components and WebMCP agent tools execute through the exact same `CommandBus.execute(command)` pipeline.

---

## 🤖 WebMCP Tool Contract

WebMCP tools are registered via `document.modelContext.registerTool` and accessible in the browser context:

| Tool Name | Type | Description |
| :--- | :--- | :--- |
| `get_project_state` | Read-only | Returns snapshot of project tracks, clips, ducking config, and assets. |
| `transcribe_audio_asset` | Mutating | Runs Whisper STT on target audio asset to generate timestamped text. |
| `generate_voiceover` | Mutating | Generates vocal narration from script and adds clip to Voiceover track. |
| `generate_music` | Mutating | Synthesizes stereo backing track and adds clip to Music track. |
| `update_audio_track` | Mutating | Adjusts clip start position, duration, track gain (dB), mute, or solo. |
| `mix_audio_project` | Mutating | Configures sidechain ducking amount (-3dB to -30dB) and master volume. |
| `export_audio` | Mutating | Renders full multi-track mixdown to standard 16-bit PCM WAV. |

---

## 💻 Getting Started

### Prerequisites
- Node.js 20+
- pnpm 9+ or 10+

### Installation & Development

```bash
# Clone the repository
git clone https://github.com/your-username/webmcp-audio-studio.git
cd webmcp-audio-studio

# Install dependencies
pnpm install

# Start development server (port 3000)
pnpm dev
```

### Validation & Production Build

```bash
# Static TypeScript validation
pnpm typecheck

# Code linting
pnpm lint

# Production bundle build
pnpm build

# Preview production build locally
pnpm preview
```

---

## 🌐 Netlify Deployment

The project is pre-configured with `netlify.toml` including Cross-Origin-Opener-Policy (COOP) and Cross-Origin-Embedder-Policy (COEP) headers for WebGPU and WASM cross-origin isolation:

```toml
[build]
  command = "pnpm build"
  publish = ".output/public"

[[headers]]
  for = "/*"
  [headers.values]
    Cross-Origin-Opener-Policy = "same-origin"
    Cross-Origin-Embedder-Policy = "credentialless"
```

---

## 📜 License

MIT License. Built for the WebMCP Hackathon.
