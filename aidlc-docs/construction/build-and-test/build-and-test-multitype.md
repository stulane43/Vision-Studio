# Build & Test — Multi-Type Vision Documents

> CONSTRUCTION · Build and Test. Results of building, testing, and verifying the feature.

## Commands run
| Step | Command | Result |
|---|---|---|
| Type check | `npm run typecheck` (`tsc --noEmit`) | ✅ 0 errors |
| Unit + property tests | `npm test` (`vitest run`) | ✅ 26 passed (4 files) — was 14; +12 for this feature |
| Production build | `npm run build` (`next build`) | ✅ Compiled successfully; lint + type validity passed; all routes built |

### Test breakdown
- `tests/machine.test.ts` — 6 (unchanged).
- `tests/parsing.test.ts` — 6 (unchanged).
- `tests/serialization.test.ts` — 4 (round-trip now covers `documentType`; +2 back-compat: legacy-missing and invalid → `dev-vision`).
- `tests/documentTypes.test.ts` — 10 (new): registry coverage, `getDocumentType` totality (PBT), invariants, dev-filename preservation, single fallback, per-type prompt selection, non-dev AI-Instructions/Ready-to-Use-AI-Prompt enforcement.

## In-browser verification (Mock provider, key-free, port 3100)
Signed up a fresh user; Engine = **Mock (no key)**. Zero console errors, zero server errors throughout.

- ✅ **Type selector**: three cards with descriptions + examples; Development Vision Document pre-selected (default); "Recommended if unsure" on Business brief; privacy note; dev-only greenfield/existing toggle (hidden for non-dev).
- ✅ **Business / General AI Task Brief**: type-specific questions (deliverable / audience / tone); generated brief contained **Objective, Do / Do Not, AI Instructions, Ready-to-Use AI Prompt**; "Generate AI Task Brief →" label; "Business Brief" pill on header + card.
- ✅ **Presentation / PowerPoint Brief**: type-specific questions (audience / desired action / deck length / output format); generated brief contained **Core Message, Slide-by-Slide Direction, Speaker Notes Guidance, AI Instructions, Ready-to-Use AI Prompt**.
- ✅ **Development Vision Document (no-regression)**: original questions (primary user / most important outcome / MVP size); generated doc contained **Executive Summary, MVP Scope, Risks and Dependencies, Open Questions** and **no** AI-Instructions/Ready-to-Use-AI-Prompt sections; "Generate Vision Document →" label; artifact path preserved as `vision-document.md`.
- ✅ **Post-approval feedback**: "Was this ready to use with AI?" (Yes / Minor edits / Major edits) appeared after Finalize; selecting one recorded it and showed the thank-you state (persisted to `project.readiness`).
- ✅ **Labeling / analytics**: type pill shown on Desktop cards and workspace header; document type + lifecycle events recorded in `project.json` + `audit.md`.

## Definition of Done (MVP) — status
- [x] Select a document type before generating
- [x] Development Vision Document available and unchanged
- [x] Three types with distinct questions and output sections
- [x] Non-dev docs include AI instructions + are human-readable
- [x] Deliverables/constraints/acceptance criteria per type
- [x] Type persisted, validated (back-compat default), and labeled
- [x] Lightweight feedback + by-type analytics recorded
- [x] No development-flow regression (verified)
- [x] Out-of-scope items not built

## Notes
- Verification created local runtime data (a test user + sample projects under `projects/` and `.aidlc/`). These are runtime data directories, not source; safe to delete.
- Dev server is started via `node node_modules/next/dist/bin/next dev -p 3100` (per `.claude/launch.json`) to avoid the documented Windows npm script-shell issue.
