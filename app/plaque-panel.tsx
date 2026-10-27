import {useEffect,useMemo,useRef,useState} from 'react';
import {X} from 'lucide-react';
import {Button} from '@/components/ui/button';
import type {Atlas} from './anatomy';
import {renalColor,renalFlow,renalTerritory,type RenalPreview} from './plaque-model';
import './plaque.css';
export default function PlaquePanel({atlas,picked,onPick,onPreview}:{atlas:Atlas|null;picked?:string;onPick:(id:string)=>void;onPreview:(preview:RenalPreview|null)=>void}){
 const [open,setOpen]=useState(false),[narrowing,setNarrowing]=useState(0),[length,setLength]=useState(20);
 const {flow,arterialLoss}=renalFlow(narrowing,length),percent=Math.round(flow*100),gap=40*(1-narrowing/100),a=160-length,b=160+length;
 const vessels=useMemo(()=>{if(!atlas)return[];const ids=new Set([...renalTerritory(atlas,'Left'),...renalTerritory(atlas,'Right')]);return atlas.parts.filter(p=>ids.has(p.id));},[atlas]);
 const vessel=vessels.find(p=>p.id===picked)??vessels.find(p=>p.name==='Left renal artery')??vessels[0];
 const trigger=useRef<HTMLButtonElement>(null),close=useRef<HTMLButtonElement>(null);
 useEffect(()=>{if(!open)return;onPreview(vessel?{ids:vessels.map(p=>p.id),vessel:vessel.id,flow}:null);},[open,vessels,vessel,flow,onPreview]);
 useEffect(()=>{if(!open)return;close.current?.focus();const escape=(e:KeyboardEvent)=>{if(e.key==='Escape')setOpen(false);};window.addEventListener('keydown',escape);return()=>{window.removeEventListener('keydown',escape);onPreview(null);trigger.current?.focus();};},[open,onPreview]);
 const lumen=`M20 45 H${a-20} Q${a} 45 ${a} ${85-gap} H${b} Q${b} 45 ${b+20} 45 H300 V125 H${b+20} Q${b} 125 ${b} ${85+gap} H${a} Q${a} 125 ${a-20} 125 H20 Z`;
 return <><Button ref={trigger} className="plaque-trigger" variant="outline" aria-expanded={open} aria-controls="plaque-lab" onClick={()=>setOpen(value=>!value)}>Plaque lab</Button>
  {open&&<aside id="plaque-lab" className="rom-panel glass plaque-panel" aria-labelledby="plaque-title">
   <header className="rom-header"><div className="rom-title-block"><p className="rom-kicker">Vascular lab</p><h2 id="plaque-title" className="rom-title">Renal artery plaque</h2><p className="rom-subtitle">Choose a vessel, adjust plaque, and compare flow.</p></div><Button ref={close} variant="ghost" className="icon-button rom-close" aria-label="Close plaque lab" onClick={()=>setOpen(false)}><X size={18}/></Button></header>
   <label>Vessel <select disabled={!vessels.length} value={vessel?.id??''} onChange={e=>onPick(e.target.value)}>{!vessels.length&&<option value="">Loading vessels…</option>}{vessels.map(p=><option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}</select></label><p>Or click a renal vessel in 3D. Controls apply to the selected mesh; its flow color updates live.</p>
   <section><h3>1 · Vessel cutaway</h3>
    <label htmlFor="plaque-narrowing">Diameter narrowing <output>{narrowing}%</output></label><input id="plaque-narrowing" type="range" min="0" max="100" value={narrowing} onChange={e=>setNarrowing(Number(e.target.value))}/>
    <label htmlFor="plaque-length">Narrowed segment <output>{length} mm</output></label><input id="plaque-length" type="range" min="5" max="60" value={length} onChange={e=>setLength(Number(e.target.value))}/>
    <svg viewBox="0 0 320 160" role="img" aria-label={`${narrowing}% diameter narrowing over ${length} millimeters; yellow plaque around a red lumen`}>
     <rect x="18" y="37" width="284" height="96" rx="12" fill="#a34a4a"/><rect x="20" y="45" width="280" height="80" fill="#e8bf62"/><path d={lumen} fill="#d86868"/>
     {flow>0&&Array.from({length:4},(_,i)=><circle key={`${i}-${flow}`} cy="85" r="3" fill="white"><animate attributeName="cx" from="25" to="295" dur={`${2/flow}s`} begin={`${-i*.5/flow}s`} repeatCount="indefinite"/></circle>)}
     <text x="20" y="153">Blood → narrowed segment · schematic, not to scale</text>
    </svg><p>Yellow: plaque · Red: lumen. Dots show relative flow timing, not local blood velocity.</p>
   </section>
   <section className="rom-gauge-card"><h3>2 · Selected vessel flow</h3><dl aria-live="polite"><dt>Flow / healthy baseline</dt><dd>{percent}%</dd><dt>Arterial pressure loss / applied gradient</dt><dd>{Math.round(arterialLoss*100)}%</dd><dt>Remaining lumen area</dt><dd>{Math.round((1-narrowing/100)**2*100)}%</dd></dl>
    <details><summary>Model assumptions</summary><p>Fixed pressure gradient, rigid tube, steady laminar flow. Resistance scales with length / radius⁴. Healthy artery resistance = 1; downstream bed = 9. No autoregulation, collaterals, pulsatility, or nonlinear stenosis losses. These illustrative values are not patient measurements.</p></details>
   </section>
   <section><h3>3 · Modeled effect</h3><p>{vessel?.name??'Select a vessel'}: {percent}% of its healthy-baseline flow remains in this illustrative circuit. The 3D tint identifies this vessel; the cutaway shows the narrowed opening. Atlas geometry is unchanged.</p><p>The same 100 mm reference circuit is used for every selection; dimensions are not measured from the mesh. Branch connectivity and supplied tissue territories are unavailable, so whole-kidney perfusion and damage are not predicted.</p></section>
   <p className="perfusion-legend"><span style={{background:renalColor(0)}}/>0% flow <span style={{background:renalColor(.5)}}/>50% <span style={{background:renalColor(1)}}/>100% baseline</p>
   <p role="status">{vessel?`Selected: ${vessel.name} (${vessel.id}). Relative flow: ${percent}%.`:'Waiting for renal vessel anatomy.'}</p>
   <Button variant="outline" onClick={()=>{setNarrowing(0);setLength(20);}}>Reset to healthy baseline</Button>
   <p>Not a clinical prediction. <a href="https://www.niddk.nih.gov/health-information/kidney-disease/renal-artery-stenosis" target="_blank" rel="noreferrer">About renal artery stenosis</a></p>
  </aside>}</>;
}
