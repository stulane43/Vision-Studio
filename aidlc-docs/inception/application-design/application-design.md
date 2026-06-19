# Application Design — AI-DLC Studio

Consolidated design (components, methods, services, dependencies). Architectural style: **modular monolith** — a single deployable Next.js (App Router) + TypeScript app with clean internal layers and swappable adapters (AI provider, storage). This satisfies local-first/deploy-ready, pluggable provider, and abstracted persistence.

## Tech Stack (finalized)
- **Runtime/Framework**: Next.js 14 (App Router), React 18, TypeScript (Node server runtime for filesystem + AI calls).
- **Styling**: Tailwind CSS + a custom retro theme layer (CSS variables + component classes) matching the reference aesthetic.
- **AI**: `@anthropic-ai/sdk` (default provider); `MockProvider` for key-free/deterministic runs.
- **Validation**: Zod (SECURITY-05).
- **Testing**: Vitest + `fast-check` (partial PBT).
- **Markdown**: `react-markdown` + `remark-gfm` for artifact rendering.

## Components

### C1 — Retro UI Kit (`components/retro/`)
- **Responsibility**: Reusable retro-desktop primitives matching the reference images.
- **Interface (key components)**: `Window`, `TitleBar`, `Button`, `IconButton`, `DialogCard`, `QuestionCard`, `Stepper`, `DocumentWindow`, `ProgressBar`, `Taskbar`, `Field`, `Toast/ErrorDialog`.

### C2 — Workflow Engine (`lib/engine/`)  ← pure, PBT target
- **Responsibility**: Model the AI-DLC lifecycle as data + a deterministic state machine; compute the next action/stage; apply gate transitions. No I/O.
- **Interface**: `STAGES` (ordered stage definitions), `createRun(seed)`, `nextStage(run)`, `applyAnswers(run, stageId, answers)`, `applyArtifact(run, stageId, artifact)`, `approveStage(run, stageId)`, `requestChanges(run, stageId, feedback)`, `isComplete(run)`.

### C3 — AI Provider Layer (`lib/providers/`)
- **Responsibility**: Abstract the LLM behind one interface; implement Anthropic + Mock; select via settings.
- **Interface**: `AiProvider { id; runStage(input): Promise<StageResult>; generateFiles?(input): Promise<GeneratedFile[]> }`; `getProvider(settings)`.

### C4 — Storage Layer (`lib/storage/`)
- **Responsibility**: Abstract persistence; implement filesystem storage (projects on disk under a configurable root). Reserve interface for future cloud impl.
- **Interface**: `Storage { listProjects(); createProject(); getProject(id); saveProject(p); deleteProject(id); writeArtifact(id, path, content); readArtifact(id, path); appendAudit(id, entry); writeCodeFile(id, relPath, content); listCodeFiles(id) }`.

### C5 — AI-DLC Content & Adapters (`lib/aidlc/`)  ← parsing/serialization are PBT targets
- **Responsibility**: Bundle the methodology (stage prompt templates + embedded vision guide); build prompts from run context; parse model output into `StageResult`; serialize run ⇄ on-disk markdown/JSON.
- **Interface**: `buildStagePrompt(stage, run)`, `parseStageResult(raw)`, `serializeRun(run)`, `deserializeRun(raw)`, `VISION_GUIDE`.

### C6 — Project Service (`lib/services/`)
- **Responsibility**: Orchestrate use cases across engine + provider + storage; the transactional core.
- **Interface**: `createProjectFromIdea(input)`, `runCurrentStage(projectId)`, `submitAnswers(projectId, stageId, answers)`, `approveStage(projectId, stageId)`, `requestChanges(projectId, stageId, feedback)`, `saveArtifactEdit(projectId, stageId, content)`, `generateCode(projectId)`, `getProjectState(projectId)`.

### C7 — Security Kit (`lib/security/`)
- **Responsibility**: Cross-cutting security (SECURITY-04/05/09/12/15): zod schemas, safe path resolution (path-traversal guard), structured logger (no secrets/PII), error normalization (generic user-facing messages).
- **Interface**: `schemas`, `safeResolve(root, rel)`, `logger`, `toUserError(e)`.

### C8 — API Layer (`app/api/**`)
- **Responsibility**: Thin HTTP boundary (Route Handlers) validating input (zod), delegating to Project Service, returning typed JSON; sets security headers via `middleware.ts`.
- **Endpoints**: `POST/GET /api/projects`, `GET/DELETE /api/projects/[id]`, `POST /api/projects/[id]/vision`, `POST /api/projects/[id]/stage` (run/answers/approve/request-changes via action field), `POST /api/projects/[id]/code`, `GET/POST /api/settings`.

### C9 — App Views (`components/views/` + `app/**/page.tsx`)
- **Responsibility**: Compose the retro kit into screens and wire to the API.
- **Views**: `Desktop` (project list / new project), `ProjectWorkspace` (stepper + windows), `VisionView`, `WorkflowView` (stage cards + artifact), `ArtifactEditor`, `SettingsWindow`, `CodeBrowser`.

## Component Methods (signatures — business rules detailed in Functional Design)
- Engine: `nextStage(run: Run): Stage | null`; `applyAnswers(run, stageId, answers: Answer[]): Run`; `approveStage(run, stageId): Run`.
- Provider: `runStage(input: StageInput): Promise<StageResult>` where `StageResult = { kind: 'questions'; questions: Question[] } | { kind: 'artifact'; artifactMarkdown: string; summary: string }`.
- Service: `runCurrentStage(projectId): Promise<{ run: Run; result: StageResult }>`.
- Storage: `saveProject(p: Project): Promise<void>`; `writeArtifact(id, path, content): Promise<void>`.

## Services & Orchestration
- **ProjectService** is the orchestrator: validates (SecurityKit) → mutates `Run` (Engine) → calls `AiProvider` → persists (Storage) → appends audit. API handlers are thin; Views call the API.
- **Provider selection** is resolved per request from settings (key present → Anthropic; else Mock), keeping the app runnable without a key.

## Component Dependency Matrix
| Component | Depends on |
|---|---|
| C1 Retro Kit | — (presentational) |
| C2 Engine | — (pure) |
| C3 Providers | C5 (prompts/parse), C7 (logger) |
| C4 Storage | C7 (safe paths, logger) |
| C5 AI-DLC Content | C2 (types) |
| C6 Project Service | C2, C3, C4, C5, C7 |
| C7 Security Kit | — |
| C8 API Layer | C6, C7 |
| C9 Views | C1, C8 (via fetch) |

**Communication pattern**: Views → API (fetch/JSON, streaming where useful) → Project Service → {Engine (pure), Provider (async LLM), Storage (async fs)}. Data flows one direction; the `Run` aggregate is the single source of truth, persisted after every mutation.

## Key Design Decisions
- **Generic stage runner**: every AI-DLC stage flows through one runner (`runCurrentStage`) over data-defined `STAGES`. Build/test one path → all stages work. This is what makes "full AI-DLC" tractable.
- **Adapters at the edges**: provider + storage behind interfaces → pluggable AI and deploy-ready persistence with no core rewrite.
- **Pure core**: engine + parsing + serialization are side-effect-free → strong unit/property tests; security/error handling concentrated in C7/C8.
- **Untrusted-by-default**: user idea text and model output are treated as untrusted; code execution confined to the bounded build/test step (SECURITY-11).
