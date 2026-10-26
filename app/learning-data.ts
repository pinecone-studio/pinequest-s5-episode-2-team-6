/** Learning content for the guided tours and the quiz.
 *  Steps name a concept that the app looks up in the atlas when the tour runs. */

import type {View} from './anatomy';
import type {Lang} from './landing/copy';

export interface TourStep {
  concept: string;
  title: string;
  text: string;
  view?: View;
}

export interface Tour {
  id: string;
  title: string;
  summary: string;
  steps: TourStep[];
}

export interface QuizQuestion {
  prompt: string;
  concept: string;
  options: string[];
  answer: number;
  explain: string;
}

export const TOURS: Tour[] = [
  {
    id: 'arm',
    title: 'The arm',
    summary: 'Three stops on the muscles that move the elbow and shoulder.',
    steps: [
      {
        concept: 'humerus',
        title: 'Humerus',
        text: 'The single bone of the upper arm. Its head sits in the shoulder socket and its condyles carry the elbow.',
      },
      {
        concept: 'biceps brachii',
        title: 'Biceps brachii',
        text: 'Two heads that flex the elbow and supinate the forearm. The long head also pulls the shoulder forward.',
        view: 'front',
      },
      {
        concept: 'triceps brachii',
        title: 'Triceps brachii',
        text: 'Three heads on the back of the arm that extend the elbow. The long head crosses the shoulder as well.',
        view: 'back',
      },
      {
        concept: 'radius',
        title: 'Radius and ulna',
        text: 'In the forearm the radius carries the hand and the ulna carries the elbow. They cross as the forearm turns.',
        view: 'front',
      },
    ],
  },
  {
    id: 'rotator cuff',
    title: 'The rotator cuff',
    summary: 'Four muscles that keep the shoulder centred while the arm moves.',
    steps: [
      {
        concept: 'supraspinatus',
        title: 'Supraspinatus',
        text: 'Sits above the scapular spine and starts the first fifteen degrees of abduction.',
        view: 'back',
      },
      {
        concept: 'infraspinatus',
        title: 'Infraspinatus',
        text: 'Fills the hollow below the scapular spine and rotates the arm outwards.',
        view: 'back',
      },
      {
        concept: 'teres minor',
        title: 'Teres minor',
        text: 'Runs beside the long head of triceps and helps rotate the arm outwards.',
        view: 'back',
      },
      {
        concept: 'subscapularis',
        title: 'Subscapularis',
        text: 'The only rotator cuff muscle on the front of the scapula. It rotates the arm inwards.',
        view: 'front',
      },
    ],
  },
  {
    id: 'knee',
    title: 'The knee',
    summary: 'Ligaments, cartilage and bone around the largest joint in the body.',
    steps: [
      {
        concept: 'femur',
        title: 'Femur',
        text: 'The thigh bone ends in two condyles that roll in the knee groove.',
      },
      {
        concept: 'patella',
        title: 'Patella',
        text: 'The kneecap sits in the tendon of the quadriceps and levers the muscle forward.',
        view: 'front',
      },
      {
        concept: 'medial meniscus',
        title: 'Menisci',
        text: 'Two wedges of fibrocartilage deepen the joint and spread the load across surfaces that barely fit.',
      },
      {
        concept: 'anterior cruciate ligament',
        title: 'Cruciate ligaments',
        text: 'Two crossed ligaments in the centre of the knee. The anterior one stops the tibia sliding forwards.',
        view: 'front',
      },
    ],
  },
  {
    id: 'blood-flow',
    title: 'Blood flow',
    summary: 'Follow a drop of blood from the heart through the great vessels.',
    steps: [
      {
        concept: 'heart',
        title: 'Heart',
        text: 'Four chambers. The right side sends blood to the lungs, the left side sends it round the body.',
        view: 'front',
      },
      {
        concept: 'ascending aorta',
        title: 'Ascending aorta',
        text: 'The aorta leaves the left ventricle and arches backwards over the heart.',
      },
      {
        concept: 'arch of aorta',
        title: 'Arch of aorta',
        text: 'The arch gives off the vessels that supply the head and arms before the aorta descends.',
        view: 'side',
      },
      {
        concept: 'descending aorta',
        title: 'Descending aorta',
        text: 'The aorta runs down through the chest and abdomen to the pelvis.',
        view: 'back',
      },
    ],
  },
  {
    id: 'layers',
    title: 'Inside the body',
    summary: 'Peel the body back layer by layer with the Layers tool in the dock.',
    steps: [
      {
        concept: 'heart',
        title: 'Organs',
        text: 'Switch the dock to Layers and peel the surface away to reach the organs.',
      },
      {
        concept: 'right lung',
        title: 'Lungs',
        text: 'The lungs fill the upper chest beside the heart. Peel again to see them on their own.',
        view: 'front',
      },
      {
        concept: 'liver',
        title: 'Liver',
        text: 'The liver fills the upper right abdomen. The stomach sits to its left.',
        view: 'front',
      },
    ],
  },
];

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

const TOUR_MN: Record<string, {title: string; summary: string; text: string[]}> = {
  arm: {
    title: 'Гар',
    summary: 'Тохой, мөрийг хөдөлгөдөг булчингууд.',
    text: [
      'Дээд мөчний цорын ганц яс. Толгой нь мөрний үенд, доод үзүүрийн товойлт нь тохойг үүсгэнэ.',
      'Хоёр толгойтой. Тохойг нугалж, шууг супинаци хийнэ. Урт толгой нь мөрийг урагш татна.',
      'Гарын ар талын гурван толгой тохойг сунгана. Урт толгой нь мөрийг ч дайрна.',
      'Шуунд radius гар, ulna тохойг үүрдэг. Шуу эргэхэд хоёр яс солбино.',
    ],
  },
  'rotator cuff': {
    title: 'Rotator cuff',
    summary: 'Гарыг хөдөлгөх үед мөрийг төвд нь барьдаг дөрвөн булчин.',
    text: [
      'Scapula-ийн нурууны дээгүүр байрлаж, гарыг хажуу тийш эхний 15 градус өргөнө.',
      'Scapula-ийн нурууны доорх хонхорыг дүүргэж, гарыг гадагш эргүүлнэ.',
      'Triceps-ийн урт толгойн хажуугаар явж, гарыг гадагш эргүүлэхэд тусална.',
      'Scapula-ийн урд талын цорын ганц rotator cuff булчин. Гарыг дотогш эргүүлнэ.',
    ],
  },
  knee: {
    title: 'Өвдөг',
    summary: 'Биеийн хамгийн том үений шөрмөс, мөгөөрс, яс.',
    text: [
      'Гуяны яс өвдөгний ховилд эргэлддэг хоёр товойлтоор төгсөнө.',
      'Өвдөгний товрог нь quadriceps-ийн шөрмөсөнд байрлаж, булчинг урагш хөшүүргэдэг.',
      'Хоёр шаантаг fibrocartilage үеийг гүнзгийрүүлж, таарахгүй гадаргуу дээрх ачааллыг тараана.',
      'Өвдөгний төвд солбисон хоёр шөрмөс. Урд талынх нь tibia-г урагш гулгахаас сэргийлнэ.',
    ],
  },
  'blood-flow': {
    title: 'Цусны урсгал',
    summary: 'Зүрхнээс том судас хүртэл нэг дусал цусны замыг дага.',
    text: [
      'Дөрвөн тасалгаа. Баруун тал цусыг уушгинд, зүүн тал биеэр эргүүлнэ.',
      'Aorta зүүн ховдолоос гарч, зүрхний дээгүүр хойш нумна.',
      'Нум толгой, гарыг хангах судсыг салаалсны дараа aorta доош бууна.',
      'Aorta цээж, хэвлийгээр аарцаг хүртэл доош явна.',
    ],
  },
  layers: {
    title: 'Биеийн дотор',
    summary: 'Доод самбарын Давхарга хэрэгслээр биеийг давхаргаар нь хуул.',
    text: [
      'Самбарыг Давхарга руу шилжүүлж, гадаргууг хуулаад эрхтэнд хүр.',
      'Уушги зүрхний хажууд дээд цээжийг дүүргэнэ. Дахин хуулахад тусад нь харагдана.',
      'Элэг баруун дээд хэвлийг дүүргэнэ. Ходоод түүний зүүн талд байрлана.',
    ],
  },
};

const QUIZ_MN: {prompt: string; explain: string}[] = [
  {prompt: 'Тохойг нугалж, шууг супинаци хийдэг булчин аль нь вэ?', explain: 'Biceps brachii тохойг нугалж, алгыг дээш эргүүлнэ. Musculocutaneous мэдрэлээр мэдрүүлнэ.'},
  {prompt: 'Triceps brachii-г аль мэдрэл мэдрүүлдэг вэ?', explain: 'Triceps-ийг radial мэдрэл мэдрүүлнэ. Энэ мэдрэл шууны бүх сунгагч булчинг ч хөдөлгөнө.'},
  {prompt: 'Амьсгал авах гол булчин аль нь вэ?', explain: 'Diaphragm агшиж хавтгайрахдаа агаарыг уушгинд татна. Phrenic мэдрэлээр мэдрүүлнэ.'},
  {prompt: 'Rotator cuff-ийг бүрдүүлдэг дөрвөн булчин аль нь вэ?', explain: 'Supraspinatus, infraspinatus, teres minor, subscapularis. Эдгээр нь humerus-ийн толгойг үенд барина.'},
  {prompt: 'Тохойн нугалтын үндсэн хөдөлгөгч булчин аль нь вэ?', explain: 'Brachialis нь humerus дээр шууд байрлаж, шуу ямар байрлалтай байхаас үл хамааран тохойг нугална.'},
  {prompt: 'Өвдөгт tibia-г урагш гулгахаас сэргийлдэг шөрмөс аль нь вэ?', explain: 'Anterior cruciate ligament нь tibia-ийн урагшлах хөдөлгөөнийг хязгаарлаж, сунгасан өвдгийг түгжихэд тусална.'},
  {prompt: 'Sternocleidomastoid-ийг аль мэдрэл мэдрүүлдэг вэ?', explain: 'Spinal accessory мэдрэл. Толгойг эсрэг тал руу эргүүлж, хүзүүг нугална.'},
  {prompt: 'Амны хөндийн шалыг бүрдүүлдэг булчин аль нь вэ?', explain: 'Mylohyoid нь эрүүний mylohyoid шугамаас hyoid хүртэл татаж, амны хөндийн булчинлаг шалыг үүсгэнэ.'},
  {prompt: 'Биеийн хамгийн урт яс аль нь вэ?', explain: 'Femur нь ташаанаас өвдөг хүртэл үргэлжилж, зогсох, алхах ачааллыг үүрдэг.'},
  {prompt: 'Thenar eminence-ийн булчинг аль мэдрэл мэдрүүлдэг вэ?', explain: 'Median мэдрэлийн recurrent салбар. Энэ мэдрэл гэмтвэл эрхий хурууны эсэргүүцэл суларна.'},
  {prompt: 'Gastrocnemius юу хийдэг вэ?', explain: 'Хөлийг доош чиглүүлж, өвдгийг дайран өнгөрдөг тул өвдгийг нугалахад тусална. Tibial мэдрэлээр мэдрүүлнэ.'},
  {prompt: 'Мөрийг дотогш эргүүлдэг булчин аль нь вэ?', explain: 'Subscapularis нь scapula-ийн урд талын цорын ганц rotator cuff булчин тул гарыг дотогш эргүүлнэ.'},
];

export function toursFor(lang: Lang): Tour[] {
  if (lang === 'en') return TOURS;
  return TOURS.map(tour => {
    const copy = TOUR_MN[tour.id];
    if (!copy) return tour;
    return {
      ...tour,
      title: copy.title,
      summary: copy.summary,
      steps: tour.steps.map((step, index) => ({...step, text: copy.text[index] ?? step.text})),
    };
  });
}

export function quizFor(lang: Lang): QuizQuestion[] {
  if (lang === 'en') return QUIZ;
  return QUIZ.map((question, index) => ({
    ...question,
    prompt: QUIZ_MN[index]?.prompt ?? question.prompt,
    explain: QUIZ_MN[index]?.explain ?? question.explain,
  }));
}
