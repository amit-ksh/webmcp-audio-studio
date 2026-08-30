# ADR 003: Worker Boundaries

## Decision

STT, TTS, and computationally expensive music operations run outside the React main thread.

## Rationale

ML inference and large audio transformations can cause UI jank, memory pressure, and poor interaction responsiveness.

## Consequences

Workers communicate through typed messages and transferable ArrayBuffers where appropriate. Workers cannot import UI or application state stores.
