# Vision Studio

Turn an idea into a polished **Vision Document** — executive summary, business context, full-scope vision, MVP scope, risks, and open questions — in a friendly **modern-retro** UI.

Describe your idea → the AI asks a few clarifying questions → it writes the Vision Document (streamed live) → you edit, refine, and download. That's the whole app.

Local-first, single-user, and **runs with no API key** thanks to a built-in Mock provider. Add an Anthropic key for real, idea-specific generation.

---

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000
```

> Default **Mock** provider needs no key. For real generation: open **⚙ Settings**, choose **Claude**, paste an Anthropic API key (saved to a local, gitignored file), and **Save & test**. Or set `ANTHROPIC_API_KEY` + `AIDLC_PROVIDER=anthropic` in `.env.local`.

### ⚠ Windows note
This machine's global npm `script-shell` is `/bin/bash`, which doesn't exist on native Windows, so `npm` scripts fail with `spawn /bin/bash ENOENT`. Fix once with `npm config set script-shell powershell.exe`, or run tools directly:
```powershell
$env:npm_config_script_shell="cmd.exe"; npm install
node node_modules/next/dist/bin/next dev
node node_modules/typescript/bin/tsc --noEmit
node node_modules/vitest/vitest.mjs run
```

## What it does

1. **Describe an idea** — name it and write a sentence or a paragraph.
2. **Answer a few questions** — the AI asks 3-5 idea-specific clarifying questions as retro cards.
3. **Get your Vision Document** — it writes the document (streamed token-by-token). You can **edit** it inline, **request changes** (AI rewrites), **finalize**, and **download** it as Markdown.

Each project is a folder on disk (`projects/<id>/`) with `project.json` and the readable `vision-document.md`.

## Architecture

```
app/                  Next.js App Router — pages + API route handlers
components/retro/      retro UI kit (Window, Button, QuestionCard, Markdown…)
components/views/      Desktop, ProjectWorkspace, dialogs
lib/
  engine/             pure domain model + state machine (vision stage)   ← unit + property tested
  providers/          AiProvider interface + Anthropic (streaming) + Mock
  storage/            Storage interface + filesystem implementation
  aidlc/              vision-guide, prompts, parsing, serialization       ← property tested
  services/           Project Service (orchestrator) + settings
  security/           zod schemas, safe paths, redacting logger, errors
```

**Stack:** Next.js 14 (App Router) · React 18 · TypeScript · hand-written retro CSS · Zod · Vitest + fast-check. The Anthropic Messages API is called directly via `fetch` (streaming), no SDK dependency.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server (http://localhost:3000) |
| `npm run build` / `npm start` | Production build / run |
| `npm test` | Test suite (Vitest + property-based) |
| `npm run typecheck` | `tsc --noEmit` |
