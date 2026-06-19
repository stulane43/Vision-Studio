# Code Quality Assessment — Vision Studio

## Test Coverage
- **Overall:** Fair — strong where it matters (the pure core), thin elsewhere (UI, route handlers, providers).
- **Unit tests:** Present for `lib/aidlc/parsing.ts`, `lib/aidlc/serialization.ts`, and `lib/engine/machine.ts`.
- **Property-based tests (fast-check):** JSON/markdown parsing round-trips, project serialize↔deserialize, and state-machine invariants (earlier stages done/skipped, current stage active/awaiting/review, later stages locked).
- **Integration / E2E:** None automated. (v1 was verified manually in-browser with the Mock provider.)
- **Provider / route / auth tests:** None — network and HTTP boundaries are untested by automation.

## Code Quality Indicators
- **Linting:** `next lint` (ESLint via Next.js presets); no custom ESLint config committed.
- **Type safety:** TypeScript strict mode, `noEmit`, `isolatedModules`; `typecheck` script available.
- **Code style:** Consistent — clear layer boundaries, small focused modules, descriptive names, immutable engine transitions.
- **Documentation:** Good in-code section headers; the external v1 design docs are partly stale (see discrepancies below).

## Technical Debt
- **Single-stage hardcoding:** `StageId='vision'` and `PhaseId='inception'` are baked into types, `STAGES`, prompts, and the vision guide. Multi-type/multi-stage work must generalize these seams.
- **Single global Vision Guide:** `VISION_GUIDE` is one constant; per-type guides require a map/registry.
- **Prompts not parameterized by type:** `buildSystemPrompt`/`buildUserPrompt` assume one document kind.
- **Unused capability:** `machine.resetFrom` exists but has no UI affordance.
- **No list filter/search:** project list assumes small per-user counts.
- **Revision-comment UX complexity:** anchored highlight-and-comment is powerful but the selection-tracking UI is intricate and untested.
- **No automated tests at the I/O edges:** providers, routes, auth rely on manual verification.

## Patterns and Anti-Patterns

### Good patterns
- Pure core (engine + parsing + serialization) → deterministic and property-testable.
- Adapter/Strategy for providers and storage → pluggable, deploy-ready.
- Thin route handlers; validation at every untrusted boundary (Zod).
- Defense-in-depth security kit: `safeJoin`/`safeId`/`safeRelPath` (path-traversal), `AppError`→`toUserError` (no internal leakage), structured logger with secret redaction.
- Timing-safe password comparison; opaque server-side sessions; per-user filesystem isolation.
- Untrusted-by-default handling of idea text and model output (treated as data, not instructions).

### Anti-patterns / watch-items
- Hardcoded singular stage/type (debt above) — the main thing the new feature must refactor cleanly.
- Persisted JSON as the data store — fine for local single-/few-user use; concurrency and scale are not addressed (acceptable per current scope).

## Discrepancies vs. v1 Design Docs (authoritative = current code)
- **Full AI-DLC lifecycle:** v1 `requirements.md`/`application-design.md` describe driving all AI-DLC stages and code generation; the **shipped app implements only the `vision` stage** (idea → Vision Document). No code-generation, build/test, or multi-stage orchestration exists in the running app.
- **Auth:** v1 docs say "single-user, no login"; the **current app is multi-user** with signup/login/sessions and per-user data isolation.
- **Providers:** v1 wired Anthropic + Mock; the current app also includes an **OpenAI** provider.
- **Styling:** v1 docs mention Tailwind; the current app uses **hand-written CSS** (`app/globals.css`), no Tailwind.
- **Endpoints:** v1 listed a `/vision` and `/code` endpoint; current routing uses a unified **`/stage` (+ `/stage/stream`)** action endpoint and has **`/settings`** + **`/auth/*`**.

> These discrepancies are exactly why this brownfield cycle ran Reverse Engineering: the RE artifacts here — not the v1 docs — are the current-state source of truth for planning the Multi-Type feature.
