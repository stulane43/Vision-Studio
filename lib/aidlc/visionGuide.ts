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
