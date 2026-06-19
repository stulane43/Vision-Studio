# Requirements Clarification Questions — AI-DLC Studio

You asked me to help "get this idea right" before building. These questions resolve the genuine ambiguities that will shape the whole product. Please answer each by putting a letter after the `[Answer]:` tag. If an option doesn't fit, choose **Other** and describe.

**Intent (my understanding so far):** A web app where a user types an idea → the app generates a **Vision Document** (per `vision-document-guide.md`), asking clarifying questions when needed → the user then launches the **AI-DLC workflow** from that vision and walks through its stages in a friendly **modern-retro UI**, answering stage questions in-app and continuing through to artifacts. Confirm or correct via the questions below.

---

## Question 1 — AI Engine
How should the app actually generate the vision document and drive the AI-DLC stages (the "thinking" part)?

A) **Anthropic Claude API** — call Claude models directly (you supply an API key). Latest models (Opus 4.8 / Sonnet 4.6 / Haiku 4.5).
B) **Pluggable provider** — Claude by default, but architected so OpenAI / local models can be swapped via config.
C) **Mock/templated for MVP** — deterministic stub responses now (no live AI), wire a real provider in later.
X) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 2 — What a Complete Run Produces (MVP scope)
The full AI-DLC ends in generated code. How far should *this app's MVP* take a run?

A) **Inception only** — idea → Vision → Requirements → User Stories → Workflow Planning, producing the markdown artifacts (no code generation). Focus on a polished planning experience.
B) **Inception + Construction design docs** — also produce Functional/NFR/Infrastructure design artifacts, but stop before writing application code.
C) **Full AI-DLC** — go all the way through Code Generation and emit a working codebase/repo for the user's idea.
X) Other (please describe after [Answer]: tag below)

[Answer]: C

---

## Question 3 — Users & Persistence
Who uses it, and where does project data live?

A) **Single-user local tool** — projects/artifacts saved as files on disk, no login.
B) **Single-user with a database** — projects persist in a local DB (e.g. SQLite), browsable history, still no login.
C) **Multi-user web app** — accounts/auth, each user has their own projects in cloud storage.
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 4 — Platform & Deployment
Where should it run?

A) **Local web app** — runs on my machine, I open it in a browser.
B) **Deployable web app** — cloud-hostable and shareable (e.g. Vercel/Render), but local-first is fine for MVP.
C) **Desktop app** — packaged (Electron/Tauri) installable application.
X) Other (please describe after [Answer]: tag below)

[Answer]: X - if i have it as a deployable app, but single user local tool, can that work? like is this realistic? does this go against AI-DLC licensing from AWS? Can i sell this?

---

## Question 5 — Tech Stack
Any preference? (Your `summerbuilder` project uses a React Web + Node API split.)

A) **Next.js** (React + built-in API routes), full-stack TypeScript — fastest path for a single deployable app.
B) **React (Vite) front end + Node/Express API** — separate front/back, matches your Summer-Builder Web/API layout.
C) **You decide** — recommend the best fit and proceed.
X) Other (please describe after [Answer]: tag below)

[Answer]: C

---

## Question 6 — Vision Document: Clarifying-Question Behavior
When the AI needs more info before writing the vision, how should it behave?

A) **Interactive first** — AI asks a short batch of clarifying questions in the UI, you answer, then it generates the Vision Document.
B) **Draft first** — AI immediately generates a best-effort Vision from the prompt; you refine it afterward.
C) **Both** — AI generates a draft *and* surfaces open questions/assumptions you can answer to sharpen it.
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 7 — How AI-DLC Stage Questions Appear in the UI (core UX)
This is the heart of the experience. How should stage questions be presented and answered?

A) **Retro dialog cards / wizard** — each stage shows its questions as retro window-style cards (multiple-choice + free text), answered in-app, then "Continue."
B) **Chat-style flow** — a conversational retro chat where the AI asks and the user replies, stage by stage.
C) **Editable document + inline questions** — a live document view where questions appear inline and are answered in place; artifacts build up as you go.
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 8 — Editing & Approval of Generated Artifacts
What control does the user have over what the AI produces at each gate?

A) **Full inline editing** — user can directly edit any generated document, plus approve / request changes.
B) **Approve / request-changes only** — user reviews and either approves or asks the AI to revise (AI does the edits).
C) **Read-only for MVP** — view and continue; editing comes later.
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 9 — Retro UI Intensity
How far do we push the aesthetic from your reference images?

A) **Full desktop metaphor** — draggable retro windows, title bars with min/close chrome, a taskbar/menu, icon system — an OS-like feel.
B) **Retro-skinned app** — standard single-page app layout (header + stepper + panels) wearing the retro skin (cream panels, thick outlines, pastel accents, chunky buttons).
C) **Hybrid** — retro window chrome frames a clean modern stepper/wizard; windows for artifacts, structured flow underneath.
X) Other (please describe after [Answer]: tag below)

[Answer]: C

---

## Question 10 — Security Extensions (extension opt-in)
Should security extension rules be enforced for this project?

A) Yes — enforce all SECURITY rules as blocking constraints (recommended for production-grade applications).
B) No — skip all SECURITY rules (suitable for PoCs, prototypes, and experimental projects).
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 11 — Property-Based Testing (extension opt-in)
Should property-based testing (PBT) rules be enforced for this project?

A) Yes — enforce all PBT rules as blocking constraints (recommended for projects with business logic, data transformations, serialization, or stateful components).
B) Partial — enforce PBT rules only for pure functions and serialization round-trips (suitable for limited algorithmic complexity).
C) No — skip all PBT rules (suitable for simple CRUD/UI-only projects or thin integration layers).
X) Other (please describe after [Answer]: tag below)

[Answer]: X What do you recommend?

---

## Question 12 — Anything I Missed?
Is there a must-have capability, constraint, or inspiration (beyond the reference images) I should bake into the vision?

A) No — the questions above cover it; proceed.
B) Yes — I'll describe it after the [Answer]: tag.
X) Other (please describe after [Answer]: tag below)

[Answer]: A
