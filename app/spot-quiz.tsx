import {useCallback,useEffect,useMemo,useState} from 'react';
import {Check,X} from 'lucide-react';
import {Button} from '@/components/ui/button';
import type {Atlas,Concept,SystemId} from './anatomy';
import {latinName} from './latin-terms';
import {mongolianName} from './mongolian-names';
import {useLang} from './locale';

// The practical exam of an anatomy course: a pinned structure on a specimen and "name it". The atlas highlights one
// structure, the student picks its name from four, and the answer shows with its Latin. Only structures with a
// curated Latin name (and, for the Mongolian interface, a Mongolian one) are asked, so every answer reads cleanly.

type Topic='bones'|'muscles'|'organs'|'arteries'|'veins'|'nerves';
const TOPICS:Topic[]=['bones','muscles','organs','arteries','veins','nerves'];
const SYSTEMS:Record<Topic,SystemId[]>={bones:['skeletal'],muscles:['muscular'],organs:['cardiac','respiratory','digestive','urinary','endocrine','reproductive','sensory'],arteries:['arterial'],veins:['venous'],nerves:['nervous']};
// Groupings and fragments are not something one points at on a specimen.
const VAGUE=/\b(set of|subdivision|segment|subsegment|branch|tributary|part of|region|compartment|content|system|tree|zone|lamina|organ|anatomical|cluster|trunk of|surface|wall of|space|sector|layer|cavity|component|neuraxis)\b/i;

interface Question {concept:Concept;options:Concept[];answer:number}

const shuffle=<T,>(list:T[])=>{const copy=[...list];for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}return copy;};

export default function SpotQuiz({atlas,onShow,onOpen,onClose}:{atlas:Atlas;onShow:(concept:Concept)=>void;onOpen:(concept:Concept)=>void;onClose:()=>void}){
 const {lang,t}=useLang();
 const [topic,setTopic]=useState<Topic>('bones');
 const [question,setQuestion]=useState<Question|null>(null),[picked,setPicked]=useState<number|null>(null),[score,setScore]=useState({right:0,total:0});
 const systemOf=useMemo(()=>new Map(atlas.parts.map(p=>[p.id,p.system])),[atlas]);
 // One concept per structure: the side-less concept when the atlas has one, so "left femur" and "femur" are not both asked.
 const pools=useMemo(()=>{
  const names=new Set(atlas.concepts.map(c=>c.name.toLowerCase()));
  const byTopic=Object.fromEntries(TOPICS.map(x=>[x,[] as Concept[]])) as Record<Topic,Concept[]>;
  const seen=new Set<string>();
  for(const c of atlas.concepts){
   const lower=c.name.toLowerCase(),bare=lower.replace(/^(left|right) /,'');
   if(VAGUE.test(lower)||(bare!==lower&&names.has(bare))||!latinName(c.name)||!mongolianName(c.name))continue;
   const key=`${latinName(c.name)}`;if(seen.has(key))continue;seen.add(key);
   const system=systemOf.get(c.elements[0]);
   const found=TOPICS.find(x=>system&&SYSTEMS[x].includes(system));
   if(found)byTopic[found].push(c);
  }
  return byTopic;
 },[atlas,systemOf]);
 const label=(c:Concept)=>{const name=lang==='mn'?(mongolianName(c.name)??c.name):c.name;return name.charAt(0).toUpperCase()+name.slice(1);};
 const deal=useCallback((next:Topic)=>{
  const pool=pools[next];
  if(pool.length<4){setQuestion(null);return;}
  const concept=pool[Math.floor(Math.random()*pool.length)];
  const others=shuffle(pool.filter(c=>c.id!==concept.id&&label(c)!==label(concept))).slice(0,3);
  const options=shuffle([concept,...others]);
  setQuestion({concept,options,answer:options.indexOf(concept)});setPicked(null);onShow(concept);
 },[pools,onShow,lang]);
 useEffect(()=>{deal(topic);},[topic,pools]);
 const choose=(i:number)=>{if(picked!==null||!question)return;setPicked(i);setScore(s=>({right:s.right+(i===question.answer?1:0),total:s.total+1}));};
 const correct=question&&picked!==null?question.options[question.answer]:null;
 return <section className="search-panel spot-panel glass" aria-label={t.spot.label}>
  <div className="panel-heading"><span>{t.spot.title}</span><span className="small-number spot-score">{t.spot.score(score.right,score.total)}</span><Button variant="ghost" className="icon-button" onClick={onClose} aria-label={t.spot.close}><X size={18}/></Button></div>
  <div className="layer-presets spot-topics" role="group" aria-label={t.spot.title}>{TOPICS.map(x=><Button key={x} variant="ghost" aria-pressed={topic===x} onClick={()=>{setTopic(x);if(topic===x)deal(x);}}>{t.spot.topics[x]}</Button>)}</div>
  {question?<>
   <p className="spot-question">{t.spot.question}</p>
   <div className="spot-options">{question.options.map((c,i)=>{const state=picked===null?'':i===question.answer?'is-right':i===picked?'is-wrong':'';return <button key={c.id} type="button" className={`spot-option ${state}`} disabled={picked!==null} onClick={()=>choose(i)}><span>{label(c)}</span>{state==='is-right'&&<Check size={16} aria-hidden/>}{state==='is-wrong'&&<X size={16} aria-hidden/>}</button>;})}</div>
   {correct&&<div className="spot-feedback" role="status"><strong>{picked===question.answer?t.spot.right:t.spot.wrong}</strong> {picked!==question.answer&&label(correct)}<span className="spot-latin" lang="la">{latinName(correct.name)}</span></div>}
   <div className="spot-actions">{correct&&<Button variant="ghost" className="secondary-action" onClick={()=>onOpen(correct)}>{t.spot.openCard}</Button>}<Button className="primary-action" disabled={picked===null} onClick={()=>deal(topic)}>{t.spot.next}</Button></div>
   <p className="search-note">{t.spot.hint}</p>
  </>:<p className="search-note">{t.spot.empty}</p>}
 </section>;
}
