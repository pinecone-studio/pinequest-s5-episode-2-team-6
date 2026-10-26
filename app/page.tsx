import {flushSync} from 'react-dom';
import {registerAtlasTools} from './agent-tools';
import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {Activity,ArrowUpRight,ChevronRight,Focus,GraduationCap,Info,Layers3,ListChecks,Palette,RotateCcw,Search,Sparkles,X,PersonStanding} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Slider} from '@/components/ui/slider';
import {Switch} from '@/components/ui/switch';
import {Sheet,SheetContent,SheetTitle,SheetDescription} from '@/components/ui/sheet';
import {Combobox,ComboboxInput,ComboboxContent,ComboboxList,ComboboxItem,ComboboxEmpty} from '@/components/ui/combobox';
import AnatomyScene from './scene';
import {DEFAULT_VISIBLE,SYSTEMS,explanation,hasExplanation,type Atlas,type Concept,type SceneState,type SliceState,type SystemId,type View} from './anatomy';
import {BONE_SEARCH_SUGGESTIONS,boneRegionLabel,resolveBoneAtlas} from './bone-atlas';
import {resolveStructureAtlas} from './structure-atlas';
import {mergeTerms} from './anatomy-standard';
import {StandardFigures,useStandardPage} from './standard-figures';
import RomPanel from './rom/RomPanel';
import AiPanel from './ai-panel';
import InfoCard from './info-card';
import SheetResizer from './sheet-resizer';
import LearningPanel from './learning-panel';
import {askAtlas,describeStructure,findConcepts,nervePieces,type AssistantAction} from './ai-assistant';
import {AnchorChannel} from './anchor';
import {MAX_PEEL,peelLayerName,peeledSystems} from './layers';
import type {ActivationFrame} from './rom/activation';
import {BACKGROUNDS,DEFAULT_APPEARANCE,isDark,loadAppearance,saveAppearance} from './appearance';
import {trackEngaged,trackOpen} from './usage';
const initial:SceneState={explode:0,visible:DEFAULT_VISIBLE,selected:[],isolate:false,view:'three-quarter',rotate:false,reset:0,labels:false,peel:0,slice:{on:false,depth:0.5,axis:'x'}};
const DEFAULT_SLICE:SliceState={on:false,depth:0.5,axis:'x'};
const ROM_VISIBLE:SystemId[]=['skeletal','muscular'];
const SEARCH_SUGGESTIONS=['heart','brain','liver','stomach','spleen','pancreas','urinary bladder','trachea',...BONE_SEARCH_SUGGESTIONS,'digastric','mylohyoid','tooth','molar tooth','canine tooth'];
export default function Home(){
 const detailTitle=useRef<HTMLHeadingElement>(null);
 const anchor=useMemo(()=>new AnchorChannel(),[]);
 const [atlas,setAtlas]=useState<Atlas|null>(null),[state,setState]=useState(initial),[progress,setProgress]=useState(0),[error,setError]=useState(''),[panel,setPanel]=useState<'layers'|'search'|'colors'|null>(null),[details,setDetails]=useState(false),[about,setAbout]=useState(false),[query,setQuery]=useState(''),[chosen,setChosen]=useState<Concept|null>(null),[romOpen,setRomOpen]=useState(false),[activations,setActivations]=useState<Record<string,number>>({});
 const [chatOpen,setChatOpen]=useState(false),[dock,setDock]=useState<'explode'|'layers'|'slice'>('explode'),[learning,setLearning]=useState<'tour'|'quiz'|null>(null),[cardDismissed,setCardDismissed]=useState(false);
 useEffect(()=>{const abort=new AbortController();setProgress(0);setError('');setAtlas(null);setChosen(null);setDetails(false);setState({...initial,visible:DEFAULT_VISIBLE});fetch('/models/atlas.json',{signal:abort.signal}).then(r=>{if(!r.ok)throw new Error('The anatomy catalogue could not be loaded.');return r.json();}).then(data=>setAtlas(data as Atlas)).catch(e=>{if(e.name!=='AbortError')setError(e.message);});return()=>abort.abort();},[]);
 useEffect(()=>{const key=(e:KeyboardEvent)=>{const typing=e.target instanceof HTMLInputElement||e.target instanceof HTMLTextAreaElement;if(typing||e.metaKey||e.ctrlKey||e.altKey)return;if(e.key==='/'){e.preventDefault();setPanel('search');setDetails(false);}else if(e.key==='a'||e.key==='A'){e.preventDefault();setPanel(null);setDetails(false);setChatOpen(open=>!open);}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[]);
 const [appearance,setAppearance]=useState(loadAppearance);
 useEffect(()=>{saveAppearance(appearance);document.querySelector('meta[name=theme-color]')?.setAttribute('content',appearance.background);},[appearance]);
 // Opening the atlas and inspecting a structure are the two things worth counting.
 useEffect(()=>{trackOpen();},[]);
 const parts=useMemo(()=>new Map(atlas?.parts.map(p=>[p.id,p])),[atlas]);
 const peeled=useMemo(()=>peeledSystems(state.peel??0),[state.peel]);
 const sliceState=state.slice??DEFAULT_SLICE;
 const counts=useMemo(()=>Object.fromEntries(SYSTEMS.map(s=>[s.id,atlas?.parts.filter(p=>p.system===s.id).length??0])),[atlas]);
 const activeSystems=SYSTEMS.filter(s=>counts[s.id]>0);
 const selectedParts=state.selected.map(id=>parts.get(id)).filter(p=>!!p),selected=selectedParts[0],system=SYSTEMS.find(s=>s.id===selected?.system);
 const boneEntry=selected?.system==='skeletal'&&chosen?(resolveBoneAtlas(chosen.name)??resolveBoneAtlas(selected.name)):null;
 const structEntry=selected&&chosen&&!boneEntry?(resolveStructureAtlas(chosen.name)??resolveStructureAtlas(selected.name)):null;
 const reference=boneEntry?{overview:boneEntry.overview,latin:boneEntry.latin,label:boneRegionLabel(boneEntry.region),terms:boneEntry.terms,link:boneEntry.anatomyStandardUrl}:structEntry?{overview:structEntry.overview,latin:structEntry.latin,label:structEntry.group,terms:structEntry.terms,link:structEntry.anatomyStandardUrl}:null;
 const standardPage=useStandardPage(reference?.link),referenceTerms=reference?mergeTerms(reference.terms,standardPage):[];
 const visibleCount=atlas?.parts.filter(p=>state.isolate?state.selected.includes(p.id):(!peeled.has(p.system)&&(state.visible.includes(p.system)||state.selected.includes(p.id)))).length??0;
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
 const choose=(c:Concept)=>{trackEngaged();setChosen(c);setState(s=>({...s,selected:c.elements,isolate:false,rotate:false}));setDetails(!chatOpen);setPanel(null);setCardDismissed(false);};
 useEffect(()=>{if(!atlas)return;return registerAtlasTools(atlas,c=>flushSync(()=>choose(c)));},[atlas]);
 const choosePart=(id:string)=>{const p=parts.get(id);if(!p)return;trackEngaged();setChosen({id:p.conceptId,name:p.name,elements:[id]});setState(s=>({...s,selected:[id],isolate:false,rotate:false}));setDetails(!chatOpen);setPanel(null);setCardDismissed(false);};
 const toggle=(id:SystemId)=>{setDetails(false);setState(s=>({...s,selected:[],isolate:false,visible:s.visible.includes(id)?s.visible.filter(x=>x!==id):[...s.visible,id]}));};
 const reset=()=>{setState(s=>({...initial,visible:DEFAULT_VISIBLE,reset:s.reset+1}));setChosen(null);setDetails(false);setPanel(null);};
 const setBackground=(background:string)=>setAppearance(a=>({...a,background}));
 const setSystemColor=(id:SystemId,color:string)=>setAppearance(a=>({...a,colors:{...a.colors,[id]:color}}));
 const customized=appearance.background!==DEFAULT_APPEARANCE.background||SYSTEMS.some(s=>appearance.colors[s.id]!==s.color);
 const openPanel=(next:'layers'|'search'|'colors')=>{setDetails(false);setRomOpen(false);setChatOpen(false);setLearning(null);setPanel(p=>p===next?null:next);};
 const romParts=useMemo(()=>atlas?.parts.map(p=>({id:p.id,name:p.name}))??[],[atlas]);
 const onActivation=useCallback((frame:ActivationFrame|null)=>{
  setActivations(frame?.byPartId??{});
  if(!romOpen)return;
  if(!frame){
   setState(s=>({...s,selected:[],isolate:false}));
   return;
  }
  // Isolate elbow muscles + arm bones on the atlas; tint intensity comes from byPartId.
  const ids=frame.focusIds.length?frame.focusIds:[...frame.agonistIds,...frame.antagonistIds];
  setState(s=>{
   const same=s.isolate&&s.selected.length===ids.length&&ids.every((id,i)=>s.selected[i]===id);
   return same?s:{...s,selected:ids,isolate:ids.length>0,visible:ROM_VISIBLE,explode:0,rotate:false,view:s.view==='back'?'side':s.view};
  });
 },[romOpen]);
 const onRomFocus=useCallback((active:boolean)=>{
  if(active){setDetails(false);setPanel(null);setChosen(null);setState(s=>({...s,visible:ROM_VISIBLE,explode:0,rotate:false,view:s.view==='back'?'side':s.view,reset:s.reset+1}));}
  else {setActivations({});setState(s=>({...s,selected:[],isolate:false}));}
 },[]);
 const openRom=()=>{setDetails(false);setPanel(null);setAbout(false);setChatOpen(false);setRomOpen(true);};
 const openLearning=(mode:'tour'|'quiz')=>{setDetails(false);setPanel(null);setRomOpen(false);setChatOpen(false);setLearning(current=>current===mode?null:mode);};
 const toggleChat=()=>{setDetails(false);setPanel(null);setRomOpen(false);setAbout(false);setLearning(null);setChatOpen(open=>!open);};
 // The assistant reads the same reference notes the interface shows and can drive the model.
 const brief=useMemo(()=>{
  if(!atlas||!chosen)return null;
  const found=describeStructure(atlas,chosen.name);
  return {name:chosen.name,latin:found.latin,system:found.system,function:found.function,nerve:found.nerve};
 },[atlas,chosen]);
 const applyAction=(action:AssistantAction)=>{
  if(action.kind==='view'){setState(s=>({...s,view:action.view,reset:s.reset+1,rotate:false}));return;}
  if(action.kind==='labels'){setState(s=>({...s,labels:action.on}));return;}
  if(action.kind==='quiz'){openLearning('quiz');return;}
  if(action.kind==='tour'){openLearning('tour');return;}
  const ids=action.ids??[];
  if(!ids.length||!atlas)return;
  const first=atlas.parts.find(p=>p.id===ids[0]);
  const concept=first?atlas.concepts.find(c=>c.id===first.conceptId):null;
  if(concept&&action.kind!=='isolate'&&action.select!==false)setChosen({id:concept.id,name:concept.name,elements:concept.elements});
  setState(s=>({...s,selected:ids,isolate:action.kind==='isolate'}));
  setCardDismissed(false);
 };
 const ask=(question:string)=>{
  if(!atlas)return {text:'The atlas is still loading. Try again in a moment.',actions:[]};
  const reply=askAtlas(question,{atlas,selection:chosen&&selected?{name:chosen.name,system:selected.system,conceptId:chosen.id,elements:state.selected}:null});
  for(const action of reply.actions)applyAction(action);
  return reply;
 };
 const pickConcept=(name:string)=>{
  if(!atlas)return;
  const match=findConcepts(atlas,name,1)[0];
  if(!match)return;
  setChosen(match);setState(s=>({...s,selected:match.elements,isolate:false,rotate:false}));setDetails(false);setCardDismissed(false);
 };
 const highlightConcept=()=>{
  const concept=chosen?atlas?.concepts.find(c=>c.id===chosen.id):null;
  const ids=concept?.elements??state.selected;
  if(!ids.length)return;
  setState(s=>({...s,selected:ids,isolate:false}));
 };
 const showNerve=()=>{
  if(!atlas||!brief?.nerve)return;
  const ids=nervePieces(atlas,brief.nerve);
  if(!ids.length)return;
  const concept=atlas.concepts.find(c=>c.name.toLowerCase()===brief.nerve.toLowerCase());
  if(concept)setChosen(concept);
  setState(s=>({...s,selected:ids,isolate:false}));
 };
 const isolateSelection=()=>setState(s=>({...s,isolate:true,explode:0}));
 const setView=(view:View)=>setState(s=>({...s,view,reset:s.reset+1,rotate:false}));
 return <main className={`studio ${isDark(appearance.background)?'on-dark':''} ${chatOpen?'chat-open':''}`}>
  {atlas&&<AnatomyScene atlas={atlas} appearance={appearance} state={{...state,inspectorOpen:(details&&selectedParts.length>0)||romOpen}} activations={activations} anchor={anchor} onSelect={choosePart} onProgress={n=>{setProgress(n);if(n===100)setError('');}} onError={setError}/>}
  <div className="vignette"/>
  <header className="identity"><div className="eyebrow"><span className="status-dot"/> INTERACTIVE ANATOMY</div><h1>Human Atlas<Badge variant="outline" className="edition">3D</Badge></h1><div className="identity-meta">{atlas?atlas.parts.length.toLocaleString():'2,763'} modeled pieces <span>·</span> BodyParts3D + Z-Anatomy</div><div className="identity-tools"><Button variant="ghost" className={learning==='tour'?'active':''} aria-pressed={learning==='tour'} onClick={()=>openLearning('tour')}><GraduationCap size={15}/><span>Guided tours</span></Button><Button variant="ghost" className={learning==='quiz'?'active':''} aria-pressed={learning==='quiz'} onClick={()=>openLearning('quiz')}><ListChecks size={15}/><span>Quiz me</span></Button></div></header>
  <nav className="top-actions" aria-label="Explorer panels"><Button variant="ghost" className={`ask-button ${chatOpen?'active':''}`} onClick={toggleChat} aria-pressed={chatOpen} aria-label="Ask the atlas assistant"><Sparkles size={16}/><span>Ask AI</span><kbd>A</kbd></Button><Button variant="ghost" className={romOpen?'active':''} onClick={()=>romOpen?setRomOpen(false):openRom()} aria-label="Open ROM muscle lab"><PersonStanding size={18}/><span>ROM lab</span></Button><Button variant="ghost" className={panel==='search'?'active':''} onClick={()=>openPanel('search')} aria-label="Search anatomy"><Search size={18}/><span>Find a structure</span><kbd>/</kbd></Button><Button variant="ghost" className="icon-button" aria-label="About this atlas" onClick={()=>{setDetails(false);setPanel(null);setRomOpen(false);setChatOpen(false);setAbout(true);}}><Info size={18}/></Button></nav>
  <AiPanel open={chatOpen} selection={chosen&&selected?{name:chosen.name,system:system?.name??''}:null} ask={ask} onClose={()=>setChatOpen(false)}/>
  <InfoCard brief={cardDismissed?null:brief} anchor={anchor} onAsk={()=>setChatOpen(true)} onHighlight={highlightConcept} onShowNerve={showNerve} onIsolate={isolateSelection} onClose={()=>setCardDismissed(true)}/>
  {learning&&<LearningPanel mode={learning} atlas={atlas} onClose={()=>setLearning(null)} onPick={pickConcept} onView={setView}/>}
  <RomPanel parts={romParts} open={romOpen} onClose={()=>setRomOpen(false)} onActivation={onActivation} onRomFocus={onRomFocus}/>
  {!learning&&<section className={`layers-panel glass ${panel==='layers'?'mobile-open':''}`} aria-label="Anatomical layers">
   <div className="panel-heading"><span>Systems</span><Button variant="ghost" className="colors-trigger" aria-label="Customize colors" aria-pressed={panel==='colors'} onClick={()=>openPanel('colors')}><Palette size={14}/>Colors</Button><Button variant="ghost" className="mobile-only icon-button" onClick={()=>setPanel(null)} aria-label="Close systems"><X size={18}/></Button><Badge variant="secondary" className="desktop-only small-number">{activeSystems.length}</Badge></div>
   <div className="layer-presets"><Button variant="ghost" aria-pressed={activeSystems.every(x=>state.visible.includes(x.id))} onClick={()=>setState(s=>({...s,selected:[],isolate:false,visible:activeSystems.map(x=>x.id)}))}>All</Button><Button variant="ghost" aria-pressed={state.visible.length===1&&state.visible[0]==='skeletal'} onClick={()=>setState(s=>({...s,selected:[],isolate:false,visible:['skeletal']}))}>Skeleton</Button><Button variant="ghost" aria-pressed={state.visible.length===6&&['cardiac','respiratory','digestive','urinary','endocrine','reproductive'].every(id=>state.visible.includes(id as SystemId))} onClick={()=>setState(s=>({...s,selected:[],isolate:false,visible:['cardiac','respiratory','digestive','urinary','endocrine','reproductive']}))}>Organs</Button></div>
   <div className="system-list">{activeSystems.map(s=><div className={`system-row ${state.visible.includes(s.id)?'enabled':''}`} key={s.id}><Button variant="ghost" className="system-name" title={`Show only ${s.name.toLowerCase()}`} onClick={()=>setState(v=>({...v,visible:[s.id],isolate:false,selected:[]}))}><span className="system-dot" style={{background:appearance.colors[s.id]}}/>{s.name}<span className="system-count">{counts[s.id]}</span></Button><Switch checked={state.visible.includes(s.id)} onCheckedChange={()=>toggle(s.id)} aria-label={`Show ${s.name.toLowerCase()}`} /></div>)}</div>
   <div className="panel-foot"><span>{visibleCount.toLocaleString()} pieces visible</span><Button variant="ghost" onClick={()=>setState(s=>({...s,visible:[],selected:[],isolate:false}))}>Hide all</Button></div>
  </section>}
  {panel==='search'&&<section className="search-panel glass" aria-label="Find anatomy"><div className="panel-heading"><span>Find a structure</span><Button variant="ghost" className="icon-button" onClick={()=>setPanel(null)} aria-label="Close search"><X size={18}/></Button></div><Combobox<Concept> items={results} value={null} onValueChange={value=>{if(value)choose(value);}} inputValue={query} onInputValueChange={setQuery} itemToStringLabel={c=>c.name} filter={null} open onOpenChange={open=>{if(!open)setPanel(null);}}><ComboboxInput autoFocus placeholder="Heart, femur, cranial nerve…" aria-label="Search named anatomical structures" showTrigger={false}/><ComboboxContent className="anatomy-search-results"><ComboboxEmpty>No structures match your search.</ComboboxEmpty><ComboboxList>{(c:Concept)=><ComboboxItem key={c.id} value={c}><span className="search-result-name">{c.name}</span><span className="small-number">{c.elements.length} {c.elements.length===1?'piece':'pieces'}</span></ComboboxItem>}</ComboboxList></ComboboxContent></Combobox><p className="search-note">{query?'Showing up to 80 matches. Refine your search to find smaller structures.':'Start with a major organ or bone, or search every named structure.'}</p></section>}
  {panel==='colors'&&<section className="colors-panel glass" aria-label="Customize colors"><div className="panel-heading"><span>Colors</span><Button variant="ghost" className="icon-button" onClick={()=>setPanel(null)} aria-label="Close colors"><X size={18}/></Button></div><div className="colors-scroll"><h3 className="colors-label">Background</h3><div className="background-swatches">{BACKGROUNDS.map(b=><button key={b.color} className="color-swatch" style={{background:b.color}} aria-pressed={appearance.background===b.color} aria-label={`${b.name} background`} title={b.name} onClick={()=>setBackground(b.color)}/>)}<label className="color-swatch custom-swatch" title="Custom background" data-active={!BACKGROUNDS.some(b=>b.color===appearance.background)}><input type="color" value={appearance.background} onChange={e=>setBackground(e.target.value)} aria-label="Custom background color"/></label></div><h3 className="colors-label">Systems</h3><div className="color-list">{activeSystems.map(s=><label className="color-row" key={s.id}><input type="color" value={appearance.colors[s.id]} onChange={e=>setSystemColor(s.id,e.target.value)} aria-label={`${s.name} color`}/><span>{s.name}</span><code>{appearance.colors[s.id]}</code></label>)}</div></div><div className="panel-foot"><span>Saved on this device</span><Button variant="ghost" disabled={!customized} onClick={()=>setAppearance(DEFAULT_APPEARANCE)}>Reset colors</Button></div></section>}
  <div className="scene-caption"><span className="caption-line"/><span>{romOpen?'ROM LAB · ELBOW FLEXION':sliceState.on?'CROSS-SECTION':state.isolate?(chosen?.name??'SELECTED STRUCTURE'):(state.peel??0)>0?`${peelLayerName(state.peel??0).toUpperCase()} · PEELED ${state.peel}`:state.explode>.95?'ANATOMICAL INVENTORY':state.explode>.05?'SEPARATED STRUCTURES':'ADULT HUMAN · MALE'}</span><span className="caption-line"/></div>
  <div className="bottom-dock glass"><Button variant="ghost" className="mobile-only dock-layers" onClick={()=>openPanel('layers')} aria-label="Open system layers"><Layers3 size={20}/><span>Systems</span></Button><div className="dock-body"><div className="dock-tabs" role="tablist" aria-label="Dock tools"><button type="button" role="tab" aria-selected={dock==='explode'} className={dock==='explode'?'active':''} onClick={()=>setDock('explode')}>Explode</button><button type="button" role="tab" aria-selected={dock==='layers'} className={dock==='layers'?'active':''} onClick={()=>setDock('layers')}>Layers</button><button type="button" role="tab" aria-selected={dock==='slice'} className={dock==='slice'?'active':''} onClick={()=>setDock('slice')}>Slice</button></div>{dock==='explode'&&<div className="explode-control"><div className="explode-label"><label id="explode-label">Explode anatomy</label><output>{Math.round(state.explode*100)}<span>%</span></output></div><Slider aria-labelledby="explode-label" min={0} max={100} step={1} value={[state.explode*100]} onValueChange={v=>setState(s=>({...s,explode:(Array.isArray(v)?v[0]:v)/100,view:(Array.isArray(v)?v[0]:v)>80?'front':s.view,rotate:false}))}/><div className="slider-endpoints"><span>Assembled</span><span>Every piece</span></div></div>}{dock==='layers'&&<div className="explode-control"><div className="explode-label"><label id="peel-label">Peel layers</label><output>{(state.peel??0)===0?'Full body':peelLayerName(state.peel??0)}</output></div><Slider aria-labelledby="peel-label" min={0} max={MAX_PEEL} step={1} value={[state.peel??0]} onValueChange={v=>setState(s=>({...s,peel:Array.isArray(v)?v[0]:v}))}/><div className="slider-endpoints"><span>Full body</span><span>Vessels & nerves</span></div></div>}{dock==='slice'&&<div className="explode-control slice-control"><div className="explode-label"><label id="slice-label">Cross-section</label><output>{sliceState.on?`${Math.round(sliceState.depth*100)}%`:'off'}</output></div><Slider aria-labelledby="slice-label" min={0} max={100} step={1} value={[sliceState.depth*100]} onValueChange={v=>{const depth=(Array.isArray(v)?v[0]:v)/100;setState(s=>({...s,slice:{...sliceState,depth,on:depth>.001}}));}}/><div className="slider-endpoints"><span>Surface</span><span>Far side</span></div><div className="slice-axis" role="group" aria-label="Section axis"><Button variant="ghost" className={sliceState.axis==='x'?'active':''} aria-pressed={sliceState.axis==='x'} onClick={()=>setState(s=>({...s,slice:{...sliceState,axis:'x'}}))}>Left → Right</Button><Button variant="ghost" className={sliceState.axis==='z'?'active':''} aria-pressed={sliceState.axis==='z'} onClick={()=>setState(s=>({...s,slice:{...sliceState,axis:'z'}}))}>Front → Back</Button></div></div>}</div><Button variant="ghost" className="dock-reset" onClick={reset} aria-label="Assemble and reset"><RotateCcw size={18}/><span>Reset</span></Button></div>
  <footer className="studio-footer"><span>{state.explode>.8?'Drag to pan':'Drag to orbit'} <b>·</b> Pinch to zoom <b>·</b> Tap to inspect</span><Button variant="ghost" onClick={()=>{setDetails(false);setPanel(null);setAbout(true);}}>Source & credits <ArrowUpRight size={12}/></Button></footer>
  {progress<100&&!error&&<div className="loading glass" role="status"><Activity size={18}/><div><strong>Preparing the anatomy</strong><span>{progress}% · Loading {atlas?.parts.length.toLocaleString()??'2,234'} pieces</span><div className="loading-track"><i style={{width:`${progress}%`}}/></div></div></div>}
  {error&&<div className="loading glass error" role="alert"><p>{error}</p><Button variant="ghost" onClick={()=>location.reload()}>Reload viewer</Button></div>}
  <Sheet open={details&&selectedParts.length>0} modal={false} disablePointerDismissal onOpenChange={setDetails}><SheetContent initialFocus={detailTitle} className={`detail-sheet glass ${state.isolate?'is-isolated':''}`} showCloseButton={true}><div className="detail-header"><div className="detail-accent" style={{background:system&&appearance.colors[system.id]}}/><div className="eyebrow">{system?.name??'ANATOMY'}{reference&&<> · {reference.label}</>}</div><SheetTitle ref={detailTitle} tabIndex={-1} className="structure-title">{chosen?.name}</SheetTitle>{reference&&<p className="structure-latin">{reference.latin}</p>}</div><div className="detail-scroll" key={`${chosen?.id}-${state.isolate}`}><SheetDescription className="structure-description">{reference?reference.overview:chosen&&selected?explanation(chosen.name,selected.system):''}</SheetDescription>{reference?<Badge variant="secondary" className="bone-region-badge">{reference.label}</Badge>:chosen&&!hasExplanation(chosen.name)&&<span className="context-note">System overview · structure identified from source anatomy</span>}<div className="structure-meta"><span>Atlas reference<strong>{chosen?.id}</strong></span><span>Selected pieces<strong>{state.selected.length.toLocaleString()}</strong></span></div>{reference&&standardPage&&<StandardFigures key={reference.link} page={standardPage} link={reference.link}/>}{reference&&<div className="term-list"><h3>Terminology</h3><ul>{referenceTerms.map(t=><li key={t.latin}><span className="term-latin">{t.latin}</span><span className="term-english">{t.english}</span></li>)}</ul></div>}{selectedParts.length>1&&<div className="member-list"><h3>Included structures</h3>{selectedParts.slice(0,50).map(p=><Button variant="ghost" key={p.id} onClick={()=>choosePart(p.id)}><span>{p.name}</span><ChevronRight size={14}/></Button>)}{selectedParts.length>50&&<p>And {selectedParts.length-50} more modeled pieces.</p>}</div>}{reference&&<a className="source-link anatomy-standard-link" href={reference.link} target="_blank" rel="noreferrer">Open Anatomy Standard reference <ArrowUpRight size={14}/></a>}<a className="source-link" href="https://lifesciencedb.jp/bp3d/" target="_blank" rel="noreferrer">View anatomical source <ArrowUpRight size={14}/></a></div><div className="detail-actions"><Button className={`primary-action ${state.isolate?'active':''}`} onClick={()=>setState(s=>({...s,isolate:!s.isolate,explode:0}))}><Focus size={18}/>{state.isolate?'Show surrounding anatomy':'Isolate structure'}<ChevronRight size={16}/></Button><Button variant="ghost" className="secondary-action" onClick={()=>{setState(s=>({...s,selected:[],isolate:false}));setDetails(false);}}>Clear selection</Button></div><SheetResizer/></SheetContent></Sheet>
  <Sheet open={about} onOpenChange={setAbout}><SheetContent className="about-sheet glass"><div className="eyebrow">SOURCE & SCOPE</div><SheetTitle className="structure-title">A body, revealed.</SheetTitle><SheetDescription>Explore the adult male reference anatomy from BodyParts3D, supplemented with Z-Anatomy.</SheetDescription><div className="about-copy"><p><strong>Male · BodyParts3D</strong><br/>2,234 individual meshes and 3,432 named concepts from an adult male reference anatomy, plus 529 Z-Anatomy meshes for the spinal cord, peripheral and cranial nerves, lymph nodes, tonsils, thyroid and parathyroid glands, middle ear, and knee joint structures.</p><p>This reference does not contain every human structure or variation. Named concepts can contain multiple pieces; each source mesh is rendered once.</p><p>Colors and system groupings are designed for exploration. The geometry is simplified for the web, and short explanations provide general educational context. This is an anatomical reference, not a diagnostic or surgical tool.</p><h3>Source</h3><p>BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International.</p><a href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html" target="_blank" rel="noreferrer">Dataset license <ArrowUpRight size={14}/></a><a href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html" target="_blank" rel="noreferrer">Original geometry & metadata <ArrowUpRight size={14}/></a><a href="https://academic.oup.com/nar/article/37/suppl_1/D782/1000752" target="_blank" rel="noreferrer">Read the source publication <ArrowUpRight size={14}/></a><p>Supplementary structures: Z-Anatomy, the libre 3D atlas of anatomy (based on BodyParts3D), licensed under CC Attribution-ShareAlike 4.0 International. Geometry was aligned and simplified for this viewer.</p><a href="https://github.com/LluisV/Z-Anatomy" target="_blank" rel="noreferrer">Z-Anatomy source <ArrowUpRight size={14}/></a><a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">CC BY-SA 4.0 license <ArrowUpRight size={14}/></a><h3>Bone atlas reference</h3><p>Skeletal terminology and further-reading links point to Anatomy Standard (Jānis Šavlovskis &amp; Kristaps Raits), an evidence-based illustrated atlas. Their illustrations and Latin–English term lists are shown in the detail panel under CC BY-NC 4.0, loaded unmodified from their site for non-commercial educational use.</p><a href="https://creativecommons.org/licenses/by-nc/4.0/" target="_blank" rel="noreferrer">CC BY-NC 4.0 license <ArrowUpRight size={14}/></a><a href="https://www.anatomystandard.com/" target="_blank" rel="noreferrer">Anatomy Standard <ArrowUpRight size={14}/></a></div></SheetContent></Sheet>
 </main>;
}
