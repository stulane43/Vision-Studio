# Code Generation Summary — Multi-Type Vision Documents

> CONSTRUCTION · Code Generation (autonomous). Application code lives at the workspace root; this file is a documentation summary only. Implements `unit-of-work-multitype.md`.

## What was built (by unit)

### U1 — Domain & Document-Type Registry
- `lib/engine/types.ts` — added `DocumentType` (`'dev-vision' | 'business-brief' | 'presentation-brief'`), `DOCUMENT_TYPES`, `DEFAULT_DOCUMENT_TYPE`, `Readiness`; added `documentType` to `Project` and `Artifact`, optional `readiness` to `Project`; bumped `SCHEMA_VERSION` 1 → 2.
- `lib/aidlc/visionGuide.ts` — added `BUSINESS_BRIEF_GUIDE` and `PRESENTATION_BRIEF_GUIDE` (kept `VISION_GUIDE` unchanged).
- `lib/aidlc/documentTypes.ts` (new) — the registry: per-type `label`, `chipLabel`, `shortDescription`, `examples`, `recommendedFallback`, `artifactFileName`, `artifactTitle`, `systemRole`, `questionGuidance`, `structureGuide`, `isDev`; `DOCUMENT_TYPE_LIST`; total `getDocumentType()` (unknown/missing → default).

### U2 — Generation wiring
- `lib/providers/provider.ts` — `StageInput.documentType`.
- `lib/aidlc/prompts.ts` — `buildSystemPrompt(input, mode)` and `buildUserPrompt(input, mode)` resolve the registry; role + question guidance + structure guide are per-type; non-dev artifact prompts require the **AI Instructions** + **Ready-to-Use AI Prompt** sections.
- `lib/providers/anthropic.ts`, `openai.ts` — pass `input` into `buildSystemPrompt`.
- `lib/providers/mock.ts` — per-type clarifying questions (dev / business / presentation) and per-type documents incl. AI-Instructions/Ready-to-Use-AI-Prompt for non-dev (key-free parity).
- `lib/services/projectService.ts` — `createProjectFromIdea` accepts `documentType` (defaulted); `StageInput` carries `documentType`; artifact `path`/`title` come from the registry; artifact tagged with `documentType`; added `recordFeedback()`.

### U3 — API, persistence & back-compat
- `lib/security/validation.ts` — `createProjectSchema.documentType` allow-list enum (SECURITY-05); `feedback` action in `stageActionSchema`.
- `lib/aidlc/serialization.ts` — `documentType` on project + artifact schemas defaulted via `.catch(DEFAULT_DOCUMENT_TYPE)` (missing OR invalid → safe default, SECURITY-13); `readiness` optional.
- `lib/storage/storage.ts`, `fsStorage.ts` — `ProjectSummary.documentType`.
- `app/api/projects/[id]/stage/route.ts` — `feedback` action → `recordFeedback`.
- `lib/client/api.ts` — `createProject` input + `StageActionInput` updated.
- `app/api/projects/route.ts` — unchanged (already passes the validated body through).

### U4 — UI & feedback
- `components/views/NewProjectDialog.tsx` — type selector cards (label + description + examples + "Recommended if unsure"), default Development Vision Document, dev-only greenfield/existing toggle, privacy note; passes `documentType`.
- `components/views/Desktop.tsx` — type pill on cards; multi-type intro/button/title copy.
- `components/views/ProjectWorkspace.tsx` — type label in header + pill; type-aware question/generation labels and download filename; post-approval "ready to use with AI?" feedback prompt → `feedback` action; thank-you state.

### Tests
- `tests/documentTypes.test.ts` (new) — registry coverage/totality/invariants + per-type prompt selection (incl. non-dev AI-Instructions/Ready-to-Use-AI-Prompt enforcement).
- `tests/serialization.test.ts` — arbitraries include `documentType`; added back-compat tests (legacy-missing and invalid → `dev-vision`).

## Security (Baseline, blocking) — compliance
- **SECURITY-05** input validation: `documentType` enum at the API; **SECURITY-13** validated-on-read with safe default; **SECURITY-11** prompts-only change (no new execution/data surface). Auth, safe paths, secrets, headers, error handling: unchanged. No blocking findings.
