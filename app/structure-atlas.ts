/** Original educational entries for non-skeletal structures in the 3D atlas:
 *  suprahyoid muscles, intervertebral disks, knee-joint structures, and teeth.
 *  Further-reading links point to Anatomy Standard; copy and images are not reused. */

export type StructureGroup = 'Muscles' | 'Joints' | 'Teeth';

export interface StructureTerm {
  latin: string;
  english: string;
}

export interface StructureAtlasEntry {
  id: string;
  title: string;
  latin: string;
  group: StructureGroup;
  overview: string;
  terms: StructureTerm[];
  anatomyStandardUrl: string;
  /** Substrings matched against normalized atlas names (order-weighted by specificity). */
  matchers: string[];
}

const suprahyoid = 'https://www.anatomystandard.com/musculi/collum/mm-suprahyoidei.html';
const masticatory = 'https://www.anatomystandard.com/musculi/caput/mm-masticatorii.html';
const disks = 'https://www.anatomystandard.com/ossa-et-juncturae/columna-vertebralis/disci-intervertebrales.html';
const knee = 'https://www.anatomystandard.com/ossa-et-juncturae/extremitas-inferior/art-genus.html';
const teeth = 'https://www.anatomystandard.com/ossa-et-juncturae/cranium/dentes-permanentes.html';

export const STRUCTURE_ATLAS: StructureAtlasEntry[] = [
  {
    id: 'digastric',
    title: 'Digastric',
    latin: 'M. digastricus',
    group: 'Muscles',
    overview:
      'The digastric carries two bellies joined by an intermediate tendon. The anterior belly rises from the digastric fossa of the mandible, the posterior belly from the mastoid notch of the temporal bone; the tendon threads through a fibrous loop on the hyoid bone. With the hyoid fixed, the anterior belly lowers the jaw; together the bellies raise the hyoid during swallowing.',
    terms: [
      {latin: 'Venter anterior m. digastrici', english: 'Anterior belly'},
      {latin: 'Venter posterior m. digastrici', english: 'Posterior belly'},
      {latin: 'Tendo intermedius', english: 'Intermediate tendon'},
      {latin: 'Fossa digastrica mandibulae', english: 'Digastric fossa of mandible'},
      {latin: 'Incisura mastoidea', english: 'Mastoid notch'},
      {latin: 'Anulus tendineus m. digastrici', english: 'Fibrous loop on the hyoid'},
    ],
    anatomyStandardUrl: suprahyoid,
    matchers: ['^digastric$'],
  },
  {
    id: 'mylohyoid',
    title: 'Mylohyoid',
    latin: 'M. mylohyoideus',
    group: 'Muscles',
    overview:
      'The mylohyoid spans from the mylohyoid line of the mandible to the median raphe and the body of the hyoid bone, sheeting the muscular floor of the mouth. It lifts and draws the hyoid forward; the hyoid steadied, it can also help lower the mandible.',
    terms: [
      {latin: 'Linea mylohyoidea mandibulae', english: 'Mylohyoid line of mandible'},
      {latin: 'Raphe m. mylohyoidei', english: 'Median raphe'},
      {latin: 'Diaphragma oris', english: 'Floor of the mouth'},
      {latin: 'Corpus ossis hyoidei', english: 'Body of hyoid'},
    ],
    anatomyStandardUrl: suprahyoid,
    matchers: ['^mylohyoid$'],
  },
  {
    id: 'geniohyoid',
    title: 'Geniohyoid',
    latin: 'M. geniohyoideus',
    group: 'Muscles',
    overview:
      'A paired strap beside the midline, running from the mental spine of the mandible to the body of the hyoid bone. Of the suprahyoid group it moves the hyoid anteriorly most strongly, a role that comes early in the act of swallowing.',
    terms: [
      {latin: 'Spina mentalis mandibulae', english: 'Mental spine of mandible'},
      {latin: 'Corpus ossis hyoidei', english: 'Body of hyoid'},
    ],
    anatomyStandardUrl: suprahyoid,
    matchers: ['^geniohyoid$'],
  },
  {
    id: 'stylohyoid',
    title: 'Stylohyoid',
    latin: 'M. stylohyoideus',
    group: 'Muscles',
    overview:
      'A slender muscle from the posterior surface of the styloid process of the temporal bone to the hyoid near its lesser horn. It pulls the hyoid upward and backward, and splits near its insertion so the digastric tendon can pass beneath.',
    terms: [
      {latin: 'Processus styloideus ossis temporalis', english: 'Styloid process'},
      {latin: 'Cornu minus ossis hyoidei', english: 'Lesser horn of hyoid'},
      {latin: 'Divisio m. stylohyoidei', english: 'Split of the stylohyoid'},
    ],
    anatomyStandardUrl: suprahyoid,
    matchers: ['^stylohyoid$'],
  },
  {
    id: 'intervertebral-disk',
    title: 'Intervertebral disk',
    latin: 'Discus intervertebralis',
    group: 'Joints',
    overview:
      'Elastic rings that join adjacent vertebral bodies and contribute a fifth to a third of the height of the spinal column. The laminated annulus fibrosus — concentric bands of collagen set obliquely in alternating directions — encloses the gel-like nucleus pulposus, a descendant of the embryonic notochord. Discs are tallest in the lumbar region, and none exist at the atlas–axis or sacral levels.',
    terms: [
      {latin: 'Discus intervertebralis', english: 'Intervertebral disk'},
      {latin: 'Anulus fibrosus', english: 'Annulus fibrosus'},
      {latin: 'Nucleus pulposus', english: 'Nucleus pulposus'},
    ],
    anatomyStandardUrl: disks,
    matchers: ['intervertebral disk'],
  },
  {
    id: 'medial-meniscus',
    title: 'Medial meniscus',
    latin: 'Meniscus medialis',
    group: 'Joints',
    overview:
      'A wedge of fibrocartilage on the medial tibial plateau, deepening the joint and spreading load across surfaces that barely fit. Its firm attachment to the tibial collateral ligament couples it to that ligament, so it glides less freely than its lateral partner and is the more often injured.',
    terms: [
      {latin: 'Meniscus medialis', english: 'Medial meniscus'},
      {latin: 'Cornu anterius', english: 'Anterior horn'},
      {latin: 'Cornu posterius', english: 'Posterior horn'},
      {latin: 'Radix menisci', english: 'Root of the meniscus'},
    ],
    anatomyStandardUrl: knee,
    matchers: ['medial meniscus'],
  },
  {
    id: 'lateral-meniscus',
    title: 'Lateral meniscus',
    latin: 'Meniscus lateralis',
    group: 'Joints',
    overview:
      'A wedge of fibrocartilage covering most of the lateral tibial plateau. A clear gap separates it from the fibular collateral ligament, so it moves with much greater freedom than the medial meniscus during flexion, extension, and rotation.',
    terms: [
      {latin: 'Meniscus lateralis', english: 'Lateral meniscus'},
      {latin: 'Cornu anterius', english: 'Anterior horn'},
      {latin: 'Cornu posterius', english: 'Posterior horn'},
      {latin: 'Radix menisci', english: 'Root of the meniscus'},
    ],
    anatomyStandardUrl: knee,
    matchers: ['lateral meniscus'],
  },
  {
    id: 'anterior-cruciate-ligament',
    title: 'Anterior cruciate ligament',
    latin: 'Ligamentum cruciatum genus anterius',
    group: 'Joints',
    overview:
      'A central knee ligament running from the anterior intercondylar area of the tibia to the medial side of the lateral femoral condyle. It restrains forward sliding of the tibia under the femur and, with the posterior cruciate, guides the rotation that locks the fully extended knee.',
    terms: [
      {latin: 'Ligamentum cruciatum anterius', english: 'Anterior cruciate ligament'},
      {latin: 'Area intercondylaris tibiae', english: 'Intercondylar area of tibia'},
      {latin: 'Condylus lateralis femoris', english: 'Lateral condyle of femur'},
    ],
    anatomyStandardUrl: knee,
    matchers: ['anterior cruciate ligament'],
  },
  {
    id: 'posterior-cruciate-ligament',
    title: 'Posterior cruciate ligament',
    latin: 'Ligamentum cruciatum genus posterius',
    group: 'Joints',
    overview:
      'The stronger of the two cruciate ligaments, restraining backward displacement of the tibia under the femur. Its fibers follow a twisted path that retensions through flexion, and the pair sits most slack near ninety degrees, where a little rotation of the tibia is possible.',
    terms: [
      {latin: 'Ligamentum cruciatum posterius', english: 'Posterior cruciate ligament'},
      {latin: 'Fasciculi ligamenti cruciati', english: 'Twisted fiber bands'},
    ],
    anatomyStandardUrl: knee,
    matchers: ['posterior cruciate ligament'],
  },
  {
    id: 'transverse-ligament-of-knee',
    title: 'Transverse ligament of knee',
    latin: 'Ligamentum transversum genus',
    group: 'Joints',
    overview:
      'A small ligament joining the anterior horns of the two menisci, so their gliding across the tibial surface stays synchronized through knee motion.',
    terms: [
      {latin: 'Ligamentum transversum genus', english: 'Transverse ligament of the knee'},
      {latin: 'Cornu anterius meniscorum', english: 'Anterior horns of the menisci'},
    ],
    anatomyStandardUrl: knee,
    matchers: ['transverse ligament of knee'],
  },
  {
    id: 'meniscotibial-ligament',
    title: 'Meniscotibial ligament',
    latin: 'Ligamentum meniscotibiale',
    group: 'Joints',
    overview:
      'Short coronary ligament fibers anchoring the horns and rim of a meniscus to the margin of the tibial plateau, holding each crescent in place while it deforms under load.',
    terms: [
      {latin: 'Ligamentum meniscotibiale', english: 'Meniscotibial (coronary) ligament'},
      {latin: 'Radices meniscorum', english: 'Meniscal roots'},
    ],
    anatomyStandardUrl: knee,
    matchers: ['meniscotibial ligament'],
  },
  {
    id: 'meniscopatellar-ligament',
    title: 'Meniscopatellar ligament',
    latin: 'Ligamentum meniscopatellare',
    group: 'Joints',
    overview:
      'Delicate fibers linking a meniscus to the margins of the patella and its tendon, tying the menisci into the extensor apparatus of the knee.',
    terms: [
      {latin: 'Ligamentum meniscopatellare', english: 'Meniscopatellar ligament'},
      {latin: 'Patella', english: 'Patella'},
    ],
    anatomyStandardUrl: knee,
    matchers: ['meniscopatellar ligament'],
  },
  {
    id: 'knee-articular-capsule',
    title: 'Articular capsule of knee joint',
    latin: 'Capsula articularis genus',
    group: 'Joints',
    overview:
      'A complex fibrous sleeve around the femur, tibia, and patella. Posteriorly it thickens into the oblique popliteal ligament, continuous with the semimembranosus tendon, and the arcuate popliteal ligament, which arches over the tendon of the popliteus — a tendon that, unusually, passes inside the capsule.',
    terms: [
      {latin: 'Capsula articularis genus', english: 'Capsule of the knee joint'},
      {latin: 'Ligamentum popliteum obliquum', english: 'Oblique popliteal ligament'},
      {latin: 'Ligamentum popliteum arcuatum', english: 'Arcuate popliteal ligament'},
      {latin: 'Tendo m. poplitei', english: 'Tendon of the popliteus'},
      {latin: 'Hiatus tendinis m. poplitei', english: 'Fibrous hiatus for the popliteus tendon'},
    ],
    anatomyStandardUrl: knee,
    matchers: ['articular capsule of knee joint'],
  },
  {
    id: 'permanent-tooth',
    title: 'Permanent tooth',
    latin: 'Dens permanens',
    group: 'Teeth',
    overview:
      'The adult dentition carries thirty-two permanent teeth, eight per half-arch: two incisors, one canine, two premolars, and three molars. In the two-digit code recommended by the World Dental Federation the first digit names the quadrant, 1 through 4, and the second counts from the midline. Surfaces are described with dental terms — labial or buccal, lingual, occlusal, mesial, and distal — that follow the curved arches rather than the body planes.',
    terms: [
      {latin: 'Dentes permanentes', english: 'Permanent teeth'},
      {latin: 'Corona dentis', english: 'Crown of tooth'},
      {latin: 'Radix dentis', english: 'Root of tooth'},
      {latin: 'Cervix dentis', english: 'Neck of tooth'},
      {latin: 'Facies vestibularis', english: 'Facial (vestibular) surface'},
      {latin: 'Facies lingualis', english: 'Lingual surface'},
      {latin: 'Facies occlusalis', english: 'Occlusal surface'},
    ],
    anatomyStandardUrl: teeth,
    matchers: ['tooth'],
  },
  {
    id: 'incisor',
    title: 'Incisor',
    latin: 'Dens incisivus',
    group: 'Teeth',
    overview:
      'Two incisors occupy each quadrant of the permanent dentition, the maxillary pair noticeably larger than the mandibular. A single sharp incisal edge, one root, and the absence of cusps suit them to piercing and cutting food; on the tongue side a cingulum marks a rudimentary lingual cusp.',
    terms: [
      {latin: 'Dens incisivus', english: 'Incisor'},
      {latin: 'Margo incisalis', english: 'Incisal margin'},
      {latin: 'Cingulum dentis', english: 'Cingulum'},
      {latin: 'Fossa lingualis', english: 'Lingual fossa'},
      {latin: 'Crista marginalis', english: 'Marginal crest'},
    ],
    anatomyStandardUrl: teeth,
    matchers: ['incisor tooth'],
  },
  {
    id: 'canine',
    title: 'Canine',
    latin: 'Dens caninus',
    group: 'Teeth',
    overview:
      'One canine stands in each quadrant — the longest teeth of the dentition, crowned with a massive single pointed cusp. The name comes from Latin canis, the dog, but for humans their lasting role is canine guidance: the canines steer the jaws into the intercuspal position.',
    terms: [
      {latin: 'Dens caninus', english: 'Canine'},
      {latin: 'Apex cuspidis', english: 'Tip of the cusp'},
      {latin: 'Crista marginalis mesialis', english: 'Mesial marginal ridge'},
      {latin: 'Fossa mesiolingualis', english: 'Mesiolingual fossa'},
    ],
    anatomyStandardUrl: teeth,
    matchers: ['canine tooth'],
  },
  {
    id: 'premolar',
    title: 'Premolar',
    latin: 'Dens premolaris',
    group: 'Teeth',
    overview:
      'Two premolars sit distal to each canine. Their signature two cusps spawned the term bicuspid, though mandibular premolars can carry three or more. Root count varies: the maxillary first premolar most often has two roots, one buccal and one lingual, while the rest typically carry a single root.',
    terms: [
      {latin: 'Dens premolaris', english: 'Premolar'},
      {latin: 'Cuspis buccalis', english: 'Buccal cusp'},
      {latin: 'Cuspis lingualis', english: 'Lingual cusp'},
      {latin: 'Radix buccalis', english: 'Buccal root'},
      {latin: 'Radix lingualis', english: 'Lingual root'},
      {latin: 'Sulcus centralis', english: 'Central developmental groove'},
    ],
    anatomyStandardUrl: teeth,
    matchers: ['premolar tooth'],
  },
  {
    id: 'molar',
    title: 'Molar',
    latin: 'Dens molaris',
    group: 'Teeth',
    overview:
      'The molars are the largest and best-anchored teeth and do most of the grinding. Their crowns carry four to five well-developed cusps. Maxillary first and second molars typically hold three roots, two buccal and one lingual; mandibular molars settle for two, mesial and distal.',
    terms: [
      {latin: 'Dens molaris', english: 'Molar'},
      {latin: 'Cuspis mesiobuccalis', english: 'Mesiobuccal cusp'},
      {latin: 'Cuspis mesiolingualis', english: 'Mesiolingual cusp'},
      {latin: 'Fossa centralis', english: 'Central fossa'},
      {latin: 'Radix mesiobuccalis', english: 'Mesiobuccal root'},
      {latin: 'Radix mesialis', english: 'Mesial root'},
    ],
    anatomyStandardUrl: teeth,
    matchers: ['molar tooth'],
  },
];

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/^(left|right)\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function nameMatches(normalized: string, matcher: string): boolean {
  if (matcher.startsWith('^') && matcher.endsWith('$')) {
    return normalized === matcher.slice(1, -1).toLowerCase();
  }
  const token = matcher.toLowerCase();
  return new RegExp(`(?:^|\\s)${escapeRegExp(token)}(?:\\s|$)`).test(normalized);
}

/** Match an atlas structure name to a non-skeletal reference entry. */
export function resolveStructureAtlas(name: string): StructureAtlasEntry | null {
  const n = normalizeName(name);
  if (!n) return null;

  const ranked = STRUCTURE_ATLAS.flatMap(entry =>
    entry.matchers.map(m => ({
      entry,
      matcher: m,
      specificity: m.replace(/^\^|\$$/g, '').length,
    })),
  ).sort((a, b) => b.specificity - a.specificity);

  for (const {entry, matcher} of ranked) {
    if (nameMatches(n, matcher)) return entry;
  }
  return null;
}

/** Unused today; kept to document which sections the links draw on. */
export const STRUCTURE_ATLAS_SECTIONS = {suprahyoid, masticatory, disks, knee, teeth};
