# ADR 002: WebMCP Uses the Application Command Bus

## Decision

WebMCP tools delegate to the same command bus used by the UI.

## Rationale

Duplicating business logic between UI and agent adapters would create divergent behavior and increase test surface.

## Consequences

WebMCP is an adapter layer. It validates input, invokes commands, and converts results to agent-friendly output.
