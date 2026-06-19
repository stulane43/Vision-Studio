// ============================================================
// Document-type registry — the single source of truth for the kinds of
// document Vision Studio can generate. Each entry supplies everything the
// rest of the app needs to behave correctly for that type: UI copy, the
// artifact filename/title, the AI's role, the clarifying-question guidance,
// and the required output structure (from visionGuide.ts).
//
// Adding a future type = one entry here + a guide constant + a Mock branch.
// PURE (no I/O) — property-testable.
// ============================================================

import type { DocumentType } from '../engine/types';
import { DEFAULT_DOCUMENT_TYPE } from '../engine/types';
import { VISION_GUIDE, BUSINESS_BRIEF_GUIDE, PRESENTATION_BRIEF_GUIDE } from './visionGuide';

export interface DocumentTypeDef {
  id: DocumentType;
  label: string; // user-facing name
  chipLabel: string; // very short label for cards/pills
  shortDescription: string; // plain-language one-liner for the selector
  examples: string[]; // 2-3 example use cases for the selector
  recommendedFallback?: boolean; // shown as the "not sure?" recommendation
  artifactFileName: string; // project-relative output file
  artifactTitle: string; // default title/H1 hint
  systemRole: string; // the AI's persona for this type
  questionGuidance: string; // what to ask in 'questions' mode
  structureGuide: string; // required sections in 'artifact' mode
  isDev: boolean; // development-oriented (vs. business) — controls AI-prompt extras
}

const DEFS: Record<DocumentType, DocumentTypeDef> = {
  'dev-vision': {
    id: 'dev-vision',
    label: 'Development Vision Document',
    chipLabel: 'Dev Vision',
    shortDescription: 'Turn a software or product idea into a structured vision — scope, MVP, risks, open questions.',
    examples: [
      'A mobile app that reminds surfers of the best tide windows',
      'A SaaS tool for invoice reconciliation',
      'An internal dashboard for a support team',
    ],
    artifactFileName: 'vision-document.md', // unchanged → no regression for existing projects
    artifactTitle: 'Vision Document',
    systemRole: 'You are an expert product strategist who writes excellent Vision Documents.',
    questionGuidance:
      'Ask 3-5 GENUINELY idea-specific questions whose answers would most shape the Vision Document — e.g. the primary users, the single most important outcome, how big the MVP should be, the riskiest assumption, and how success is measured.',
    structureGuide: VISION_GUIDE,
    isDev: true,
  },
  'business-brief': {
    id: 'business-brief',
    label: 'Business / General AI Task Brief',
    chipLabel: 'Business Brief',
    shortDescription: 'Turn a business task into clear AI instructions that produce a usable first draft.',
    examples: [
      'Draft a customer email about a policy change',
      'Summarize a long report into 5 key points',
      'Create a 30-day onboarding plan for a new hire',
    ],
    recommendedFallback: true,
    artifactFileName: 'business-brief.md',
    artifactTitle: 'AI Task Brief',
    systemRole:
      'You are an expert at turning vague business requests into precise, structured AI task briefs that also work as high-quality AI prompts.',
    questionGuidance:
      'Ask 3-5 questions that most shape the brief — e.g. the exact deliverable and its format, the target audience, what inputs/source material exist, the desired tone, hard constraints, and what the AI should avoid. Keep every question answerable by a non-technical business user.',
    structureGuide: BUSINESS_BRIEF_GUIDE,
    isDev: false,
  },
  'presentation-brief': {
    id: 'presentation-brief',
    label: 'Presentation / PowerPoint Brief',
    chipLabel: 'Presentation',
    shortDescription: 'Plan a presentation — audience, message, slide-by-slide direction, and speaker notes.',
    examples: [
      'A 10-slide executive update with a recommendation',
      'A sales pitch deck for a new product',
      'A training session on a new internal process',
    ],
    artifactFileName: 'presentation-brief.md',
    artifactTitle: 'Presentation Brief',
    systemRole:
      'You are an expert presentation strategist who plans clear, persuasive decks and writes briefs that double as AI prompts.',
    questionGuidance:
      'Ask 3-5 questions that most shape the deck — e.g. the audience and the decision/action you want from them, the core message, the slide count/length, the required topics, what source material/data exists, the visual style/tone, and the preferred output format (slide outline / full slide copy / speaker notes). Keep every question answerable by a non-designer.',
    structureGuide: PRESENTATION_BRIEF_GUIDE,
    isDev: false,
  },
};

// Ordered for display in the selector (Development first preserves current default).
export const DOCUMENT_TYPE_LIST: DocumentTypeDef[] = [
  DEFS['dev-vision'],
  DEFS['business-brief'],
  DEFS['presentation-brief'],
];

/** Total, safe lookup. Unknown/missing ids fall back to the default type. */
export function getDocumentType(id: string | null | undefined): DocumentTypeDef {
  if (id && Object.prototype.hasOwnProperty.call(DEFS, id)) {
    return DEFS[id as DocumentType];
  }
  return DEFS[DEFAULT_DOCUMENT_TYPE];
}
