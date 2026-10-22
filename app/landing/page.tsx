import {useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowRight,Bone,Brain,Check,ChevronRight,HeartPulse,Quote,Search,Sparkles} from 'lucide-react';
import {SYSTEMS,type SystemId} from '../anatomy';
import './landing.css';

const TOPICS=[
  {icon:Bone,title:'Skeleton',note:'Skull, spine and 220 bones'},
  {icon:HeartPulse,title:'Heart & vessels',note:'Chambers, arteries, veins'},
  {icon:Brain,title:'Nervous system',note:'Brain, spinal cord, cranial nerves'},
];

// Counts mirror the system totals the atlas reports for the packaged model.
const SUBJECTS:{id:string;name:string;image:string;count:string;systems:SystemId[];note?:string}[]=[
  {id:'skeleton',name:'Skeleton',image:'/landing/skeleton.webp',count:'220 bones',systems:['skeletal']},
  {id:'muscles',name:'Muscles',image:'/landing/muscles.webp',count:'425 muscles',systems:['muscular']},
  {id:'cardio',name:'Heart & vessels',image:'/landing/cardio.webp',count:'1,066 structures',systems:['cardiac','arterial','venous']},
  {id:'nervous',name:'Nervous system',image:'/landing/nervous.webp',count:'426 structures',systems:['nervous']},
  {id:'organs',name:'Internal organs',image:'/landing/organs.webp',count:'283 structures',systems:['cardiac','respiratory','digestive','urinary','endocrine','reproductive'],note:'Heart, lungs, digestive tract, kidneys and glands packed into the chest and abdomen. Hide the muscles and skeleton to see how they sit against each other.'},
];

const STATS=[['2,763','selectable structures'],['16','body systems'],['3,745','searchable terms'],['3.0M','triangles of detail']];

const SOURCES=[
  {name:'BodyParts3D',short:'BP',license:'CC BY 4.0',text:'The adult male reference anatomy behind the atlas: 2,234 individual meshes and 3,432 named concepts from the Database Center for Life Science.'},
  {name:'Z-Anatomy',short:'ZA',license:'CC BY-SA 4.0',text:'529 supplementary meshes fill in the spinal cord, peripheral and cranial nerves, lymph nodes, glands, middle ear and knee joint.'},
  {name:'Anatomy Standard',short:'AS',license:'CC BY-NC 4.0',text:'Skeletal terminology, Latin–English term lists and illustrated references appear right beside each bone you select.'},
];

const FEATURES=[
  {title:'Layer by layer',text:'Peel the body back one tissue at a time, or cut it open with the cross-section tool'},
  {title:'Color-coded systems',text:'Sixteen systems, each with its own color you can tune to your notes'},
  {title:'Floating labels',text:'Turn on names right on the model and tap any piece to read about it'},
  {title:'Free navigation',text:'Orbit, zoom and explode the body to see every piece from any angle'},
];

export default function LandingPage(){
  const [subject,setSubject]=useState(SUBJECTS[0]);
  const subjectSystems=SYSTEMS.filter(s=>subject.systems.includes(s.id));

  return(
    <div className="lp">
      <header className="lp-header">
        <div className="lp-wrap">
          <Link to="/" className="lp-logo"><img src="/favicon.svg" alt=""/>Human Atlas</Link>
          <nav className="lp-nav" aria-label="Main">
            <Link to="/atlas" className="is-active">3D Atlas</Link>
            <a href="#systems">Systems</a>
            <a href="#assistant">AI Assistant</a>
            <a href="#rom">ROM Lab</a>
            <a href="#sources">Sources</a>
          </nav>
          <Link to="/login" className="lp-signin">Sign in</Link>
        </div>
      </header>

      <section className="lp-hero">
        <div className="lp-wrap">
          <div className="lp-hero-copy">
            <h1>See anatomy <em>in 3D</em></h1>
            <p className="lp-hero-lead">An interactive atlas of the human body. Rotate, peel back and explode 2,763 real structures, then ask the built-in assistant to explain what you see.</p>
            <div className="lp-hero-actions">
              <Link to="/atlas" className="lp-cta">Open the 3D Atlas<ChevronRight size={18}/></Link>
              <Link to="/signup" className="lp-text-link">Create a free account<ArrowRight size={16}/></Link>
            </div>
          </div>
          <div className="lp-hero-art">
            <span className="lp-ring" aria-hidden/>
            <figure className="lp-hero-figure">
              <img src="/landing/hero.webp" alt="3D model of the head, neck and torso showing muscles, vessels and the skull"/>
              <span className="lp-pin" style={{left:'60%',top:'7%'}}><i/>Cranium</span>
              <span className="lp-pin lp-pin-left" style={{right:'68%',top:'33%'}}><i/>Pectoralis major</span>
              <span className="lp-pin" style={{left:'62%',top:'58%'}}><i/>Rectus abdominis</span>
            </figure>
          </div>
        </div>
      </section>

      <section className="lp-topics">
        <div className="lp-wrap">
          <h2>Start with a popular system</h2>
          <div className="lp-topic-grid">
            {TOPICS.map(({icon:Icon,title,note})=>(
              <Link to="/atlas" className="lp-topic" key={title}>
                <Icon size={34} strokeWidth={1.5}/>
                <span><strong>{title}</strong><small>{note}</small></span>
                <ChevronRight size={22}/>
              </Link>
            ))}
          </div>
          <a href="#systems" className="lp-more">see all systems<ArrowRight size={16}/></a>
        </div>
      </section>

      <section className="lp-light lp-platform">
        <div className="lp-wrap">
          <p className="lp-kicker">Study the body faster with</p>
          <h2>one connected atlas</h2>
          <p className="lp-sub">Models, terms and practice in a single place</p>
          <div className="lp-cards">
            <article className="lp-card">
              <h3>Quiz</h3>
              <p>Check what you remember before the exam.</p>
              <Link to="/atlas" className="lp-card-link">Test yourself<ArrowRight size={15}/></Link>
              <div className="lp-mock-quiz" aria-hidden>
                <b>Which bone is highlighted?</b>
                <span>Scapula</span>
                <span className="is-right">Clavicle<Check size={14}/></span>
                <span>Humerus</span>
              </div>
            </article>
            <article className="lp-card is-center">
              <h3>3D Atlas</h3>
              <p>Every piece of the body, one tap away.</p>
              <Link to="/atlas" className="lp-card-link">Explore in 3D<ArrowRight size={15}/></Link>
              <img src="/landing/skeleton.webp" alt="" className="lp-card-skeleton"/>
            </article>
            <article className="lp-card">
              <h3>Search</h3>
              <p>Find any of 3,745 named structures.</p>
              <Link to="/atlas" className="lp-card-link">Keyword search<ArrowRight size={15}/></Link>
              <div className="lp-mock-search" aria-hidden>
                <div className="lp-mock-input"><Search size={14}/>rotator c<i/></div>
                <span>Rotator cuff</span>
                <span>Supraspinatus muscle</span>
                <span>Infraspinatus muscle</span>
                <span>Teres minor muscle</span>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="lp-ai" id="assistant">
        <div className="lp-wrap">
          <div className="lp-ai-art">
            <img src="/landing/ai-bust.webp" alt="Skeleton with arteries, veins and nerves of the head and chest"/>
            <div className="lp-bubble"><span><Sparkles size={18}/></span>Hi! Ask me about any structure. I can rotate the model and highlight it for you.</div>
          </div>
          <div className="lp-ai-copy">
            <h2>Learn faster with the</h2>
            <p className="lp-ai-pill"><Sparkles size={22}/>Atlas Assistant</p>
            <p>Ask which nerve supplies a muscle, highlight the rotator cuff, or have the model turn to show you the back. Every answer comes from the same reference notes the atlas shows, and runs right in your browser.</p>
            <Link to="/atlas" className="lp-text-link">Ask the assistant<ArrowRight size={16}/></Link>
          </div>
        </div>
      </section>

      <section className="lp-light lp-students" id="rom">
        <div className="lp-wrap">
          <div className="lp-students-copy">
            <h2>An anatomy platform for students</h2>
            <div className="lp-point">
              <h3>Stay focused</h3>
              <p>3D models, Latin terms and illustrated references sit side by side, so you never lose your place switching between books and tabs.</p>
            </div>
            <div className="lp-point">
              <h3>Measure real movement</h3>
              <p>ROM Lab uses your camera to track shoulder range of motion live and shows which muscles are doing the work.</p>
            </div>
          </div>
          <div className="lp-devices">
            <span className="lp-blob" aria-hidden/>
            <div className="lp-monitor"><img src="/landing/ui-desktop.webp" alt="The Human Atlas app on a desktop screen"/></div>
            <div className="lp-phone"><img src="/landing/ui-mobile.webp" alt="The Human Atlas app on a phone"/></div>
          </div>
        </div>
      </section>

      <section className="lp-band">
        <div className="lp-wrap">
          <p className="lp-kicker">Get started</p>
          <h2>Your body, fully explorable</h2>
          <p>No downloads and no API keys. Open it in the browser and start learning.</p>
          <Link to="/signup" className="lp-cta lp-cta-pink">Create an account<ChevronRight size={18}/></Link>
        </div>
      </section>

      <section className="lp-sources" id="sources">
        <div className="lp-wrap">
          <p className="lp-kicker">Built on open anatomical data</p>
          <h2>over <em>3,000,000</em> triangles</h2>
          <p className="lp-sub">Every structure comes from published, openly licensed research models, simplified for the web without dropping a single mesh.</p>
          <dl className="lp-stats">
            {STATS.map(([value,label])=><div key={label}><dt>{value}</dt><dd>{label}</dd></div>)}
          </dl>
          <div className="lp-source-grid">
            {SOURCES.map(s=>(
              <article className="lp-source" key={s.name}>
                <header><span>{s.short}</span><div><strong>{s.name}</strong><em>{s.license}</em></div></header>
                <Quote size={26} className="lp-quote"/>
                <p>{s.text}</p>
              </article>
            ))}
          </div>
          <a href="/ATTRIBUTION.md" className="lp-more">read full credits<ArrowRight size={16}/></a>
        </div>
      </section>

      <section className="lp-clear">
        <div className="lp-wrap">
          <div className="lp-clear-art">
            <span className="lp-sun" aria-hidden/>
            <img src="/landing/body-all.webp" alt="Full body model with muscles, vessels and skeleton"/>
          </div>
          <div className="lp-clear-copy">
            <h2>From complex to clear</h2>
            <p className="lp-clear-lead">Tools designed to make a crowded body easy to read</p>
            <ul>
              {FEATURES.map(f=><li key={f.title}><h3>{f.title}</h3><p>{f.text}</p></li>)}
            </ul>
            <Link to="/atlas" className="lp-cta">Open the 3D Atlas<ChevronRight size={18}/></Link>
          </div>
        </div>
      </section>

      <section className="lp-subjects" id="systems">
        <div className="lp-wrap">
          <h2>Choose a system</h2>
          <p className="lp-subjects-lead">and see how it fits into the whole body</p>
          <div className="lp-subjects-grid">
            <ul className="lp-subject-list">
              {SUBJECTS.map(s=>(
                <li key={s.id}><button type="button" className={s.id===subject.id?'is-active':''} aria-pressed={s.id===subject.id} onClick={()=>setSubject(s)}>{s.name}</button></li>
              ))}
            </ul>
            <div className="lp-subject-panel">
              <img key={subject.id} src={subject.image} alt={`${subject.name} on the 3D model`}/>
              <div className="lp-subject-info">
                <div className="lp-subject-dots">{subjectSystems.map(s=><i key={s.id} style={{background:s.color}}/>)}<span>{subject.count}</span></div>
                <h3>{subject.name}</h3>
                <p>{subject.note??subjectSystems[0]?.description}</p>
                <Link to="/atlas" className="lp-text-link">Explore {subject.name.toLowerCase()}<ArrowRight size={16}/></Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-final">
        <div className="lp-wrap">
          <span className="lp-final-ring" aria-hidden/>
          <p className="lp-kicker">Ready when you are</p>
          <h2>Start exploring!</h2>
          <p>The quickest way to understand the body is to take it apart yourself.</p>
          <Link to="/atlas" className="lp-cta lp-cta-pink">Open the 3D Atlas<ChevronRight size={18}/></Link>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-wrap">
          <div className="lp-footer-brand">
            <Link to="/" className="lp-logo"><img src="/favicon.svg" alt=""/>Human Atlas</Link>
            <p>An educational explorer, not a diagnostic or surgical tool.</p>
          </div>
          <div><h4>Account</h4><Link to="/signup">Sign up</Link><Link to="/login">Log in</Link></div>
          <div><h4>Platform</h4><Link to="/atlas">3D Atlas</Link><a href="#assistant">AI Assistant</a><a href="#rom">ROM Lab</a><a href="#systems">Systems</a></div>
          <div><h4>Sources</h4><a href="https://lifesciencedb.jp/bp3d/" target="_blank" rel="noreferrer">BodyParts3D</a><a href="https://github.com/LluisV/Z-Anatomy" target="_blank" rel="noreferrer">Z-Anatomy</a><a href="https://www.anatomystandard.com/" target="_blank" rel="noreferrer">Anatomy Standard</a></div>
        </div>
        <p className="lp-copyright">Human Atlas © {new Date().getFullYear()}. Anatomy data under CC BY 4.0, CC BY-SA 4.0 and CC BY-NC 4.0.</p>
      </footer>
    </div>
  );
}
