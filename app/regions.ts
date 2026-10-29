/** Topographic regions for the atlas: the spaces a dissection course is organized around, each with the bones that
 *  frame it and the muscles, vessels and nerves that pass through. Choosing one isolates the right-side structures
 *  (midline ones stay), so the student studies the region the way it is examined: what forms its walls and what
 *  runs through it. Members are atlas concept names; names the atlas lacks are skipped at runtime. */

import type {Atlas} from './anatomy';
import type {Lang} from './landing/copy';

export interface AtlasRegion {
  id: string;
  name: Record<Lang, string>;
  latin: string;
  /** One line on what to look for, shown under the region buttons. */
  hint: Record<Lang, string>;
  members: string[];
}

export const REGIONS: AtlasRegion[] = [
  {
    id: 'axilla',
    name: {en: 'Axilla', mn: 'Суганы хөндий'},
    latin: 'Fossa axillaris',
    hint: {en: 'Walls: pectoral muscles in front, subscapularis and teres major behind, serratus anterior medially, the humerus laterally. Contents: axillary artery and vein, brachial plexus.', mn: 'Хана: урд талд цээжний булчингууд, ард дал доорх ба их дугуй булчин, дотор талд урд шүдлэг булчин, гадна талд бугалганы яс. Агуулга: суганы артери ба вен, бугалганы сүлжээ.'},
    members: ['axillary artery', 'axillary vein', 'posterior cord of brachial plexus', 'axillary nerve', 'thoracodorsal nerve', 'long thoracic nerve', 'lateral thoracic artery', 'subscapular artery', 'pectoralis major', 'pectoralis minor', 'subscapularis', 'teres major', 'serratus anterior', 'coracobrachialis', 'humerus', 'scapula', 'clavicle'],
  },
  {
    id: 'cubital-fossa',
    name: {en: 'Cubital fossa', mn: 'Тохойн хонхор'},
    latin: 'Fossa cubitalis',
    hint: {en: 'Bounded by brachioradialis and pronator teres; from lateral to medial it holds the biceps tendon, brachial artery and median nerve. The median cubital vein crosses over the roof.', mn: 'Шуу-бугалганы ба дугуй дотогш эргүүлэгч булчингаар хүрээлэгдэнэ; гаднаас дотогш хоёр толгойт булчингийн шөрмөс, бугалганы артери, голч мэдрэл байрлана. Тохойн голч вен дээвэр дээгүүр нь өнгөрнө.'},
    members: ['brachial artery', 'radial artery', 'ulnar artery', 'brachial vein', 'median nerve', 'radial nerve', 'long head of biceps brachii', 'short head of biceps brachii', 'brachialis', 'brachioradialis', 'humeral head of pronator teres', 'ulnar head of pronator teres', 'median cubital vein', 'cephalic vein', 'basilic vein', 'humerus', 'radius', 'ulna'],
  },
  {
    id: 'femoral-triangle',
    name: {en: 'Femoral triangle', mn: 'Гуяны гурвалжин'},
    latin: 'Trigonum femorale',
    hint: {en: 'Inguinal ligament above, sartorius laterally, adductor longus medially. From lateral to medial: femoral nerve, artery, vein (NAV).', mn: 'Дээд талд цавины холбоос, гадна талд оёдолчны булчин, дотор талд урт ойртуулагч булчин. Гаднаас дотогш: гуяны мэдрэл, артери, вен (NAV).'},
    members: ['femoral artery', 'deep femoral artery', 'femoral vein', 'great saphenous vein', 'femoral nerve', 'sartorius', 'adductor longus', 'pectineus', 'iliacus', 'psoas major', 'femur', 'hip bone'],
  },
  {
    id: 'popliteal-fossa',
    name: {en: 'Popliteal fossa', mn: 'Тахимын хонхор'},
    latin: 'Fossa poplitea',
    hint: {en: 'A diamond between the hamstrings above and the two heads of gastrocnemius below. From superficial to deep: tibial nerve, popliteal vein, popliteal artery.', mn: 'Дээд талд гуяны арын булчингууд, доод талд тахилзуурын булчингийн хоёр толгойн хооронд үүсэх ромб. Өнгөцөөс гүн рүү: шилбэний мэдрэл, тахимын вен, тахимын артери.'},
    members: ['popliteal artery', 'popliteal vein', 'small saphenous vein', 'sciatic nerve', 'tibial nerve', 'common fibular nerve', 'head of biceps femoris', 'semitendinosus', 'semimembranosus', 'head of gastrocnemius', 'plantaris', 'popliteus', 'femur', 'tibia', 'fibula'],
  },
  {
    id: 'gluteal-region',
    name: {en: 'Gluteal region', mn: 'Өгзөгний хэсэг'},
    latin: 'Regio glutealis',
    hint: {en: 'Piriformis is the key: the superior gluteal nerve leaves above it, the sciatic nerve below it. Injections go into the upper outer quadrant to spare the sciatic nerve.', mn: 'Лийр хэлбэрт булчин бол түлхүүр: өгзөгний дээд мэдрэл түүний дээгүүр, суудлын мэдрэл доогуур нь гарна. Суудлын мэдрэлийг гэмтээхгүйн тулд тариаг дээд гадна дөрөвний нэгт хийнэ.'},
    members: ['gluteus maximus', 'gluteus medius', 'gluteus minimus', 'piriformis', 'gemellus', 'obturator internus', 'quadratus femoris', 'sciatic nerve', 'superior gluteal nerve', 'posterior femoral cutaneous nerve', 'pudendal nerve', 'sacrotuberous ligament', 'sacrospinous ligament', 'hip bone', 'sacrum', 'femur'],
  },
  {
    id: 'carotid-triangle',
    name: {en: 'Carotid triangle', mn: 'Гүрээний гурвалжин'},
    latin: 'Trigonum caroticum',
    hint: {en: 'Between sternocleidomastoid, the superior belly of omohyoid and the posterior belly of digastric. The carotid sheath holds the common carotid artery, internal jugular vein and vagus nerve.', mn: 'Өвчүү-эгэм-хөхлөг булчин, дал-хэлэн доорх булчингийн дээд гэдэс, хоёр гэдэст булчингийн арын гэдэсний хооронд. Гүрээний бүрээсэнд нийтлэг гүрээний артери, хүзүүний дотоод вен, тэнэмэл мэдрэл байрлана.'},
    members: ['common carotid artery', 'internal carotid artery', 'internal jugular vein', 'vagus nerve (x)', 'hypoglossal nerve (xii)', 'sternocleidomastoid', 'omohyoid', 'digastric', 'hyoid bone', 'thyroid cartilage', 'thyroid gland'],
  },
  {
    id: 'mediastinum',
    name: {en: 'Mediastinum', mn: 'Цээжний голч хэсэг'},
    latin: 'Mediastinum',
    hint: {en: 'The space between the lungs: the heart and great vessels in front, the trachea, oesophagus, descending aorta and azygos vein behind.', mn: 'Хоёр уушгины хоорондох зай: урд талд зүрх ба их судаснууд, ард цагаан ба улаан хоолой, уруудах гол судас, хосгүй вен.'},
    members: ['heart', 'ascending aorta', 'arch of aorta', 'descending thoracic aorta', 'pulmonary trunk', 'superior vena cava', 'brachiocephalic artery', 'brachiocephalic vein', 'azygos vein', 'trachea', 'esophagus', 'thymus', 'vagus nerve (x)', 'sympathetic trunk', 'sternum'],
  },
  {
    id: 'retroperitoneum',
    name: {en: 'Posterior abdominal wall', mn: 'Хэвлийн арын хана'},
    latin: 'Spatium retroperitoneale',
    hint: {en: 'Behind the peritoneum: kidneys and adrenals on psoas, the aorta on the left of the vertebral bodies and the inferior vena cava on the right.', mn: 'Хэвлийн гялтангийн ард: бөөр ба бөөрний дээд булчирхай бүсэлхийн булчин дээр, гол судас нугаламын биеийн зүүн талд, доод хөндий вен баруун талд.'},
    members: ['kidney', 'ureter', 'adrenal gland', 'abdominal aorta', 'inferior vena cava', 'renal artery', 'renal vein', 'testicular artery', 'testicular vein', 'common iliac artery', 'common iliac vein', 'psoas major', 'iliacus', 'diaphragm', 'lumbar vertebra'],
  },
];

/** The atlas parts of a region: right-side and midline pieces of each member that exists. */
export function regionParts(atlas: Atlas, region: AtlasRegion): string[] {
  const byName = new Map(atlas.concepts.map(c => [c.name.toLowerCase(), c]));
  const parts = new Map(atlas.parts.map(p => [p.id, p]));
  const ids = new Set<string>();
  for (const member of region.members) {
    const concept = byName.get(`right ${member}`) ?? byName.get(member);
    for (const id of concept?.elements ?? []) {
      if (!/^left /i.test(parts.get(id)?.name ?? '')) ids.add(id);
    }
  }
  return [...ids];
}
