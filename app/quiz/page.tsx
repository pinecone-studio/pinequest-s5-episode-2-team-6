import {useEffect,useMemo,useRef,useState,type CSSProperties} from 'react';
import {Link} from 'react-router-dom';
import {ArrowRight,Box,Check,Clock,ListChecks,RotateCcw,Trophy,X} from 'lucide-react';
import {useAuth} from '../../hooks/use-auth';
import {saveQuizResult} from '../../lib/quiz-store';
import {useLang} from '../locale';
import SiteNav from '../site-nav';
import {QUIZ_COPY} from './copy';
import {QUIZ,quizFor} from './questions';
import './quiz.css';

// The quiz as its own screen: an intro card, one question at a time with the next button pinned to the
// bottom on a phone, then the score and a review. Every answer links to its structure in the 3D atlas, and
// the run is kept for the session so coming back from the atlas lands on the same question.
const BEST='anatomn-quiz-best',RUN='anatomn-quiz-run';
const LETTERS=['A','B','C','D','E','F'];
type Stage='intro'|'play'|'done';
interface Run{stage:Stage;index:number;answers:number[]}
const FRESH:Run={stage:'intro',index:0,answers:[]};
function loadRun():Run{
 try{
  const saved=JSON.parse(sessionStorage.getItem(RUN)??'null');
  if(saved&&['intro','play','done'].includes(saved.stage)&&Number.isInteger(saved.index)&&saved.index>=0&&saved.index<QUIZ.length&&Array.isArray(saved.answers)&&saved.answers.length<=QUIZ.length&&saved.answers.every(Number.isInteger))return {stage:saved.stage,index:saved.index,answers:saved.answers};
 }catch{/* Storage can be blocked in private windows; the quiz starts fresh. */}
 return FRESH;
}
function saveRun(run:Run){try{sessionStorage.setItem(RUN,JSON.stringify(run));}catch{/* The run still works for this visit. */}}
function loadBest(){try{const n=Number(localStorage.getItem(BEST));return Number.isInteger(n)&&n>0?n:0;}catch{return 0;}}
function saveBest(n:number){try{localStorage.setItem(BEST,String(n));}catch{/* The score still shows for this visit. */}}
const atlasLink=(concept:string)=>`/atlas?focus=${encodeURIComponent(concept)}`;

export default function QuizPage(){
 const {lang}=useLang();
 const t=QUIZ_COPY[lang];
 const {user}=useAuth();
 const quiz=useMemo(()=>quizFor(lang),[lang]);
 const [run,setRun]=useState<Run>(loadRun);
 const [best,setBest]=useState(loadBest);
 const page=useRef<HTMLDivElement>(null),heading=useRef<HTMLHeadingElement>(null),moved=useRef(false);
 const {stage,index,answers}=run;
 const question=quiz[index];
 const picked=answers[index]??null;
 const score=answers.filter((answer,i)=>answer===quiz[i].answer).length;
 const last=index>=quiz.length-1;
 useEffect(()=>{saveRun(run);},[run]);
 useEffect(()=>{document.querySelector('meta[name=theme-color]')?.setAttribute('content','#5a8dcb');},[]);
 // Each new screen starts at the top with its heading focused, so a screen reader reads the question.
 useEffect(()=>{
  if(!moved.current){moved.current=true;return;}
  page.current?.scrollTo({top:0});
  heading.current?.focus({preventScroll:true});
 },[stage,index]);
 const start=()=>setRun({stage:'play',index:0,answers:[]});
 const choose=(option:number)=>{
  if(stage!=='play'||picked!==null)return;
  setRun(r=>({...r,answers:[...r.answers.slice(0,r.index),option]}));
 };
 const next=()=>{
  if(picked===null)return;
  if(!last){setRun(r=>({...r,index:r.index+1}));return;}
  // Signed-in users get one saved result per finished run; guests just see the score.
  void saveQuizResult(score,quiz.length,Object.fromEntries(answers.map((answer,i)=>[String(i),answer])));
  if(score>best){setBest(score);saveBest(score);}
  setRun(r=>({...r,stage:'done'}));
 };
 // Number keys pick an answer and Enter moves on, so the quiz also runs from a keyboard.
 useEffect(()=>{
  if(stage!=='play')return;
  const key=(e:KeyboardEvent)=>{
   if(e.metaKey||e.ctrlKey||e.altKey)return;
   const n=Number(e.key);
   if(n>=1&&n<=question.options.length)choose(n-1);
   else if(e.key==='Enter'&&!(e.target instanceof HTMLButtonElement||e.target instanceof HTMLAnchorElement)){e.preventDefault();next();}
  };
  addEventListener('keydown',key);return()=>removeEventListener('keydown',key);
 });

 return <div className="qz" ref={page}>
  <div className="qz-bg" aria-hidden><i/><i/></div>
  <SiteNav tone="glass"/>
  <main className={`qz-shell is-${stage}`}>
   {stage==='intro'&&<section className="qz-card qz-glass qz-intro">
    <span className="qz-icon" aria-hidden><ListChecks size={26}/></span>
    <p className="qz-kicker">{t.kicker}</p>
    <h1 ref={heading} tabIndex={-1}>{t.title}</h1>
    <p className="qz-lead">{t.lead}</p>
    <ul className="qz-facts">
     <li><ListChecks size={15} aria-hidden/>{t.questions(quiz.length)}</li>
     <li><Clock size={15} aria-hidden/>{t.minutes}</li>
     {best>0&&<li><Trophy size={15} aria-hidden/>{t.best(best,quiz.length)}</li>}
    </ul>
    <button type="button" className="qz-primary" onClick={start}>{t.start}<ArrowRight size={18} aria-hidden/></button>
    <p className="qz-note">{user?t.saved:<Link to="/login">{t.guest}</Link>}</p>
   </section>}

   {stage==='play'&&<>
    <div className="qz-top">
     <button type="button" className="qz-quit qz-glass" aria-label={t.quit} title={t.quit} onClick={()=>setRun(FRESH)}><X size={18}/></button>
     <div className="qz-steps" role="progressbar" aria-label={t.progress} aria-valuemin={0} aria-valuemax={quiz.length} aria-valuenow={answers.length} aria-valuetext={t.question(index+1,quiz.length)}>
      {quiz.map((q,i)=><i key={i} className={answers[i]===undefined?(i===index?'is-current':''):answers[i]===q.answer?'is-right':'is-wrong'}/>)}
     </div>
     <span className="qz-score qz-glass"><Check size={14} aria-hidden/>{t.correct(score)}</span>
    </div>
    <section className="qz-card qz-glass qz-question" key={`q${index}`}>
     <p className="qz-kicker">{t.question(index+1,quiz.length)}</p>
     <h1 ref={heading} tabIndex={-1}>{question.prompt}</h1>
    </section>
    <div className="qz-options" role="group" aria-label={t.answers} key={`o${index}`}>
     {question.options.map((option,i)=>{
      const state=picked===null?'':i===question.answer?'is-right':i===picked?'is-wrong':'is-muted';
      return <button key={option} type="button" className={`qz-option qz-glass ${state}`} disabled={picked!==null} onClick={()=>choose(i)}>
       <span className="qz-letter" aria-hidden>{state==='is-right'?<Check size={16}/>:state==='is-wrong'?<X size={16}/>:LETTERS[i]}</span>
       <span className="qz-option-text">{option}</span>
      </button>;
     })}
    </div>
    <div aria-live="polite">{picked!==null&&<section className={`qz-feedback qz-glass ${picked===question.answer?'is-right':'is-wrong'}`}>
     <strong>{picked===question.answer?t.right:t.wrong}</strong>
     <p>{question.explain}</p>
     <Link className="qz-link" to={atlasLink(question.concept)}><Box size={15} aria-hidden/>{t.show3d}</Link>
    </section>}</div>
    <div className="qz-next">
     <button type="button" className="qz-primary" disabled={picked===null} onClick={next}>{picked===null?t.pick:last?t.seeResult:t.next}{picked!==null&&<ArrowRight size={18} aria-hidden/>}</button>
    </div>
   </>}

   {stage==='done'&&<>
    <section className="qz-card qz-glass qz-result">
     <p className="qz-kicker">{t.resultKicker}</p>
     <div className="qz-ring" style={{'--pct':score/quiz.length} as CSSProperties}><strong>{score}<span>/{quiz.length}</span></strong></div>
     <h1 ref={heading} tabIndex={-1}>{score===quiz.length?t.perfect:score>=quiz.length/2?t.half:t.low}</h1>
     <div className="qz-actions">
      <button type="button" className="qz-primary" onClick={start}><RotateCcw size={17} aria-hidden/>{t.restart}</button>
      <Link className="qz-secondary qz-glass" to="/atlas"><Box size={17} aria-hidden/>{t.openAtlas}</Link>
     </div>
    </section>
    <section className="qz-review" aria-labelledby="qz-review-title">
     <h2 id="qz-review-title">{t.review}</h2>
     <ol>
      {quiz.map((q,i)=>{
       const ok=answers[i]===q.answer;
       return <li key={i} className={`qz-glass ${ok?'is-right':'is-wrong'}`}>
        <span className="qz-letter" role="img" aria-label={ok?t.right:t.wrong}>{ok?<Check size={15}/>:<X size={15}/>}</span>
        <div>
         <p className="qz-review-q">{q.prompt}</p>
         {!ok&&answers[i]!==undefined&&<p className="qz-review-a"><span>{t.yourAnswer}:</span> {q.options[answers[i]]}</p>}
         <p className="qz-review-a is-answer"><span>{t.answer}:</span> {q.options[q.answer]}</p>
        </div>
        <Link className="qz-review-3d" to={atlasLink(q.concept)} aria-label={`${t.show3d}: ${q.options[q.answer]}`} title={t.show3d}><Box size={16}/></Link>
       </li>;
      })}
     </ol>
    </section>
   </>}
  </main>
 </div>;
}
