import {useEffect,useState} from 'react';
import type {Part} from './anatomy';
import {useLang} from './locale';
import {fetchAssistantHealth,streamAssistant} from './llm-client';
import {plaqueEffectsRequest,plaqueSupply} from './plaque-effects-request';
const cache=new Map<string,{text:string;provider:string}>();
export default function PlaqueEffects({part,narrowing}:{part:Part;narrowing:number}){
 const {lang}=useLang(),mn=lang==='mn',supply=plaqueSupply(part,lang),[retry,setRetry]=useState(0),[answer,setAnswer]=useState(''),[provider,setProvider]=useState(''),[busy,setBusy]=useState(false),[failed,setFailed]=useState(false);
 useEffect(()=>{
  const key=`${part.id}:${narrowing}:${lang}`,cached=cache.get(key);setAnswer(cached?.text??'');setProvider(cached?.provider??'');setFailed(false);setBusy(!cached);
  if(cached)return;
  let cancelled=false;const abort=new AbortController(),deadline=setTimeout(()=>abort.abort(),30000);
  const timer=setTimeout(async()=>{let text='';try{
   const health=await fetchAssistantHealth(abort.signal);if(cancelled)return;if(!health.configured)throw new Error('AI unavailable');setProvider(health.provider??'AI');
   await streamAssistant(plaqueEffectsRequest(part,narrowing,lang),{signal:abort.signal,onDelta:delta=>{if(!cancelled){text+=delta;setAnswer(text);}}});
   if(!text.trim())throw new Error('Empty explanation');
   if(!cancelled){cache.set(key,{text,provider:health.provider??'AI'});if(cache.size>20)cache.delete(cache.keys().next().value!);}
  }catch{if(!cancelled)setFailed(true);}finally{clearTimeout(deadline);if(!cancelled)setBusy(false);}},800);
  return()=>{cancelled=true;clearTimeout(timer);clearTimeout(deadline);abort.abort();};
 },[part,narrowing,lang,retry]);
 return <section className="rom-muscles-card plaque-effects" aria-busy={busy}>
  <h3>{mn?'Эрхтэнд үзүүлэх нөлөө':'Effects on supplied organs'} · {part.name}</h3><p>{supply?.text??(mn?'Эрхтний хангамж зураглагдаагүй; тодорхой эрхтэн таамаглахгүй.':'Supply territory is not mapped; a specific organ cannot be confirmed.')}</p>
  <p>{mn?'AI сургалтын тайлбар. Мэргэжлийн хяналт шаардлагатай; урсгал, эрхтний гэмтлийг хэмжихгүй.':'AI-generated teaching explanation; expert review is needed. This does not measure blood flow or organ damage.'} {provider&&`(${provider})`}</p>
  {busy&&<p role="status">{mn?'Тайлбар бэлдэж байна…':'Preparing explanation…'}</p>}{answer&&<div className="plaque-effects-text">{answer}</div>}
  {failed&&<p role="alert">{mn?'AI тайлбар боломжгүй эсвэл дутуу байна. Дээрх атласын мэдээллийг ашиглана уу.':'The AI explanation is unavailable or incomplete. The atlas reference above remains available.'} <button onClick={()=>setRetry(value=>value+1)}>{mn?'Дахин оролдох':'Retry'}</button></p>}
  <a href="https://www.nhlbi.nih.gov/health/atherosclerosis" target="_blank" rel="noreferrer">NHLBI · {mn?'Ерөнхий механизм':'General mechanism'} ↗</a>
 </section>;
}
