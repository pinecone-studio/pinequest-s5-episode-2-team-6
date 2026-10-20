import type {RefObject} from 'react';
import {ArrowUpRight,ChevronRight,Focus,Info,MousePointerClick,Search,X} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Tabs,TabsList,TabsTrigger,TabsContent} from '@/components/ui/tabs';
import {EXPLANATIONS,explanation,type Concept,type Part,type SYSTEMS} from './anatomy';
import {boneRegionLabel,type BoneAtlasEntry} from './bone-atlas';
export type InspectorTab='find'|'details';
interface Props {
 tab:InspectorTab;onTab:(tab:InspectorTab)=>void;
 query:string;onQuery:(query:string)=>void;results:Concept[];searchInput:RefObject<HTMLInputElement|null>;colorOf:(concept:Concept)=>string|undefined;onChoose:(concept:Concept)=>void;
 chosen:Concept|null;parts:Part[];system?:(typeof SYSTEMS)[number];bone:BoneAtlasEntry|null;isolate:boolean;onIsolate:()=>void;onClear:()=>void;onChoosePart:(id:string)=>void;
}
export default function InspectorPanel({tab,onTab,query,onQuery,results,searchInput,colorOf,onChoose,chosen,parts,system,bone,isolate,onIsolate,onClear,onChoosePart}:Props){
 const selected=parts[0];
 return <aside className="side-panel inspector-panel" id="inspector" aria-label="Find and inspect anatomy">
  <Tabs value={tab} onValueChange={value=>onTab(value as InspectorTab)} className="inspector-tabs">
   <TabsList className="segmented tab-list"><TabsTrigger value="find"><Search size={15}/>Find</TabsTrigger><TabsTrigger value="details"><Info size={15}/>Details{selected&&<span className="tab-dot" style={{background:system?.color}}/>}</TabsTrigger></TabsList>
   <TabsContent value="find" className="tab-panel">
    <div className="search-box"><Search size={16}/><input ref={searchInput} type="search" value={query} onChange={e=>onQuery(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&results[0])onChoose(results[0]);}} placeholder="Heart, femur, cranial nerve…" aria-label="Search named anatomical structures" autoComplete="off" spellCheck={false}/>{query&&<button className="search-clear" onClick={()=>{onQuery('');searchInput.current?.focus();}} aria-label="Clear search"><X size={14}/></button>}<kbd>/</kbd></div>
    <div className="list-label">{query?`${results.length===80?'First 80':results.length} ${results.length===1?'match':'matches'}`:'Suggested structures'}</div>
    {results.length?<ul className="result-list">{results.map(c=><li key={c.id}><button className="result-card" onClick={()=>onChoose(c)}><span className="system-dot" style={{background:colorOf(c)}}/><span className="result-name">{c.name}</span><span className="result-meta">{c.elements.length} {c.elements.length===1?'piece':'pieces'}</span><ChevronRight size={14}/></button></li>)}</ul>:<p className="empty-note">No structures match your search.</p>}
   </TabsContent>
   <TabsContent value="details" className="tab-panel">
    {selected&&chosen?<>
     <div className="detail-header"><div className="detail-accent" style={{background:system?.color}}/><div className="eyebrow">{system?.name??'Anatomy'}{bone&&<> · {boneRegionLabel(bone.region)}</>}</div><h2 className="structure-title">{chosen.name}</h2>{bone&&<p className="structure-latin">{bone.latin}</p>}</div>
     <div className="detail-scroll" key={`${chosen.id}-${isolate}`}>
      <p className="structure-description">{bone?bone.overview:explanation(chosen.name,selected.system)}</p>
      {bone?<Badge variant="secondary" className="bone-region-badge">{boneRegionLabel(bone.region)}</Badge>:!EXPLANATIONS[chosen.name.toLowerCase()]&&<span className="context-note">System overview · structure identified from source anatomy</span>}
      <div className="structure-meta"><span>Atlas reference<strong>{chosen.id}</strong></span><span>Selected pieces<strong>{parts.length.toLocaleString()}</strong></span></div>
      {bone&&<div className="term-list"><h3>Terminology</h3><ul>{bone.terms.map(t=><li key={t.latin}><span className="term-latin">{t.latin}</span><span className="term-english">{t.english}</span></li>)}</ul></div>}
      {parts.length>1&&<div className="member-list"><h3>Included structures</h3>{parts.slice(0,50).map(p=><button key={p.id} onClick={()=>onChoosePart(p.id)}><span>{p.name}</span><ChevronRight size={14}/></button>)}{parts.length>50&&<p>And {parts.length-50} more modeled pieces.</p>}</div>}
      {bone&&<a className="source-link" href={bone.anatomyStandardUrl} target="_blank" rel="noreferrer">Open bone atlas reference <ArrowUpRight size={14}/></a>}
      <a className="source-link" href="https://lifesciencedb.jp/bp3d/" target="_blank" rel="noreferrer">View anatomical source <ArrowUpRight size={14}/></a>
     </div>
     <div className="detail-actions"><Button className={`primary-action ${isolate?'active':''}`} onClick={onIsolate}><Focus size={17}/>{isolate?'Show surrounding anatomy':'Isolate structure'}<ChevronRight size={16}/></Button><Button variant="ghost" className="secondary-action" onClick={onClear}>Clear selection</Button></div>
    </>:<div className="empty-state"><span className="empty-icon"><MousePointerClick size={22}/></span><h2>Nothing selected</h2><p>Tap a structure on the model, or search for one by name, to read about it here.</p><Button variant="ghost" className="secondary-action" onClick={()=>onTab('find')}><Search size={15}/>Search structures</Button></div>}
   </TabsContent>
  </Tabs>
 </aside>;
}
