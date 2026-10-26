import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Sheet,SheetContent,SheetTitle,SheetDescription} from '@/components/ui/sheet';
import type {Atlas} from './anatomy';
import {renalFlow,renalTerritory} from './plaque-model';
import './plaque.css';
export default function PlaquePanel({atlas,onFocus}:{atlas:Atlas|null;onFocus:(ids:string[])=>void}){
 const [open,setOpen]=useState(false),[side,setSide]=useState<'Left'|'Right'>('Left'),[narrowing,setNarrowing]=useState(0),[length,setLength]=useState(20);
 const {flow,arterialLoss}=renalFlow(narrowing,length),percent=Math.round(flow*100),gap=40*(1-narrowing/100),a=160-length,b=160+length;
 const territory=atlas?renalTerritory(atlas,side):[];
 const lumen=`M20 45 H${a-20} Q${a} 45 ${a} ${85-gap} H${b} Q${b} 45 ${b+20} 45 H300 V125 H${b+20} Q${b} 125 ${b} ${85+gap} H${a} Q${a} 125 ${a-20} 125 H20 Z`;
 const kidney='M65 5 C10 -5 0 35 10 65 C20 100 70 105 80 78 C85 62 62 65 60 50 C58 35 85 35 80 18 C77 10 72 7 65 5Z';
 return <><Button className="plaque-trigger" variant="outline" onClick={()=>setOpen(true)}>Plaque lab</Button>
  <Sheet open={open} onOpenChange={setOpen}><SheetContent className="plaque-panel">
   <SheetTitle>Renal artery plaque lab</SheetTitle><SheetDescription>Three layers: vessel narrowing, flow, and downstream kidney perfusion. Educational schematic.</SheetDescription>
   <label>Supplied kidney <select value={side} onChange={e=>setSide(e.target.value as 'Left'|'Right')}><option>Left</option><option>Right</option></select></label>
   <section><h3>1 · Vessel cutaway</h3>
    <label htmlFor="plaque-narrowing">Diameter narrowing <output>{narrowing}%</output></label><input id="plaque-narrowing" type="range" min="0" max="100" value={narrowing} onChange={e=>setNarrowing(Number(e.target.value))}/>
    <label htmlFor="plaque-length">Narrowed segment <output>{length} mm</output></label><input id="plaque-length" type="range" min="5" max="60" value={length} onChange={e=>setLength(Number(e.target.value))}/>
    <svg viewBox="0 0 320 160" role="img" aria-label={`${narrowing}% diameter narrowing over ${length} millimeters; yellow plaque around a red lumen`}>
     <rect x="18" y="37" width="284" height="96" rx="12" fill="#a34a4a"/><rect x="20" y="45" width="280" height="80" fill="#e8bf62"/><path d={lumen} fill="#d86868"/>
     {flow>0&&Array.from({length:4},(_,i)=><circle key={`${i}-${flow}`} cy="85" r="3" fill="white"><animate attributeName="cx" from="25" to="295" dur={`${2/flow}s`} begin={`${-i*.5/flow}s`} repeatCount="indefinite"/></circle>)}
     <text x="20" y="153">Blood → {side.toLowerCase()} kidney · schematic, not to scale</text>
    </svg><p>Yellow: plaque · Red: lumen. Dots show relative flow timing, not local blood velocity.</p>
   </section>
   <section><h3>2 · Simplified flow circuit</h3><dl aria-live="polite"><dt>Flow / healthy baseline</dt><dd>{percent}%</dd><dt>Arterial pressure loss / applied gradient</dt><dd>{Math.round(arterialLoss*100)}%</dd></dl>
    <details><summary>Model assumptions</summary><p>Fixed pressure gradient, rigid tube, steady laminar flow. Resistance scales with length / radius⁴. Healthy artery resistance = 1; downstream bed = 9. No autoregulation, collaterals, pulsatility, or nonlinear stenosis losses. These illustrative values are not patient measurements.</p></details>
   </section>
   <section><h3>3 · Supplied organ response</h3><svg viewBox="0 0 320 130" role="img" aria-label={`${side} kidney relative perfusion ${percent}%; healthy reference 100%`}>
    <path d={kidney} transform="translate(30 2)" fill={`hsl(${10+flow*150} 40% 55%)`}/><path d={kidney} transform="translate(205 2)" fill="hsl(160 40% 55%)"/>
    <text x="10" y="120">{side} kidney: {percent}%</text><text x="183" y="120">Baseline: 100%</text>
   </svg><p>Color represents relative flow in the supplied kidney, not oxygen saturation or tissue damage. Nearby organs are not assumed to share its supply.</p></section>
   <Button disabled={territory.length!==2} onClick={()=>{onFocus(territory);setOpen(false);}}>Locate artery + kidney in 3D</Button>
   <Button variant="outline" onClick={()=>{setNarrowing(0);setLength(20);}}>Reset to healthy baseline</Button>
   <p>Not a clinical prediction. <a href="https://www.niddk.nih.gov/health-information/kidney-disease/renal-artery-stenosis" target="_blank" rel="noreferrer">About renal artery stenosis</a></p>
  </SheetContent></Sheet></>;
}
