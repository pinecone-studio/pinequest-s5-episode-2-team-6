import {flushSync} from 'react-dom';
import {registerAtlasTools} from './agent-tools';
import {useCallback,useEffect,useMemo,useRef,useState,type CSSProperties} from 'react';
import {useLocation,useNavigate} from 'react-router-dom';
import {Activity,ArrowUpRight,ChevronRight,CircleQuestionMark,Focus,Info,Layers3,LayoutGrid,Palette,RotateCcw,Search,Sparkles,X,PersonStanding} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Slider} from '@/components/ui/slider';
import {Switch} from '@/components/ui/switch';
import {Sheet,SheetContent,SheetTitle,SheetDescription} from '@/components/ui/sheet';
import {Combobox,ComboboxInput,ComboboxContent,ComboboxList,ComboboxItem,ComboboxEmpty} from '@/components/ui/combobox';
import {useFetch} from '@/hooks/use-fetch';
import AnatomyScene from './scene';
import {DEFAULT_VISIBLE,SYSTEMS,explanation,hasExplanation,type Atlas,type Concept,type SceneState,type SliceState,type SystemId} from './anatomy';
import {BONE_SEARCH_SUGGESTIONS,boneOverview,boneRegionLabel,resolveBoneAtlas} from './bone-atlas';
import {resolveStructureAtlas,structureGroupLabel,structureOverview} from './structure-atlas';
import {resolveStructureFact} from './structure-facts';
import {mergeTerms} from './anatomy-standard';
import {StandardFigures,useStandardPage} from './standard-figures';
import RomPanel from './rom/RomPanel';
import PlaquePanel from './plaque-panel';
import type {RenalPreview} from './plaque-model';
import AiPanel from './ai-panel';
import SheetResizer from './sheet-resizer';
import SheetHandle from './sheet-handle';
import IntroPanel,{introSeen,introSteps,usePhoneLayout,type IntroTarget} from './intro-panel';
import PaywallDialog from './paywall';
import {useSubscription} from '../hooks/use-subscription';
import {describeStructure,findConcepts,nervePieces,type AssistantAction} from './ai-assistant';
import type {AssistantSelection} from './llm-types';
import {AnchorChannel} from './anchor';
import {LAYERS,MAX_PEEL,peeledSystems} from './layers';
import {useLang} from './locale';
import SiteNav from './site-nav';
import {runtimeError,systemDescription} from './atlas-copy';
import type {ActivationFrame} from './rom/activation';
import {BACKGROUNDS,DEFAULT_APPEARANCE,isGlass,loadAppearance,saveAppearance,type Appearance} from './appearance';
import './atlas-glass.css';
import {trackEngaged,trackOpen} from './usage';
import {localName,mongolianName} from './mongolian-names';
const initial:SceneState={explode:0,visible:DEFAULT_VISIBLE,selected:[],isolate:false,view:'three-quarter',rotate:false,reset:0,labels:false,peel:0,slice:{on:false,depth:0.5,axis:'x'}};
const DEFAULT_SLICE:SliceState={on:false,depth:0.5,axis:'x'};
const ROM_VISIBLE:SystemId[]=['skeletal','muscular'];
const SEARCH_SUGGESTIONS=['heart','brain','liver','stomach','spleen','pancreas','urinary bladder','trachea',...BONE_SEARCH_SUGGESTIONS,'digastric','mylohyoid','tooth','molar tooth','canine tooth'];
export default function Home(){
 const {lang,t}=useLang();
 const navigate=useNavigate();
 const subscription=useSubscription();
 // Admins can open the labs without buying a plan, so they can verify the flow.
 const premium=subscription.premium||subscription.isAdmin;
 const [paywall,setPaywall]=useState(false);
 // The Plaque lab lives at /plaque in the navigation bar: the same atlas with the lab panel open. Free accounts
 // get the paywall and land back on /atlas, but only once the subscription lookup has settled.
 const plaqueRoute=useLocation().pathname==='/plaque',plaqueOpen=plaqueRoute&&premium;
 useEffect(()=>{if(plaqueRoute&&subscription.ready&&!subscription.loading&&!premium){setPaywall(true);navigate('/atlas',{replace:true});}},[plaqueRoute,subscription.ready,subscription.loading,premium]);
 const [perfusion,setPerfusion]=useState<RenalPreview|null>(null);
 const previewPlaque=useCallback((next:RenalPreview|null)=>{setPerfusion(next);if(next){setDetails(false);setPanel(null);setRomOpen(false);setChatOpen(false);}},[]);
 const systemName=(id:SystemId)=>t.systems[id].name;
 const nameOf=useCallback((name:string)=>localName(name,lang),[lang]);
 const bgName=(color:string,fallback:string)=>t.backgrounds[color]??fallback;
 const peelLabel=(peel:number)=>peel<=0?t.fullBody:t.layers[LAYERS[Math.min(Math.max(0,peel),LAYERS.length-1)].id];
 const detailTitle=useRef<HTMLHeadingElement>(null);
 const anchor=useMemo(()=>new AnchorChannel(),[]);
 const catalogue=useFetch<Atlas>('/models/atlas.json'),atlas=catalogue.data;
 const [state,setState]=useState(initial),[progress,setProgress]=useState(0),[error,setError]=useState(''),[panel,setPanel]=useState<'layers'|'search'|'colors'|null>(null),[details,setDetails]=useState(false),[about,setAbout]=useState(false),[query,setQuery]=useState(''),[chosen,setChosen]=useState<Concept|null>(null),[romOpen,setRomOpen]=useState(false),[activations,setActivations]=useState<Record<string,number>>({});
 const [chatOpen,setChatOpen]=useState(false),[dock,setDock]=useState<'explode'|'layers'|'slice'>('explode'),[sheetFull,setSheetFull]=useState(false);
 // On phones the details sheet opens low for every new structure, so the structure itself stays in view.
 useEffect(()=>setSheetFull(false),[chosen?.id,details]);
 // The scene reports its own failures through `error`; a catalogue failure comes from the fetch and can be retried in place.
 const failure=error||(catalogue.error?'The anatomy catalogue could not be loaded.':'');
 // First visit introduction: the step shown, or null when closed. It waits for the model to finish loading
 // and stays away when a link opened the atlas on a structure or a panel, since that visitor already has a goal.
 const [intro,setIntro]=useState<number|null>(null);
 const deepLinked=useRef(/[?&](focus|open)=/.test(location.search)||plaqueRoute),introChecked=useRef(false);
 useEffect(()=>{if(progress<100||introChecked.current)return;introChecked.current=true;if(!introSeen()&&!deepLinked.current)setIntro(0);},[progress]);
 useEffect(()=>{const key=(e:KeyboardEvent)=>{const typing=e.target instanceof HTMLInputElement||e.target instanceof HTMLTextAreaElement;if(typing||e.metaKey||e.ctrlKey||e.altKey||document.getElementById('plaque-lab'))return;if(e.key==='/'){e.preventDefault();setPanel('search');setDetails(false);}else if(e.key==='a'||e.key==='A'){e.preventDefault();setPanel(null);setDetails(false);setChatOpen(open=>!open);}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[]);
 const [appearance,setAppearance]=useState(loadAppearance);
 useEffect(()=>{document.querySelector('meta[name=theme-color]')?.setAttribute('content',appearance.background);},[appearance]);
 // The glass theme hangs off <html> because the sheets render in a portal outside .studio. It stays on for every
 // backdrop: another colour only repaints the room behind the model (.atlas-custom), the interface keeps its look.
 useEffect(()=>{const root=document.documentElement;root.classList.add('atlas-glass');root.classList.toggle('atlas-custom',!isGlass(appearance.background));return()=>root.classList.remove('atlas-glass','atlas-custom');},[appearance.background]);
 // Only choices the visitor makes are stored, so a new default backdrop still reaches everyone else.
 const changeAppearance=(next:Appearance)=>{setAppearance(next);saveAppearance(next);};
 // Opening the atlas and inspecting a structure are the two things worth counting.
 useEffect(()=>{trackOpen();},[]);
 const parts=useMemo(()=>new Map(atlas?.parts.map(p=>[p.id,p])),[atlas]);
 // Search matches the Mongolian name too, whichever language the interface is in.
 const mnNames=useMemo(()=>new Map(atlas?.concepts.map(c=>[c.id,(mongolianName(c.name)??'').toLowerCase()])),[atlas]);
 const peeled=useMemo(()=>peeledSystems(state.peel??0),[state.peel]);
 const sliceState=state.slice??DEFAULT_SLICE;
 const counts=useMemo(()=>Object.fromEntries(SYSTEMS.map(s=>[s.id,atlas?.parts.filter(p=>p.system===s.id).length??0])),[atlas]);
 const activeSystems=SYSTEMS.filter(s=>counts[s.id]>0);
 const selectedParts=state.selected.map(id=>parts.get(id)).filter(p=>!!p),selected=selectedParts[0],system=SYSTEMS.find(s=>s.id===selected?.system);
 const boneEntry=selected?.system==='skeletal'&&chosen?(resolveBoneAtlas(chosen.name)??resolveBoneAtlas(selected.name)):null;
 const structEntry=selected&&chosen&&!boneEntry?(resolveStructureAtlas(chosen.name)??resolveStructureAtlas(selected.name)):null;
 const reference=boneEntry?{overview:boneOverview(boneEntry,lang),latin:boneEntry.latin,label:boneRegionLabel(boneEntry.region,lang),terms:boneEntry.terms,link:boneEntry.anatomyStandardUrl}:structEntry?{overview:structureOverview(structEntry,lang),latin:structEntry.latin,label:structureGroupLabel(structEntry.group,lang),terms:structEntry.terms,link:structEntry.anatomyStandardUrl}:null;
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
  return atlas.concepts.filter(c=>c.name.toLowerCase().includes(term)||c.id.toLowerCase().includes(term)||!!mnNames.get(c.id)?.includes(term)).sort((a,b)=>a.name.length-b.name.length).slice(0,80);
 },[atlas,query,mnNames]);
 const choose=(c:Concept)=>{trackEngaged();setChosen(c);setState(s=>({...s,selected:c.elements,isolate:false,rotate:false}));setDetails(!chatOpen);setPanel(null);};
 useEffect(()=>{if(!atlas)return;return registerAtlasTools(atlas,c=>flushSync(()=>choose(c)));},[atlas]);
 const choosePart=(id:string)=>{const p=parts.get(id);if(!p)return;trackEngaged();setChosen({id:p.conceptId,name:p.name,elements:[id]});setState(s=>({...s,selected:[id],isolate:false,rotate:false}));setDetails(!chatOpen);setPanel(null);};
 const toggle=(id:SystemId)=>{setDetails(false);setState(s=>({...s,selected:[],isolate:false,visible:s.visible.includes(id)?s.visible.filter(x=>x!==id):[...s.visible,id]}));};
 const reset=()=>{setState(s=>({...initial,visible:DEFAULT_VISIBLE,reset:s.reset+1}));setChosen(null);setDetails(false);setPanel(null);};
 const setBackground=(background:string)=>changeAppearance({...appearance,background});
 const setSystemColor=(id:SystemId,color:string)=>changeAppearance({...appearance,colors:{...appearance.colors,[id]:color}});
 const customized=appearance.background!==DEFAULT_APPEARANCE.background||SYSTEMS.some(s=>appearance.colors[s.id]!==s.color);
 const openPanel=(next:'layers'|'search'|'colors')=>{setDetails(false);setRomOpen(false);setChatOpen(false);setPanel(p=>p===next?null:next);};
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
 const openRom=()=>{if(!premium){setPaywall(true);return;}setDetails(false);setPanel(null);setAbout(false);setChatOpen(false);setRomOpen(true);};
 const openIntro=()=>{setDetails(false);setPanel(null);setRomOpen(false);setChatOpen(false);setAbout(false);setIntro(0);};
 const introTucked=chatOpen||panel!==null||(details&&state.selected.length>0)||romOpen||about||!!perfusion;
 // Phones get their own guide; each step can name a control, which then wears a pulsing ring.
 const phone=usePhoneLayout();
 const introTarget=intro===null?null:introSteps(phone)[Math.min(intro,introSteps(phone).length-1)].target;
 const ring=(...targets:IntroTarget[])=>introTarget&&targets.includes(introTarget)?'intro-target':'';
 // The masthead tools fold into one button and fan out to its left. The intro opens the tray on the steps that
 // point at them; a click elsewhere (but not on the intro itself) or Escape folds it again.
 const [tools,setTools]=useState(false),toolsRef=useRef<HTMLElement>(null);
 const toolsActive=chatOpen||romOpen||panel==='search';
 useEffect(()=>{if(introTarget==='ask'||introTarget==='search'||introTarget==='top')setTools(true);},[introTarget]);
 useEffect(()=>{if(!tools)return;const away=(e:PointerEvent)=>{const el=e.target as Element;if(!toolsRef.current?.contains(el)&&!el.closest?.('.intro-panel'))setTools(false);};const esc=(e:KeyboardEvent)=>{if(e.key==='Escape')setTools(false);};document.addEventListener('pointerdown',away);document.addEventListener('keydown',esc);return()=>{document.removeEventListener('pointerdown',away);document.removeEventListener('keydown',esc);};},[tools]);
 const toggleChat=()=>{setDetails(false);setPanel(null);setRomOpen(false);setAbout(false);setChatOpen(open=>!open);};
 // The assistant reads the same reference notes the interface shows and can drive the model.
 const brief=useMemo(()=>{
  if(!atlas||!chosen)return null;
  const found=describeStructure(atlas,chosen.name);
  // Only a curated fact fills the function line; without one describeStructure repeats the overview's first sentence,
  // which the panel already shows above it.
  return {name:chosen.name,latin:found.latin,system:selected?systemName(selected.system):found.system,function:resolveStructureFact(chosen.name)?.function??'',nerve:found.nerve};
 },[atlas,chosen,lang,selected]);
 const assistantSelection=useMemo<AssistantSelection|null>(()=>{
  if(!atlas||!chosen||!selected)return null;
  const found=describeStructure(atlas,chosen.name);
  return {name:chosen.name,system:system?.name??'',conceptId:chosen.id,elements:state.selected,latin:found.latin||undefined,overview:found.overview||undefined,function:found.function||undefined,nerve:found.nerve||undefined};
 },[atlas,chosen,selected,system,state.selected]);
 const applyAction=(action:AssistantAction)=>{
  if(action.kind==='view'){setState(s=>({...s,view:action.view,reset:s.reset+1,rotate:false}));return;}
  if(action.kind==='labels'){setState(s=>({...s,labels:action.on}));return;}
  // The quiz is its own page; the assistant sends the visitor there.
  if(action.kind==='quiz'){navigate('/quiz');return;}
  const ids=action.ids??[];
  if(!ids.length||!atlas)return;
  const first=atlas.parts.find(p=>p.id===ids[0]);
  const concept=first?atlas.concepts.find(c=>c.id===first.conceptId):null;
  if(concept&&action.kind!=='isolate'&&action.select!==false)setChosen({id:concept.id,name:concept.name,elements:concept.elements});
  setState(s=>({...s,selected:ids,isolate:action.kind==='isolate'}));
 };
 const pickConcept=(name:string)=>{
  if(!atlas)return;
  const match=findConcepts(atlas,name,1)[0];
  if(!match)return;
  setChosen(match);setState(s=>({...s,selected:match.elements,isolate:false,rotate:false}));setDetails(true);setPanel(null);
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
 // The quiz links here with ?focus=<structure name>; ?open=rom|ai opens a panel.
 const linked=useRef(new URLSearchParams(location.search));
 useEffect(()=>{const open=linked.current.get('open');if(open==='rom')openRom();else if(open==='ai')toggleChat();},[]);
 useEffect(()=>{
  const focus=linked.current.get('focus');if(!atlas||!focus)return;
  linked.current.delete('focus');
  const exact=atlas.concepts.find(c=>c.name.toLowerCase()===focus.toLowerCase());
  if(exact)choose(exact);else pickConcept(focus);
 },[atlas]);
 // The page sits under the shared navigation; a plain backdrop paints the strip behind it too, the glass room comes from CSS.
 return <div className="atlas-page" style={isGlass(appearance.background)?undefined:{background:appearance.background}}>
  <SiteNav tone="glass" highlight={introTarget==='nav'}/>
  <main className={`studio ${perfusion?'plaque-open':''} ${chatOpen?'chat-open':''}`}>
  {atlas&&<AnatomyScene atlas={atlas} appearance={appearance} state={perfusion?{...state,selected:perfusion.ids,isolate:true,explode:0,peel:0,slice:DEFAULT_SLICE,view:'front',rotate:false,inspectorOpen:true,perfusion}:{...state,inspectorOpen:(details&&selectedParts.length>0)||romOpen}} activations={activations} anchor={anchor} label={nameOf} onSelect={perfusion?()=>{}:choosePart} onProgress={n=>{setProgress(n);if(n===100)setError('');}} onError={setError}/>}
  <div className="vignette"/>
  <div className="stage-frame" aria-hidden><i/><i/><i/><i/></div>
  <PlaquePanel atlas={atlas} open={plaqueOpen} onPreview={previewPlaque} onClose={()=>navigate('/atlas')}/>
  <PaywallDialog open={paywall} onClose={()=>setPaywall(false)}/>
  {/* No visible title over the model; the heading stays for screen readers. */}
  <h1 className="sr-only">Anatomn</h1>
  <nav ref={toolsRef} className={`top-actions ${tools?'is-open':''}`} aria-label="Explorer panels"><div className="atlas-tools" id="atlas-tools"><Button variant="ghost" style={{'--i':3} as CSSProperties} className={`ask-button ${chatOpen?'active':''} ${ring('ask','top')}`} onClick={()=>{setTools(false);toggleChat();}} aria-pressed={chatOpen} aria-label={t.askAiLabel}><Sparkles size={16}/><span>{t.askAi}</span><kbd>A</kbd></Button><Button variant="ghost" style={{'--i':2} as CSSProperties} className={`${romOpen?'active':''} ${ring('top')}`} onClick={()=>{setTools(false);romOpen?setRomOpen(false):openRom();}} aria-label={t.romLabel}><PersonStanding size={18}/><span>{t.rom}</span></Button><Button variant="ghost" style={{'--i':1} as CSSProperties} className={`${panel==='search'?'active':''} ${ring('search','top')}`} onClick={()=>{setTools(false);openPanel('search');}} aria-label={t.findLabel}><Search size={18}/><span>{t.find}</span><kbd>/</kbd></Button><Button variant="ghost" style={{'--i':0} as CSSProperties} className={`icon-button ${ring('top')}`} aria-label={t.aboutLabel} onClick={()=>{setTools(false);setDetails(false);setPanel(null);setRomOpen(false);setChatOpen(false);setAbout(true);}}><Info size={18}/></Button></div><Button variant="ghost" className={`icon-button tools-toggle ${toolsActive&&!tools?'has-active':''}`} onClick={()=>setTools(open=>!open)} aria-expanded={tools} aria-controls="atlas-tools" aria-label={tools?t.hideTools:t.showTools}>{tools?<X size={18}/>:<LayoutGrid size={18}/>}</Button></nav>
  <AiPanel open={chatOpen} atlas={atlas} selection={assistantSelection} onAction={applyAction} onClose={()=>setChatOpen(false)}/>
  {intro!==null&&<IntroPanel step={intro} phone={phone} tucked={introTucked} onStep={setIntro} onClose={()=>setIntro(null)}/>}
  <RomPanel parts={romParts} open={romOpen} onClose={()=>setRomOpen(false)} onActivation={onActivation} onRomFocus={onRomFocus}/>
  <section className={`layers-panel glass ${panel==='layers'?'mobile-open':''}`} aria-label="Anatomical layers">
   <div className="panel-heading"><span>{t.systemsWord}</span><Button variant="ghost" className="colors-trigger" aria-label={t.customizeColors} aria-pressed={panel==='colors'} onClick={()=>openPanel('colors')}><Palette size={14}/>{t.colors}</Button><Button variant="ghost" className="mobile-only icon-button" onClick={()=>setPanel(null)} aria-label={t.closeSystems}><X size={18}/></Button><Badge variant="secondary" className="desktop-only small-number">{activeSystems.length}</Badge></div>
   <div className="layer-presets"><Button variant="ghost" aria-pressed={activeSystems.every(x=>state.visible.includes(x.id))} onClick={()=>setState(s=>({...s,selected:[],isolate:false,visible:activeSystems.map(x=>x.id)}))}>{t.all}</Button><Button variant="ghost" aria-pressed={state.visible.length===1&&state.visible[0]==='skeletal'} onClick={()=>setState(s=>({...s,selected:[],isolate:false,visible:['skeletal']}))}>{t.skeleton}</Button><Button variant="ghost" aria-pressed={state.visible.length===6&&['cardiac','respiratory','digestive','urinary','endocrine','reproductive'].every(id=>state.visible.includes(id as SystemId))} onClick={()=>setState(s=>({...s,selected:[],isolate:false,visible:['cardiac','respiratory','digestive','urinary','endocrine','reproductive']}))}>{t.organs}</Button></div>
   <div className="system-spectrum" aria-hidden>{activeSystems.map(s=><i key={s.id} className={state.visible.includes(s.id)?'on':''} style={{flexGrow:counts[s.id],background:appearance.colors[s.id]}}/>)}</div>
   <div className="system-list">{activeSystems.map((s,i)=><div className={`system-row ${state.visible.includes(s.id)?'enabled':''}`} key={s.id} style={{'--sys':appearance.colors[s.id]} as CSSProperties}><Button variant="ghost" className="system-name" title={t.showOnly(systemName(s.id))} onClick={()=>setState(v=>({...v,visible:[s.id],isolate:false,selected:[]}))}><span className="system-index" aria-hidden>{String(i+1).padStart(2,'0')}</span><span className="system-dot"/><span className="system-label">{systemName(s.id)}</span><span className="system-leader" aria-hidden/><span className="system-count">{counts[s.id]}</span></Button><Switch checked={state.visible.includes(s.id)} onCheckedChange={()=>toggle(s.id)} aria-label={t.showSystem(systemName(s.id))} /></div>)}</div>
   <div className="panel-foot"><span>{t.piecesVisible(visibleCount.toLocaleString())}</span><Button variant="ghost" onClick={()=>setState(s=>({...s,visible:[],selected:[],isolate:false}))}>{t.hideAll}</Button></div>
  </section>
  {panel==='search'&&<section className="search-panel glass" aria-label={t.findLabel}><div className="panel-heading"><span>{t.find}</span><Button variant="ghost" className="icon-button" onClick={()=>setPanel(null)} aria-label={t.closeSearch}><X size={18}/></Button></div><Combobox<Concept> items={results} value={null} onValueChange={value=>{if(value)choose(value);}} inputValue={query} onInputValueChange={setQuery} itemToStringLabel={c=>nameOf(c.name)} filter={null} open onOpenChange={open=>{if(!open)setPanel(null);}}><ComboboxInput autoFocus placeholder={t.searchPlaceholder} aria-label={t.searchInput} showTrigger={false}/><ComboboxContent className="anatomy-search-results"><ComboboxEmpty>{t.noMatch}</ComboboxEmpty><ComboboxList>{(c:Concept)=><ComboboxItem key={c.id} value={c}><span className="search-result-name">{nameOf(c.name)}{nameOf(c.name)!==c.name&&<small className="search-result-alt">{c.name}</small>}</span><span className="small-number">{c.elements.length} {c.elements.length===1?t.piece:t.pieces}</span></ComboboxItem>}</ComboboxList></ComboboxContent></Combobox><p className="search-note">{query?t.searchRefine:t.searchNote}</p></section>}
  {panel==='colors'&&<section className="colors-panel glass" aria-label={t.customizeColors}><div className="panel-heading"><span>{t.colors}</span><Button variant="ghost" className="icon-button" onClick={()=>setPanel(null)} aria-label={t.closeColors}><X size={18}/></Button></div><div className="colors-scroll"><h3 className="colors-label">{t.background}</h3><div className="background-swatches">{BACKGROUNDS.map(b=><button key={b.color} className="color-swatch" style={{background:b.color}} aria-pressed={appearance.background===b.color} aria-label={t.backgroundLabel(bgName(b.color,b.name))} title={bgName(b.color,b.name)} onClick={()=>setBackground(b.color)}/>)}<label className="color-swatch custom-swatch" title={t.customBackground} data-active={!BACKGROUNDS.some(b=>b.color===appearance.background)}><input type="color" value={appearance.background} onChange={e=>setBackground(e.target.value)} aria-label={t.customBackgroundColor}/></label></div><h3 className="colors-label">{t.systemsWord}</h3><div className="color-list">{activeSystems.map(s=><label className="color-row" key={s.id}><input type="color" value={appearance.colors[s.id]} onChange={e=>setSystemColor(s.id,e.target.value)} aria-label={t.systemColor(systemName(s.id))}/><span>{systemName(s.id)}</span><code>{appearance.colors[s.id]}</code></label>)}</div></div><div className="panel-foot"><span>{t.savedDevice}</span><Button variant="ghost" disabled={!customized} onClick={()=>changeAppearance(DEFAULT_APPEARANCE)}>{t.resetColors}</Button></div></section>}
  <div className={`bottom-dock glass ${ring('dock')}`}><Button variant="ghost" className="mobile-only dock-layers" onClick={()=>openPanel('layers')} aria-label={t.openLayers}><Layers3 size={20}/><span>{t.systemsWord}</span></Button><div className="dock-body"><div className="dock-tabs" role="tablist" aria-label={t.dockTools}><button type="button" role="tab" aria-selected={dock==='explode'} className={dock==='explode'?'active':''} onClick={()=>setDock('explode')}><span className="dock-index">I</span>{t.explode}</button><button type="button" role="tab" aria-selected={dock==='layers'} className={dock==='layers'?'active':''} onClick={()=>setDock('layers')}><span className="dock-index">II</span>{t.layersWord}</button><button type="button" role="tab" aria-selected={dock==='slice'} className={dock==='slice'?'active':''} onClick={()=>setDock('slice')}><span className="dock-index">III</span>{t.slice}</button></div>{dock==='explode'&&<div className="explode-control"><div className="explode-label"><label id="explode-label">{t.explodeAnatomy}</label><output>{Math.round(state.explode*100)}<span>%</span></output></div><Slider aria-labelledby="explode-label" min={0} max={100} step={1} value={[state.explode*100]} onValueChange={v=>setState(s=>({...s,explode:(Array.isArray(v)?v[0]:v)/100,view:(Array.isArray(v)?v[0]:v)>80?'front':s.view,rotate:false}))}/><div className="dock-ruler" aria-hidden style={{'--ticks':10} as CSSProperties}/><div className="slider-endpoints"><span>{t.assembled}</span><span>{t.everyPiece}</span></div></div>}{dock==='layers'&&<div className="explode-control peel-control"><div className="explode-label"><label id="peel-label">{t.peelLayers}</label><output>{peelLabel(state.peel??0)}</output></div><Slider aria-labelledby="peel-label" min={0} max={MAX_PEEL} step={1} value={[state.peel??0]} onValueChange={v=>setState(s=>({...s,peel:Array.isArray(v)?v[0]:v}))}/><div className="dock-ruler" aria-hidden style={{'--ticks':MAX_PEEL} as CSSProperties}/><div className="slider-endpoints"><span>{t.fullBody}</span><span>{t.vessels}</span></div></div>}{dock==='slice'&&<div className="explode-control slice-control"><div className="explode-label"><label id="slice-label">{t.crossSection}</label><output>{sliceState.on?`${Math.round(sliceState.depth*100)}%`:t.off}</output></div><Slider aria-labelledby="slice-label" min={0} max={100} step={1} value={[sliceState.depth*100]} onValueChange={v=>{const depth=(Array.isArray(v)?v[0]:v)/100;setState(s=>({...s,slice:{...sliceState,depth,on:depth>.001}}));}}/><div className="dock-ruler" aria-hidden style={{'--ticks':10} as CSSProperties}/><div className="slider-endpoints"><span>{t.surface}</span><span>{t.farSide}</span></div><div className="slice-axis" role="group" aria-label={t.sectionAxis}><Button variant="ghost" className={sliceState.axis==='x'?'active':''} aria-pressed={sliceState.axis==='x'} onClick={()=>setState(s=>({...s,slice:{...sliceState,axis:'x'}}))}>{t.leftRight}</Button><Button variant="ghost" className={sliceState.axis==='z'?'active':''} aria-pressed={sliceState.axis==='z'} onClick={()=>setState(s=>({...s,slice:{...sliceState,axis:'z'}}))}>{t.frontBack}</Button></div></div>}</div><Button variant="ghost" className="dock-reset" onClick={reset} aria-label={t.assembleReset}><RotateCcw size={18}/><span>{t.reset}</span></Button></div>
  <footer className="studio-footer"><div className="footer-links"><Button variant="ghost" onClick={openIntro}><CircleQuestionMark size={12}/> {t.intro.reopen}</Button><Button variant="ghost" onClick={()=>{setDetails(false);setPanel(null);setAbout(true);}}>{t.credits} <ArrowUpRight size={12}/></Button></div></footer>
  {progress<100&&!failure&&<div className="loading glass" role="status"><Activity size={24} className="loading-pulse" aria-hidden/><div><strong>{t.preparing}</strong><span>{t.loading(progress,atlas?.parts.length.toLocaleString()??'2,234')}</span><div className="loading-track"><i style={{width:`${progress}%`}}/></div></div></div>}
  {failure&&<div className="loading glass error" role="alert"><p>{runtimeError(failure,lang)}</p><Button variant="ghost" onClick={catalogue.error?catalogue.reload:()=>location.reload()}>{t.reload}</Button></div>}
  <Sheet open={details&&selectedParts.length>0} modal={false} disablePointerDismissal onOpenChange={setDetails}><SheetContent initialFocus={detailTitle} className={`detail-sheet glass ${state.isolate?'is-isolated':''} ${sheetFull?'is-full':''}`} showCloseButton={true}><SheetHandle full={sheetFull} onChange={setSheetFull} onClose={()=>setDetails(false)}/><div className="detail-header"><div className="detail-accent" style={{background:system&&appearance.colors[system.id]}}/><div className="eyebrow">{system?systemName(system.id):t.anatomyWord}{reference&&reference.label!==(system&&systemName(system.id))&&<> · {reference.label}</>}</div><SheetTitle ref={detailTitle} tabIndex={-1} className="structure-title">{chosen&&nameOf(chosen.name)}</SheetTitle>{reference&&<p className="structure-latin">{reference.latin}</p>}{chosen&&nameOf(chosen.name)!==chosen.name&&<p className="structure-alt">{chosen.name}</p>}</div><div className="detail-scroll" key={`${chosen?.id}-${state.isolate}`} onScroll={e=>{if(!sheetFull&&e.currentTarget.scrollTop>8)setSheetFull(true);}}><SheetDescription className="structure-description">{reference?reference.overview:chosen&&selected?(hasExplanation(chosen.name)?explanation(chosen.name,selected.system,lang):systemDescription(selected.system,lang)):''}</SheetDescription>{brief?.function&&<p className="info-card-line"><b>{t.card.function}:</b> {brief.function}</p>}{brief?.nerve&&<p className="info-card-line"><b>{t.card.nerve}:</b> {nameOf(brief.nerve)}</p>}{reference?<Badge variant="secondary" className="bone-region-badge">{reference.label}</Badge>:chosen&&!hasExplanation(chosen.name)&&<span className="context-note">{t.systemOverview}</span>}<div className="structure-meta"><span>{t.atlasRef}<strong>{chosen?.id}</strong></span><span>{t.selectedPieces}<strong>{state.selected.length.toLocaleString()}</strong></span></div>{reference&&standardPage&&<StandardFigures key={reference.link} page={standardPage} link={reference.link}/>}{reference&&<div className="term-list"><h3>{t.terminology}</h3><ul>{referenceTerms.map(t=><li key={t.latin}><span className="term-latin">{t.latin}</span><span className="term-english">{t.english}</span></li>)}</ul></div>}{selectedParts.length>1&&<div className="member-list"><h3>{t.included}</h3>{selectedParts.slice(0,50).map(p=><Button variant="ghost" key={p.id} onClick={()=>choosePart(p.id)}><span>{nameOf(p.name)}</span><ChevronRight size={14}/></Button>)}{selectedParts.length>50&&<p>{t.andMore(selectedParts.length-50)}</p>}</div>}{reference&&<a className="source-link anatomy-standard-link" href={reference.link} target="_blank" rel="noreferrer">{t.openStandard} <ArrowUpRight size={14}/></a>}<a className="source-link" href="https://lifesciencedb.jp/bp3d/" target="_blank" rel="noreferrer">{t.viewSource} <ArrowUpRight size={14}/></a></div><div className="detail-actions"><Button variant="ghost" className="secondary-action" onClick={highlightConcept}>{t.card.highlight}</Button>{brief?.nerve&&<Button variant="ghost" className="secondary-action" onClick={showNerve}>{t.card.showNerve}</Button>}<Button variant="ghost" className="secondary-action" onClick={()=>{setPanel(null);setRomOpen(false);setChatOpen(true);}}><Sparkles size={14}/>{t.card.ask}</Button><Button className={`primary-action ${state.isolate?'active':''}`} onClick={()=>setState(s=>({...s,isolate:!s.isolate,explode:0}))}><Focus size={18}/>{state.isolate?t.showSurrounding:t.isolate}<ChevronRight size={16}/></Button><Button variant="ghost" className="secondary-action" onClick={()=>{setState(s=>({...s,selected:[],isolate:false}));setDetails(false);}}>{t.clearSelection}</Button></div><SheetResizer/></SheetContent></Sheet>
  <Sheet open={about} onOpenChange={setAbout}><SheetContent className="about-sheet glass"><div className="eyebrow">{t.aboutKicker}</div><SheetTitle className="structure-title">{t.aboutTitle}</SheetTitle><SheetDescription>{t.aboutLead}</SheetDescription><div className="about-copy"><p><strong>{t.aboutBody}</strong><br/>{t.aboutP1}</p><p>{t.aboutP2}</p><p>{t.aboutP3}</p><h3>{t.aboutSource}</h3><p>BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International.</p><a href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html" target="_blank" rel="noreferrer">{t.aboutLicense} <ArrowUpRight size={14}/></a><a href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html" target="_blank" rel="noreferrer">{t.aboutGeometry} <ArrowUpRight size={14}/></a><a href="https://academic.oup.com/nar/article/37/suppl_1/D782/1000752" target="_blank" rel="noreferrer">{t.aboutPaper} <ArrowUpRight size={14}/></a><p>{t.aboutZ}</p><a href="https://github.com/LluisV/Z-Anatomy" target="_blank" rel="noreferrer">{t.aboutZSource} <ArrowUpRight size={14}/></a><a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">{t.aboutCcSa} <ArrowUpRight size={14}/></a><h3>{t.aboutBone}</h3><p>{t.aboutBoneP}</p><a href="https://creativecommons.org/licenses/by-nc/4.0/" target="_blank" rel="noreferrer">{t.aboutCcNc} <ArrowUpRight size={14}/></a><a href="https://www.anatomystandard.com/" target="_blank" rel="noreferrer">Anatomy Standard <ArrowUpRight size={14}/></a></div></SheetContent></Sheet>
  </main>
 </div>;
}
