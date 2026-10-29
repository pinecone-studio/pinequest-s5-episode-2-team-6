import {useState,type FormEvent} from 'react';
import {Play,Search} from 'lucide-react';
import {useLang} from '../locale';
import type {Atlas} from '../anatomy';
import {resolveSimulationRequest,type SimulationRequest} from './simulation-request';
import {resolveBoneRequest,normalizeBoneText,type BoneRequest} from './bone-requests';
import {FRACTURE_SCENARIOS} from './bone-requests';

export default function SimulationPrompt({atlas,onRun,onBones}:{atlas:Atlas|null;onRun:(request:SimulationRequest)=>void;onBones:(request:BoneRequest)=>void}){
 const {lang}=useLang(),mn=lang==='mn';
 const [prompt,setPrompt]=useState(''),[feedback,setFeedback]=useState(''),[search,setSearch]=useState('');
 const bones=atlas?.parts.filter(part=>part.system==='skeletal').sort((a,b)=>a.name.localeCompare(b.name))??[];
 const examples=mn?['Баруун femur хөндлөн хугарал','Зүүн эгэмний зөрөөгүй хугарал','Арагш унахыг үзүүл']:['Animate an oblique right femur fracture','Fracture the left radius and left ulna','Show a segmental fracture of T7','Show every bone fracture'];
 const run=(value:string)=>{
  if(!value.trim())return;
  if(atlas){
   const result=resolveBoneRequest(value,bones);
   if(result.request){setFeedback(mn?`${result.request.boneIds.length} яс олдлоо. Доороос ясаа сонгож үзээрэй.`:`Matched ${result.request.boneIds.length} bone mesh part${result.request.boneIds.length===1?'':'s'}. Inspect each match in the bone selector below.`);onBones(result.request);return;}
   if(result.error==='pattern'){setFeedback(mn?'Хөндлөн, ташуу, сегментчилсэн, шаантаг эсвэл тууш хэлбэрээс сонгоно уу.':'Supported animations: transverse, oblique, segmental, wedge, and longitudinal. Spiral, compression, greenstick, stress, comminuted, and open fractures need different models.');return;}
   if(result.error==='location'){setFeedback(mn?'Гол хэсэг эсвэл дээд, доод гуравны нэгийг сонгоно уу. Шаантаг хэлбэрийг гуя, шаант, тахилзуур, бугалга, цацраг, богтос, эгэмд үзүүлнэ.':'Choose a center or third-of-model cut. Wedge examples support femur, tibia, fibula, humerus, radius, ulna, and clavicle shafts. Joint, head, neck, proximal, and distal injury models are unavailable.');return;}
  }
  const request=resolveSimulationRequest(value);
  if(request?.mode==='fall'){setFeedback(mn?'Уналтын жишээ эхэллээ.':'Starting the authored backward-fall lesson.');onRun(request);return;}
  setFeedback(!atlas?(mn?'Ясны жагсаалтыг ачаалж байна.':'The bone catalogue is not ready yet. Please retry once it loads.'):(mn?'Ясны нэрийг тодруулна уу. Доорх жагсаалтаас сонгож болно.':'Name a bone, side, or region—for example “right tibia”, “left fifth rib”, “C3”, “skull”, or “all bones”. You can also choose an exact bone below.'));
 };
 const submit=(event:FormEvent)=>{event.preventDefault();run(prompt);};
 const filtered=bones.filter(bone=>normalizeBoneText(bone.name).includes(normalizeBoneText(search)));
 return <section className="simulation-prompt" aria-labelledby="simulation-prompt-title">
  <p className="simulation-kicker">{mn?'СУДЛАХ · АЖИГЛАХ · ОЙЛГОХ':'ASK · WATCH · UNDERSTAND'}</p>
  <h2 id="simulation-prompt-title">{mn?'Аль ясны хугарлыг үзүүлэх вэ?':'Which bone would you like to fracture?'}</h2>
  <p>{mn?'Ясны нэр, тал, зүсэлтийн хэлбэрийг бичээрэй. Хөдөлгөөн болон тайлбарыг хамт үзүүлнэ.':'Describe a bone, side, and cut pattern. Explore every skeletal mesh in the atlas, with animated fragments and a step-by-step explanation.'}</p>
  <form onSubmit={submit}><label htmlFor="simulation-request">{mn?'Хүсэлт':'Your simulation request'}</label><div className="simulation-input-row"><textarea id="simulation-request" rows={2} maxLength={600} value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder={examples[0]} required/><button type="submit" disabled={!prompt.trim()}><Play size={16}/>{mn?'Үзүүлэх':'Run simulation'}</button></div></form>
  <div className="simulation-examples">{examples.map(example=><button key={example} onClick={()=>{setPrompt(example);run(example);}}>{example}</button>)}</div>
  <div className="simulation-examples" role="group" aria-label={mn?'Ослын жишээнүүд':'Scenario examples'}>{FRACTURE_SCENARIOS.map(scenario=><button key={scenario.id} disabled={!atlas} onClick={()=>{const value=`Simulate ${scenario.en}`;setPrompt(value);run(value);}}>{mn?scenario.mn:scenario.en}</button>)}</div>
  <p className="simulation-feedback" role="status">{feedback}</p>
  <details className="bone-catalogue"><summary><Search size={14}/>{mn?'Бүх яснаас сонгох':'Browse every bone'} {bones.length>0&&`· ${bones.length}`}</summary><label htmlFor="bone-search">{mn?'Ясны нэрээр хайх':'Filter bone names'}</label><input id="bone-search" type="search" value={search} onChange={event=>setSearch(event.target.value)} placeholder="Femur, rib, phalanx…"/><div className="bone-catalogue-results">{filtered.map(bone=><button key={bone.id} onClick={()=>{setPrompt(`Animate a fracture of ${bone.name}`);setFeedback(`${bone.name} · ${bone.id}`);onBones({boneIds:[bone.id],pattern:'transverse',aligned:false,location:.5});}}>{bone.name}<small>{bone.id}</small></button>)}{!filtered.length&&<p>{mn?'Яс олдсонгүй.':'No matching bones.'}</p>}</div></details>
  <small>{mn?'Ясны нэрийг шууд сонгоно. Үр дүн нь сургалтын жишээ; гэмтэл урьдчилан таамаглахгүй.':'Prompts select named bones and supported cut patterns. Falls and impacts do not determine fracture outcomes in this geometry demonstration.'}</small>
 </section>;
}
