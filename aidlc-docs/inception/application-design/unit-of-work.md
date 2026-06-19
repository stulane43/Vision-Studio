# Units of Work — AI-DLC Studio

**Deployment model**: single deployable modular monolith (Next.js). Units are **logical build modules** within the one app (not separate services). Code organization strategy below.

## Code Organization (Greenfield)
```
ai-dlc/                      (workspace root = the app)
├── app/                     # Next.js App Router (pages + api route handlers)
│   ├── api/                 # C8 API layer
│   ├── project/[id]/        # project workspace route
│   ├── layout.tsx, page.tsx, globals.css
├── components/
│   ├── retro/               # C1 retro UI kit
│   └── views/               # C9 composed views
├── lib/
│   ├── engine/              # C2 workflow engine (pure)
│   ├── providers/           # C3 AI providers (anthropic, mock)
│   ├── storage/             # C4 storage (fs)
│   ├── aidlc/               # C5 content/prompts/parsing/serialization
│   ├── services/            # C6 project service
│   └── security/            # C7 security kit
├── content/aidlc/           # bundled methodology assets (vision guide, stage specs)
├── tests/                   # vitest + fast-check
├── projects/                # runtime: user projects persisted here (gitignored)
├── middleware.ts            # security headers / CSP
├── next.config.js, tailwind.config.ts, tsconfig.json, vitest.config.ts
├── package.json, .env.example, README.md
```
(The existing `aidlc-docs/`, `.aidlc-rule-details/`, `vision-document-guide.md`, `image-references-UI/` remain at root; the app coexists with them.)

## Units

### U1 — Foundation & Retro UI Kit
- **Scope**: Project scaffold (Next.js, TS, Tailwind), retro theme (globals.css + theme tokens), `middleware.ts` security headers, base config, the C1 retro components.
- **Delivers**: A themed, runnable shell with reusable retro primitives.
- **Stories**: US-16, US-17 (UI/error shell).

### U2 — Domain Model, Workflow Engine & Storage
- **Scope**: C2 engine (types, STAGES, state machine), C5 parsing/serialization, C4 fs storage, C7 security kit (paths/logger/schemas).
- **Delivers**: The pure, tested core + persistence.
- **Stories**: US-15 (persistence), foundation for all stage stories.

### U3 — AI Provider Layer & Methodology Content
- **Scope**: C3 `AiProvider` interface, `AnthropicProvider`, `MockProvider`, provider factory; C5 prompt builders + embedded vision guide + stage specs.
- **Delivers**: Key-free Mock runs + real Claude integration; faithful prompts.
- **Stories**: US-13 (provider config), engine of US-2/3/7/8.

### U4 — Project Service & API Layer
- **Scope**: C6 ProjectService use cases; C8 route handlers with zod validation; audit logging.
- **Delivers**: The orchestrated backend the UI calls.
- **Stories**: US-1, US-5, US-11, US-12, US-15.

### U5 — App Views & Integration
- **Scope**: C9 views (Desktop, ProjectWorkspace, VisionView, WorkflowView with QuestionCards, ArtifactEditor, SettingsWindow, Stepper) wired to the API.
- **Delivers**: The full interactive core loop end-to-end.
- **Stories**: US-1..US-9, US-11..US-14, US-16.

### U6 — Code Generation Stage (phased / frontier)
- **Scope**: C3 `generateFiles` + C6 `generateCode`; provider-driven file writing into `projects/<id>/workspace/`; bounded build/test feedback loop; CodeBrowser view + export.
- **Delivers**: Starter-codebase generation for the user's idea.
- **Stories**: US-10, US-14 (export).

### U7 — Tests, Build & Verification
- **Scope**: Example tests across layers; **partial PBT** for engine transitions, parsing, serialization round-trips; build/test instructions; run & verify with Mock provider.
- **Delivers**: Confidence + reproducible build/test.
- **Stories**: AC verification for all.

## Build Order (critical path)
U1 → U2 → U3 → U4 → U5 → U6, with U7 woven throughout (tests added as each unit lands; final pass at the end).
