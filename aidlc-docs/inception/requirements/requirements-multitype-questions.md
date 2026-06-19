# Requirements Clarification — Multi-Type Vision Documents

> These resolve the 12 Open Questions from `Vision-Studio-vision.md` plus the two extension opt-ins. Under the user's autonomous authorization, the AI selected each answer with rationale (recorded inline). The user may override any of these later.

## Question 1 — Default selection
Should "Development Vision Document" remain the default, or must users always actively choose?

A) Default to Development Vision Document (preserve current behavior), with a hint toward the business fallback
B) No default — force an explicit choice every time
X) Other

[Answer]: A — Lowest regression risk for existing users (vision risk table: keep dev doc default/visible); a visible "Not sure? Try Business / General AI Task Brief" hint covers newcomers.

## Question 2 — MVP type names
A) "Development Vision Document", "Business / General AI Task Brief", "Presentation / PowerPoint Brief"
B) Shorter labels (e.g., "Dev Vision", "Business Brief", "Presentation")
X) Other

[Answer]: A — Plain-language, self-explanatory for non-technical users; matches the vision document's naming.

## Question 3 — Business brief subcategories
A) Keep fully general in MVP
B) Add subcategories (writing / planning / analysis / communication)
X) Other

[Answer]: A — Avoids choice overload at launch; subcategories can come later if demand appears.

## Question 4 — Minimum required inputs per type
A) Same minimal form (name + idea ≥3 chars); type specifics via clarifying questions
B) Distinct required form fields per type
X) Other

[Answer]: A — Keeps the entry form simple/consistent; type-specific depth is gathered by the AI's clarifying questions where it's most natural.

## Question 5 — Switch type after answering
A) Type fixed at creation in MVP (create a new project to change type)
B) Allow switching after answering, discarding/keeping prior answers
X) Other

[Answer]: A — Switching mid-flow adds state-migration complexity for little MVP value; the vision lists early-switch as full-vision, not MVP.

## Question 6 — Feedback scale for "ready to use with AI"
A) 3-point: Yes / Minor edits / Major edits (post-approval)
B) 5-point Likert
X) Other

[Answer]: A — Lightweight, maps directly to the success metric ("ready to use with AI or only minor edits"), low friction.

## Question 7 — Copy-ready "AI Prompt" section
A) Yes — include a "Ready-to-Use AI Prompt" section for non-dev types
B) No — full brief only
X) Other

[Answer]: A — Directly serves the product's core purpose (a document that doubles as a high-quality prompt).

## Question 8 — Presentation brief output optimization
A) Ask the user (outline / full slide copy / speaker notes / let AI choose); always include slide-by-slide + speaker-notes guidance
B) Fix one output format
X) Other

[Answer]: A — Presentations vary; a clarifying question tailors the emphasis while keeping a complete structure.

## Question 9 — Examples per type
A) Show 2–3 short example use cases per type in the selector
B) No examples
X) Other

[Answer]: A — Examples are the cheapest, highest-impact way to reduce selection confusion (a top vision risk).

## Question 10 — Criteria to add future types
A) Document criteria now (distinct need, repeatable sections, human+AI usable, measurable); don't build new types in MVP
B) Build Research/Spreadsheet now
X) Other

[Answer]: A — Matches the vision's phased expansion; MVP proves the pattern with 3 types.

## Question 11 — Show type in history
A) Show type as a label on cards + workspace header; defer filtering
B) Full filtering/grouping by type
X) Other

[Answer]: A — Labeling is enough for MVP identification; filtering is deferrable.

## Question 12 — Compliance / confidentiality note
A) Add a brief non-blocking note that idea text is sent to the configured AI provider
B) Full compliance/data-handling workflow
X) Other

[Answer]: A — Reinforces existing privacy disclosure (NFR-9) without heavy process.

---

## Extension Opt-In: Security Baseline
Should security extension rules be enforced for this feature?

A) Yes — enforce all SECURITY rules as blocking constraints
B) No — skip
X) Other

[Answer]: A — Consistent with v1; the feature touches input validation and persisted data, so security stays blocking.

## Extension Opt-In: Property-Based Testing
A) Yes — enforce all PBT rules
B) Partial — pure functions + serialization round-trips
C) No
X) Other

[Answer]: B — Consistent with v1; the new pure pieces (type registry selection, per-type prompt building, back-compat deserialization) are strong PBT targets.
