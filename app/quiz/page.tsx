import {useEffect,useMemo,useRef,useState,type CSSProperties,type ReactNode} from 'react';
import {Link,useSearchParams} from 'react-router-dom';
import {ArrowRight,BicepsFlexed,Bone,Box,Brain,Check,CircleAlert,Clock,Flame,HeartPulse,Link2,ListChecks,LoaderCircle,RotateCcw,Settings2,Shuffle,Sparkles,Stethoscope,Timer,Trophy,X,type LucideIcon} from 'lucide-react';
import {useAuth} from '../../hooks/use-auth';
import {saveQuizResult} from '../../lib/quiz-store';
import {useLang} from '../locale';
import SiteNav from '../site-nav';
import {QUIZ_COPY} from './copy';
import {QUIZ,QUIZ_LEVELS,QUIZ_TOPICS,dealOptions,dealQuiz,matching,quizFor,type Dealt,type LevelChoice,type QuizQuestion,type QuizTopic,type TopicChoice} from './questions';
import './quiz.css';

// The quiz as its own screen. A setup card picks the topic, level, length and source; the run is dealt from
// the bank (or written by the assistant) with the options shuffled, then it is one question at a time with the
// next button pinned to the bottom on a phone, and last the score, a per-topic breakdown and a review. Every
// answer links to its structure in the 3D atlas, and the run is kept for the session so coming back from the
// atlas lands on the same question.
const BEST='anatomn-quiz-best-v2',RUN='anatomn-quiz-run-v2',SETUP='anatomn-quiz-setup';
const LETTERS=['A','B','C','D','E','F'];
const SECONDS=30;
const LENGTHS=[5,10,15,20],AI_LENGTHS=[5,10];
const TOPIC_CHOICES:TopicChoice[]=['mixed',...QUIZ_TOPICS];
const LEVEL_CHOICES:LevelChoice[]=[0,...QUIZ_LEVELS];
const ICONS:Record<TopicChoice,LucideIcon>={mixed:Shuffle,bones:Bone,muscles:BicepsFlexed,nerves:Brain,joints:Link2,heart:HeartPulse,organs:Stethoscope};
const BY_ID=new Map(QUIZ.map(q=>[q.id,q]));

type Stage='setup'|'play'|'done';
type Source='bank'|'ai';
interface Setup{topic:TopicChoice;level:LevelChoice;count:number;timed:boolean;source:Source}
interface Run{
 stage:Stage;setup:Setup;
 deck:Dealt[];            // which questions, and the order their options are shown in
 ai:QuizQuestion[];       // questions the assistant wrote for this run, dealt by their ai-N id
 retry:boolean;           // a rerun of the questions missed last time
 index:number;
 answers:number[];        // the picked option as an index into the question's own options; -1 ran out of time
 started:number;finished:number;
 deadline:number;         // timed runs: when the current question runs out
 newBest:boolean;
}
const DEFAULT_SETUP:Setup={topic:'mixed',level:0,count:10,timed:false,source:'bank'};
const fresh=(setup:Setup):Run=>({stage:'setup',setup,deck:[],ai:[],retry:false,index:0,answers:[],started:0,finished:0,deadline:0,newBest:false});

// Saved state is read back defensively: storage can hold a run from an older bank or be blocked outright.
const int=(n:unknown,min:number,max:number)=>Number.isInteger(n)&&(n as number)>=min&&(n as number)<=max;
const num=(n:unknown)=>typeof n==='number'&&Number.isFinite(n);
function validSetup(s:Partial<Setup>|null|undefined):s is Setup{
 return !!s&&TOPIC_CHOICES.includes(s.topic as TopicChoice)&&LEVEL_CHOICES.includes(s.level as LevelChoice)&&LENGTHS.includes(s.count as number)&&typeof s.timed==='boolean'&&(s.source==='bank'||s.source==='ai');
}
function validQuestion(q:Partial<QuizQuestion>):q is QuizQuestion{
 return typeof q.id==='string'&&QUIZ_TOPICS.includes(q.topic as QuizTopic)&&QUIZ_LEVELS.includes(q.level as 1)&&typeof q.prompt==='string'&&typeof q.concept==='string'&&typeof q.explain==='string'&&Array.isArray(q.options)&&q.options.length>=2&&q.options.every(o=>typeof o==='string')&&int(q.answer,0,q.options.length-1);
}
const resolve=(id:string,ai:QuizQuestion[])=>BY_ID.get(id)??ai.find(q=>q.id===id);
function validRun(r:Partial<Run>):r is Run{
 if(!r||!['setup','play','done'].includes(r.stage as Stage)||!validSetup(r.setup)||!Array.isArray(r.deck)||!Array.isArray(r.ai)||!Array.isArray(r.answers))return false;
 if(!r.ai.every(validQuestion)||![r.started,r.finished,r.deadline].every(num)||typeof r.retry!=='boolean'||typeof r.newBest!=='boolean')return false;
 const ai=r.ai;
 const questions=r.deck.map(d=>d&&typeof d.id==='string'&&Array.isArray(d.order)?resolve(d.id,ai):undefined);
 if(questions.some((q,i)=>!q||[...r.deck![i].order].sort((a,b)=>a-b).join()!==q.options.map((_,n)=>n).join()))return false;
 if(r.stage==='setup')return true;
 return r.deck.length>0&&int(r.index,0,r.deck.length-1)&&r.answers.length<=r.deck.length&&r.answers.every((a,i)=>int(a,-1,questions[i]!.options.length-1));
}
function read<T>(store:()=>Storage,key:string,valid:(v:T)=>boolean):T|null{
 try{const v=JSON.parse(store().getItem(key)??'null') as T;return v!==null&&valid(v)?v:null;}catch{return null;}
}
function write(store:()=>Storage,key:string,value:unknown){try{store().setItem(key,JSON.stringify(value));}catch{/* The quiz still works for this visit. */}}
const session=()=>sessionStorage,local=()=>localStorage;
const loadRun=():Run=>read<Run>(session,RUN,validRun)??fresh(read<Setup>(local,SETUP,validSetup)??DEFAULT_SETUP);
const loadBest=():Record<string,number>=>read<Record<string,number>>(local,BEST,v=>typeof v==='object'&&!Array.isArray(v))??{};

const atlasLink=(concept:string)=>`/atlas?focus=${encodeURIComponent(concept)}`;
const clock=(ms:number)=>{const s=Math.max(0,Math.round(ms/1000));return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;};
/** Longest run of right answers, and the run that is still going at the end. */
function streaks(right:boolean[]){let best=0,now=0;for(const ok of right){now=ok?now+1:0;best=Math.max(best,now);}return {best,now};}

/** One row of radio chips. Native radios keep arrow-key movement and screen reader grouping for free. */
function Chips<T extends string|number>({name,label,value,choices,text,onChange}:{name:string;label:string;value:T;choices:T[];text:(v:T)=>ReactNode;onChange:(v:T)=>void}){
 return <fieldset className="qz-field">
  <legend>{label}</legend>
  <div className="qz-chips">
   {choices.map(choice=><label key={String(choice)} className="qz-chip">
    <input type="radio" name={name} checked={value===choice} onChange={()=>onChange(choice)}/>
    <span>{text(choice)}</span>
   </label>)}
  </div>
 </fieldset>;
}

export default function QuizPage(){
 const {lang}=useLang();
 const t=QUIZ_COPY[lang];
 const {user}=useAuth();
 const [params,setParams]=useSearchParams();
 const bank=useMemo(()=>new Map(quizFor(lang).map(q=>[q.id,q])),[lang]);
 const [run,setRun]=useState<Run>(loadRun);
 const [best,setBest]=useState(loadBest);
 const [now,setNow]=useState(Date.now);
 const [busy,setBusy]=useState(false);
 const [aiError,setAiError]=useState('');
 const [filter,setFilter]=useState<'all'|'wrong'>('all');
 const page=useRef<HTMLDivElement>(null),heading=useRef<HTMLHeadingElement>(null),moved=useRef(false),request=useRef<AbortController|null>(null);
 const {stage,setup,deck,index,answers}=run;
 const questions=useMemo(()=>deck.map(d=>bank.get(d.id)??run.ai.find(q=>q.id===d.id)!),[deck,bank,run.ai]);
 const question=questions[index];
 const order=deck[index]?.order??[];
 const picked=answers[index]??null;
 const right=answers.map((a,i)=>a===questions[i]?.answer);
 const score=right.filter(Boolean).length;
 const last=index>=deck.length-1;
 const streak=streaks(right);
 const pool=matching(QUIZ,setup.topic,setup.level);
 const lengths=setup.source==='ai'?AI_LENGTHS:LENGTHS;
 const total=setup.source==='ai'?setup.count:Math.min(setup.count,pool.length);
 const remaining=run.deadline?Math.min(SECONDS*1000,Math.max(0,run.deadline-now)):0;

 useEffect(()=>{write(session,RUN,run);},[run]);
 useEffect(()=>{write(local,SETUP,setup);},[setup]);
 useEffect(()=>{document.querySelector('meta[name=theme-color]')?.setAttribute('content','#5a8dcb');},[]);
 useEffect(()=>()=>request.current?.abort(),[]);
 // The assistant can send a visitor here with ?topic=bones; it picks the topic unless a run is under way.
 useEffect(()=>{
  const topic=params.get('topic') as TopicChoice|null;
  if(!topic)return;
  if(TOPIC_CHOICES.includes(topic))setRun(r=>r.stage==='play'?r:fresh({...r.setup,topic}));
  setParams(p=>{const kept=new URLSearchParams(p);kept.delete('topic');return kept;},{replace:true});
 },[params,setParams]);
 // Each new screen starts at the top with its heading focused, so a screen reader reads the question.
 useEffect(()=>{
  if(!moved.current){moved.current=true;return;}
  page.current?.scrollTo({top:0});
  heading.current?.focus({preventScroll:true});
 },[stage,index]);
 // A timed question that runs out counts as missed.
 useEffect(()=>{
  if(stage!=='play'||!run.deadline||picked!==null)return;
  const tick=()=>{
   const time=Date.now();setNow(time);
   if(time>=run.deadline)setRun(r=>r.answers[r.index]===undefined?{...r,answers:[...r.answers.slice(0,r.index),-1]}:r);
  };
  tick();
  const id=setInterval(tick,250);
  return()=>clearInterval(id);
 },[stage,run.deadline,picked]);

 const change=(patch:Partial<Setup>)=>{setAiError('');setRun(r=>({...r,setup:{...r.setup,...patch}}));};
 const play=(cards:Dealt[],ai:QuizQuestion[],retry:boolean,base:Setup)=>{
  const time=Date.now();
  setFilter('all');
  setRun({...fresh(base),stage:'play',deck:cards,ai,retry,started:time,deadline:base.timed?time+SECONDS*1000:0});
 };
 const generate=async(base:Setup)=>{
  request.current?.abort();
  const controller=new AbortController();request.current=controller;
  setBusy(true);setAiError('');
  setRun(r=>({...fresh(base),setup:r.setup}));
  try{
   const response=await fetch('/api/exam',{method:'POST',headers:{'content-type':'application/json'},signal:controller.signal,
    body:JSON.stringify({mode:'quiz',lang,topic:base.topic,level:base.level||undefined,count:Math.min(base.count,10)})});
   const body=await response.json().catch(()=>null) as {ok?:boolean;questions?:Omit<QuizQuestion,'id'>[]}|null;
   const ai=(body?.ok?body.questions??[]:[]).map((q,i)=>({...q,id:`ai-${i}`})).filter(validQuestion);
   if(!ai.length){setAiError(response.status===429?t.aiBusy:t.aiFailed);return;}
   play(ai.map(q=>({id:q.id,order:dealOptions(q)})),ai,false,base);
  }catch(error){
   if((error as Error).name!=='AbortError')setAiError(t.aiFailed);
  }finally{
   if(request.current===controller){request.current=null;setBusy(false);}
  }
 };
 const begin=(base:Setup=setup)=>{
  if(base.source==='ai'){void generate(base);return;}
  const cards=dealQuiz(matching(QUIZ,base.topic,base.level),base.count);
  if(cards.length)play(cards,[],false,base);
 };
 const retryWrong=()=>{
  const missed=deck.filter((_,i)=>!right[i]).map(d=>resolve(d.id,run.ai)!);
  play(dealQuiz(missed,missed.length),run.ai,true,setup);
 };
 const choose=(shown:number)=>{
  if(stage!=='play'||picked!==null||shown>=order.length)return;
  setRun(r=>({...r,answers:[...r.answers.slice(0,r.index),order[shown]]}));
 };
 const next=()=>{
  if(picked===null)return;
  if(!last){setRun(r=>({...r,index:r.index+1,deadline:r.setup.timed?Date.now()+SECONDS*1000:0}));return;}
  const finished=Date.now();
  const pct=Math.round(score/deck.length*100);
  // Reruns of missed questions are practice on practice, so they never set a best.
  const newBest=!run.retry&&pct>(best[setup.topic]??0);
  if(newBest){const updated={...best,[setup.topic]:pct};setBest(updated);write(local,BEST,updated);}
  // Signed-in users get one saved result per finished run; guests just see the score.
  void saveQuizResult(score,deck.length,{
   v:2,topic:setup.topic,level:setup.level,source:run.ai.length?'ai':'bank',retry:run.retry,seconds:Math.round((finished-run.started)/1000),
   items:deck.map((d,i)=>({id:d.id,topic:questions[i].topic,concept:questions[i].concept,correct:right[i]})),
  });
  setRun(r=>({...r,stage:'done',finished,deadline:0,newBest}));
 };
 // Number keys pick an answer and Enter moves on, so the quiz also runs from a keyboard.
 useEffect(()=>{
  if(stage!=='play')return;
  const key=(e:KeyboardEvent)=>{
   if(e.metaKey||e.ctrlKey||e.altKey)return;
   const n=Number(e.key);
   if(n>=1&&n<=order.length)choose(n-1);
   else if(e.key==='Enter'&&!(e.target instanceof HTMLButtonElement||e.target instanceof HTMLAnchorElement)){e.preventDefault();next();}
  };
  addEventListener('keydown',key);return()=>removeEventListener('keydown',key);
 });

 const message=setup.source==='ai'?t.aiHint:pool.length===0?t.none:pool.length<setup.count?t.fewer(pool.length):'';
 const missed=deck.length-score;
 const topics=QUIZ_TOPICS.filter(topic=>questions.some(q=>q.topic===topic));
 const reviewed=questions.map((q,i)=>({q,i})).filter(({i})=>filter==='all'||!right[i]);

 return <div className="qz" ref={page}>
  <div className="qz-bg" aria-hidden><i/><i/></div>
  <SiteNav tone="glass"/>
  <main className={`qz-shell is-${stage}`}>
   {stage==='setup'&&<section className="qz-card qz-glass qz-intro" aria-busy={busy}>
    <span className="qz-icon" aria-hidden><ListChecks size={26}/></span>
    <p className="qz-kicker">{t.kicker}</p>
    <h1 ref={heading} tabIndex={-1}>{t.title}</h1>
    <p className="qz-lead">{t.lead}</p>

    <fieldset className="qz-form" disabled={busy}>
    <fieldset className="qz-field">
     <legend>{t.topic}</legend>
     <div className="qz-topics">
      {TOPIC_CHOICES.map(id=>{
       const Icon=ICONS[id];
       return <label key={id} className="qz-topic">
        <input type="radio" name="qz-topic" checked={setup.topic===id} onChange={()=>change({topic:id})}/>
        <span><Icon size={20} aria-hidden/><b>{t.topics[id]}</b><small>{t.inBank(matching(QUIZ,id,setup.level).length)}</small></span>
       </label>;
      })}
     </div>
    </fieldset>
    <Chips name="qz-level" label={t.level} value={setup.level} choices={LEVEL_CHOICES} text={l=>t.levels[l]} onChange={level=>change({level})}/>
    <Chips name="qz-source" label={t.source} value={setup.source} choices={['bank','ai'] as Source[]} text={s=>s==='ai'?<><Sparkles size={14} aria-hidden/>{t.sourceAi}</>:t.sourceBank}
     onChange={source=>change({source,count:source==='ai'?Math.min(setup.count,10):setup.count})}/>
    <Chips name="qz-length" label={t.length} value={setup.count} choices={lengths} text={n=>n} onChange={count=>change({count})}/>
    <fieldset className="qz-field">
     <legend>{t.options}</legend>
     <label className="qz-switch">
      <input type="checkbox" role="switch" checked={setup.timed} onChange={e=>change({timed:e.target.checked})}/>
      <span aria-hidden/>
      <b><Timer size={15} aria-hidden/>{t.timed}</b><small>{t.timedHint(SECONDS)}</small>
     </label>
    </fieldset>
    </fieldset>

    <ul className="qz-facts">
     <li><ListChecks size={15} aria-hidden/>{t.questions(total)}</li>
     <li><Clock size={15} aria-hidden/>{t.minutes(Math.max(1,Math.round(total*(setup.timed?.5:.3))))}</li>
     {best[setup.topic]>0&&<li><Trophy size={15} aria-hidden/>{t.best(best[setup.topic])}</li>}
    </ul>
    <div aria-live="polite" className="qz-notices">
     {aiError?<p className="qz-notice is-error"><CircleAlert size={16} aria-hidden/>{aiError}</p>:message&&<p className="qz-notice">{message}</p>}
    </div>
    <button type="button" className="qz-primary" disabled={busy||total===0} onClick={()=>begin()}>
     {busy?<><LoaderCircle size={18} className="qz-spin" aria-hidden/>{t.generating}</>:<>{setup.source==='ai'?t.generate:t.start}<ArrowRight size={18} aria-hidden/></>}
    </button>
    {aiError&&pool.length>0&&<button type="button" className="qz-secondary qz-glass qz-wide" onClick={()=>begin({...setup,source:'bank'})}><ListChecks size={17} aria-hidden/>{t.useBank}</button>}
    <p className="qz-note">{user?t.saved:<Link to="/login">{t.guest}</Link>}</p>
   </section>}

   {stage==='play'&&question&&<>
    <div className="qz-top">
     <button type="button" className="qz-quit qz-glass" aria-label={t.quit} title={t.quit} onClick={()=>setRun(r=>fresh(r.setup))}><X size={18}/></button>
     <div className="qz-steps" role="progressbar" aria-label={t.progress} aria-valuemin={0} aria-valuemax={deck.length} aria-valuenow={answers.length} aria-valuetext={t.question(index+1,deck.length)}>
      {deck.map((_,i)=><i key={i} className={answers[i]===undefined?(i===index?'is-current':''):right[i]?'is-right':'is-wrong'}/>)}
     </div>
     <span className="qz-score qz-glass"><Check size={14} aria-hidden/>{t.correct(score)}</span>
    </div>
    <section className="qz-card qz-glass qz-question" key={`q${index}`}>
     <div className="qz-meta">
      <p className="qz-kicker">{t.question(index+1,deck.length)}</p>
      <span className="qz-tag">{t.topics[question.topic]}</span>
      <span className="qz-tag">{t.levels[question.level]}</span>
      {question.id.startsWith('ai-')&&<span className="qz-tag"><Sparkles size={12} aria-hidden/>{t.aiMade}</span>}
      {streak.now>=3&&<span className="qz-tag is-hot"><Flame size={12} aria-hidden/>{t.streak(streak.now)}</span>}
     </div>
     <h1 ref={heading} tabIndex={-1}>{question.prompt}</h1>
     {run.deadline>0&&<div className={`qz-timer ${picked===null&&remaining<=10000?'is-low':''}`} role="timer" aria-label={t.timeLeft}>
      {/* The clock stops ticking once an answer is in, so it stays at the time that was left. */}
      <i style={{'--left':remaining/(SECONDS*1000)} as CSSProperties}/>
      <span>{clock(remaining)}</span>
     </div>}
    </section>
    <div className="qz-options" role="group" aria-label={t.answers} key={`o${index}`}>
     {order.map((option,i)=>{
      const state=picked===null?'':option===question.answer?'is-right':option===picked?'is-wrong':'is-muted';
      return <button key={option} type="button" className={`qz-option qz-glass ${state}`} disabled={picked!==null} onClick={()=>choose(i)}>
       <span className="qz-letter" aria-hidden>{state==='is-right'?<Check size={16}/>:state==='is-wrong'?<X size={16}/>:LETTERS[i]}</span>
       <span className="qz-option-text">{question.options[option]}</span>
      </button>;
     })}
    </div>
    <div aria-live="polite">{picked!==null&&<section className={`qz-feedback qz-glass ${right[index]?'is-right':'is-wrong'}`}>
     <strong>{right[index]?t.right:picked===-1?t.timeout:t.wrong}</strong>
     {!right[index]&&<p className="qz-feedback-answer"><span>{t.answer}:</span> {question.options[question.answer]}</p>}
     {question.explain&&<p>{question.explain}</p>}
     {question.concept&&<Link className="qz-link" to={atlasLink(question.concept)}><Box size={15} aria-hidden/>{t.show3d}</Link>}
    </section>}</div>
    <div className="qz-next">
     <button type="button" className="qz-primary" disabled={picked===null} onClick={next}>{picked===null?t.pick:last?t.seeResult:t.next}{picked!==null&&<ArrowRight size={18} aria-hidden/>}</button>
     <p className="qz-keys" aria-hidden>{t.keys}</p>
    </div>
   </>}

   {stage==='done'&&<>
    <section className="qz-card qz-glass qz-result">
     <p className="qz-kicker">{t.resultKicker}{run.retry?` · ${t.filterWrong}`:''}</p>
     <div className="qz-ring" style={{'--pct':score/deck.length} as CSSProperties}><strong>{score}<span>/{deck.length}</span></strong></div>
     {run.newBest&&<span className="qz-badge"><Trophy size={14} aria-hidden/>{t.newBest}</span>}
     <h1 ref={heading} tabIndex={-1}>{score===deck.length?t.perfect:score>=deck.length/2?t.half:t.low}</h1>
     <dl className="qz-stats">
      <div><dt>{t.accuracy}</dt><dd>{Math.round(score/deck.length*100)}%</dd></div>
      <div><dt>{t.time}</dt><dd>{clock(run.finished-run.started)}</dd></div>
      <div><dt>{t.bestStreak}</dt><dd>{streak.best}</dd></div>
     </dl>
     {topics.length>1&&<div className="qz-breakdown">
      <h2>{t.byTopic}</h2>
      <ul>
       {topics.map(topic=>{
        const Icon=ICONS[topic];
        const mine=questions.map((q,i)=>({q,i})).filter(({q})=>q.topic===topic);
        const ok=mine.filter(({i})=>right[i]).length;
        return <li key={topic}>
         <span className="qz-breakdown-name"><Icon size={15} aria-hidden/><span>{t.topics[topic]}</span></span>
         <span className="qz-bar" aria-hidden><i style={{'--pct':ok/mine.length} as CSSProperties}/></span>
         <span className="qz-breakdown-n">{ok}/{mine.length}</span>
        </li>;
       })}
      </ul>
     </div>}
     <div className="qz-actions">
      {missed>0?<button type="button" className="qz-primary" onClick={retryWrong}><RotateCcw size={17} aria-hidden/>{t.retryWrong(missed)}</button>
       :<button type="button" className="qz-primary" onClick={()=>begin()}><Shuffle size={17} aria-hidden/>{t.again}</button>}
      {missed>0&&<button type="button" className="qz-secondary qz-glass" onClick={()=>begin()}><Shuffle size={17} aria-hidden/>{t.again}</button>}
     </div>
     <div className="qz-actions is-quiet">
      <button type="button" className="qz-secondary qz-glass" onClick={()=>setRun(r=>fresh(r.setup))}><Settings2 size={17} aria-hidden/>{t.change}</button>
      <Link className="qz-secondary qz-glass" to="/atlas"><Box size={17} aria-hidden/>{t.openAtlas}</Link>
     </div>
    </section>
    <section className="qz-review" aria-labelledby="qz-review-title">
     <div className="qz-review-head">
      <h2 id="qz-review-title">{t.review}</h2>
      <div className="qz-chips is-small">
       {(['all','wrong'] as const).map(f=><label key={f} className="qz-chip">
        <input type="radio" name="qz-filter" checked={filter===f} onChange={()=>setFilter(f)}/>
        <span>{f==='all'?t.filterAll:`${t.filterWrong} · ${missed}`}</span>
       </label>)}
      </div>
     </div>
     {reviewed.length===0&&<p className="qz-empty qz-glass">{t.allRight}</p>}
     <ol>
      {reviewed.map(({q,i})=>{
       const ok=right[i];
       return <li key={i} className={`qz-glass ${ok?'is-right':'is-wrong'}`}>
        <span className="qz-letter" role="img" aria-label={ok?t.right:t.wrong}>{ok?<Check size={15}/>:<X size={15}/>}</span>
        <div>
         <p className="qz-review-q">{q.prompt}</p>
         {!ok&&<p className="qz-review-a"><span>{t.yourAnswer}:</span> {answers[i]===-1?t.noAnswer:q.options[answers[i]]}</p>}
         <p className="qz-review-a is-answer"><span>{t.answer}:</span> {q.options[q.answer]}</p>
         {!ok&&q.explain&&<p className="qz-review-x">{q.explain}</p>}
        </div>
        {q.concept&&<Link className="qz-review-3d" to={atlasLink(q.concept)} aria-label={`${t.show3d}: ${q.options[q.answer]}`} title={t.show3d}><Box size={16}/></Link>}
       </li>;
      })}
     </ol>
    </section>
   </>}
  </main>
 </div>;
}
