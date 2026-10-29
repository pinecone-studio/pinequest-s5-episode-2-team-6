import type {Lang} from '../landing/copy';
import type {FallPhase} from './fall-model';

export const PREDICTION_STOPS=[{id:'direction',at:.32},{id:'hand',at:.685},{id:'outcome',at:.785}] as const;
export type PredictionId=typeof PREDICTION_STOPS[number]['id'];
export function nextPrediction(from:number,to:number,completed:readonly PredictionId[]){
 return to<from?undefined:PREDICTION_STOPS.find(stop=>stop.at>=from&&stop.at<=to&&!completed.includes(stop.id));
}
export const ANATOMY_IDS=['clavicle','scapula','humerus','radius','ulna','hand'] as const;
export type AnatomyId=typeof ANATOMY_IDS[number];
export function anatomyId(name:string):AnatomyId|undefined{
 if(name==='Right clavicle')return 'clavicle';
 if(name==='Right scapula')return 'scapula';
 if(name==='Right humerus')return 'humerus';
 if(name==='Right radius')return 'radius';
 if(name==='Right ulna')return 'ulna';
 if(/right/i.test(name)&&/finger|thumb|metacarpal|capitate|hamate|lunate|pisiform|scaphoid|trapezi|triquetral/i.test(name))return 'hand';
}
interface Prediction {question:string;options:string[];correct:number;explanation:string}
interface StageLesson {observe:string;anatomy:string;takeaway:string}
interface AnatomyNote {name:string;latin:string;detail:string}
interface EducationCopy {
 guided:string;guidedHint:string;overlays:string;overlayHint:string;predict:string;continue:string;correct:string;review:string;answerLabel:string;
 choose:string;observe:string;anatomy:string;takeaway:string;inspect:string;inspectionHint:string;restart:string;
 predictions:Record<PredictionId,Prediction>;structures:Record<AnatomyId,AnatomyNote>;stages:Record<FallPhase,StageLesson>;
}

export const EDUCATION:Record<Lang,EducationCopy>={
 en:{
  guided:'Pause and predict',guidedHint:'The lesson pauses before three key events. Choose an answer, read the explanation, then continue.',
  overlays:'Anatomy labels',overlayHint:'Select a label or a structure below to pause and highlight its anatomy.',predict:'Pause and predict',continue:'Continue the lesson',correct:'Correct prediction',review:'Let’s review',answerLabel:'Correct answer',choose:'Choose one answer to reveal the explanation.',observe:'Observe',anatomy:'Anatomy connection',takeaway:'Remember',inspect:'Inspect the right upper limb',inspectionHint:'Select a structure to learn its role.',restart:'Reset restarts the questions too.',
  predictions:{
   direction:{question:'The right heel is about to slide forward. Which way does the upper body start falling in this scene?',options:['Backward, as the feet move ahead of the pelvis','Forward, following the sliding foot','It stays upright throughout'],correct:0,explanation:'In this authored sequence the foot slides forward, then the pelvis drops and the torso tips backward. Watch the delay between the heel slide and the body’s reaction.'},
   hand:{question:'Which hand contacts the pavement next, and where?',options:['The left hand, in front of the body','The right hand, behind the body','The right hand, in front of the body'],correct:1,explanation:'The right arm reaches behind the falling torso. The right palm meets the pavement there; the other arm moves outward for balance. Watch the palm rotate before contact.'},
   outcome:{question:'Does bracing a fall with an outstretched hand guarantee a clavicle fracture?',options:['Yes, every such fall fractures the clavicle','No; it can happen, but it is not inevitable','No; an outstretched-arm fall can never injure the clavicle'],correct:1,explanation:'A fall onto an outstretched arm can cause a clavicle fracture, but contact alone does not establish the injury. This lesson prescribes a fracture to teach its anatomy; it does not calculate an injury threshold.'},
  },
  structures:{
   clavicle:{name:'Right clavicle',latin:'Clavicula',detail:'The collarbone links the sternum to the scapula. The illustrated fracture is in its shaft; the close-up separates its medial and lateral fragments.'},
   scapula:{name:'Right scapula',latin:'Scapula',detail:'The shoulder blade forms the shoulder socket with the humeral head and meets the clavicle at the acromioclavicular joint. It is part of the shoulder girdle.'},
   humerus:{name:'Right humerus',latin:'Humerus',detail:'The upper-arm bone lies between the shoulder and elbow. Follow it between the forearm and shoulder during the bracing movement.'},
   radius:{name:'Right radius',latin:'Radius',detail:'One of the two forearm bones, on the thumb side in anatomical position. Its distal end articulates with the wrist. It moves with the ulna during this simplified arm animation.'},
   ulna:{name:'Right ulna',latin:'Ulna',detail:'The forearm bone on the little-finger side in anatomical position. Its proximal end forms the main hinge with the humerus at the elbow.'},
   hand:{name:'Right hand',latin:'Manus',detail:'The hand includes carpal bones, metacarpals, and phalanges. Its palm is the illustrated pavement-contact region. A contact marker is not a measured force.'},
  },
  stages:{
   walk:{observe:'Watch the alternating steps as the figure approaches the blue patch.',anatomy:'Locate the right hand, forearm, upper arm, and shoulder girdle before the motion changes.',takeaway:'Begin with orientation: right and left belong to the figure, not the viewer.'},
   slip:{observe:'The right heel slides forward while the other foot remains planted. The torso reacts after the slide begins.',anatomy:'Track the pelvis and torso relative to the feet; then watch the arms begin their balancing response.',takeaway:'The cyan arrow shows the authored sliding direction, not a calculated friction force.'},
   brace:{observe:'The torso falls backward and the right arm reaches behind. The palm gradually turns toward the pavement.',anatomy:'Follow the humerus at the shoulder, the radius and ulna in the forearm, and the hand beyond the wrist.',takeaway:'Reaching and actual ground contact are separate events. The gold route appears only after contact.'},
   contact:{observe:'The right palm meets the pavement behind the body and remains planted.',anatomy:'Trace the gold schematic route from the hand through the forearm and upper arm toward the shoulder girdle.',takeaway:'The line illustrates a loading route. It does not show measured force or prove that a fracture must occur.'},
   fracture:{observe:'The right midshaft clavicle fragments separate after hand contact; compare the close-up with the full figure.',anatomy:'Identify the medial fragment toward the sternum and the lateral fragment toward the shoulder.',takeaway:'This fracture is an authored example. Its location, displacement, and timing are not predictions from the fall.'},
  },
 },
 mn:{
  guided:'Түр зогсоож таамаглах',guidedHint:'Гурван чухал үйл явдлын өмнө хичээл зогсоно. Хариугаа сонгож, тайлбарыг уншаад үргэлжлүүл.',
  overlays:'Анатомийн нэршил',overlayHint:'Нэршил эсвэл доорх бүтцийг сонгоход хөдөлгөөн зогсож, тухайн хэсэг тодорно.',predict:'Түр зогсоож таамагла',continue:'Хичээлийг үргэлжлүүлэх',correct:'Зөв таамаглалаа',review:'Хариуг тайлбарлая',answerLabel:'Зөв хариу',choose:'Тайлбарыг харахын тулд нэг хариуг сонго.',observe:'Ажигла',anatomy:'Анатомитой холбох',takeaway:'Санах зүйл',inspect:'Баруун дээд мөчийг судлах',inspectionHint:'Үүргийг нь мэдэхийн тулд бүтцийг сонго.',restart:'Шинээр эхлэхэд асуултууд дахин гарна.',
  predictions:{
   direction:{question:'Баруун өсгий урагш гулсах гэж байна. Энэ жишээнд биеийн дээд хэсэг аль зүгт унах вэ?',options:['Хөл аарцгаас урагшилж, бие арагш унана','Гулссан хөлөө дагаж урагш унана','Бүх хугацаанд босоо хэвээр байна'],correct:0,explanation:'Энэ урьдчилан өгсөн хөдөлгөөнд хөл урагш гулсаж, дараа нь аарцаг доошилж, их бие арагш хазайна. Өсгийн гулсалт ба биеийн хариу хөдөлгөөний хоорондох хугацааг ажигла.'},
   hand:{question:'Дараа нь аль гар биеийн хаана явган замд тулах вэ?',options:['Зүүн гар биеийн урд','Баруун гар биеийн ард','Баруун гар биеийн урд'],correct:1,explanation:'Баруун гар унаж буй биеийн ард сунана. Баруун алга тэнд газарт тулах бөгөөд нөгөө гар тэнцвэрээ хадгалахаар хажуу тийш хөдөлнө. Тулахын өмнөх алганы эргэлтийг ажигла.'},
   outcome:{question:'Сунгасан гараар уналтаа тулах бүрд эгэм заавал хугарах уу?',options:['Тийм, ийм уналт бүрд эгэм хугарна','Үгүй, хугарч болох ч зайлшгүй биш','Үгүй, сунгасан гараар унахад эгэм огт гэмтэхгүй'],correct:1,explanation:'Сунгасан гараар унахад эгэм хугарч болох ч гараар тулсан нь дангаараа хугарлыг батлахгүй. Энэ хичээл анатомийг заахын тулд хугарлыг урьдчилан өгсөн бөгөөд гэмтлийн босго хүчийг тооцоогүй.'},
  },
  structures:{
   clavicle:{name:'Баруун эгэм',latin:'Clavicula',detail:'Эгэм нь өвчүүг далтай холбоно. Энэ жишээнд эгэмний гол хэсэг хугарч, томруулсан дүрслэлд дотор болон гадна хэсгийг харуулна.'},
   scapula:{name:'Баруун дал',latin:'Scapula',detail:'Далны үений хонхор нь бугалганы толгойтой мөрний үе үүсгэнэ. Далны акромион нь эгэмтэй үелж, мөрний бүслүүрийн нэг хэсэг болдог.'},
   humerus:{name:'Баруун бугалга',latin:'Humerus',detail:'Бугалганы яс нь мөр ба тохойн хооронд байрлана. Гараар тулах үед шуунаас мөр хүртэлх холбоосыг нь ажигла.'},
   radius:{name:'Баруун цацраг яс',latin:'Radius',detail:'Анатомийн байрлалд эрхий хуруу талд байх шууны хоёр ясны нэг. Доод үзүүр нь бугуйтай үелнэ. Энэ хялбаршуулсан хөдөлгөөнд богтос ястай хамт хөдөлнө.'},
   ulna:{name:'Баруун богтос яс',latin:'Ulna',detail:'Анатомийн байрлалд чигчий хуруу талд байх шууны яс. Дээд үзүүр нь бугалгатай үелж, тохойн үндсэн нугалах үеийг үүсгэнэ.'},
   hand:{name:'Баруун гар',latin:'Manus',detail:'Гар нь бугуйн яс, алганы яс, хурууны шивнүүрээс бүрдэнэ. Алга нь энэ жишээний газарт тулах хэсэг. Тулалтын тэмдэг нь хэмжсэн хүч биш.'},
  },
  stages:{
   walk:{observe:'Цэнхэр хэсэгт ойртох хүртэлх ээлжилсэн алхалтыг ажигла.',anatomy:'Хөдөлгөөн өөрчлөгдөхөөс өмнө баруун гар, шуу, бугалга, мөрний бүслүүрийг ол.',takeaway:'Баруун, зүүн гэдэг нь ажиглагчийн биш, дүрсний өөрийн тал юм.'},
   slip:{observe:'Нөгөө хөл газарт тулсан хэвээр байхад баруун өсгий урагш гулсана. Дараа нь их бие хариу хөдөлгөөн хийнэ.',anatomy:'Хөлтэй харьцуулсан аарцаг, их биеийн байрлалыг дагаж, гарны тэнцвэржүүлэх хөдөлгөөнийг ажигла.',takeaway:'Цэнхэр сум нь урьдчилан өгсөн гулсалтын чиглэлийг харуулна; үрэлтийн тооцоолсон хүч биш.'},
   brace:{observe:'Их бие арагш унаж, баруун гар ардаа сунана. Алга аажмаар газарт тулах байрлалд эргэнэ.',anatomy:'Мөр дэх бугалга, шууны цацраг ба богтос яс, бугуйнаас цааш гарыг дарааллаар дага.',takeaway:'Гараа сунгах болон газарт тулах нь тусдаа үйл явдал. Алтан зам зөвхөн тулсны дараа гарна.'},
   contact:{observe:'Баруун алга биеийн ард явган замд тулж, тэр байрлалд тогтоно.',anatomy:'Гарнаас шуу, бугалгаар дамжин мөрний бүслүүрт хүрэх алтан бүдүүвч замыг дага.',takeaway:'Шугам нь ачааллын замыг дүрслэнэ. Хэмжсэн хүчийг харуулахгүй, хугарал заавал үүсэхийг батлахгүй.'},
   fracture:{observe:'Гараар тулсны дараа баруун эгэмний голын хэсгүүд сална. Томруулалтыг бүтэн дүрстэй харьцуул.',anatomy:'Өвчүү талын дотор хэсэг болон мөр талын гадна хэсгийг ялга.',takeaway:'Энэ нь урьдчилан өгсөн хугарлын жишээ. Байрлал, зөрөө, хугацааг уналтаас тооцож таамаглаагүй.'},
  },
 },
};
