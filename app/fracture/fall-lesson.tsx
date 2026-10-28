import {useEffect,useRef,useState} from 'react';
import {Pause,Play,RotateCcw} from 'lucide-react';
import {useLang} from '../locale';
import FallScene from './fall-scene';
import FractureScene from './scene';
import {INITIAL_FRACTURE} from './model';
import {FALL_DURATION,FALL_PHASES,fallPose} from './fall-model';

const copy={
 en:{title:'A backward fall on the pavement',lead:'Walk → foot slides forward → fall backward → right hand braces behind → right clavicle fracture.',play:'Play fall',pause:'Pause',replay:'Replay',reset:'Reset',view:'Reset view',timeline:'Fall timeline',speed:'Playback speed',phases:{walk:'Walking',slip:'Right heel slips',brace:'Right arm reaches behind',contact:'Right hand contacts ground',fracture:'Right clavicle fracture'},descriptions:{walk:'The figure walks along the tiled pavement toward the slippery patch.',slip:'The right heel slides forward on the slick patch. The feet move ahead of the pelvis and the upper body tips backward.',brace:'The right arm reaches behind the body to brace the backward fall; the other arm moves outward for balance.',contact:'The right palm meets the pavement behind the body. The gold dashed line illustrates the loading route through the arm toward the shoulder.',fracture:'A prescribed midshaft fracture appears in the right clavicle after hand contact. Inspect the synchronized close-up.'},closeup:'Right clavicle · synchronized close-up',legend:'Cyan: heel slide · gold: loading route · orange: fracture',gesture:'Drag to orbit · pinch or scroll to zoom',limits:'Authored educational scenario using the atlas skeleton. A fall onto an outstretched arm can cause a clavicle fracture, but hand contact does not necessarily cause one. This animation prescribes the outcome; it does not solve impact forces, tissue failure, or injury probability.',source:'Mechanism reference: AAOS',ready:'Press Play fall, or choose a stage to inspect it. The timeline also runs backward when you drag it.'},
 mn:{title:'Явган зам дээр арагш халтирч унах',lead:'Алхах → хөл урагш гулсах → арагш унах → баруун гараар ардаа тулах → баруун эгэм хугарах.',play:'Уналтыг тоглуулах',pause:'Түр зогсоох',replay:'Дахин тоглуулах',reset:'Шинээр эхлэх',view:'Харагдац сэргээх',timeline:'Уналтын явц',speed:'Тоглуулах хурд',phases:{walk:'Алхаж байна',slip:'Баруун өсгий халтирлаа',brace:'Баруун гараа сунгана',contact:'Баруун гар газарт тулна',fracture:'Баруун эгэм хугарна'},descriptions:{walk:'Дүрс явган замаар халтиргаатай хэсэг рүү алхана.',slip:'Баруун өсгий халтиргаатай хэсэг дээр урагш гулсана. Хөл аарцгаас урагшилж, биеийн дээд хэсэг арагш хазайна.',brace:'Арагш уналтаа тулахын тулд баруун гараа ардаа сунгаж, нөгөө гараа хажуу тийш хөдөлгөн тэнцвэрээ хадгалахыг оролдоно.',contact:'Баруун алга биеийн ард явган замд тулна. Алтан тасархай шугам нь гарнаас мөр рүү дамжих ачааллын замыг бүдүүвчлэн харуулна.',fracture:'Гараар тулсны дараа баруун эгэмний голд урьдчилан өгсөн хугарал үүснэ. Томруулсан дүрслэлээс ажигла.'},closeup:'Баруун эгэм · зэрэгцсэн томруулалт',legend:'Цэнхэр: өсгийн гулсалт · алтан: ачааллын зам · улбар шар: хугарал',gesture:'Чирж эргүүлнэ · хоёр хуруугаар ойртуулна',limits:'Атласын араг ясыг ашигласан сургалтын хөдөлгөөнт жишээ. Сунгасан гараар унахад эгэм хугарч болох ч гараар тулсан бүрд хугарахгүй. Үр дүнг урьдчилан өгсөн; цохилтын хүч, эдийн эвдрэл, гэмтэх магадлалыг тооцоогүй.',source:'Механизмын эх сурвалж: AAOS',ready:'Уналтыг тоглуулах товчийг дар эсвэл үе шатыг сонгож ажигла. Гулсуурыг буцааж хөдөлгөн өмнөх үеийг харж болно.'},
};

export default function FallLesson(){
 const {lang}=useLang(),t=copy[lang];
 const [progress,setProgress]=useState(0),[playing,setPlaying]=useState(false),[speed,setSpeed]=useState(.5),[reset,setReset]=useState(0);
 const current=useRef(progress);current.current=progress;
 const pose=fallPose(progress);
 useEffect(()=>{
  if(!playing)return;
  let frame=0,last:number|undefined;
  const tick=(time:number)=>{const dt=last===undefined?0:Math.min(.05,(time-last)/1000);last=time;const value=Math.min(1,current.current+dt*speed/FALL_DURATION);current.current=value;setProgress(value);if(value<1)frame=requestAnimationFrame(tick);else setPlaying(false);};
  frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);
 },[playing,speed]);
 const seek=(value:number)=>{setPlaying(false);setProgress(value);};
 const play=()=>{if(progress>=1){current.current=0;setProgress(0);}setPlaying(p=>!p);};
 return <section className="fall-lesson" aria-label={t.title}>
  <div className="fall-layout">
   <section className="fall-viewer">
    <div className="fall-stage-label"><span>{String(FALL_PHASES.findIndex(p=>p.id===pose.phase)+1).padStart(2,'0')}</span><strong>{t.phases[pose.phase]}</strong></div>
    <FallScene progress={progress} reset={reset} label={t.title}/>
    <div className="fall-scene-caption"><p>{t.legend}</p><span>{t.gesture}</span></div>
   </section>
   <aside className="fall-inspector">
    <h2>{t.closeup}</h2>
    <FractureScene settings={{...INITIAL_FRACTURE,side:'Right',progress:pose.fracture}} reset={reset} label={t.closeup}/>
    <div className="fall-explanation" aria-live="polite"><h3>{t.phases[pose.phase]}</h3><p>{t.descriptions[pose.phase]}</p></div>
   </aside>
  </div>
  <div className="fall-transport">
   <div className="fall-playback"><button className="fall-primary" onClick={play}>{playing?<Pause size={16}/>:<Play size={16}/>} {playing?t.pause:progress>=1?t.replay:t.play}</button><button onClick={()=>{seek(0);setReset(n=>n+1);}}><RotateCcw size={15}/>{t.reset}</button><button onClick={()=>setReset(n=>n+1)}>{t.view}</button><label>{t.speed}<select value={speed} onChange={e=>setSpeed(Number(e.target.value))}><option value={.25}>0.25×</option><option value={.5}>0.5×</option><option value={1}>1×</option></select></label><output>{(progress*FALL_DURATION).toFixed(1)} / {FALL_DURATION.toFixed(1)} s</output></div>
   <label className="fall-timeline"><span>{t.timeline}</span><input type="range" min="0" max="1" step=".001" value={progress} onChange={e=>seek(Number(e.target.value))}/></label>
   <div className="fall-chapters">{FALL_PHASES.map((phase,i)=><button key={phase.id} aria-current={pose.phase===phase.id?'step':undefined} onClick={()=>seek(phase.id==='fracture'?.94:phase.at)}><span>0{i+1}</span>{t.phases[phase.id]}</button>)}</div>
   <p className="fall-ready">{t.ready}</p>
  </div>
  <p className="fall-disclaimer">{t.limits} <a href="https://orthoinfo.aaos.org/en/diseases--conditions/clavicle-fracture-broken-collarbone/" target="_blank" rel="noreferrer">{t.source} ↗</a></p>
 </section>;
}
