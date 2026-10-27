/** Questions for the quiz page. Each one names a concept that the atlas can open, so an answer links
 *  straight to the structure in 3D. */

import type {Lang} from '../landing/copy';

export interface QuizQuestion {
  prompt: string;
  concept: string;
  options: string[];
  answer: number;
  explain: string;
}

export const QUIZ: QuizQuestion[] = [
  {
    prompt: 'Which muscle flexes the elbow and supinates the forearm?',
    concept: 'biceps brachii',
    options: ['Biceps brachii', 'Triceps brachii', 'Brachioradialis', 'Extensor digitorum'],
    answer: 0,
    explain: 'The biceps brachii flexes the elbow and rotates the palm up. It is supplied by the musculocutaneous nerve.',
  },
  {
    prompt: 'Which nerve supplies the triceps brachii?',
    concept: 'triceps brachii',
    options: ['Median nerve', 'Axillary nerve', 'Radial nerve', 'Ulnar nerve'],
    answer: 2,
    explain: 'The triceps is supplied by the radial nerve, which also drives every extensor muscle of the forearm.',
  },
  {
    prompt: 'What is the main muscle of inspiration?',
    concept: 'diaphragm',
    options: ['Serratus anterior', 'Diaphragm', 'Pectoralis minor', 'Latissimus dorsi'],
    answer: 1,
    explain: 'The diaphragm contracts and flattens to draw air into the lungs. It is supplied by the phrenic nerve.',
  },
  {
    prompt: 'Which four muscles form the rotator cuff?',
    concept: 'supraspinatus',
    options: [
      'Supraspinatus, infraspinatus, teres minor, subscapularis',
      'Deltoid, trapezius, rhomboid minor, levator scapulae',
      'Biceps, coracobrachialis, brachialis, brachioradialis',
      'Pectoralis major, pectoralis minor, serratus anterior, subclavius',
    ],
    answer: 0,
    explain: 'The cuff is supraspinatus, infraspinatus, teres minor and subscapularis. It holds the humeral head in the socket.',
  },
  {
    prompt: 'Which muscle is the prime mover of elbow flexion?',
    concept: 'brachialis',
    options: ['Brachialis', 'Triceps brachii', 'Anconeus', 'Pronator teres'],
    answer: 0,
    explain: 'The brachialis sits directly on the humerus and flexes the elbow whatever the forearm is doing.',
  },
  {
    prompt: 'Which ligament stops the tibia sliding forwards in the knee?',
    concept: 'anterior cruciate ligament',
    options: [
      'Anterior cruciate ligament',
      'Posterior cruciate ligament',
      'Tibial collateral ligament',
      'Fibular collateral ligament',
    ],
    answer: 0,
    explain: 'The anterior cruciate ligament restrains forward translation of the tibia and helps lock the extended knee.',
  },
  {
    prompt: 'Which nerve supplies the sternocleidomastoid?',
    concept: 'sternocleidomastoid',
    options: ['Facial nerve', 'Spinal accessory nerve', 'Trigeminal nerve', 'Hypoglossal nerve'],
    answer: 1,
    explain: 'The sternocleidomastoid is supplied by the spinal accessory nerve. It turns the head to the opposite side and flexes the neck.',
  },
  {
    prompt: 'Which muscle makes up the floor of the mouth?',
    concept: 'mylohyoid',
    options: ['Stylohyoid', 'Mylohyoid', 'Geniohyoid', 'Digastric'],
    answer: 1,
    explain: 'The mylohyoid spans from the mylohyoid line of the mandible to the hyoid and forms the muscular floor of the mouth.',
  },
  {
    prompt: 'Which bone is the longest in the body?',
    concept: 'femur',
    options: ['Tibia', 'Humerus', 'Femur', 'Ilium'],
    answer: 2,
    explain: 'The femur runs from the hip to the knee and carries the load of standing and walking.',
  },
  {
    prompt: 'Which nerve innervates the muscles of the thenar eminence?',
    concept: 'abductor pollicis brevis',
    options: ['Recurrent branch of the median nerve', 'Deep branch of the ulnar nerve', 'Radial nerve', 'Musculocutaneous nerve'],
    answer: 0,
    explain: 'The thenar muscles are supplied by the recurrent branch of the median nerve. A median nerve injury weakens thumb opposition.',
  },
  {
    prompt: 'What does the gastrocnemius do?',
    concept: 'head of gastrocnemius',
    options: [
      'Plantarflexes the ankle and flexes the knee',
      'Dorsiflexes the foot and extends the knee',
      'Abducts the thigh and flexes the hip',
      'Extends the toes and everts the foot',
    ],
    answer: 0,
    explain: 'The gastrocnemius points the foot and, because it crosses the knee, it also helps bend the knee. It is supplied by the tibial nerve.',
  },
  {
    prompt: 'Which muscle rotates the arm inwards at the shoulder?',
    concept: 'subscapularis',
    options: ['Infraspinatus', 'Teres minor', 'Subscapularis', 'Supraspinatus'],
    answer: 2,
    explain: 'The subscapularis is the only rotator cuff muscle on the front of the scapula, so it is the internal rotator of the cuff.',
  },
];

// Options stay in Latin where they are names; nerves and movements get Mongolian wording.
const QUIZ_MN: {prompt: string; explain: string; options?: string[]}[] = [
  {prompt: 'Тохойг нугалж, шууг супинаци хийдэг булчин аль нь вэ?', explain: 'Biceps brachii тохойг нугалж, алгыг дээш эргүүлнэ. Musculocutaneous мэдрэлээр мэдрүүлнэ.'},
  {prompt: 'Triceps brachii-г аль мэдрэл мэдрүүлдэг вэ?', explain: 'Triceps-ийг radial мэдрэл мэдрүүлнэ. Энэ мэдрэл шууны бүх сунгагч булчинг ч хөдөлгөнө.', options: ['Median мэдрэл', 'Axillary мэдрэл', 'Radial мэдрэл', 'Ulnar мэдрэл']},
  {prompt: 'Амьсгал авах гол булчин аль нь вэ?', explain: 'Diaphragm агшиж хавтгайрахдаа агаарыг уушгинд татна. Phrenic мэдрэлээр мэдрүүлнэ.'},
  {prompt: 'Мөрний ханцуйг (rotator cuff) бүрдүүлдэг дөрвөн булчин аль нь вэ?', explain: 'Supraspinatus, infraspinatus, teres minor, subscapularis. Эдгээр нь humerus-ийн толгойг үенд барина.'},
  {prompt: 'Тохойн нугалтын үндсэн хөдөлгөгч булчин аль нь вэ?', explain: 'Brachialis нь humerus дээр шууд байрлаж, шуу ямар байрлалтай байхаас үл хамааран тохойг нугална.'},
  {prompt: 'Өвдөгт tibia-г урагш гулгахаас сэргийлдэг шөрмөс аль нь вэ?', explain: 'Anterior cruciate ligament нь tibia-ийн урагшлах хөдөлгөөнийг хязгаарлаж, сунгасан өвдгийг түгжихэд тусална.'},
  {prompt: 'Sternocleidomastoid-ийг аль мэдрэл мэдрүүлдэг вэ?', explain: 'Spinal accessory мэдрэл. Толгойг эсрэг тал руу эргүүлж, хүзүүг нугална.', options: ['Facial мэдрэл', 'Spinal accessory мэдрэл', 'Trigeminal мэдрэл', 'Hypoglossal мэдрэл']},
  {prompt: 'Амны хөндийн шалыг бүрдүүлдэг булчин аль нь вэ?', explain: 'Mylohyoid нь эрүүний mylohyoid шугамаас hyoid хүртэл татаж, амны хөндийн булчинлаг шалыг үүсгэнэ.'},
  {prompt: 'Биеийн хамгийн урт яс аль нь вэ?', explain: 'Femur нь ташаанаас өвдөг хүртэл үргэлжилж, зогсох, алхах ачааллыг үүрдэг.'},
  {prompt: 'Thenar eminence-ийн булчинг аль мэдрэл мэдрүүлдэг вэ?', explain: 'Median мэдрэлийн recurrent салбар. Энэ мэдрэл гэмтвэл эрхий хурууны эсэргүүцэл суларна.', options: ['Median мэдрэлийн recurrent салбар', 'Ulnar мэдрэлийн гүн салбар', 'Radial мэдрэл', 'Musculocutaneous мэдрэл']},
  {prompt: 'Gastrocnemius юу хийдэг вэ?', explain: 'Хөлийг доош чиглүүлж, өвдгийг дайран өнгөрдөг тул өвдгийг нугалахад тусална. Tibial мэдрэлээр мэдрүүлнэ.', options: ['Шагайг plantar flexion хийж, өвдгийг нугална', 'Тавхайг dorsiflexion хийж, өвдгийг сунгана', 'Гуяыг холдуулж, ташааг нугална', 'Хөлийн хурууг сунгаж, тавхайг гадагш эргүүлнэ']},
  {prompt: 'Мөрийг дотогш эргүүлдэг булчин аль нь вэ?', explain: 'Subscapularis нь scapula-ийн урд талын цорын ганц мөрний ханцуйн булчин тул гарыг дотогш эргүүлнэ.'},
];

export function quizFor(lang: Lang): QuizQuestion[] {
  if (lang === 'en') return QUIZ;
  return QUIZ.map((question, index) => ({
    ...question,
    prompt: QUIZ_MN[index]?.prompt ?? question.prompt,
    explain: QUIZ_MN[index]?.explain ?? question.explain,
    options: QUIZ_MN[index]?.options ?? question.options,
  }));
}
