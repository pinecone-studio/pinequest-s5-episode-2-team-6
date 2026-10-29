import {lazy,Suspense,useEffect,useRef,useState,type CSSProperties} from 'react';
import {Link} from 'react-router-dom';
import {ArrowDown,ArrowUpRight,BookOpen,Box,Cpu,Database,Layers,PersonStanding} from 'lucide-react';
import {figureData} from './figure-data';
import ParticleLogo from './particles';
import {useLandingMotion} from './motion';
import {COPY} from './copy';
import {useLang} from '../locale';
import SiteNav from '../site-nav';
import {startTimer,trackDepth,trackEngaged,trackVisit,useUsage} from '../usage';
import './landing.css';

// three.js and the body arrive after the text; a soft blue placeholder holds their spot until then.
const Figure=lazy(()=>import('./figure'));

const SOURCES=[
  {name:'BodyParts3D',url:'https://lifesciencedb.jp/bp3d/'},
  {name:'Z-Anatomy',url:'https://github.com/LluisV/Z-Anatomy'},
  {name:'Anatomy Standard',url:'https://www.anatomystandard.com/'},
];

const STACK=[
  {icon:Database,name:'BodyParts3D'},
  {icon:Layers,name:'Z-Anatomy'},
  {icon:BookOpen,name:'Anatomy Standard'},
  {icon:Box,name:'three.js'},
  {icon:PersonStanding,name:'MediaPipe'},
  {icon:Cpu,name:'WebGL'},
];

export default function LandingPage(){
  const root=useRef<HTMLDivElement>(null);
  const {lang}=useLang();
  const [figureReady,setFigureReady]=useState(false);
  const t=COPY[lang];
  const {usage,totals}=useUsage();
  const counter=totals??usage;
  // Any call to action counts as the visitor using the page.
  const engage=()=>trackEngaged();
  useLandingMotion(root,lang);
  useEffect(()=>{figureData().catch(()=>{});},[]);
  // Count the visit, bank the time on the page and follow how far the visitor scrolls.
  useEffect(()=>{trackVisit();return startTimer();},[]);
  useEffect(()=>{
    const el=root.current!;
    let last=0;
    const onScroll=()=>{
      const max=el.scrollHeight-el.clientHeight;
      if(max<=0)return;
      const percent=Math.min(100,Math.round(el.scrollTop/max*100));
      if(percent>last+4){last=percent;trackDepth(percent);}
    };
    el.addEventListener('scroll',onScroll,{passive:true});
    return()=>el.removeEventListener('scroll',onScroll);
  },[]);

  return(
    <div className="lp" ref={root}>
      <div className="lp-bg" aria-hidden>
        <i className="lp-blob" style={{'--c':'#2f66f5',left:'8%',top:'18%'} as CSSProperties}/>
        <i className="lp-blob" style={{'--c':'#8fb7ff',left:'58%',top:'6%'} as CSSProperties}/>
        <i className="lp-blob" style={{'--c':'#40d5be',left:'64%',top:'58%'} as CSSProperties}/>
        <i className="lp-blob" style={{'--c':'#3884ff',left:'18%',top:'64%'} as CSSProperties}/>
      </div>
      <Suspense fallback={null}><Figure scroller={root} onReady={()=>setFigureReady(true)}/></Suspense>

      <SiteNav onNavigate={engage}/>

      <main>
        <section className="lp-hero" data-pose="hero" data-index>
          <div className={figureReady?'lp-ghost is-hidden':'lp-ghost'} aria-hidden><i/><i/></div>
          {/* Keyed by language so a switch replays the entrance. */}
          <div className="lp-hero-copy" key={lang}>
            <h1 className="lp-echo">
              {t.hero.lines.map((line,i)=><span key={i} className={i===2?'lp-line lp-strong':'lp-line'} style={{'--d':i} as CSSProperties}>{line}</span>)}
            </h1>
            <p className="lp-hero-lead">{t.hero.lead}</p>
            <div className="lp-hero-actions">
              <Link to="/atlas" className="lp-pill lp-pill-dark" onClick={engage}>{t.hero.cta}<ArrowUpRight size={15}/></Link>
              <Link to="/signup" className="lp-link" onClick={engage}>{t.hero.signup}</Link>
            </div>
          </div>
          <a href="#strip" className="lp-scroll"><ArrowDown size={14}/>{t.hero.scroll}</a>
        </section>

        <section className="lp-strip" id="strip" data-pose="strip">
          <p className="lp-label">{t.strip}</p>
          <div className="lp-marquee">
            <ul>
              {[...STACK,...STACK].map(({icon:Icon,name},i)=><li key={i} aria-hidden={i>=STACK.length}><Icon size={20} strokeWidth={1.6}/>{name}</li>)}
            </ul>
          </div>
        </section>

        <section className="lp-words" aria-label={t.words.label} data-index>
          <div className="lp-words-track" aria-hidden>
            {t.words.items.map((_,i)=><div key={i} data-step={i} data-pose={`word${i}`}/>)}
          </div>
          <div className="lp-words-stage">
            {t.words.items.map((w,i)=>(
              <div className="lp-word" data-word={i} key={i}>
                <h2 aria-label={w.word} className={w.word.length>8?'is-long':''}>{[...w.word].map((c,j)=><span className="lp-letter" key={j} aria-hidden>{c===' '?'\u00A0':c}</span>)}</h2>
                <p className="lp-word-caption"><span>0{i+1}</span>{w.caption}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="lp-stats" data-pose="stats" data-index>
          <div className="lp-glass" data-reveal>
            <h2 className="lp-echo">{t.stats.title}</h2>
            <dl>
              {/* Counts mirror the system totals the atlas reports for the packaged model. */}
              {t.stats.items.map(s=><div key={s.value}><dt>{s.value}</dt><dd><b>{s.label}</b>{s.note}</dd></div>)}
            </dl>
            {/* Usage counter: how often the page was visited and how often it was really used. */}
            <div className="lp-usage">
              <span className="lp-usage-label">{t.usage.label}</span>
              <ul className="lp-usage-list">
                <li><b>{counter.visits.toLocaleString()}</b><span>{t.usage.visits}</span></li>
                <li><b>{counter.engaged.toLocaleString()}</b><span>{t.usage.engaged}</span></li>
                <li><b>{counter.opens.toLocaleString()}</b><span>{t.usage.opens}</span></li>
              </ul>
            </div>
          </div>
        </section>

        <section className="lp-unlock" data-pose="unlock" data-index>
          <div className="lp-unlock-copy" data-reveal>
            <h2 className="lp-echo"><span>{t.unlock.lead}</span>{t.unlock.title}</h2>
            <div className="lp-unlock-row">
              <p>{t.unlock.text}</p>
              <Link to="/atlas" className="lp-pill" onClick={engage}>{t.unlock.cta}</Link>
            </div>
            <ul className="lp-features">
              {t.unlock.features.map((f,i)=><li key={i}><span>{String(i+1).padStart(2,'0')}</span><h3>{f.title}</h3><p>{f.text}</p></li>)}
            </ul>
          </div>
        </section>

        <section className="lp-finale" data-pose="finale" data-index>
          <ParticleLogo text="Anatomn"/>
          <h2 className="lp-finale-title lp-echo">{t.finale.title[0]}<br/>{t.finale.title[1]}</h2>
          <p className="lp-finale-note">{t.finale.note} <a href="/ATTRIBUTION.md">{t.finale.credits}</a></p>
          <p className="lp-finale-tag">{t.finale.tag}<b>{t.finale.tagStrong}</b></p>
        </section>
      </main>

      <footer className="lp-footer">
        <span>Anatomn © {new Date().getFullYear()}</span>
        <nav aria-label={t.footer.label}>
          <Link to="/atlas" onClick={engage}>{t.footer.atlas}</Link>
          <Link to="/signup">{t.footer.signup}</Link>
          <Link to="/login">{t.footer.login}</Link>
          {SOURCES.map(s=><a key={s.name} href={s.url} target="_blank" rel="noreferrer">{s.name}</a>)}
        </nav>
      </footer>
    </div>
  );
}
