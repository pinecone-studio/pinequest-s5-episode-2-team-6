import {useLang} from '../locale';
import type {FracturePattern} from './bone-requests';
import {FRACTURE_SCENARIOS} from './bone-requests';

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

export function ScenarioDiagram({id,progress}:{id:string;progress:number}){
 const {lang}=useLang(),mn=lang==='mn',scenario=FRACTURE_SCENARIOS.find(item=>item.id===id);
 if(!scenario)return null;
 const t=Math.min(1,Math.max(0,progress/.25)),motion=id==='fall'?t*t:t,contact=progress>=.25,crumple=Math.min(1,Math.max(0,(progress-.25)/.12));
 const marker=id==='fall'?[280,190]:id==='crash'?[297+14*crumple,126]:[230,170];
 return <figure className="fracture-scenario">
  <figcaption><strong>{mn?scenario.mn:scenario.en} · {scenario.bone}</strong><p>{mn?scenario.detailMn:scenario.detail}</p></figcaption>
  <svg viewBox="0 0 600 220" role="img" aria-label={`${mn?scenario.mn:scenario.en}: ${mn?(contact?'Хүрэлцсэн · хугарлын жишээ':'Хүрэлцэхийн өмнө'):(contact?'Contact reached; prescribed fracture':'Before contact')}`}>
   <path d="M30 190H570" stroke="#8aa5b6" strokeWidth="2"/>
   {id==='fall'?<g transform={`translate(180 0) rotate(${90*motion} 0 190)`} stroke="#cde0e9" strokeWidth="7" fill="none" strokeLinecap="round"><circle cx="0" cy="63" r="14"/><path d="M0 78V138M-25 105L0 90L25 112M0 138L-18 185M0 138L18 185"/><path d="M-12 90H12" stroke="#ffc878"/></g>:id==='crash'?<>
    <path d="M390 30V190" stroke="#9fb1bd" strokeWidth="12"/>
    <g transform={`translate(${50+110*motion+14*crumple} 0)`} stroke="#cde0e9" strokeWidth="5" fill="none"><path d={`M10 156V100L50 95L75 42H155L190 95H${230-14*crumple}V156Z`}/><circle cx="48" cy="166" r="20" fill="#1d3344"/><circle cx="190" cy="166" r="20" fill="#1d3344"/><circle cx="110" cy="67" r="12"/><path d="M110 80V124L165 128L180 153M110 90L161 95"/><path d="M110 124L165 128" stroke="#ffc878"/></g>
   </>:<><g stroke="#cde0e9" strokeWidth="7" fill="none" strokeLinecap="round"><circle cx="210" cy="63" r="14"/><path d="M210 78V130L180 185M210 130L240 185M185 112L210 90L240 108"/><path d="M225 155L240 185" stroke="#ffc878"/></g><circle cx={470-220*motion} cy="170" r="16" fill="#ffc878"/></>}
   {contact&&<circle cx={marker[0]} cy={marker[1]} r="13" fill="none" stroke="#ff875e" strokeWidth="3"/>}
  </svg>
  <p>{mn?(contact?'02 · Хүрэлцсэн — доорх 3D хугарлыг ажиглаарай.':'01 · Хүрэлцэхийн өмнөх хөдөлгөөн'):(contact?'02 · Contact — follow the prescribed fracture in 3D below.':'01 · Motion before contact')}</p>
  <small>{mn?'Схемчилсэн сургалтын хөдөлгөөн; хүч, гэмтлийн магадлалыг тооцохгүй.':'Schematic choreography; no impact-force or injury-probability calculation.'} <a href={scenario.source} target="_blank" rel="noreferrer">AAOS ↗</a></small>
 </figure>;
}
