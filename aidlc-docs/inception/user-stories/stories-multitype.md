# User Stories — Multi-Type Vision Documents

> Format: As a [persona], I want [capability], so that [value]. AC = acceptance criteria. Priority: Must / Should / Could.
> Traceability to FR-MT-* in `requirements-multitype.md`.

## Epic A — Document Type Selection

### S-A1 (Must) Choose a document type — *FR-MT-1, Bex/Mara/Devin*
As a user, I want to choose what kind of document I'm creating before answering questions, so that the result matches my actual goal.
- **AC1:** New-project flow shows the 3 types, each with a plain-language description and 2–3 example use cases.
- **AC2:** Development Vision Document is pre-selected by default (D1).
- **AC3:** I cannot proceed without a type selected; my choice is carried into generation.

### S-A2 (Could) Recommended fallback — *FR-MT-2, Bex*
As an unsure user, I want a recommended option, so that I don't stall on the choice.
- **AC1:** The selector visibly suggests "Business / General AI Task Brief" for "not sure".

### S-A3 (Should) Privacy note — *FR-MT-3*
As a cautious user, I want to know my idea text goes to an AI provider, so that I can decide what to enter.
- **AC1:** A brief, non-blocking note appears in the new-project dialog.

## Epic B — Type-Specific Generation

### S-B1 (Must) Development Vision Document unchanged — *FR-MT-6, NFR-MT-1, Devin*
As an existing user, I want the dev vision document to work exactly as before, so that nothing regresses.
- **AC1:** Selecting it yields the current section structure and writes `vision-document.md`.
- **AC2:** Existing projects (no stored type) open and run as Development Vision Documents.

### S-B2 (Must) Business / General AI Task Brief — *FR-MT-11, Bex/Avi*
As a business user, I want a structured AI task brief, so that AI produces a relevant first draft.
- **AC1:** Clarifying questions are business-task oriented (objective, audience, inputs, deliverable, tone, things to avoid, success criteria).
- **AC2:** Output includes Objective, Business Context, Target Audience, Inputs & Source Material, Deliverables, **AI Instructions**, **Do / Do Not**, Constraints & Exclusions, Review/Acceptance Criteria, and a **Ready-to-Use AI Prompt**.

### S-B3 (Must) Presentation / PowerPoint Brief — *FR-MT-12, Mara*
As a manager, I want a presentation brief, so that AI or a teammate builds a focused deck.
- **AC1:** Clarifying questions cover audience, desired action, key message, slide count, required topics, source material, visual prefs, tone, and **preferred output format** (D8).
- **AC2:** Output includes Presentation Overview, Audience & Desired Action, Core Message, Narrative Structure, **Slide-by-Slide Direction**, Visual & Data Guidance, **Speaker Notes Guidance**, AI Instructions, Acceptance Criteria, and a Ready-to-Use AI Prompt.

### S-B4 (Must) AI Instructions + copy-ready prompt — *FR-MT-7, FR-MT-8, Bex/Mara*
As a business user, I want explicit AI instructions and a copy-ready prompt, so that I can paste it straight into an AI tool.
- **AC1:** Non-dev documents contain an "AI Instructions" section and a "Ready-to-Use AI Prompt" section.

### S-B5 (Must) Key-free parity — *NFR-MT-3*
As a user without an API key (or a tester), I want the Mock provider to produce type-appropriate questions and a type-appropriate document, so that I can try every type offline.
- **AC1:** Mock returns distinct questions and a distinct document per type.

## Epic C — Persist, Label, Measure

### S-C1 (Must) Persist + validate type — *FR-MT-13, SECURITY-05/13*
As the system, I must store and validate the document type, so that projects reload correctly and safely.
- **AC1:** Type is saved on project + artifact and validated on read; unknown/missing → default `dev-vision`.

### S-C2 (Should) Type label — *FR-MT-14, Pat*
As a user, I want to see each project's type, so that I can identify and reuse prior work.
- **AC1:** Type label shown on Desktop cards and the workspace header.

### S-C3 (Should) Ready-to-use feedback — *FR-MT-15, Pat*
As the product owner, I want a quick post-approval rating, so that I can measure usefulness.
- **AC1:** After approval, a "Was this ready to use with AI? Yes / Minor edits / Major edits" prompt appears; the choice is stored.

### S-C4 (Should) By-type analytics — *FR-MT-16, Pat*
As the product owner, I want type/creation/completion recorded, so that adoption by type is measurable.
- **AC1:** Document type and lifecycle events are recorded in project state + audit.

## Out of scope (this cycle)
Custom templates, marketplace, Research/Spreadsheet/Image briefs, recommendation engine, type switching after creation, history filtering, PowerPoint export, direct AI-tool submission, collaboration.
