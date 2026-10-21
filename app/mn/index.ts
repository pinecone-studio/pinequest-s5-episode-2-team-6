/** Монгол хэлээрх анагаадын нэр, тайлбарын зөвхөн нэг эх сурвалж.
 *  Бүх үүсгэлт үндсэн нэрийг латин/гадаад хэвээр, тайлбарыг монгол хэлээр өгнө. */

import type {SystemId} from '../anatomy';
import {resolveBoneAtlas} from '../bone-atlas';
import {resolveStructureAtlas} from '../structure-atlas';
import {TOKEN_MN, PHRASE_MN} from './glossary';
import {ORGAN_ENTRIES_MN} from './organs';
import {BONE_DESCRIPTIONS_MN} from './bones';
import {STRUCTURE_DESCRIPTIONS_MN} from './structures';
import {SYSTEM_ENTRIES_MN} from './systems';

/** Нэмэлт хатуу тогтмол нэр томьёонууд (token түвшний дүрэмээс давахгүй хослолууд). */
const EXTRA_PHRASES: Record<string, string> = {
  'anterior': 'урд',
  'posterior': 'дахь',
  'aorta': 'хөв',
  'brachial plexus': 'мөрийн нерв сүлжээ',
  'cavernosum': 'хатуу бие',
  'cervical vertebra': 'хүзүүний яс',
  'chamber': 'хөв',
  'cord': 'бүлгэмж',
  'cord of brachial plexus': 'мөрийн сүлжээний бүлгэмж',
  'corpus cavernosum': 'хатуу бие',
  'corpus spongiosum': 'губар бие',
  'ganglion': 'ганглийн тогойвог',
  'gluteus maximus': 'үүдгийн том булчин',
  'gluteus medius': 'үүдгийн дунд булчин',
  'gluteus minimus': 'үүдгийн бага булчин',
  'hyoid bone': 'язын яс',
  'infraspinatus': 'хөвөг доод булчин',
  'innominate': 'нэргүй',
  'larynx': 'хоолой',
  'lumbar vertebra': 'нурууны яс',
  'mammary': 'сүүний',
  'nucleus': 'төв',
  'optic part': 'оптик хэсэг',
  'parenchyma': 'эд',
  'pectoralis major': 'цээжны том булчин',
  'pectoralis minor': 'цээжны бага булчин',
  'penis': 'хувийн эрхт',
  'pharynx': 'фаринкс',
  'plantar vein': 'улангийн сув',
  'premolar tooth': 'хоёр хүрцэх шүд',
  'pubis': 'сүүрийн яс',
  'sacral vertebra': 'сангийн яс',
  'secondary canine tooth': 'мөч сохой шүд',
  'secondary incisor tooth': 'мөч шилүүлжүүр',
  'secondary molar tooth': 'мөч үрцэх шүд',
  'secondary premolar tooth': 'мөч хоёр хүрцэх шүд',
  'secondary tooth': 'мөч шүд',
  'semispinalis': 'дугаар шилжсэн',
  'serratus anterior': 'хөвөгний захын булчин',
  'subscapularis': 'хөвөг дотор булчин',
  'supraclavicular nodes': 'өрхийн дээд лимфний зангиа',
  'supraspinatus': 'хөвөг дээд булчин',
  'thoracic vertebra': 'цээжний яс',
  'tracheobronchial tree': 'трахеа-бронхийн мод',
  'vulva': 'сүүрийн',
};

interface KindSpec {
  /** Монгол нэр томьёо (тавлал) */
  label: string;
  /** Үүргийн тайлбар */
  fn: string;
  /** Клиник тайлбар */
  note: string;
}

const KIND_ARTERY: KindSpec = {
  label: 'артери',
  fn: 'Артери нь зүрхээс үүдэлцээд ткань руу цус дамжуулах урсгал судас бөгөөд хыны хана нь улмаар дарах цохилтыг тэсвэрийн зэрэгтэй дэмжинэ.',
  note: 'Гүйлсэн эртэгсэл, тромбозын эрсдэлтэй тул хэлбэр, байрлалыг хөрш хэсгүүдтэй хамтдаа сурах нь чухал.',
};
const KIND_VEIN: KindSpec = {
  label: 'сув',
  fn: 'Сув нь тканьээс цусыг зүрх рүү буцаан дамжуулах хүчилтэй хүүдэг судас бөгөөд хана нь тэлээд цусыг хүлээн авч, дараагийн хэсэг рүү шахах үүрэгтэй.',
  note: 'Хэвтэй хэдрэг, тромбозын эрсдэлтэй учраас бусдын хөрш хэсгүүдтэй хамтдаа ойлгох шаардлагатай.',
};
const KIND_NERVE: KindSpec = {
  label: 'нерв',
  fn: 'Нерв нь мөр гэдэг нэгжүүдээс бүтэх бөгөөд үзүүлэлтийг тархин руу, тэгээсээ булчины хөдөлгөөнийг дамжуулна. Захын нервүүд ганглийн тогойвог болон нервний сүүл дээр холбогддог.',
  note: 'Неврологийн үзүүлэлттэй — талбай, үзүүлэлт, хөдөлгөөний өөрчлөлт — тэсэхгүй холбоотой бөгөөд ганглийн тогойвог нь түүний урсгалын шилжих цэг болно.',
};
const KIND_MUSCLE: KindSpec = {
  label: 'булчин',
  fn: 'Булчин нь сухожаар ясанд тулж, агшиж суралцснаар хөдөлгөөн үүсгэнэ. Булчингийн гүйцэтгэл нь хэвийн байрлал болон хүчнийг тэнцэтгэлд хадгална.',
  note: 'Гэмтэл, хэт ашиглалт, үргэлжлэх ашиглалтын дутагдал нь булчины хэмжээ, хүчинд нөлөөлөх тул суралцад анхаарах хэрэгтэй.',
};
const KIND_BONE: KindSpec = {
  label: 'яс',
  fn: 'Яс нь кальцийн төвлөрсөн, хэлбэр тогтмол бүтэц бөгөөд биеийн дэмжин хүрэлцээ болон эрхт хамгааллыг бүрдүүлнэ. Ясны доторх ясны хөв нь цусан эдлэл үүсгэхэд оролцоно.',
  note: 'Ясны гэмтэл, эргэлттэй болон үсгийн сүүлийн ойролцоогоос гарах үзүүлэлтүүд энэ бүтцийн байрлалтай уялдана.',
};
const KIND_TOOTH: KindSpec = {
  label: 'шүд',
  fn: 'Шүд нь шүхэр (эмаль)-ээр хучигдсан төв хэсэг, дотор нь амьд хөвтэй шүдний сүүн байдаг бөгөөд асууны ясны үүдэст суурилна. Хүнсээр огтлох, зажлах ажлыг гүйцэтгэнэ.',
  note: 'Шүдний гэмтэл, үдээсээ устгах нь амны өвчин, хоолны боловсруулалтad нөлөө оруулна.',
};
const KIND_CARTILAGE: KindSpec = {
  label: 'хондгой',
  fn: 'Хондгой нь хөвч хэлбэртэй, тэгүүлэгч ткань бөгөөд үөрсөлийн гадаргууг гөлөөтэй, хүчинтэй хөдөлгөөнд үйлчилдэг. Тэр мөн биеийн хэлбэрийг тэгш хэмээр хадгална.',
  note: 'Хондгой эрэгдэх нь хатуу дааврын үөрсөл дээр өвчин үүсэх гол шалтгаан бөгөөд эргэлттэй удаан хугацаанд хуримтлагдана.',
};
const KIND_LIGAMENT: KindSpec = {
  label: 'холбоос',
  fn: 'Холбоос нь яс, хондгой болон бусад бүтцийг холбон, үөрсөлийн тогтвортой байдлыг хадгална. Иймээс үөрсөлд зөвшөөрөгдөх хөдөлгөөний хязгаарыг тогтооно.',
  note: 'Холбоос тасарсан, үргэлжлэл гэсэн гэмтэл нь үөрсөлийн тогтвортой байдалд нөлөөлөх тул хөдөлгөөний хязгаарыг ойлгох чухал.',
};
const KIND_TENDON: KindSpec = {
  label: 'сухож',
  fn: 'Сухож нь булчины хүчийг ясанд шилжүүлэх бөгөөд шүүрэлт, тэлэлтийг дамжуулна. Тэгэхээр булчины хүч, үөрсөлийн тогтвортой байдалд гол үүрэгтэй.',
  note: 'Сухожны үржилдэл, урт хугацаанд ашиглахгүй байх нь хөдөлгөөний хүрээ болон өвчийн үүсэлтэд нөлөөлнө.',
};
const KIND_CONNECTIVE: KindSpec = {
  label: 'холбоогч бүтэц',
  fn: 'Энэ нь яс, булчин, эрхтүүдийг холбон, тэдгээрийг оронд нь тогтоож, механик ачаалыг тараах холбоогч ткань юм. Тэр мөн хөдөлгөөнийг зөвшөөрөх хүрээг хязгаарладаг.',
  note: 'Энэ бүтцийн гэмтэл нь хөрш хэсгүүдийн тогтвортой байдал, хөдөлгөөний хүрээд нөлөөлөх тул хэсэг бүрийг тусгаарлан ойлгох хэрэгтэй.',
};
const KIND_GLAND: KindSpec = {
  label: 'булчирхай',
  fn: 'Булчирхай нь тусгай зориулалттай нууц тусгайлгадаг: эндокрин үүрэгтэй бол гормон, үгүй бол сүүн, шингээлт зэрэгт орох урсгал болно. Түүнийг хүргэж буй сувгаар бүтээгдэл хүрэлцэхэд хүрнэ.',
  note: 'Булчирхайн үйлдэл нь дааврын эсвэл хоолны дэлгэмэлтэй уялдах тул эргэлттэй эсвэл тэжээлийн дутагдалтай үед илүү тод байдаг.',
};
const KIND_LYMPH_NODE: KindSpec = {
  label: 'лимфний зангиа',
  fn: 'Лимфний зангиа нь лимфийн шингээлтийг цуглуулж, дарьсан тэмдэгт хариу өгдөг. Энд лимфоцит эдлэл оршин байх бөгөөд халдлагад тэдгээрийн тоо эрс өсөж болно.',
  note: 'Зангианы хэлбэр, хэмжээ нь дарьсан тэмдэгт холбоотой бөгөөд тэдгээрийг шалгах нь өвчлийн эртэгсэл олоход ашиглагдана.',
};
const KIND_LYMPH_VESSEL: KindSpec = {
  label: 'лимфний судас',
  fn: 'Лимфийн судас нь тканьээс үүсэх илүүдэл цусгүй шингээлтийг цуглуулж, лимфийн зангианууд руу дамжуулна. Ингэснээр дарьсан тэмдэгт хариу өгөхөд шаардлагатай шингээлтийг зөвхөн хэд хэдэн зангиагаар дамжуулна.',
  note: 'Лимфийн урсгалын хасалт нь тэмдэгтийн шинэ хэсэг үүсэхэг түгээмэл шалтгаан болно.',
};
const KIND_VALVE: KindSpec = {
  label: 'хаалт',
  fn: 'Хаалт нь цусын урсгалыг нэг чигт зөвшөөрч, буцааж дамжуулахгүй хатуу хязгаарладаг. Тэгэхээр зүрхний камерууд болон сувнуудын хооронд зөвхөн зөвшөөрөгдсөн дагуу цус урсана.',
  note: 'Хаалтын бүтэц зөвшөөрөгдөх дарааллыг хязгаарладаг тул хэвийн урсгалд саад болох нь зүрхний үйлдлийг дэмжинэ.',
};
const KIND_HEART: KindSpec = {
  label: 'зүрхний бүтэц',
  fn: 'Зүрхний бүтэц нь цусын урсгалыг дамжуулах хүчинтэй хэсэг бөгөөд зүрхний тасаг, хөв, хаалт хоорондын дарааллыг хязгаарладаг. Түүний хэлбэр, хэмжээ нь зүрхний ажиллалттай шууд холбоотой.',
  note: 'Зүрхний бүтцийн өөрчлөлт нь цахилгааны зэрэг, урсгалын хэмжээг өөрчилж, эмнэлгийн өвчин үүсгэнэ.',
};
const KIND_DIGESTIVE: KindSpec = {
  label: 'хооллын эрхт',
  fn: 'Хооллын эрхт нь хүнсийг задалж, тэжээл болон ус шингээн, харийг цааш шилжүүлэх үүрэгтэй. Хана, хөвч нь хүнсийн хувиргалтыг зохицуулж, тэжээлд зайлшгүй бодитыг сорно.',
  note: 'Хооллын эрхтийн үйлдэл нь хоолны дэлгэмэл, шингээлтийн зэрэгтэй уялдах тул хоолны дэлгэмэл зэрэглэх нь ач холбогдолтой.',
};
const KIND_RESPIRATORY: KindSpec = {
  label: 'амьсгалын суваг',
  fn: 'Амьсгалын суваг нь агаарыг уушга руу хүргэж, уушгад кислород болон нүүрс түүний хооронд сэлжилт хийлгэдэг. Хондгойн тэтгэмж, булчийн үүрэг нь сувагыг нээлттэй хадгална.',
  note: 'Амьсгалын сувагын салгаврын хуваарилалт нь уушганы хэсгүүдийн үйлдэлтэй тэсэхгүй холбоотой бөгөөд өөрчлөлт нь амьсгалд нөлөөлнө.',
};
const KIND_URINARY: KindSpec = {
  label: 'шүдэлжийн эрхт',
  fn: 'Шүдэлжийн эрхт нь цусыг шүүж, шингээлтийн шийд, электролит болон хүчил-суурь тэнцэтгэлийг зохицуулна. Шүдэл нь шургалуураар цувхайд хүрч, шүдэн сувгаар гарна.',
  note: 'Бөөр, шургалуурын ажиллагаа нь ус, тусгай зориулалттай холбооор бүх биеийн нөхцөлийг тэнцэтгэлд хадгална.',
};
const KIND_REPRODUCTIVE: KindSpec = {
  label: 'үржилдэх эрхт',
  fn: 'Үржилдэх эрхт нь эргүүлэгч үүсгэх, төрсөн төрийг хөгжүүлэх, тээвэрлэх болон сексийн гормон үүсгэхэд оролцоно.',
  note: 'Эрхтүүдийн үйлдэл нь нерв болон дотоод булчирхайн системтэй эрхэлцэн ажилладаг тул хоёр системтэй зэрэгцэн сурах шаардлагатай.',
};
const KIND_SKIN: KindSpec = {
  label: 'арьс',
  fn: 'Арьс нь биеийн гадаргууг хамгаалж, мэдэгдэл болон температурыг зохицуулна. Мөн ус, минерал, витаминыг шингээж, биеийн дотоод орчыг тогтмол үүүдэг.',
  note: 'Арьсны гэмтэл нь халдлагад тэсэхгүй бөгөөд эргэлзээтэй тохиолдолд хурц илэрхийлэлтэй тэгдэг.',
};
const KIND_SENSORY: KindSpec = {
  label: 'мэдэгдлийн эрхт',
  fn: 'Энэ бүтэц нь үзүүлэлт хүлээн авч, мэдрэг тканиудаа нервийн системээр дамжуулна. Тусгай мэдэгдлийг биелүүлэх, мэдээллийг тархинд хүргэх үүрэгтэй.',
  note: 'Эдгээр бүтцийн үйлдэл нь хэвийн ажиглалтаар шууд хянагдах бөгөөд эргэлзээтэй өөрчлөлт нь мэдэгдлийн алдаа үүсгэнэ.',
};
const KIND_GANGLION: KindSpec = {
  label: 'ганглийн тогойвог',
  fn: 'Ганглийн тогойвог нь нервийн мөр гэдэг нэгжүүдийн бичлэг, хувиргалтын цэг бөгөөд захын нервүүдийн үүсгэх, шилжүүлэх үүргийг зохицуулна.',
  note: 'Тогойвогийн хэмжээ, байрлал нь нервийн эргэлзээний өөрчлөлттэй холбоотой тул өвчийн үед тэдгээрийг шалгах нь чухал.',
};
const KIND_PLEXUS: KindSpec = {
  label: 'мөр сүлжээ',
  fn: 'Мөр сүлжээ нь олон нервийн холбоослол бөгөөд тэдгээрийг нэг бүлэг болгон ажиллуулах үүрэгтэй. Түүнээс гарах салгаварууд тэдгээрийн үйлдлийг тэдгээрт хувааж дамжуулна.',
  note: 'Мөр сүлжээний гэмтэл нь олон салгаварыг нэгэн зэрэг хамардаг тул нэг хэсгийн гэмтэл ихэвчлэн өргөн хүрээтэй илэрхийлэгддэг.',
};
const KIND_GENERIC: KindSpec = {
  label: 'бүтэц',
  fn: 'Энэ нь биеийн бүтцийн нэг хэсэг бөгөөд орчны бүх системтэй хамтран ажиллана.',
  note: 'Түүний үйлдэл нь хөрш хэсгүүдтэй холбоотой тул бүхэл доройг нь судлахад хамгийн сайн ойлголттой болно.',
};

const KIND_BY_SYSTEM: Record<string, KindSpec> = {
  skeletal: KIND_BONE,
  dental: KIND_TOOTH,
  muscular: KIND_MUSCLE,
  arterial: KIND_ARTERY,
  venous: KIND_VEIN,
  nervous: KIND_NERVE,
  digestive: KIND_DIGESTIVE,
  respiratory: KIND_RESPIRATORY,
  urinary: KIND_URINARY,
  reproductive: KIND_REPRODUCTIVE,
  lymphatic: KIND_LYMPH_VESSEL,
  endocrine: KIND_GLAND,
  integumentary: KIND_SKIN,
  connective: KIND_CONNECTIVE,
  sensory: KIND_SENSORY,
  cardiac: KIND_HEART,
};

const KIND_BY_KEYWORD: {keys: string[]; kind: KindSpec}[] = [
  {keys: ['cartilage'], kind: KIND_CARTILAGE},
  {keys: ['ligament', 'ligaments'], kind: KIND_LIGAMENT},
  {keys: ['tendon', 'tendons'], kind: KIND_TENDON},
  {keys: ['valve', 'valves', 'leaflet', 'cusp'], kind: KIND_VALVE},
  {keys: ['lymph node', 'nodes', 'node'], kind: KIND_LYMPH_NODE},
  {keys: ['lymph'], kind: KIND_LYMPH_VESSEL},
  {keys: ['gland', 'glands'], kind: KIND_GLAND},
  {keys: ['ganglion'], kind: KIND_GANGLION},
  {keys: ['plexus'], kind: KIND_PLEXUS},
  {keys: ['bronch'], kind: KIND_RESPIRATORY},
  {keys: ['duct'], kind: KIND_CONNECTIVE},
  {keys: ['tooth', 'teeth'], kind: KIND_TOOTH},
  {keys: ['bone'], kind: KIND_BONE},
  {keys: ['artery', 'arteries'], kind: KIND_ARTERY},
  {keys: ['vein', 'veins'], kind: KIND_VEIN},
  {keys: ['nerve', 'nerves'], kind: KIND_NERVE},
  {keys: ['muscle', 'muscles'], kind: KIND_MUSCLE},
  {keys: ['membrane', 'retinaculum', 'capsule', 'tract', 'fascia', 'raphe', 'arch'], kind: KIND_CONNECTIVE},
];

const REGIONS: {label: string; keys: string[]}[] = [
  {
    label: 'толгойд',
    keys: [
      'head proper', 'head of organ', 'cranial', 'skull', 'face', 'eyeball', 'eye', 'ear', 'nasal', 'nose', 'brain',
      'cerebral', 'cerebell', 'frontal', 'occipital', 'parietal', 'sphenoid', 'ethmoid', 'maxilla',
      'mandib', 'zygomatic', 'lacrim', 'lingual', 'pharyn', 'laryn', 'tonsil', 'epiglott',
      'parotid', 'submandibular', 'sublingual', 'gingiva', 'tooth', 'teeth', 'tongue', 'lip',
      'eyebrow', 'auricul', 'vestibul', 'cochle', 'temporomandibular', 'supraorbital',
      'infraorbital', 'buccinator', 'nasolabial', 'retina', 'choroid', 'sclera', 'iris', 'cornea',
      'lens', 'ciliary', 'vitreous', 'vocal', 'arytenoid', 'sinus', 'tympanic', 'optic',
    ],
  },
  {
    label: 'хүзүүнд',
    keys: [
      'neck', 'cervical', 'cervicis', 'thyroid', 'hyoid', 'carotid', 'jugular', 'scalene',
      'sternocleido', 'sternocleidomastoid', 'sternohyoid', 'sternothyro', 'omohyoid', 'stylohyoid', 'digastric',
      'mylohyoid', 'geniohyoid', 'suboccipital', 'vagus', 'glossopharyngeal', 'hypoglossal',
      'cervical plexus', 'trapezius', 'levator scapulae', 'subclavian', 'brachiocephalic',
      'supraclavicular', 'supratrochlear', 'infratrochlear',
    ],
  },
  {
    label: 'цээжинд',
    keys: [
      'thorax', 'thoracic', 'chest', 'rib', 'costal', 'sternum', 'heart',
      'cardiac', 'ventric', 'atrium', 'aorta', 'pulmonary', 'bronch', 'pleural', 'mediastin',
      'lung', 'lobar', 'coronary', 'pericard', 'esophag', 'trachea', 'thymus', 'azygos',
      'hemiazygos', 'intercostal', 'internal thoracic', 'mammary', 'pectoralis', 'serratus',
      'subscapularis', 'supraspinatus', 'infraspinatus', 'teres', 'latissimus', 'levatores costarum',
      'thoracic duct', 'bronchial tree', 'tracheobronchial tree',
    ],
  },
  {
    label: 'хэвд',
    keys: [
      'abdominal', 'abdomen', 'celiac', 'gastric', 'hepatic', 'mesenteric', 'duodenal', 'jejunal',
      'ileal', 'ileocolic', 'colic', 'pancreatic', 'splenic', 'portal', 'renal', 'kidney',
      'ureter', 'lumb', 'quadratus lumborum', 'diaphragm', 'suprarenal', 'adrenal', 'testicular',
      'omental', 'epiploic', 'appendic', 'cecum', 'ileocecal', 'superior mesenteric',
      'inferior mesenteric', 'duodenum', 'jejunum', 'ileum', 'ascending colon', 'descending colon',
      'transverse colon', 'sigmoid', 'rectum', 'stomach', 'liver', 'pancreas', 'spleen',
      'epigastric', 'omental', 'epiploic', 'duodenal', 'jejunal', 'ileal', 'ileocolic', 'cecal',
      'pyloric', 'mesocolic', 'taenia',
    ],
  },
  {
    label: 'тазанд',
    keys: [
      'pelvic', 'pelvis', 'sacral', 'iliac', 'pubic', 'ischial', 'sacroiliac', 'obturator',
      'perine', 'prostate', 'testis', 'epididym', 'seminal', 'deferent', 'levator ani',
      'coccygeus', 'puborectalis', 'iliac vessels', 'gluteus maximus', 'sacrum', 'coccyx',
    ],
  },
  {
    label: 'дээд гарт',
    keys: [
      'brachial', 'humer', 'upper limb', 'arm', 'forearm', 'radial', 'ulnar', 'elbow', 'carpal',
      'metacarpal', 'phalanx', 'scapular', 'shoulder', 'axill', 'subscapul', 'supraspinat',
      'infraspinat', 'deltoid', 'biceps', 'triceps', 'brachioradialis', 'palmar', 'digital',
      'pollicis', 'thenar', 'hypothenar', 'interossei', 'lumbrical', 'supinator', 'pronator',
      'flexor', 'extensor', 'abductor', 'adductor', 'opponens', 'anconeus', 'coracobrachialis',
      'retinaculum', 'bicipital', 'tricipital', 'brachial plexus', 'radius', 'ulna',
      'scapula', 'clavicle',
    ],
  },
  {
    label: 'доод гарт',
    keys: [
      'femoral', 'tibia', 'tibial', 'fibul', 'leg', 'popliteal', 'tarsal', 'metatarsal', 'plantar',
      'sural', 'saphenous', 'calcane', 'hallucis', 'soleus', 'gastrocnem', 'peroneal',
      'quadratus femoris', 'patella', 'genicular', 'menisc', 'cruciate', 'talus', 'navicular',
      'cuboid', 'cuneiform', 'pedis', 'femoris', 'gluteus medius', 'gracilis',
      'sartorius', 'adductor magnus', 'iliopsoas', 'tibialis',
    ],
  },
];

/** Нэр томьёоны төгсгөлийн харьяалагч дарааллын үүсгэл. */
/** Монгол эрэлжийн хамаарлыг тооцох хоёр талын эгшиг. */
const FRONT_VOWELS = 'эөүи';
const BACK_VOWELS = 'аоуы';

function isFront(word: string): boolean {
  for (const ch of word.toLowerCase()) {
    if (FRONT_VOWELS.includes(ch)) return true;
    if (BACK_VOWELS.includes(ch)) return false;
  }
  return false;
}

/** Монгол төрүүний ээж (genitive) холбоос: "дээд тэнгэр" → "дээд тэнгэрийн". */
function genitive(word: string): string {
  const trimmed = word.trim();
  if (!trimmed) return trimmed;
  const last = trimmed[trimmed.length - 1];
  const front = isFront(trimmed);
  if (last === 'н') return front ? `${trimmed}ий` : `${trimmed}ы`;
  if ('эөүиаоуы'.includes(last.toLowerCase())) return front ? `${trimmed}йн` : `${trimmed}ын`;
  return front ? `${trimmed}ийн` : `${trimmed}ын`;
}

function capitalize(text: string): string {
  return text ? text[0].toUpperCase() + text.slice(1) : text;
}

function normalizeKey(name: string): string {
  return name.toLowerCase().replace(/\s+/g, ' ').trim();
}

function stripSide(name: string): string {
  return normalizeKey(name).replace(/^(left|right)\s+/, '');
}

/** Нэг үгийг монголоор хувиргана; үсгийн хоорондох тэмдэг (-, /, (), .) хэвээр үлдэнэ. */
function translateWord(word: string): string {
  return word.replace(/[A-Za-z]+/g, match => {
    const key = match.toLowerCase();
    return EXTRA_PHRASES[key] ?? TOKEN_MN[key] ?? match;
  });
}

/** Үгийн дарааллын хамгийн урт фразыг тогтооно (үг тусгаарлагч хэвээр). */
function translateWords(words: string[]): string {
  const out: string[] = [];
  let i = 0;
  while (i < words.length) {
    let matched = false;
    for (let len = Math.min(5, words.length - i); len >= 2; len--) {
      const phrase = words.slice(i, i + len).join(' ').toLowerCase();
      const hit = EXTRA_PHRASES[phrase] ?? PHRASE_MN[phrase];
      if (hit) {
        out.push(hit);
        i += len;
        matched = true;
        break;
      }
    }
    if (matched) continue;
    out.push(translateWord(words[i]));
    i += 1;
  }
  return out.filter(Boolean).join(' ');
}

/** Нэг үгийн бүтэц доторх "of" холбоосыг ойлгон, тэгшитгэлийн дагуу байрлуулна. */
function translateChunk(chunk: string): string {
  const trimmed = chunk.trim();
  if (!trimmed) return '';
  const idx = trimmed.toLowerCase().lastIndexOf(' of ');
  if (idx > 0) {
    const head = trimmed.slice(0, idx);
    const dependent = trimmed.slice(idx + 4);
    const headMn = translateWords(head.split(/\s+/));
    const dependentMn = translateChunk(dependent);
    return `${genitive(dependentMn)} ${headMn}`;
  }
  return translateWords(trimmed.split(/\s+/));
}

/** Бүтцийн англи нэрийг монгол хэлээрх нэр томьёо болгоно. */
export function mnStructureName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '';
  const chunks = trimmed.split(/\s+with\s+/i).map(chunk => translateChunk(chunk)).filter(Boolean);
  return capitalize(chunks.join(' ба '));
}

function detectKind(name: string, system: SystemId): KindSpec {
  const lower = ` ${name.toLowerCase()} `;
  for (const entry of KIND_BY_KEYWORD) {
    for (const key of entry.keys) {
      if (lower.includes(` ${key} `) || lower.includes(` ${key}s `) || lower.includes(`${key}s `) || lower.includes(`${key} `)) {
        return entry.kind;
      }
    }
  }
  return KIND_BY_SYSTEM[system] ?? KIND_GENERIC;
}

function detectRegion(name: string): string {
  const lower = name.toLowerCase();
  for (const region of REGIONS) {
    for (const key of region.keys) {
      if (lower.includes(key)) return region.label;
    }
  }
  return 'биед';
}

/** Системийн монгол нэр, тайлбар. */
export function mnSystemName(system: SystemId): string {
  return SYSTEM_ENTRIES_MN[system]?.name ?? system;
}

export function mnSystemDescription(system: SystemId): string {
  return SYSTEM_ENTRIES_MN[system]?.description ?? '';
}

/** Ясны бүртгэлийн монгол тайлбар (id-ээр). */
export function mnBoneOverview(id: string): string | undefined {
  return BONE_DESCRIPTIONS_MN[id];
}

/** Үүсэлт бүртгэлийн монгол тайлбар (id-ээр). */
export function mnStructureOverview(id: string): string | undefined {
  return STRUCTURE_DESCRIPTIONS_MN[id];
}

/** Асууны тухай олон улсын нэр томьёог монголоор (бүхэл болон бага). */
export function mnOrganEntry(name: string): {latin: string; overview: string} | undefined {
  const key = normalizeKey(name);
  const direct = ORGAN_ENTRIES_MN[key] ?? ORGAN_ENTRIES_MN[stripSide(name)];
  if (!direct) return undefined;
  return direct;
}

/** Тусгай зориулалттай (curated) тайлбар олдох эсэх. */
export function hasMnSpecific(name: string): boolean {
  return Boolean(
    ORGAN_ENTRIES_MN[normalizeKey(name)] ??
      ORGAN_ENTRIES_MN[stripSide(name)] ??
      mnBoneOverview(resolveBoneAtlas(name)?.id ?? '') ??
      mnStructureOverview(resolveStructureAtlas(name)?.id ?? ''),
  );
}

/** Тусгай зориулалттай монгол тайлбар (органы, ясны, үүсэлтийн). */
export function mnSpecificDescription(name: string): string | undefined {
  const organ = mnOrganEntry(name);
  if (organ) return organ.overview;
  const bone = resolveBoneAtlas(name);
  if (bone) {
    const text = mnBoneOverview(bone.id);
    if (text) return text;
  }
  const structure = resolveStructureAtlas(name);
  if (structure) {
    const text = mnStructureOverview(structure.id);
    if (text) return text;
  }
  return undefined;
}

/** Бүх бүтцийн монгол дэлгэрэнгүй тайлбар. */
export function mnDescription(name: string, system: SystemId): string {
  const specific = mnSpecificDescription(name);
  if (specific) return specific;

  const kind = detectKind(name, system);
  const region = detectRegion(name);
  const systemName = mnSystemName(system);
  const mnName = mnStructureName(name);
  const side = /^(left|right)\b/i.test(name.trim()) ? (name.trim().toLowerCase().startsWith('left') ? 'зүүн' : 'баруун') : '';

  const sentences: string[] = [];
  sentences.push(
    `${mnName} нь ${region} байрлах ${kind.label} бөгөөд ${systemName}д хамаарах бүрэлдэхүүн хэсэг юм.`,
  );
  sentences.push(kind.fn);
  if (side) {
    sentences.push(
      `Энэ бүтэц биеийн ${side} талд байрлах бөгөөд өргөн хэмжээтэй бүтцүүдийн хос хэсгийн нэг юм; тэгэхээр ${side} талын үйлдэлд нөлөөлнө.`,
    );
  } else {
    sentences.push(kind.note);
  }
  return sentences.join(' ');
}

/** Хайхын зориулалттай монгол нэрсийн индекс (concept id → монгол нэр). */
export function buildMnSearchIndex(concepts: {id: string; name: string}[]): Map<string, string> {
  const index = new Map<string, string>();
  for (const concept of concepts) {
    const mn = mnStructureName(concept.name);
    if (mn) index.set(concept.id, mn);
  }
  return index;
}
