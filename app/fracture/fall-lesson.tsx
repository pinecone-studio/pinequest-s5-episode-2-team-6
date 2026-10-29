import {useEffect,useRef,useState} from 'react';
import {Pause,Play,RotateCcw} from 'lucide-react';
import {useLang} from '../locale';
import FallScene from './fall-scene';
import FractureScene from './scene';
import {INITIAL_FRACTURE} from './model';
import {FALL_DURATION,FALL_PHASES,fallPose} from './fall-model';
import {ANATOMY_IDS,EDUCATION,PREDICTION_STOPS,nextPrediction,type AnatomyId,type PredictionId} from './education';

const copy={
 en:{title:'A backward fall on the pavement',lead:'Walk → foot slides forward → fall backward → right hand braces behind → right clavicle fracture.',play:'Play fall',pause:'Pause',replay:'Replay',reset:'Reset',view:'Reset view',timeline:'Fall timeline',speed:'Playback speed',phases:{walk:'Walking',slip:'Right heel slips',brace:'Right arm reaches behind',contact:'Right hand contacts ground',fracture:'Right clavicle fracture'},descriptions:{walk:'The figure walks along the tiled pavement toward the slippery patch.',slip:'The right heel slides forward on the slick patch. The feet move ahead of the pelvis and the upper body tips backward.',brace:'The right arm reaches behind the body to brace the backward fall; the other arm moves outward for balance.',contact:'The right palm meets the pavement behind the body. The gold dashed line illustrates the loading route through the arm toward the shoulder.',fracture:'A prescribed midshaft fracture appears in the right clavicle after hand contact. Inspect the synchronized close-up.'},closeup:'Right clavicle · synchronized close-up',legend:'Cyan: heel slide · gold: loading route · orange: fracture',gesture:'Drag to orbit · pinch or scroll to zoom',limits:'Authored educational scenario using the atlas skeleton. A fall onto an outstretched arm can cause a clavicle fracture, but hand contact does not necessarily cause one. This animation prescribes the outcome; it does not solve impact forces, tissue failure, or injury probability.',source:'Mechanism reference: AAOS',ready:'Press Play fall, or choose a stage to inspect it. The timeline also runs backward when you drag it.'},
 mn:{title:'Явган зам дээр арагш халтирч унах',lead:'Алхах → хөл урагш гулсах → арагш унах → баруун гараар ардаа тулах → баруун эгэм хугарах.',play:'Уналтыг тоглуулах',pause:'Түр зогсоох',replay:'Дахин тоглуулах',reset:'Шинээр эхлэх',view:'Харагдац сэргээх',timeline:'Уналтын явц',speed:'Тоглуулах хурд',phases:{walk:'Алхаж байна',slip:'Баруун өсгий халтирлаа',brace:'Баруун гараа сунгана',contact:'Баруун гар газарт тулна',fracture:'Баруун эгэм хугарна'},descriptions:{walk:'Дүрс явган замаар халтиргаатай хэсэг рүү алхана.',slip:'Баруун өсгий халтиргаатай хэсэг дээр урагш гулсана. Хөл аарцгаас урагшилж, биеийн дээд хэсэг арагш хазайна.',brace:'Арагш уналтаа тулахын тулд баруун гараа ардаа сунгаж, нөгөө гараа хажуу тийш хөдөлгөн тэнцвэрээ хадгалахыг оролдоно.',contact:'Баруун алга биеийн ард явган замд тулна. Алтан тасархай шугам нь гарнаас мөр рүү дамжих ачааллын замыг бүдүүвчлэн харуулна.',fracture:'Гараар тулсны дараа баруун эгэмний голд урьдчилан өгсөн хугарал үүснэ. Томруулсан дүрслэлээс ажигла.'},closeup:'Баруун эгэм · зэрэгцсэн томруулалт',legend:'Цэнхэр: өсгийн гулсалт · алтан: ачааллын зам · улбар шар: хугарал',gesture:'Чирж эргүүлнэ · хоёр хуруугаар ойртуулна',limits:'Атласын араг ясыг ашигласан сургалтын хөдөлгөөнт жишээ. Сунгасан гараар унахад эгэм хугарч болох ч гараар тулсан бүрд хугарахгүй. Үр дүнг урьдчилан өгсөн; цохилтын хүч, эдийн эвдрэл, гэмтэх магадлалыг тооцоогүй.',source:'Механизмын эх сурвалж: AAOS',ready:'Уналтыг тоглуулах товчийг дар эсвэл үе шатыг сонгож ажигла. Гулсуурыг буцааж хөдөлгөн өмнөх үеийг харж болно.'},
};

export default function FallLesson(){
 const {lang}=useLang(),t=copy[lang];
 const ed=EDUCATION[lang];
 const [progress,setProgress]=useState(0),[playing,setPlaying]=useState(false),[speed,setSpeed]=useState(.5),[reset,setReset]=useState(0);
 const [guided,setGuided]=useState(true),[overlays,setOverlays]=useState(true),[focused,setFocused]=useState<AnatomyId|null>('clavicle');
 const [activePrediction,setActivePrediction]=useState<PredictionId|null>(null),[answers,setAnswers]=useState<Partial<Record<PredictionId,number>>>({});
 const completed=useRef<PredictionId[]>([]),predictionRef=useRef<HTMLElement>(null);
 const current=useRef(progress);current.current=progress;
 const pose=fallPose(progress);
 const question=activePrediction?ed.predictions[activePrediction]:null;
 const answer=activePrediction?answers[activePrediction]:undefined;
 const lesson=ed.stages[pose.phase];
 useEffect(()=>{if(activePrediction){predictionRef.current?.focus({preventScroll:true});predictionRef.current?.scrollIntoView({block:'nearest',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}},[activePrediction]);
 useEffect(()=>{
  if(!playing)return;
  let frame=0,last:number|undefined;
  const tick=(time:number)=>{
   const dt=last===undefined?0:Math.min(.05,(time-last)/1000);last=time;
   const value=Math.min(1,current.current+dt*speed/FALL_DURATION),stop=guided?nextPrediction(current.current,value,completed.current):undefined;
   if(stop){current.current=stop.at;setProgress(stop.at);setPlaying(false);setActivePrediction(stop.id);return;}
   current.current=value;setProgress(value);if(value<1)frame=requestAnimationFrame(tick);else setPlaying(false);
  };
  frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);
 },[playing,speed,guided]);
 const seek=(value:number)=>{
  if(activePrediction)return;setPlaying(false);
  const stop=guided?nextPrediction(current.current,value,completed.current):undefined;
  current.current=stop?.at??value;setProgress(current.current);if(stop)setActivePrediction(stop.id);
 };
 const restart=()=>{setPlaying(false);current.current=0;setProgress(0);completed.current=[];setAnswers({});setActivePrediction(null);setReset(n=>n+1);};
 const play=()=>{if(activePrediction)return;if(progress>=1){current.current=0;setProgress(0);completed.current=[];setAnswers({});}setPlaying(p=>!p);};
 const inspect=(id:AnatomyId)=>{setPlaying(false);setFocused(id);};
 return <section className="fall-lesson" aria-label={t.title}>
  <div className="fall-learning-tools">
   <label><input type="checkbox" checked={guided} onChange={e=>{setGuided(e.target.checked);if(!e.target.checked)setActivePrediction(null);}}/><span><strong>{ed.guided}</strong><small>{ed.guidedHint}</small></span></label>
   <label><input type="checkbox" checked={overlays} onChange={e=>setOverlays(e.target.checked)}/><span><strong>{ed.overlays}</strong><small>{ed.overlayHint}</small></span></label>
  </div>
  <div className="fall-layout">
   <section className="fall-viewer">
    <div className="fall-stage-label"><span>{String(FALL_PHASES.findIndex(p=>p.id===pose.phase)+1).padStart(2,'0')}</span><strong>{t.phases[pose.phase]}</strong></div>
    <FallScene progress={progress} reset={reset} label={t.title} overlays={overlays} focused={focused} lang={lang} onAnatomySelect={inspect}/>
    <div className="fall-scene-caption"><p>{t.legend}</p><span>{t.gesture}</span></div>
   </section>
   <aside className="fall-inspector">
    <h2>{t.closeup}</h2>
    <FractureScene settings={{...INITIAL_FRACTURE,side:'Right',progress:pose.fracture}} reset={reset} label={t.closeup}/>
    <div className="fall-explanation" aria-live="polite"><h3>{t.phases[pose.phase]}</h3><dl className="fall-stage-explanation"><dt>{ed.observe}</dt><dd>{lesson.observe}</dd><dt>{ed.anatomy}</dt><dd>{lesson.anatomy}</dd><dt>{ed.takeaway}</dt><dd>{lesson.takeaway}</dd></dl></div>
   </aside>
  </div>
  {question&&activePrediction&&<section className="fall-prediction" ref={predictionRef} tabIndex={-1} aria-labelledby="fall-prediction-title">
   <p className="fall-prediction-kicker">{ed.predict} · {PREDICTION_STOPS.findIndex(p=>p.id===activePrediction)+1} / {PREDICTION_STOPS.length}</p>
   <h2 id="fall-prediction-title">{question.question}</h2>
   <fieldset><legend className="sr-only">{ed.choose}</legend>{question.options.map((option,index)=><label key={index} className={answer===undefined?'':index===question.correct?'is-correct':index===answer?'is-chosen':''}><input type="radio" name={`prediction-${activePrediction}`} checked={answer===index} disabled={answer!==undefined} onChange={()=>setAnswers(s=>({...s,[activePrediction]:index}))}/><span>{option}</span></label>)}</fieldset>
   {answer===undefined?<p className="fall-prediction-hint">{ed.choose}</p>:<div className="fall-prediction-feedback" role="status"><strong>{answer===question.correct?ed.correct:ed.review}</strong><p><b>{ed.answerLabel}:</b> {question.options[question.correct]}</p><p>{question.explanation}</p><button onClick={()=>{completed.current=[...completed.current,activePrediction];setActivePrediction(null);setPlaying(true);}}>{ed.continue} →</button></div>}
  </section>}
  {overlays&&<section className="fall-anatomy-panel" aria-label={ed.inspect}>
   <h2>{ed.inspect}</h2><div className="fall-anatomy-chips">{ANATOMY_IDS.map(id=><button key={id} aria-pressed={focused===id} onClick={()=>inspect(id)}>{ed.structures[id].name}</button>)}</div>
   {focused?<div className="fall-anatomy-note" aria-live="polite"><h3>{ed.structures[focused].name} <span>{ed.structures[focused].latin}</span></h3><p>{ed.structures[focused].detail}</p></div>:<p>{ed.inspectionHint}</p>}
  </section>}
  <div className="fall-transport">
   <div className="fall-playback"><button className="fall-primary" disabled={!!activePrediction} onClick={play}>{playing?<Pause size={16}/>:<Play size={16}/>} {playing?t.pause:progress>=1?t.replay:t.play}</button><button onClick={restart}><RotateCcw size={15}/>{t.reset}</button><button onClick={()=>setReset(n=>n+1)}>{t.view}</button><label>{t.speed}<select value={speed} onChange={e=>setSpeed(Number(e.target.value))}><option value={.25}>0.25×</option><option value={.5}>0.5×</option><option value={1}>1×</option></select></label><output>{(progress*FALL_DURATION).toFixed(1)} / {FALL_DURATION.toFixed(1)} s</output></div>
   <label className="fall-timeline"><span>{t.timeline}</span><input type="range" min="0" max="1" step=".001" value={progress} disabled={!!activePrediction} onChange={e=>seek(Number(e.target.value))}/></label>
   <div className="fall-chapters">{FALL_PHASES.map((phase,i)=><button key={phase.id} disabled={!!activePrediction} aria-current={pose.phase===phase.id?'step':undefined} onClick={()=>seek(phase.id==='fracture'?.94:phase.at)}><span>0{i+1}</span>{t.phases[phase.id]}</button>)}</div>
   <p className="fall-ready">{t.ready} {guided&&ed.restart}</p>
  </div>
  <p className="fall-disclaimer">{t.limits} <a href="https://orthoinfo.aaos.org/en/diseases--conditions/clavicle-fracture-broken-collarbone/" target="_blank" rel="noreferrer">{t.source} ↗</a></p>
 </section>;
}
