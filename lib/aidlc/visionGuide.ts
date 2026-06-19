// Condensed Vision Document structure (from vision-document-guide.md), embedded
// so the app's vision generation stays faithful to the methodology (FR-23).

export const VISION_GUIDE = `A Vision Document MUST use these sections, in this order:

## Executive Summary
3-5 sentences: what it is, who it serves, why it exists, the expected measurable outcome.

## Business Context
### Problem Statement (concrete, not "improve efficiency")
### Business Drivers (why now)
### Target Users and Stakeholders (a markdown table: User Type | Description | Primary Need)
### Business Constraints
### Success Metrics (a markdown table: Metric | Current State | Target State | Measurement Method)

## Full Scope Vision
### Product Vision Statement (the aspirational end-state)
### Feature Areas (group features; for each: Description, Key Capabilities, User Value)
### Integration Points
### User Journeys (Full Vision) (2-3 end-to-end journeys)
### Scalability and Growth

## MVP Scope
### MVP Objective (1-2 sentences)
### MVP Success Criteria (checkbox list)
### Features In Scope (MVP) (table: Feature | Description | Priority | Rationale)
### Features Explicitly Out of Scope (MVP) (table: Feature | Reason for Deferral | Target Phase)
### MVP User Journeys
### MVP Constraints and Assumptions
### MVP Definition of Done (checkbox list)

## Risks and Dependencies
### Key Risks (table: Risk | Likelihood | Impact | Mitigation)
### External Dependencies
### Open Questions (checkbox list — these feed Requirements Analysis)

Writing rules: be specific and measurable; clearly separate Full Vision from MVP; include
"out of scope" lists; avoid vague marketing words ("seamless", "world-class"); state
assumptions explicitly; do not list implementation technologies in the vision.`;

// Business / General AI Task Brief — a structured brief that doubles as a high-quality AI prompt.
export const BUSINESS_BRIEF_GUIDE = `A Business / General AI Task Brief MUST use these sections, in this order:

## Executive Summary
2-4 sentences: the task, who it's for, and what a great result looks like.

## Objective
The single, concrete outcome the AI should produce (one short paragraph or a bullet).

## Business Context
Why this matters now and any background the AI needs to be relevant.

## Target Audience
Who will read/use the AI's output (role, knowledge level, what they care about).

## Inputs and Source Material
What the AI should work from (data, documents, facts, links described in text). If none, say "none provided".

## Deliverables
The exact output(s) expected and their FORMAT (e.g., email, 1-page memo, table, checklist, plan), including approximate length and tone/style.

## AI Instructions
Direct, imperative instructions telling the AI HOW to use this brief and produce the deliverable (step-by-step if helpful). Tell it to ask for missing info only if critical.

## Do / Do Not
Two short bullet lists: "Do" (must include / must respect) and "Do Not" (avoid, exclude, never do).

## Constraints and Exclusions
Hard limits: tone, length, sources, compliance, things explicitly out of scope.

## Review / Acceptance Criteria
A checkbox list the user (or AI) can use to judge whether the output is complete and correct.

## Ready-to-Use AI Prompt
A single, self-contained, copy-paste prompt (inside a fenced code block) that an AI tool can act on directly — it must restate objective, audience, key inputs, deliverable format, and the most important do/do-not rules.

Writing rules: be specific and practical; write for a non-technical business reader; prefer concrete instructions over theory; never invent facts not supplied in the idea/answers — instead instruct the AI to request them.`;

// Presentation / PowerPoint Creation Brief — plans a deck and doubles as an AI prompt.
export const PRESENTATION_BRIEF_GUIDE = `A Presentation / PowerPoint Creation Brief MUST use these sections, in this order:

## Presentation Overview
2-4 sentences: the presentation's purpose, occasion, and the desired output format (slide outline, full slide copy, or speaker notes — use the user's stated preference).

## Audience and Desired Action
Who is in the room and the ONE decision or action you want them to take.

## Core Message
The single sentence the audience must remember.

## Narrative Structure
The story arc (e.g., Situation → Complication → Resolution → Ask) in a few bullets.

## Slide-by-Slide Direction
A numbered list of slides. For EACH slide: a working title, its purpose/main point, and a note on suggested content or visual. Respect the requested slide count.

## Visual and Data Guidance
Guidance on charts, imagery, data to show, and overall visual style/branding.

## Speaker Notes Guidance
What the presenter should say or emphasize per section (high level, not a full script unless asked).

## AI Instructions
Imperative instructions telling an AI tool how to turn this brief into the requested output (outline / full slides / speaker notes), and to flag any missing inputs.

## Acceptance Criteria
A checkbox list for clarity, audience relevance, structure, and presentation-readiness.

## Ready-to-Use AI Prompt
A single, self-contained, copy-paste prompt (inside a fenced code block) an AI tool can act on directly — restating audience, desired action, core message, slide count, output format, and tone.

Writing rules: be concrete about the slide flow; tie every slide to the core message and desired action; write for a non-designer; never fabricate data — instruct the AI to use the user's data or request it.`;
