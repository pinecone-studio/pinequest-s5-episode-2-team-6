/** Original educational bone entries for the 3D atlas.
 *  Further-reading links point to Anatomy Standard; copy and images are not reused. */

export type BoneRegion =
  | 'cranium'
  | 'vertebral column'
  | 'thorax'
  | 'upper limb'
  | 'pelvis'
  | 'lower limb';

export interface BoneTerm {
  latin: string;
  english: string;
}

export interface BoneAtlasEntry {
  id: string;
  title: string;
  latin: string;
  region: BoneRegion;
  overview: string;
  terms: BoneTerm[];
  anatomyStandardUrl: string;
  /** Substrings matched against normalized BodyParts3D names (order matters: more specific first). */
  matchers: string[];
}

const AS = 'https://www.anatomystandard.com/ossa-et-juncturae/cranium/os-occipitale.html';

export const BONE_ATLAS: BoneAtlasEntry[] = [
  {
    id: 'femur',
    title: 'Femur',
    latin: 'Os femoris',
    region: 'lower limb',
    overview:
      'The femur is the longest bone of the body. Its spherical head forms the hip joint; the distal condyles articulate in the knee. The neck and trochanters transmit load from the trunk into the free lower limb.',
    terms: [
      {latin: 'Caput femoris', english: 'Head of femur'},
      {latin: 'Collum femoris', english: 'Neck of femur'},
      {latin: 'Trochanter major', english: 'Greater trochanter'},
      {latin: 'Trochanter minor', english: 'Lesser trochanter'},
      {latin: 'Corpus femoris', english: 'Shaft of femur'},
      {latin: 'Linea aspera', english: 'Linea aspera'},
      {latin: 'Condylus medialis', english: 'Medial condyle'},
      {latin: 'Condylus lateralis', english: 'Lateral condyle'},
      {latin: 'Facies patellaris', english: 'Patellar surface'},
      {latin: 'Fossa intercondylaris', english: 'Intercondylar fossa'},
    ],
    anatomyStandardUrl: `${AS}/extremitas-inferior/femur.html`,
    matchers: ['femur'],
  },
  {
    id: 'tibia',
    title: 'Tibia',
    latin: 'Tibia',
    region: 'lower limb',
    overview:
      'The tibia is the weight-bearing bone of the leg. Proximal plateaus receive the femoral condyles; distally it forms the medial malleolus of the ankle mortise.',
    terms: [
      {latin: 'Condylus medialis tibiae', english: 'Medial tibial condyle'},
      {latin: 'Condylus lateralis tibiae', english: 'Lateral tibial condyle'},
      {latin: 'Tuberositas tibiae', english: 'Tibial tuberosity'},
      {latin: 'Corpus tibiae', english: 'Shaft of tibia'},
      {latin: 'Malleolus medialis', english: 'Medial malleolus'},
      {latin: 'Facies articularis inferior', english: 'Inferior articular surface'},
    ],
    anatomyStandardUrl: `${AS}/extremitas-inferior/tibia.html`,
    matchers: ['tibia'],
  },
  {
    id: 'fibula',
    title: 'Fibula',
    latin: 'Fibula',
    region: 'lower limb',
    overview:
      'The fibula is a slender lateral bone of the leg. It stabilizes the ankle through the lateral malleolus and provides muscle attachment along the shaft.',
    terms: [
      {latin: 'Caput fibulae', english: 'Head of fibula'},
      {latin: 'Collum fibulae', english: 'Neck of fibula'},
      {latin: 'Corpus fibulae', english: 'Shaft of fibula'},
      {latin: 'Malleolus lateralis', english: 'Lateral malleolus'},
    ],
    anatomyStandardUrl: `${AS}/extremitas-inferior/fibula.html`,
    matchers: ['fibula'],
  },
  {
    id: 'patella',
    title: 'Patella',
    latin: 'Patella',
    region: 'lower limb',
    overview:
      'The patella is the largest sesamoid bone. Embedded in the quadriceps tendon, it improves the mechanical advantage of knee extension and articulates with the femoral trochlea.',
    terms: [
      {latin: 'Basis patellae', english: 'Base of patella'},
      {latin: 'Apex patellae', english: 'Apex of patella'},
      {latin: 'Facies articularis', english: 'Articular surface'},
      {latin: 'Facies anterior', english: 'Anterior surface'},
    ],
    anatomyStandardUrl: `${AS}/extremitas-inferior/patella.html`,
    matchers: ['patella'],
  },
  {
    id: 'hip-bone',
    title: 'Hip bone',
    latin: 'Os coxae',
    region: 'pelvis',
    overview:
      'Each hip bone unites ilium, ischium, and pubis. Together with the sacrum they form the bony pelvis. The acetabulum receives the femoral head at the hip joint.',
    terms: [
      {latin: 'Os ilium', english: 'Ilium'},
      {latin: 'Os ischii', english: 'Ischium'},
      {latin: 'Os pubis', english: 'Pubis'},
      {latin: 'Acetabulum', english: 'Acetabulum'},
      {latin: 'Crista iliaca', english: 'Iliac crest'},
      {latin: 'Spina iliaca anterior superior', english: 'Anterior superior iliac spine'},
      {latin: 'Foramen obturatum', english: 'Obturator foramen'},
      {latin: 'Tuber ischiadicum', english: 'Ischial tuberosity'},
    ],
    anatomyStandardUrl: `${AS}/extremitas-inferior/pelvis.html`,
    matchers: ['hip bone'],
  },
  {
    id: 'sacrum',
    title: 'Sacrum',
    latin: 'Os sacrum',
    region: 'pelvis',
    overview:
      'The sacrum is a triangular fusion of sacral vertebrae. It transmits body weight from the lumbar spine to the pelvic girdle through the sacroiliac joints.',
    terms: [
      {latin: 'Basis ossis sacri', english: 'Base of sacrum'},
      {latin: 'Apex ossis sacri', english: 'Apex of sacrum'},
      {latin: 'Promontorium', english: 'Promontory'},
      {latin: 'Ala sacralis', english: 'Sacral ala'},
      {latin: 'Facies pelvica', english: 'Pelvic surface'},
      {latin: 'Facies dorsalis', english: 'Dorsal surface'},
      {latin: 'Canales sacralis', english: 'Sacral canal'},
    ],
    anatomyStandardUrl: `${AS}/extremitas-inferior/pelvis.html`,
    matchers: ['sacrum'],
  },
  {
    id: 'humerus',
    title: 'Humerus',
    latin: 'Humerus',
    region: 'upper limb',
    overview:
      'The humerus is the bone of the arm. Proximally it articulates with the scapula at the glenohumeral joint; distally it forms the elbow with the radius and ulna. Anatomical and surgical necks mark distinct clinical landmarks.',
    terms: [
      {latin: 'Caput humeri', english: 'Head of humerus'},
      {latin: 'Collum anatomicum', english: 'Anatomical neck'},
      {latin: 'Collum chirurgicum', english: 'Surgical neck'},
      {latin: 'Tuberculum majus', english: 'Greater tubercle'},
      {latin: 'Tuberculum minus', english: 'Lesser tubercle'},
      {latin: 'Sulcus intertubercularis', english: 'Intertubercular groove'},
      {latin: 'Tuberositas deltoidea', english: 'Deltoid tuberosity'},
      {latin: 'Epicondylus medialis', english: 'Medial epicondyle'},
      {latin: 'Epicondylus lateralis', english: 'Lateral epicondyle'},
      {latin: 'Trochlea humeri', english: 'Trochlea of humerus'},
      {latin: 'Capitulum humeri', english: 'Capitulum'},
    ],
    anatomyStandardUrl: `${AS}/extremitas-superior/humerus.html`,
    matchers: ['humerus'],
  },
  {
    id: 'radius',
    title: 'Radius',
    latin: 'Radius',
    region: 'upper limb',
    overview:
      'The radius is the lateral forearm bone. Its head pivots at the elbow; the distal end carries most of the wrist articulation and rotates around the ulna in pronation–supination.',
    terms: [
      {latin: 'Caput radii', english: 'Head of radius'},
      {latin: 'Collum radii', english: 'Neck of radius'},
      {latin: 'Tuberositas radii', english: 'Radial tuberosity'},
      {latin: 'Corpus radii', english: 'Shaft of radius'},
      {latin: 'Processus styloideus radii', english: 'Styloid process of radius'},
      {latin: 'Incisura ulnaris', english: 'Ulnar notch'},
    ],
    anatomyStandardUrl: `${AS}/extremitas-superior/radius.html`,
    matchers: ['radius'],
  },
  {
    id: 'ulna',
    title: 'Ulna',
    latin: 'Ulna',
    region: 'upper limb',
    overview:
      'The ulna is the medial forearm bone. The olecranon and coronoid process lock with the humeral trochlea; distally the head articulates with the radius and triangular fibrocartilage complex.',
    terms: [
      {latin: 'Olecranon', english: 'Olecranon'},
      {latin: 'Processus coronoideus', english: 'Coronoid process'},
      {latin: 'Incisura trochlearis', english: 'Trochlear notch'},
      {latin: 'Tuberositas ulnae', english: 'Ulnar tuberosity'},
      {latin: 'Corpus ulnae', english: 'Shaft of ulna'},
      {latin: 'Caput ulnae', english: 'Head of ulna'},
      {latin: 'Processus styloideus ulnae', english: 'Styloid process of ulna'},
    ],
    anatomyStandardUrl: `${AS}/extremitas-superior/ulna.html`,
    matchers: ['ulna'],
  },
  {
    id: 'scapula',
    title: 'Scapula',
    latin: 'Scapula',
    region: 'upper limb',
    overview:
      'The scapula is a flat triangular bone of the shoulder girdle. It articulates with the clavicle and humerus and glides on the thoracic wall, expanding the range of arm motion.',
    terms: [
      {latin: 'Spina scapulae', english: 'Spine of scapula'},
      {latin: 'Acromion', english: 'Acromion'},
      {latin: 'Processus coracoideus', english: 'Coracoid process'},
      {latin: 'Cavitas glenoidalis', english: 'Glenoid cavity'},
      {latin: 'Fossa supraspinata', english: 'Supraspinous fossa'},
      {latin: 'Fossa infraspinata', english: 'Infraspinous fossa'},
      {latin: 'Fossa subscapularis', english: 'Subscapular fossa'},
      {latin: 'Margo medialis', english: 'Medial border'},
      {latin: 'Margo lateralis', english: 'Lateral border'},
      {latin: 'Angulus inferior', english: 'Inferior angle'},
    ],
    anatomyStandardUrl: `${AS}/extremitas-superior/scapula.html`,
    matchers: ['scapula'],
  },
  {
    id: 'clavicle',
    title: 'Clavicle',
    latin: 'Clavicula',
    region: 'upper limb',
    overview:
      'The clavicle is an S-shaped strut linking the sternum to the scapula. It is the only bony attachment of the upper limb to the axial skeleton and protects neurovascular structures at the thoracic inlet.',
    terms: [
      {latin: 'Extremitas sternalis', english: 'Sternal end'},
      {latin: 'Extremitas acromialis', english: 'Acromial end'},
      {latin: 'Corpus claviculae', english: 'Shaft of clavicle'},
      {latin: 'Facies articularis sternalis', english: 'Sternal articular surface'},
      {latin: 'Facies articularis acromialis', english: 'Acromial articular surface'},
    ],
    anatomyStandardUrl: `${AS}/extremitas-superior/clavicula.html`,
    matchers: ['clavicle'],
  },
  {
    id: 'sternum',
    title: 'Sternum',
    latin: 'Sternum',
    region: 'thorax',
    overview:
      'The sternum is the flat bone of the anterior chest wall. Manubrium, body, and xiphoid process articulate with the clavicles and costal cartilages to stabilize the thoracic cage.',
    terms: [
      {latin: 'Manubrium sterni', english: 'Manubrium'},
      {latin: 'Corpus sterni', english: 'Body of sternum'},
      {latin: 'Processus xiphoideus', english: 'Xiphoid process'},
      {latin: 'Incisura jugularis', english: 'Jugular notch'},
      {latin: 'Angulus sterni', english: 'Sternal angle'},
      {latin: 'Incisura clavicularis', english: 'Clavicular notch'},
    ],
    anatomyStandardUrl: `${AS}/thorax/cavea-thoracis.html`,
    matchers: ['body of sternum', 'manubrium', 'xiphoid'],
  },
  {
    id: 'rib',
    title: 'Rib',
    latin: 'Costa',
    region: 'thorax',
    overview:
      'Ribs curve from the thoracic vertebrae to the sternum or free anterior ends. Head, neck, and tubercle articulate with the spine; the shaft and costal cartilage complete the thoracic wall.',
    terms: [
      {latin: 'Caput costae', english: 'Head of rib'},
      {latin: 'Collum costae', english: 'Neck of rib'},
      {latin: 'Tuberculum costae', english: 'Tubercle of rib'},
      {latin: 'Corpus costae', english: 'Body of rib'},
      {latin: 'Angulus costae', english: 'Angle of rib'},
      {latin: 'Sulcus costae', english: 'Costal groove'},
      {latin: 'Cartilago costalis', english: 'Costal cartilage'},
    ],
    anatomyStandardUrl: `${AS}/thorax/cavea-thoracis.html`,
    matchers: ['costal cartilage', 'rib'],
  },
  {
    id: 'cervical-vertebra',
    title: 'Cervical vertebra',
    latin: 'Vertebra cervicalis',
    region: 'vertebral column',
    overview:
      'Cervical vertebrae support the head and allow wide ranges of motion. Typical features include a bifid spinous process and transverse foramina for the vertebral vessels. Atlas (C1) and axis (C2) are specialized.',
    terms: [
      {latin: 'Corpus vertebrae', english: 'Vertebral body'},
      {latin: 'Arcus vertebrae', english: 'Vertebral arch'},
      {latin: 'Foramen vertebrale', english: 'Vertebral foramen'},
      {latin: 'Processus spinosus', english: 'Spinous process'},
      {latin: 'Processus transversus', english: 'Transverse process'},
      {latin: 'Foramen transversarium', english: 'Transverse foramen'},
      {latin: 'Processus articularis superior', english: 'Superior articular process'},
    ],
    anatomyStandardUrl: `${AS}/columna-vertebralis/vertebra-cervicalis-typica.html`,
    matchers: ['cervical vertebra'],
  },
  {
    id: 'atlas',
    title: 'Atlas',
    latin: 'Atlas (C1)',
    region: 'vertebral column',
    overview:
      'The atlas is the first cervical vertebra. It lacks a body and carries the skull on its superior articular facets, enabling nodding at the atlanto-occipital joints.',
    terms: [
      {latin: 'Arcus anterior atlantis', english: 'Anterior arch'},
      {latin: 'Arcus posterior atlantis', english: 'Posterior arch'},
      {latin: 'Massa lateralis', english: 'Lateral mass'},
      {latin: 'Fovea dentis', english: 'Facet for dens'},
      {latin: 'Facies articularis superior', english: 'Superior articular facet'},
    ],
    anatomyStandardUrl: `${AS}/columna-vertebralis/atlas.html`,
    matchers: ['^atlas$', 'atlas'],
  },
  {
    id: 'axis',
    title: 'Axis',
    latin: 'Axis (C2)',
    region: 'vertebral column',
    overview:
      'The axis is the second cervical vertebra. Its dens (odontoid process) articulates with the atlas and serves as a pivot for head rotation.',
    terms: [
      {latin: 'Dens axis', english: 'Dens (odontoid process)'},
      {latin: 'Corpus vertebrae', english: 'Vertebral body'},
      {latin: 'Processus spinosus', english: 'Spinous process'},
      {latin: 'Facies articularis anterior dentis', english: 'Anterior articular facet of dens'},
    ],
    anatomyStandardUrl: `${AS}/columna-vertebralis/axis.html`,
    matchers: ['^axis$', 'axis'],
  },
  {
    id: 'thoracic-vertebra',
    title: 'Thoracic vertebra',
    latin: 'Vertebra thoracica',
    region: 'vertebral column',
    overview:
      'Thoracic vertebrae articulate with ribs at costal facets on the bodies and transverse processes. Their spinous processes are typically long and angled inferiorly.',
    terms: [
      {latin: 'Corpus vertebrae', english: 'Vertebral body'},
      {latin: 'Fovea costalis superior', english: 'Superior costal facet'},
      {latin: 'Fovea costalis inferior', english: 'Inferior costal facet'},
      {latin: 'Fovea costalis processus transversi', english: 'Transverse costal facet'},
      {latin: 'Processus spinosus', english: 'Spinous process'},
      {latin: 'Foramen vertebrale', english: 'Vertebral foramen'},
      {latin: 'Pediculus arcus vertebrae', english: 'Pedicle'},
    ],
    anatomyStandardUrl: `${AS}/columna-vertebralis/vertebra-thoracica-typica.html`,
    matchers: ['thoracic vertebra'],
  },
  {
    id: 'lumbar-vertebra',
    title: 'Lumbar vertebra',
    latin: 'Vertebra lumbalis',
    region: 'vertebral column',
    overview:
      'Lumbar vertebrae have large bodies adapted for load bearing. Robust pedicles and short, broad spinous processes characterize this region of the spine.',
    terms: [
      {latin: 'Corpus vertebrae', english: 'Vertebral body'},
      {latin: 'Processus costiformis', english: 'Costal (transverse) process'},
      {latin: 'Processus spinosus', english: 'Spinous process'},
      {latin: 'Processus articularis superior', english: 'Superior articular process'},
      {latin: 'Processus articularis inferior', english: 'Inferior articular process'},
      {latin: 'Foramen vertebrale', english: 'Vertebral foramen'},
    ],
    anatomyStandardUrl: `${AS}/columna-vertebralis/vertebra-lumbalis.html`,
    matchers: ['lumbar vertebra'],
  },
  {
    id: 'frontal-bone',
    title: 'Frontal bone',
    latin: 'Os frontale',
    region: 'cranium',
    overview:
      'The frontal bone forms the forehead and the roofs of the orbits. It contributes to the anterior cranial fossa and houses the frontal sinuses in many adults.',
    terms: [
      {latin: 'Squama frontalis', english: 'Frontal squama'},
      {latin: 'Facies orbitalis', english: 'Orbital surface'},
      {latin: 'Margo supraorbitalis', english: 'Supraorbital margin'},
      {latin: 'Glabella', english: 'Glabella'},
      {latin: 'Sinus frontalis', english: 'Frontal sinus'},
    ],
    anatomyStandardUrl: `${AS}/cranium/os-frontale.html`,
    matchers: ['frontal bone'],
  },
  {
    id: 'parietal-bone',
    title: 'Parietal bone',
    latin: 'Os parietale',
    region: 'cranium',
    overview:
      'Paired parietal bones form much of the cranial vault. Their sutures meet the frontal, occipital, temporal, and contralateral parietal bones.',
    terms: [
      {latin: 'Facies externa', english: 'External surface'},
      {latin: 'Facies interna', english: 'Internal surface'},
      {latin: 'Margo sagittalis', english: 'Sagittal border'},
      {latin: 'Margo squamosus', english: 'Squamous border'},
      {latin: 'Tuber parietale', english: 'Parietal eminence'},
    ],
    anatomyStandardUrl: `${AS}/cranium/os-parietale.html`,
    matchers: ['parietal bone'],
  },
  {
    id: 'occipital-bone',
    title: 'Occipital bone',
    latin: 'Os occipitale',
    region: 'cranium',
    overview:
      'The occipital bone forms the posterior cranial vault and foramen magnum. Condylar surfaces articulate with the atlas, transmitting head weight onto the cervical spine.',
    terms: [
      {latin: 'Foramen magnum', english: 'Foramen magnum'},
      {latin: 'Condylus occipitalis', english: 'Occipital condyle'},
      {latin: 'Squama occipitalis', english: 'Occipital squama'},
      {latin: 'Protuberantia occipitalis externa', english: 'External occipital protuberance'},
      {latin: 'Clivus', english: 'Clivus'},
    ],
    anatomyStandardUrl: `${AS}/cranium/os-occipitale.html`,
    matchers: ['occipital bone'],
  },
  {
    id: 'temporal-bone',
    title: 'Temporal bone',
    latin: 'Os temporale',
    region: 'cranium',
    overview:
      'Each temporal bone houses the middle and inner ear and articulates with the mandible at the temporomandibular joint. Squamous, petrous, and mastoid parts meet neighboring cranial bones.',
    terms: [
      {latin: 'Pars squamosa', english: 'Squamous part'},
      {latin: 'Pars petrosa', english: 'Petrous part'},
      {latin: 'Processus mastoideus', english: 'Mastoid process'},
      {latin: 'Processus zygomaticus', english: 'Zygomatic process'},
      {latin: 'Meatus acusticus externus', english: 'External acoustic meatus'},
      {latin: 'Fossa mandibularis', english: 'Mandibular fossa'},
    ],
    anatomyStandardUrl: `${AS}/cranium/os-temporale.html`,
    matchers: ['temporal bone'],
  },
  {
    id: 'sphenoid',
    title: 'Sphenoid bone',
    latin: 'Os sphenoidale',
    region: 'cranium',
    overview:
      'The sphenoid sits at the cranial base and articulates with many skull bones. Its body contains the sella turcica; greater and lesser wings form parts of the middle cranial fossa and orbits.',
    terms: [
      {latin: 'Corpus ossis sphenoidalis', english: 'Body of sphenoid'},
      {latin: 'Ala major', english: 'Greater wing'},
      {latin: 'Ala minor', english: 'Lesser wing'},
      {latin: 'Sella turcica', english: 'Sella turcica'},
      {latin: 'Processus pterygoideus', english: 'Pterygoid process'},
    ],
    anatomyStandardUrl: `${AS}/cranium/os-sphenoidale.html`,
    matchers: ['sphenoid'],
  },
  {
    id: 'ethmoid',
    title: 'Ethmoid',
    latin: 'Os ethmoidale',
    region: 'cranium',
    overview:
      'The ethmoid contributes to the nasal cavity, medial orbital walls, and anterior cranial fossa. Its cribriform plate transmits olfactory filaments.',
    terms: [
      {latin: 'Lamina cribrosa', english: 'Cribriform plate'},
      {latin: 'Lamina perpendicularis', english: 'Perpendicular plate'},
      {latin: 'Labyrinthus ethmoidalis', english: 'Ethmoidal labyrinth'},
      {latin: 'Crista galli', english: 'Crista galli'},
    ],
    anatomyStandardUrl: `${AS}/cranium/os-ethmoidale.html`,
    matchers: ['ethmoid'],
  },
  {
    id: 'mandible',
    title: 'Mandible',
    latin: 'Mandibula',
    region: 'cranium',
    overview:
      'The mandible is the lower jaw. Its body carries the lower teeth; the rami rise to condylar and coronoid processes that articulate and receive muscle attachments for mastication.',
    terms: [
      {latin: 'Corpus mandibulae', english: 'Body of mandible'},
      {latin: 'Ramus mandibulae', english: 'Ramus of mandible'},
      {latin: 'Processus condylaris', english: 'Condylar process'},
      {latin: 'Processus coronoideus', english: 'Coronoid process'},
      {latin: 'Angulus mandibulae', english: 'Angle of mandible'},
      {latin: 'Foramen mentale', english: 'Mental foramen'},
    ],
    anatomyStandardUrl: `${AS}/cranium/mandibula.html`,
    matchers: ['mandible'],
  },
  {
    id: 'maxilla',
    title: 'Maxilla',
    latin: 'Maxilla',
    region: 'cranium',
    overview:
      'Paired maxillae form the upper jaw, much of the midface, and the floors of the orbits and nasal cavity. They contain the maxillary sinuses and support the upper dental arch.',
    terms: [
      {latin: 'Corpus maxillae', english: 'Body of maxilla'},
      {latin: 'Processus zygomaticus', english: 'Zygomatic process'},
      {latin: 'Processus frontalis', english: 'Frontal process'},
      {latin: 'Processus palatinus', english: 'Palatine process'},
      {latin: 'Processus alveolaris', english: 'Alveolar process'},
      {latin: 'Sinus maxillaris', english: 'Maxillary sinus'},
    ],
    anatomyStandardUrl: `${AS}/cranium/ossa-viscerocranii.html`,
    matchers: ['maxilla'],
  },
  {
    id: 'zygomatic',
    title: 'Zygomatic bone',
    latin: 'Os zygomaticum',
    region: 'cranium',
    overview:
      'The zygomatic bone forms the prominence of the cheek and part of the lateral orbital wall. It bridges the maxilla and temporal bone via the zygomatic arch.',
    terms: [
      {latin: 'Facies lateralis', english: 'Lateral surface'},
      {latin: 'Facies orbitalis', english: 'Orbital surface'},
      {latin: 'Processus temporalis', english: 'Temporal process'},
      {latin: 'Processus frontalis', english: 'Frontal process'},
    ],
    anatomyStandardUrl: `${AS}/cranium/ossa-viscerocranii.html`,
    matchers: ['zygomatic'],
  },
  {
    id: 'nasal-bone',
    title: 'Nasal bone',
    latin: 'Os nasale',
    region: 'cranium',
    overview:
      'Paired nasal bones form the bridge of the nose. They articulate with the frontal bone above and the maxillae laterally.',
    terms: [
      {latin: 'Os nasale', english: 'Nasal bone'},
      {latin: 'Margo superior', english: 'Superior border'},
      {latin: 'Margo lateralis', english: 'Lateral border'},
    ],
    anatomyStandardUrl: `${AS}/cranium/ossa-viscerocranii.html`,
    matchers: ['nasal bone'],
  },
  {
    id: 'palatine',
    title: 'Palatine bone',
    latin: 'Os palatinum',
    region: 'cranium',
    overview:
      'The palatine bones contribute to the hard palate, nasal cavity, and orbit. Horizontal plates meet in the midline of the posterior hard palate.',
    terms: [
      {latin: 'Lamina horizontalis', english: 'Horizontal plate'},
      {latin: 'Lamina perpendicularis', english: 'Perpendicular plate'},
      {latin: 'Processus pyramidalis', english: 'Pyramidal process'},
    ],
    anatomyStandardUrl: `${AS}/cranium/ossa-viscerocranii.html`,
    matchers: ['palatine'],
  },
  {
    id: 'vomer',
    title: 'Vomer',
    latin: 'Vomer',
    region: 'cranium',
    overview:
      'The vomer is a thin unpaired bone forming the posteroinferior part of the nasal septum, separating the left and right nasal cavities.',
    terms: [
      {latin: 'Ala vomeris', english: 'Ala of vomer'},
      {latin: 'Sulcus vomeris', english: 'Groove of vomer'},
      {latin: 'Lamina vomeris', english: 'Plate of vomer'},
    ],
    anatomyStandardUrl: `${AS}/cranium/ossa-viscerocranii.html`,
    matchers: ['vomer'],
  },
  {
    id: 'hyoid',
    title: 'Hyoid bone',
    latin: 'Os hyoideum',
    region: 'cranium',
    overview:
      'The hyoid is a U-shaped bone in the anterior neck. It does not articulate with other bones; ligaments and muscles suspend it and link it to the tongue, larynx, and mandible.',
    terms: [
      {latin: 'Corpus ossis hyoidei', english: 'Body of hyoid'},
      {latin: 'Cornu majus', english: 'Greater horn'},
      {latin: 'Cornu minus', english: 'Lesser horn'},
    ],
    anatomyStandardUrl: `${AS}/cranium/os-hyoideum.html`,
    matchers: ['hyoid'],
  },
  {
    id: 'calcaneus',
    title: 'Calcaneus',
    latin: 'Calcaneus',
    region: 'lower limb',
    overview:
      'The calcaneus is the heel bone. It receives the Achilles tendon posteriorly and articulates with the talus above and the cuboid anteriorly as part of the hindfoot.',
    terms: [
      {latin: 'Tuber calcanei', english: 'Calcaneal tuberosity'},
      {latin: 'Sustentaculum tali', english: 'Sustentaculum tali'},
      {latin: 'Facies articularis talaris', english: 'Talar articular surfaces'},
      {latin: 'Facies articularis cuboidea', english: 'Cuboid articular surface'},
    ],
    anatomyStandardUrl: `${AS}/extremitas-inferior/calcaneus.html`,
    matchers: ['calcaneus'],
  },
  {
    id: 'talus',
    title: 'Talus',
    latin: 'Talus',
    region: 'lower limb',
    overview:
      'The talus transmits load from the tibia into the foot. It articulates with the tibia and fibula at the ankle and with the calcaneus and navicular in the hindfoot.',
    terms: [
      {latin: 'Corpus tali', english: 'Body of talus'},
      {latin: 'Collum tali', english: 'Neck of talus'},
      {latin: 'Caput tali', english: 'Head of talus'},
      {latin: 'Trochlea tali', english: 'Trochlea of talus'},
    ],
    anatomyStandardUrl: `${AS}/extremitas-inferior/talus.html`,
    matchers: ['talus'],
  },
  {
    id: 'metacarpal',
    title: 'Metacarpal bone',
    latin: 'Os metacarpale',
    region: 'upper limb',
    overview:
      'Five metacarpal bones form the skeleton of the palm. Each has a base articulating with the carpus, a shaft, and a head that forms a knuckle with the proximal phalanx.',
    terms: [
      {latin: 'Basis', english: 'Base'},
      {latin: 'Corpus', english: 'Shaft'},
      {latin: 'Caput', english: 'Head'},
    ],
    anatomyStandardUrl: `${AS}/extremitas-superior/ossa-metacarpi.html`,
    matchers: ['metacarpal'],
  },
  {
    id: 'metatarsal',
    title: 'Metatarsal bone',
    latin: 'Os metatarsale',
    region: 'lower limb',
    overview:
      'Five metatarsal bones form the midfoot skeleton ahead of the tarsus. They support body weight in stance and leverage for push-off during gait.',
    terms: [
      {latin: 'Basis', english: 'Base'},
      {latin: 'Corpus', english: 'Shaft'},
      {latin: 'Caput', english: 'Head'},
    ],
    anatomyStandardUrl: `${AS}/extremitas-inferior/ossa-metatarsi.html`,
    matchers: ['metatarsal'],
  },
  {
    id: 'phalanx',
    title: 'Phalanx',
    latin: 'Phalanx',
    region: 'upper limb',
    overview:
      'Phalanges are the bones of the fingers and toes. Proximal, middle, and distal rows articulate in series; the thumb and hallux have two phalanges each.',
    terms: [
      {latin: 'Phalanx proximalis', english: 'Proximal phalanx'},
      {latin: 'Phalanx media', english: 'Middle phalanx'},
      {latin: 'Phalanx distalis', english: 'Distal phalanx'},
      {latin: 'Basis / corpus / caput', english: 'Base / shaft / head'},
    ],
    anatomyStandardUrl: `${AS}/extremitas-superior/ossa-digitorum-manus.html`,
    matchers: ['phalanx'],
  },
  {
    id: 'carpal',
    title: 'Carpal bone',
    latin: 'Ossa carpi',
    region: 'upper limb',
    overview:
      'Eight carpal bones arrange in proximal and distal rows at the wrist. Together they transmit force between the forearm and metacarpals and form the floor of the carpal tunnel.',
    terms: [
      {latin: 'Os scaphoideum', english: 'Scaphoid'},
      {latin: 'Os lunatum', english: 'Lunate'},
      {latin: 'Os triquetrum', english: 'Triquetrum'},
      {latin: 'Os pisiforme', english: 'Pisiform'},
      {latin: 'Os trapezium', english: 'Trapezium'},
      {latin: 'Os trapezoideum', english: 'Trapezoid'},
      {latin: 'Os capitatum', english: 'Capitate'},
      {latin: 'Os hamatum', english: 'Hamate'},
    ],
    anatomyStandardUrl: `${AS}/extremitas-superior/ossa-carpi.html`,
    matchers: [
      'scaphoid',
      'lunate',
      'triquetral',
      'pisiform',
      'trapezium',
      'trapezoid',
      'capitate',
      'hamate',
    ],
  },
  {
    id: 'tarsal',
    title: 'Tarsal bone',
    latin: 'Ossa tarsi',
    region: 'lower limb',
    overview:
      'Tarsal bones form the hindfoot and midfoot skeleton. Beyond the talus and calcaneus, the navicular, cuboid, and cuneiforms shape the arches of the foot.',
    terms: [
      {latin: 'Os naviculare', english: 'Navicular'},
      {latin: 'Os cuboideum', english: 'Cuboid'},
      {latin: 'Os cuneiforme mediale', english: 'Medial cuneiform'},
      {latin: 'Os cuneiforme intermedium', english: 'Intermediate cuneiform'},
      {latin: 'Os cuneiforme laterale', english: 'Lateral cuneiform'},
    ],
    anatomyStandardUrl: `${AS}/extremitas-inferior/ossa-tarsi.html`,
    matchers: ['navicular', 'cuboid', 'cuneiform bone', 'sesamoid bone of'],
  },
];

/** Search suggestions that resolve to skeletal concepts when present in the atlas. */
export const BONE_SEARCH_SUGGESTIONS = [
  'femur',
  'humerus',
  'scapula',
  'clavicle',
  'tibia',
  'mandible',
  'frontal bone',
  'sacrum',
] as const;

const REGION_LABEL: Record<BoneRegion, string> = {
  cranium: 'Cranium',
  'vertebral column': 'Vertebral column',
  thorax: 'Thorax',
  'upper limb': 'Upper limb',
  pelvis: 'Pelvis',
  'lower limb': 'Lower limb',
};

export function boneRegionLabel(region: BoneRegion): string {
  return REGION_LABEL[region];
}

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
  // Word-boundary match avoids "tibia" hitting "tibialis", "fibula" hitting "fibularis".
  return new RegExp(`(?:^|\\s)${escapeRegExp(token)}(?:\\s|$)`).test(normalized);
}

/** Match a BodyParts3D structure name to a bone atlas entry. */
export function resolveBoneAtlas(name: string): BoneAtlasEntry | null {
  const n = normalizeName(name);
  if (!n) return null;

  // Prefer longer / more specific matchers first across all entries.
  const ranked = BONE_ATLAS.flatMap(entry =>
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
