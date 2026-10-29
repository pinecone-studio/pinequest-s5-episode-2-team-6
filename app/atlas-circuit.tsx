import {useEffect,useState} from 'react';
import {Button} from '@/components/ui/button';
import type {Part} from './anatomy';
import {useLang} from './locale';
import {atlasCircuitSite} from './atlas-circuit-model';
import {HEMO,renalHemodynamics} from './plaque-hemodynamics';

export default function AtlasCircuit({part,narrowing,onNarrowing}:{part:Part;narrowing:number;onNarrowing:(value:number)=>void}){
 const {lang,t:{plaque:t}}=useLang(),mn=lang==='mn',mapped=atlasCircuitSite(part),site=mapped?.site??'main';
 const [length,setLength]=useState(20),[inlet,setInlet]=useState(100),[diameter,setDiameter]=useState(site==='main'?5:3),[vesselLength,setVesselLength]=useState(site==='main'?100:60),[comparing,setComparing]=useState(false);
 useEffect(()=>setComparing(false),[narrowing]);
 const geometry={diameter,vesselLength},h=renalHemodynamics(comparing?0:narrowing,length,site,inlet,geometry),baseline=renalHemodynamics(0,length,site,inlet,geometry),percent=Math.round(h.selectedFlow/baseline.selectedFlow*100);
 const slider=(id:string,label:string,value:number,min:number,max:number,unit:string,change:(value:number)=>void,step=1)=><div className="atlas-circuit-control"><label htmlFor={id}>{label}<output>{value} {unit}</output></label><input id={id} type="range" min={min} max={max} step={step} value={value} onChange={event=>change(Number(event.target.value))}/></div>;
 return <section className="rom-gauge-card atlas-circuit" aria-label={mn?'Сонгосон артерийн хэлхээ':'Selected artery circuit'}>
  <h3>{mn?'Сонгосон артерийн хэлхээ':'Selected artery circuit'}</h3><p>{part.name}</p>
  <p>{mapped?(mn?'Атласын бөөрний нэршилтэй тохирсон жишээ.':'Scenario matched to the atlas renal identity.'):(mn?'Ерөнхий гурван гаралттай жишээ; энэ судасны бодит салаалал биш.':'Generic three-outlet teaching circuit; this is not this vessel’s measured branch network.')}</p>
  <div className="plaque-presets" role="group" aria-label={t.presets}>{[0,25,50,75,100].map(value=><Button key={value} variant="ghost" aria-pressed={!comparing&&narrowing===value} onClick={()=>{setComparing(false);onNarrowing(value);}}>{value}%</Button>)}</div>
  <Button variant="outline" aria-pressed={comparing} onClick={()=>setComparing(value=>!value)}>{comparing?t.restoreNarrowing(narrowing):t.compareHealthy}</Button>
  <p role="status">{comparing?(mn?'Зөвхөн хэлхээний эрүүл суурийг харьцуулж байна; байрлуулсан товруу хадгалагдана.':'Comparing the circuit’s healthy baseline; the placed plaque is preserved.'):t.supplyLabel(part.name,percent)}</p>
  {slider('circuit-diameter',mn?'Таамагласан судасны диаметр':'Assumed vessel diameter',diameter,.5,30,'mm',setDiameter,.5)}
  {slider('circuit-vessel-length',mn?'Таамагласан судасны урт':'Assumed vessel length',vesselLength,5,200,'mm',value=>{setVesselLength(value);setLength(current=>Math.min(current,value));})}
  {slider('circuit-lesion-length',t.segment,length,5,Math.min(60,vesselLength),'mm',setLength)}
  {slider('circuit-inlet',t.inletPressure,inlet,60,180,'mmHg',setInlet)}
  <div className="rom-metric-row plaque-hemo-metrics">{[`${h.totalFlow.toFixed(1)} mL/min`,`${h.selectedFlow.toFixed(1)} mL/min`,h.velocity===null?t.noLumen:`${h.velocity.toFixed(2)} m/s`,`${h.pressureDrop.toFixed(2)} mmHg`].map((value,index)=><div key={index}><span>{t.hemoLabels[index]}</span><strong>{value}</strong></div>)}</div>
  <p>{t.pressurePath(h.upstream,h.downstream)}</p><p>{t.branchReadout}</p>
  <ul>{h.branchFlows.map((q,index)=><li key={index}>{mapped?t.locations[index+1]:`${mn?'Гаралт':'Outlet'} ${index+1}`}: {q.toFixed(1)} mL/min · {h.distalPressures[index].toFixed(1)} mmHg</li>)}</ul>
  <details><summary>{t.assumptions}</summary><p>{mn?'Сонгосон судасны хэмжээ нь дээрх хэрэглэгчийн таамаг. Бусад судасны диаметр/урт 5/100 эсвэл 3/60 мм; төгсгөлийн эсэргүүцэл бүр 0.5 мм.муб/(мЛ/мин). Венийн хил':'The selected vessel uses the assumed dimensions above. Other conduit diameter/length defaults are 5/100 or 3/60 mm; each terminal bed is 0.5 mmHg/(mL/min). Venous boundary'}: {HEMO.outlet} mmHg. μ={HEMO.viscosity} Pa·s; ρ={HEMO.density} kg/m³.</p><p>{mn?'Тогтвортой хатуу хоолой, Пуазейлийн эсэргүүцэл, коэффициент 1 тэлэлтийн алдагдал. Атласаас хэмжээгүй; өөрийн зохицуулалт, GFR, эдийн гэмтлийг тооцохгүй.':'Steady rigid tubes, Poiseuille resistance and ideal expansion coefficient 1. Dimensions are not atlas measurements; autoregulation, GFR and tissue injury are not calculated.'}</p></details>
  {mapped&&t.physiology.map(([heading,text])=><details key={heading}><summary>{heading}</summary><p>{text}</p></details>)}
  <p className="rom-disclaimer">{t.disclaimer}</p>
  <Button variant="outline" onClick={()=>{setLength(20);setInlet(100);setDiameter(site==='main'?5:3);setVesselLength(site==='main'?100:60);setComparing(false);onNarrowing(0);}}>{t.reset}</Button>
 </section>;
}
