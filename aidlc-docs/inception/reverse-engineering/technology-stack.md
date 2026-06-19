# Technology Stack — Vision Studio

## Programming Languages
- **TypeScript 5.5.4** — entire codebase (strict mode), `.ts` (server/shared) and `.tsx` (React components).
- **CSS** — hand-written retro theme in `app/globals.css` (CSS variables + utility/component classes). **No Tailwind / CSS framework.**

## Frameworks & Core Libraries
| Library | Version | Purpose |
|---|---|---|
| next | ^14.2.33 | App Router, Route Handlers (API), middleware, standalone build |
| react / react-dom | 18.3.1 | UI rendering |
| zod | 3.23.8 | Schema validation for all untrusted inputs + persisted data |
| react-markdown | 9.0.1 | Render artifact markdown |
| remark-gfm | 4.0.0 | GitHub-flavored markdown (tables, checklists) |

## Runtime / Platform
- **Node.js** (server runtime; uses `node:crypto`, `node:fs/promises`, `node:path`). Node 18+ assumed.
- **AI providers (external):** Anthropic Messages API and OpenAI Chat Completions, both via streaming SSE. Mock provider for key-free/offline runs.
- **Persistence:** local filesystem (JSON + markdown). No database.

## Build Tools
| Tool | Version | Purpose |
|---|---|---|
| Next.js CLI | ^14.2.33 | `next dev` / `next build` / `next start` / `next lint` |
| TypeScript (tsc) | 5.5.4 | `typecheck` (`tsc --noEmit`) |
| npm | — | package + script runner; lockfile pins versions |

## Testing Tools
| Tool | Version | Purpose |
|---|---|---|
| vitest | 2.0.5 | Unit test runner (`vitest run`) |
| fast-check | 3.20.0 | Property-based testing (parsing, serialization, state machine) |

## Type Definitions (dev)
- `@types/node 20.14.11`, `@types/react 18.3.3`, `@types/react-dom 18.3.0`.

## Security-Relevant Configuration
- **CSP & security headers** — set in `next.config.js` for HTML responses.
- **Auth** — scrypt password hashing (`node:crypto`), opaque random session tokens, httpOnly cookies (`Secure` when `AIDLC_HTTPS=true`).
- **Secrets** — provider API keys read from per-user settings/env; never returned to the client, never logged.
- **Env knobs** — `AIDLC_DATA_DIR`, `AIDLC_PROJECTS_DIR`, `AIDLC_PROVIDER`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `AIDLC_HTTPS`.
