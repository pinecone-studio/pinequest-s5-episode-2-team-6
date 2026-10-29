// The anatomy groups the exam bank is organised by, and the structures inside
// each one. Keys are atlas concept names, so a review link (/atlas?focus=<key>)
// finds the same part the student read about, and Mongolian titles come from
// app/mongolian-names.ts — the table the detail panel already uses. A name that
// table cannot build stays in English rather than getting a guessed translation.
import {SYSTEMS, type SystemId} from '../app/anatomy';
import {localName} from '../app/mongolian-names';
import type {Lang} from '../app/landing/copy';

/** The systems a paper can belong to. The rest of the atlas has no exam bank yet. */
export type ExamGroupId = Extract<SystemId, 'skeletal' | 'muscular' | 'arterial' | 'venous' | 'nervous' | 'cardiac'> | 'organs';

export interface ExamGroup {
  id: ExamGroupId;
  mn: string;
  /** Atlas structures this group's papers are written about. */
  parts: string[];
}

export const EXAM_GROUPS: ExamGroup[] = [
  {
    id: 'skeletal',
    mn: 'Яс',
    parts: ['femur', 'humerus', 'tibia', 'ulna', 'radius', 'scapula', 'clavicle', 'patella', 'sternum', 'rib', 'hyoid bone', 'mandible', 'sacrum', 'calcaneus', 'talus', 'temporal bone', 'cervical vertebra', 'thoracic vertebra', 'lumbar vertebra', 'metacarpal bone'],
  },
  {
    id: 'muscular',
    mn: 'Булчин',
    parts: ['deltoid', 'biceps brachii', 'triceps brachii', 'brachialis', 'brachioradialis', 'sternocleidomastoid', 'supraspinatus', 'infraspinatus', 'subscapularis', 'teres minor', 'pectoralis major', 'external oblique', 'flexor digitorum superficialis', 'gluteus maximus', 'gluteus medius', 'sartorius', 'tibialis anterior', 'soleus', 'gastrocnemius'],
  },
  {
    id: 'arterial',
    mn: 'Артерийн судас',
    parts: ['aorta', 'ascending aorta', 'pulmonary trunk', 'brachial artery', 'radial artery', 'ulnar artery', 'axillary artery', 'subclavian artery', 'common carotid artery', 'internal carotid artery', 'vertebral artery', 'coronary artery', 'femoral artery', 'popliteal artery', 'renal artery', 'celiac trunk', 'dorsalis pedis artery'],
  },
  {
    id: 'venous',
    mn: 'Венийн судас',
    parts: ['superior vena cava', 'inferior vena cava', 'pulmonary vein', 'internal jugular vein', 'subclavian vein', 'cephalic vein', 'basilic vein', 'great saphenous vein', 'small saphenous vein', 'femoral vein', 'popliteal vein', 'portal vein', 'hepatic vein', 'renal vein', 'azygos vein'],
  },
  {
    id: 'nervous',
    mn: 'Мэдрэлийн систем',
    parts: ['brain', 'spinal cord', 'optic nerve', 'trochlear nerve', 'median nerve', 'ulnar nerve', 'radial nerve', 'musculocutaneous nerve', 'axillary nerve', 'sciatic nerve', 'tibial nerve', 'common fibular nerve', 'femoral nerve', 'obturator nerve'],
  },
  {
    id: 'organs',
    mn: 'Дотор эрхтэн',
    parts: ['heart', 'lung', 'trachea', 'esophagus', 'stomach', 'liver', 'pancreas', 'spleen', 'kidney', 'urinary bladder', 'small intestine', 'large intestine'],
  },
  {
    id: 'cardiac',
    mn: 'Зүрх',
    parts: ['heart', 'right atrium', 'left atrium', 'right ventricle', 'left ventricle'],
  },
];

export function groupOf(id: string | null | undefined): ExamGroup | undefined {
  return EXAM_GROUPS.find(group => group.id === id);
}

/** "Яс" / "Bones" for a group key; unknown keys come back as they are. */
export function groupLabel(id: string, lang: Lang): string {
  const group = groupOf(id);
  if (!group) return id;
  if (lang === 'mn') return group.mn;
  if (group.id === 'organs') return 'Internal organs';
  return SYSTEMS.find(system => system.id === group.id)?.name ?? group.id;
}

export function groupColor(id: string): string {
  if (id === 'organs') return '#b8916b';
  return SYSTEMS.find(system => system.id === id)?.color ?? '#94a3b8';
}

/** The name of one atlas structure in the language the page is in. */
export function partLabel(key: string, lang: Lang): string {
  return localName(key, lang);
}

/** The label used inside a paper title: "Яс: гуяны яс" — the same lowercase form the seeded bank uses. */
export function partTitle(key: string, lang: Lang): string {
  if (lang !== 'mn') return key;
  const name = partLabel(key, 'mn');
  return name.charAt(0).toLowerCase() + name.slice(1);
}
