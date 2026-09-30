// ─────────────────────────────────────────────────────────────
// Subject lock. The subject is a hard filter, not a label.
//
// itemFitsSubject(item, subject) is used twice:
//   1. when a mission is built (server generator + demo bank) — misfits are
//      dropped and regenerated/redrawn, never relabeled
//   2. right before a question renders — misfits are skipped and logged
//
// No new taxonomy: lexicons are keyed by the existing course labels in
// courses.ts (DEFAULT_COURSES). An item is compared only against its own
// learner's course list, so Science 7 never competes with Environmental
// Science A, and PE is judged against JO's other I-35 subjects.
// ─────────────────────────────────────────────────────────────
import { DEFAULT_COURSES } from './courses';

/**
 * Distinct-term vocabularies. Entries match as word prefixes ("orbit" → orbits, orbital).
 * A trailing "!" marks a signature term that counts double — one "moon" is enough to
 * flag a PE stem even when the concept line isn't available (render-time check).
 */
const LEXICON: Record<string, string[]> = {
  // ── Booty · ICA 11 ──
  'English 11 A': [
    'thesis!', 'claim', 'counterclaim!', 'argument', 'evidence', 'conclu', 'synthes!', 'source', 'rhetoric!', 'audience',
    'purpose', 'tone', 'style', 'paragraph', 'essay!', 'explanatory!', 'informational', 'passage', 'author',
    'reader', 'sentence', 'revis', 'formal', 'word choice', 'transition', 'summar', 'quote', 'cite',
  ],
  'Algebra 2 A': [
    'polynomial!', 'binomial!', 'trinomial!', 'monomial', 'factor', 'expand', 'degree', 'coefficient', 'quadratic!',
    'cubic', 'identity', 'remainder theorem', 'successive difference', 'like terms', 'leading term', 'constant term',
    'x^', 'p(x)', 'f(x)', 'equation', 'expression', 'simplif', 'distribut',
  ],
  'Environmental Science A': [
    'water cycle!', 'watershed!', 'groundwater', 'aquifer!', 'evaporat', 'condens', 'precipitat', 'transpir', 'runoff',
    'erosion', 'ecosystem', 'species', 'domestic', 'wild', 'habitat', 'pollut', 'nitrate', 'soil', 'river', 'climate',
    'biodivers', 'carbon', 'wetland', 'drainage', 'cover crop', 'environment', 'organism', 'population',
  ],
  'High School Health': [
    'health', 'risk', 'responsib', 'decision', 'stress', 'sleep', 'wellness', 'well-being', 'advoca', 'influence',
    'behavior', 'habit', 'mental', 'emotional', 'social', 'nutrition', 'hygiene', 'substance', 'refusal', 'peer',
  ],
  'Marketing Foundations 1 A': [
    'product', 'service', 'brand', 'market', 'segment', 'customer', 'consumer', 'price', 'pricing', 'promot',
    'advertis', 'target', 'competitor', 'business', 'sales', 'retail', 'intangible', 'logo', 'demand',
  ],
  'Personal Finance': [
    'credit', 'creditor!', 'loan', 'interest', 'apr!', 'debt', 'budget', 'installment', 'revolving', 'bank', 'card',
    'payment', 'saving', 'borrow', 'lender', 'mortgage', 'balance', 'income', 'expense', 'paycheck', 'invest',
  ],

  // ── JO · I-35 · Grade 7 ──
  'Language Arts 7': [
    'evidence', 'theme', 'central idea!', 'narrator!', 'author', 'point of view', 'argument', 'claim', 'paragraph',
    'sentence', 'verb', 'noun', 'adjective', 'text', 'passage', 'poem', 'stanza!', 'excerpt', 'character', 'plot',
    'reader', 'word choice', 'cite', 'explanatory', 'story', 'setting',
  ],
  'Math 7': [
    'equation', 'solve', 'variable', 'integer!', 'negative', 'fraction', 'decimal', 'ratio', 'proportion',
    'unit rate', 'percent', 'number line!', 'rational', 'scale drawing', 'slope', 'coefficient', 'expression',
    'x =', 'sum', 'product of', 'quotient', 'distributive', 'inequalit', 'absolute value', 'per hour', 'per minute',
  ],
  'Science 7': [
    'moon!', 'lunar!', 'sun', 'solar', 'earth', 'orbit!', 'planet!', 'gravit', 'eclipse!', 'phase', 'tide', 'star',
    'telescope!', 'newton!', 'force', 'mass', 'accelerat', 'velocity', 'momentum', 'kinetic', 'energy', 'collision',
    'collide', 'friction', 'rocket', 'atom', 'molecule', 'cell', 'organism', 'plant', 'pollinat', 'seed',
    'reproduc', 'ecosystem', 'species', 'experiment', 'hypothes', 'jupiter!', 'europa!', 'asteroid!', 'crater',
    'season', 'axis', 'tilt', 'spacecraft', 'astronaut', 'third law!', 'equal and opposite', 'opposite direction',
    'opposite in direction', 'exert', 'reaction force', 'recoil', 'motion',
  ],
  'Social Studies 7': [
    'map', 'region', 'continent!', 'country', 'countries', 'europe', 'north america', 'globaliz!', 'trade', 'export',
    'import', 'government', 'organization', 'united nations!', 'culture', 'economy', 'economic', 'primary source',
    'inquiry', 'border', 'capital', 'latitude', 'longitude', 'supply chain', 'nation', 'mountain range', 'river system',
  ],
  Health: [
    'health', 'decision', 'risk', 'hazard', 'sleep', 'stress', 'nutrition', 'choice', 'influence', 'wellness',
    'habit', 'emotion', 'hygiene', 'peer', 'screen time', 'mental', 'refusal',
  ],
  'Physical Education': [
    'warm-up', 'warm up', 'cool-down', 'cool down', 'stretch', 'heart rate!', 'pulse', 'fitness', 'exercise',
    'muscle', 'cardio', 'aerobic', 'endurance', 'flexib', 'strength', 'drill', 'team', 'sportsmanship!', 'referee',
    'foul', 'game', 'dribbl', 'serve', 'volley', 'sprint', 'jog', 'jump', 'throw', 'catch', 'basketball!',
    'soccer!', 'football', 'baseball', 'softball', 'relay', 'hydrat', 'injur', 'safety', 'overload', 'specificity',
    'reps', 'sets', 'coach', 'practice', 'agility', 'balance', 'coordination', 'athlete', 'sport', 'gym', 'pickleball',
    'defense', 'offense', 'rules of', 'scoring', 'recovery', 'workout', 'pace', 'lap',
  ],
  'Music / Band': [
    'rhythm!', 'beat', 'tempo!', 'melody', 'harmony', 'chord!', 'major', 'minor', 'note', 'dynamics', 'forte',
    'time signature!', 'measure', 'band', 'instrument', 'pitch', 'rest', 'staff', 'clef', 'crescendo', 'song', 'music',
  ],
  Art: [
    'color', 'colour', 'hue', 'value', 'contrast', 'perspective!', 'vanishing point!', 'composition', 'texture',
    'sketch', 'paint', 'drawing', 'shading', 'focal point', 'horizon line', 'artist', 'artwork', 'palette', 'canvas',
  ],
};

/** Which learner list a label belongs to (Booty's or JO's), or null for custom subjects. */
function peersOf(subject: string): string[] | null {
  for (const list of Object.values(DEFAULT_COURSES)) if (list.includes(subject)) return list;
  return null;
}

type Checkable = { prompt: string; choices?: string[]; acceptable?: string[]; concept?: string; fact?: string; topicLabel?: string };

function textOf(item: Checkable): string {
  return [item.prompt, ...(item.choices ?? []), item.concept ?? '', item.topicLabel ?? '', item.fact ?? '']
    .join(' \n ')
    .toLowerCase();
}

const cache = new Map<string, RegExp>();
function termRe(term: string): RegExp {
  let re = cache.get(term);
  if (!re) {
    const esc = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // word-start boundary; prefix match so "orbit" hits "orbital"
    re = new RegExp(`(^|[^a-z0-9])${esc}`, 'i');
    cache.set(term, re);
  }
  return re;
}

// Symbolic math (x^2, (2x − 3)^2, 2x − 7 = −15, 3/4, −3 − (−8), 123 × 45) is strong evidence on its own.
const MATH_NOTATION = /[a-z]\^-?\d|\)\^-?\d|\d[a-z]\s*[=+−-]|[a-z]\s*=\s*[−-]?\d|[−-]\d+\s*[−-]\s*\(|\d\s*[×÷]\s*\d|\b\d+\/\d+\b/;
const MATH_SUBJECTS = new Set(['Algebra 2 A', 'Math 7']);

function hits(text: string, subject: string): number {
  let n = 0;
  for (const t of LEXICON[subject]) {
    const strong = t.endsWith('!');
    if (termRe(strong ? t.slice(0, -1) : t).test(text)) n += strong ? 2 : 1;
  }
  if (MATH_SUBJECTS.has(subject) && MATH_NOTATION.test(text)) n += 2;
  return n;
}

export type SubjectVerdict = { fits: boolean; own: number; rival?: string; rivalHits: number };

/**
 * Score the item against its own subject and every other subject on the same
 * learner's list. It fails when another subject owns it: at least 2 distinct
 * rival terms and more rival evidence than own-subject evidence.
 * Custom ("Other") subjects have no lexicon and always pass.
 */
export function subjectVerdict(item: Checkable, subject: string): SubjectVerdict {
  const peers = peersOf(subject);
  const ownTerms = LEXICON[subject];
  if (!peers || !ownTerms) return { fits: true, own: 0, rivalHits: 0 };
  const text = textOf(item);
  // The concept / topic label names what the item actually tests, so it counts twice for its own subject.
  // (An English item may carry an environmental passage; its concept is still "conclusion vs summary".)
  const concept = `${item.concept ?? ''} ${item.topicLabel ?? ''}`.toLowerCase();
  const own = hits(text, subject) + (concept.trim() ? hits(concept, subject) : 0);
  let rival: string | undefined;
  let rivalHits = 0;
  for (const other of peers) {
    if (other === subject || !LEXICON[other]) continue;
    const h = hits(text, other);
    if (h > rivalHits) {
      rivalHits = h;
      rival = other;
    }
  }
  const fits = !(rivalHits >= 2 && rivalHits > own);
  return { fits, own, rival, rivalHits };
}

export function itemFitsSubject(item: Checkable, subject: string): boolean {
  return subjectVerdict(item, subject).fits;
}

/** Human-readable reason, for logs and generator retry feedback. */
export function misfitReason(item: Checkable, subject: string): string {
  const v = subjectVerdict(item, subject);
  return `reads as ${v.rival ?? 'another subject'} (${v.rivalHits} ${v.rival ?? ''} terms vs ${v.own} ${subject} terms), not ${subject}`;
}

/** The one-line lock the generator prompt carries for listed subjects. */
export function subjectLockLine(subject: string): string {
  if (subject === 'Physical Education')
    return 'SUBJECT LOCK — Physical Education: every stem, choice, and the Deep Orbit is about the body, fitness, rules of a game, sportsmanship, safety, or a drill. No astronomy, no fractions or equations, no history, no literature. A PE item may use a number (heart rate, laps), but the idea being tested must be PE.';
  return `SUBJECT LOCK — ${subject}: every stem, choice, and the Deep Orbit must be a ${subject} item. Nothing from another class — if it would belong on a different subject's quiz, it doesn't belong here.`;
}
