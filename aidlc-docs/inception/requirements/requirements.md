# Requirements — AI‑DLC Studio (working title)

> **Document status:** Requirements Analysis (Comprehensive depth) — INCEPTION Phase
> **Project type:** Greenfield · Single‑user local‑first, deploy‑ready web application
> **Prepared by:** AI‑DLC workflow, role: Product Owner

---

## 1. Intent Analysis

| Attribute | Finding |
|---|---|
| **User request (summary)** | Build an application that takes a person's idea as a prompt (new or part of an existing project) and **automatically produces a Vision Document** from it — asking clarifying questions when needed — then provides a **UI to launch the AI‑DLC workflow** from that vision and **walk through the AI‑DLC stages**, presenting each stage's questions in the UI to answer and continuing through to artifacts (and ultimately generated code). The UI must be friendly and styled as a **modern‑retro / Y2K desktop aesthetic** like the supplied reference images. |
| **Request type** | New Project (Greenfield) |
| **Scope estimate** | System‑wide — a complete new product (front end + orchestration back end + AI provider integration + workflow engine + code‑gen execution) |
| **Complexity estimate** | Complex |
| **Requirements depth** | Comprehensive |
| **Primary differentiator** | Productizes the AWS AI‑DLC methodology end‑to‑end with a delightful retro UX; turns a one‑line idea into a vision, a plan, designs, and a working starter codebase, with the human approving at every gate. |

**Meta‑note (dogfooding):** This product *is built using AI‑DLC* and *runs AI‑DLC for its users*. The AI‑DLC rule set (the `.aidlc-rule-details/` workflow rules) and `vision-document-guide.md` are the canonical "knowledge" that drives the in‑app workflow; the application bundles and faithfully executes this rule set as its orchestration engine.

---

## 2. Confirmed Decisions (from Requirements Q&A)

| # | Decision area | Choice | Implication |
|---|---|---|---|
| Q1 | **AI engine** | Pluggable provider, **Claude (Anthropic) by default** | Provider behind an interface; OpenAI/local swappable via config. Default to latest Claude models (Opus 4.8 / Sonnet 4.6 / Haiku 4.5). |
| Q2 / C2 | **Run scope** | **Full AI‑DLC incl. code generation**, via LLM orchestration, **phased** | MVP nails Inception→Planning→Design first; code‑gen execution stage layered next. Output = working *starter* codebase to iterate on. |
| Q3 / C1 | **Persistence** | **Single‑user, file‑on‑disk, no login** | Projects stored as files on the user's disk; storage + auth behind interfaces for future SaaS. |
| Q4 / C1 | **Platform** | **Local‑first, deploy‑ready** web app | Runs locally in browser; same codebase deployable later by swapping storage/auth implementations. |
| Q5 | **Tech stack** | **AI to decide** → recommending **Next.js (App Router) + TypeScript** | Single deployable full‑stack TS app; Node runtime for filesystem + agentic code‑gen; easy local run and later cloud deploy. (Finalized in NFR/Tech‑stack stage.) |
| Q6 | **Vision clarifying behavior** | **Interactive‑first** | AI asks a short batch of clarifying questions before writing the Vision Document. |
| Q7 | **Stage‑question UX** | **Retro dialog cards / wizard** | Each stage's questions render as retro window cards (multiple‑choice + free text), answered in‑app, then "Continue." |
| Q8 | **Artifact control** | **Full inline editing** + approve / request‑changes | User can edit any generated document directly and approve or ask the AI to revise. |
| Q9 | **Retro UI intensity** | **Hybrid** | Retro window chrome frames a clean modern stepper/wizard; artifacts shown in retro "document windows." |
| Q10 | **Security extension** | **Enabled (blocking)** | SECURITY‑01..15 enforced as blocking constraints across stages (see §6). |
| Q11 / C3 | **Property‑based testing** | **Partial** | PBT for pure functions, the workflow state machine, parsers, and serialization round‑trips; example‑based tests elsewhere. |

---

## 3. Product Overview

AI‑DLC Studio is a local‑first web application that turns an idea into shipped artifacts by guiding the user through the AI‑DLC lifecycle with an AI co‑pilot, all inside a friendly retro‑desktop UI.

**End‑to‑end happy path:**
1. User enters an idea (free text), optionally noting it's part of an existing project.
2. The AI asks a short, focused batch of **clarifying questions** (retro dialog cards).
3. The AI generates a **Vision Document** (structured per `vision-document-guide.md`); the user can **edit inline** and **approve**.
4. The user **launches the AI‑DLC workflow** from the approved vision.
5. The app **adaptively drives the AI‑DLC stages** (Requirements → User Stories → Workflow Planning → Application Design → Units → per‑unit Construction design → Code Generation → Build & Test), presenting each stage's questions as **in‑UI cards** and producing **markdown artifacts** shown in retro document windows.
6. At each stage **approval gate**, the user reviews, edits, and chooses **Approve & Continue** or **Request Changes** (AI revises).
7. The Construction phase drives an **LLM agent loop** that writes a **working starter codebase** into the project workspace, with a build/test feedback loop.
8. Everything is **persisted as files on disk** and **fully audited**, so the user can close and **resume** later.

---

## 4. Functional Requirements

### 4.1 Idea Intake & Vision
- **FR‑1 — Idea capture.** The system shall accept a free‑text idea/prompt and a flag indicating whether it is a new initiative or part of an existing project.
- **FR‑2 — Interactive vision clarification.** Before writing the vision, the system shall analyze the idea and present a short batch of clarifying questions as retro dialog cards (multiple‑choice with an "Other/free‑text" option), answered in‑app.
- **FR‑3 — Vision Document generation.** The system shall generate a Vision Document structured exactly per `vision-document-guide.md` (Executive Summary; Business Context; Full Scope Vision; MVP Scope; Risks & Dependencies; Open Questions).
- **FR‑4 — Vision editing & approval.** The user shall be able to edit any section of the generated Vision Document inline and either approve it or request AI revisions.

### 4.2 Workflow Orchestration & In‑UI Q&A
- **FR‑5 — Launch AI‑DLC from vision.** The user shall be able to start an AI‑DLC run seeded by the approved Vision Document.
- **FR‑6 — Faithful, adaptive stage orchestration.** The system shall drive the AI‑DLC stages per the bundled AI‑DLC rule set, adaptively including/skipping conditional stages based on the rules' criteria, in the correct phase order (Inception → Construction → Operations placeholder).
- **FR‑7 — In‑UI stage questions.** For any stage that requires user input, the system shall render that stage's questions as retro dialog cards (A/B/C/… + mandatory "Other" free‑text), capture answers in‑app, and feed them back into the stage.
- **FR‑8 — Contradiction/ambiguity handling.** The system shall analyze stage answers for contradictions/ambiguities and surface follow‑up clarification cards before proceeding, per the AI‑DLC question‑format rules.
- **FR‑9 — Approval gates.** At each stage completion the system shall present a standardized two‑option gate — **Request Changes** or **Approve & Continue** — and shall not advance until the user approves.

### 4.3 Artifacts & Editing
- **FR‑10 — Artifact generation.** Each executed stage shall produce its AI‑DLC markdown artifact(s) into the project's `aidlc-docs/` structure (e.g., requirements, user stories, workflow plan, application design, units, per‑unit designs, build/test instructions).
- **FR‑11 — Artifact viewing.** Artifacts shall be viewable in the UI as rendered markdown inside retro "document windows."
- **FR‑12 — Artifact inline editing.** The user shall be able to edit any artifact inline; edits persist and become the source of truth for downstream stages.
- **FR‑13 — Request‑changes revision loop.** On "Request Changes," the system shall capture the user's feedback and have the AI revise the artifact, preserving prior versions.

### 4.4 Code Generation (Construction — phased)
- **FR‑14 — Code‑gen planning.** Before generating code, the system shall produce a code‑generation plan (per the AI‑DLC code‑generation rules) for user approval.
- **FR‑15 — LLM‑orchestrated code generation.** The system shall drive an LLM agent loop that writes a working starter codebase for the user's idea into the project workspace (application code at workspace root, never in `aidlc-docs/`).
- **FR‑16 — Build/test feedback loop.** The system shall be able to run build/test commands against generated code and feed failures back to the AI for iterative correction (bounded retries with visible progress).
- **FR‑17 — Generated‑code review & export.** The user shall be able to browse the generated codebase in‑app and export/download the project (artifacts + code).

### 4.5 Project, Provider & Lifecycle Management
- **FR‑18 — Project management.** The user shall be able to create, list, open, and delete projects; each project is an on‑disk folder containing its `aidlc-docs/`, generated code, and state.
- **FR‑19 — State tracking & audit.** Each project shall maintain an `aidlc-state.md` (stage progress) and an append‑only `audit.md` (every interaction, timestamped), mirroring AI‑DLC requirements.
- **FR‑20 — Resume / session continuity.** On reopening a project, the system shall load prior state and artifacts and offer to resume at the next step (per AI‑DLC session‑continuity rules).
- **FR‑21 — AI provider configuration.** The user shall be able to configure the active AI provider and credentials (Claude by default); the provider is swappable behind a common interface.
- **FR‑22 — Lifecycle progress visualization.** The UI shall present the three‑phase lifecycle and the user's current position (stepper/progress), including which stages executed vs. were skipped and why.
- **FR‑23 — Bundled rule set as engine.** The application shall bundle the AI‑DLC rule set + vision guide and use them as the canonical orchestration content, so the in‑app workflow stays faithful to the methodology and is updatable.

---

## 5. Non‑Functional Requirements

- **NFR‑1 — Usability (primary).** Hybrid retro UI: retro window chrome (cream panels, thick black outlines, rounded corners, pastel accents — mint/coral/sky/gold/lavender, chunky buttons, title‑bar chrome) framing a clear modern stepper/wizard. Must be approachable to non‑experts and visually match the reference images.
- **NFR‑2 — Responsiveness.** UI remains responsive during AI calls; long operations stream output and show progress (no frozen screens).
- **NFR‑3 — Performance.** LLM responses streamed token‑by‑token where supported; perceived latency minimized; local file I/O is near‑instant.
- **NFR‑4 — Portability (local‑first, deploy‑ready).** Runs locally via a single command and in a browser, storing data on the local disk; the same codebase deploys to a cloud host by swapping storage + auth implementations — no rewrite.
- **NFR‑5 — Extensibility.** AI provider, storage, and (future) auth are each behind clean interfaces. New AI‑DLC stages/rules can be added without changing the UI shell.
- **NFR‑6 — Maintainability.** Clear separation: UI shell ⟷ workflow engine ⟷ provider adapters ⟷ storage adapters. Security‑critical logic isolated (SECURITY‑11).
- **NFR‑7 — Reliability & fail‑safe.** All external calls (LLM API, file I/O, build/test) have explicit error handling; global error handler; fail‑closed on errors; resource cleanup on error paths (SECURITY‑15).
- **NFR‑8 — Observability.** Structured application logging with timestamp, correlation/request ID, level, message; secrets/PII never logged (SECURITY‑03).
- **NFR‑9 — Privacy.** Local‑first: project data stays on the user's machine. Only the idea/prompt + workflow context are sent to the configured AI provider; this is disclosed to the user.
- **NFR‑10 — Testability.** Example‑based tests across the app; **property‑based tests (Partial)** for pure functions, the workflow state machine, parsers, and markdown ⇄ structured‑data serialization round‑trips.
- **NFR‑11 — Accessibility.** Despite the retro aesthetic, meet baseline a11y: keyboard navigation, sufficient color contrast, focus states, and semantic structure.
- **NFR‑12 — Supply‑chain hygiene.** Pinned dependencies + lockfile; dependency vulnerability scanning configured; no `latest` tags; trusted registries only (SECURITY‑10).
- **NFR‑13 — Secrets management.** AI provider API keys handled via environment/secure config — never hardcoded, never committed, never logged (SECURITY‑12).
- **NFR‑14 — Web hardening.** HTTP security headers (CSP, HSTS, X‑Content‑Type‑Options, X‑Frame‑Options, Referrer‑Policy) on HTML‑serving endpoints; generic production error responses; input validation on all API endpoints (SECURITY‑04, ‑05, ‑09).

---

## 6. Security Requirements — Applicability Matrix (Security Extension ENABLED, blocking)

Applicability reflects the **MVP** (single‑user, local‑first). Rules marked *Deferred* become enforceable when the app is deployed in multi‑user/cloud mode and will be designed for now via the storage/auth interfaces.

| Rule | Applies to MVP? | How it is satisfied / Notes |
|---|---|---|
| SECURITY‑01 Encryption at rest/in transit | Partial | In transit: HTTPS/TLS to the AI provider. At rest: local files on user's OS (OS‑level); cloud encryption deferred to deploy mode. |
| SECURITY‑02 Network intermediary logging | N/A (MVP) | No LB/gateway/CDN in local mode; applies in deploy mode. |
| SECURITY‑03 Application logging | **Yes** | Structured logger; no secrets/PII in logs. |
| SECURITY‑04 HTTP security headers | **Yes** | Set on all HTML‑serving endpoints. |
| SECURITY‑05 Input validation | **Yes** | Validate/limit all API inputs (idea text, answers, file paths); path‑traversal protection on file ops. |
| SECURITY‑06 Least‑privilege IAM | N/A (MVP) | No cloud IAM locally; applies in deploy mode. |
| SECURITY‑07 Restrictive network config | N/A (MVP) | Local only; applies in deploy mode. |
| SECURITY‑08 App‑level access control | Deferred | No multi‑user authz in single‑user MVP; auth interface reserved for deploy mode. |
| SECURITY‑09 Hardening / misconfiguration | **Yes** | No default creds; generic prod errors (no stack traces to users); no demo pages; current runtimes. |
| SECURITY‑10 Supply‑chain security | **Yes** | Lockfile, dep scanning, pinned versions, trusted registries. |
| SECURITY‑11 Secure design | **Yes** | Isolate security‑critical logic; defense in depth; consider misuse (e.g., path traversal, prompt‑injection in idea text → never execute model output as code without the sandboxed build/test boundary). Rate limiting deferred to deploy mode. |
| SECURITY‑12 Auth & credential management | Partial | No user auth in MVP, but **AI API keys are secrets** → secure config only, never hardcoded/logged. Full auth in deploy mode. |
| SECURITY‑13 Software/data integrity | **Yes** | Safe parsing/deserialization of markdown/JSON artifacts; SRI for any CDN scripts; auditable artifact changes. |
| SECURITY‑14 Alerting & monitoring | N/A (MVP) | Local single‑user; applies in deploy mode. |
| SECURITY‑15 Exception handling / fail‑safe | **Yes** | Global error handler; fail‑closed; resource cleanup; no unhandled rejections. |

**Special consideration — code generation safety:** generated/3rd‑party code and build/test execution must run within a controlled boundary; the app must treat model‑produced code and user idea text as untrusted input (no blind execution outside the intended build/test step). This is a first‑class design concern for the Construction phase.

---

## 7. Out of Scope (MVP)

- Multi‑user accounts, authentication, and cloud sync (architected for, not built).
- Real‑time multi‑person collaboration on a project.
- Marketplace / sharing of generated projects.
- Non‑Claude providers shipped on day one (interface ready; Claude is the only wired provider initially).
- Operations phase automation (deployment/monitoring) — placeholder per AI‑DLC.
- Mobile‑native apps (responsive web only).

---

## 8. Assumptions

- **A‑1:** The user can supply a valid AI provider API key (Claude). *Risk if wrong:* no AI features; mitigated by clear setup UX and a graceful "configure provider" state.
- **A‑2:** Local Node runtime with filesystem access is available where the app runs. *Risk if wrong:* file persistence/code‑gen unavailable.
- **A‑3:** Code generation yields a *starter* codebase requiring human iteration, not a guaranteed finished product. *Risk if wrong:* expectation mismatch; mitigated by explicit framing in UI.
- **A‑4:** The bundled AI‑DLC rule set is the authoritative workflow definition and may be updated over time.

---

## 9. Open Questions (non‑blocking — to resolve during Inception)

- **OQ‑1 — Product branding/name.** "AI‑DLC Studio" is a working title. For commercial release, choose a distinct brand that does **not** imply AWS affiliation (MIT‑0 grants no trademark rights). *(Feeds: later branding decision.)*
- **OQ‑2 — Default Claude model & cost controls.** Which default model (e.g., Sonnet for cost/speed, Opus for depth) and what token/cost guardrails should the app show? *(Feeds: NFR Requirements / Application Design.)*
- **OQ‑3 — Code‑gen execution boundary.** Exact sandboxing approach for running generated build/test (in‑process vs. child process vs. container). *(Feeds: Application Design / Infrastructure Design / SECURITY‑11.)*
- **OQ‑4 — Adaptive‑stage transparency.** How much of the AI‑DLC "why this stage ran/was skipped" reasoning to surface to end users. *(Feeds: User Stories / Application Design.)*

---

## 10. Key Requirements Summary

- A **local‑first, deploy‑ready** retro‑styled web app that converts an **idea → Vision Document → full AI‑DLC run → working starter codebase**, with the human approving at every gate.
- **Interactive vision clarification**, **in‑UI retro dialog‑card Q&A** for every stage, **inline‑editable artifacts**, and **two‑option approval gates** are the core UX pillars.
- **Pluggable AI provider** (Claude default) and **abstracted storage/auth** make it extensible and future‑proof for SaaS.
- **Full code generation** delivered via **LLM orchestration**, **phased** after a polished Inception/Design experience.
- **Security extension enforced (blocking)** with an explicit applicability matrix; **Partial PBT** for the logic that benefits most.
- Faithful to the **bundled AWS AI‑DLC rule set** (MIT‑0), which the product both *uses to build itself* and *runs for its users*.
