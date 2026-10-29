import {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {Bone,Pause,Play,RotateCcw} from 'lucide-react';
import SiteNav from '../site-nav';
import {useLang} from '../locale';
import FractureScene from './scene';
import FallLesson from './fall-lesson';
import SimulationPrompt from './simulation-prompt';
import BoneLab from './bone-lab';
import type {Atlas} from '../anatomy';
import type {BoneRequest} from './bone-requests';
import type {SimulationRequest} from './simulation-request';
import {INITIAL_FRACTURE,type FractureSettings} from './model';
import './fracture.css';

const copy={
 en:{title:'Clavicle fracture lab',lead:'Explore a simplified midshaft fracture using the atlas’s real clavicle geometry.',side:'Clavicle side',left:'Left',right:'Right',intact:'Intact',aligned:'Nondisplaced example',displaced:'Displaced example',play:'Play',pause:'Pause',reset:'Reset',camera:'Reset view',progress:'Animation progress',displacement:'Vertical fragment separation',shortening:'Medial shift of lateral fragment',angle:'Relative fragment angulation',medial:'Medial fragment · toward sternum',lateral:'Lateral fragment · toward shoulder',gesture:'Drag to rotate · scroll or pinch to zoom',notes:'What this shows',explanation:'The fracture plane is placed at the shaft midpoint for this lesson. Orange contours mark the cut edges. Change the controls to compare aligned and displaced fragments.',pattern:'In this prescribed example, the medial fragment moves upward and the lateral fragment moves downward and toward the midline. Real fracture patterns vary.',limits:'Educational geometry demonstration. Positions are chosen by the controls, not calculated from impact force or tissue mechanics. Cut faces are open mesh sections. This does not predict injury severity, healing, or treatment.',source:'Read the AAOS fracture overview',back:'Open the full anatomy atlas',ready:'Adjust controls or play the example. No account needed.'},
 mn:{title:'Эгэмний хугарлын лаб',lead:'Атласын бодит эгэмний загвараар гол хэсгийн хугарлын хялбаршуулсан жишээг судал.',side:'Эгэмний тал',left:'Зүүн',right:'Баруун',intact:'Бүтэн',aligned:'Зөрөөгүй жишээ',displaced:'Зөрөөтэй жишээ',play:'Тоглуулах',pause:'Түр зогсоох',reset:'Шинээр эхлэх',camera:'Харагдац сэргээх',progress:'Хөдөлгөөний явц',displacement:'Хэсгүүдийн босоо зөрөө',shortening:'Гадна хэсгийн дотогш шилжилт',angle:'Хэсгүүдийн харьцангуй өнцөг',medial:'Дотор хэсэг · өвчүү тал',lateral:'Гадна хэсэг · мөр тал',gesture:'Чирж эргүүлнэ · хоёр хуруугаар ойртуулна',notes:'Юуг харуулж байна вэ?',explanation:'Энэ хичээлд хугарлын хавтгайг эгэмний голд байрлуулсан. Улбар шар хүрээ нь зүсэлтийн ирмэгийг харуулна. Тохиргоог өөрчилж зөрөөгүй болон зөрөөтэй хэсгүүдийг харьцуул.',pattern:'Энэ жишээнд дотор хэсэг дээш, гадна хэсэг доош болон биеийн гол руу шилжинэ. Бодит хугарлын хэлбэр өөр өөр байдаг.',limits:'Сургалтын зориулалттай геометрийн үзүүлэн. Байрлал нь тохиргоогоор өгөгдөнө; цохилтын хүч, эдийн механикаар тооцоогүй. Зүссэн гадаргуу нь нээлттэй торон загвар. Гэмтлийн хүндийн зэрэг, эдгэрэлт, эмчилгээг таамаглахгүй.',source:'AAOS-ийн хугарлын тайлбар',back:'Бүтэн анатомийн атлас нээх',ready:'Тохиргоог өөрчил эсвэл жишээг тоглуул. Бүртгэл шаардлагагүй.'},
};

export default function FracturePage(){
 const {lang}=useLang(),t=copy[lang];
 const [requestId,setRequestId]=useState(0);
 const [mode,setMode]=useState<'fall'|'bone'|'catalogue'>('catalogue');
 const [atlas,setAtlas]=useState<Atlas|null>(null),[catalogueError,setCatalogueError]=useState(false),[catalogueAttempt,setCatalogueAttempt]=useState(0);
 const [boneRequest,setBoneRequest]=useState<BoneRequest|null>(null);
 useEffect(()=>{
  const abort=new AbortController();setCatalogueError(false);
  fetch('/models/atlas.json',{signal:abort.signal}).then(response=>{if(!response.ok)throw new Error('Catalogue unavailable');return response.json() as Promise<Atlas>;}).then(data=>{if(abort.signal.aborted)return;setAtlas(data);setBoneRequest({boneIds:data.parts.filter(part=>part.system==='skeletal').sort((a,b)=>a.name.localeCompare(b.name)).map(part=>part.id),pattern:'transverse',aligned:false,location:.5});}).catch(()=>{if(!abort.signal.aborted)setCatalogueError(true);});
  return()=>abort.abort();
 },[catalogueAttempt]);
 const [settings,setSettings]=useState<FractureSettings>(INITIAL_FRACTURE),[playing,setPlaying]=useState(false),[reset,setReset]=useState(0);
 useEffect(()=>{
  if(!playing)return;
  let frame=0,start:number|undefined;const initial=settings.progress>=1?0:settings.progress;
  const tick=(time:number)=>{start??=time;const progress=Math.min(1,initial+(time-start)/2400);setSettings(s=>({...s,fractured:true,progress}));if(progress<1)frame=requestAnimationFrame(tick);else setPlaying(false);};
  frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);
 },[playing,requestId]);
 const runSimulation=(request:SimulationRequest)=>{
  setPlaying(false);setMode(request.mode);setRequestId(n=>n+1);
  setSettings({...INITIAL_FRACTURE,side:request.side,...(request.aligned?{displacement:0,shortening:0,angle:0}:{})});
  if(request.mode==='bone')setPlaying(true);
 };
 const preset=(mode:'intact'|'aligned'|'displaced')=>{setPlaying(false);setSettings(s=>({...INITIAL_FRACTURE,side:s.side,fractured:mode!=='intact',progress:mode==='intact'?0:1,...(mode==='aligned'?{displacement:0,shortening:0,angle:0}:{})}));};
 const slider=(key:'progress'|'displacement'|'shortening'|'angle',title:string,max:number,unit:string)=><label className="fracture-slider"><span>{title}<output>{Math.round(settings[key]*(key==='progress'?100:1))}{unit}</output></span><input type="range" min="0" max={max} step={key==='progress'?.01:1} value={settings[key]} onChange={e=>{setPlaying(false);setSettings(s=>({...s,fractured:true,[key]:Number(e.target.value)}));}}/></label>;
 return <main className="fracture-page">
  <SiteNav tone="light"/>
  <header className="fracture-heading"><p><Bone size={16}/> ANATOMN · {lang==='mn'?'ХУГАРЛЫН ЛАБ':'FRACTURE LAB'}</p><h1>{lang==='mn'?'Ясны хугарлын лаб':'Fracture lab'}</h1><p>{lang==='mn'?'Бүх араг ясны загвар дээр хугарлын хөдөлгөөнийг судлаарай.':'Explore fracture animations across the entire atlas skeleton. Name a bone, watch the break, and understand each stage.'}</p></header>
  <SimulationPrompt atlas={atlas} onRun={runSimulation} onBones={request=>{setPlaying(false);setBoneRequest(request);setMode('catalogue');setRequestId(value=>value+1);}}/>
  {catalogueError&&<p role="alert">{lang==='mn'?'Ясны жагсаалтыг ачаалж чадсангүй.':'Could not load the bone catalogue.'} <button onClick={()=>setCatalogueAttempt(value=>value+1)}>Retry / Дахин оролдох</button></p>}
  <div className="fracture-modes" role="group" aria-label={lang==='mn'?'Үзүүлэн сонгох':'Choose demonstration'}><button aria-pressed={mode==='catalogue'} onClick={()=>{setPlaying(false);setMode('catalogue');}}>{lang==='mn'?'Бүх ясны үзүүлэн':'All bones explorer'}</button><button aria-pressed={mode==='fall'} onClick={()=>{setPlaying(false);setMode('fall');}}>{lang==='mn'?'Уналтын жишээ':'Fall scenario'}</button><button aria-pressed={mode==='bone'} onClick={()=>setMode('bone')}>{lang==='mn'?'Эгэмний дэлгэрэнгүй':'Clavicle detail'}</button></div>
  {mode==='catalogue'?(atlas&&boneRequest?<BoneLab key={requestId} atlas={atlas} request={boneRequest}/>:!catalogueError&&<p role="status">Loading bone catalogue / Ясны жагсаалтыг ачаалж байна…</p>):mode==='fall'?<FallLesson key={requestId} autoPlay={requestId>0}/>:<>
  <div className="fracture-layout">
   <section className="fracture-viewer">
    <FractureScene settings={settings} reset={reset} label={`${t.title} — ${settings.side==='Left'?t.left:t.right}`}/>
    <div className="fracture-legend"><span><i/>{t.medial}</span><span><i/>{t.lateral}</span></div>
    <p className="fracture-gesture">{t.gesture}</p>
   </section>
   <section className="fracture-controls" aria-label={t.title}>
    <div className="fracture-side" role="group" aria-label={t.side}>{(['Left','Right'] as const).map(side=><button key={side} aria-pressed={settings.side===side} onClick={()=>{setPlaying(false);setSettings(s=>({...s,side}));}}>{side==='Left'?t.left:t.right}</button>)}</div>
    <div className="fracture-presets"><button onClick={()=>preset('intact')}>{t.intact}</button><button onClick={()=>preset('aligned')}>{t.aligned}</button><button onClick={()=>preset('displaced')}>{t.displaced}</button></div>
    {slider('progress',t.progress,1,'%')}
    {slider('displacement',t.displacement,20,' mm')}
    {slider('shortening',t.shortening,20,' mm')}
    {slider('angle',t.angle,25,'°')}
    <div className="fracture-playback"><button className="fracture-primary" onClick={()=>setPlaying(v=>!v)}>{playing?<Pause size={16}/>:<Play size={16}/>} {playing?t.pause:t.play}</button><button onClick={()=>{setPlaying(false);setSettings(s=>({...INITIAL_FRACTURE,side:s.side}));setReset(n=>n+1);}}><RotateCcw size={15}/>{t.reset}</button><button onClick={()=>setReset(n=>n+1)}>{t.camera}</button></div>
    <p className="simulation-bone-status" role="status">{lang==='mn'?`${settings.side==='Right'?'Баруун':'Зүүн'} эгэм · ${settings.fractured&&settings.progress>0?'Гол хэсгийн хугарал':'Бүтэн'}`:`${settings.side} clavicle · ${settings.fractured&&settings.progress>0?'Midshaft fracture':'Intact'}`}</p>
    <p className="fracture-ready">{t.ready}</p>
   </section>
  </div>
  <section className="fracture-notes"><h2>{t.notes}</h2><p>{t.explanation}</p><p>{t.pattern}</p><p className="fracture-limits">{t.limits}</p><a href="https://orthoinfo.aaos.org/en/diseases--conditions/clavicle-fracture-broken-collarbone/" target="_blank" rel="noreferrer">{t.source} ↗</a><Link to="/atlas?focus=clavicle">{t.back} →</Link></section>
  </>}
 </main>;
}
