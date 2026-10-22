// Usage counter for the landing page and the atlas. It keeps a small tally per device in
// localStorage (no cookies, no third party) and mirrors the same events to
// VITE_USAGE_ENDPOINT when a deployment sets one, so a server can add up every visitor.
import {useEffect,useState} from 'react';

const KEY='human-atlas-usage';
const env=(import.meta as unknown as {env?:Record<string,string|undefined>}).env;
export const USAGE_ENDPOINT=env?.VITE_USAGE_ENDPOINT??'';

export interface Usage{
  visits:number;    // landing views
  engaged:number;   // visitors that went past the first screen or opened the atlas
  opens:number;     // times the atlas itself was opened
  seconds:number;   // time spent on the landing page
  depth:number;     // deepest scroll reached, in percent
  last:number;      // timestamp of the last visit
}

const blank=():Usage=>({visits:0,engaged:0,opens:0,seconds:0,depth:0,last:0});

function read():Usage{
  try{
    const raw=localStorage.getItem(KEY);
    if(raw)return {...blank(),...(JSON.parse(raw) as Partial<Usage>)};
  }catch{/* Storage can be blocked, so the counters simply stay at zero. */}
  return blank();
}

function write(usage:Usage){
  try{localStorage.setItem(KEY,JSON.stringify(usage));}catch{/* The counter is a nicety, not a requirement. */}
}

type Listener=(usage:Usage)=>void;
const listeners=new Set<Listener>();

function bump(patch:Partial<Usage>):Usage{
  const usage={...read(),...patch,last:Date.now()};
  write(usage);
  for(const listener of listeners)listener(usage);
  return usage;
}

// The optional endpoint collects the same numbers for every visitor: one POST per change,
// and a GET that answers with the running totals.
async function post(event:string,usage:Usage){
  if(!USAGE_ENDPOINT)return;
  try{
    await fetch(USAGE_ENDPOINT,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({event,...usage}),keepalive:true});
  }catch{/* Offline or blocked: the local tally still works. */}
}

let visited=false,engaged=false,opened=false;

// A landing view, counted once per page load.
export function trackVisit(){
  if(visited)return;
  visited=true;
  const usage=bump({visits:read().visits+1});
  post('visit',usage);
}

// A visitor that read past the first screen, pressed a call to action or opened the atlas.
export function trackEngaged(){
  if(engaged)return;
  engaged=true;
  const usage=bump({engaged:read().engaged+1});
  post('engage',usage);
}

// The atlas itself.
export function trackOpen(){
  if(opened)return;
  opened=true;
  const usage=bump({opens:read().opens+1});
  post('open',usage);
}

// How far down the landing page the visitor got. Past the fold counts as engagement.
export function trackDepth(percent:number){
  const current=read();
  if(percent<=current.depth)return;
  const usage=bump({depth:percent});
  if(percent>=60)trackEngaged();
  post('depth',usage);
}

export function addSeconds(seconds:number){
  if(seconds<1)return;
  const usage=bump({seconds:read().seconds+seconds});
  post('seconds',usage);
}

// Time on the page. The returned function banks the last seconds and stops the timer.
export function startTimer(){
  let last=Date.now();
  const bank=()=>{
    const now=Date.now(),seconds=Math.round((now-last)/1000);
    last=now;
    if(seconds>0)addSeconds(seconds);
  };
  const interval=setInterval(bank,10000);
  const onVisibility=()=>{if(document.visibilityState==='hidden')bank();};
  document.addEventListener('visibilitychange',onVisibility);
  return()=>{clearInterval(interval);document.removeEventListener('visibilitychange',onVisibility);bank();};
}

// The counters for the landing page: the local tally, plus the global totals when an
// endpoint is configured and answers with them.
export function useUsage():{usage:Usage;totals:Usage|null}{
  const [usage,setUsage]=useState<Usage>(read);
  const [totals,setTotals]=useState<Usage|null>(null);
  useEffect(()=>{
    listeners.add(setUsage);
    return()=>{listeners.delete(setUsage);};
  },[]);
  useEffect(()=>{
    if(!USAGE_ENDPOINT)return;
    let live=true;
    fetch(USAGE_ENDPOINT,{headers:{accept:'application/json'}})
      .then(r=>r.ok?r.json():null)
      .then((data:unknown)=>{
        if(!live||!data||typeof data!=='object')return;
        const totals=data as Partial<Usage>;
        if(typeof totals.visits==='number')setTotals({...blank(),...totals});
      })
      .catch(()=>{});
    return()=>{live=false;};
  },[]);
  return {usage,totals};
}
