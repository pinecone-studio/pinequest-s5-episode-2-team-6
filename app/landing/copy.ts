// Landing page text in English and Mongolian. The brand, source and tool names stay as written.
export type Lang='en'|'mn';
export const LANGS:{id:Lang;label:string;name:string}[]=[{id:'mn',label:'MN',name:'Монгол'},{id:'en',label:'EN',name:'English'}];

const en={
  nav:{account:'Account',language:'Language',signIn:'Sign in',open:'Open atlas'},
  hero:{lines:['Redefining how','the body is learned','in 3D'],lead:'An interactive atlas of the human body. Rotate, peel back and explode 2,763 real structures, then ask the built-in assistant to explain what you see.',cta:'Open the 3D atlas',signup:'Create a free account',scroll:'Scroll to explore'},
  strip:'Built on open anatomy and the open web',
  words:{label:'What you can do',items:[
    {word:'anatomy',caption:'Orbit and zoom around 2,763 real structures from any angle.'},
    {word:'systems',caption:'Strip back skin, muscle and bone one layer at a time to see what sits beneath.'},
    {word:'learn',caption:'Ask the assistant, take a quiz and read the Latin term beside every part.'},
  ]},
  stats:{title:'Every structure is a fusion of real data, clear names and careful detail',items:[
    {value:'2,763',label:'selectable structures',note:'named meshes you can tap'},
    {value:'16',label:'body systems',note:'each with its own color'},
    {value:'3.0M',label:'triangles of detail',note:'not a single mesh dropped'},
  ]},
  usage:{label:'Usage counter',visits:'visits',engaged:'visitors who used it',opens:'atlas opens'},
  unlock:{lead:'Anatomn unlocks a faster,',title:' smarter way to study anatomy',text:'Bring the textbook to life instantly. Cut through dense diagrams, skip the tab-switching and stay focused on the structure in front of you.',cta:'Launch now',features:[
    {title:'3D Atlas',text:'Rotate, peel back and explode the whole body.'},
    {title:'AI Assistant',text:'Ask which nerve supplies a muscle and watch it light up.'},
    {title:'Tours & quizzes',text:'Guided walkthroughs and quick checks before the exam.'},
    {title:'ROM Lab',text:'Track shoulder range of motion live with your camera.'},
  ]},
  finale:{title:['The whole body,','one tap away'],note:'Built on BodyParts3D, Z-Anatomy and Anatomy Standard. An educational explorer, not a diagnostic or surgical tool.',credits:'Read the full credits',tag:'Designed for',tagStrong:'students'},
  footer:{label:'Footer',atlas:'3D Atlas',signup:'Sign up',login:'Log in'},
};

const mn:typeof en={
  nav:{account:'Бүртгэл',language:'Хэл',signIn:'Нэвтрэх',open:'Атлас нээх'},
  hero:{lines:['Хүний биеийг','шинэ түвшинд','3D-ээр судал'],lead:'Хүний биеийн интерактив атлас. 2,763 бодит бүтцийг эргүүлж, давхарга давхаргаар нь хуулж, задлан хараад, харсан бүхнээ суурилуулсан туслахаас асуугаарай.',cta:'3D атлас нээх',signup:'Үнэгүй бүртгүүлэх',scroll:'Гүйлгэж үзэх'},
  strip:'Нээлттэй анатомийн өгөгдөл, нээлттэй вэб технологи дээр бүтээв',
  words:{label:'Юу хийж болох вэ',items:[
    {word:'анатоми',caption:'2,763 бодит бүтцийг хүссэн өнцгөөсөө эргүүлж, ойртуулж хар.'},
    {word:'цогц систем',caption:'Арьс, булчин, ясыг давхарга бүрээр нь хуулж, доор нь юу байгааг хар.'},
    {word:'суралц',caption:'Туслахаас асууж, сорил өгч, хэсэг бүрийн латин нэрийг уншаарай.'},
  ]},
  stats:{title:'Бүтэц бүр бодит өгөгдөл, ойлгомжтой нэршил, нарийн нягт боловсруулалтын нэгдэл',items:[
    {value:'2,763',label:'сонгож болох бүтэц',note:'товшиж үзэх нэртэй хэсгүүд'},
    {value:'16',label:'биеийн систем',note:'тус бүр өөрийн өнгөтэй'},
    {value:'3 сая',label:'нарийвчилсан гурвалжин',note:'нэг ч хэсэг хасагдаагүй'},
  ]},
  usage:{label:'Ашиглалтын тоолуур',visits:'удаа үзсэн',engaged:'ашигласан зочид',opens:'удаа атлас нээсэн'},
  unlock:{lead:'Anatomn анатомийг илүү хурдан,',title:' ухаалгаар судлах боломж олгоно',text:'Сурах бичгээ шууд амилуул. Ээдрээтэй зургуудаас салж, цонх хооронд үсрэхээ больж, өмнө чинь байгаа бүтцэдээ анхаарлаа төвлөрүүл.',cta:'Одоо эхлэх',features:[
    {title:'3D атлас',text:'Бүх биеийг эргүүлж, давхаргаар нь хуулж, задлан хар.'},
    {title:'AI туслах',text:'Булчинг ямар мэдрэл мэдрүүлдгийг асуугаад, тодрон гэрэлтэхийг хар.'},
    {title:'Аялал ба сорил',text:'Шалгалтын өмнөх удирдамжтай аялал, богино сорилууд.'},
    {title:'ROM лаборатори',text:'Камераараа мөрний хөдөлгөөний далайцыг шууд хэмж.'},
  ]},
  finale:{title:['Бүтэн бие,','нэг товшилтын зайд'],note:'BodyParts3D, Z-Anatomy, Anatomy Standard дээр суурилсан. Энэ бол сургалтын хэрэгсэл бөгөөд онош тавих, мэс заслын зориулалттай биш.',credits:'Эх сурвалжийг бүрэн унших',tag:'Оюутнуудад',tagStrong:'зориулав'},
  footer:{label:'Хөл хэсэг',atlas:'3D атлас',signup:'Бүртгүүлэх',login:'Нэвтрэх'},
};

export const COPY:Record<Lang,typeof en>={en,mn};

const KEY='human-atlas-lang';
export function loadLang():Lang{
  try{const saved=localStorage.getItem(KEY);if(saved==='en'||saved==='mn')return saved;}catch{/* Storage can be blocked; fall back to the browser language. */}
  return navigator.language.toLowerCase().startsWith('mn')?'mn':'en';
}
export function saveLang(lang:Lang){try{localStorage.setItem(KEY,lang);}catch{/* The choice still applies for this visit. */}}
