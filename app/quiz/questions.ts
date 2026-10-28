/** The quiz bank and the generator that deals a quiz out of it. Each question has a topic and a level, so a
 *  visitor can ask for, say, ten hard questions on nerves, and names a concept the atlas can open, so an
 *  answer links straight to the structure in 3D. The first twelve keep their original order and option order:
 *  results saved before topics existed store answers by position in this list. */

import type {Lang} from '../landing/copy';

export type QuizTopic = 'bones' | 'muscles' | 'nerves' | 'joints' | 'heart' | 'organs';
export type QuizLevel = 1 | 2 | 3;

export const QUIZ_TOPICS: QuizTopic[] = ['bones', 'muscles', 'nerves', 'joints', 'heart', 'organs'];
export const QUIZ_LEVELS: QuizLevel[] = [1, 2, 3];

export interface QuizQuestion {
  id: string;
  topic: QuizTopic;
  level: QuizLevel;
  prompt: string;
  concept: string;
  options: string[];
  answer: number;
  explain: string;
  /** Options that read as a sequence (counts, spinal levels) are dealt in their written order. */
  keepOrder?: boolean;
}

// Options stay in Latin where they are names; nerves, movements and prose get Mongolian wording.
interface BankEntry extends QuizQuestion {
  mn: {prompt: string; explain: string; options?: string[]};
}

const BANK: BankEntry[] = [
  // The original twelve, in their original order.
  {
    id: 'biceps-action', topic: 'muscles', level: 1, concept: 'biceps brachii',
    prompt: 'Which muscle flexes the elbow and supinates the forearm?',
    options: ['Biceps brachii', 'Triceps brachii', 'Brachioradialis', 'Extensor digitorum'], answer: 0,
    explain: 'The biceps brachii flexes the elbow and rotates the palm up. It is supplied by the musculocutaneous nerve.',
    mn: {prompt: 'Тохойг нугалж, шууг супинаци хийдэг булчин аль нь вэ?', explain: 'Biceps brachii тохойг нугалж, алгыг дээш эргүүлнэ. Musculocutaneous мэдрэлээр мэдрүүлнэ.'},
  },
  {
    id: 'triceps-nerve', topic: 'nerves', level: 2, concept: 'triceps brachii',
    prompt: 'Which nerve supplies the triceps brachii?',
    options: ['Median nerve', 'Axillary nerve', 'Radial nerve', 'Ulnar nerve'], answer: 2,
    explain: 'The triceps is supplied by the radial nerve, which also drives every extensor muscle of the forearm.',
    mn: {prompt: 'Triceps brachii-г аль мэдрэл мэдрүүлдэг вэ?', explain: 'Triceps-ийг radial мэдрэл мэдрүүлнэ. Энэ мэдрэл шууны бүх сунгагч булчинг ч хөдөлгөнө.', options: ['Median мэдрэл', 'Axillary мэдрэл', 'Radial мэдрэл', 'Ulnar мэдрэл']},
  },
  {
    id: 'diaphragm-breath', topic: 'muscles', level: 1, concept: 'diaphragm',
    prompt: 'What is the main muscle of inspiration?',
    options: ['Serratus anterior', 'Diaphragm', 'Pectoralis minor', 'Latissimus dorsi'], answer: 1,
    explain: 'The diaphragm contracts and flattens to draw air into the lungs. It is supplied by the phrenic nerve.',
    mn: {prompt: 'Амьсгал авах гол булчин аль нь вэ?', explain: 'Diaphragm агшиж хавтгайрахдаа агаарыг уушгинд татна. Phrenic мэдрэлээр мэдрүүлнэ.'},
  },
  {
    id: 'rotator-cuff', topic: 'muscles', level: 2, concept: 'supraspinatus',
    prompt: 'Which four muscles form the rotator cuff?',
    options: [
      'Supraspinatus, infraspinatus, teres minor, subscapularis',
      'Deltoid, trapezius, rhomboid minor, levator scapulae',
      'Biceps, coracobrachialis, brachialis, brachioradialis',
      'Pectoralis major, pectoralis minor, serratus anterior, subclavius',
    ],
    answer: 0,
    explain: 'The cuff is supraspinatus, infraspinatus, teres minor and subscapularis. It holds the humeral head in the socket.',
    mn: {prompt: 'Мөрний ханцуйг (rotator cuff) бүрдүүлдэг дөрвөн булчин аль нь вэ?', explain: 'Supraspinatus, infraspinatus, teres minor, subscapularis. Эдгээр нь humerus-ийн толгойг үенд барина.'},
  },
  {
    id: 'brachialis-flexor', topic: 'muscles', level: 2, concept: 'brachialis',
    prompt: 'Which muscle is the prime mover of elbow flexion?',
    options: ['Brachialis', 'Triceps brachii', 'Anconeus', 'Pronator teres'], answer: 0,
    explain: 'The brachialis sits directly on the humerus and flexes the elbow whatever the forearm is doing.',
    mn: {prompt: 'Тохойн нугалтын үндсэн хөдөлгөгч булчин аль нь вэ?', explain: 'Brachialis нь humerus дээр шууд байрлаж, шуу ямар байрлалтай байхаас үл хамааран тохойг нугална.'},
  },
  {
    id: 'acl', topic: 'joints', level: 2, concept: 'anterior cruciate ligament',
    prompt: 'Which ligament stops the tibia sliding forwards in the knee?',
    options: ['Anterior cruciate ligament', 'Posterior cruciate ligament', 'Tibial collateral ligament', 'Fibular collateral ligament'], answer: 0,
    explain: 'The anterior cruciate ligament restrains forward translation of the tibia and helps lock the extended knee.',
    mn: {prompt: 'Өвдөгт tibia-г урагш гулгахаас сэргийлдэг шөрмөс аль нь вэ?', explain: 'Anterior cruciate ligament нь tibia-ийн урагшлах хөдөлгөөнийг хязгаарлаж, сунгасан өвдгийг түгжихэд тусална.'},
  },
  {
    id: 'scm-nerve', topic: 'nerves', level: 2, concept: 'sternocleidomastoid',
    prompt: 'Which nerve supplies the sternocleidomastoid?',
    options: ['Facial nerve', 'Spinal accessory nerve', 'Trigeminal nerve', 'Hypoglossal nerve'], answer: 1,
    explain: 'The sternocleidomastoid is supplied by the spinal accessory nerve. It turns the head to the opposite side and flexes the neck.',
    mn: {prompt: 'Sternocleidomastoid-ийг аль мэдрэл мэдрүүлдэг вэ?', explain: 'Spinal accessory мэдрэл. Толгойг эсрэг тал руу эргүүлж, хүзүүг нугална.', options: ['Facial мэдрэл', 'Spinal accessory мэдрэл', 'Trigeminal мэдрэл', 'Hypoglossal мэдрэл']},
  },
  {
    id: 'mouth-floor', topic: 'muscles', level: 3, concept: 'mylohyoid',
    prompt: 'Which muscle makes up the floor of the mouth?',
    options: ['Stylohyoid', 'Mylohyoid', 'Geniohyoid', 'Digastric'], answer: 1,
    explain: 'The mylohyoid spans from the mylohyoid line of the mandible to the hyoid and forms the muscular floor of the mouth.',
    mn: {prompt: 'Амны хөндийн шалыг бүрдүүлдэг булчин аль нь вэ?', explain: 'Mylohyoid нь эрүүний mylohyoid шугамаас hyoid хүртэл татаж, амны хөндийн булчинлаг шалыг үүсгэнэ.'},
  },
  {
    id: 'longest-bone', topic: 'bones', level: 1, concept: 'femur',
    prompt: 'Which bone is the longest in the body?',
    options: ['Tibia', 'Humerus', 'Femur', 'Ilium'], answer: 2,
    explain: 'The femur runs from the hip to the knee and carries the load of standing and walking.',
    mn: {prompt: 'Биеийн хамгийн урт яс аль нь вэ?', explain: 'Femur нь ташаанаас өвдөг хүртэл үргэлжилж, зогсох, алхах ачааллыг үүрдэг.'},
  },
  {
    id: 'thenar-nerve', topic: 'nerves', level: 3, concept: 'abductor pollicis brevis',
    prompt: 'Which nerve innervates the muscles of the thenar eminence?',
    options: ['Recurrent branch of the median nerve', 'Deep branch of the ulnar nerve', 'Radial nerve', 'Musculocutaneous nerve'], answer: 0,
    explain: 'The thenar muscles are supplied by the recurrent branch of the median nerve. A median nerve injury weakens thumb opposition.',
    mn: {prompt: 'Thenar eminence-ийн булчинг аль мэдрэл мэдрүүлдэг вэ?', explain: 'Median мэдрэлийн recurrent салбар. Энэ мэдрэл гэмтвэл эрхий хурууны эсэргүүцэл суларна.', options: ['Median мэдрэлийн recurrent салбар', 'Ulnar мэдрэлийн гүн салбар', 'Radial мэдрэл', 'Musculocutaneous мэдрэл']},
  },
  {
    id: 'gastrocnemius-action', topic: 'muscles', level: 1, concept: 'head of gastrocnemius',
    prompt: 'What does the gastrocnemius do?',
    options: ['Plantarflexes the ankle and flexes the knee', 'Dorsiflexes the foot and extends the knee', 'Abducts the thigh and flexes the hip', 'Extends the toes and everts the foot'], answer: 0,
    explain: 'The gastrocnemius points the foot and, because it crosses the knee, it also helps bend the knee. It is supplied by the tibial nerve.',
    mn: {prompt: 'Gastrocnemius юу хийдэг вэ?', explain: 'Хөлийг доош чиглүүлж, өвдгийг дайран өнгөрдөг тул өвдгийг нугалахад тусална. Tibial мэдрэлээр мэдрүүлнэ.', options: ['Шагайг plantar flexion хийж, өвдгийг нугална', 'Тавхайг dorsiflexion хийж, өвдгийг сунгана', 'Гуяыг холдуулж, ташааг нугална', 'Хөлийн хурууг сунгаж, тавхайг гадагш эргүүлнэ']},
  },
  {
    id: 'internal-rotator', topic: 'muscles', level: 2, concept: 'subscapularis',
    prompt: 'Which muscle rotates the arm inwards at the shoulder?',
    options: ['Infraspinatus', 'Teres minor', 'Subscapularis', 'Supraspinatus'], answer: 2,
    explain: 'The subscapularis is the only rotator cuff muscle on the front of the scapula, so it is the internal rotator of the cuff.',
    mn: {prompt: 'Мөрийг дотогш эргүүлдэг булчин аль нь вэ?', explain: 'Subscapularis нь scapula-ийн урд талын цорын ганц мөрний ханцуйн булчин тул гарыг дотогш эргүүлнэ.'},
  },

  // Bones
  {
    id: 'rib-pairs', topic: 'bones', level: 1, concept: 'rib cage', keepOrder: true,
    prompt: 'How many pairs of ribs does a typical adult have?',
    options: ['10', '11', '12', '14'], answer: 2,
    explain: 'There are twelve pairs: seven true ribs join the sternum directly, three false ribs join through cartilage, and two float free.',
    mn: {prompt: 'Насанд хүрсэн хүн ихэвчлэн хэдэн хос хавиргатай вэ?', explain: 'Арван хоёр хос: долоо нь өвчүүнд шууд, гурав нь мөгөөрсөөр дамжин холбогдож, хоёр нь чөлөөтэй үзүүртэй.'},
  },
  {
    id: 'mandible-moves', topic: 'bones', level: 1, concept: 'mandible',
    prompt: 'Which skull bone moves at a synovial joint to open the mouth?',
    options: ['Maxilla', 'Mandible', 'Zygomatic bone', 'Temporal bone'], answer: 1,
    explain: 'The mandible hinges and glides at the temporomandibular joint, which lets us open the mouth and chew.',
    mn: {prompt: 'Гавлын аль яс нь синовын үеээр хөдөлж амыг ангайлгадаг вэ?', explain: 'Mandible (доод эрүү) нь temporomandibular үеэр нугалж, гулсаж, амыг ангайлгаж, зажлуулна.'},
  },
  {
    id: 'heel-bone', topic: 'bones', level: 1, concept: 'calcaneus',
    prompt: 'Which bone forms the heel?',
    options: ['Talus', 'Calcaneus', 'Navicular', 'Cuboid'], answer: 1,
    explain: 'The calcaneus is the largest tarsal bone. The calcaneal tendon of the calf muscles inserts on its back.',
    mn: {prompt: 'Өсгийг бүрдүүлдэг яс аль нь вэ?', explain: 'Calcaneus бол шагайн хамгийн том яс. Шилбэний булчингийн calcaneal шөрмөс түүний ард наалдана.'},
  },
  {
    id: 'clavicle-strut', topic: 'bones', level: 1, concept: 'clavicle',
    prompt: 'Which bone braces the shoulder against the sternum?',
    options: ['Clavicle', 'Scapula', 'Humerus', 'First rib'], answer: 0,
    explain: 'The clavicle is a strut between the sternum and the acromion. The sternoclavicular joint is the only bony link between the arm and the trunk.',
    mn: {prompt: 'Мөрийг өвчүүтэй холбож тулгуур болдог яс аль нь вэ?', explain: 'Clavicle (эгэм) нь өвчүү ба acromion-ийн хоорондох тулгуур. Sternoclavicular үе нь гарыг их биетэй холбосон цорын ганц ясан холбоос.'},
  },
  {
    id: 'atlas-c1', topic: 'bones', level: 2, concept: 'atlas',
    prompt: 'Which vertebra has no body and carries the skull?',
    options: ['Atlas (C1)', 'Axis (C2)', 'Vertebra prominens (C7)', 'First thoracic vertebra (T1)'], answer: 0,
    explain: 'The atlas is a ring of bone without a vertebral body. Its upper facets cradle the occipital condyles, which lets the head nod.',
    mn: {prompt: 'Биегүй, гавлыг даадаг нугалам аль нь вэ?', explain: 'Atlas нь нугаламын биегүй цагираг яс. Дээд үений гадаргуу нь дагзны condyle-ийг тосож, толгойг дохиулна.'},
  },
  {
    id: 'scaphoid-fall', topic: 'bones', level: 2, concept: 'scaphoid',
    prompt: 'Which carpal bone is most often broken in a fall on an outstretched hand?',
    options: ['Scaphoid', 'Lunate', 'Pisiform', 'Hamate'], answer: 0,
    explain: 'The scaphoid bridges both rows of carpal bones. Its blood enters at the far end, so a fracture of its waist can starve the near half.',
    mn: {prompt: 'Сунгасан гар дээр унахад бугуйн аль яс хамгийн их хугардаг вэ?', explain: 'Scaphoid нь бугуйн хоёр эгнээ ясыг холбоно. Цус нь алслагдсан үзүүрээс ордог тул бэлхүүс хэсгээр хугарвал ойрын хагас нь цусгүй үлдэж болно.'},
  },
  {
    id: 'patella-sesamoid', topic: 'bones', level: 2, concept: 'patella',
    prompt: 'Which is the largest sesamoid bone in the body?',
    options: ['Patella', 'Pisiform', 'Hyoid bone', 'Calcaneus'], answer: 0,
    explain: 'The patella grows inside the quadriceps tendon and lengthens its lever arm, so knee extension needs less force.',
    mn: {prompt: 'Биеийн хамгийн том sesamoid яс аль нь вэ?', explain: 'Patella (тойг) нь quadriceps-ийн шөрмөс дотор ургаж, хөшүүргийн мөрийг уртасгадаг тул өвдгийг сунгахад бага хүч шаардана.'},
  },
  {
    id: 'foramen-magnum', topic: 'bones', level: 2, concept: 'occipital bone',
    prompt: 'Which skull bone contains the foramen magnum?',
    options: ['Occipital bone', 'Sphenoid bone', 'Temporal bone', 'Parietal bone'], answer: 0,
    explain: 'The foramen magnum in the occipital bone is where the medulla oblongata continues into the spinal cord.',
    mn: {prompt: 'Foramen magnum аль гавлын ясанд байдаг вэ?', explain: 'Occipital (дагзны) ясны foramen magnum-аар уртавтар тархи нугас руу үргэлжилнэ.'},
  },
  {
    id: 'hyoid-free', topic: 'bones', level: 2, concept: 'hyoid bone',
    prompt: 'Which bone does not form a joint with any other bone?',
    options: ['Hyoid bone', 'Vomer', 'Sacrum', 'Patella'], answer: 0,
    explain: 'The hyoid hangs in the neck from muscles and ligaments. It anchors the tongue and the muscles of swallowing.',
    mn: {prompt: 'Өөр ямар ч ястай үе үүсгэдэггүй яс аль нь вэ?', explain: 'Hyoid яс хүзүүнд булчин, шөрмөсөөр дүүжлэгдэнэ. Хэл ба залгих булчингуудын бэхэлгээ болдог.'},
  },
  {
    id: 'olecranon', topic: 'bones', level: 2, concept: 'ulna',
    prompt: 'The olecranon, the point of the elbow, belongs to which bone?',
    options: ['Radius', 'Ulna', 'Humerus', 'Scapula'], answer: 1,
    explain: 'The olecranon is the upper end of the ulna. The triceps inserts on it, and it locks into the humerus when the elbow straightens.',
    mn: {prompt: 'Тохойн үзүүр болох olecranon аль ясны хэсэг вэ?', explain: 'Olecranon бол ulna-ийн дээд үзүүр. Triceps түүнд наалдаж, тохой тэнийхэд humerus-д түгжигдэнэ.'},
  },
  {
    id: 'sacrum-fused', topic: 'bones', level: 2, concept: 'sacrum', keepOrder: true,
    prompt: 'How many vertebrae fuse to form the sacrum?',
    options: ['3', '4', '5', '7'], answer: 2,
    explain: 'Five sacral vertebrae fuse into the sacrum, which joins the hip bones at the sacro-iliac joints.',
    mn: {prompt: 'Sacrum (ууц) хэдэн нугалам нийлж үүсдэг вэ?', explain: 'Ууцны таван нугалам нийлж sacrum болох ба sacro-iliac үеэр аарцгийн ястай холбогдоно.'},
  },
  {
    id: 'sella-turcica', topic: 'bones', level: 3, concept: 'sphenoid bone',
    prompt: 'The pituitary gland sits in the sella turcica of which bone?',
    options: ['Sphenoid bone', 'Ethmoid bone', 'Frontal bone', 'Occipital bone'], answer: 0,
    explain: 'The sella turcica is a saddle-shaped hollow on the body of the sphenoid. A pituitary tumour can press up on the optic chiasm.',
    mn: {prompt: 'Өнчин тархины булчирхай аль ясны sella turcica-д байрладаг вэ?', explain: 'Sella turcica нь sphenoid ясны бие дээрх эмээл хэлбэрийн хотгор. Өнчин булчирхайн хавдар дээш optic chiasm-ийг дарж болно.'},
  },
  {
    id: 'talus-no-muscle', topic: 'bones', level: 3, concept: 'talus',
    prompt: 'Which tarsal bone has no muscles attached to it?',
    options: ['Calcaneus', 'Talus', 'Navicular', 'Medial cuneiform'], answer: 1,
    explain: 'The talus sits in the mortise of the tibia and fibula and is covered mostly by cartilage, so no muscle attaches to it.',
    mn: {prompt: 'Шагайн аль ясанд ямар ч булчин наалддаггүй вэ?', explain: 'Talus нь tibia, fibula-ийн хооронд суурилж, ихэнх гадаргуу нь мөгөөрсөөр бүрхэгдсэн тул булчин наалддаггүй.'},
  },

  {
    id: 'pterion', topic: 'bones', level: 3, concept: 'parietal bone',
    prompt: 'The pterion, a thin spot of the skull over the middle meningeal artery, is where which four bones meet?',
    options: ['Frontal, parietal, temporal and sphenoid', 'Frontal, parietal, occipital and temporal', 'Parietal, temporal, occipital and sphenoid', 'Frontal, ethmoid, sphenoid and zygomatic'], answer: 0,
    explain: 'A blow to the side of the head at the pterion can tear the middle meningeal artery and cause an extradural haematoma.',
    mn: {prompt: 'Middle meningeal артерийн дээрх гавлын нимгэн цэг болох pterion-д аль дөрвөн яс нийлдэг вэ?', explain: 'Pterion-д цохиулбал middle meningeal артери урагдаж, хатуу хальсны гадна цус хуралт үүсч болно.', options: ['Frontal, parietal, temporal, sphenoid', 'Frontal, parietal, occipital, temporal', 'Parietal, temporal, occipital, sphenoid', 'Frontal, ethmoid, sphenoid, zygomatic']},
  },

  // Muscles
  {
    id: 'deltoid-abduction', topic: 'muscles', level: 2, concept: 'acromial part of deltoid',
    prompt: 'Which muscle lifts the arm out to the side after supraspinatus starts the movement?',
    options: ['Deltoid', 'Teres major', 'Latissimus dorsi', 'Pectoralis major'], answer: 0,
    explain: 'Supraspinatus starts abduction and the acromial part of the deltoid carries it to about 90°. The deltoid is supplied by the axillary nerve.',
    mn: {prompt: 'Supraspinatus эхлүүлсний дараа гарыг хажуу тийш өргөдөг булчин аль нь вэ?', explain: 'Supraspinatus холдуулалтыг эхлүүлж, deltoid-ийн acromial хэсэг 90° орчим хүртэл үргэлжлүүлнэ. Deltoid-ийг axillary мэдрэл мэдрүүлнэ.'},
  },
  {
    id: 'hip-extensor', topic: 'muscles', level: 1, concept: 'gluteus maximus',
    prompt: 'Which muscle is the main extensor of the hip when climbing stairs or rising from a chair?',
    options: ['Gluteus maximus', 'Gluteus medius', 'Psoas major', 'Sartorius'], answer: 0,
    explain: 'The gluteus maximus is the largest muscle of the hip and extends it powerfully. It is supplied by the inferior gluteal nerve.',
    mn: {prompt: 'Шат өгсөх, сандлаас босоход ташааг сунгадаг гол булчин аль нь вэ?', explain: 'Gluteus maximus бол ташааны хамгийн том булчин бөгөөд ташааг хүчтэй сунгана. Inferior gluteal мэдрэлээр мэдрүүлнэ.'},
  },
  {
    id: 'longest-muscle', topic: 'muscles', level: 1, concept: 'sartorius',
    prompt: 'Which is the longest muscle in the body?',
    options: ['Sartorius', 'Rectus femoris', 'Gracilis', 'Semitendinosus'], answer: 0,
    explain: 'The sartorius runs from the anterior superior iliac spine across the thigh to the inside of the tibia. It flexes the hip and the knee.',
    mn: {prompt: 'Биеийн хамгийн урт булчин аль нь вэ?', explain: 'Sartorius нь аарцгийн урд дээд өргөснөөс гуяыг хөндлөн гарч tibia-ийн дотор талд наалдана. Ташаа, өвдгийг нугална.'},
  },
  {
    id: 'foot-drop-muscle', topic: 'muscles', level: 2, concept: 'tibialis anterior',
    prompt: 'Which muscle dorsiflexes and inverts the foot?',
    options: ['Tibialis anterior', 'Fibularis longus', 'Soleus', 'Tibialis posterior'], answer: 0,
    explain: 'The tibialis anterior lifts the foot and turns the sole inwards. If it is weak the toes drag, which is called foot drop.',
    mn: {prompt: 'Тавхайг dorsiflexion хийж, дотогш эргүүлдэг булчин аль нь вэ?', explain: 'Tibialis anterior тавхайг өргөж, улыг дотогш эргүүлнэ. Сул байвал хөлийн хуруу чирэгдэж, "унжсан тавхай" болно.'},
  },
  {
    id: 'winged-scapula', topic: 'muscles', level: 2, concept: 'serratus anterior',
    prompt: 'Paralysis of which muscle causes a winged scapula?',
    options: ['Serratus anterior', 'Rhomboid major', 'Pectoralis minor', 'Levator scapulae'], answer: 0,
    explain: 'The serratus anterior holds the scapula flat on the chest wall. Damage to its long thoracic nerve lets the border of the scapula lift off.',
    mn: {prompt: 'Аль булчин саажвал далны яс "далавч" шиг товойдог вэ?', explain: 'Serratus anterior далны ясыг цээжний хананд наалдуулж барина. Long thoracic мэдрэл гэмтвэл далны ирмэг хөндийрнө.'},
  },
  {
    id: 'trendelenburg', topic: 'muscles', level: 3, concept: 'gluteus medius',
    prompt: 'Standing on one leg, the pelvis drops on the other side. Which muscle is weak?',
    options: ['Gluteus medius', 'Gluteus maximus', 'Piriformis', 'Adductor longus'], answer: 0,
    explain: 'The gluteus medius holds the pelvis level in single-leg stance. Weakness, often from superior gluteal nerve injury, gives a positive Trendelenburg sign.',
    mn: {prompt: 'Нэг хөл дээр зогсоход аарцаг нөгөө тал руугаа унжвал аль булчин сул байна вэ?', explain: 'Gluteus medius нэг хөл дээр зогсоход аарцгийг тэгш барина. Superior gluteal мэдрэл гэмтвэл сулран Trendelenburg шинж эерэг гарна.'},
  },
  {
    id: 'dip-flexor', topic: 'muscles', level: 3, concept: 'flexor digitorum profundus',
    prompt: 'Which muscle flexes the distal interphalangeal joints of the fingers?',
    options: ['Flexor digitorum profundus', 'Flexor digitorum superficialis', 'Palmaris longus', 'Extensor digitorum'], answer: 0,
    explain: 'The profundus tendons reach the distal phalanges. Its medial half is supplied by the ulnar nerve and its lateral half by the median nerve.',
    mn: {prompt: 'Хурууны алслагдсан үеийг нугалдаг булчин аль нь вэ?', explain: 'Profundus-ийн шөрмөс алслагдсан хуруун ясанд хүрнэ. Дотор хагасыг ulnar, гадна хагасыг median мэдрэл мэдрүүлнэ.'},
  },

  // Nerves, brain and spinal cord
  {
    id: 'phrenic-roots', topic: 'nerves', level: 2, concept: 'diaphragm', keepOrder: true,
    prompt: 'Which spinal segments give rise to the phrenic nerve that drives the diaphragm?',
    options: ['C3–C5', 'C5–T1', 'T1–T6', 'L1–L4'], answer: 0,
    explain: 'The phrenic nerve comes from C3, C4 and C5. A cord injury above C3 stops breathing, which is why students learn "C3, 4, 5 keeps the diaphragm alive".',
    mn: {prompt: 'Diaphragm-ийг хөдөлгөдөг phrenic мэдрэл нугасны аль сегментээс гардаг вэ?', explain: 'Phrenic мэдрэл C3, C4, C5-аас гарна. C3-аас дээш нугас гэмтвэл амьсгал зогсоно.'},
  },
  {
    id: 'largest-nerve', topic: 'nerves', level: 1, concept: 'sciatic nerve',
    prompt: 'Which is the largest nerve in the body?',
    options: ['Sciatic nerve', 'Femoral nerve', 'Vagus nerve', 'Obturator nerve'], answer: 0,
    explain: 'The sciatic nerve leaves the pelvis below the piriformis and runs down the back of the thigh before it splits into the tibial and common fibular nerves.',
    mn: {prompt: 'Биеийн хамгийн том мэдрэл аль нь вэ?', explain: 'Sciatic мэдрэл piriformis-ийн доогуур аарцгаас гарч, гуяны ар талаар уруудаад tibial ба common fibular мэдрэл болж салбарлана.', options: ['Sciatic мэдрэл', 'Femoral мэдрэл', 'Vagus мэдрэл', 'Obturator мэдрэл']},
  },
  {
    id: 'carpal-tunnel', topic: 'nerves', level: 1, concept: 'median nerve',
    prompt: 'Which nerve is compressed in carpal tunnel syndrome?',
    options: ['Median nerve', 'Ulnar nerve', 'Radial nerve', 'Axillary nerve'], answer: 0,
    explain: 'The median nerve passes under the flexor retinaculum with the finger flexor tendons. Pressure there numbs the thumb, index and middle fingers.',
    mn: {prompt: 'Бугуйн сувгийн хам шинжид аль мэдрэл дарагддаг вэ?', explain: 'Median мэдрэл хуруу нугалагч шөрмөсүүдийн хамт flexor retinaculum-ын доогуур өнгөрнө. Тэнд дарагдвал эрхий, долоовор, дунд хуруу мэдээ алдана.', options: ['Median мэдрэл', 'Ulnar мэдрэл', 'Radial мэдрэл', 'Axillary мэдрэл']},
  },
  {
    id: 'funny-bone', topic: 'nerves', level: 1, concept: 'ulnar nerve',
    prompt: 'Which nerve tingles when you knock your "funny bone"?',
    options: ['Ulnar nerve', 'Median nerve', 'Radial nerve', 'Musculocutaneous nerve'], answer: 0,
    explain: 'The ulnar nerve runs in a groove behind the medial epicondyle of the humerus, right under the skin, and supplies the little-finger side of the hand.',
    mn: {prompt: 'Тохойн "цахилгаан ясаа" мөргөхөд аль мэдрэл хорсдог вэ?', explain: 'Ulnar мэдрэл humerus-ийн medial epicondyle-ийн ард, арьсны дор шууд байрлах ховилоор өнгөрч, гарын чигчий талыг мэдрүүлнэ.', options: ['Ulnar мэдрэл', 'Median мэдрэл', 'Radial мэдрэл', 'Musculocutaneous мэдрэл']},
  },
  {
    id: 'fibular-neck', topic: 'nerves', level: 2, concept: 'common fibular nerve',
    prompt: 'A blow to the neck of the fibula causes foot drop. Which nerve is injured?',
    options: ['Common fibular nerve', 'Tibial nerve', 'Femoral nerve', 'Saphenous nerve'], answer: 0,
    explain: 'The common fibular nerve winds around the neck of the fibula just under the skin. It supplies the muscles that lift the foot.',
    mn: {prompt: 'Fibula-ийн хүзүүнд цохилт авснаар тавхай унжвал аль мэдрэл гэмтсэн бэ?', explain: 'Common fibular мэдрэл fibula-ийн хүзүүг арьсны дор тойрч өнгөрнө. Тавхайг өргөдөг булчингуудыг мэдрүүлнэ.', options: ['Common fibular мэдрэл', 'Tibial мэдрэл', 'Femoral мэдрэл', 'Saphenous мэдрэл']},
  },
  {
    id: 'quadriceps-nerve', topic: 'nerves', level: 2, concept: 'femoral nerve',
    prompt: 'Which nerve supplies the quadriceps femoris?',
    options: ['Femoral nerve', 'Obturator nerve', 'Sciatic nerve', 'Tibial nerve'], answer: 0,
    explain: 'The femoral nerve (L2–L4) enters the thigh under the inguinal ligament and drives the quadriceps, which straightens the knee.',
    mn: {prompt: 'Quadriceps femoris-ийг аль мэдрэл мэдрүүлдэг вэ?', explain: 'Femoral мэдрэл (L2–L4) цавины шөрмөсний доогуур гуя руу орж, өвдгийг тэнийлгэдэг quadriceps-ийг хөдөлгөнө.', options: ['Femoral мэдрэл', 'Obturator мэдрэл', 'Sciatic мэдрэл', 'Tibial мэдрэл']},
  },
  {
    id: 'surgical-neck', topic: 'nerves', level: 3, concept: 'axillary nerve',
    prompt: 'A fracture of the surgical neck of the humerus most often injures which nerve?',
    options: ['Axillary nerve', 'Radial nerve', 'Ulnar nerve', 'Musculocutaneous nerve'], answer: 0,
    explain: 'The axillary nerve winds around the surgical neck with the posterior circumflex humeral artery. Injury weakens the deltoid and numbs the skin over it.',
    mn: {prompt: 'Humerus-ийн мэс заслын хүзүү хугарахад ихэвчлэн аль мэдрэл гэмтдэг вэ?', explain: 'Axillary мэдрэл posterior circumflex humeral артерийн хамт мэс заслын хүзүүг тойрно. Гэмтвэл deltoid сулрах ба дээрх арьс мэдээ алдана.', options: ['Axillary мэдрэл', 'Radial мэдрэл', 'Ulnar мэдрэл', 'Musculocutaneous мэдрэл']},
  },
  {
    id: 'vagus-parasympathetic', topic: 'nerves', level: 2, concept: 'vagus nerve (x)',
    prompt: 'Which cranial nerve carries parasympathetic fibres to the heart, lungs and most of the gut?',
    options: ['Vagus nerve (X)', 'Glossopharyngeal nerve (IX)', 'Facial nerve (VII)', 'Accessory nerve (XI)'], answer: 0,
    explain: 'The vagus wanders from the brainstem through the neck, chest and abdomen. It slows the heart and drives digestion.',
    mn: {prompt: 'Зүрх, уушиг, гэдэсний ихэнх хэсэгт парасимпатик ширхэг хүргэдэг гавлын мэдрэл аль нь вэ?', explain: 'Vagus мэдрэл тархины ишнээс хүзүү, цээж, хэвлийгээр дамжин тэнүүчилнэ. Зүрхний цохилтыг удаашруулж, хоол боловсруулалтыг идэвхжүүлнэ.', options: ['Vagus мэдрэл (X)', 'Glossopharyngeal мэдрэл (IX)', 'Facial мэдрэл (VII)', 'Accessory мэдрэл (XI)']},
  },
  {
    id: 'facial-expression', topic: 'nerves', level: 1, concept: 'facial nerve (vii)',
    prompt: 'Which cranial nerve moves the muscles of facial expression?',
    options: ['Facial nerve (VII)', 'Trigeminal nerve (V)', 'Hypoglossal nerve (XII)', 'Oculomotor nerve (III)'], answer: 0,
    explain: 'The facial nerve leaves the skull through the stylomastoid foramen and fans out through the parotid gland. Damage gives Bell’s palsy.',
    mn: {prompt: 'Нүүрний хувирлын булчинг хөдөлгөдөг гавлын мэдрэл аль нь вэ?', explain: 'Facial мэдрэл stylomastoid нүхээр гавлаас гарч, шүлсний parotid булчирхайгаар сэнс шиг салбарлана. Гэмтвэл Bell-ийн саажилт үүснэ.', options: ['Facial мэдрэл (VII)', 'Trigeminal мэдрэл (V)', 'Hypoglossal мэдрэл (XII)', 'Oculomotor мэдрэл (III)']},
  },
  {
    id: 'cerebellum-balance', topic: 'nerves', level: 1, concept: 'cerebellum',
    prompt: 'Which part of the brain coordinates balance and smooth movement?',
    options: ['Cerebellum', 'Frontal lobe', 'Thalamus', 'Medulla oblongata'], answer: 0,
    explain: 'The cerebellum sits under the occipital lobes and compares intended movement with what the body is doing, then corrects it.',
    mn: {prompt: 'Тэнцвэр, жигд хөдөлгөөнийг зохицуулдаг тархины хэсэг аль нь вэ?', explain: 'Бага тархи (cerebellum) дагзны дэлбэнгийн доор байрлаж, төлөвлөсөн хөдөлгөөнийг бодит хөдөлгөөнтэй харьцуулан засна.', options: ['Бага тархи (cerebellum)', 'Магнайн дэлбэн', 'Thalamus', 'Уртавтар тархи']},
  },
  {
    id: 'cord-end', topic: 'nerves', level: 3, concept: 'spinal cord', keepOrder: true,
    prompt: 'At which vertebral level does the spinal cord usually end in an adult?',
    options: ['T10', 'L1–L2', 'L4–L5', 'S2'], answer: 1,
    explain: 'The conus medullaris ends at about L1–L2. A lumbar puncture is done at L3–L4 or L4–L5, below the cord.',
    mn: {prompt: 'Насанд хүрэгчдэд нугас ихэвчлэн аль нугаламын түвшинд төгсдөг вэ?', explain: 'Conus medullaris L1–L2 орчимд төгсөнө. Нурууны хатгалтыг нугаснаас доош L3–L4 эсвэл L4–L5-д хийдэг.'},
  },

  // Joints, ligaments and tendons
  {
    id: 'pcl', topic: 'joints', level: 2, concept: 'posterior cruciate ligament',
    prompt: 'Which ligament stops the tibia sliding backwards under the femur?',
    options: ['Posterior cruciate ligament', 'Anterior cruciate ligament', 'Patellar ligament', 'Fibular collateral ligament'], answer: 0,
    explain: 'The posterior cruciate ligament is the strongest ligament of the knee. A dashboard injury pushes the tibia back and can tear it.',
    mn: {prompt: 'Tibia-г femur-ийн доогуур хойш гулсахаас сэргийлдэг шөрмөс аль нь вэ?', explain: 'Posterior cruciate ligament бол өвдөгний хамгийн бат шөрмөс. Машины самбарт өвдөг цохигдох нь tibia-г хойш түлхэж, тасалж болно.'},
  },
  {
    id: 'mcl-valgus', topic: 'joints', level: 2, concept: 'superficial part of tibial collateral ligament',
    prompt: 'A blow to the outside of the knee stretches which ligament first?',
    options: ['Tibial collateral ligament', 'Fibular collateral ligament', 'Anterior cruciate ligament', 'Posterior cruciate ligament'], answer: 0,
    explain: 'A blow from the outside opens the inner side of the knee, so the tibial (medial) collateral ligament takes the strain first.',
    mn: {prompt: 'Өвдгийг гаднаас нь цохиход аль шөрмөс хамгийн түрүүнд татагддаг вэ?', explain: 'Гаднаас цохиход өвдгийн дотор тал нээгдэх тул tibial (дотор) collateral шөрмөс эхэлж ачаалал авна.'},
  },
  {
    id: 'medial-meniscus', topic: 'joints', level: 3, concept: 'medial meniscus',
    prompt: 'Which knee cartilage tears more often because it is fixed to the tibial collateral ligament?',
    options: ['Medial meniscus', 'Lateral meniscus', 'Infrapatellar fat pad', 'Articular cartilage of the patella'], answer: 0,
    explain: 'The medial meniscus is bound to the joint capsule and the tibial collateral ligament, so it cannot slip out of the way when the knee twists.',
    mn: {prompt: 'Tibial collateral шөрмөстэй бэхлэгдсэн тул аль мөгөөрс илүү их урагддаг вэ?', explain: 'Medial meniscus үений уут болон tibial collateral шөрмөстэй холбогдсон тул өвдөг мушгирахад зайлж чаддаггүй.'},
  },
  {
    id: 'achilles', topic: 'joints', level: 1, concept: 'calcaneal tendon',
    prompt: 'Which is the thickest and strongest tendon in the body?',
    options: ['Calcaneal (Achilles) tendon', 'Patellar ligament', 'Tendon of tibialis anterior', 'Tendon of fibularis longus'], answer: 0,
    explain: 'The calcaneal tendon joins the gastrocnemius and soleus to the heel. It carries several times body weight when we run.',
    mn: {prompt: 'Биеийн хамгийн зузаан, бат бөх шөрмөс аль нь вэ?', explain: 'Calcaneal шөрмөс gastrocnemius ба soleus-ийг өсгийтэй холбоно. Гүйхэд биеийн жингээс хэд дахин их ачаалал даана.', options: ['Calcaneal (Ахиллесийн) шөрмөс', 'Patellar шөрмөс', 'Tibialis anterior-ийн шөрмөс', 'Fibularis longus-ийн шөрмөс']},
  },
  {
    id: 'pubic-symphysis', topic: 'joints', level: 1, concept: 'pubic symphysis',
    prompt: 'Which joint joins the two hip bones at the front of the pelvis?',
    options: ['Pubic symphysis', 'Sacro-iliac joint', 'Hip joint', 'Lumbosacral joint'], answer: 0,
    explain: 'The pubic symphysis is a cartilaginous joint with a fibrocartilage disc. It widens slightly in pregnancy.',
    mn: {prompt: 'Аарцгийн урд талд хоёр ташааны ясыг холбодог үе аль нь вэ?', explain: 'Pubic symphysis нь фиброз мөгөөрсөн дисктэй мөгөөрсөн үе. Жирэмсэн үед бага зэрэг өргөсдөг.', options: ['Pubic symphysis', 'Sacro-iliac үе', 'Ташааны үе', 'Lumbosacral үе']},
  },
  {
    id: 'nucleus-pulposus', topic: 'joints', level: 2, concept: 'intervertebral disk',
    prompt: 'What is the soft centre of an intervertebral disc called?',
    options: ['Nucleus pulposus', 'Annulus fibrosus', 'Ligamentum flavum', 'Vertebral end plate'], answer: 0,
    explain: 'The gel-like nucleus pulposus is held in by the annulus fibrosus. In a slipped disc it bulges back and to the side onto a nerve root.',
    mn: {prompt: 'Нугалам хоорондын дискний зөөлөн төвийг юу гэдэг вэ?', explain: 'Гель шиг nucleus pulposus-ийг annulus fibrosus тойрон барина. Ивэрхийд тэр нь хойш, хажуу тийш товойж мэдрэлийн үндсийг дарна.'},
  },
  {
    id: 'shoulder-range', topic: 'joints', level: 1, concept: 'humerus',
    prompt: 'Which joint has the widest range of movement in the body?',
    options: ['Glenohumeral (shoulder) joint', 'Hip joint', 'Knee joint', 'Elbow joint'], answer: 0,
    explain: 'The humeral head is large and the glenoid is shallow, so the shoulder moves freely but dislocates more often than any other joint.',
    mn: {prompt: 'Биеийн хамгийн өргөн хүрээнд хөдөлдөг үе аль нь вэ?', explain: 'Humerus-ийн толгой том, glenoid хонхор гүехэн тул мөр чөлөөтэй хөдөлдөг ч бусад үеэс илүү их мултардаг.', options: ['Мөрний (glenohumeral) үе', 'Ташааны үе', 'Өвдөгний үе', 'Тохойн үе']},
  },
  {
    id: 'thumb-saddle', topic: 'joints', level: 2, concept: 'trapezium',
    prompt: 'The carpometacarpal joint of the thumb is which type of joint?',
    options: ['Saddle joint', 'Hinge joint', 'Ball-and-socket joint', 'Plane joint'], answer: 0,
    explain: 'The trapezium and the first metacarpal meet as two saddles, which lets the thumb swing across the palm in opposition.',
    mn: {prompt: 'Эрхий хурууны carpometacarpal үе ямар төрлийн үе вэ?', explain: 'Trapezium ба эхний метакарп яс хоёр эмээл шиг нийлдэг тул эрхий хурууг алга дундуур эргүүлж бусад хуруутай тулгах (opposition) боломжтой.', options: ['Эмээл хэлбэрийн үе', 'Нугасан үе', 'Бөмбөлөг-хонхор үе', 'Хавтгай үе']},
  },

  {
    id: 'unhappy-triad', topic: 'joints', level: 3, concept: 'anterior cruciate ligament',
    prompt: 'Which three structures are torn in the "unhappy triad" of the knee?',
    options: [
      'Anterior cruciate ligament, tibial collateral ligament, medial meniscus',
      'Posterior cruciate ligament, fibular collateral ligament, lateral meniscus',
      'Anterior cruciate ligament, posterior cruciate ligament, patellar ligament',
      'Tibial collateral ligament, lateral meniscus, calcaneal tendon',
    ],
    answer: 0,
    explain: 'A blow to the outside of the knee with the foot planted tears the ACL, the tibial collateral ligament and the medial meniscus that is bound to it.',
    mn: {prompt: 'Өвдөгний "азгүй гурвал" (unhappy triad) гэмтэлд аль гурван бүтэц урагддаг вэ?', explain: 'Хөл газарт тулсан үед өвдгийг гаднаас нь цохиход ACL, tibial collateral шөрмөс болон түүнд наалдсан medial meniscus хамт гэмтдэг.'},
  },
  {
    id: 'shoulder-dislocation', topic: 'joints', level: 3, concept: 'scapula',
    prompt: 'In which direction does the shoulder most often dislocate?',
    options: ['Anterior', 'Posterior', 'Superior', 'Inferior'], answer: 0,
    explain: 'The humeral head slips forwards and down, where the capsule is weakest. The axillary nerve can be stretched as it goes.',
    mn: {prompt: 'Мөр ихэвчлэн аль чиглэлд мултардаг вэ?', explain: 'Humerus-ийн толгой үений уутны хамгийн сул урд-доод хэсгээр гулсан гарна. Энэ үед axillary мэдрэл татагдаж гэмтэж болно.', options: ['Урагш (anterior)', 'Хойш (posterior)', 'Дээш (superior)', 'Доош (inferior)']},
  },

  // Heart and vessels
  {
    id: 'heart-chambers', topic: 'heart', level: 1, concept: 'heart', keepOrder: true,
    prompt: 'How many chambers does the human heart have?',
    options: ['2', '3', '4', '5'], answer: 2,
    explain: 'Two atria receive blood and two ventricles pump it out: the right side to the lungs, the left side to the body.',
    mn: {prompt: 'Хүний зүрх хэдэн хөндийтэй вэ?', explain: 'Хоёр тосгуур цус хүлээн авч, хоёр ховдол шахна: баруун тал нь уушиг руу, зүүн тал нь бие рүү.'},
  },
  {
    id: 'left-ventricle', topic: 'heart', level: 1, concept: 'left ventricle',
    prompt: 'Which chamber pumps blood into the aorta?',
    options: ['Left ventricle', 'Right ventricle', 'Left atrium', 'Right atrium'], answer: 0,
    explain: 'The left ventricle has the thickest wall of the heart because it pushes blood around the whole body.',
    mn: {prompt: 'Аль хөндий нь цусыг aorta руу шахдаг вэ?', explain: 'Зүүн ховдол цусыг бүх биеэр тойруулж шахдаг тул зүрхний хамгийн зузаан ханатай.', options: ['Зүүн ховдол', 'Баруун ховдол', 'Зүүн тосгуур', 'Баруун тосгуур']},
  },
  {
    id: 'mitral-valve', topic: 'heart', level: 1, concept: 'mitral valve',
    prompt: 'Which valve lies between the left atrium and the left ventricle?',
    options: ['Mitral valve', 'Tricuspid valve', 'Aortic valve', 'Pulmonary valve'], answer: 0,
    explain: 'The mitral valve has two cusps. It shuts when the left ventricle contracts so blood goes out the aorta, not back to the lungs.',
    mn: {prompt: 'Зүүн тосгуур ба зүүн ховдлын хооронд аль хавхлага байдаг вэ?', explain: 'Mitral хавхлага хоёр хавтастай. Зүүн ховдол агшихад хаагдаж, цусыг уушиг руу биш aorta руу гаргана.', options: ['Mitral хавхлага', 'Tricuspid хавхлага', 'Aorta-ийн хавхлага', 'Уушигны хавхлага']},
  },
  {
    id: 'pulmonary-trunk', topic: 'heart', level: 2, concept: 'pulmonary trunk',
    prompt: 'Which vessel carries deoxygenated blood from the right ventricle to the lungs?',
    options: ['Pulmonary trunk', 'Aorta', 'Pulmonary veins', 'Superior vena cava'], answer: 0,
    explain: 'The pulmonary trunk splits into the right and left pulmonary arteries. They are the only arteries that carry oxygen-poor blood.',
    mn: {prompt: 'Хүчилтөрөгч багатай цусыг баруун ховдлоос уушиг руу зөөдөг судас аль нь вэ?', explain: 'Pulmonary trunk баруун, зүүн уушигны артери болж салаална. Тэдгээр нь хүчилтөрөгч муутай цус зөөдөг цорын ганц артериуд.', options: ['Pulmonary trunk', 'Aorta', 'Уушигны венүүд', 'Дээд хөндий вен']},
  },
  {
    id: 'svc', topic: 'heart', level: 2, concept: 'superior vena cava',
    prompt: 'Which vessel returns blood from the head, neck and arms to the right atrium?',
    options: ['Superior vena cava', 'Inferior vena cava', 'Coronary sinus', 'Azygos vein'], answer: 0,
    explain: 'The left and right brachiocephalic veins join to form the superior vena cava, which empties into the top of the right atrium.',
    mn: {prompt: 'Толгой, хүзүү, гарын цусыг баруун тосгуурт буцаадаг судас аль нь вэ?', explain: 'Зүүн, баруун brachiocephalic вен нийлж дээд хөндий вен болж, баруун тосгуурын дээд хэсэгт цутгана.', options: ['Дээд хөндий вен', 'Доод хөндий вен', 'Coronary sinus', 'Azygos вен']},
  },
  {
    id: 'coronary-supply', topic: 'heart', level: 1, concept: 'coronary artery',
    prompt: 'Which arteries supply the heart muscle itself?',
    options: ['Coronary arteries', 'Pulmonary arteries', 'Bronchial arteries', 'Intercostal arteries'], answer: 0,
    explain: 'The coronary arteries arise from the aorta just above the aortic valve. A blocked coronary artery causes a heart attack.',
    mn: {prompt: 'Зүрхний булчинг өөрийг нь цусаар хангадаг артериуд аль нь вэ?', explain: 'Титэм (coronary) артериуд aorta-ийн хавхлагын яг дээрээс гарна. Титэм артери бөглөрвөл зүрхний шигдээс болно.', options: ['Титэм (coronary) артериуд', 'Уушигны артериуд', 'Гуурсан хоолойн артериуд', 'Хавирга хоорондын артериуд']},
  },
  {
    id: 'sa-node', topic: 'heart', level: 2, concept: 'right atrium',
    prompt: 'Where does each normal heartbeat start?',
    options: ['Sinoatrial node', 'Atrioventricular node', 'Bundle of His', 'Purkinje fibres'], answer: 0,
    explain: 'The sinoatrial node sits in the wall of the right atrium near the opening of the superior vena cava and sets the pace of the heart.',
    mn: {prompt: 'Зүрхний хэвийн цохилт бүр хаанаас эхэлдэг вэ?', explain: 'Sinoatrial зангилаа баруун тосгуурын хананд, дээд хөндий венийн амсрын ойролцоо байрлаж зүрхний хэмнэлийг тогтооно.', options: ['Sinoatrial зангилаа', 'Atrioventricular зангилаа', 'His-ийн багц', 'Purkinje ширхэг']},
  },
  {
    id: 'carotid-pulse', topic: 'heart', level: 1, concept: 'common carotid artery',
    prompt: 'Which artery do you feel for a pulse at the side of the neck?',
    options: ['Common carotid artery', 'Vertebral artery', 'Subclavian artery', 'Internal jugular vein'], answer: 0,
    explain: 'The common carotid artery runs beside the trachea in front of the sternocleidomastoid and splits into the internal and external carotids.',
    mn: {prompt: 'Хүзүүний хажуугаас судасны цохилтыг аль артериас тэмтэрдэг вэ?', explain: 'Нийтлэг гүрээний артери sternocleidomastoid-ийн урд, гуурсан хоолойн хажуугаар өгсөж, дотор ба гадна гүрээ болж салаална.', options: ['Нийтлэг гүрээний артери', 'Vertebral артери', 'Subclavian артери', 'Дотор jugular вен']},
  },
  {
    id: 'great-saphenous', topic: 'heart', level: 2, concept: 'great saphenous vein',
    prompt: 'Which is the longest vein in the body, often used for coronary bypass grafts?',
    options: ['Great saphenous vein', 'Femoral vein', 'Small saphenous vein', 'Popliteal vein'], answer: 0,
    explain: 'The great saphenous vein runs from the inner ankle up the inside of the leg to the femoral vein in the groin.',
    mn: {prompt: 'Титэм судасны шунт хагалгаанд ихэвчлэн ашигладаг биеийн хамгийн урт вен аль нь вэ?', explain: 'Great saphenous вен шагайн дотор талаас хөлийн дотор талаар өгсөж, цавинд femoral венд цутгана.', options: ['Great saphenous вен', 'Femoral вен', 'Small saphenous вен', 'Popliteal вен']},
  },
  {
    id: 'aortic-arch', topic: 'heart', level: 3, concept: 'arch of aorta',
    prompt: 'Which of these does NOT branch directly from the arch of the aorta?',
    options: ['Brachiocephalic trunk', 'Left common carotid artery', 'Left subclavian artery', 'Right common carotid artery'], answer: 3,
    explain: 'The arch gives off three branches. The right common carotid comes from the brachiocephalic trunk, not from the arch itself.',
    mn: {prompt: 'Aorta-ийн нумаас шууд салбарладаггүй нь аль вэ?', explain: 'Нум гурван салбар өгнө. Баруун нийтлэг гүрээний артери нумаас биш brachiocephalic их биеэс гардаг.', options: ['Brachiocephalic их бие', 'Зүүн нийтлэг гүрээний артери', 'Зүүн subclavian артери', 'Баруун нийтлэг гүрээний артери']},
  },
  {
    id: 'lad', topic: 'heart', level: 3, concept: 'left coronary artery',
    prompt: 'Which coronary branch supplies the front of the interventricular septum and is most often blocked in heart attacks?',
    options: ['Anterior interventricular branch', 'Circumflex branch', 'Right marginal branch', 'Posterior interventricular branch'], answer: 0,
    explain: 'The anterior interventricular (left anterior descending) branch of the left coronary artery feeds much of the left ventricle and the front of the septum.',
    mn: {prompt: 'Ховдол хоорондын таславчийн урд хэсгийг хангадаг, шигдээсийн үед хамгийн их бөглөрдөг титэм салбар аль нь вэ?', explain: 'Зүүн титэм артерийн урд interventricular (LAD) салбар зүүн ховдлын ихэнх хэсэг болон таславчийн урд талыг тэжээнэ.', options: ['Урд interventricular салбар', 'Circumflex салбар', 'Баруун marginal салбар', 'Хойд interventricular салбар']},
  },

  {
    id: 'foramen-ovale', topic: 'heart', level: 3, concept: 'right atrium',
    prompt: 'Which fetal opening between the atria normally closes after birth, leaving the fossa ovalis?',
    options: ['Foramen ovale', 'Ductus arteriosus', 'Ductus venosus', 'Umbilical vein'], answer: 0,
    explain: 'Before birth the foramen ovale lets blood pass from the right to the left atrium and skip the lungs. After the first breaths, higher left atrial pressure presses it shut.',
    mn: {prompt: 'Төрсний дараа хаагдаж fossa ovalis үлдээдэг, тосгуур хоорондын ургийн нүх аль нь вэ?', explain: 'Төрөхөөс өмнө foramen ovale цусыг баруунаас зүүн тосгуур руу уушгийг тойруулан дамжуулна. Анхны амьсгалын дараа зүүн тосгуурын даралт ихсэж түүнийг хаана.', options: ['Foramen ovale', 'Ductus arteriosus', 'Ductus venosus', 'Хүйн вен']},
  },

  // Organs
  {
    id: 'largest-organ', topic: 'organs', level: 1, concept: 'liver',
    prompt: 'Which is the largest internal organ?',
    options: ['Liver', 'Stomach', 'Spleen', 'Pancreas'], answer: 0,
    explain: 'The liver fills the upper right abdomen under the diaphragm. It makes bile, stores glycogen and clears drugs and toxins.',
    mn: {prompt: 'Хамгийн том дотор эрхтэн аль нь вэ?', explain: 'Элэг хэвлийн баруун дээд хэсгийг diaphragm-ийн доор эзэлнэ. Цөс ялгаруулж, гликоген хуримтлуулж, эм, хорыг цэвэрлэнэ.', options: ['Элэг', 'Ходоод', 'Дэлүү', 'Нойр булчирхай']},
  },
  {
    id: 'bile-store', topic: 'organs', level: 1, concept: 'gallbladder',
    prompt: 'Where is bile stored and concentrated between meals?',
    options: ['Gallbladder', 'Pancreas', 'Duodenum', 'Spleen'], answer: 0,
    explain: 'The gallbladder lies under the liver. After a fatty meal it squeezes bile down the common bile duct into the duodenum.',
    mn: {prompt: 'Хоол хоорондын хугацаанд цөсийг хаана хадгалж өтгөрүүлдэг вэ?', explain: 'Цөсний хүүдий элэгний доор байрлана. Тослог хоолны дараа агшиж, цөсийг цөсний ерөнхий цоргоор арван хоёр хуруу гэдсэнд шахна.', options: ['Цөсний хүүдий', 'Нойр булчирхай', 'Арван хоёр хуруу гэдэс', 'Дэлүү']},
  },
  {
    id: 'insulin', topic: 'organs', level: 1, concept: 'pancreas',
    prompt: 'Which organ makes insulin?',
    options: ['Pancreas', 'Liver', 'Thyroid gland', 'Adrenal gland'], answer: 0,
    explain: 'Beta cells in the islets of the pancreas release insulin. The same organ also makes digestive enzymes for the duodenum.',
    mn: {prompt: 'Инсулин ялгаруулдаг эрхтэн аль нь вэ?', explain: 'Нойр булчирхайн арлын бета эсүүд инсулин ялгаруулна. Мөн арван хоёр хуруу гэдсэнд хоол боловсруулах фермент гаргадаг.', options: ['Нойр булчирхай', 'Элэг', 'Бамбай булчирхай', 'Бөөрний дээд булчирхай']},
  },
  {
    id: 'epiglottis', topic: 'organs', level: 2, concept: 'epiglottis',
    prompt: 'Which flap closes over the entrance to the larynx when you swallow?',
    options: ['Epiglottis', 'Thyroid cartilage', 'Soft palate', 'Vocal folds'], answer: 0,
    explain: 'As the larynx rises during swallowing, the epiglottis tips back over its inlet so food passes into the oesophagus, not the trachea.',
    mn: {prompt: 'Залгихад төвөнхийн орцыг хаадаг хавхаг аль нь вэ?', explain: 'Залгих үед төвөнх дээш өргөгдөж, epiglottis орцыг нь халхалснаар хоол гуурсан хоолой биш улаан хоолой руу орно.', options: ['Epiglottis', 'Бамбай мөгөөрс', 'Зөөлөн тагнай', 'Дууны хөвч']},
  },
  {
    id: 'right-lung-lobes', topic: 'organs', level: 1, concept: 'right lung', keepOrder: true,
    prompt: 'How many lobes does the right lung have?',
    options: ['2', '3', '4', '5'], answer: 1,
    explain: 'The right lung has superior, middle and inferior lobes. The left has only two, because the heart takes up room on that side.',
    mn: {prompt: 'Баруун уушиг хэдэн дэлбэнтэй вэ?', explain: 'Баруун уушиг дээд, дунд, доод гурван дэлбэнтэй. Зүүн тал нь зүрх байрлах зай гаргадаг тул хоёрхон дэлбэнтэй.'},
  },
  {
    id: 'inhaled-object', topic: 'organs', level: 3, concept: 'right main bronchus',
    prompt: 'An inhaled object most often lodges in which airway?',
    options: ['Right main bronchus', 'Left main bronchus', 'Trachea', 'Left upper lobe bronchus'], answer: 0,
    explain: 'The right main bronchus is wider, shorter and more vertical than the left, so whatever is breathed in tends to fall into it.',
    mn: {prompt: 'Амьсгалаар орсон гадны биет ихэвчлэн аль амьсгалын замд гацдаг вэ?', explain: 'Баруун гол гуурс зүүнээсээ өргөн, богино, илүү босоо тул амьсгалсан биет түүн рүү унах хандлагатай.', options: ['Баруун гол гуурс', 'Зүүн гол гуурс', 'Гуурсан хоолой', 'Зүүн дээд дэлбэнгийн гуурс']},
  },
  {
    id: 'duodenum-first', topic: 'organs', level: 1, concept: 'duodenum',
    prompt: 'Which is the first part of the small intestine?',
    options: ['Duodenum', 'Jejunum', 'Ileum', 'Cecum'], answer: 0,
    explain: 'The C-shaped duodenum curves around the head of the pancreas and receives bile and pancreatic juice.',
    mn: {prompt: 'Нарийн гэдэсний эхний хэсэг аль нь вэ?', explain: 'C хэлбэрийн арван хоёр хуруу гэдэс нойр булчирхайн толгойг тойрч, цөс ба нойр булчирхайн шүүсийг хүлээн авна.', options: ['Арван хоёр хуруу гэдэс', 'Jejunum (өлөн гэдэс)', 'Ileum (цагираг гэдэс)', 'Сохор гэдэс']},
  },
  {
    id: 'ureter', topic: 'organs', level: 1, concept: 'ureter',
    prompt: 'Which tube carries urine from the kidney to the bladder?',
    options: ['Ureter', 'Urethra', 'Renal vein', 'Collecting duct'], answer: 0,
    explain: 'Each ureter pushes urine down by waves of contraction. Kidney stones often stick where it crosses the pelvic brim.',
    mn: {prompt: 'Шээсийг бөөрнөөс давсаг руу зөөдөг суваг аль нь вэ?', explain: 'Шээс дамжуулах суваг бүр агшилтын давалгаагаар шээсийг доош түлхэнэ. Бөөрний чулуу аарцгийн хүрээг хөндлөн гарах хэсэгт ихэвчлэн гацдаг.', options: ['Шээс дамжуулах суваг (ureter)', 'Шээсний суваг (urethra)', 'Бөөрний вен', 'Цуглуулах цорго']},
  },
  {
    id: 'appendix-cecum', topic: 'organs', level: 2, concept: 'appendix',
    prompt: 'The appendix opens into which part of the large intestine?',
    options: ['Cecum', 'Sigmoid colon', 'Transverse colon', 'Rectum'], answer: 0,
    explain: 'The appendix hangs from the cecum in the lower right abdomen. Pain from appendicitis settles over McBurney’s point.',
    mn: {prompt: 'Мухар олгой бүдүүн гэдэсний аль хэсэгт нээгддэг вэ?', explain: 'Мухар олгой хэвлийн баруун доод хэсэгт сохор гэдэснээс унжина. Мухар олгойн үрэвслийн өвдөлт McBurney цэгт төвлөрдөг.', options: ['Сохор гэдэс', 'Sigmoid гэдэс', 'Хөндлөн гэдэс', 'Шулуун гэдэс']},
  },
  {
    id: 'spleen', topic: 'organs', level: 2, concept: 'spleen',
    prompt: 'Which organ in the upper left abdomen removes worn-out red blood cells?',
    options: ['Spleen', 'Liver', 'Left kidney', 'Pancreas'], answer: 0,
    explain: 'The spleen sits under ribs 9 to 11 on the left. Its red pulp filters old red cells and its white pulp makes immune responses.',
    mn: {prompt: 'Хэвлийн зүүн дээд хэсэгт байрлаж, хуучирсан улаан эсийг устгадаг эрхтэн аль нь вэ?', explain: 'Дэлүү зүүн талын 9–11-р хавирганы доор байрлана. Улаан цөм нь хуучин улаан эсийг шүүж, цагаан цөм нь дархлааны хариу үүсгэнэ.', options: ['Дэлүү', 'Элэг', 'Зүүн бөөр', 'Нойр булчирхай']},
  },
  {
    id: 'portal-vein', topic: 'organs', level: 3, concept: 'hepatic portal vein',
    prompt: 'Which vessel brings nutrient-rich blood from the gut to the liver?',
    options: ['Hepatic portal vein', 'Proper hepatic artery', 'Inferior vena cava', 'Hepatic veins'], answer: 0,
    explain: 'The portal vein forms behind the pancreas from the splenic and superior mesenteric veins and carries about three quarters of the blood the liver receives.',
    mn: {prompt: 'Гэдэснээс шим тэжээлээр баялаг цусыг элэг рүү хүргэдэг судас аль нь вэ?', explain: 'Хаалганы вен нойр булчирхайн ард дэлүүний ба дээд mesenteric венүүд нийлж үүсэх ба элэгний цусны дөрөвний гурвыг хангана.', options: ['Элэгний хаалганы вен', 'Элэгний өөрийн артери', 'Доод хөндий вен', 'Элэгний венүүд']},
  },
  {
    id: 'thyroid', topic: 'organs', level: 1, concept: 'thyroid gland',
    prompt: 'Which gland at the front of the neck makes thyroxine?',
    options: ['Thyroid gland', 'Parathyroid glands', 'Thymus', 'Adrenal glands'], answer: 0,
    explain: 'The butterfly-shaped thyroid wraps the front of the trachea below the larynx and sets the metabolic rate.',
    mn: {prompt: 'Хүзүүний урд талд байрлаж тироксин ялгаруулдаг булчирхай аль нь вэ?', explain: 'Эрвээхэй хэлбэрийн бамбай булчирхай төвөнхийн доор гуурсан хоолойн урд талыг ороож, бодисын солилцооны хурдыг тохируулна.', options: ['Бамбай булчирхай', 'Бамбай орчмын булчирхай', 'Thymus (цээжний булчирхай)', 'Бөөрний дээд булчирхай']},
  },
  {
    id: 'right-kidney-low', topic: 'organs', level: 3, concept: 'right kidney',
    prompt: 'Why does the right kidney usually sit lower than the left?',
    options: ['The liver lies above it', 'The spleen pushes it down', 'The aorta lies on the right', 'The right ureter is shorter'], answer: 0,
    explain: 'The large right lobe of the liver sits above the right kidney and pushes it down, about one vertebra lower than the left.',
    mn: {prompt: 'Баруун бөөр яагаад зүүнээсээ ихэвчлэн доогуур байрладаг вэ?', explain: 'Элэгний том баруун дэлбэн баруун бөөрийн дээр байрлаж доош түлхдэг тул зүүнээсээ нэг нугалам орчим доогуур байна.', options: ['Дээр нь элэг байрладаг', 'Дэлүү түүнийг доош түлхдэг', 'Aorta баруун талд байдаг', 'Баруун шээс дамжуулах суваг богино']},
  },

];

/** The whole bank in English, in the order above. */
export const QUIZ: QuizQuestion[] = BANK.map(({mn: _mn, ...question}) => question);

/** The bank in the reader's language. Translated options keep the order of the English ones. */
export function quizFor(lang: Lang): QuizQuestion[] {
  if (lang === 'en') return QUIZ;
  return BANK.map(({mn, ...question}) => ({...question, prompt: mn.prompt, explain: mn.explain, options: mn.options ?? question.options}));
}

export type TopicChoice = QuizTopic | 'mixed';
export type LevelChoice = QuizLevel | 0;

/** Questions that fit a topic and level; 0 and 'mixed' mean any. */
export function matching(bank: QuizQuestion[], topic: TopicChoice, level: LevelChoice): QuizQuestion[] {
  return bank.filter(q => (topic === 'mixed' || q.topic === topic) && (level === 0 || q.level === level));
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** A dealt question: which bank entry, and the order its options are shown in. */
export interface Dealt {
  id: string;
  order: number[];
}

/** The order to show a question's options in: shuffled, unless the options read as a sequence. */
export function dealOptions(question: QuizQuestion, random: () => number = Math.random): number[] {
  const order = question.options.map((_, i) => i);
  return question.keepOrder ? order : shuffle(order, random);
}

/** Deal a fresh quiz. A mixed quiz spreads its questions across the topics before it repeats one, so ten
 *  mixed questions are never eight on muscles. */
export function dealQuiz(pool: QuizQuestion[], count: number, random: () => number = Math.random): Dealt[] {
  const byTopic = new Map<QuizTopic, QuizQuestion[]>();
  for (const question of shuffle(pool, random)) {
    const list = byTopic.get(question.topic) ?? [];
    list.push(question);
    byTopic.set(question.topic, list);
  }
  const picked: QuizQuestion[] = [];
  const lanes = shuffle([...byTopic.values()], random);
  while (picked.length < count && lanes.some(lane => lane.length)) {
    for (const lane of lanes) {
      const next = lane.shift();
      if (next && picked.length < count) picked.push(next);
    }
  }
  return shuffle(picked, random).map(question => ({id: question.id, order: dealOptions(question, random)}));
}
