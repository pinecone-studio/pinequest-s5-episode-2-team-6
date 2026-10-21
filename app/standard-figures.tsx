import {useEffect,useState,type CSSProperties} from 'react';
import {ArrowUpRight,ChevronLeft,ChevronRight,Maximize2} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {ANATOMY_STANDARD_LICENSE,loadStandardPage,standardImageUrl,type StandardFigure,type StandardPage} from './anatomy-standard';

/** Loads the Anatomy Standard figure index entry for a reference link; null while loading or when the page has no figures. */
export function useStandardPage(url:string|undefined){
 const [page,setPage]=useState<{url:string,page:StandardPage|null}|null>(null);
 useEffect(()=>{if(!url)return;let live=true;loadStandardPage(url).then(p=>{if(live)setPage({url,page:p});}).catch(()=>{if(live)setPage({url,page:null});});return()=>{live=false;};},[url]);
 return page&&page.url===url?page.page:null;
}

// Labels sit on top of the drawing; an alternate view replaces it.
function Figure({figure,showOverlay}:{figure:StandardFigure,showOverlay:boolean}){
 const swap=figure.overlayKind==='alternate'&&showOverlay;
 return <div className="standard-figure-frame" style={{aspectRatio:String(figure.aspect),'--fig-aspect':figure.aspect} as CSSProperties}>
  <img src={standardImageUrl(swap?figure.overlay:figure.base)} alt={swap?figure.overlayAlt:figure.alt} loading="lazy" decoding="async"/>
  {figure.overlayKind==='labels'&&showOverlay&&<img src={standardImageUrl(figure.overlay)} alt="" aria-hidden="true" loading="lazy" decoding="async"/>}
 </div>;
}

export function StandardFigures({page,link}:{page:StandardPage,link:string}){
 const [index,setIndex]=useState(0),[overlay,setOverlay]=useState(true),[zoom,setZoom]=useState(false);
 const count=page.figures.length,figure=page.figures[Math.min(index,count-1)];
 const step=(d:number)=>setIndex(i=>(i+d+count)%count);
 const toggleLabel=figure.overlayKind==='labels'?(overlay?'Hide labels':'Show labels'):(overlay?'First view':'Second view');
 const controls=<div className="standard-figure-controls">
  <Button variant="ghost" size="icon-sm" onClick={()=>step(-1)} disabled={count<2} aria-label="Previous figure"><ChevronLeft size={16}/></Button>
  <span className="small-number">{index+1} / {count}</span>
  <Button variant="ghost" size="icon-sm" onClick={()=>step(1)} disabled={count<2} aria-label="Next figure"><ChevronRight size={16}/></Button>
  <Button variant="ghost" size="sm" className="standard-figure-toggle" onClick={()=>setOverlay(v=>!v)}>{toggleLabel}</Button>
 </div>;
 const credit=<p className="standard-figure-credit">Figure © <a href={link} target="_blank" rel="noreferrer">Anatomy Standard</a>, J. Šavlovskis &amp; K. Raits · <a href={ANATOMY_STANDARD_LICENSE} target="_blank" rel="noreferrer">CC BY-NC 4.0</a></p>;
 return <section className="standard-figures" aria-label="Anatomy Standard figures">
  <h3>Illustrations</h3>
  <button type="button" className="standard-figure-open" onClick={()=>setZoom(true)} aria-label={`Enlarge: ${figure.alt||page.title}`}><Figure figure={figure} showOverlay={overlay}/><Maximize2 size={14} className="standard-figure-zoom"/></button>
  {controls}
  {figure.caption&&<p className="standard-figure-caption">{figure.caption}</p>}
  {credit}
  <Dialog open={zoom} onOpenChange={setZoom}><DialogContent className="standard-figure-dialog">
   <DialogTitle>{page.title}</DialogTitle>
   <DialogDescription>{figure.caption||figure.alt}</DialogDescription>
   <div className="standard-figure-dialog-body"><Figure figure={figure} showOverlay={overlay}/></div>
   {controls}
   {credit}
   <a className="source-link" href={link} target="_blank" rel="noreferrer">Open this page on Anatomy Standard <ArrowUpRight size={14}/></a>
  </DialogContent></Dialog>
 </section>;
}
