import {useEffect,useRef,useState} from 'react';
import {Button} from '@/components/ui/button';
import {RotateCcw,X} from 'lucide-react';
import type {Atlas} from './anatomy';
import {useLang} from './locale';
import {renalColor,renalFlow,renalTerritory,renalLessonPreview,type RenalPreview} from './plaque-model';
import './plaque.css';
// The lab has its own route (/plaque) in the navigation bar; the atlas opens this panel while that route is
// active and closing it goes back to /atlas.
export default function PlaquePanel({atlas,open,onPreview,onClose}:{atlas:Atlas|null;open:boolean;onPreview:(preview:RenalPreview|null)=>void;onClose:()=>void}){
 const {t:{plaque:t}}=useLang();
 const [side,setSide]=useState<'Left'|'Right'>('Left'),[chosenNarrowing,setNarrowing]=useState(0),[length,setLength]=useState(20),[comparing,setComparing]=useState(false);
 const narrowing=comparing?0:chosenNarrowing;
 const [supplyStage,setSupplyStage]=useState(2);
 const {flow,arterialLoss}=renalFlow(narrowing,length),percent=Math.round(flow*100),gap=40*(1-narrowing/100),a=160-length,b=160+length;
 const territory=atlas?renalTerritory(atlas,side):[],sideName=t.sides[side];
 const close=useRef<HTMLButtonElement>(null),closeLab=useRef(onClose);
 // The atlas passes a fresh callback each render; reading it from a ref keeps the effects below to open/close.
 closeLab.current=onClose;
 useEffect(()=>{if(!open||!atlas)return;const preview=renalLessonPreview(atlas,side,flow,supplyStage);onPreview(preview.ids.length?preview:null);},[open,atlas,side,flow,supplyStage,onPreview]);
 useEffect(()=>{if(!open)return;close.current?.focus();const escape=(e:KeyboardEvent)=>{if(e.key==='Escape')closeLab.current();};window.addEventListener('keydown',escape);return()=>{window.removeEventListener('keydown',escape);onPreview(null);};},[open,onPreview]);
 const lumen=`M20 45 H${a-20} Q${a} 45 ${a} ${85-gap} H${b} Q${b} 45 ${b+20} 45 H300 V125 H${b+20} Q${b} 125 ${b} ${85+gap} H${a} Q${a} 125 ${a-20} 125 H20 Z`;
 const branches='M5 50 H40 M40 50 L65 20 H85 M40 50 H85 M40 50 L65 80 H85';
 if(!open)return null;
 return <aside id="plaque-lab" className="rom-panel glass plaque-panel" aria-labelledby="plaque-title">
   <header className="rom-header"><div className="rom-title-block"><p className="rom-kicker">{t.kicker}</p><h2 id="plaque-title" className="rom-title">{t.title}</h2><p className="rom-subtitle">{t.subtitle}</p></div><Button ref={close} variant="ghost" className="icon-button rom-close" aria-label={t.close} onClick={onClose}><X size={18}/></Button></header>
   <div className="rom-status"><span className="rom-status-dot"/>{t.status}</div>
   <div className="rom-side-toggle" role="group" aria-label={t.tree}>{(['Left','Right'] as const).map(value=><Button key={value} variant="ghost" aria-pressed={side===value} onClick={()=>setSide(value)}>{t.artery(t.sides[value])}</Button>)}</div>
   <section className="rom-muscles-card"><h3>{t.supplyTitle}</h3>
    <div className="plaque-supply-steps" role="group" aria-label={t.supplyTitle}>{t.supplyStages.map((label,index)=><Button key={label} variant="ghost" aria-pressed={supplyStage===index} onClick={()=>setSupplyStage(index)}>{index+1} · {label}</Button>)}</div>
    <p role="status">{t.supplyLessons[supplyStage]}</p>
    <svg viewBox="0 0 320 140" role="img" aria-label={t.supplyLabel(sideName,percent)}>
     <path d="M262 20 C310 0 316 115 267 112 C237 112 230 91 248 78 C264 68 264 58 246 48 C233 37 244 23 262 20Z" fill="#b98991" stroke="#e7c6c9" strokeWidth="2"/>
     <path className="plaque-supply-stream" d="M16 65 H85 M85 65 L125 30 H246 M85 65 H253 M85 65 L125 100 H246" fill="none" stroke={renalColor(flow)} strokeWidth="7" strokeDasharray="9 5" style={{animationDuration:`${2/Math.max(flow,.02)}s`,animationPlayState:flow===0?'paused':'running',opacity:flow===0?.25:1}}/>
     <rect x="263" y="49" width="32" height="10" rx="3" fill="#26364c"/><rect x="263" y="49" width={32*flow} height="10" rx="3" fill={renalColor(flow)}/>
     <text x="10" y="135">{t.supplyStages[0]}</text><text x="110" y="135">{t.supplyStages[1]}</text><text x="254" y="135">{t.supplyStages[2]}</text>
    </svg><p>{t.supplyLabel(sideName,percent)}</p><p>{t.supplyNote}</p>
   </section>
   <section className="rom-muscles-card"><h3>{t.cutaway}</h3>
    <div className="plaque-presets" role="group" aria-label={t.presets}>{[0,25,50,75,100].map(value=><Button key={value} variant="ghost" aria-pressed={narrowing===value} aria-label={`${t.narrowing}: ${value}%`} onClick={()=>{setComparing(false);setNarrowing(value);}}>{value}%</Button>)}</div>
    <Button variant="outline" className="plaque-compare" aria-pressed={comparing} disabled={chosenNarrowing===0} onClick={()=>setComparing(value=>!value)}>{comparing?t.restoreNarrowing(chosenNarrowing):t.compareHealthy}</Button>
    <p role="status">{comparing?t.comparisonHint:t.presets}</p>
    <label htmlFor="plaque-narrowing">{t.narrowing} <output>{narrowing}%</output></label><input id="plaque-narrowing" type="range" min="0" max="100" value={narrowing} disabled={comparing} onChange={e=>setNarrowing(Number(e.target.value))}/>
    <label htmlFor="plaque-length">{t.segment} <output>{length} {t.mm}</output></label><input id="plaque-length" type="range" min="5" max="60" value={length} disabled={comparing} onChange={e=>setLength(Number(e.target.value))}/>
    <svg viewBox="0 0 320 160" role="img" aria-label={t.cutawayLabel(narrowing,length)}>
     <rect x="18" y="37" width="284" height="96" rx="12" fill="#a34a4a"/><rect x="20" y="45" width="280" height="80" fill="#e8bf62"/><path d={lumen} fill="#d86868"/>
     {flow>0&&Array.from({length:4},(_,i)=><circle key={`${i}-${flow}`} cy="85" r="3" fill="white"><animate attributeName="cx" from="25" to="295" dur={`${2/flow}s`} begin={`${-i*.5/flow}s`} repeatCount="indefinite"/></circle>)}
     <text x="20" y="153">{t.blood(sideName)}</text>
    </svg><p>{t.cutawayNote}</p>
   </section>
   <section className="rom-gauge-card"><h3>{t.circuit}</h3><div aria-live="polite"><span className="rom-gauge-label">{t.flow}</span><div className="rom-gauge-value">{percent}<small>%</small></div></div><div className="rom-range-track" aria-hidden="true"><div className="rom-range-fill" style={{width:`${percent}%`}}/></div><div className="rom-range-labels"><span>{t.noFlow}</span><span>{t.baseline}</span></div><div className="rom-metric-row"><div><span>{t.pressureLoss}</span><strong>{Math.round(arterialLoss*100)}%</strong></div><div><span>{t.narrowingShort}</span><strong>{narrowing}%</strong></div><div><span>{t.segmentShort}</span><strong>{length} {t.mm}</strong></div></div><p>{t.pressureNote}</p>
    <details><summary>{t.assumptions}</summary><p>{t.assumptionsText}</p></details>
   </section>
   <section className="rom-muscles-card"><h3>{t.vesselFlow}</h3><svg viewBox="0 0 320 130" role="img" aria-label={t.treeLabel(sideName,percent)}>
    <path d={branches} transform="translate(30 2)" fill="none" stroke={renalColor(flow)} strokeWidth="9" strokeLinecap="round"/><path d={branches} transform="translate(205 2)" fill="none" stroke={renalColor(1)} strokeWidth="9" strokeLinecap="round"/>
    <text x="10" y="120">{t.sideFlow(sideName,percent)}</text><text x="183" y="120">{t.baselineFlow}</text>
   </svg><p>{t.colorNote}</p></section>
   <p className="perfusion-legend"><span style={{background:renalColor(0)}}/>{t.legendNone} <span style={{background:renalColor(.5)}}/>50% <span style={{background:renalColor(1)}}/>{t.legendFull}</p>
   <p className="rom-muscles-idle" role="status">{territory.length?t.supplyLabel(sideName,percent):t.waiting}</p>
   <Button variant="outline" className="rom-secondary" onClick={()=>{setComparing(false);setNarrowing(0);setLength(20);}}><RotateCcw size={15}/>{t.reset}</Button>
   <p className="rom-disclaimer">{t.disclaimer} <a href="https://www.niddk.nih.gov/health-information/kidney-disease/renal-artery-stenosis" target="_blank" rel="noreferrer">{t.about}</a></p>
  </aside>;
}
