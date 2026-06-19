# Component Inventory — Vision Studio

This is a single-package application (one `package.json`). "Components" below are logical modules within that package, not separate build packages.

## Application Modules (logical components)
- **Retro UI Kit** (`components/retro/`) — presentational primitives (Window, Button, Dialog, QuestionCard, Markdown, Shell, ui).
- **Views** (`components/views/`, `app/**/page.tsx`) — AuthView, Desktop, NewProjectDialog, ProjectWorkspace, SettingsDialog + the three pages (home, login, project).
- **Client API** (`lib/client/api.ts`) — typed browser→server client incl. NDJSON streaming.
- **API Layer / Route Handlers** (`app/api/**`) — auth, projects, stage (+ stream), settings (+ test).
- **Middleware** (`middleware.ts`) — session gate.
- **Project Service** (`lib/services/projectService.ts`) — transactional orchestration core.
- **Settings Service** (`lib/services/settings.ts`) — per-user provider configuration.
- **Workflow Engine** (`lib/engine/`) — pure state machine + stage definitions + domain types.
- **AI-DLC Content** (`lib/aidlc/`) — prompts, vision guide, parsing, serialization.
- **Provider Layer** (`lib/providers/`) — Anthropic, OpenAI, Mock + selection.
- **Auth** (`lib/auth/`) — users, sessions, current-user/cookies.
- **Security Kit** (`lib/security/`) — validation, safe paths, errors, logger.
- **Config** (`lib/config/paths.ts`) — data/projects directory resolution.
- **API helpers** (`lib/api/respond.ts`) — JSON response wrappers.

## Adapter Components (swappable)
- **AiProvider implementations** — `AnthropicProvider`, `OpenAiProvider`, `MockProvider` (interface in `lib/providers/provider.ts`).
- **Storage implementation** — `FsStorage` (interface in `lib/storage/storage.ts`).

## Infrastructure Packages
- **None.** No CDK / Terraform / CloudFormation / Serverless. Deployment uses Next.js `output: 'standalone'` (a self-contained Node server). Data paths configurable via env (`AIDLC_DATA_DIR`, `AIDLC_PROJECTS_DIR`).

## Shared / Utility Packages
- **None external.** Shared logic lives in `lib/` (engine, aidlc, security, config) within the single package.

## Test Packages
- **`tests/`** (Vitest + fast-check): `parsing.test.ts`, `serialization.test.ts`, `machine.test.ts` — unit + property-based tests over the pure core.

## Persistence Stores (filesystem)
- `<DATA_DIR>/.aidlc/users.json`, `.aidlc/sessions.json`, `.aidlc/settings/<userId>.json`
- `<PROJECTS_DIR>/<userId>/<projectId>/{project.json, vision-document.md, audit.md}`

## Counts
- **Total build packages:** 1 (monorepo-free single Next.js app)
- **Logical application modules:** ~14
- **Adapters:** 4 (3 providers + 1 storage; interfaces for both)
- **Infrastructure packages:** 0
- **External shared packages:** 0
- **Test files:** 3
