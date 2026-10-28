// The student's own page: who they study as, how they are doing, what to
// study next, and how they buy premium.
//
// The money path is unchanged from before — pick a plan, transfer, save the
// bank reference, an admin confirms, a database trigger grants the time. On
// top of it sits the school side: daily attendance and passed exams pay XP,
// and XP can knock up to 20% off a plan. The browser never computes any of
// those numbers; the triggers in supabase/schema.sql do.
import {useCallback,useEffect,useState} from 'react';
import {Link,useLocation,useNavigate,Navigate} from 'react-router-dom';
import {Award,CalendarCheck,GraduationCap,PencilLine,Trophy} from 'lucide-react';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {supabase,supabaseConfigured} from '../../lib/supabase';
import {BANK,PLANS,type Plan} from '../../lib/plans';
import {useSubscription} from '../../hooks/use-subscription';
import {useAuth,signOut} from '../../hooks/use-auth';
import {
  claimCheckin,
  fetchExam,
  fetchExams,
  fetchMyAttempts,
  fetchProfile,
  fetchQuizResults,
  fetchXp,
  maxDiscountMnt,
  saveProfile,
  weakTopics,
  weeklyPoints,
  type DbState,
  type Exam,
  type ExamAttempt,
  type StudentProfile,
  type XpEvent,
} from '../../lib/exam-store';
import {useLang} from '../locale';
import SiteNav from '../site-nav';
import './account.css';

const copy={
  en:{
    title:'My page',
    overview:'Overview',
    signOut:'Sign out',
    backAtlas:'Back to the atlas',
    admin:'Admin',
    loading:'Loading…',
    student:'Student',
    notSet:'Add your school details',
    yearSuffix:(n:number)=>`Year ${n}`,
    xp:'XP',
    xpHint:'Points for attendance and passed exams. 1 XP = 5₮ off a plan.',
    checkin:'Confirm today',
    checkinDone:'Today is already confirmed.',
    checkinOk:'Confirmed. Today’s points are added.',
    tiles:{xp:'XP balance',days:'Attendance days',attempts:'Exams sat',passed:'Exams passed'},
    progress:'Progress',
    avgScore:'Average exam score',
    weekActivity:'Active days this week',
    noExamData:'No exam result yet. Take a paper to see your progress.',
    stats:'Weekly XP',
    statsHint:'Points earned over the last seven days.',
    next:'What to study next',
    nextEmpty:'Nothing to flag yet. Take an exam or do the quiz.',
    openAtlas:'Open in the atlas',
    results:'Exam results',
    resultsEmpty:'No exam attempt yet.',
    goExam:'Go to exams',
    passedMark:'Passed',
    failedMark:'Not passed',
    studyInfo:'School details',
    university:'University',
    department:'Department',
    studyYear:'Year',
    specialty:'Specialty',
    save:'Save',
    saved:'Saved.',
    premium:'Premium',
    premiumAdmin:'Premium — admin',
    free:'Free plan',
    until:(v:string)=>`Valid until ${v}`,
    validNow:'Valid until',
    plansLead:'Unlock ROM Lab and Plaque Lab',
    buy:'Pay',
    useXp:'Use XP',
    discountAt:(v:string)=>`${v} off`,
    maxOff:(v:string)=>`Max ${v} XP`,
    balance0:'No XP to use yet.',
    how:'How to pay',
    step1:'Transfer the amount below with QPay, SocialPay, or a bank app.',
    step2:'Use your payment number as the reference so the team can find your transfer.',
    step3:'Save the transaction number in the box below. An admin verifies the transfer and premium turns on automatically.',
    bank:'Bank',
    account:'Account',
    receiver:'Receiver',
    amount:'Amount',
    payNumber:'Your payment number',
    payNumberHint:'Shown on your transfer receipt',
    saveRef:'Save reference',
    pending:'Waiting for verification',
    history:'Payment history',
    historyEmpty:'No payments yet.',
    th:{date:'Date',plan:'Plan',amount:'Amount',discount:'Discount',status:'Status',ref:'Reference'},
    status:{pending:'Pending',completed:'Confirmed',rejected:'Rejected'},
    discountPaid:(v:string)=>`${v} XP used`,
    configure:'Supabase is not configured: the account backend needs VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local.',
    missingSchema:'XP and exam tables are not in this database yet. Run supabase/schema.sql in the Supabase SQL editor.',
    error:'Something went wrong. Try again.',
    savedRef:'Reference saved.',
  },
  mn:{
    title:'Миний хуудас',
    overview:'Ерөнхий',
    signOut:'Гарах',
    backAtlas:'Атлас руу буцах',
    admin:'Админ',
    loading:'Ачаалж байна…',
    student:'Оюутан',
    notSet:'Сургуулийн мэдээллээ бөглөнө үү',
    yearSuffix:(n:number)=>`${n}-р жил`,
    xp:'XP',
    xpHint:'Ирц болон тэнцсэн шалгалтаас XP хуримтлагдана. 1 XP = 5₮ хөнгөллт.',
    checkin:'Өнөөдрийн ирц',
    checkinDone:'Өнөөдрийн ирц баталгаажсан байна.',
    checkinOk:'Баталгаажлаа. Өнөөдрийн оноо нэмэгдлээ.',
    tiles:{xp:'XP үлдэгдэл',days:'Ирсэн өдөр',attempts:'Өгсөн шалгалт',passed:'Тэнцсэн'},
    progress:'Явц',
    avgScore:'Шалгалтын дундаж оноо',
    weekActivity:'Энэ долоо хоногийн идэвх',
    noExamData:'Одоогоор шалгалтын үр дүн байхгүй.',
    stats:'Долоо хоногийн XP',
    statsHint:'Сүүлийн 7 өдөрт хуримтлагдсан оноо.',
    next:'Цаашид юу бэлдэх вэ',
    nextEmpty:'Одоогоор анхаарах зүйл гараагүй.',
    openAtlas:'Атласад харах',
    results:'Шалгалтын үр дүн',
    resultsEmpty:'Одоогоор шалгалт өгөөгүй.',
    goExam:'Шалгалт руу',
    passedMark:'Тэнцсэн',
    failedMark:'Тэнцээгүй',
    studyInfo:'Сургуулийн мэдээлэл',
    university:'Их сургууль',
    department:'Тэнхим',
    studyYear:'Жил',
    specialty:'Мэргэжил',
    save:'Хадгалах',
    saved:'Хадгалагдлаа.',
    premium:'Premium',
    premiumAdmin:'Premium — админ',
    free:'Үнэгүй эрх',
    until:(v:string)=>`${v} хүртэл хүчинтэй`,
    validNow:'Хүчинтэй хугацаа',
    plansLead:'ROM Lab болон Plaque Lab-ийг нээх',
    buy:'Төлөх',
    useXp:'XP ашиглах',
    discountAt:(v:string)=>`${v} хөнгөллт`,
    maxOff:(v:string)=>`хамгийн ихдээ ${v} XP`,
    balance0:'Одоогоор ашиглах XP байхгүй.',
    how:'Төлөх заавар',
    step1:'Дараах дүнг QPay, SocialPay эсвэл банкны апп ашиглан шилжүүлнэ үү.',
    step2:'Гүйлгээний утга дээр өөрийн payment дугаарыг (#id) бичнэ үү.',
    step3:'Гүйлгээний дугаараа доор хадгална уу. Админ шалгасны дараа premium автоматаар идэвхжинэ.',
    bank:'Банк',
    account:'Данс',
    receiver:'Хүлээн авагч',
    amount:'Дүн',
    payNumber:'Гүйлгээний дугаар',
    payNumberHint:'Таны гүйлгээний баталгаа дээр байдаг',
    saveRef:'Дугаар хадгалах',
    pending:'Баталгаажуулалт хүлээж байна',
    history:'Төлбөрийн түүх',
    historyEmpty:'Одоогоор төлбөр байхгүй.',
    th:{date:'Огноо',plan:'Багц',amount:'Дүн',discount:'Хөнгөллт',status:'Төлөв',ref:'Дугаар'},
    status:{pending:'Хүлээж байна',completed:'Баталгаажсан',rejected:'Татгалзсан'},
    discountPaid:(v:string)=>`${v} XP зарцуулсан`,
    configure:'Supabase тохируулаагүй байна: VITE_SUPABASE_URL ба VITE_SUPABASE_PUBLISHABLE_KEY-г .env.local-д нэмнэ үү.',
    missingSchema:'XP болон шалгалтын хүснэгт энэ өгөгдлийн баазанд байхгүй байна. supabase/schema.sql-ийг Supabase SQL editor-т ажиллуулна уу.',
    error:'Алдаа гарлаа. Дахин оролдоно уу.',
    savedRef:'Дугаар хадгалагдлаа.',
  },
} as const;

const fmtDate=(v:string)=>new Date(v).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'});
const fmtDay=(v:string)=>new Date(v).toLocaleDateString(undefined,{dateStyle:'medium'});
const fmtMnt=(n:number|string)=>`${Number(n).toLocaleString()}₮`;

interface Payment{
  id:number;
  user_id:string;
  plan:string;
  amount_mnt:number;
  xp_spent:number;
  discount_mnt:number;
  status:string;
  reference:string;
  created_at:string;
}

/** Two concentric rings: exam average outside, weekly activity inside. */
function Rings({outer,inner,value,label,ariaLabel}:{outer:number;inner:number;value:string;label:string;ariaLabel:string}){
  const clamp=(v:number)=>Math.max(0,Math.min(100,v));
  const r1=57,c1=2*Math.PI*r1,r2=42,c2=2*Math.PI*r2;
  return(
    <div className="dash-ring" role="img" aria-label={ariaLabel}>
      <svg width={132} height={132} viewBox="0 0 132 132" aria-hidden>
        <circle className="dash-ring-track" cx={66} cy={66} r={r1}/>
        <circle cx={66} cy={66} r={r1} stroke="#f97316" strokeDasharray={`${(clamp(outer)/100)*c1} ${c1}`}/>
        <circle className="dash-ring-track" cx={66} cy={66} r={r2} style={{strokeWidth:10}}/>
        <circle cx={66} cy={66} r={r2} stroke="#3b82f6" style={{strokeWidth:10}} strokeDasharray={`${(clamp(inner)/100)*c2} ${c2}`}/>
      </svg>
      <span className="dash-ring-center">
        <b className="dash-ring-value">{value}</b>
        <i className="dash-ring-label" style={{fontStyle:'normal'}}>{label}</i>
      </span>
    </div>
  );
}

export default function AccountPage(){
  const {lang}=useLang();
  const dict=copy[lang];
  const location=useLocation();
  const navigate=useNavigate();
  const {ready:subReady,user}=useAuth();
  const {ready:subOk,isAdmin,premium,expiresAt,refresh}=useSubscription();
  const ready=subReady&&subOk;

  const [payments,setPayments]=useState<Payment[]>([]);
  const [loading,setLoading]=useState(true);
  const [savingId,setSavingId]=useState<string|null>(null);
  const [refs,setRefs]=useState<Record<string,string>>({});
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');

  const [xp,setXp]=useState(0);
  const [events,setEvents]=useState<XpEvent[]>([]);
  const [checkinDays,setCheckinDays]=useState(0);
  const [dbState,setDbState]=useState<DbState>('ok');
  const [checkedToday,setCheckedToday]=useState(false);
  const [checkingIn,setCheckingIn]=useState(false);

  const [attempts,setAttempts]=useState<ExamAttempt[]>([]);
  const [examTitles,setExamTitles]=useState<Record<number,string>>({});
  const [exams,setExams]=useState<Exam[]>([]);
  const [quizRows,setQuizRows]=useState<{details:unknown}[]>([]);
  const [profile,setProfile]=useState<StudentProfile|null>(null);
  const [form,setForm]=useState({university:'',department:'',study_year:'',specialty:''});
  const [savingProfile,setSavingProfile]=useState(false);
  const [spend,setSpend]=useState<Record<string,string>>({});

  useEffect(()=>{
    setNotice(typeof (location.state as {notice?:string}|null)?.notice==='string'
      ?((location.state as {notice?:string}).notice as string)
      :'');
  },[location.state]);

  const load=useCallback(async()=>{
    if(!user){setLoading(false);return;}
    const ownId=user.id;
    setLoading(true);
    setError('');
    const [pay,xpRes,attRes,examRes,quizRes,profRes]=await Promise.all([
      supabase.from('payments').select('*').eq('user_id',ownId).order('created_at',{ascending:false}).limit(100),
      fetchXp(),
      fetchMyAttempts(),
      fetchExams(),
      fetchQuizResults(ownId),
      fetchProfile(ownId),
    ]);
    if(pay.error){
      console.error('[account] payments load failed',pay.error.code,pay.error.message);
      setError(dict.error);
    }
    setPayments((pay.data??[]) as unknown as Payment[]);
    const state:DbState=xpRes.state==='missing'||attRes.state==='missing'||examRes.state==='missing'?'missing':'ok';
    setDbState(state);
    setXp(xpRes.data.total);
    setEvents(xpRes.data.events);
    setCheckinDays(xpRes.data.days);
    setAttempts(attRes.data);
    setExams(examRes.data);
    // A student only ever reads published papers, so an attempt against a
    // paper that has since been archived has no title in the list above;
    // ask for it by id so the review still names what was sat.
    const titles:Record<number,string>={};
    for(const e of examRes.data)titles[e.id]=lang==='mn'?e.title:e.title_en||e.title;
    const archived=[...new Set(attRes.data.map(a=>a.exam_id))].filter(id=>!titles[id]);
    if(archived.length){
      const extra=await Promise.all(archived.map(id=>fetchExam(id)));
      for(const r of extra){
        const e=r.data.exam;
        if(e)titles[e.id]=lang==='mn'?e.title:e.title_en||e.title;
      }
    }
    setExamTitles(titles);
    setQuizRows(quizRes.data);
    const p=profRes.data;
    setProfile(p);
    if(p)setForm({university:p.university,department:p.department,study_year:p.study_year?String(p.study_year):'',specialty:p.specialty});
    setLoading(false);
  },[user,lang,dict.error]);

  useEffect(()=>{load();},[load]);

  if(!ready)return <main className="flex min-h-screen items-center justify-center text-slate-500">…</main>;
  if(!user)return <Navigate to="/login" state={{from:'/account'}} replace/>;

  const bestByExam=new Map<number,number>();
  const passedExams=new Set<number>();
  for(const a of attempts){
    bestByExam.set(a.exam_id,Math.max(bestByExam.get(a.exam_id)??0,a.score_pct));
    if(a.passed)passedExams.add(a.exam_id);
  }
  const avgScore=bestByExam.size?[...bestByExam.values()].reduce((s,v)=>s+v,0)/bestByExam.size:0;
  const week=weeklyPoints(events,lang);
  const weekMax=Math.max(30,...week.map(d=>d.points));
  const weekActive=week.filter(d=>d.points>0).length;
  const next=weakTopics(attempts,exams,quizRows,lang);

  const unlocked=premium||isAdmin;
  const planName=(id:string)=>PLANS.find(p=>p.id===id)?.name??id;
  const statusLabel=(key:string)=>String((dict.status as Record<string,string>)[key]??key);
  const name=profile?.name||(user.user_metadata?.name as string|undefined)||user.email||'';
  const initials=(name||'?').trim().split(/\s+/).slice(0,2).map(w=>w[0]?.toUpperCase()??'').join('');
  const today=new Date().toISOString().slice(0,10);
  const hasCheckedIn=events.some(e=>e.kind==='checkin'&&e.day===today)||checkedToday;

  async function createPayment(plan:Plan){
    setError('');
    const wanted=Math.max(0,Math.floor(Number(spend[plan.id]||'0')||0));
    const row:Record<string,unknown>={
      // The columns hold the plan id, not the whole plan object.
      user_id:user!.id,plan:plan.id,amount_mnt:plan.priceMnt,method:'qpay',status:'pending',
    };
    // xp_spent only exists once supabase/schema.sql has been run. Leaving it
    // out when nobody asked for a discount keeps the plain payment flow
    // working on a database that has not been migrated yet.
    if(wanted>0)row.xp_spent=wanted;
    const {data,error}=await supabase.from('payments').insert(row).select().single();
    if(error){
      // The visitor sees a friendly line; the exact PostgREST reason belongs in the console.
      console.error('[account] payment create failed',error.code,error.message);
      setError(dict.error);return;
    }
    setPayments(p=>[data as unknown as Payment,...p]);
    const fresh=await fetchXp();
    setXp(fresh.data.total);
    setEvents(fresh.data.events);
    setCheckinDays(fresh.data.days);
  }

  async function saveReference(id:string){
    setError('');
    setSavingId(id);
    const value=(refs[id]??'').trim();
    const {error}=await supabase.from('payments').update({reference:value}).eq('id',Number(id)).eq('status','pending');
    if(error){
      console.error('[account] reference save failed',error.code,error.message);
      setError(dict.error);
    }else setNotice(dict.savedRef);
    // The history table reads local state, so mirror the saved value here.
    setPayments(p=>p.map(row=>String(row.id)===id?{...row,reference:value}:row));
    refresh();
    setSavingId(null);
  }

  async function checkIn(){
    setError('');
    setCheckingIn(true);
    const res=await claimCheckin();
    if(res.state==='missing'){setDbState('missing');setCheckingIn(false);return;}
    if(res.total===null){setError(lang==='en'?'Already claimed today.':'Өнөөдрийн ирц баталгаажсан байна.');setCheckingIn(false);return;}
    setXp(res.total);
    setCheckedToday(true);
    setNotice(dict.checkinOk);
    const fresh=await fetchXp();
    setEvents(fresh.data.events);
    setCheckinDays(fresh.data.days);
    setCheckingIn(false);
  }

  async function saveStudyInfo(){
    setError('');
    setSavingProfile(true);
    const fields={
      university:form.university.trim(),
      department:form.department.trim(),
      study_year:Math.max(0,Math.min(10,Number(form.study_year)||0)),
      specialty:form.specialty.trim(),
    };
    const res=await saveProfile(user!.id,fields);
    if(res.state!=='ok'){
      if(res.state==='missing')setDbState('missing');
      setError(res.message?lang==='en'?res.message:dict.error:dict.error);
      setSavingProfile(false);
      return;
    }
    setProfile(p=>(p?{...p,...fields}:p));
    setNotice(dict.saved);
    setSavingProfile(false);
  }

  // Navigate before signing out: the guard above would otherwise bounce a
  // signed-out visitor to /login instead of the landing page.
  async function leave(){navigate('/',{replace:true});await signOut();}

  const tiles=[
    {Icon:Award,color:'#3b82f6',value:String(xp),label:dict.tiles.xp},
    {Icon:CalendarCheck,color:'#f97316',value:String(checkinDays),label:dict.tiles.days},
    {Icon:PencilLine,color:'#a78bfa',value:String(attempts.length),label:dict.tiles.attempts},
    {Icon:Trophy,color:'#22c55e',value:String(passedExams.size),label:dict.tiles.passed},
  ];

  return(
    <main className="dash">
      <SiteNav tone="light"/>

      <section className="dash-hero">
        <div className="dash-hero-inner">
          <div className="dash-panel">
            <p className="dash-kicker">{dict.overview}</p>
            <div className="dash-student">
              <span className="dash-avatar" aria-hidden>{initials}</span>
              <span>
                <b className="dash-name">{name||dict.student}</b>
                <i className="dash-meta" style={{display:'block',fontStyle:'normal'}}>
                  {profile&&(profile.university||profile.department||profile.specialty||profile.study_year)
                    ?[profile.university,profile.department,profile.specialty,profile.study_year?dict.yearSuffix(profile.study_year):''].filter(Boolean).join(' · ')
                    :dict.notSet}
                </i>
              </span>
            </div>
            <p className="dash-xp">
              <Award size={16} aria-hidden/>
              <b>{xp.toLocaleString()}</b> {dict.xp}
              <span style={{color:'#94a3b8'}}>{' · '}</span>
              {unlocked
                ?<span style={{color:'#6ee7b7'}}>{premium&&expiresAt?dict.until(fmtDay(expiresAt)):dict.premiumAdmin}</span>
                :<span>{dict.free}</span>}
            </p>
            <div className="dash-tiles">
              {tiles.map(({Icon,color,value,label})=>(
                <div className="dash-tile" key={label}>
                  <span className="dash-tile-icon" style={{background:color}}><Icon size={17} aria-hidden/></span>
                  <span>
                    <b className="dash-tile-value">{value}</b>
                    <i className="dash-tile-label" style={{display:'block',fontStyle:'normal'}}>{label}</i>
                  </span>
                </div>
              ))}
            </div>
            <div style={{marginTop:14,display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
              <Button size="sm" variant={hasCheckedIn?'outline':'default'} disabled={hasCheckedIn||checkingIn||!supabaseConfigured} onClick={checkIn}>
                {hasCheckedIn?dict.checkinDone:dict.checkin}
              </Button>
              <Link to="/exam" className="text-sm underline" style={{color:'#93c5fd'}}>{dict.goExam}</Link>
            </div>
            <p style={{marginTop:10,fontSize:12,color:'#94a3b8'}}>{dict.xpHint}</p>
          </div>

          <div className="dash-panel">
            <p className="dash-kicker">{dict.progress}</p>
            <div className="dash-progress">
              <Rings
                outer={avgScore}
                inner={(weekActive/7)*100}
                value={`${Math.round(avgScore)}%`}
                label={dict.avgScore}
                ariaLabel={`${dict.avgScore}: ${Math.round(avgScore)}%, ${dict.weekActivity}: ${weekActive}/7`}
              />
              <div className="dash-legend">
                <div className="dash-legend-row">
                  <strong>{Math.round(avgScore)}%</strong>
                  <span>{dict.avgScore}</span>
                </div>
                <div className="dash-legend-row is-blue">
                  <strong>{weekActive}/7</strong>
                  <span>{dict.weekActivity}</span>
                </div>
                {attempts.length===0&&<span style={{color:'#94a3b8'}}>{dict.noExamData}</span>}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="dash-body">
        <div className="dash-card">
          <div className="dash-card-head">
            <h2 className="dash-card-title">{dict.stats}</h2>
            <span style={{fontSize:12,color:'#94a3b8'}}>{dict.statsHint}</span>
          </div>
          <div className="dash-chart">
            {week.map((d,i)=>(
              <div className="dash-bar-col" key={`${d.label}-${i}`}>
                <span className="dash-bar-value">{d.points>0?`+${d.points}`:''}</span>
                <span className={`dash-bar ${d.points>0?'':'is-empty'}`} style={{height:`${Math.max(3,(d.points/weekMax)*128)}px`}}/>
                <span className="dash-bar-label">{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="dash-card">
          <div className="dash-card-head"><h2 className="dash-card-title">{dict.next}</h2></div>
          {next.length===0
            ?<p style={{fontSize:14,color:'#64748b'}}>{dict.nextEmpty}</p>
            :<div className="dash-topics">
              {next.map(topic=>(
                <div className="dash-topic" key={topic.label}>
                  <span>{topic.label}</span>
                  <span style={{color:'#64748b',whiteSpace:'nowrap'}}>{topic.correct}/{topic.total}</span>
                  {topic.concept&&<Link to={`/atlas?focus=${encodeURIComponent(topic.concept)}`}>{dict.openAtlas}</Link>}
                </div>
              ))}
            </div>}
        </div>

        <div className="dash-card">
          <div className="dash-card-head">
            <h2 className="dash-card-title">{dict.results}</h2>
            <Link to="/exam" style={{fontSize:13,fontWeight:600,color:'#1d4ed8',textDecoration:'underline'}}>{dict.goExam}</Link>
          </div>
          {loading
            ?<p style={{fontSize:14,color:'#64748b'}}>{dict.loading}</p>
            :attempts.length===0
              ?<p style={{fontSize:14,color:'#64748b'}}>{dict.resultsEmpty}</p>
              :<div className="dash-rows">
                {attempts.slice(0,6).map(a=>(
                  <div className="dash-row" key={a.id}>
                    <span>{examTitles[a.exam_id]??`#${a.exam_id}`}</span>
                    <span style={{display:'flex',gap:8,alignItems:'center',whiteSpace:'nowrap'}}>
                      <b>{a.score_pct}%</b>
                      <span style={{color:a.passed?'#15803d':'#b91c1c'}}>{a.passed?dict.passedMark:dict.failedMark}</span>
                      <span style={{color:'#94a3b8'}}>{fmtDate(a.created_at)}</span>
                    </span>
                  </div>
                ))}
              </div>}
        </div>

        <div className="dash-card">
          <div className="dash-card-head"><h2 className="dash-card-title">{dict.studyInfo}</h2></div>
          <div className="dash-form">
            <label className="dash-field">
              <span>{dict.university}</span>
              <Input value={form.university} onChange={e=>setForm(f=>({...f,university:e.target.value}))}/>
            </label>
            <label className="dash-field">
              <span>{dict.department}</span>
              <Input value={form.department} onChange={e=>setForm(f=>({...f,department:e.target.value}))}/>
            </label>
            <label className="dash-field">
              <span>{dict.studyYear}</span>
              <Input inputMode="numeric" value={form.study_year} onChange={e=>setForm(f=>({...f,study_year:e.target.value.replace(/\D/g,'')}))}/>
            </label>
            <label className="dash-field">
              <span>{dict.specialty}</span>
              <Input value={form.specialty} onChange={e=>setForm(f=>({...f,specialty:e.target.value}))}/>
            </label>
          </div>
          <div style={{marginTop:12}}>
            <Button size="sm" disabled={savingProfile||!supabaseConfigured} onClick={saveStudyInfo}>
              <GraduationCap data-icon="inline-start" aria-hidden/>
              {dict.save}
            </Button>
          </div>
        </div>

        <div className="dash-card" style={{gridColumn:'1/-1'}}>
          <div className="dash-card-head">
            <h2 className="dash-card-title">{dict.premium}</h2>
            {unlocked
              ?<Badge className="bg-emerald-600">{premium?dict.premium:dict.premiumAdmin}</Badge>
              :<Badge variant="secondary">{dict.free}</Badge>}
          </div>
          {premium&&expiresAt&&<p className="dash-note info" style={{marginBottom:14}}>{dict.validNow}: <b>{fmtDay(expiresAt)}</b></p>}

          {!unlocked&&<>
            <p style={{fontSize:14,color:'#475569',marginBottom:12}}>{dict.plansLead}</p>
            <div className="dash-plan" style={{marginBottom:10}}>
              <p className="text-sm"><b>{dict.bank}:</b> {BANK.name} · <b>{dict.account}:</b> {BANK.account} · <b>{dict.receiver}:</b> {BANK.receiver}</p>
            </div>
            <div className="dash-grid-plans" style={{display:'grid',gap:12,gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))'}}>
              {PLANS.map(plan=>{
                const maxXp=Math.floor(maxDiscountMnt(xp,plan.priceMnt)/5);
                const wanted=Math.max(0,Math.min(maxXp,Math.floor(Number(spend[plan.id]||'0')||0)));
                const price=plan.priceMnt-wanted*5;
                return(
                  <div className="dash-plan" key={plan.id}>
                    <p className="text-lg font-semibold">{plan.name}</p>
                    <p className="dash-plan-price">{fmtMnt(price)}
                      {wanted>0&&<span className="dash-plan-was">{fmtMnt(plan.priceMnt)}</span>}
                    </p>
                    {maxXp>0
                      ?<label className="dash-spend">
                        <span>{dict.useXp}</span>
                        <Input inputMode="numeric" value={spend[plan.id]??''} onChange={e=>setSpend(s=>({...s,[plan.id]:e.target.value.replace(/\D/g,'')}))}/>
                        <span>{dict.maxOff(String(maxXp))}</span>
                        {wanted>0&&<span style={{color:'#15803d'}}>{dict.discountAt(fmtMnt(wanted*5))}</span>}
                      </label>
                      :<p className="dash-spend" style={{margin:'8px 0 10px'}}>{dict.balance0}</p>}
                    <Button className="w-full" onClick={()=>createPayment(plan)}>{dict.buy}</Button>
                  </div>
                );
              })}
            </div>
          </>}

          {error&&<p className="dash-note bad" style={{margin:'14px 0'}}>{error}</p>}
          {notice&&<p className="dash-note info" style={{margin:'14px 0'}}>{notice}</p>}
          {!supabaseConfigured&&<p className="dash-note warn" style={{margin:'14px 0'}}>{dict.configure}</p>}
          {dbState==='missing'&&<p className="dash-note warn" style={{margin:'14px 0'}}>{dict.missingSchema}</p>}

          {payments.some(p=>p.status==='pending')&&(
            <div style={{marginTop:6}}>
              <h3 className="dash-card-title" style={{margin:'16px 0 8px'}}>{dict.how}</h3>
              <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-600">
                <li>{dict.step1}</li>
                <li>{dict.step2}</li>
                <li>{dict.step3}</li>
              </ol>
              {payments.filter(p=>p.status==='pending').map(payment=>(
                <div key={payment.id} className="dash-plan" style={{marginTop:12}}>
                  <p className="mb-2 text-sm">
                    <b>#{payment.id}</b> — {planName(payment.plan)} · {fmtMnt(payment.amount_mnt)}
                    {payment.xp_spent>0&&<span style={{color:'#15803d',marginLeft:8}}>{dict.discountPaid(String(payment.xp_spent))}</span>}
                    <span className="ml-2 text-amber-600">{dict.pending}</span>
                  </p>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                    <label className="dash-field" style={{flex:1}}>
                      <span>{dict.payNumber}</span>
                      <Input value={refs[String(payment.id)]??payment.reference??''}
                        onChange={e=>setRefs(r=>({...r,[String(payment.id)]:e.target.value}))}
                        placeholder={dict.payNumberHint}/>
                    </label>
                    <Button variant="outline" disabled={savingId===String(payment.id)} onClick={()=>saveReference(String(payment.id))}>
                      {dict.saveRef}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <h3 className="dash-card-title" style={{margin:'20px 0 8px'}}>{dict.history}</h3>
          {loading
            ?<p style={{fontSize:14,color:'#64748b'}}>{dict.loading}</p>
            :payments.length===0
              ?<p style={{fontSize:14,color:'#64748b'}}>{dict.historyEmpty}</p>
              :<div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-slate-500">
                    <th className="py-2">{dict.th.date}</th><th>{dict.th.plan}</th><th>{dict.th.amount}</th><th>{dict.th.discount}</th><th>{dict.th.status}</th><th>{dict.th.ref}</th>
                  </tr></thead>
                  <tbody>
                    {payments.map(payment=>(
                      <tr key={payment.id} className="border-t border-slate-100">
                        <td className="py-2">{fmtDate(payment.created_at)}</td>
                        <td>{planName(payment.plan)}</td>
                        <td>{fmtMnt(payment.amount_mnt)}</td>
                        <td>{payment.discount_mnt>0?`−${fmtMnt(payment.discount_mnt)}`:'—'}</td>
                        <td>{statusLabel(payment.status)}</td>
                        <td className="text-slate-500">{payment.reference||'—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>}

          <div className="flex items-center justify-end gap-3" style={{marginTop:18}}>
            {isAdmin&&<Link to="/admin" className="text-sm font-medium text-slate-500 underline">{dict.admin}</Link>}
            <Link to="/atlas" className="text-sm text-slate-500 underline">{dict.backAtlas}</Link>
            <Button size="sm" variant="outline" onClick={leave}>{dict.signOut}</Button>
          </div>
        </div>
      </div>
    </main>
  );
}
