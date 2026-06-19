# Build Instructions — AI-DLC Studio

## Prerequisites
- Node.js ≥ 18 (verified on v22.15.0) and npm (verified on 11.4.2).

## Install
```bash
npm install
```
**Windows gotcha:** if npm's global `script-shell` is set to `/bin/bash` (it is on the original dev
machine), native dependency install scripts fail with `spawn /bin/bash ENOENT`. Either fix it once with
`npm config set script-shell powershell.exe`, or install with an override:
```powershell
$env:npm_config_script_shell="cmd.exe"; npm install
```

## Typecheck
```bash
npm run typecheck        # or: node node_modules/typescript/bin/tsc --noEmit
```
Expected: `0 errors`.

## Production build
```bash
npm run build            # or: node node_modules/next/dist/bin/next build
```
Expected: `✓ Compiled successfully` and a route table (2 pages + 6 API routes).

## Run
```bash
npm run dev              # dev,  http://localhost:3000  (or: node node_modules/next/dist/bin/next dev)
npm start                # production (after build)
```

## Configuration
- `AIDLC_PROVIDER` = `mock` (default) or `anthropic`
- `ANTHROPIC_API_KEY` = your key (only for `anthropic`)
- `AIDLC_MODEL` = e.g. `claude-sonnet-4-6` (default) or `claude-opus-4-8`
- `AIDLC_PROJECTS_DIR` = where projects persist (default `projects`)
