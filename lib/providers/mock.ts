// Deterministic provider — lets the whole app run and be tested WITHOUT an API key.
// Produces type-appropriate clarifying questions and a type-appropriate document
// for every DocumentType (dev vision / business brief / presentation brief).

import type { Question, StageResult } from '../engine/types';
import type { AiProvider, StageInput, StageMode } from './provider';

// A single-quoted string holding three backticks — used to emit fenced code
// blocks inside template literals without terminating them.
const FENCE = '```';

function other(): Question['options'][number] {
  return { key: 'X', label: 'Other (please describe)', isOther: true };
}

// ---------- Development Vision Document ----------
const VISION_QUESTIONS: Question[] = [
  {
    id: 'v1',
    text: 'Who is the primary user of this product?',
    options: [
      { key: 'A', label: 'Everyday consumers' },
      { key: 'B', label: 'Businesses / teams' },
      { key: 'C', label: 'Internal / yourself' },
      other(),
    ],
  },
  {
    id: 'v2',
    text: 'What is the single most important outcome it should deliver?',
    options: [
      { key: 'A', label: 'Save people time' },
      { key: 'B', label: 'Make or save money' },
      { key: 'C', label: 'Reduce errors / risk' },
      { key: 'D', label: 'Delight / engagement' },
      other(),
    ],
  },
  {
    id: 'v3',
    text: 'How big should the first version (MVP) be?',
    options: [
      { key: 'A', label: 'One core flow, done well' },
      { key: 'B', label: 'A handful of flows' },
      { key: 'C', label: 'Broad from day one' },
      other(),
    ],
  },
];

const MORE_QUESTIONS: Question[] = [
  {
    id: 'm1',
    text: 'What is the riskiest assumption behind this idea?',
    options: [
      { key: 'A', label: 'People actually want it' },
      { key: 'B', label: 'We can build it well' },
      { key: 'C', label: 'People will pay for it' },
      other(),
    ],
  },
  {
    id: 'm2',
    text: 'What does success look like 6 months after launch?',
    options: [
      { key: 'A', label: 'A loyal core of regular users' },
      { key: 'B', label: 'Revenue / paying customers' },
      { key: 'C', label: 'Proof for the next decision' },
      other(),
    ],
  },
];

// ---------- Business / General AI Task Brief ----------
const BUSINESS_QUESTIONS: Question[] = [
  {
    id: 'b1',
    text: 'What is the single deliverable you want the AI to produce?',
    options: [
      { key: 'A', label: 'An email or message' },
      { key: 'B', label: 'A short document / memo' },
      { key: 'C', label: 'A plan or checklist' },
      { key: 'D', label: 'A summary of something' },
      other(),
    ],
  },
  {
    id: 'b2',
    text: 'Who is the audience for the output?',
    options: [
      { key: 'A', label: 'Customers' },
      { key: 'B', label: 'Internal team / colleagues' },
      { key: 'C', label: 'Leadership / executives' },
      { key: 'D', label: 'External partners' },
      other(),
    ],
  },
  {
    id: 'b3',
    text: 'What tone should it strike?',
    options: [
      { key: 'A', label: 'Friendly and approachable' },
      { key: 'B', label: 'Formal and professional' },
      { key: 'C', label: 'Concise and direct' },
      other(),
    ],
  },
];

const BUSINESS_MORE: Question[] = [
  {
    id: 'bm1',
    text: 'What must the AI avoid?',
    options: [
      { key: 'A', label: 'Jargon' },
      { key: 'B', label: 'Over-promising' },
      { key: 'C', label: 'Being long-winded' },
      other(),
    ],
  },
  {
    id: 'bm2',
    text: 'What does a great result look like?',
    options: [
      { key: 'A', label: 'Ready to send as-is' },
      { key: 'B', label: 'A strong first draft' },
      { key: 'C', label: 'A few options to choose from' },
      other(),
    ],
  },
];

// ---------- Presentation / PowerPoint Brief ----------
const PRESENTATION_QUESTIONS: Question[] = [
  {
    id: 'p1',
    text: 'Who is the audience?',
    options: [
      { key: 'A', label: 'Executives / leadership' },
      { key: 'B', label: 'Customers / prospects' },
      { key: 'C', label: 'Internal team' },
      { key: 'D', label: 'Training attendees' },
      other(),
    ],
  },
  {
    id: 'p2',
    text: 'What action should the audience take afterward?',
    options: [
      { key: 'A', label: 'Approve / decide' },
      { key: 'B', label: 'Buy / commit' },
      { key: 'C', label: 'Learn / apply something' },
      { key: 'D', label: 'Align / agree' },
      other(),
    ],
  },
  {
    id: 'p3',
    text: 'How long should the deck be?',
    options: [
      { key: 'A', label: 'About 5 slides' },
      { key: 'B', label: 'About 10 slides' },
      { key: 'C', label: 'About 20 slides' },
      other(),
    ],
  },
  {
    id: 'p4',
    text: 'What output do you want?',
    options: [
      { key: 'A', label: 'Slide outline' },
      { key: 'B', label: 'Full slide copy' },
      { key: 'C', label: 'Speaker notes' },
      { key: 'D', label: 'Let the AI choose' },
      other(),
    ],
  },
];

const PRESENTATION_MORE: Question[] = [
  {
    id: 'pm1',
    text: 'What visual style fits best?',
    options: [
      { key: 'A', label: 'Clean and minimal' },
      { key: 'B', label: 'Data-rich' },
      { key: 'C', label: 'Bold and visual' },
      other(),
    ],
  },
  {
    id: 'pm2',
    text: 'What is the core message in one line?',
    options: [
      { key: 'A', label: 'We should invest / proceed' },
      { key: 'B', label: "We're on track" },
      { key: 'C', label: "Here's how it works" },
      other(),
    ],
  },
];

function questionsFor(input: StageInput): Question[] {
  const more = input.answers.length > 0;
  if (input.documentType === 'business-brief') return more ? BUSINESS_MORE : BUSINESS_QUESTIONS;
  if (input.documentType === 'presentation-brief') return more ? PRESENTATION_MORE : PRESENTATION_QUESTIONS;
  return more ? MORE_QUESTIONS : VISION_QUESTIONS;
}

function answersBlock(input: StageInput): string {
  if (!input.answers.length) return '';
  const lines = input.answers.map((a) => {
    const q = input.askedQuestions.find((x) => x.id === a.questionId);
    const labels = a.selectedKeys.map((k) => q?.options.find((o) => o.key === k)?.label ?? k).join(', ');
    const extra = a.otherText ? ` — ${a.otherText}` : '';
    return `- **${q?.text ?? a.questionId}** → ${labels}${extra}`;
  });
  return `\n\n> **Decisions captured**\n${lines.join('\n')}`;
}

function feedbackBlock(input: StageInput): string {
  if (!input.feedback.length) return '';
  return `\n\n> **Revisions applied:** ${input.feedback.join('; ')}`;
}

const mockNote = '\n\n_(Generated by the Mock provider — add an API key in Settings for full AI generation.)_';

function visionMarkdown(input: StageInput): { title: string; markdown: string; summary: string } {
  const idea = input.project.idea.trim();
  const name = input.project.name;
  const extras = answersBlock(input) + feedbackBlock(input);
  return {
    title: `Vision Document — ${name}`,
    summary: `Vision Document drafted for "${name}".`,
    markdown: `# Vision Document — ${name}

## Executive Summary
${name} is a product that addresses: _${idea}_. It serves its target users by delivering a focused, well-scoped first version with a clear path to growth.

## Business Context
### Problem Statement
${idea}

### Business Drivers
The opportunity is timely and the core flow is achievable as an MVP.

### Target Users and Stakeholders
| User Type | Description | Primary Need |
|---|---|---|
| Primary user | The main beneficiary of the idea | A simple way to achieve the core outcome |
| Stakeholder | The owner/sponsor | A credible plan and a working MVP |

### Success Metrics
| Metric | Current State | Target State | Measurement Method |
|---|---|---|---|
| Core task completion | n/a | Users complete the core flow | In-app analytics |

## Full Scope Vision
### Product Vision Statement
A complete, delightful realization of: _${idea}_.

### Feature Areas
- **Core capability** — the heart of the idea. *User value:* gets the job done.
- **Supporting features** — onboarding, history, settings.

### User Journeys (Full Vision)
1. User arrives → 2. completes the core flow → 3. sees the outcome → 4. returns.

## MVP Scope
### MVP Objective
Prove the core flow delivers value.

### MVP Success Criteria
- [ ] A user can complete the core flow end-to-end
- [ ] The result is correct and useful

### Features In Scope (MVP)
| Feature | Description | Priority | Rationale |
|---|---|---|---|
| Core flow | The minimal path to value | Must Have | Validates the hypothesis |

### Features Explicitly Out of Scope (MVP)
| Feature | Reason for Deferral | Target Phase |
|---|---|---|
| Advanced features | Not needed to validate | Phase 2 |

### MVP Definition of Done
- [ ] Core flow works and is tested
- [ ] Deployable/runnable

## Risks and Dependencies
### Key Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Unclear demand | Medium | High | Ship MVP, measure |

### Open Questions
- [ ] What is the precise success metric target?${extras}${mockNote}`,
  };
}

function businessMarkdown(input: StageInput): { title: string; markdown: string; summary: string } {
  const idea = input.project.idea.trim();
  const name = input.project.name;
  const extras = answersBlock(input) + feedbackBlock(input);
  return {
    title: `AI Task Brief — ${name}`,
    summary: `AI Task Brief drafted for "${name}".`,
    markdown: `# AI Task Brief — ${name}

## Executive Summary
This brief turns the request _"${idea}"_ into clear instructions an AI tool can act on to produce a usable first draft.

## Objective
Produce the following for the user: ${idea}

## Business Context
This is everyday business work; the output should be relevant, on-tone, and ready to use with minimal editing.

## Target Audience
The intended readers of the AI's output (see captured decisions below).

## Inputs and Source Material
Work from the idea text and the answers below. If something essential is missing, ask for it — do not invent facts.

## Deliverables
A clear, well-formatted deliverable in the requested format, length, and tone.

## AI Instructions
1. Read the objective, audience, tone, and constraints below.
2. Produce the deliverable in the requested format.
3. Be specific and concise; do not invent facts or sources.
4. If essential information is missing, state your assumptions or ask.

## Do / Do Not
- **Do:** match the audience and tone; be concrete; stay in scope.
- **Do Not:** add filler; over-promise; include data that wasn't provided.

## Constraints and Exclusions
Respect the tone, length, and limits captured below. Anything not requested is out of scope.

## Review / Acceptance Criteria
- [ ] Addresses the stated objective
- [ ] Correct audience and tone
- [ ] Correct format and length
- [ ] Contains no invented facts

## Ready-to-Use AI Prompt
${FENCE}
You are helping with this task: ${idea}
Audience and tone: see the decisions below.
Produce the deliverable described above in the requested format. Be specific and concise,
do not invent facts, and ask for anything essential that is missing.
${FENCE}${extras}${mockNote}`,
  };
}

function presentationMarkdown(input: StageInput): { title: string; markdown: string; summary: string } {
  const idea = input.project.idea.trim();
  const name = input.project.name;
  const extras = answersBlock(input) + feedbackBlock(input);
  return {
    title: `Presentation Brief — ${name}`,
    summary: `Presentation Brief drafted for "${name}".`,
    markdown: `# Presentation Brief — ${name}

## Presentation Overview
A presentation about _"${idea}"_. Output format follows your stated preference (slide outline, full slide copy, or speaker notes).

## Audience and Desired Action
The intended audience and the one decision/action you want from them (see decisions below).

## Core Message
The single idea the audience must remember about: ${idea}.

## Narrative Structure
- Situation — where things stand today
- Complication — why it matters / what's at stake
- Resolution — the proposal or insight
- Ask — the action you want

## Slide-by-Slide Direction
1. **Title** — topic, presenter, date.
2. **Why this matters** — the situation and stakes.
3. **The core message** — your one-line takeaway.
4. **Detail / evidence** — the key supporting points.
5. **The ask** — the action and next steps.

## Visual and Data Guidance
Keep slides clean; one idea per slide; use a chart only where it clarifies a number; consistent branding.

## Speaker Notes Guidance
For each slide, note the one point to land verbally; open with the stakes and close on the ask.

## AI Instructions
1. Use the audience, desired action, core message, and slide count below.
2. Produce the requested output (outline / full slide copy / speaker notes).
3. Tie every slide to the core message and the ask.
4. Do not fabricate data — use the user's data or ask for it.

## Acceptance Criteria
- [ ] Clear core message and ask
- [ ] Right audience and tone
- [ ] Logical slide flow within the requested length
- [ ] Presentation-ready

## Ready-to-Use AI Prompt
${FENCE}
Create a presentation about: ${idea}
Audience, desired action, slide count, and output format: see the decisions below.
Build the requested output, tie every slide to the core message and the ask, keep it concise,
and do not invent data — ask for anything essential that is missing.
${FENCE}${extras}${mockNote}`,
  };
}

function documentFor(input: StageInput): { title: string; markdown: string; summary: string } {
  if (input.documentType === 'business-brief') return businessMarkdown(input);
  if (input.documentType === 'presentation-brief') return presentationMarkdown(input);
  return visionMarkdown(input);
}

export class MockProvider implements AiProvider {
  id = 'mock' as const;

  async runStage(input: StageInput, mode: StageMode): Promise<StageResult> {
    if (mode === 'questions') {
      return { kind: 'questions', questions: questionsFor(input) };
    }
    const a = documentFor(input);
    return { kind: 'artifact', title: a.title, markdown: a.markdown, summary: a.summary };
  }

  async runStageStream(input: StageInput, mode: StageMode, onText: (t: string) => void): Promise<StageResult> {
    if (mode === 'questions') {
      return { kind: 'questions', questions: questionsFor(input) };
    }
    const a = documentFor(input);
    for (let i = 0; i < a.markdown.length; i += 60) onText(a.markdown.slice(i, i + 60));
    return { kind: 'artifact', title: a.title, markdown: a.markdown, summary: a.summary };
  }

  async testConnection(): Promise<void> {
    // The Mock provider is always available (no network, no key).
  }
}
