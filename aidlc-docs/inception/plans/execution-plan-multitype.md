# Workflow Execution Plan — Multi-Type Vision Documents

> INCEPTION · Workflow Planning. Brownfield feature; autonomous authorization (AI answers gate questions with documented defaults). Cycle-2 artifacts suffixed `-multitype`.

## Stage decisions

| Stage | Decision | Depth | Rationale |
|---|---|---|---|
| Workspace Detection | DONE | — | Brownfield confirmed. |
| Reverse Engineering | DONE | Standard | Current-state artifacts generated + approved. |
| Requirements Analysis | DONE | Standard/Comprehensive | Feature requirements + decisions recorded. |
| User Stories | DONE | Standard | New user-facing capability, multiple personas. |
| Workflow Planning | THIS | — | This document. |
| Application Design | EXECUTE | Light/Standard | New `documentType` model, type registry, prompt/guide parameterization, UI step — design needed. |
| Units Generation | EXECUTE | Light | Decompose into a few cohesive units. |
| Functional Design (per unit) | EXECUTE | Light | Type registry + per-type structures + back-compat folded into design notes. |
| NFR Requirements (per unit) | LIGHT | Light | Tech stack unchanged (same app); inherit NFRs. |
| NFR Design (per unit) | LIGHT | Light | Validation of new enum + data-integrity on read; no new surface. |
| Infrastructure Design | SKIP | — | No infrastructure change. |
| Code Generation (per unit) | EXECUTE | Full | The core deliverable. |
| Build and Test | EXECUTE | Full | typecheck + `next build` + Vitest (incl. PBT) + in-browser verify with Mock. |

## Unit sequence

```
U1 Domain + Type Registry  ─┬─▶ U2 Generation wiring ─┐
                            └─▶ U3 API/Persistence/  ─┼─▶ U4 UI + Feedback ─▶ Build & Test
                                   back-compat        ┘
```

**Text alternative:** U1 (domain types + document-type registry) is the foundation. U2 (prompts/providers/service generation wiring) and U3 (validation/API/serialization/back-compat/client types) both depend on U1 and can proceed together. U4 (new-project type selector, labels, feedback) depends on U2 + U3. Build & Test runs after all units.

## Risk-driven guardrails
- **No-regression (highest priority):** Development Vision Document keeps `vision-document.md` path and identical structure; existing projects default to `dev-vision` on read. Verified explicitly in Build & Test.
- **Key-free parity:** Mock provider updated for all 3 types so verification needs no API key.
- **Security:** `documentType` validated as an allow-list enum at API + deserialization (SECURITY-05/13).
- **PBT (Partial):** property tests for registry lookup, per-type prompt selection, and back-compat deserialization round-trips.
