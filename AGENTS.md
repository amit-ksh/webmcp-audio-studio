# Agent Guidelines & Rules

## Project Rules
- **Ignore Tests:** Do not create, update, or run unit/integration test suites (e.g. Vitest/Jest). Focus on solid production implementations, static typechecking (`pnpm typecheck`), linting (`pnpm lint`), and production building (`pnpm build`).
- **Sprint Workflow:** Implement sprint-by-sprint sequentially. After each sprint:
  1. Validate with `pnpm lint`, `pnpm typecheck`, `pnpm build`.
  2. Commit the changes with descriptive semantic message.
  3. Provide completion summary and proceed to the next sprint.
- **Architectural Rules:**
  - Client-first / browser-only (no mandatory backend server).
  - No binary audio blobs in Zustand (blobs stay in IndexedDB and Web Audio memory cache).
  - Workers never import UI / stores.
  - Unified Command Bus (`UI === Agent`).
