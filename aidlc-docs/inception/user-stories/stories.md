# User Stories — AI-DLC Studio

Organized by epic/journey. Each story follows INVEST and includes acceptance criteria (AC). IDs map to build units in `unit-of-work-story-map.md`.

---

## Epic A — Idea → Vision

### US-1 — Capture an idea
*As Maya, I want to enter my idea as free text (and note if it's new or part of an existing project) so the app understands what I want to build.*
- AC1: A retro "New Project" dialog accepts a project name + multi-line idea text.
- AC2: I can flag "new initiative" vs "part of an existing project."
- AC3: Input is validated (non-empty, max length) with a friendly retro error if invalid.
- AC4: Submitting creates a persisted project and opens its workspace.

### US-2 — Interactive vision clarification
*As Maya, I want to answer a few clarifying questions so the generated vision is accurate.*
- AC1: The AI returns a short batch (≤6) of clarifying questions rendered as retro dialog cards.
- AC2: Each question supports multiple choice plus a mandatory "Other" free-text option.
- AC3: I cannot generate the vision until all questions are answered.
- AC4: Answers are persisted and shown back to me.

### US-3 — Generate the Vision Document
*As Maya, I want a structured Vision Document so I have a clear, shareable plan.*
- AC1: The vision follows `vision-document-guide.md` sections (Executive Summary, Business Context, Full Scope Vision, MVP Scope, Risks & Dependencies, Open Questions).
- AC2: It renders as formatted markdown inside a retro "document window."
- AC3: It is saved to the project's `aidlc-docs/`.

### US-4 — Edit the vision inline
*As Devin, I want to edit any section of the vision inline so it matches my intent.*
- AC1: A document window has a view/edit toggle.
- AC2: Edits save and persist; the edited version becomes the source of truth.

### US-5 — Approve the vision / request changes
*As Maya, I want to approve the vision (or ask the AI to revise) to start the AI-DLC.*
- AC1: A two-option gate: **Approve & Continue** or **Request Changes**.
- AC2: Request Changes captures feedback; the AI revises while preserving prior versions.
- AC3: Approve advances the workflow and is logged in the audit trail.

---

## Epic B — Run the AI-DLC

### US-6 — Launch AI-DLC from the vision
*As Maya, I want to launch the AI-DLC from my approved vision so it walks me through building.*
- AC1: A "Start AI-DLC" action seeds the run with the vision.
- AC2: A three-phase lifecycle stepper appears with the current stage highlighted.

### US-7 — Answer each stage's questions in the UI
*As Maya, I want to answer each stage's questions in the UI so the AI can proceed.*
- AC1: Stage questions render as retro cards (choices + "Other").
- AC2: Detected contradictions/ambiguities produce follow-up cards before proceeding.
- AC3: Answers persist per stage and feed the AI's artifact generation.

### US-8 — Review, edit, and approve each artifact
*As Devin, I want to review/edit each stage's artifact and approve or request changes.*
- AC1: Each executed stage shows its artifact in a document window.
- AC2: Inline editing supported; two-option gate per stage.
- AC3: Request Changes triggers an AI revision loop.

### US-9 — See lifecycle progress
*As Maya, I want to see where I am in the lifecycle so I understand progress.*
- AC1: Stepper shows Inception → Construction → Operations and per-stage status.
- AC2: Skipped stages are shown with a one-line rationale.

### US-10 — Generate a starter codebase
*As Devin, I want a generated starter codebase so I can start building.*
- AC1: The Construction/Code-Generation stage produces a code plan, then writes files into the project workspace (never into `aidlc-docs/`).
- AC2: I can browse generated files in-app.
- AC3: A build/test feedback loop runs (bounded retries) and surfaces results.
- AC4: I can export/download the project (artifacts + code).
- *Note: delivered as a phased "frontier" capability — output is a working starter scaffold to iterate on.*

---

## Epic C — Projects, Config, Resilience

### US-11 — Browse projects
*As Maya, I want to see all my projects so I can return to them.* AC: desktop lists projects with status; open/delete.

### US-12 — Resume where I left off
*As Maya, I want to resume a project at the next step.* AC: state + artifacts reload; resume points to the next action per session-continuity.

### US-13 — Configure the AI provider
*As Devin, I want to configure my AI provider + key so the AI works.* AC: settings window; provider select (Claude default); key stored in secure config, never logged; a **Mock** provider lets the app run with no key.

### US-14 — Export artifacts
*As Priya, I want to export artifacts so I can share them.* AC: download individual docs or the whole project.

### US-15 — Automatic persistence + audit
*As any user, I want my work saved automatically so I don't lose it.* AC: every artifact/answer persisted as files; append-only `audit.md`; `aidlc-state.md` tracks progress.

---

## Cross-Cutting

### US-16 — Delightful retro desktop feel
*As any user, I want a cool retro-desktop UI so it's enjoyable.* AC: matches reference aesthetic (cream panels, thick outlines, pastel accents, window chrome); hybrid retro chrome over a clear stepper/wizard.

### US-17 — Graceful error handling
*As any user, I want errors handled gracefully so I'm never stuck.* AC: friendly retro error dialogs; fail-closed; no stack traces or secrets shown; retry paths.

---

## INVEST & Traceability Notes
- Stories are independent, testable, and small enough to estimate; each AC is a candidate acceptance test.
- US-2/US-7 (card Q&A), US-5/US-8 (gates + edit), US-9 (stepper), US-16 (retro UI) are the core UX pillars and get the most design attention.
- Security (US-13 secrets, US-17 fail-closed/no-leak) traces to SECURITY-12/-15/-09.
