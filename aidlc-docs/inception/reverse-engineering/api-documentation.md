# API Documentation — Vision Studio

All routes are Next.js Route Handlers under `app/api/**`. Unless noted public, every handler calls `requireUser()` and operates only within the caller's user scope. Inputs are validated with Zod (`lib/security/validation.ts`); errors are normalized to generic messages via `toUserError()`. `middleware.ts` blocks unauthenticated access (401 for `/api/*`, redirect for pages) except for `/login` and `/api/auth/*`.

## REST APIs

### Auth

| Method | Path | Purpose | Request | Response |
|---|---|---|---|---|
| POST | `/api/auth/signup` | Create account + start session | `{ username, password }` | `{ id, username }` + `vs_session` cookie |
| POST | `/api/auth/login` | Sign in (rate-limited, ~5 attempts/min) | `{ username, password }` | `{ id, username }` + cookie |
| POST | `/api/auth/logout` | Invalidate session | — | `{ ok: true }` (clears cookie) |
| GET | `/api/auth/me` | Current user | — | `{ user: { id, username } \| null }` |

### Projects

| Method | Path | Purpose | Request | Response |
|---|---|---|---|---|
| GET | `/api/projects` | List the user's projects | — | `ProjectSummary[]` (sorted by `updatedAt` desc) |
| POST | `/api/projects` | Create project from idea | `{ name, idea, isExisting }` | `Project` |
| GET | `/api/projects/[id]` | Load full project | — | `Project` |
| DELETE | `/api/projects/[id]` | Delete project folder | — | `{ deleted: true }` |

### Stage actions

| Method | Path | Purpose | Response |
|---|---|---|---|
| POST | `/api/projects/[id]/stage` | Perform a stage action (non-streaming) | `Project` |
| POST | `/api/projects/[id]/stage/stream` | Same actions with token streaming | NDJSON stream |

**Stage action body (discriminated union, `lib/security/validation.ts` `stageActionSchema`):**
```ts
type StageAction =
  | { action: 'run' }
  | { action: 'answers';         stageId: 'vision'; answers: Answer[] }
  | { action: 'more-questions';  stageId: 'vision'; answers: Answer[] }
  | { action: 'approve';         stageId: 'vision' }
  | { action: 'request-changes'; stageId: 'vision'; feedback: string }
  | { action: 'edit';            stageId: 'vision'; markdown: string }
  | { action: 'revise';          stageId: 'vision'; comments: { quote: string; note: string }[]; instruction: string };
```

**Streaming response (NDJSON, one JSON object per line):**
```
{"type":"delta","text":"..."}
{"type":"delta","text":"..."}
{"type":"done","project":{ ...Project }}
// or, on failure:
{"type":"error","error":"<generic message>"}
```

### Settings

| Method | Path | Purpose | Request | Response |
|---|---|---|---|---|
| GET | `/api/settings` | Read public settings | — | `{ provider, model, hasAnthropicKey, hasOpenaiKey, ready }` |
| POST | `/api/settings` | Update provider/model/key | `{ provider, model?, apiKey? }` | `PublicSettings` |
| POST | `/api/settings/test` | Test provider connectivity | `{ provider?, model?, apiKey? }` | `{ ok, provider, model }` |

> **Note:** API keys are never returned to the client — only boolean `hasAnthropicKey` / `hasOpenaiKey` presence flags (SECURITY-12).

## Internal APIs (service layer — `lib/services/projectService.ts`)

| Method | Signature (summary) | Notes |
|---|---|---|
| `createProjectFromIdea` | `(userId, { name, idea, isExisting }) → Promise<Project>` | seeds `vision` stage active |
| `loadProject` | `(userId, id) → Promise<Project>` | Zod-validated on read |
| `listProjects` | `(userId) → Promise<ProjectSummary[]>` | |
| `runCurrentStage` | `(userId, id) → Promise<Project>` | non-streaming run |
| `runStageStreaming` | `(userId, id, action, onText) → Promise<Project>` | streams deltas |
| `submitAnswers` | `(userId, id, stageId, answers) → Promise<Project>` | then auto-generates artifact |
| `requestMoreQuestions` | `(userId, id, stageId, answers) → Promise<Project>` | appends deeper questions |
| `approveStage` | `(userId, id, stageId) → Promise<Project>` | marks `done` |
| `requestStageChanges` | `(userId, id, stageId, feedback) → Promise<Project>` | regenerates |
| `editArtifact` | `(userId, id, stageId, markdown) → Promise<Project>` | version++ |
| `deleteProject` | `(userId, id) → Promise<void>` | |

**Provider interface (`lib/providers/provider.ts`):**
```ts
type StageMode = 'questions' | 'artifact';
interface AiProvider {
  id: 'anthropic' | 'openai' | 'codex' | 'mock';
  runStage(input: StageInput, mode: StageMode): Promise<StageResult>;
  runStageStream(input: StageInput, mode: StageMode, onText: (t: string) => void): Promise<StageResult>;
  testConnection(): Promise<void>;
}
```

## Data Models

### Project (`lib/engine/types.ts`)
- **Fields:** `id`, `name`, `idea` (≤8000 chars), `isExisting`, `createdAt`, `updatedAt`, `run: Run`, `artifacts: Artifact[]`, `schemaVersion`.
- **Relationships:** owns one `Run` and N `Artifact`s; owned by a user (via storage path).
- **Validation:** `projectSchema` (Zod) on deserialize; rejects unknown stage IDs / unsafe artifact paths.

### Run / StageState
- **Run:** `currentStageId: StageId | null`, `stages: StageState[]`.
- **StageState:** `id`, `status` (`locked|active|generating|awaiting-answers|awaiting-review|done|skipped`), `questions: Question[]`, `answers: Answer[]`, `artifactPath?`, `summary?`, `feedback: string[]`, `skipReason?`.

### Question / Answer
- **Question:** `id`, `text`, `options: QuestionOption[]` (2–8; last is `isOther`), `multi?`.
- **Answer:** `questionId`, `selectedKeys: string[]` (1–20), `otherText?` (≤4000).

### Artifact
- **Fields:** `stageId`, `path` (e.g. `vision-document.md`), `title`, `markdown` (≤~200KB), `version`, `updatedAt`, `editedByUser?`.

### StageResult (provider output)
```ts
type StageResult =
  | { kind: 'questions'; questions: Question[] }
  | { kind: 'artifact'; title: string; markdown: string; summary: string };
```

> **Feature-relevant gap:** there is currently **no `documentType`** field on `Project`/`Artifact`, and the stage/prompt/guide are single-typed. The multi-type feature introduces this concept (see `code-structure.md` and the integration map in the RE summary).
