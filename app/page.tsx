import {flushSync} from 'react-dom';
import {registerAtlasTools} from './agent-tools';
import {useEffect,useMemo,useRef,useState} from 'react';
import {Activity,ArrowUpRight,Maximize2,Minimize2,Moon,Pause,RotateCcw,RotateCw,Search,Sun,X} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Sheet,SheetContent,SheetTitle,SheetDescription} from '@/components/ui/sheet';
import AnatomyScene from './scene';
import SystemsPanel from './systems-panel';
import InspectorPanel,{type InspectorTab} from './inspector-panel';
import {DEFAULT_VISIBLE,SYSTEMS,type Atlas,type Concept,type SceneState,type SystemId,type View} from './anatomy';
import {BONE_SEARCH_SUGGESTIONS,resolveBoneAtlas} from './bone-atlas';
const initial:SceneState={explode:0,visible:DEFAULT_VISIBLE,selected:[],isolate:false,view:'three-quarter',rotate:false,reset:0};
const SEARCH_SUGGESTIONS=['heart','brain','liver','stomach','spleen','pancreas','urinary bladder','trachea',...BONE_SEARCH_SUGGESTIONS];
const VIEWS:{id:View;short:string;label:string}[]=[{id:'three-quarter',short:'¾',label:'Three-quarter'},{id:'front',short:'F',label:'Front'},{id:'side',short:'S',label:'Side'},{id:'back',short:'B',label:'Back'}];
const compact=new Intl.NumberFormat('en',{notation:'compact',maximumFractionDigits:2});
export default function Home(){
 const searchInput=useRef<HTMLInputElement>(null);
 const [atlas,setAtlas]=useState<Atlas|null>(null),[state,setState]=useState(initial),[progress,setProgress]=useState(0),[error,setError]=useState(''),[tab,setTab]=useState<InspectorTab>('find'),[about,setAbout]=useState(false),[query,setQuery]=useState(''),[chosen,setChosen]=useState<Concept|null>(null),[expanded,setExpanded]=useState(false),[dark,setDark]=useState(()=>document.documentElement.classList.contains('dark'));
 useEffect(()=>{const abort=new AbortController();setProgress(0);setError('');setAtlas(null);setChosen(null);setState({...initial,visible:DEFAULT_VISIBLE});fetch('/models/atlas.json',{signal:abort.signal}).then(r=>{if(!r.ok)throw new Error('The anatomy catalogue could not be loaded.');return r.json();}).then(data=>setAtlas(data as Atlas)).catch(e=>{if(e.name!=='AbortError')setError(e.message);});return()=>abort.abort();},[]);
 const focusSearch=()=>{setExpanded(false);setTab('find');requestAnimationFrame(()=>searchInput.current?.focus());};
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.key==='/'&&!(e.target instanceof HTMLInputElement)&&!(e.target instanceof HTMLTextAreaElement)){e.preventDefault();focusSearch();}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[]);
 useEffect(()=>{document.documentElement.classList.toggle('dark',dark);document.querySelector('meta[name=theme-color]')?.setAttribute('content',dark?'#16120f':'#fdf6ec');},[dark]);
 const toggleTheme=()=>{const next=!dark;setDark(next);try{localStorage.setItem('atlas-theme',next?'dark':'light');}catch{/* Storage can be unavailable; the theme still applies for this visit. */}};
 useEffect(()=>{if(!expanded)return;const key=(e:KeyboardEvent)=>{if(e.key==='Escape')setExpanded(false);};document.body.classList.add('viewer-expanded');window.addEventListener('keydown',key);return()=>{document.body.classList.remove('viewer-expanded');window.removeEventListener('keydown',key);};},[expanded]);
 const parts=useMemo(()=>new Map(atlas?.parts.map(p=>[p.id,p])),[atlas]);
 const counts=useMemo(()=>Object.fromEntries(SYSTEMS.map(s=>[s.id,atlas?.parts.filter(p=>p.system===s.id).length??0])),[atlas]);
 const activeSystems=SYSTEMS.filter(s=>counts[s.id]>0);
 const selectedParts=state.selected.map(id=>parts.get(id)).filter(p=>!!p),selected=selectedParts[0],system=SYSTEMS.find(s=>s.id===selected?.system);
 const boneEntry=selected?.system==='skeletal'&&chosen?(resolveBoneAtlas(chosen.name)??resolveBoneAtlas(selected.name)):null;
 const visibleCount=atlas?.parts.filter(p=>state.isolate?state.selected.includes(p.id):state.visible.includes(p.system)||state.selected.includes(p.id)).length??0;
 const results=useMemo(()=>{
  if(!atlas)return[];
  const term=query.toLowerCase().trim();
  if(!term){
   return SEARCH_SUGGESTIONS.map(name=>{
    const concept=atlas.concepts.find(c=>c.name.toLowerCase()===name);
    if(concept)return concept;
    const part=atlas.parts.find(p=>{const n=p.name.toLowerCase();return n===name||n===`left ${name}`||n===`right ${name}`;});
    return part?{id:part.conceptId,name:part.name,elements:[part.id]}:null;
   }).filter((x):x is Concept=>!!x);
  }
  return atlas.concepts.filter(c=>c.name.toLowerCase().includes(term)||c.id.toLowerCase().includes(term)).sort((a,b)=>a.name.length-b.name.length).slice(0,80);
 },[atlas,query]);
 const colorOf=(c:Concept)=>SYSTEMS.find(s=>s.id===parts.get(c.elements[0])?.system)?.color;
 const choose=(c:Concept)=>{setChosen(c);setState(s=>({...s,selected:c.elements,isolate:false,rotate:false}));setTab('details');};
 useEffect(()=>{if(!atlas)return;return registerAtlasTools(atlas,c=>flushSync(()=>choose(c)));},[atlas]);
 const choosePart=(id:string)=>{const p=parts.get(id);if(!p)return;setChosen({id:p.conceptId,name:p.name,elements:[id]});setState(s=>({...s,selected:[id],isolate:false,rotate:false}));setTab('details');};
 const showSystems=(visible:SystemId[])=>setState(s=>({...s,visible,selected:[],isolate:false}));
 const toggle=(id:SystemId)=>setState(s=>({...s,selected:[],isolate:false,visible:s.visible.includes(id)?s.visible.filter(x=>x!==id):[...s.visible,id]}));
 const explode=(amount:number)=>setState(s=>({...s,explode:amount,view:amount>.8?'front':s.view,rotate:false}));
 const clear=()=>setState(s=>({...s,selected:[],isolate:false}));
 const reset=()=>{setState(s=>({...initial,visible:DEFAULT_VISIBLE,reset:s.reset+1}));setChosen(null);};
 const showDetails=()=>{setExpanded(false);setTab('details');requestAnimationFrame(()=>document.getElementById('inspector')?.scrollIntoView({behavior:'smooth',block:'start'}));};
 const systemsOn=activeSystems.filter(s=>state.visible.includes(s.id)).length,viewName=state.explode>.8?'Inventory':VIEWS.find(v=>v.id===state.view)?.label;
 const caption=state.isolate?(chosen?.name??'Selected structure'):state.explode>.95?'Anatomical inventory':state.explode>.05?'Separated structures':'Adult human · male';
 return <div className="site">
  <header className="site-nav">
   <a className="brand" href="#top" aria-label="Human Atlas home"><span className="brand-mark" aria-hidden="true">HA</span><span>Human Atlas</span></a>
   <nav className="nav-links" aria-label="Sections"><a href="#top">Home</a><a href="#explorer">Explorer</a><a href="#systems">Systems</a><button onClick={()=>setAbout(true)}>About</button></nav>
   <div className="nav-actions"><button className="nav-search" onClick={focusSearch} aria-label="Find a structure"><Search size={16}/><span>Find a structure</span><kbd>/</kbd></button><button className="icon-button" onClick={toggleTheme} aria-label={dark?'Use light theme':'Use dark theme'} title={dark?'Light theme':'Dark theme'}>{dark?<Sun size={18}/>:<Moon size={18}/>}</button></div>
  </header>
  <main id="top">
   <section className="hero">
    <p className="hero-eyebrow"><span className="status-dot"/>Interactive 3D anatomy</p>
    <h1>Your Interactive <span>Human Atlas</span></h1>
    <p className="hero-copy">Explore {(atlas?.parts.length??2234).toLocaleString()} individually modeled structures of a reference adult body. Switch organ systems on and off, search named structures, then separate the anatomy and inspect every piece from any angle.</p>
   </section>
   <section className="workspace" id="explorer" aria-label="Anatomy explorer">
    <SystemsPanel systems={activeSystems} counts={counts} visible={state.visible} explode={state.explode} visibleCount={visibleCount} onVisible={showSystems} onToggle={toggle} onExplode={explode}/>
    <div className={`viewer ${expanded?'expanded':''}`}>
     {atlas&&<AnatomyScene atlas={atlas} state={{...state,dark}} onSelect={choosePart} onProgress={n=>{setProgress(n);if(n===100)setError('');}} onError={setError}/>}
     <div className="viewer-stats" aria-label="Scene summary">
      <div className="stat-row"><div className="stat"><span>Visible pieces</span><strong>{visibleCount.toLocaleString()}</strong></div><div className="stat"><span>Systems on</span><strong>{systemsOn}/{activeSystems.length}</strong></div><div className="stat"><span>Explode</span><strong>{Math.round(state.explode*100)}%</strong></div></div>
      <div className="stat-row secondary"><div className="stat"><span>Selected</span><strong>{state.selected.length?state.selected.length.toLocaleString():'—'}</strong></div><div className="stat"><span>View</span><strong>{viewName}</strong></div><div className="stat"><span>Concepts</span><strong>{(atlas?.concepts.length??3432).toLocaleString()}</strong></div><div className="stat"><span>Triangles</span><strong>{compact.format(atlas?.triangles??2288268)}</strong></div></div>
     </div>
     <button className="viewer-expand" onClick={()=>setExpanded(e=>!e)} aria-label={expanded?'Exit full screen':'Expand viewer'} title={expanded?'Exit full screen (Esc)':'Expand viewer'}>{expanded?<Minimize2 size={16}/>:<Maximize2 size={16}/>}</button>
     <nav className="viewer-tools" aria-label="Camera controls">{VIEWS.map(v=><button key={v.id} className="tool" aria-pressed={state.view===v.id} disabled={state.explode>.8&&v.id!=='front'} onClick={()=>setState(s=>({...s,view:v.id,reset:s.reset+1,rotate:false}))} title={`${v.label} view`} aria-label={`${v.label} view`}>{v.short}</button>)}<i/><button className="tool" disabled={state.explode>=.4} aria-pressed={state.rotate} aria-label={state.rotate?'Pause rotation':'Rotate body'} title="Auto rotate" onClick={()=>setState(s=>({...s,rotate:!s.rotate}))}>{state.rotate?<Pause size={16}/>:<RotateCw size={16}/>}</button><button className="tool" aria-label="Reset view and layers" title="Reset" onClick={reset}><RotateCcw size={16}/></button></nav>
     {selected&&chosen&&<div className="selection-chip"><span className="system-dot" style={{background:system?.color}}/><span className="selection-name">{chosen.name}</span><button onClick={showDetails}>Details</button><button className="chip-clear" aria-label="Clear selection" onClick={clear}><X size={14}/></button></div>}
     <div className="viewer-caption"><span className="caption-title"><i/>{caption}<i/></span><span className="caption-hint">{state.explode>.8?'Drag to pan':'Drag to orbit'} · Scroll or pinch to zoom · Tap to inspect</span></div>
     {progress<100&&!error&&<div className="loading" role="status"><Activity size={18}/><div><strong>Preparing the anatomy</strong><span>{progress}% · Loading {atlas?.parts.length.toLocaleString()??'2,234'} pieces</span><div className="loading-track"><i style={{width:`${progress}%`}}/></div></div></div>}
     {error&&<div className="loading error" role="alert"><p>{error}</p><Button variant="ghost" onClick={()=>location.reload()}>Reload viewer</Button></div>}
    </div>
    <InspectorPanel tab={tab} onTab={setTab} query={query} onQuery={setQuery} results={results} searchInput={searchInput} colorOf={colorOf} onChoose={choose} chosen={chosen} parts={selectedParts} system={system} bone={boneEntry} isolate={state.isolate} onIsolate={()=>setState(s=>({...s,isolate:!s.isolate,explode:0}))} onClear={clear} onChoosePart={choosePart}/>
   </section>
   <section className="facts" aria-label="Atlas at a glance">
    <div><strong>{(atlas?.parts.length??2234).toLocaleString()}</strong><span>individually selectable meshes</span></div>
    <div><strong>{activeSystems.length||15}</strong><span>anatomical systems to toggle</span></div>
    <div><strong>{(atlas?.concepts.length??3432).toLocaleString()}</strong><span>searchable named concepts</span></div>
   </section>
  </main>
  <footer className="site-footer"><span>Anatomy data: BodyParts3D © The Database Center for Life Science, CC BY 4.0. An educational reference, not a diagnostic tool.</span><button onClick={()=>setAbout(true)}>Source & credits <ArrowUpRight size={12}/></button></footer>
  <Sheet open={about} onOpenChange={setAbout}><SheetContent className="about-sheet"><div className="eyebrow">SOURCE & SCOPE</div><SheetTitle className="structure-title">A body, revealed.</SheetTitle><SheetDescription>Explore the adult male reference anatomy from BodyParts3D.</SheetDescription><div className="about-copy"><p><strong>Male · BodyParts3D</strong><br/>2,234 individual meshes and 3,432 named concepts from an adult male reference anatomy.</p><p>This reference does not contain every human structure or variation. Named concepts can contain multiple pieces; each source mesh is rendered once.</p><p>Colors and system groupings are designed for exploration. The geometry is simplified for the web, and short explanations provide general educational context. This is an anatomical reference, not a diagnostic or surgical tool.</p><h3>Source</h3><p>BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International.</p><a href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html" target="_blank" rel="noreferrer">Dataset license <ArrowUpRight size={14}/></a><a href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html" target="_blank" rel="noreferrer">Original geometry & metadata <ArrowUpRight size={14}/></a><a href="https://academic.oup.com/nar/article/37/suppl_1/D782/1000752" target="_blank" rel="noreferrer">Read the source publication <ArrowUpRight size={14}/></a><h3>Bone atlas reference</h3><p>Skeletal terminology and further-reading links point to Anatomy Standard (Jānis Šavlovskis &amp; Kristaps Raits), an evidence-based illustrated atlas. Their original images remain on their site under CC BY-NC; this app does not redistribute them.</p><a href="https://www.anatomystandard.com/" target="_blank" rel="noreferrer">Anatomy Standard <ArrowUpRight size={14}/></a></div></SheetContent></Sheet>
 </div>;
}
