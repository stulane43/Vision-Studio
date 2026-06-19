# Requirements Clarification — 3 Quick Confirmations

You bounced two questions back to me (Q4 deployability/licensing, Q11 PBT) and chose full code-generation (Q2=C). I've answered the licensing/realism parts in chat. These three questions just confirm the resulting decisions so I can finalize the requirements document. My recommendation is marked **(Recommended)** — accept it with the letter, or override.

---

## Clarification 1 — Deployment & Storage Architecture (resolves Q4)
Yes, "deployable app + single-user local tool" is realistic and sellable (MIT-0 license — details in chat). The question is how much future-proofing to build into the MVP.

A) **(Recommended) Local-first, deploy-ready.** Ship as a single-user local web app with file-on-disk storage for MVP, but put storage + (no-op) auth behind clean interfaces so it can later become a hosted multi-user SaaS without a rewrite. Best of both: simple now, sellable either way later.
B) **Strictly local only.** Don't invest in any deploy/multi-user abstraction now; pure local tool.
C) **Multi-user from day one.** Build auth + cloud storage into the MVP now (bigger MVP, slower to first value).
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Clarification 2 — Code-Generation Scope Framing (confirms Q2=C)
You chose full AI-DLC including code generation. That's a great vision; I want us aligned on what it realistically means so the MVP is honest and achievable.

A) **(Recommended) Full code-gen via LLM orchestration, phased.** The app drives the LLM (Claude by default) through an agentic loop that writes a real, working *starter* codebase for the user's idea into a project workspace, with a build/test feedback loop. Delivered in phases: nail the Inception → Planning → Design experience first, then layer the code-gen execution stage. Expectation: it produces a working scaffold/MVP to review and iterate on ("AI executes, human decides"), not a guaranteed finished production app in one shot.
B) **Trim MVP to planning + design docs; add code-gen in a later phase.** Smaller, faster MVP; code generation deferred.
C) **Full autonomous code-gen, expecting finished production apps in one shot.** (Not realistic with today's models — not recommended.)
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Clarification 3 — Property-Based Testing (resolves Q11)
My recommendation, given you're generating code and may sell this:

A) **(Recommended) Partial.** Enforce PBT for pure functions, the workflow state machine, parsers, and serialization round-trips (markdown ⇄ structured data) — the logic where PBT genuinely catches bugs. Skip it for UI components and thin LLM-integration glue (hard to property-test, low payoff).
B) **Full.** Enforce PBT as a blocking constraint everywhere (heavier; slows MVP).
C) **None.** Skip PBT entirely (rely on example-based tests only).
X) Other (please describe after [Answer]: tag below)

[Answer]: A
