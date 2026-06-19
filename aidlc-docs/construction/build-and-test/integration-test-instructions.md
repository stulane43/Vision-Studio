# Integration / End-to-End Test Instructions — AI-DLC Studio

These steps verify the layers work together (UI → API → Project Service → engine + provider + storage).
They use the **Mock provider**, so no API key is required.

## Setup
```bash
npm run dev      # http://localhost:3000   (Mock provider is the default)
```

## Happy-path script
1. **Create** — Click **New Project**, enter a name and an idea (e.g. "a Pomodoro timer that blocks distracting sites"), choose *Starting fresh*, click **Create & Start**. → Workspace opens; the Vision stage auto-asks questions.
2. **Vision Q&A** — Answer each retro card (multiple choice; the last option is always *Other* with a free-text box). Click **Submit answers**. → A **Vision Document** renders as markdown.
3. **Gate** — Try **✏ Edit** (inline edit + Save), **🔧 Request changes** (AI revises), then **✅ Approve & continue**. → Advances to Requirements, which auto-runs.
4. **Through the lifecycle** — Repeat answer/approve for Requirements, User Stories, Workflow Planning, Application Design, Units. The stepper marks each stage ✓.
5. **Code Generation** — On this stage click **⚙ Generate starter code**. → Files appear in the in-app **code browser**; verify on disk under `projects/<id>/workspace/`.
6. **Build & Test** → **Approve**. → **🎉 Lifecycle Complete** with an artifact browser and the generated code.
7. **Persistence / resume** — Return to the desktop (**← Projects**); the project is listed. Reopen it → it resumes at the right place.

## Expected results
- Each stage produces a markdown artifact under `projects/<id>/aidlc-docs/…` mirroring the AI-DLC structure.
- `projects/<id>/aidlc-docs/audit.md` accumulates a timestamped entry per action.
- Generated code is written under `projects/<id>/workspace/`.
- Browser console shows **no errors**.

## API smoke (optional, without the UI)
```bash
# list projects
curl http://localhost:3000/api/projects
# create
curl -X POST http://localhost:3000/api/projects -H "content-type: application/json" \
  -d '{"name":"Demo","idea":"a habit tracker","isExisting":false}'
# run the current stage (returns questions or an artifact)
curl -X POST http://localhost:3000/api/projects/<id>/stage -H "content-type: application/json" \
  -d '{"action":"run"}'
```

## Performance note
No dedicated performance suite for the MVP (local single-user). Perceived latency is dominated by the
AI provider; the Mock provider responds instantly, and UI actions show a "Thinking…" state so the
interface never blocks.
