# Application Design — Multi-Type Vision Documents

> Design delta over the current app (see `aidlc-docs/inception/reverse-engineering/`). Additive change built on the existing generic stage runner + Adapter seams. No architectural rewrite.

## Core idea
Introduce a first-class **document type** carried on each `Project` (and its `Artifact`), backed by a single **document-type registry** that supplies, per type: label, description, examples, the AI's system role, clarifying-question guidance, the output structure guide, and the artifact filename/title. The generic stage runner and providers consult this registry instead of hardcoding a single Vision Document.

## New / changed model (`lib/engine/types.ts`)
```ts
export type DocumentType = 'dev-vision' | 'business-brief' | 'presentation-brief';
export const DEFAULT_DOCUMENT_TYPE: DocumentType = 'dev-vision';

interface Project  { /* ...existing... */ documentType: DocumentType; }
interface Artifact { /* ...existing... */ documentType: DocumentType; }
// SCHEMA_VERSION bumped 1 -> 2; deserialization defaults missing documentType to 'dev-vision'.
```

## New module — document-type registry (`lib/aidlc/documentTypes.ts`)
```ts
export interface DocumentTypeDef {
  id: DocumentType;
  label: string;               // "Business / General AI Task Brief"
  shortDescription: string;    // plain-language one-liner
  examples: string[];          // 2–3 example use cases (selector)
  recommendedFallback?: boolean;// business-brief = true
  artifactFileName: string;    // dev-vision -> 'vision-document.md' (back-compat)
  artifactTitle: string;       // default H1/title hint
  systemRole: string;          // "You are an expert ... who writes excellent ..."
  questionGuidance: string;    // what to ask in 'questions' mode, per type
  structureGuide: string;      // required sections in 'artifact' mode (from visionGuide.ts)
  isDev: boolean;
}
export const DOCUMENT_TYPES: Record<DocumentType, DocumentTypeDef>;
export const DOCUMENT_TYPE_LIST: DocumentTypeDef[];   // ordered for the selector
export function getDocumentType(id: string | undefined): DocumentTypeDef; // defaults safely
```
Guide text lives in `lib/aidlc/visionGuide.ts`: keep `VISION_GUIDE` (dev) and add `BUSINESS_BRIEF_GUIDE`, `PRESENTATION_BRIEF_GUIDE`; the registry references them.

## Prompt parameterization (`lib/aidlc/prompts.ts`)
- `buildSystemPrompt(mode, docType: DocumentTypeDef)` — role + (questions: `docType.questionGuidance`; artifact: enforce `docType.structureGuide`, and for non-dev types require an **AI Instructions** + **Ready-to-Use AI Prompt** section).
- `buildUserPrompt(input, mode)` — unchanged context rendering; selects the guide via `getDocumentType(input.documentType)`.

## Provider layer (`lib/providers/*`)
- `StageInput` gains `documentType: DocumentType`.
- Anthropic/OpenAI: pass `getDocumentType(input.documentType)` into `buildSystemPrompt`. No transport change.
- **Mock:** branch on `documentType` to return type-appropriate questions and a type-appropriate document (incl. AI Instructions + Ready-to-Use AI Prompt for non-dev types) — preserves key-free parity.

## Stage runner + service (`lib/engine/stages.ts`, `lib/services/projectService.ts`)
- Stage stays single (`vision`), but artifact path/title come from the registry, not the static `STAGES` def:
  - `createProjectFromIdea(userId, { name, idea, isExisting, documentType })` → sets `project.documentType` (validated/defaulted).
  - When building `StageInput`, include `documentType`.
  - When persisting the artifact, use `getDocumentType(p.documentType).artifactFileName` and `.artifactTitle`; tag the `Artifact.documentType`.
- `ProjectSummary` gains `documentType` (so Desktop cards can label it).

## Validation & persistence (`lib/security/validation.ts`, `lib/aidlc/serialization.ts`)
- `createProjectSchema` adds `documentType: z.enum([...]).optional()` (defaulted to `dev-vision` server-side) — SECURITY-05.
- `projectSchema` + artifact schema add `documentType` with `.default('dev-vision')` for back-compat — SECURITY-13 (validated on read, never trusted blindly).
- Add `feedback?: { readyToUse: 'yes'|'minor'|'major'; at: string }` to `Project`/schema.

## Feedback + analytics (lightweight)
- New stage action `{ action: 'feedback'; rating: 'yes'|'minor'|'major' }` on the existing `/stage` endpoint → `projectService.recordFeedback()` stores `project.feedback` and appends an audit line. By-type analytics is derivable from `documentType` + lifecycle audit entries (no new service).

## UI (`components/views/*`)
- **NewProjectDialog:** add a type selector (retro radio cards) showing each type's label + description + 2–3 examples, default = Development Vision Document, with a "Not sure? Try Business / General AI Task Brief" hint and a one-line privacy note; pass `documentType` to `createProject`.
- **Desktop:** show a type pill on each project card.
- **ProjectWorkspace:** show the type label in the header; after approval, render the 3-option "ready to use with AI?" prompt and POST the `feedback` action.
- **client/api.ts:** `createProject` input + `StageActionInput` updated for `documentType` / `feedback`.

## Component dependency delta
```
documentTypes.ts (new, pure)  ◀── prompts.ts, providers/*, projectService.ts, validation/serialization, NewProjectDialog
visionGuide.ts (+2 guides)    ◀── documentTypes.ts
types.ts (+DocumentType)      ◀── (everything above)
```

## Key design decisions
- **Single registry, data-driven:** adding a future type = one registry entry + one guide constant + Mock branch; no engine/UI rewrite (NFR-MT-2).
- **Back-compat by defaulting:** missing `documentType` → `dev-vision`; dev artifact filename preserved → zero migration, no regression (NFR-MT-1).
- **Type changes prompts only:** no new execution/data surface; model output still rendered-not-executed (SECURITY-11).
