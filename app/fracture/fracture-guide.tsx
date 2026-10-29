import {useLang} from '../locale';
import type {FracturePattern} from './bone-requests';
import {FRACTURE_SCENARIOS} from './bone-requests';
import FallScene from './fall-scene';
import type {ScenarioId} from './fall-model';

const classifications=[
 {id:'transverse',en:'Transverse',mn:'Хөндлөн',description:'A line across the bone.',descriptionMn:'Ясыг хөндлөн огтолсон шугам.',line:'M28 45H72'},
 {id:'oblique',en:'Oblique',mn:'Ташуу',description:'An angled fracture line.',descriptionMn:'Ташуу чиглэлийн хугарлын шугам.',line:'M28 58L72 32'},
 {id:'segmental',en:'Segmental',mn:'Сегментчилсэн',description:'Two breaks isolate a middle segment.',descriptionMn:'Хоёр хугарал дунд хэсгийг тусгаарлана.',line:'M28 33H72M28 57H72'},
 {id:'wedge',en:'Wedge',mn:'Шаантаг',description:'A triangular shaft fragment. Choose an arm or leg long bone, or clavicle.',descriptionMn:'Гурвалжин хэсэг үүснэ. Гар, хөлийн урт яс эсвэл эгэм сонгоно уу.',line:'M72 28L35 45L72 62'},
 {id:'longitudinal',en:'Longitudinal',mn:'Тууш',description:'A split along the bone’s length.',descriptionMn:'Ясны уртын дагуух хуваагдал.',line:'M50 8V82'},
] as const;
export function FractureClassification({pattern,aligned,bone,onChange}:{pattern:FracturePattern;aligned:boolean;bone:string;onChange:(pattern:FracturePattern)=>void}){
 const {lang}=useLang(),mn=lang==='mn';
 return <section className="fracture-classification" aria-label={mn?'Хугарлын ангилал':'Fracture classification'}>
  <h3>{mn?'Хугарлын ангилал':'Fracture classification'}</h3>
  <div className="fracture-type-cards">{classifications.map(type=><button key={type.id} disabled={type.id==='wedge'&&!/^\w+ (femur|tibia|fibula|humerus|radius|ulna|clavicle)$/.test(bone)} aria-pressed={pattern===type.id} onClick={()=>onChange(type.id)}>
   <svg viewBox="0 0 100 90" aria-hidden="true"><path d="M28 8Q20 0 23 18L31 29V61L23 72Q20 90 33 80H67Q80 90 77 72L69 61V29L77 18Q80 0 67 8Z" fill="#f5e8c8" stroke="#8f7956"/><path d={type.line} fill="none" stroke="#b84924" strokeWidth="3"/></svg>
   <strong>{mn?type.mn:type.en}</strong><span>{mn?type.descriptionMn:type.description}</span>
  </button>)}</div>
  <p>{mn?'Хэсгүүдийн байрлал':'Alignment'}: <strong>{aligned?(mn?'Зөрөөгүй':'Nondisplaced'):(mn?'Зөрөөтэй':'Displaced')}</strong>. {mn?'Арьс дүрслээгүй тул нээлттэй, хаалттайг тодорхойлохгүй.':'Open or closed describes the wound, separately from pattern and alignment; skin is not modeled.'}</p>
  <a href="https://orthoinfo.aaos.org/en/diseases--conditions/fractures-broken-bones/" target="_blank" rel="noreferrer">AAOS · {mn?'Хугарлын төрлүүд':'Fracture types'} ↗</a>
  {' · '}<a href="https://surgeryreference.aofoundation.org/orthopedic-trauma/adult-trauma/forearm-shaft/wedge-fracture-of-the-radius-with-no-dislocation/definition" target="_blank" rel="noreferrer">AO · {mn?'Шаантаг':'Wedge'} ↗</a>
 </section>;
}

export function ScenarioDiagram({id,progress,pattern,location,aligned,reset,onReady}:{id:ScenarioId;progress:number;pattern:FracturePattern;location:number;aligned:boolean;reset:number;onReady:()=>void}){
 const {lang}=useLang(),mn=lang==='mn',scenario=FRACTURE_SCENARIOS.find(item=>item.id===id);
 if(!scenario)return null;
 const contact=progress>=.25;
 return <figure className="fracture-scenario" data-scenario={id}>
  <figcaption><strong>{mn?scenario.mn:scenario.en} · {scenario.bone}</strong><p>{mn?scenario.detailMn:scenario.detail}</p></figcaption>
  <FallScene scenario={id} progress={progress} reset={reset} label={`${mn?scenario.mn:scenario.en} · ${mn?'Бүтэн араг яс':'Full skeleton'}`} lang={lang} fracture={{bone:scenario.bone,pattern,location,aligned}} onReady={onReady}/>
  <p>{mn?(contact?'02 · Хүрэлцсэн — хугарлыг томруулсан дүрслэлээс ажиглаарай.':'01 · Хүрэлцэхийн өмнөх хөдөлгөөн'):(contact?'02 · Contact — inspect the synchronized fracture close-up.':'01 · Motion before contact')}</p>
  <small>{mn?'Чирж эргүүлнэ · гүйлгэж томруулна. Урьдчилан өгсөн сургалтын хөдөлгөөн.':'Drag to orbit · scroll to zoom. Authored educational motion; impact forces are not calculated.'} <a href={scenario.source} target="_blank" rel="noreferrer">AAOS ↗</a></small>
 </figure>;
}
