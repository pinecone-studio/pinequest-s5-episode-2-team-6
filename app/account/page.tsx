// The student's own page: who they study as, how they are doing, what to
// study next, and how they buy premium. It wears the quiz's blue room and
// frosted glass, so the account reads as one more screen of the same app.
//
// The money path is unchanged from before — pick a plan, transfer, save the
// bank reference, an admin confirms, a database trigger grants the time. On
// top of it sits the school side: daily attendance and passed exams pay XP,
// and XP can knock up to 20% off a plan. The browser never computes any of
// those numbers; the triggers in supabase/schema.sql do.
import {useCallback,useEffect,useState,type CSSProperties} from 'react';
import {Link,useLocation,useNavigate,Navigate} from 'react-router-dom';
import {Activity,ArrowRight,Award,Box,CalendarCheck,Check,CircleAlert,CircleCheck,GraduationCap,LoaderCircle,LogOut,PencilLine,ScrollText,Shield,Sparkles,Trophy,X} from 'lucide-react';
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
    signOut:'Sign out',
    backAtlas:'Back to the atlas',
    admin:'Admin',
    loading:'Loading…',
    student:'Student',
    notSet:'Add your school details below',
    yearSuffix:(n:number)=>`Year ${n}`,
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
    plansLead:'ROM Lab and Plaque Lab are free to access. No subscription is required.',
    plans:'Plans',
    planNames:{monthly:'1 month',yearly:'1 year'} as Record<string,string>,
    buy:'Pay',
    useXp:'Use XP',
    discountAt:(v:string)=>`${v} off`,
    maxOff:(v:string)=>`Max ${v} XP`,
    balance0:'No XP to use yet.',
    payCreated:(id:string)=>`Payment #${id} is created. Transfer the amount, then save the transaction number below.`,
    how:'How to pay',
    step1:'Transfer the amount below with QPay, SocialPay, or a bank app.',
    step2:'Use your payment number as the reference so the team can find your transfer.',
    step3:'Save the transaction number in the box below. An admin verifies the transfer and premium turns on automatically.',
    bank:'Bank',
    account:'Account',
    receiver:'Receiver',
    payNumber:'Transaction number',
    payNumberHint:'Shown on your transfer receipt',
    saveRef:'Save number',
    pending:'Waiting for verification',
    history:'Payment history',
    historyEmpty:'No payments yet.',
    th:{date:'Date',plan:'Plan',amount:'Amount',discount:'Discount',status:'Status',ref:'Reference'},
    status:{pending:'Pending',completed:'Confirmed',rejected:'Rejected'} as Record<string,string>,
    discountPaid:(v:string)=>`${v} XP used`,
    configure:'Supabase is not configured: the account backend needs VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local.',
    localAccount:'You are signed in with an account kept only on this computer. XP, exams and payments live in the cloud: sign out and sign up again to use them.',
    missingSchema:'XP and exam tables are not in this database yet. Run supabase/schema.sql in the Supabase SQL editor.',
    loadError:'Some of your data could not be loaded. Refresh the page to try again.',
    error:'Something went wrong. Try again.',
    savedRef:'Transaction number saved.',
  },
  mn:{
    title:'Миний хуудас',
    signOut:'Гарах',
    backAtlas:'Атлас руу буцах',
    admin:'Админ',
    loading:'Ачаалж байна…',
    student:'Оюутан',
    notSet:'Сургуулийн мэдээллээ доор бөглөнө үү',
    yearSuffix:(n:number)=>`${n}-р жил`,
    xpHint:'Ирц болон тэнцсэн шалгалтаас XP хуримтлагдана. 1 XP = 5₮ хөнгөлөлт.',
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
    plansLead:'ROM Lab болон Plaque Lab үнэгүй. Төлбөртэй эрх шаардлагагүй.',
    plans:'Багц',
    planNames:{monthly:'1 сар',yearly:'1 жил'} as Record<string,string>,
    buy:'Төлөх',
    useXp:'XP ашиглах',
    discountAt:(v:string)=>`${v} хөнгөлөлт`,
    maxOff:(v:string)=>`хамгийн ихдээ ${v} XP`,
    balance0:'Одоогоор ашиглах XP байхгүй.',
    payCreated:(id:string)=>`#${id} төлбөр үүслээ. Дүнгээ шилжүүлээд гүйлгээний дугаараа доор хадгална уу.`,
    how:'Төлөх заавар',
    step1:'Дараах дүнг QPay, SocialPay эсвэл банкны апп ашиглан шилжүүлнэ үү.',
    step2:'Гүйлгээний утга дээр өөрийн төлбөрийн дугаарыг (#id) бичнэ үү.',
    step3:'Гүйлгээний дугаараа доор хадгална уу. Админ шалгасны дараа premium автоматаар идэвхжинэ.',
    bank:'Банк',
    account:'Данс',
    receiver:'Хүлээн авагч',
    payNumber:'Гүйлгээний дугаар',
    payNumberHint:'Таны гүйлгээний баталгаа дээр байдаг',
    saveRef:'Дугаар хадгалах',
    pending:'Баталгаажуулалт хүлээж байна',
    history:'Төлбөрийн түүх',
    historyEmpty:'Одоогоор төлбөр байхгүй.',
    th:{date:'Огноо',plan:'Багц',amount:'Дүн',discount:'Хөнгөлөлт',status:'Төлөв',ref:'Дугаар'},
    status:{pending:'Хүлээж байна',completed:'Баталгаажсан',rejected:'Татгалзсан'} as Record<string,string>,
    discountPaid:(v:string)=>`${v} XP зарцуулсан`,
    configure:'Supabase тохируулаагүй байна: VITE_SUPABASE_URL ба VITE_SUPABASE_PUBLISHABLE_KEY-г .env.local-д нэмнэ үү.',
    localAccount:'Та зөвхөн энэ компьютер дээр хадгалагдсан бүртгэлээр нэвтэрсэн байна. XP, шалгалт, төлбөр cloud-д хадгалагддаг тул гараад дахин бүртгүүлнэ үү.',
    missingSchema:'XP болон шалгалтын хүснэгт энэ өгөгдлийн баазанд байхгүй байна. supabase/schema.sql-ийг Supabase SQL editor-т ажиллуулна уу.',
    loadError:'Зарим мэдээллийг ачаалж чадсангүй. Хуудсаа дахин ачаална уу.',
    error:'Алдаа гарлаа. Дахин оролдоно уу.',
    savedRef:'Гүйлгээний дугаар хадгалагдлаа.',
  },
} as const;

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

type StudyFields=Pick<StudentProfile,'university'|'department'|'study_year'|'specialty'>;
type StudyForm={university:string;department:string;study_year:string;specialty:string};
const EMPTY_FORM:StudyForm={university:'',department:'',study_year:'',specialty:''};
const formOf=(p:StudyFields):StudyForm=>({university:p.university,department:p.department,study_year:p.study_year?String(p.study_year):'',specialty:p.specialty});

// One message at a time, shown beside the action that caused it.
type Spot='page'|'checkin'|'profile'|'pay';
type Tone='ok'|'warn'|'error';
interface Note{spot:Spot;tone:Tone;text:string}

function NoteLine({tone,text}:{tone:Tone;text:string}){
  const Icon=tone==='ok'?CircleCheck:CircleAlert;
  return <p className={`dash-note is-${tone}`} role={tone==='error'?'alert':undefined}><Icon size={16} aria-hidden/>{text}</p>;
}

/** Two concentric rings: exam average outside, weekly activity inside. */
function Rings({outer,inner,value,label,ariaLabel}:{outer:number;inner:number;value:string;label:string;ariaLabel:string}){
  const clamp=(v:number)=>Math.max(0,Math.min(100,v));
  const r1=68,c1=2*Math.PI*r1,r2=51,c2=2*Math.PI*r2;
  // A zero-length arc with round caps still paints a dot, so an empty ring draws only its track.
  return(
    <div className="dash-ring" role="img" aria-label={ariaLabel}>
      <svg width={148} height={148} viewBox="0 0 148 148" aria-hidden>
        <circle className="is-track" cx={74} cy={74} r={r1}/>
        {outer>0&&<circle className="is-outer" cx={74} cy={74} r={r1} strokeDasharray={`${(clamp(outer)/100)*c1} ${c1}`}/>}
        <circle className="is-track is-thin" cx={74} cy={74} r={r2}/>
        {inner>0&&<circle className="is-inner is-thin" cx={74} cy={74} r={r2} strokeDasharray={`${(clamp(inner)/100)*c2} ${c2}`}/>}
      </svg>
      <span className="dash-ring-center"><strong>{value}</strong><span>{label}</span></span>
    </div>
  );
}

export default function AccountPage(){
  const {lang}=useLang();
  const dict=copy[lang];
  const location=useLocation();
  const navigate=useNavigate();
  const {ready:authReady,user,session}=useAuth();
  const {ready:subReady,isAdmin,premium,expiresAt,refresh}=useSubscription();
  const ready=authReady&&subReady;
  const userId=user?.id??null;
  // Local /api/auth accounts carry no Supabase session, so every table read
  // would come back empty or refused; such a visitor gets a note instead.
  const dbReady=supabaseConfigured&&!!session;

  const [payments,setPayments]=useState<Payment[]>([]);
  const [loading,setLoading]=useState(true);
  const [loadFailed,setLoadFailed]=useState(false);
  const [savingId,setSavingId]=useState<number|null>(null);
  const [paying,setPaying]=useState<string|null>(null);
  const [refs,setRefs]=useState<Record<number,string>>({});
  const [note,setNote]=useState<Note|null>(null);

  const [xp,setXp]=useState(0);
  const [events,setEvents]=useState<XpEvent[]>([]);
  const [checkinDays,setCheckinDays]=useState(0);
  const [dbState,setDbState]=useState<DbState>('ok');
  const [checkedToday,setCheckedToday]=useState(false);
  const [checkingIn,setCheckingIn]=useState(false);

  const [attempts,setAttempts]=useState<ExamAttempt[]>([]);
  const [examNames,setExamNames]=useState<Record<number,Pick<Exam,'title'|'title_en'>>>({});
  const [exams,setExams]=useState<Exam[]>([]);
  const [quizRows,setQuizRows]=useState<{details:unknown}[]>([]);
  const [profile,setProfile]=useState<StudentProfile|null>(null);
  const [form,setForm]=useState<StudyForm>(EMPTY_FORM);
  const [savingProfile,setSavingProfile]=useState(false);
  const [spend,setSpend]=useState<Record<string,string>>({});

  useEffect(()=>{document.querySelector('meta[name=theme-color]')?.setAttribute('content','#5a8dcb');},[]);

  // The signup page forwards here with a welcome line. Show it once, then
  // drop it from history so a reload does not announce the account again.
  useEffect(()=>{
    const text=(location.state as {notice?:unknown}|null)?.notice;
    if(typeof text!=='string'||!text)return;
    setNote({spot:'page',tone:'ok',text});
    navigate(`${location.pathname}${location.search}`,{replace:true,state:null});
  },[location.state,location.pathname,location.search,navigate]);

  // Keyed on the id, not the user object or the language: a token refresh or a
  // language switch must not reload the page and wipe a half-typed form.
  const load=useCallback(async()=>{
    if(!userId||!dbReady){setLoading(false);return;}
    setLoading(true);
    setLoadFailed(false);
    const [pay,xpRes,attRes,examRes,quizRes,profRes]=await Promise.all([
      supabase.from('payments').select('*').eq('user_id',userId).order('created_at',{ascending:false}).limit(100),
      fetchXp(),
      fetchMyAttempts(),
      fetchExams(),
      fetchQuizResults(userId),
      fetchProfile(userId),
    ]);
    let failed=false;
    if(pay.error){
      console.error('[account] payments load failed',pay.error.code,pay.error.message);
      failed=true;
    }
    const parts={xp:xpRes,attempts:attRes,exams:examRes,quiz:quizRes,profile:profRes};
    for(const [what,res] of Object.entries(parts)){
      if(res.state==='error'){console.error(`[account] ${what} load failed`,res.message);failed=true;}
    }
    setLoadFailed(failed);
    setDbState(Object.values(parts).some(res=>res.state==='missing')?'missing':'ok');
    setPayments((pay.data??[]) as unknown as Payment[]);
    setXp(xpRes.data.total);
    setEvents(xpRes.data.events);
    setCheckinDays(xpRes.data.days);
    setAttempts(attRes.data);
    setExams(examRes.data);
    // A student only ever reads published papers, so an attempt against a
    // paper that has since been archived has no title in the list above;
    // ask for it by id so the review still names what was sat.
    const names:Record<number,Pick<Exam,'title'|'title_en'>>={};
    for(const e of examRes.data)names[e.id]=e;
    const archived=[...new Set(attRes.data.map(a=>a.exam_id))].filter(id=>!names[id]);
    if(archived.length){
      const extra=await Promise.all(archived.map(id=>fetchExam(id)));
      for(const r of extra){
        const e=r.data.exam;
        if(e)names[e.id]=e;
      }
    }
    setExamNames(names);
    setQuizRows(quizRes.data);
    const p=profRes.data;
    setProfile(p);
    if(p)setForm(formOf(p));
    setLoading(false);
  },[userId,dbReady]);

  useEffect(()=>{load();},[load]);

  if(!ready)return(
    <div className="dash">
      <div className="dash-bg" aria-hidden><i/><i/></div>
      <SiteNav tone="glass"/>
      <main className="dash-shell is-loading"><p className="dash-loading"><LoaderCircle size={18} className="dash-spin" aria-hidden/>{dict.loading}</p></main>
    </div>
  );
  if(!user)return <Navigate to="/login" state={{from:'/account'}} replace/>;

  const locale=lang==='mn'?'mn-MN':'en-GB';
  const fmtDate=(v:string)=>new Date(v).toLocaleString(locale,{dateStyle:'medium',timeStyle:'short'});
  const fmtDay=(v:string)=>new Date(v).toLocaleDateString(locale,{dateStyle:'medium'});
  const fmtNum=(n:number)=>n.toLocaleString(locale);
  const fmtMnt=(n:number|string)=>`${Number(n).toLocaleString(locale)}₮`;

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
  const canWrite=dbReady&&dbState!=='missing';
  const planName=(id:string)=>dict.planNames[id]??PLANS.find(p=>p.id===id)?.name??id;
  const examTitle=(id:number)=>{const e=examNames[id];return e?(lang==='mn'?e.title:e.title_en||e.title):`#${id}`;};
  const name=profile?.name||(user.user_metadata?.name as string|undefined)||user.email||'';
  const initials=(name||'?').trim().split(/\s+/).slice(0,2).map(w=>w[0]?.toUpperCase()??'').join('');
  const school=profile?[profile.university,profile.department,profile.specialty,profile.study_year?dict.yearSuffix(profile.study_year):''].filter(Boolean).join(' · '):'';
  // The database stamps attendance with its own current_date, which is UTC
  // on Supabase, so today's claim is looked up by the UTC date as well.
  const today=new Date().toISOString().slice(0,10);
  const hasCheckedIn=events.some(e=>e.kind==='checkin'&&e.day===today)||checkedToday;
  const saved=profile?formOf(profile):EMPTY_FORM;
  const dirty=(Object.keys(form) as (keyof StudyForm)[]).some(key=>form[key].trim()!==saved[key]);
  const pending=payments.filter(p=>p.status==='pending');
  const say=(spot:Spot,tone:Tone,text:string)=>setNote({spot,tone,text});
  const noteAt=(spot:Spot)=>note?.spot===spot?<NoteLine tone={note.tone} text={note.text}/>:null;

  async function checkIn(){
    setNote(null);
    setCheckingIn(true);
    const before=xp;
    const res=await claimCheckin();
    if(res.state!=='ok'||res.total===null){
      if(res.state==='missing')setDbState('missing');
      else console.error('[account] check-in failed',res.message);
      say('checkin','error',res.state==='missing'?dict.missingSchema:dict.error);
      setCheckingIn(false);
      return;
    }
    // Claiming twice is not an error: the balance just comes back unchanged.
    setXp(res.total);
    setCheckedToday(true);
    say('checkin','ok',res.total>before?dict.checkinOk:dict.checkinDone);
    const fresh=await fetchXp();
    if(fresh.state==='ok'){
      setEvents(fresh.data.events);
      setCheckinDays(fresh.data.days);
    }
    setCheckingIn(false);
  }

  async function saveStudyInfo(){
    setNote(null);
    setSavingProfile(true);
    const fields:StudyFields={
      university:form.university.trim(),
      department:form.department.trim(),
      study_year:Math.max(0,Math.min(10,Number(form.study_year)||0)),
      specialty:form.specialty.trim(),
    };
    const res=await saveProfile(user!.id,fields);
    if(res.state!=='ok'){
      if(res.state==='missing')setDbState('missing');
      console.error('[account] profile save failed',res.message);
      say('profile','error',res.state==='missing'?dict.missingSchema:dict.error);
      setSavingProfile(false);
      return;
    }
    setProfile(p=>({...(p??{id:user!.id,name:'',email:user!.email??'',is_admin:false}),...fields}));
    // Show what was stored: trimmed text and the clamped year.
    setForm(formOf(fields));
    say('profile','ok',dict.saved);
    setSavingProfile(false);
  }

  async function createPayment(plan:Plan,useXp:number){
    if(paying)return;
    setNote(null);
    setPaying(plan.id);
    const row:Record<string,unknown>={
      // The columns hold the plan id, not the whole plan object.
      user_id:user!.id,plan:plan.id,amount_mnt:plan.priceMnt,method:'qpay',status:'pending',
    };
    // xp_spent only exists once supabase/schema.sql has been run. Leaving it
    // out when nobody asked for a discount keeps the plain payment flow
    // working on a database that has not been migrated yet.
    if(useXp>0)row.xp_spent=useXp;
    const {data,error}=await supabase.from('payments').insert(row).select().single();
    if(error){
      // The visitor sees a friendly line; the exact PostgREST reason belongs in the console.
      console.error('[account] payment create failed',error.code,error.message);
      say('pay','error',dict.error);
      setPaying(null);
      return;
    }
    const created=data as unknown as Payment;
    setPayments(p=>[created,...p]);
    setSpend(s=>({...s,[plan.id]:''}));
    say('pay','ok',dict.payCreated(String(created.id)));
    if(useXp>0){
      const fresh=await fetchXp();
      if(fresh.state==='ok'){
        setXp(fresh.data.total);
        setEvents(fresh.data.events);
        setCheckinDays(fresh.data.days);
      }
    }
    setPaying(null);
  }

  async function saveReference(payment:Payment){
    setNote(null);
    setSavingId(payment.id);
    const value=(refs[payment.id]??payment.reference??'').trim();
    // Only a pending order takes a reference; asking for the row back tells
    // an order an admin already settled apart from a real save.
    const {data,error}=await supabase.from('payments').update({reference:value}).eq('id',payment.id).eq('status','pending').select('id');
    if(error||!data?.length){
      console.error('[account] reference save failed',error?.code??'no_row',error?.message??'the payment is no longer pending');
      say('pay','error',dict.error);
    }else{
      // The history table reads local state, so mirror the saved value here.
      setPayments(p=>p.map(row=>row.id===payment.id?{...row,reference:value}:row));
      setRefs(r=>({...r,[payment.id]:value}));
      say('pay','ok',dict.savedRef);
      refresh();
    }
    setSavingId(null);
  }

  // Navigate before signing out: the guard above would otherwise bounce a
  // signed-out visitor to /login instead of the landing page.
  async function leave(){navigate('/',{replace:true});await signOut();}

  const tiles=[
    {Icon:Award,value:xp,label:dict.tiles.xp,accent:true},
    {Icon:CalendarCheck,value:checkinDays,label:dict.tiles.days,accent:false},
    {Icon:PencilLine,value:attempts.length,label:dict.tiles.attempts,accent:false},
    {Icon:Trophy,value:passedExams.size,label:dict.tiles.passed,accent:false},
  ];
  const pageNotes:{tone:Tone;text:string}[]=[];
  if(!supabaseConfigured)pageNotes.push({tone:'warn',text:dict.configure});
  else if(!session)pageNotes.push({tone:'warn',text:dict.localAccount});
  if(dbState==='missing')pageNotes.push({tone:'warn',text:dict.missingSchema});
  if(loadFailed)pageNotes.push({tone:'error',text:dict.loadError});

  return(
    <div className="dash">
      <div className="dash-bg" aria-hidden><i/><i/></div>
      <SiteNav tone="glass"/>
      <main className="dash-shell" aria-busy={loading}>
        <div className="dash-notes dash-wide" aria-live="polite">
          {pageNotes.map(n=><NoteLine key={n.text} tone={n.tone} text={n.text}/>)}
          {noteAt('page')}
        </div>

        <section className="dash-card dash-glass" aria-labelledby="dash-name">
          <div className="dash-student">
            <span className="dash-avatar" aria-hidden>{initials}</span>
            <div className="dash-who">
              <p className="dash-kicker">{dict.title}</p>
              <h1 id="dash-name">{name||dict.student}</h1>
              <p className="dash-meta">{school||dict.notSet}</p>
            </div>
          </div>
          <ul className="dash-facts">
            {unlocked
              ?<li className="is-lime"><Sparkles size={14} aria-hidden/>{premium&&expiresAt?dict.until(fmtDay(expiresAt)):dict.premiumAdmin}</li>
              :<li>{dict.free}</li>}
            {user.email&&<li>{user.email}</li>}
          </ul>
          <ul className="dash-tiles">
            {tiles.map(({Icon,value,label,accent})=>(
              <li className={`dash-tile ${accent?'is-accent':''}`} key={label}>
                <span className="dash-tile-icon"><Icon size={17} aria-hidden/></span>
                <span><b>{loading?'–':fmtNum(value)}</b><small>{label}</small></span>
              </li>
            ))}
          </ul>
          <div className="dash-actions">
            <button type="button" className="dash-primary" disabled={hasCheckedIn||checkingIn||loading||!canWrite} onClick={checkIn}>
              {checkingIn?<LoaderCircle size={17} className="dash-spin" aria-hidden/>:hasCheckedIn?<Check size={17} aria-hidden/>:<CalendarCheck size={17} aria-hidden/>}
              {hasCheckedIn?dict.checkinDone:dict.checkin}
            </button>
            <Link to="/exam" className="dash-secondary dash-glass"><ScrollText size={17} aria-hidden/>{dict.goExam}</Link>
          </div>
          <div className="dash-status" aria-live="polite">{noteAt('checkin')}</div>
          <p className="dash-hint">{dict.xpHint}</p>
        </section>

        <section className="dash-card dash-glass" aria-labelledby="dash-progress">
          <h2 id="dash-progress" className="dash-kicker">{dict.progress}</h2>
          <div className="dash-progress">
            <Rings
              outer={avgScore}
              inner={(weekActive/7)*100}
              value={`${Math.round(avgScore)}%`}
              label={dict.avgScore}
              ariaLabel={`${dict.avgScore}: ${Math.round(avgScore)}%, ${dict.weekActivity}: ${weekActive}/7`}
            />
            <div className="dash-legend">
              <div><strong>{Math.round(avgScore)}%</strong><span>{dict.avgScore}</span></div>
              <div className="is-white"><strong>{weekActive}/7</strong><span>{dict.weekActivity}</span></div>
              {!loading&&attempts.length===0&&<p className="dash-hint">{dict.noExamData}</p>}
            </div>
          </div>
        </section>

        <section className="dash-card dash-glass" aria-labelledby="dash-week">
          <div className="dash-card-head">
            <h2 id="dash-week">{dict.stats}</h2>
            <span className="dash-card-hint">{dict.statsHint}</span>
          </div>
          <div className="dash-chart" role="img" aria-label={`${dict.stats}: ${week.map(d=>`${d.label} ${d.points}`).join(', ')}`}>
            {week.map((d,i)=>(
              <div className={`dash-bar-col ${i===week.length-1?'is-today':''}`} key={`${d.label}-${i}`}>
                <span className="dash-bar-value">{d.points>0?`+${d.points}`:''}</span>
                <span className={`dash-bar ${d.points>0?'':'is-empty'}`} style={{height:`${Math.max(4,(d.points/weekMax)*120)}px`}}/>
                <span className="dash-bar-label">{d.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="dash-card dash-glass" aria-labelledby="dash-next">
          <h2 id="dash-next">{dict.next}</h2>
          {next.length===0
            ?<p className="dash-empty">{dict.nextEmpty}</p>
            :<ul className="dash-list">
              {next.map(topic=>(
                <li className="dash-topic" key={topic.label}>
                  <div>
                    <span className="dash-topic-name">{topic.label}</span>
                    <span className="dash-meter" aria-hidden><i style={{'--pct':topic.correct/topic.total} as CSSProperties}/></span>
                  </div>
                  <span className="dash-topic-n">{topic.correct}/{topic.total}</span>
                  {topic.concept&&<Link className="dash-round" to={`/atlas?focus=${encodeURIComponent(topic.concept)}`} aria-label={`${dict.openAtlas}: ${topic.label}`} title={dict.openAtlas}><Box size={16} aria-hidden/></Link>}
                </li>
              ))}
            </ul>}
        </section>

        <section className="dash-card dash-glass" aria-labelledby="dash-results">
          <div className="dash-card-head">
            <h2 id="dash-results">{dict.results}</h2>
            <Link to="/exam" className="dash-head-link">{dict.goExam}<ArrowRight size={15} aria-hidden/></Link>
          </div>
          {loading
            ?<p className="dash-empty">{dict.loading}</p>
            :attempts.length===0
              ?<p className="dash-empty">{dict.resultsEmpty}</p>
              :<ul className="dash-list">
                {attempts.slice(0,6).map(a=>(
                  <li className={`dash-result ${a.passed?'is-pass':'is-fail'}`} key={a.id}>
                    <span className="dash-mark" role="img" aria-label={a.passed?dict.passedMark:dict.failedMark}>{a.passed?<Check size={15}/>:<X size={15}/>}</span>
                    <div>
                      <span className="dash-result-title">{examTitle(a.exam_id)}</span>
                      <span className="dash-result-meta">{a.passed?dict.passedMark:dict.failedMark} · {fmtDate(a.created_at)}</span>
                    </div>
                    <strong className="dash-result-score">{a.score_pct}%</strong>
                  </li>
                ))}
              </ul>}
        </section>

        <form className="dash-card dash-glass" aria-labelledby="dash-school" onSubmit={e=>{e.preventDefault();if(dirty&&!savingProfile)void saveStudyInfo();}}>
          <h2 id="dash-school">{dict.studyInfo}</h2>
          <div className="dash-form">
            <label className="dash-field">
              <span>{dict.university}</span>
              <input className="dash-input" autoComplete="organization" maxLength={120} disabled={!canWrite} value={form.university} onChange={e=>setForm(f=>({...f,university:e.target.value}))}/>
            </label>
            <label className="dash-field">
              <span>{dict.department}</span>
              <input className="dash-input" maxLength={120} disabled={!canWrite} value={form.department} onChange={e=>setForm(f=>({...f,department:e.target.value}))}/>
            </label>
            <label className="dash-field">
              <span>{dict.studyYear}</span>
              <input className="dash-input" inputMode="numeric" maxLength={2} disabled={!canWrite} value={form.study_year} onChange={e=>setForm(f=>({...f,study_year:e.target.value.replace(/\D/g,'')}))}/>
            </label>
            <label className="dash-field">
              <span>{dict.specialty}</span>
              <input className="dash-input" maxLength={120} disabled={!canWrite} value={form.specialty} onChange={e=>setForm(f=>({...f,specialty:e.target.value}))}/>
            </label>
          </div>
          <div className="dash-form-foot">
            <button type="submit" className="dash-primary" disabled={savingProfile||!canWrite||!dirty}>
              {savingProfile?<LoaderCircle size={17} className="dash-spin" aria-hidden/>:<GraduationCap size={17} aria-hidden/>}
              {dict.save}
            </button>
          </div>
          <div className="dash-status" aria-live="polite">{noteAt('profile')}</div>
        </form>

        <section className="dash-card dash-glass dash-wide" aria-labelledby="dash-premium">
          <div className="dash-card-head">
            <h2 id="dash-premium">{dict.premium}</h2>
            {unlocked
              ?<span className="dash-chip is-lime">{premium?dict.premium:dict.premiumAdmin}</span>
              :<span className="dash-chip">{dict.free}</span>}
          </div>
          {premium&&expiresAt&&<p className="dash-lead">{dict.validNow}: <b>{fmtDay(expiresAt)}</b></p>}
          <p className="dash-lead">{dict.plansLead}</p>
          <div className="dash-actions">
            <Link to="/atlas?open=rom" className="dash-secondary dash-glass"><Activity size={17} aria-hidden/>ROM Lab</Link>
            <Link to="/plaque" className="dash-secondary dash-glass"><Activity size={17} aria-hidden/>Plaque Lab</Link>
          </div>

          {!unlocked&&<>
            <h3>{dict.plans}</h3>
            <div className="dash-plans">
              {PLANS.map(plan=>{
                const maxXp=Math.floor(maxDiscountMnt(xp,plan.priceMnt)/5);
                // The trigger clamps the same way; sending the clamped number keeps the price shown and the price charged equal.
                const wanted=Math.max(0,Math.min(maxXp,Math.floor(Number(spend[plan.id]||'0')||0)));
                const price=plan.priceMnt-wanted*5;
                return(
                  <div className="dash-plan" key={plan.id}>
                    <p className="dash-plan-name">{planName(plan.id)}</p>
                    {/* The discount rides on the price line so typing XP never shifts the Pay button. */}
                    <p className="dash-plan-price">{fmtMnt(price)}{wanted>0&&<span className="dash-plan-was">{fmtMnt(plan.priceMnt)}</span>}</p>
                    {maxXp>0
                      ?<label className="dash-spend">
                        <span>{dict.useXp}</span>
                        <input className="dash-input" inputMode="numeric" maxLength={6} value={spend[plan.id]??''} onChange={e=>{const digits=e.target.value.replace(/\D/g,'');setSpend(s=>({...s,[plan.id]:digits&&String(Math.min(maxXp,Number(digits)))}));}}/>
                        {wanted>0?<span className="dash-saving">{dict.discountAt(fmtMnt(wanted*5))}</span>:<span>{dict.maxOff(String(maxXp))}</span>}
                      </label>
                      :<p className="dash-spend">{dict.balance0}</p>}
                    <button type="button" className="dash-primary" disabled={!dbReady||paying!==null} onClick={()=>createPayment(plan,wanted)}>
                      {paying===plan.id&&<LoaderCircle size={17} className="dash-spin" aria-hidden/>}
                      {dict.buy}
                    </button>
                  </div>
                );
              })}
            </div>
          </>}

          <div className="dash-status" aria-live="polite">{noteAt('pay')}</div>

          {pending.length>0&&<>
            <h3>{dict.how}</h3>
            <ol className="dash-steps">
              <li>{dict.step1}</li>
              <li>{dict.step2}</li>
              <li>{dict.step3}</li>
            </ol>
            <p className="dash-bank">
              <span>{dict.bank}: <b>{BANK.name}</b></span>
              <span>{dict.account}: <b>{BANK.account}</b></span>
              <span>{dict.receiver}: <b>{BANK.receiver}</b></span>
            </p>
            {pending.map(payment=>{
              const value=refs[payment.id]??payment.reference??'';
              return(
                <div className="dash-pay" key={payment.id}>
                  <p className="dash-pay-head">
                    <b>#{payment.id}</b>
                    <span>{planName(payment.plan)} · {fmtMnt(payment.amount_mnt)}</span>
                    {payment.xp_spent>0&&<span className="dash-saving">{dict.discountPaid(String(payment.xp_spent))}</span>}
                    <span className="dash-chip">{dict.pending}</span>
                  </p>
                  <div className="dash-ref">
                    <label className="dash-field">
                      <span>{dict.payNumber}</span>
                      <input className="dash-input" maxLength={80} value={value} placeholder={dict.payNumberHint} onChange={e=>setRefs(r=>({...r,[payment.id]:e.target.value}))}/>
                    </label>
                    <button type="button" className="dash-secondary dash-glass" disabled={savingId===payment.id||!value.trim()||value.trim()===payment.reference} onClick={()=>saveReference(payment)}>
                      {savingId===payment.id&&<LoaderCircle size={17} className="dash-spin" aria-hidden/>}
                      {dict.saveRef}
                    </button>
                  </div>
                </div>
              );
            })}
          </>}

          <h3>{dict.history}</h3>
          {loading
            ?<p className="dash-empty">{dict.loading}</p>
            :payments.length===0
              ?<p className="dash-empty">{dict.historyEmpty}</p>
              :<div className="dash-table">
                <table>
                  <thead><tr>
                    <th>{dict.th.date}</th><th>{dict.th.plan}</th><th>{dict.th.amount}</th><th>{dict.th.discount}</th><th>{dict.th.status}</th><th>{dict.th.ref}</th>
                  </tr></thead>
                  <tbody>
                    {payments.map(payment=>(
                      <tr key={payment.id}>
                        <td>{fmtDate(payment.created_at)}</td>
                        <td>{planName(payment.plan)}</td>
                        <td>{fmtMnt(payment.amount_mnt)}</td>
                        <td className={payment.discount_mnt>0?'':'is-faint'}>{payment.discount_mnt>0?`−${fmtMnt(payment.discount_mnt)}`:'—'}</td>
                        <td><span className={`dash-chip ${payment.status==='completed'?'is-lime':payment.status==='rejected'?'is-coral':''}`}>{dict.status[payment.status]??payment.status}</span></td>
                        <td className="is-faint">{payment.reference||'—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>}
        </section>

        <footer className="dash-foot dash-wide">
          {isAdmin&&<Link to="/admin" className="dash-secondary dash-glass"><Shield size={17} aria-hidden/>{dict.admin}</Link>}
          <Link to="/atlas" className="dash-secondary dash-glass"><Box size={17} aria-hidden/>{dict.backAtlas}</Link>
          <button type="button" className="dash-secondary dash-glass" onClick={leave}><LogOut size={17} aria-hidden/>{dict.signOut}</button>
        </footer>
      </main>
    </div>
  );
}
