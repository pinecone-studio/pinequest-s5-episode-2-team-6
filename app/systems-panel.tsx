import {Bone,BicepsFlexed,Brain,Droplet,Heart,Layers3,type LucideIcon} from 'lucide-react';
import {Slider} from '@/components/ui/slider';
import {Switch} from '@/components/ui/switch';
import type {SystemId,SYSTEMS} from './anatomy';
type System=(typeof SYSTEMS)[number];
const PRESETS:{id:string;label:string;icon:LucideIcon;systems:SystemId[]|null}[]=[
 {id:'all',label:'All systems',icon:Layers3,systems:null},
 {id:'skeleton',label:'Skeleton',icon:Bone,systems:['skeletal']},
 {id:'muscles',label:'Muscles on skeleton',icon:BicepsFlexed,systems:['skeletal','muscular']},
 {id:'organs',label:'Organs',icon:Heart,systems:['cardiac','respiratory','digestive','urinary','endocrine','reproductive']},
 {id:'circulation',label:'Heart and vessels',icon:Droplet,systems:['cardiac','arterial','venous']},
 {id:'nerves',label:'Nervous system',icon:Brain,systems:['nervous','sensory']},
];
interface Props {systems:System[];counts:Record<string,number>;visible:SystemId[];explode:number;visibleCount:number;onVisible:(ids:SystemId[])=>void;onToggle:(id:SystemId)=>void;onExplode:(amount:number)=>void}
export default function SystemsPanel({systems,counts,visible,explode,visibleCount,onVisible,onToggle,onExplode}:Props){
 const same=(ids:SystemId[])=>ids.length===visible.length&&ids.every(id=>visible.includes(id));
 return <aside className="side-panel systems-panel" id="systems" aria-label="Anatomical systems">
  <div className="segmented" role="group" aria-label="Layout"><button aria-pressed={explode<.5} onClick={()=>onExplode(0)}>Assembled</button><button aria-pressed={explode>=.5} onClick={()=>onExplode(1)}>Exploded</button></div>
  <section className="panel-card">
   <h2 className="card-title">System presets</h2>
   <div className="preset-tiles">{PRESETS.map(({id,label,icon:Icon,systems:ids})=>{const target=ids??systems.map(s=>s.id);return <button key={id} className="preset-tile" title={label} aria-label={label} aria-pressed={same(target)} onClick={()=>onVisible(target)}><Icon size={18}/></button>;})}</div>
  </section>
  <section className="panel-card control-block">
   <div className="control-label"><label id="explode-label">Explode anatomy</label><output>{Math.round(explode*100)}<span>%</span></output></div>
   <Slider aria-labelledby="explode-label" min={0} max={100} step={1} value={[explode*100]} onValueChange={v=>onExplode((Array.isArray(v)?v[0]:v)/100)}/>
   <div className="slider-endpoints"><span>Assembled</span><span>Every piece</span></div>
  </section>
  <section className="panel-card system-card">
   <div className="card-heading"><h2 className="card-title">Systems</h2><span className="count-pill">{systems.filter(s=>visible.includes(s.id)).length}/{systems.length}</span></div>
   <div className="system-list">{systems.map(s=><div className={`system-row ${visible.includes(s.id)?'enabled':''}`} key={s.id}><button className="system-name" title={`Show only ${s.name.toLowerCase()}`} onClick={()=>onVisible([s.id])}><span className="system-dot" style={{background:s.color}}/><span className="system-label">{s.name}</span><span className="system-count">{counts[s.id]}</span></button><Switch checked={visible.includes(s.id)} onCheckedChange={()=>onToggle(s.id)} aria-label={`Show ${s.name.toLowerCase()}`}/></div>)}</div>
   <div className="panel-foot"><span>{visibleCount.toLocaleString()} pieces visible</span><button onClick={()=>onVisible([])}>Hide all</button></div>
  </section>
 </aside>;
}
