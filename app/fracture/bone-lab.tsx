import {useEffect,useRef,useState} from 'react';
import {Pause,Play,RotateCcw} from 'lucide-react';
import type {Atlas} from '../anatomy';
import {useLang} from '../locale';
import BoneScene from './bone-scene';
import {fractureStage} from './bone-geometry';
import {FractureClassification,ScenarioDiagram} from './fracture-guide';
import type {BoneRequest,FracturePattern} from './bone-requests';

const patterns:FracturePattern[]=['transverse','oblique','segmental','wedge','longitudinal'];
const names={en:{transverse:'Crosswise cut',oblique:'Angled cut',segmental:'Two cuts · three fragments',wedge:'Wedge · triangular fragment',longitudinal:'Longitudinal · lengthwise split'},mn:{transverse:'Хөндлөн зүсэлт',oblique:'Ташуу зүсэлт',segmental:'Хоёр зүсэлт · гурван хэсэг',wedge:'Шаантаг · гурвалжин хэсэг',longitudinal:'Тууш · уртын дагуух зүсэлт'}};
export default function BoneLab({atlas,request}:{atlas:Atlas;request:BoneRequest}){
 const {lang}=useLang(),mn=lang==='mn';
 const bones=request.boneIds.map(id=>atlas.parts.find(p=>p.id===id)).filter(p=>!!p);
 const [id,setId]=useState(bones[0]?.id),[pattern,setPattern]=useState(request.pattern),[location,setLocation]=useState(request.location),[aligned,setAligned]=useState(request.aligned);
 const [progress,setProgress]=useState(0),[playing,setPlaying]=useState(false),[ready,setReady]=useState(false),[reset,setReset]=useState(0);
 const current=useRef(progress);current.current=progress;
 const part=bones.find(bone=>bone.id===id)??bones[0],stage=fractureStage(progress);
 useEffect(()=>{if(request.scenario)document.querySelector('.fracture-scenario')?.scrollIntoView({behavior:'smooth',block:'start'});},[request.scenario]);
 useEffect(()=>{setProgress(0);setPlaying(false);setReady(false);},[id,pattern,location]);
 useEffect(()=>{
  if(!playing||!ready)return;
  let frame=0,last:number|undefined;
  const tick=(time:number)=>{const dt=last===undefined?0:Math.min(50,time-last);last=time;current.current=Math.min(1,current.current+dt/6000);setProgress(current.current);if(current.current<1)frame=requestAnimationFrame(tick);else setPlaying(false);};
  frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);
 },[playing,ready]);
 if(!part)return null;
 const stages=mn?{intact:'Бүтэн яс',line:'Хугарлын шугам',separating:aligned?'Хэсгүүд нэг шугамд байна':'Хэсгүүд шилжиж байна',complete:'Жишээ дууслаа'}:{intact:'Intact bone',line:'Fracture line appears',separating:aligned?'Fragments remain aligned':'Fragments separate',complete:'Fracture example complete'};
 const explanation=stage==='intact'?(mn?'Сонгосон ясны бодит хэлбэрийг ажиглаарай.':'Inspect the selected bone’s actual atlas geometry before the break appears.'):stage==='line'?(mn?'Улбар шар шугам нь сонгосон зүсэлтийн байршлыг харуулна.':'Orange contours trace where the chosen cut planes intersect this bone.'):aligned?(mn?'Хугарлын шугам харагдах боловч хэсгүүдийг шилжүүлэхгүй.':'The break remains visible while the fragments stay in their original positions.'):pattern==='segmental'?(mn?'Хоёр хавтгайгаар гурван хэсэг үүсгэж, хооронд нь зай гаргана.':'Two cut planes divide this bone into three illustrated fragments; the middle fragment moves outward.'):pattern==='oblique'?(mn?'Ташуу зүсэлтийн хоёр талын хэсгүүд зөрж, бага зэрэг эргэнэ.':'The two fragments separate along an angled cut and rotate slightly to expose the fracture edges.'):(mn?'Хөндлөн зүсэлтийн хоёр талын хэсгүүд салж, бага зэрэг эргэнэ.':'The two fragments move apart across the cut and rotate slightly to expose the fracture edges.');
 const detail=!aligned&&(stage==='separating'||stage==='complete')&&(pattern==='wedge'||pattern==='longitudinal')?(mn?(pattern==='wedge'?'Хоёр ташуу хавтгай гурвалжин хэсгийг тусгаарлана.':'Ясыг уртын дагуу хувааж, хэсгүүдийг бага зэрэг салгана.'):(pattern==='wedge'?'Two intersecting angled cuts isolate a triangular wedge between the main fragments.':'A lengthwise cut splits the bone along its longest model axis; the halves separate slightly.')):explanation;
 return <section className="bone-lab" aria-label={mn?'Бүх ясны хугарлын үзүүлэн':'Full skeleton fracture explorer'}>
  <div className="bone-selection-heading"><h2>{part.name}</h2><p>{bones.length} {mn?'яс сонгогдсон · нэг нэгээр нь үзнэ':'matched mesh parts · inspect one at a time'}</p></div>
  <label className="bone-select-label">{mn?'Үзүүлэх яс':'Bone to animate'}<select value={part.id} onChange={event=>setId(event.target.value)}>{bones.map(bone=><option key={bone.id} value={bone.id}>{bone.name}{bones.filter(other=>other.name===bone.name).length>1?` (${bone.id})`:''}</option>)}</select></label>
  {request.scenario&&<ScenarioDiagram id={request.scenario} progress={progress}/>}
  <FractureClassification pattern={pattern} aligned={aligned} bone={part.name} onChange={setPattern}/>
  <div className="fracture-layout">
   <section className="fracture-viewer"><BoneScene atlas={atlas} part={part} pattern={pattern} location={location} aligned={aligned} progress={progress} reset={reset} onReady={()=>{setReady(true);setPlaying(true);}}/><div className="fracture-legend"><span><i/>{mn?'Хэсэг 1':'Fragment 1'}</span><span><i/>{mn?'Хэсэг 2':'Fragment 2'}</span>{(pattern==='segmental'||pattern==='wedge')&&<span><i/>{mn?'Хэсэг 3':'Fragment 3'}</span>}</div><p className="fracture-gesture">{mn?'Чирж эргүүлнэ · гүйлгэж томруулна':'Drag to rotate · scroll or pinch to zoom'}</p></section>
   <section className="fracture-controls">
    <label className="bone-select-label">{mn?'Зүсэлтийн хэлбэр':'Cut pattern'}<select value={pattern} onChange={event=>setPattern(event.target.value as FracturePattern)}>{patterns.map(value=><option key={value} value={value} disabled={value==='wedge'&&!/^\w+ (femur|tibia|fibula|humerus|radius|ulna|clavicle)$/.test(part.name)}>{names[lang][value]}</option>)}</select></label>
    <label className="bone-select-label">{mn?'Зүсэлтийн байрлал':'Cut location'}<select value={location} onChange={event=>setLocation(Number(event.target.value))}>{[.32,.5,.68].map((value,index)=><option key={value} value={value}>{pattern==='longitudinal'?(mn?`Өргөний ${Math.round(value*100)}%`:`${Math.round(value*100)}% across model width`):(mn?['Доод гуравны нэг','Гол хэсэг','Дээд гуравны нэг'][index]:['Lower third of model','Center of model','Upper third of model'][index])}</option>)}</select></label>
    <label className="bone-alignment"><input type="checkbox" checked={aligned} onChange={event=>setAligned(event.target.checked)}/>{mn?'Зөрөөгүй харуулах':'Keep fragments aligned'}</label>
    <div className="simulation-bone-status" role="status"><strong>{stages[stage]}</strong><p>{part.name} · {names[lang][pattern]}</p><p>{detail}</p></div>
    <label className="fracture-slider"><span>{mn?'Хөдөлгөөний явц':'Animation progress'}<output>{Math.round(progress*100)}%</output></span><input type="range" min={0} max={1} step={.001} value={progress} disabled={!ready} onChange={event=>{setPlaying(false);setProgress(Number(event.target.value));}}/></label>
    <div className="fracture-playback"><button className="fracture-primary" disabled={!ready} onClick={()=>{if(progress>=1){current.current=0;setProgress(0);}setPlaying(value=>!value);}}>{playing?<Pause size={16}/>:<Play size={16}/>} {mn?(playing?'Түр зогсоох':'Тоглуулах'):(playing?'Pause':progress>=1?'Replay':'Play')}</button><button onClick={()=>{setPlaying(false);current.current=0;setProgress(0);}}><RotateCcw size={15}/>{mn?'Шинээр эхлэх':'Reset'}</button><button onClick={()=>setReset(value=>value+1)}>{mn?'Харагдац сэргээх':'Reset view'}</button></div>
   </section>
  </div>
  <div className="bone-stage-list" role="group" aria-label={mn?'Үе шат':'Animation stages'}>{(['intact','line','separating','complete'] as const).map((value,index)=><button key={value} disabled={!ready} aria-pressed={stage===value} onClick={()=>{setPlaying(false);setProgress([0,.3,.7,1][index]);}}><span>0{index+1}</span>{stages[value]}</button>)}</div>
  <section className="fracture-notes"><h2>{mn?'Энэ үзүүлэнгийн тухай':'About this demonstration'}</h2><p>{mn?'Сонгосон ясны бодит торон загварт зүсэлт хийж, хэсгүүдийг хөдөлгөнө. Байрлал, зүсэлт, шилжилт нь сургалтын зориулалттай.':'This animation cuts the selected atlas mesh and moves its fragments. Cut positions and fragment movements are illustrative. A prompt selects the demonstration; it does not calculate which bones a fall or impact would break.'}</p><p className="fracture-limits">{mn?'Хавтгай, богино, жигд бус ясанд ч ижил геометрийн арга хэрэглэнэ. Энэ нь тухайн ясны эмнэлзүйн түгээмэл хугарлын загвар биш. Зүсэлтийн гадаргуу нээлттэй. Арьс, эд, хүч, эдгэрэлтийг тооцохгүй.':'The same geometry method applies to long, flat, short, and irregular bones. It does not represent every bone’s typical clinical fracture pattern. Cut surfaces are open mesh sections. Soft tissue, impact forces, injury probability, and healing are not simulated.'}</p><a href="https://orthoinfo.aaos.org/en/diseases--conditions/fractures-broken-bones/" target="_blank" rel="noreferrer">{mn?'AAOS · Ясны хугарлын тухай':'AAOS · Fracture types and overview'} ↗</a></section>
 </section>;
}
