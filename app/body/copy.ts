// Body check screen text in English and Mongolian, and the pain regions it can mark.
import type {Lang} from '../landing/copy';

export type RegionId='neck'|'shoulder'|'chest'|'arm';
// dot: where the marker sits on /landing/hero.webp (794 × 1171 px). chip: the bottom centre of its label.
// muscles: the name shown (translated through mongolian-names) and the atlas concept "View in 3D" opens.
export const REGIONS:{id:RegionId;dot:[number,number];chip:[number,number];muscles:{name:string;concept:string}[]}[]=[
 {id:'neck',dot:[404,326],chip:[200,250],muscles:[{name:'sternocleidomastoid',concept:'sternocleidomastoid'},{name:'splenius capitis',concept:'splenius capitis'},{name:'levator scapulae',concept:'levator scapulae'},{name:'scalene muscle',concept:'scalene muscle'}]},
 {id:'shoulder',dot:[205,468],chip:[150,388],muscles:[{name:'deltoid',concept:'zone of deltoid'},{name:'supraspinatus',concept:'supraspinatus'},{name:'trapezius',concept:'descending part of trapezius'}]},
 {id:'chest',dot:[528,540],chip:[640,396],muscles:[{name:'pectoralis major',concept:'zone of pectoralis major'},{name:'pectoralis minor',concept:'pectoralis minor'},{name:'serratus anterior',concept:'serratus anterior'}]},
 {id:'arm',dot:[690,640],chip:[660,582],muscles:[{name:'biceps brachii',concept:'long head of biceps brachii'},{name:'brachialis',concept:'brachialis'},{name:'coracobrachialis',concept:'coracobrachialis'}]},
];
export const DEFAULT_PAIN:Partial<Record<RegionId,number>>={neck:5,chest:3};

const en={
 title:'Body check',
 profile:'Profile',
 regions:{neck:'Neck',shoulder:'Shoulder',chest:'Chest',arm:'Upper arm'} as Record<RegionId,string>,
 pain:{neck:'Neck pain',shoulder:'Shoulder pain',chest:'Chest pain',arm:'Arm pain'} as Record<RegionId,string>,
 mark:(region:string)=>`Mark ${region.toLowerCase()} pain`,
 painCount:(n:number)=>n===1?'1 pain point':`${n} pain points`,
 noPain:'No pain marked',
 hint:'Tap the body where it hurts',
 done:'Done',
 log:'Log pain',
 measure:{title:'Begin measurement',text:'Measure how far your joints move, live with your camera.',start:'Start'},
 heart:{title:'Heart',text:'Explore the four chambers and valves of the heart in 3D.',open:'Open in 3D'},
 dock:{label:'Sections',body:'Body',atlas:'3D atlas',measure:'ROM lab',ai:'Ask AI'},
 sheet:{eyebrow:'Pain point',intensity:'Intensity',muscles:'Muscles in this area',view:'View in 3D',remove:'Remove',close:'Close',
  levels:['Mild','Moderate','Severe'],
  note:'For learning only. See a clinician if pain is sudden, severe or does not go away.'},
};

const mn:typeof en={
 title:'Биеийн шалгалт',
 profile:'Профайл',
 regions:{neck:'Хүзүү',shoulder:'Мөр',chest:'Цээж',arm:'Бугалга'},
 pain:{neck:'Хүзүүний өвдөлт',shoulder:'Мөрний өвдөлт',chest:'Цээжний өвдөлт',arm:'Гарны өвдөлт'},
 mark:(region:string)=>`${region} өвдөж байгааг тэмдэглэх`,
 painCount:(n:number)=>`${n} өвдөлтийн цэг`,
 noPain:'Өвдөлт тэмдэглээгүй',
 hint:'Өвдөж буй хэсэг дээрээ дарна уу',
 done:'Болсон',
 log:'Өвдөлт тэмдэглэх',
 measure:{title:'Хэмжилт эхлүүлэх',text:'Үе мөчний хөдөлгөөний далайцаа камераараа шууд хэмжээрэй.',start:'Эхлэх'},
 heart:{title:'Зүрх',text:'Зүрхний дөрвөн хөндий, хавхлагыг 3D-ээр судлаарай.',open:'3D-ээр нээх'},
 dock:{label:'Хэсгүүд',body:'Бие',atlas:'3D атлас',measure:'Хөдөлгөөний далайц',ai:'AI-аас асуух'},
 sheet:{eyebrow:'Өвдөлтийн цэг',intensity:'Хүч',muscles:'Энэ хэсгийн булчингууд',view:'3D-ээр харах',remove:'Устгах',close:'Хаах',
  levels:['Бага','Дунд','Хүчтэй'],
  note:'Зөвхөн сургалтын зорилготой. Өвдөлт гэнэт, хүчтэй эсвэл удаан үргэлжилбэл эмчид хандаарай.'},
};

export const BODY_COPY:Record<Lang,typeof en>={en,mn};
