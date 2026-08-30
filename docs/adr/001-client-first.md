# ADR 001: Client-First Architecture

## Decision

The MVP is a frontend-only application running in the browser and deployed on Netlify.

## Rationale

Audio processing, local ML inference, project state, and export can be performed locally. This removes backend infrastructure and makes privacy and hackathon demonstration simpler.

## Consequences

- Browser CPU/GPU and memory become important constraints.
- IndexedDB is required for persistence.
- Long-running operations belong in Web Workers.
- Features must tolerate browser capability differences.
