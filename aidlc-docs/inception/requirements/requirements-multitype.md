# Requirements — Multi-Type Vision Documents (Feature Cycle 2)

> **Phase:** INCEPTION · Requirements Analysis (Standard/Comprehensive depth)
> **Project:** Vision Studio (brownfield) · **Feature:** Multi-Type Vision Documents for Business AI Work
> **Source vision:** `Vision-Studio-vision.md` · **Current-state reference:** `aidlc-docs/inception/reverse-engineering/`
> **Mode:** Autonomous authorization — clarifying questions resolved as documented decisions (see `requirements-multitype-questions.md`).

---

## 1. Intent Analysis

| Attribute | Finding |
|---|---|
| **Request** | Expand Vision Studio from a single-type Vision Document generator into a **multi-type** generator: the user first picks a **document type**, then answers **type-specific** questions, and receives a **type-specific** structured document that works as both a human brief and an AI-ready prompt. |
| **Request type** | Brownfield feature enhancement to an existing app. |
| **Scope** | Front-end (type selection step + workspace label + lightweight feedback) + back-end (document-type model, per-type prompts/guides, validation, service, serialization/back-compat). No new infrastructure. |
| **Complexity** | Moderate. The existing "generic stage runner" + Adapter seams make this additive, not a rewrite. |
| **Primary outcome** | Adoption beyond software-dev use cases: business users turn vague AI requests into precise, reusable briefs. |

## 2. Confirmed Decisions (resolving the vision's Open Questions — see `requirements-multitype-questions.md`)

| # | Decision area | Choice |
|---|---|---|
| D1 | **Default type** | Selector defaults to **Development Vision Document** (preserves current behavior/expectations) with a visible "Not sure? Try Business / General AI Task Brief" hint. Existing in-flight projects (no stored type) default to Development Vision Document. |
| D2 | **MVP type names** | "Development Vision Document", "Business / General AI Task Brief", "Presentation / PowerPoint Brief". |
| D3 | **Business brief subcategories** | None in MVP — the Business brief stays fully general. |
| D4 | **Required inputs per type** | Same minimal form for all types: project **name** + **idea/topic** (≥3 chars). Type-specific specifics are gathered via clarifying questions, not extra form fields. |
| D5 | **Switching type after creation** | Out of scope for MVP. Type is chosen at creation; to change type, create a new project. |
| D6 | **Feedback scale** | Lightweight post-approval prompt: **"Was this ready to use with AI?" → Yes / Minor edits / Major edits**, stored on the project. |
| D7 | **Copy-ready AI Prompt section** | **Yes** for the two non-dev types — include a "Ready-to-Use AI Prompt" section in addition to the full brief. |
| D8 | **Presentation output format** | Ask the user (clarifying question) for preferred output (slide outline / full slide copy / speaker notes / let AI choose); the brief always includes slide-by-slide direction + speaker-notes guidance, weighted to their choice. |
| D9 | **Examples per type** | Show 2–3 short example use cases per type in the selector. |
| D10 | **Future-type criteria** | Documented (distinct need, repeatable sections, human+AI usable, measurable). Not built in MVP. |
| D11 | **Type as label/filter** | Show the document type as a **label** on each project card and in the workspace header. Filtering deferred. |
| D12 | **Privacy/confidentiality note** | Add a brief, non-blocking note in the new-project dialog that the idea text is sent to the configured AI provider (reinforces existing NFR-9 disclosure). |

**Extensions (re-confirmed for this cycle):** Security Baseline = **Yes (blocking)**; Property-Based Testing = **Partial** (pure functions, parsers, serialization round-trips, document-type registry selection, back-compat deserialization).

## 3. Functional Requirements

### 3.1 Document Type Selection
- **FR-MT-1 — Type selection step.** When creating a project, the system shall present the predefined document types with a plain-language description and 2–3 example use cases each, and require the user to proceed with one selected (default: Development Vision Document).
- **FR-MT-2 — Recommended fallback.** The selector shall visibly recommend "Business / General AI Task Brief" for users who are unsure (no separate recommendation engine).
- **FR-MT-3 — Privacy note.** The new-project dialog shall display a brief, non-blocking note that idea text is sent to the configured AI provider.

### 3.2 Type-Specific Generation
- **FR-MT-4 — Type-specific clarifying questions.** The clarifying questions generated shall be tailored to the selected document type (e.g., presentation briefs ask about audience/slide count/output format; business briefs ask about deliverable/tone/things-to-avoid).
- **FR-MT-5 — Type-specific output structure.** The generated document shall use the section structure defined for its type (see §3.3), not a one-size-fits-all template.
- **FR-MT-6 — Development type preserved.** Selecting "Development Vision Document" shall reproduce the **current** behavior and section structure with no regression, writing to `vision-document.md`.
- **FR-MT-7 — AI Instructions section.** Non-development documents shall include a dedicated "AI Instructions" section telling an AI tool how to use the document, plus "Do / Do Not" guidance.
- **FR-MT-8 — Ready-to-Use AI Prompt.** Non-development documents shall include a copy-ready "Ready-to-Use AI Prompt" section (D7).
- **FR-MT-9 — Human-readable + acceptance criteria.** Every document shall remain human-readable and include deliverables, constraints, and success/acceptance criteria appropriate to its type.

### 3.3 Document Types (MVP)
- **FR-MT-10 — Development Vision Document** (`dev-vision`): existing `VISION_GUIDE` structure (Executive Summary; Business Context; Full Scope Vision; MVP Scope; Risks & Dependencies; Open Questions).
- **FR-MT-11 — Business / General AI Task Brief** (`business-brief`): Executive Summary; Objective; Business Context; Target Audience; Inputs & Source Material; Deliverables; AI Instructions; Do / Do Not; Constraints & Exclusions; Review / Acceptance Criteria; Ready-to-Use AI Prompt.
- **FR-MT-12 — Presentation / PowerPoint Brief** (`presentation-brief`): Presentation Overview; Audience & Desired Action; Core Message; Narrative Structure; Slide-by-Slide Direction; Visual & Data Guidance; Speaker Notes Guidance; AI Instructions; Acceptance Criteria; Ready-to-Use AI Prompt.

### 3.4 Persistence, Labeling, Feedback
- **FR-MT-13 — Persist type.** The selected document type shall be stored on the project and on its artifact, and validated on read; **back-compat:** projects/artifacts without a stored type default to `dev-vision`.
- **FR-MT-14 — Type label.** The document type shall be shown on each project card (Desktop) and in the project workspace header.
- **FR-MT-15 — Lightweight feedback.** After approval, the system shall offer the "ready to use with AI" prompt (Yes / Minor edits / Major edits) and store the response on the project (D6).
- **FR-MT-16 — Analytics-by-type.** Document type, creation, and completion shall be recorded (project state + audit) so usage by type is measurable without a separate analytics service.

## 4. Non-Functional Requirements (inherited + delta)

Inherits all v1 NFRs (usability/retro UI, responsiveness, streaming, portability, extensibility, maintainability, reliability/fail-safe, observability, privacy, testability, accessibility, supply-chain, secrets, web hardening). Feature-specific:
- **NFR-MT-1 — No regression.** Development Vision Document generation must be behaviorally unchanged; existing projects must load and run.
- **NFR-MT-2 — Extensible type registry.** Document types live in a single registry so adding a future type requires no UI/engine rewrite (just a registry entry + guide).
- **NFR-MT-3 — Key-free parity.** The Mock provider must produce sensible, type-appropriate questions and documents for every type (offline/dev/test parity).
- **NFR-MT-4 — Testability.** Pure type-registry lookups, per-type prompt selection, and back-compat deserialization are unit/property-tested.

## 5. Security Applicability (Security Baseline ENABLED, blocking)

Mostly inherited from v1's matrix. Feature-relevant points:
- **SECURITY-05 Input validation:** the new `documentType` is validated against an allow-list enum on every untrusted boundary (API create, deserialization). No new free-text surface beyond existing idea/answers.
- **SECURITY-13 Data integrity:** persisted `documentType` validated on read; unknown/missing values rejected or safely defaulted (`dev-vision`) — never trusted blindly.
- **SECURITY-11 Secure design:** type selection changes prompt content only; model output is still treated as untrusted data (rendered, never executed). No new execution surface.
- **SECURITY-04/09/12/15:** unchanged (headers, generic errors, secrets handling, fail-safe all inherited).
- All other rules: unchanged from v1 applicability (N/A items remain N/A in local single-deployment mode).

## 6. In Scope (MVP)
Type selection step; the 3 types with distinct questions + output structures; type descriptions/examples; AI Instructions + Ready-to-Use AI Prompt for non-dev types; acceptance criteria by type; persisted + labeled type; lightweight feedback + by-type analytics; recommended fallback; privacy note; no-regression for Development Vision Document.

## 7. Out of Scope (MVP)
User-created/custom templates; template marketplace; Research Brief & Spreadsheet Brief (Phase 2); Image/Creative Brief (Phase 3); advanced recommendation engine; org-level template governance; automated export to PowerPoint/files; direct submission to external AI tools; collaboration/approval workflow; switching a project's type after creation; history filtering by type.

## 8. Assumptions
- **A-1:** The existing generic stage runner + provider/storage adapters can carry a `documentType` with no architectural change. *(High confidence — confirmed by RE.)*
- **A-2:** Existing persisted projects have no `documentType`; defaulting them to `dev-vision` is acceptable and lossless.
- **A-3:** Type-specific quality comes primarily from per-type prompts/guides + clarifying questions, not from new structured form fields.
- **A-4:** Lightweight, file-based feedback/analytics is sufficient for MVP measurement (no external analytics dependency).

## 9. Traceability (vision → requirements)
Document Type Selection → FR-MT-1..3; Type-Specific Templates → FR-MT-4..6,10..12; Business Brief → FR-MT-11; Presentation Brief → FR-MT-12; AI Instructions/Prompt → FR-MT-7,8; Acceptance criteria/feedback/analytics → FR-MT-9,15,16; Guided fallback → FR-MT-2; Persist/label type → FR-MT-13,14; No-regression → NFR-MT-1; Governance/future types → §7 + D10.
