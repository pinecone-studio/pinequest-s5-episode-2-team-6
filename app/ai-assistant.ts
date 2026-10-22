/** A local, offline assistant for the atlas.
 *
 * The app ships as a static site with no API keys, so "Ask AI" is answered by a
 * deterministic engine that reads the same reference data the interface shows:
 * the structure notes, the bone and structure atlases and the system list.
 * Every reply is grounded in the atlas and can drive the 3D model. */

import {SYSTEMS,explanation,type Atlas,type Concept,type SystemId,type View} from './anatomy';
import {resolveBoneAtlas} from './bone-atlas';
import {resolveStructureAtlas} from './structure-atlas';
import {resolveStructureFact,type StructureFact} from './structure-facts';

export interface AssistantSelection {
  name: string;
  system: SystemId;
  conceptId: string;
  elements: string[];
}

export interface AssistantContext {
  atlas: Atlas;
  selection: AssistantSelection | null;
}

export type AssistantAction =
  | {kind: 'view'; view: View; label: string}
  | {kind: 'highlight'; ids: string[]; label: string; select?: boolean}
  | {kind: 'isolate'; ids: string[]; label: string}
  | {kind: 'labels'; on: boolean; label: string}
  | {kind: 'quiz'; label: string}
  | {kind: 'tour'; tour: string; label: string};

export interface AssistantReply {
  text: string;
  actions: AssistantAction[];
}

/** Named groups that a question can point at instead of a single concept. */
export const TOPIC_GROUPS: {id: string; label: string; members: string[]}[] = [
  {
    id: 'rotator cuff',
    label: 'rotator cuff',
    members: ['supraspinatus', 'infraspinatus', 'teres minor', 'subscapularis'],
  },
  {
    id: 'blood flow',
    label: 'blood flow',
    members: ['heart', 'ascending aorta', 'arch of aorta', 'descending aorta', 'pulmonary artery', 'pulmonary vein', 'superior vena cava', 'inferior vena cava'],
  },
  {
    id: 'shoulder',
    label: 'shoulder',
    members: ['humerus', 'scapula', 'clavicle', 'deltoid', 'supraspinatus', 'infraspinatus', 'teres minor', 'subscapularis'],
  },
  {
    id: 'knee',
    label: 'knee',
    members: ['femur', 'tibia', 'fibula', 'patella', 'medial meniscus', 'lateral meniscus', 'anterior cruciate ligament', 'posterior cruciate ligament'],
  },
  {
    id: 'elbow',
    label: 'elbow',
    members: ['humerus', 'radius', 'ulna', 'biceps brachii', 'triceps brachii', 'brachialis', 'brachioradialis'],
  },
  {
    id: 'chest',
    label: 'chest',
    members: ['heart', 'lung', 'rib', 'sternum', 'trachea', 'esophagus'],
  },
  {
    id: 'abdomen',
    label: 'abdomen',
    members: ['liver', 'stomach', 'pancreas', 'spleen', 'kidney', 'small intestine', 'large intestine'],
  },
  {
    id: 'neck',
    label: 'neck',
    members: ['sternocleidomastoid', 'trapezius', 'scalenus anterior', 'thyroid gland', 'larynx', 'hyoid bone'],
  },
];

const FILLER = [
  'please',
  'can you',
  'could you',
  'would you',
  'show me',
  'show',
  'tell me about',
  'tell me',
  'explain',
  'what is',
  'what are',
  'whats',
  'what does',
  'what do',
  'describe',
  'point at',
  'highlight',
  'find me',
  'find',
  'go to',
  'take me to',
  'where is',
  'where are',
  'which',
  'the',
  'a',
  'an',
  'of',
  'in',
  'on',
  'this',
  'that',
  'these',
  'those',
  'it',
  'its',
  'me',
  'us',
  'to',
  'about',
  'for',
  'and',
  'do',
  'does',
  'is',
  'are',
  'you',
  'i',
  'want',
  'need',
  'like',
  'let me see',
  'lets see',
  'give me',
  'give',
  'turn',
  'rotate',
  'spin',
  'view',
  'look',
  'at',
  'from',
  'behind',
  'around',
  'side',
  'back',
  'front',
];

const STOP_WORDS = new Set([
  'structure',
  'muscle',
  'bone',
  'organ',
  'nerve',
  'system',
  'atlas',
  'body',
  'human',
  'model',
  'view',
  'views',
  'anatomy',
  'anatomical',
]);

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/^(left|right)\s+/i, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripFiller(question: string): string {
  let text = normalize(question);
  for (const word of FILLER) {
    text = text.replace(new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g'), ' ');
  }
  return text.replace(/\s+/g, ' ').trim();
}

function tokenize(value: string): string[] {
  return value.split(' ').filter(token => token.length > 2 && !STOP_WORDS.has(token));
}

/** Score how well a concept answers a cleaned query. */
function scoreConcept(concept: Concept, query: string, tokens: string[]): number {
  const name = normalize(concept.name);
  if (!name) return 0;
  if (name === query) return 1000 - name.length;
  const queryTokens = query.split(' ').filter(Boolean);
  const nameTokens = name.split(' ').filter(Boolean);
  if (queryTokens.length > 1 && nameTokens.includes(query)) return 700;
  if (nameTokens.length > 1 && queryTokens.includes(name)) return 620;
  const nameSet = new Set(nameTokens);
  const hits = tokens.filter(token => nameSet.has(token)).length;
  if (!hits) return 0;
  return 40 * hits + 20 * (hits / Math.max(1, tokens.length));
}

/** Concepts in the atlas that best match a free-text query. */
export function findConcepts(atlas: Atlas, query: string, limit = 6): Concept[] {
  const cleaned = stripFiller(query);
  if (!cleaned) return [];
  const tokens = tokenize(cleaned);
  return atlas.concepts
    .map(concept => ({concept, score: scoreConcept(concept, cleaned, tokens)}))
    .filter(entry => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.concept.name.length - b.concept.name.length)
    .slice(0, limit)
    .map(entry => entry.concept);
}

/** Members of a named topic group that exist in the atlas. */
export function findGroup(atlas: Atlas, query: string): {label: string; members: Concept[]} | null {
  const cleaned = normalize(query);
  for (const group of TOPIC_GROUPS) {
    if (!cleaned.includes(group.id)) continue;
    const members = group.members
      .map(name => atlas.concepts.find(concept => normalize(concept.name) === name))
      .filter((concept): concept is Concept => !!concept);
    if (members.length) return {label: group.label, members};
  }
  return null;
}

export interface StructureBrief {
  name: string;
  latin: string;
  system: string;
  function: string;
  nerve: string;
  overview: string;
}

/** Collect everything the app knows about one structure name. */
export function describeStructure(atlas: Atlas, name: string): StructureBrief {
  const fact: StructureFact | null = resolveStructureFact(name);
  const bone = resolveBoneAtlas(name);
  const structure = resolveStructureAtlas(name);
  const concept = atlas.concepts.find(item => item.name.toLowerCase() === name.toLowerCase());
  const part =
    atlas.parts.find(item => item.name.toLowerCase() === name.toLowerCase()) ??
    (concept ? atlas.parts.find(item => item.id === concept.elements[0]) : undefined);
  const system = SYSTEMS.find(s => s.id === part?.system);
  const overview = bone?.overview ?? structure?.overview ?? explanation(name, part?.system ?? 'skeletal');
  return {
    name: bone?.title ?? structure?.title ?? concept?.name ?? name,
    latin: fact?.latin ?? bone?.latin ?? structure?.latin ?? '',
    system: system?.name ?? '',
    function: fact?.function ?? (bone || structure ? firstSentence(overview) : ''),
    nerve: fact?.nerve ?? '',
    overview,
  };
}

function firstSentence(text: string): string {
  const trimmed = text.trim();
  const stop = trimmed.indexOf('. ');
  return stop > 0 ? trimmed.slice(0, stop + 1) : trimmed;
}

/** Atlas pieces whose name mentions the given nerve, used by "show its nerve". */
export function nervePieces(atlas: Atlas, nerve: string): string[] {
  const token = normalize(nerve).split(' ')[0];
  if (!token) return [];
  return atlas.parts
    .filter(part => part.system === 'nervous' && normalize(part.name).includes(token))
    .map(part => part.id);
}

function viewIntent(question: string): View | null {
  const text = normalize(question);
  if (/\b(back|behind|rear|posterior)\b/.test(text)) return 'back';
  if (/\b(side|lateral|profile)\b/.test(text)) return 'side';
  if (/\b(front|anterior)\b/.test(text)) return 'front';
  if (/\b(three[- ]quarter|3\/4|angle|diagonal)\b/.test(text)) return 'three-quarter';
  return null;
}

function asksAboutLabels(question: string): boolean {
  const text = normalize(question);
  if (!/\b(label|labels|annotation|annotations|caption|text)\b/.test(text)) return false;
  return /\b(hide|remove|off|without)\b/.test(text) ? false : true;
}

function wantsLabelsOff(question: string): boolean {
  const text = normalize(question);
  return /\b(labels?|annotations?)\b/.test(text) && /\b(hide|remove|turn off|without)\b/.test(text);
}

function asksForQuiz(question: string): boolean {
  return /\b(quiz|test me|question me|practice)\b/.test(normalize(question));
}

function asksForTour(question: string): string | null {
  const text = normalize(question);
  if (!/\b(tour|guided|walk me through|show me around)\b/.test(text)) return null;
  const match = TOPIC_GROUPS.find(group => text.includes(group.id));
  return match?.id ?? 'skeleton';
}

/** Answer one question against the atlas and return the actions it implies. */
export function askAtlas(question: string, ctx: AssistantContext): AssistantReply {
  const trimmed = question.trim();
  if (!trimmed) {
    return {text: 'Ask about any structure in the body — for example “what does this muscle do?” or “show me the rotator cuff”.', actions: []};
  }
  const {atlas, selection} = ctx;
  const text = normalize(trimmed);

  if (asksForQuiz(trimmed)) {
    return {
      text: 'Starting a quiz. I will ask about functions, nerves and landmarks, and you pick the answer. Open the quiz from the header any time to continue.',
      actions: [{kind: 'quiz', label: 'Quiz me'}],
    };
  }

  const tour = asksForTour(trimmed);
  if (tour) {
    return {
      text: `Starting a guided tour. Each stop highlights one structure and explains it; use Next to continue.`,
      actions: [{kind: 'tour', tour, label: 'Guided tour'}],
    };
  }

  if (wantsLabelsOff(trimmed)) {
    return {text: 'Hiding the floating labels.', actions: [{kind: 'labels', on: false, label: 'Labels off'}]};
  }
  if (asksAboutLabels(trimmed)) {
    return {text: 'Floating labels are on. Each landmark carries its own name in the model.', actions: [{kind: 'labels', on: true, label: 'Labels on'}]};
  }

  const view = viewIntent(trimmed);
  if (view) {
    const label = view === 'three-quarter' ? 'View: three-quarter' : `View: ${view}`;
    return {
      text: `Turning the body to the ${view === 'three-quarter' ? 'three-quarter' : view} view.`,
      actions: [{kind: 'view', view, label}],
    };
  }

  const group = findGroup(atlas, trimmed);
  if (group && /\b(show|highlight|find|point|where)\b/.test(text)) {
    const ids = group.members.flatMap(concept => concept.elements);
    return {
      text: `Highlighting the ${group.label}: ${group.members.map(concept => concept.name).join(', ')}.`,
      actions: [{kind: 'highlight', ids, label: `Highlighted ${group.members.length}`}],
    };
  }

  if (!selection && /\b(this|it|selected|that one)\b/.test(text)) {
    return {
      text: 'Tap a structure in the model first and ask again, or name one directly — “the rotator cuff”, “the femur”, “the heart”.',
      actions: [],
    };
  }

  const matches = findConcepts(atlas, trimmed, 3);
  const asked = matches[0] ?? null;
  const sameAsSelection = Boolean(selection && asked && normalize(asked.name) === normalize(selection.name));

  if (selection) {
    const brief = describeStructure(atlas, selection.name);
    const asksNerve = /\b(nerve|innervat|supply|innervation)\b/.test(text);
    const asksFunction = /\b(function|do|does|work|action|move|moves|purpose|mean|means)\b/.test(text);

    if (asksNerve || asksFunction || /\b(this|it|selected)\b/.test(text)) {
      // A question that names another structure answers about that structure.
      const target = asked && !sameAsSelection ? asked : null;
      const targetBrief = target ? describeStructure(atlas, target.name) : brief;
      const targetIds = target ? target.elements : selection.elements;
      const actions: AssistantAction[] = [];
      if (targetIds.length) actions.push({kind: 'highlight', ids: targetIds, label: `Highlighted ${targetBrief.name}`});

      if (asksNerve) {
        if (!targetBrief.nerve) {
          return {
            text: `The atlas does not list a named nerve for ${targetBrief.name}. Its reference notes cover the structure's role instead.`,
            actions,
          };
        }
        const ids = nervePieces(atlas, targetBrief.nerve);
        if (ids.length) actions.push({kind: 'highlight', ids, label: 'Show its nerve', select: false});
        return {
          text: `${targetBrief.name} is innervated by the ${targetBrief.nerve}.${ids.length ? ' Those nerve pieces are highlighted in the model.' : ''}`,
          actions,
        };
      }

      if (targetBrief.nerve) {
        const nerveIds = nervePieces(atlas, targetBrief.nerve);
        if (nerveIds.length) actions.push({kind: 'highlight', ids: nerveIds, label: 'Show its nerve', select: false});
      }
      const functionText = targetBrief.function || targetBrief.overview;
      const nerveText = targetBrief.nerve ? ` It is supplied by the ${targetBrief.nerve}.` : '';
      return {
        text: `${functionText}${nerveText}`,
        actions,
      };
    }
  }

  if (asked) {
    const concept = asked;
    const brief = describeStructure(atlas, concept.name);
    const ids = concept.elements;
    const actions: AssistantAction[] = [];
    if (ids.length) actions.push({kind: 'highlight', ids, label: `Highlighted ${concept.name}`});
    if (brief.nerve) {
      const nerveIds = nervePieces(atlas, brief.nerve);
      if (nerveIds.length) actions.push({kind: 'highlight', ids: nerveIds, label: 'Show its nerve', select: false});
    }
    const extra = matches.length > 1 ? ` Related structures: ${matches.slice(1).map(item => item.name).join(', ')}.` : '';
    return {
      text: `${brief.overview}${extra}`,
      actions,
    };
  }

  return {
    text: `I could not match that to a structure in this atlas. I can explain the selected structure, highlight a named group such as the rotator cuff, rotate the model, or start a quiz.`,
    actions: [],
  };
}

/** Suggested openings shown in an empty chat. */
export const ASSISTANT_PROMPTS = [
  'What does this muscle do?',
  'Show me the rotator cuff',
  'Turn to the back view',
  'Trace blood flow from the heart',
  'Quiz me on hand bones',
];
