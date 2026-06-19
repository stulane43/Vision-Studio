# Units of Work — Multi-Type Vision Documents

> Light decomposition for implementation. Each unit lists files, scope, and story coverage. Per-unit Functional/NFR design is folded in here (autonomous, light depth).

## U1 — Domain & Document-Type Registry  *(foundation, pure)*
- **Files:** `lib/engine/types.ts` (add `DocumentType`, `DEFAULT_DOCUMENT_TYPE`, fields on `Project`/`Artifact`, bump `SCHEMA_VERSION`→2); `lib/aidlc/visionGuide.ts` (+`BUSINESS_BRIEF_GUIDE`, `PRESENTATION_BRIEF_GUIDE`); `lib/aidlc/documentTypes.ts` (new registry: defs + `getDocumentType` + ordered list).
- **Functional notes:** registry is the single source of per-type behavior; `getDocumentType(undefined|unknown)` → `dev-vision` (safe default). Pure, no I/O.
- **Stories:** underpins S-A1, S-B1..B3.
- **PBT target:** `getDocumentType` total + safe for arbitrary strings.

## U2 — Generation wiring  *(prompts + providers + runner)*
- **Files:** `lib/providers/provider.ts` (`StageInput.documentType`); `lib/aidlc/prompts.ts` (`buildSystemPrompt(mode, docTypeDef)`, guide/role selection, AI-Instructions/Prompt enforcement for non-dev); `lib/providers/anthropic.ts`, `openai.ts` (pass docType def); `lib/providers/mock.ts` (per-type questions + document); `lib/engine/stages.ts` + `lib/services/projectService.ts` (artifact path/title from registry; include `documentType` in `StageInput`; tag artifact).
- **Functional notes:** dev path must render byte-for-byte equivalent structure (no-regression). Mock must cover all 3 types.
- **Stories:** S-B1..B5.
- **PBT target:** per-type prompt selection picks the correct guide/role for every `DocumentType`.

## U3 — API, persistence & back-compat
- **Files:** `lib/security/validation.ts` (`createProjectSchema.documentType` enum; `feedback` action in `stageActionSchema`); `app/api/projects/route.ts` (accept + pass `documentType`); `lib/services/projectService.ts` (`createProjectFromIdea` signature; `recordFeedback`); `lib/aidlc/serialization.ts` (`projectSchema`/artifact schema `documentType` default + `feedback`); `lib/storage/fsStorage.ts` (`ProjectSummary.documentType`); `lib/client/api.ts` (types).
- **Functional notes:** deserialization defaults missing `documentType`→`dev-vision` and validates known values (SECURITY-13). API enum validation (SECURITY-05).
- **Stories:** S-C1, S-C3, S-C4 (storage side).
- **PBT target:** project serialize→deserialize round-trip preserves `documentType`; legacy JSON (no field) deserializes to `dev-vision`.

## U4 — UI & feedback
- **Files:** `components/views/NewProjectDialog.tsx` (type selector cards + examples + fallback hint + privacy note); `components/views/Desktop.tsx` (type pill on cards); `components/views/ProjectWorkspace.tsx` (header type label + post-approval feedback prompt); `components/retro/*` as needed (reuse Pill/Button/Field).
- **Functional notes:** default selection = Development Vision Document; selector must be keyboard-accessible (NFR-11). Feedback prompt appears only after approval, is dismissible, and posts the `feedback` action.
- **Stories:** S-A1, S-A2, S-A3, S-C2, S-C3.

## Build & Test (after all units)
- `tsc --noEmit` (0 errors) · `next build` · `vitest run` (existing + new PBT) · in-browser verify with Mock provider: create one project of each type, confirm distinct questions + distinct structured output (AI Instructions + Ready-to-Use AI Prompt present for non-dev), confirm Development Vision Document unchanged and an existing/legacy project still loads. Update `aidlc-docs/construction/build-and-test/`.

## Cross-cutting (Security Baseline, blocking)
- SECURITY-05 (enum validation at API), SECURITY-13 (validated-on-read + safe default), SECURITY-11 (prompts-only change). No change to auth, paths, secrets, headers, error handling.
