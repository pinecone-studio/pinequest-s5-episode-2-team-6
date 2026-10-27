import {Fragment,lazy,Suspense,useEffect,useId,useRef,useState,type CSSProperties,type PointerEvent as ReactPointerEvent} from 'react';
import {Link} from 'react-router-dom';
import {Activity,ArrowUpRight,HandHeart,HeartPulse,PersonStanding,Plus,Sparkles,UserRound,X} from 'lucide-react';
import {useLang} from '../locale';
import {localName} from '../mongolian-names';
import SiteNav from '../site-nav';
import {BODY_COPY,DEFAULT_PAIN,REGIONS,type RegionId} from './copy';
import './body.css';

// A wellness-style body map in frosted glass: mark where it hurts on the muscle figure, then jump to
// the matching muscles, the ROM lab or the heart in the 3D atlas. three.js loads only for the heart card.
const CrystalHeart=lazy(()=>import('./heart'));
const FIGURE={src:'/landing/hero.webp',width:794,height:1171};
// Where the "log pain" badge sits on the figure, below the sternum.
const BADGE:[number,number]=[385,640];
const KEY='anatomn-body-pain';
type Pain=Partial<Record<RegionId,number>>;
const clampLevel=(n:number)=>Math.max(1,Math.min(10,Math.round(n)));
function loadPain():Pain{
 try{
  const saved=JSON.parse(localStorage.getItem(KEY)??'null');
  if(saved&&typeof saved==='object')return Object.fromEntries(REGIONS.filter(r=>typeof saved[r.id]==='number').map(r=>[r.id,clampLevel(saved[r.id])]));
 }catch{/* Storage can be blocked in private windows; the defaults still show. */}
 return DEFAULT_PAIN;
}
function savePain(pain:Pain){try{localStorage.setItem(KEY,JSON.stringify(pain));}catch{/* The marks still apply for this visit. */}}
const at=([x,y]:[number,number])=>({left:`${x/FIGURE.width*100}%`,top:`${y/FIGURE.height*100}%`});
const capital=(s:string)=>s.charAt(0).toUpperCase()+s.slice(1);

export default function BodyPage(){
 const {lang}=useLang();
 const t=BODY_COPY[lang];
 const [pain,setPain]=useState<Pain>(loadPain);
 const [adding,setAdding]=useState(false);
 const [open,setOpen]=useState<RegionId|null>(null);
 const figure=useRef<HTMLDivElement>(null),sheetTitle=useRef<HTMLHeadingElement>(null);
 const titleId=useId();
 useEffect(()=>{savePain(pain);},[pain]);
 useEffect(()=>{document.querySelector('meta[name=theme-color]')?.setAttribute('content','#5a8dcb');},[]);
 useEffect(()=>{if(open)sheetTitle.current?.focus();},[open]);
 useEffect(()=>{
  const key=(e:KeyboardEvent)=>{if(e.key!=='Escape')return;if(open)setOpen(null);else setAdding(false);};
  addEventListener('keydown',key);return()=>removeEventListener('keydown',key);
 },[open]);
 const marked=REGIONS.filter(r=>pain[r.id]);
 const region=REGIONS.find(r=>r.id===open);
 const level=open?pain[open]??5:5;
 const tap=(id:RegionId)=>{
  if(pain[id]){setOpen(id);return;}
  setPain(p=>({...p,[id]:5}));
  if(!adding)setOpen(id);
 };
 const remove=(id:RegionId)=>{setPain(p=>{const next={...p};delete next[id];return next;});setOpen(null);};
 const levelWord=(n:number)=>t.sheet.levels[n<=3?0:n<=6?1:2];
 const muscleName=(name:string)=>capital(localName(name,lang));
 // The figure leans a little toward the pointer; CSS turns the two numbers into the tilt.
 const lean=(e:ReactPointerEvent)=>{
  if(e.pointerType!=='mouse'||!figure.current)return;
  const r=figure.current.getBoundingClientRect();
  figure.current.style.setProperty('--px',((e.clientX-r.left)/r.width*2-1).toFixed(3));
  figure.current.style.setProperty('--py',((e.clientY-r.top)/r.height*2-1).toFixed(3));
 };
 const settle=()=>{figure.current?.style.setProperty('--px','0');figure.current?.style.setProperty('--py','0');};

 return <div className="bc">
  <div className="bc-bg" aria-hidden><i/><i/><i/></div>
  <SiteNav tone="glass"/>
  <div className="bc-shell">
   <section className="bc-stage" onPointerMove={lean} onPointerLeave={settle}>
    <header className="bc-top">
     <div className="bc-me">
      <span className="bc-avatar bc-glass" role="img" aria-label={t.profile}><UserRound size={20}/></span>
      <div><h1>{t.title}</h1><p>{marked.length?t.painCount(marked.length):t.noPain}</p></div>
     </div>
    </header>
    <div className={`bc-figure ${adding?'is-adding':''}`} ref={figure}>
     <div className="bc-figure-tilt">
      <img src={FIGURE.src} width={FIGURE.width} height={FIGURE.height} alt="" draggable={false}/>
      <svg className="bc-leaders" viewBox={`0 0 ${FIGURE.width} ${FIGURE.height}`} aria-hidden>
       {marked.map(r=><line key={r.id} x1={r.dot[0]} y1={r.dot[1]} x2={r.chip[0]} y2={r.chip[1]}/>)}
      </svg>
      {REGIONS.map(r=>{
       const on=!!pain[r.id];
       return <Fragment key={r.id}>
        {(on||adding)&&<button type="button" className={`bc-dot ${on?'is-on':''}`} style={at(r.dot)} onClick={()=>tap(r.id)} aria-label={on?`${t.pain[r.id]} · ${pain[r.id]}/10`:t.mark(t.regions[r.id])}/>}
        {on&&<button type="button" className={`bc-chip bc-glass ${open===r.id?'is-open':''}`} style={at(r.chip)} onClick={()=>setOpen(r.id)} aria-expanded={open===r.id}>{t.pain[r.id]}</button>}
       </Fragment>;
      })}
      <button type="button" className="bc-badge bc-glass" style={at(BADGE)} onClick={()=>{setAdding(a=>!a);setOpen(null);}} aria-pressed={adding} aria-label={t.log}><HandHeart size={22}/></button>
     </div>
    </div>
    {adding&&<div className="bc-hint bc-glass" role="status"><span>{t.hint}</span><button type="button" onClick={()=>setAdding(false)}>{t.done}</button></div>}
   </section>

   <section className="bc-cards">
    {region&&<aside className="bc-sheet bc-glass" role="dialog" aria-labelledby={titleId} key={region.id}>
     <div className="bc-sheet-head">
      <div><span className="bc-eyebrow">{t.sheet.eyebrow}</span><h2 id={titleId} ref={sheetTitle} tabIndex={-1}>{t.regions[region.id]}</h2></div>
      <button type="button" className="bc-round" onClick={()=>setOpen(null)} aria-label={t.sheet.close}><X size={18}/></button>
     </div>
     <label className="bc-level">
      <span>{t.sheet.intensity}</span>
      <output>{level}<small>/10 · {levelWord(level)}</small></output>
      <input type="range" min={1} max={10} step={1} value={level} style={{'--level':(level-1)/9} as CSSProperties} onChange={e=>setPain(p=>({...p,[region.id]:clampLevel(+e.target.value)}))}/>
     </label>
     <div className="bc-muscles">
      <span className="bc-eyebrow">{t.sheet.muscles}</span>
      <ul>{region.muscles.map(m=><li key={m.concept}><Link to={`/atlas?focus=${encodeURIComponent(m.concept)}`}>{muscleName(m.name)}<ArrowUpRight size={13}/></Link></li>)}</ul>
     </div>
     <div className="bc-sheet-actions">
      <Link className="bc-primary" to={`/atlas?focus=${encodeURIComponent(region.muscles[0].concept)}`}>{t.sheet.view}<ArrowUpRight size={16}/></Link>
      <button type="button" className="bc-quiet" onClick={()=>remove(region.id)}>{t.sheet.remove}</button>
     </div>
     <p className="bc-note">{t.sheet.note}</p>
    </aside>}
    <div className="bc-row">
     <article className="bc-card bc-glass">
      <div className="bc-card-head"><span className="bc-icon"><Activity size={17}/></span><h2>{t.measure.title}</h2></div>
      <p>{t.measure.text}</p>
      <Link className="bc-start" to="/atlas?open=rom">{t.measure.start}</Link>
     </article>
     <button type="button" className="bc-card bc-add bc-glass" onClick={()=>{setAdding(a=>!a);setOpen(null);}} aria-pressed={adding} aria-label={t.log}><Plus size={22}/></button>
    </div>
    <article className="bc-card bc-heart bc-glass">
     <div className="bc-card-head"><span className="bc-icon"><HeartPulse size={17}/></span><h2>{t.heart.title}</h2></div>
     <p>{t.heart.text}</p>
     <Link className="bc-link" to="/atlas?focus=heart">{t.heart.open}<ArrowUpRight size={15}/></Link>
     <div className="bc-heart-art"><Suspense fallback={null}><CrystalHeart/></Suspense></div>
    </article>
   </section>
  </div>

  <nav className="bc-dock bc-glass" aria-label={t.dock.label}>
   <Link to="/body" className="is-active" aria-current="page" aria-label={t.dock.body}><HandHeart size={21}/></Link>
   <Link to="/atlas" aria-label={t.dock.atlas}><PersonStanding size={21}/></Link>
   <Link to="/atlas?open=rom" aria-label={t.dock.measure}><Activity size={20}/></Link>
   <Link to="/atlas?open=ai" aria-label={t.dock.ai}><Sparkles size={20}/></Link>
  </nav>
 </div>;
}
