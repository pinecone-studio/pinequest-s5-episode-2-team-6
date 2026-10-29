/** Gray's Anatomy for Students — teaching framework for the AI teacher.
 *
 * The module carries only the book's public chapter structure (regional
 * anatomy chapters and their well-known section topics) plus Mongolian
 * labels, so the AI teacher can anchor every answer to a chapter the student
 * can then open in their copy. No copyrighted text is reproduced here.
 */

export interface TextbookChapter {
  id: string;
  chapter: number;
  en: string;
  mn: string;
  /** What this chapter teaches, in one Mongolian sentence. */
  blurb: string;
  /** Section themes the chapter walks through, as short English tags. */
  topics: string[];
  /** Words (English, Latin or Mongolian) that map a question to this chapter. */
  keywords: string[];
  /** Starter questions offered under the chapter chip. */
  starters: string[];
}

export const TEXTBOOK = {
  title: "Gray's Anatomy for Students",
  /** Regional-anatomy method the book is famous for. */
  method:
    'Бүсийн анатомийн арга: гадаргын анатоми → яс → булчин → судас → мэдрэл → клиник холбоо, бүлэг бүрийн төгсгөлд клиник тохиолдлын хайрцаг.',
} as const;

export const CHAPTERS: TextbookChapter[] = [
  {
    id: 'body',
    chapter: 1,
    en: 'The Body',
    mn: 'Биеийн ерөнхий ойлголт',
    blurb: 'Анатомийн хэл, чиглэлийн нэр томьёо, зураглалын аргууд (рентген, CT, MRI, хэт авиан) болон биеийн үндсэн хуваарилалт.',
    topics: ['Terminology', 'Imaging', 'Body systems', 'Skin and fascia'],
    keywords: [
      'анатом', 'нэр томьёо', 'чиглэл', 'rentgen', 'рентген', 'ct', 'mri', 'хэт авиан', 'ultrasound',
      'томография', 'artery', 'vein', 'fascia', 'арьс', 'skin', 'бүс', 'anatomical position', 'sagittal', 'coronal',
      'түүвэр', 'бие махбод', 'систем', 'organ system',
    ],
    starters: [
      'Анатомийн чиглэлийн нэр томьёог энгийн жишээгээр зааж өгөөч',
      'Рентген, CT, MRI ялгаатай юугаараа илэрхийлдэг вэ?',
      'Биеийн судас, мэдрэлийн систем хэрхэн бүсчлэгддэг вэ?',
    ],
  },
  {
    id: 'back',
    chapter: 2,
    en: 'The Back',
    mn: 'Нуруу',
    blurb: 'Нуруу нугасны багана, дээс, нурууны булчингууд, нугасны суваг ба нугас, нурууны мэдрэл.',
    topics: ['Vertebral column', 'Spinal cord', 'Muscles of the back', 'Surface anatomy'],
    keywords: [
      'нугас', 'нугасны', 'vertebra', 'vertebral column', 'spine', 'spinal cord', 'нугасны хөндий',
      'erector spinae', 'latissimus', 'trapezius', 'дээс', 'нугасны булчин', 'мэдрэлийн үндэс',
      'nerve root', 'hernia', 'дериваци', 'disc', 'nuhas', 'арга хэмжээ',
      'нуруу', 'номын нугас', 'нягтлан', 'cervical', 'thoracic', 'lumbar', 'sacral', 'coccyx',
    ],
    starters: [
      'Нугасны багана хэсэг бүрээр ямар онцлогтой вэ?',
      'Нугас ба нугасны хөндий хэрхэн хамгаалагддаг вэ?',
      'Erector spinae булчингийн бүлгийг тайлбарла',
    ],
  },
  {
    id: 'thorax',
    chapter: 3,
    en: 'The Thorax',
    mn: 'Цээжний хөндий',
    blurb: 'Цээжний хана, пульмональ хөндий ба уушиг, медиастинал хөндий, зүрх ба том судаснууд.',
    topics: ['Thoracic wall', 'Pleural cavities', 'Mediastinum', 'Heart', 'Lungs'],
    keywords: [
      'цээж', ' thorax', 'thoracic', 'уушиг', 'lung', 'pleura', 'пульмональ', 'mediastinum', 'mediastinum',
      'зүрх', 'heart', 'aorta', 'aort', 'зүрхний', 'coronary', 'trachea', 'дотоод', 'rib', 'хавирга', 'стернум', 'sternum',
      'diaphragm', 'діафрагм', 'pericardium', 'зүрхний булчин',
    ],
    starters: [
      'Зүрхний дөрвөн хэсэг ба хавхлагуудыг тайлбарла',
      'Уушигны бүтэц, бүлчим хэсгүүд хэрхэн зохион бүтээгдсэн бэ?',
      'Медиастинал хөндийн хуваагдал, орчуулга юу вэ?',
    ],
  },
  {
    id: 'abdomen',
    chapter: 4,
    en: 'The Abdomen',
    mn: 'Хэвлийн хөндий',
    blurb: 'Гэдэсний хана, перитонеаль хөндий, хоол боловсруулах зам, элгэ, ходоод, дэлүү, бөөр ба бусад дотоод эрхтэн.',
    topics: ['Abdominal wall', 'Peritoneal cavity', 'GI tract', 'Liver', 'Kidneys'],
    keywords: [
      'гэдэс', 'abdomen', 'abdominal', 'ходоод', 'stomach', 'elixir', 'intestine', 'duodenum', 'jejunum', 'ileum',
      'colon', 'appendix', 'элэг', 'liver', 'danjil', 'gallbladder', 'панкреас', 'pancreas', 'дэлүү', 'spleen',
      'бөөр', 'kidney', 'peritoneum', 'пепсин', 'хий боловсруулах',
    ],
    starters: [
      'Ходоодны бүтэц ба булчингийн давхаргыг тайлбарла',
      'Элэгний сегментчилэл, цусан хангамж ямар вэ?',
      'Гэдэсний мэдрэлийн хангамж хэрхэн зохицдог вэ?',
    ],
  },
  {
    id: 'pelvis',
    chapter: 5,
    en: 'Pelvis and Perineum',
    mn: 'Аарцаг ба перинеум',
    blurb: 'Аарцагны яс, аарцагны дотоод эрхтэн, шээс бэлэг систем, хийгээд нэвтрээсийн бүсийн бүтцүүд.',
    topics: ['Bony pelvis', 'Pelvic viscera', 'Perineum', 'Pelvic floor'],
    keywords: [
      'аарцаг', 'pelvis', 'pelvic', 'нэвтрээс', 'perineum', 'шилэн', 'bladder', 'шээс', 'urethra',
      'даавуу', 'эмэгтэй', 'эрэгтэй', 'сүрьеэ', 'prostate', 'унтраг', 'pelvic floor',
      'sacrum', 'шишкэ',
    ],
    starters: [
      'Аарцагны бүтцийн ялгаа эмэгтэй, эрэгтэй хоёрын хооронд ямар вэ?',
      'Аарцагны ёроолын булчингийн бүлгийг тайлбарла',
      'Шээс бэлэг системийн судас, мэдрэлийн хангамж юу вэ?',
    ],
  },
  {
    id: 'lower-limb',
    chapter: 6,
    en: 'The Lower Limb',
    mn: 'Доод мөч (хөл)',
    blurb: 'Хөлийн бүс (сандал, гуя, өвдөг, гомус, шагай, хөл) — яс, булчин, судас, мэдрэл ба алхалтын биомеханик.',
    topics: ['Hip and gluteal region', 'Thigh', 'Knee and leg', 'Ankle and foot'],
    keywords: [
      'хөл', 'leg', 'lower limb', 'femur', 'гуя', 'толган', 'онгоц', 'tibia', 'fibula', 'patella',
      'өвдөг', 'knee', 'тулган', 'ankle', 'шагай', 'foot', 'хумс', 'булчингийн',
      'sciatic', 'femoral', 'gluteus', 'quadriceps', 'hamstrings', 'gastrocnemius',
    ],
    starters: [
      'Өвдөгний бүх холбоос ба шөвгөрсний бүтцийг тайлбарла',
      'Гуяны булчингийн үндсэн бүлгүүд, үүргийг нь дурд',
      'Хөлийн булчин, мэдрэл, судасыг бүсчлэн тайлбарла',
    ],
  },
  {
    id: 'upper-limb',
    chapter: 7,
    en: 'The Upper Limb',
    mn: 'Дээд мөч (гар)',
    blurb: 'Гарын бүс (мөр, багаж, шуу, тохой, гарын завсар) — эргэлтт холбоос, булчин, судас ба мэдрэл.',
    topics: ['Shoulder', 'Axilla', 'Arm and elbow', 'Forearm', 'Wrist and hand'],
    keywords: [
      'гар', 'upper limb', 'shoulder', 'мөр', 'клаин', 'clavicle', 'scapula', 'humerus', 'radius', 'ulna',
      'тохой', 'elbow', 'шуу', 'forearm', 'wrist', 'долоон', 'hand', 'гарын',
      'brachial', 'radial', 'ulnar', 'median', 'rotator cuff', 'булчин бэлчир',
    ],
    starters: [
      'Мөрний бүсийн холбоосууд ба эргэлтийн хэвийн хүрээг тайлбарла',
      'Гарын мэдрэлийн хангамж ба булчингийн холбоо юу вэ?',
      'Тохойн бүсийн судас, мэдрэлийн бүтцийг тайлбарла',
    ],
  },
  {
    id: 'head-neck',
    chapter: 8,
    en: 'Head and Neck',
    mn: 'Толгой ба хүзүү',
    blurb: 'Толгойн яс, нүүр, цавчуур, нүд, чих, хамар, ам ба хүзүүний бүс, нурууны мэдрэл (cranial nerves).',
    topics: ['Skull', 'Face and scalp', 'Orbit and ear', 'Nasal and oral cavities', 'Neck', 'Cranial nerves'],
    keywords: [
      'толгой', 'head', 'skull', 'cranium', 'нүүр', 'face', 'нүд', 'eye', 'orbit', 'чих', 'ear',
      'хамар', 'nose', 'ам', 'ор', 'дотоод чих', 'тархи', 'brain', 'cranial nerve', 'хүзүү', 'neck',
      'larinx', 'larynx', 'pharynx', 'хамрын', 'шүд', 'tooth', 'trigeminus', 'facial nerve',
    ],
    starters: [
      'Нурууны мэдрэлийн 12 хосыг бүлэглэн тайлбарла',
      'Чихний бүтэц ба сонсох механизм юу вэ?',
      'Хүзүүний гурвалжингууд ба агуулга нь ямар вэ?',
    ],
  },
];

const CHAPTER_BY_ID = new Map(CHAPTERS.map(chapter => [chapter.id, chapter]));

export function chapterById(id: string | undefined | null): TextbookChapter | null {
  return id ? CHAPTER_BY_ID.get(id) ?? null : null;
}

const KEYWORD_INDEX = CHAPTERS.map(chapter => ({
  id: chapter.id,
  words: chapter.keywords.map(word => word.toLowerCase().trim()).filter(Boolean),
}));

/** Best chapter for a free-form question, or null when nothing matches. */
export function routeChapter(question: string): TextbookChapter | null {
  const text = question.toLowerCase();
  let best: TextbookChapter | null = null;
  let bestScore = 0;
  for (const entry of KEYWORD_INDEX) {
    let score = 0;
    for (const word of entry.words) if (text.includes(word)) score += word.length >= 5 ? 2 : 1;
    if (score > bestScore) {
      bestScore = score;
      best = CHAPTER_BY_ID.get(entry.id) ?? null;
    }
  }
  return bestScore > 0 ? best : null;
}
