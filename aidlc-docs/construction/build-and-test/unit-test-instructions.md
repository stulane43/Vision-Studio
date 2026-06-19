# Unit & Property Test Instructions — AI-DLC Studio

## Run
```bash
npm test                  # or: node node_modules/vitest/vitest.mjs run
```
Expected: **3 files, 14 tests passed.**

## What is covered
| File | Kind | Covers |
|---|---|---|
| `tests/machine.test.ts` | unit + property | Engine init; the question→answer→artifact→approve cycle; approval guard; request-changes. **Property:** any build/skip sequence completes the run; `doneCount` is monotonic and bounded by the stage count. |
| `tests/parsing.test.ts` | unit + property | **Property:** any `StageResult` round-trips through `JSON.stringify` → `parseStageResult`. Extraction from ```json fences, prose-prefixed output, and nested braces; invalid/malformed inputs rejected. |
| `tests/serialization.test.ts` | property | **Property:** any `Project` round-trips through `serializeProject`/`deserializeProject`; malformed JSON rejected (SECURITY-13). |

## Property-based testing scope (Q11 = Partial)
PBT (via `fast-check`) targets pure functions, the workflow state machine, the parser, and serialization
round-trips — the logic most prone to subtle bugs. UI components and the LLM-integration layer are verified
by the example tests above and the end-to-end run (see `integration-test-instructions.md`).

## Watch mode
```bash
node node_modules/vitest/vitest.mjs        # interactive watch
```
