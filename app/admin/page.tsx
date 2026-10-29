// Admin page: the payment queue, the exam bank, the user list and one user's
// panel (points, exam results, payments, premium time). Confirming a payment
// is a single update — a database trigger turns it into subscription time
// automatically. The exam bank holds drafts until an admin publishes them, so
// a student never sees an unreviewed question; the assistant only writes
// candidates for this page. Everything the panel shows is read through the
// admin policies in supabase/schema.sql, so it is a teacher's view of the same
// rows the student sees on /profile.
import {useCallback,useEffect,useState} from 'react';
import {Navigate} from 'react-router-dom';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Card,CardContent,CardHeader,CardTitle} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {NativeSelect,NativeSelectOption} from '@/components/ui/native-select';
import {supabase} from '../../lib/supabase';
import {useSubscription} from '../../hooks/use-subscription';
import {useAuth} from '../../hooks/use-auth';
import {useLang} from '../locale';
import PageScroll from '../page-scroll';
import SiteNav from '../site-nav';
import {resolveStructureFact} from '../structure-facts';
import {EXAM_GROUPS,groupLabel,partLabel,partTitle,type ExamGroupId} from '../../lib/anatomy-groups';
import {fetchProfile,saveDraftPaper,type StudentProfile} from '../../lib/exam-store';

const copy={
  en:{
    title:'Admin',
    users:'Users',
    payments:'Payments',
    newUser:'New user',
    name:'Name',email:'Email',registered:'Registered',role:'Role',
    admin:'Admin',member:'Member',becomeAdmin:'Make admin',becomeAdminHint:'Revoke admin',
    plan:'Plan',amount:'Amount',ref:'Reference',created:'Created',actions:'Actions',
    status:{pending:'Pending',completed:'Confirmed',rejected:'Rejected'},
    confirm:'Confirm',reject:'Reject',
    noPayments:'No payments yet.',noUsers:'No users yet.',
    noAccess:'This page is for admins only.',
    search:'Search name or email',
    history:'Subscription history',
    none:'—',
    exams:'Exam bank',
    examTitle:'Title',examTopic:'Topic',examQuestions:'Questions',examPoints:'Points',
    examTime:'Minutes',examPass:'Pass %',examStatus:'Status',
    examStatusText:{draft:'Draft',published:'Published',archived:'Archived'},
    publish:'Publish',archive:'Archive',backDraft:'Back to draft',
    noExams:'No exam paper yet.',
    examMissing:'The exam and XP tables are not in this database yet. Run supabase/schema.sql in the Supabase SQL editor.',
    draftTitle:'AI draft',
    draftTopic:'Topic',
    draftCount:'Number of questions',
    draftMake:'Write questions',
    draftWorking:'Writing…',
    draftNone:'No question drafted yet.',
    draftSave:'Save as a draft paper',
    draftSaved:'Draft paper saved.',
    draftExamName:'Paper title',
    draftKind:{mcq:'Multiple choice',case:'Case'},
    draftAnswer:'Correct answer',
    draftRubric:'Marking notes',
    batchTitle:'Generate a whole group',
    batchLead:'Pick an anatomy group and its structures. The assistant writes one draft paper per structure, grounded on the atlas notes; nothing reaches a student until you publish it.',
    batchGroup:'Group',
    batchParts:'Structures',
    batchAll:'Select all',
    batchClear:'Clear',
    batchCount:'Questions per paper',
    batchRun:'Write the papers',
    batchPickParts:'Choose at least one structure.',
    batchDone:(made:number,failed:number)=>`${made} draft paper${made===1?'':'s'} saved${failed?`, ${failed} failed`:''}.`,
    batchEmpty:'The assistant wrote no usable question for these structures.',
    grantXp:'Grant XP',
    grantXpHint:'Points to add',
    grantedXp:(v:string)=>`Balance: ${v} XP`,
    grantFail:'Could not grant XP.',
    panel:'User panel',
    view:'Open',
    close:'Close',
    loading:'Loading…',
    xpBalance:'XP',attendance:'Days attended',examsSat:'Exams sat',examsPassed:'Passed',avgScore:'Average score',
    school:'School details',university:'University',department:'Department',specialty:'Specialty',year:'Year',
    noSchool:'Not filled in yet.',
    attempts:'Exam results',noAttempts:'No exam handed in yet.',
    paper:'Paper',score:'Score',passedText:'Passed',failedText:'Not passed',
    paymentsOf:'Payments',noPaymentsOf:'No payment yet.',
    practice:'Quiz practice',noPractice:'No quiz result.',
    premiumUntil:'Premium until',premiumNone:'Free access',
    grantPremium:'Add premium days',grantPremiumHint:'Days',
    premiumGiven:(v:string)=>`Premium extended to ${v}`,
    panelMissing:'The exam and XP tables are missing for this user. Run supabase/schema.sql.',
  },
  mn:{
    title:'Админ',
    users:'Хэрэглэгчид',
    payments:'Төлбөрийн хүсэлт',
    newUser:'Шинэ хэрэглэгч',
    name:'Нэр',email:'Имэйл',registered:'Бүртгүүлсэн',role:'Эрх',
    admin:'Админ',member:'Хэрэглэгч',becomeAdmin:'Админ болгох',becomeAdminHint:'Эрх авах',
    plan:'Багц',amount:'Дүн',ref:'Дугаар',created:'Өдөр',actions:'Үйлдэл',
    status:{pending:'Хүлээж байна',completed:'Баталгаажсан',rejected:'Татгалзсан'},
    confirm:'Батлах',reject:'Татгалзах',
    noPayments:'Хүлээж буй төлбөр байхгүй.',noUsers:'Хэрэглэгч байхгүй.',
    search:'Нэр эсвэл имэйл хайх',
    noAccess:'Энэ хуудас зөвхөн админд зориулагдсан.',
    history:'Subscription түүх',
    none:'—',
    exams:'Шалгалтын сан',
    examTitle:'Гарчиг',examTopic:'Сэдэв',examQuestions:'Асуулт',examPoints:'Оноо',
    examTime:'Минут',examPass:'Тэнцэх %',examStatus:'Төлөв',
    examStatusText:{draft:'Бэлтгэл',published:'Нийтлэгдсэн',archived:'Хаагдсан'},
    publish:'Нийтлэх',archive:'Хаах',backDraft:'Бэлтгэл рүү',
    noExams:'Шалгалтын бичиг байхгүй.',
    examMissing:'XP болон шалгалтын хүснэгт энэ өгөгдлийн баазанд байхгүй байна. supabase/schema.sql-ийг Supabase SQL editor-т ажиллуулна уу.',
    draftTitle:'AI-аар асуулт зохиох',
    draftTopic:'Сэдэв',
    draftCount:'Асуултын тоо',
    draftMake:'Асуулт бичих',
    draftWorking:'Бичиж байна…',
    draftNone:'Одоогоор асуулт бичээгүй.',
    draftSave:'Бэлтгэл бичиг хадгалах',
    draftSaved:'Бэлтгэл бичиг хадгалагдлаа.',
    draftExamName:'Бичрийн гарчиг',
    draftKind:{mcq:'Олон сонголт',case:'Кэйс'},
    draftAnswer:'Зөв хариулт',
    draftRubric:'Үнэлгээний заавар',
    batchTitle:'Бүлэг бүрэн үүсгэх',
    batchLead:'Анатомийн бүлэг, доторх хэсгүүдийг сонгоно уу. Туслах хэсэг бүрт нэг бэлтгэл шалгалт бичнэ. Та нийтлэх хүртэл хүүдэд харагдахгүй.',
    batchGroup:'Бүлэг',
    batchParts:'Анатомийн хэсгүүд',
    batchAll:'Бүгдийг сонгох',
    batchClear:'Цэвэрлэх',
    batchCount:'Нэг шалгалтад асуулт',
    batchRun:'Шалгалтуудыг бичих',
    batchPickParts:'Дор хаяж нэг хэсэг сонгоно уу.',
    batchDone:(made:number,failed:number)=>`${made} бэлтгэл шалгалт хадгалагдлаа${failed?`, ${failed} амжилтгүй`:''}.`,
    batchEmpty:'Эдгээр хэсэгт туслах ашиглах боломжтой асуулт бичсэнгүй.',
    grantXp:'XP өгөх',
    grantXpHint:'Нэмэх оноо',
    grantedXp:(v:string)=>`Үлдэгдэл: ${v} XP`,
    grantFail:'XP өгч чадсангүй.',
    panel:'Хэрэглэгчийн самбар',
    view:'Дэлгэрэнгүй',
    close:'Хаах',
    loading:'Ачаалж байна…',
    xpBalance:'XP',attendance:'Ирсэн өдөр',examsSat:'Өгсөн шалгалт',examsPassed:'Тэнцсэн',avgScore:'Дундаж оноо',
    school:'Сургуулийн мэдээлэл',university:'Сургууль',department:'Салбар',specialty:'Мэргэжил',year:'Курс',
    noSchool:'Одоогоор бөглөөгүй.',
    attempts:'Шалгалтын дүн',noAttempts:'Шалгалт өгөөгүй.',
    paper:'Бичиг',score:'Оноо',passedText:'Тэнцсэн',failedText:'Тэнцээгүй',
    paymentsOf:'Төлбөр',noPaymentsOf:'Төлбөр байхгүй.',
    practice:'Quiz дасгал',noPractice:'Quiz үр дүн байхгүй.',
    premiumUntil:'Эрхийн төгсгөл',premiumNone:'Үнэгүй эрх',
    grantPremium:'Эрх нэмэх',grantPremiumHint:'Хоног',
    premiumGiven:(v:string)=>`Эрх ${v} хүртэл сунгалаа`,
    panelMissing:'Энэ хэрэглэгчийн шалгалт, XP-ийн хүснэгт байхгүй байна. supabase/schema.sql-ийг ажиллуулна уу.',
  },
} as const;

const fmt=(v:string)=>new Date(v).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'});

interface Profile{id:string;name:string;email:string;is_admin:boolean;created_at:string}
interface Payment{id:number;user_id:string;plan:string;amount_mnt:number;status:string;reference:string;created_at:string}
interface ExamRow{
  id:number;title:string;title_en:string;topic:string;level:string;
  time_limit_min:number;pass_pct:number;status:string;
  group_key:string;part_key:string;part_mn:string;source:string;
  question_count:number;total_points:number;
}
// The shape /api/exam returns for mode 'draft'. Kept here so the browser
// bundle never has to import the server module.
interface DraftQ{
  kind:'mcq'|'case';
  prompt:string;
  prompt_en:string;
  options:string[];
  answer:number|null;
  rubric:string;
  points:number;
}

interface XpRow{id:number;kind:string;points:number;day:string;note:string;created_at:string}
interface AttemptRow{id:number;exam_id:number;score_pct:number;passed:boolean;xp_awarded:number;created_at:string}
interface SubRow{id:number;plan:string;expires_at:string}
interface QuizRow{id:number;score:number;total:number;created_at:string}

/** Every paper, draft included, with how many questions it holds. */
async function loadExams(): Promise<{rows:ExamRow[];missing:boolean}>{
  const {data,error}=await supabase.from('exams').select('*').order('created_at',{ascending:false}).limit(100);
  if(error){
    console.error('[admin] exams load failed',error.code,error.message);
    return {rows:[],missing:true};
  }
  const rows=(data??[]) as Omit<ExamRow,'question_count'|'total_points'>[];
  if(!rows.length) return {rows:[],missing:false};
  const {data:questions}=await supabase.from('exam_questions')
    .select('exam_id,points')
    .in('exam_id',rows.map(r=>r.id));
  const tally=new Map<number,{count:number;points:number}>();
  for(const q of (questions??[]) as {exam_id:number;points:number}[]){
    const entry=tally.get(q.exam_id)??{count:0,points:0};
    entry.count+=1;
    entry.points+=q.points;
    tally.set(q.exam_id,entry);
  }
  return {
    rows:rows.map(r=>({
      ...r,
      group_key:r.group_key??'',
      part_key:r.part_key??'',
      part_mn:r.part_mn??'',
      source:r.source??'manual',
      question_count:tally.get(r.id)?.count??0,
      total_points:tally.get(r.id)?.points??0,
    })) as ExamRow[],
    missing:false,
  };
}

/**
 * One student as the admin sees them: the same rows the /profile dashboard
 * reads, looked up by user id. Each query is filtered by the admin policies in
 * supabase/schema.sql, and a missing table only dims the panel — the list
 * beside it keeps working.
 */
interface UserDetail{
  profile:StudentProfile|null;
  xp:number;
  events:XpRow[];
  attempts:AttemptRow[];
  payments:Payment[];
  subs:SubRow[];
  quizzes:QuizRow[];
  titles:Record<number,string>;
  missing:boolean;
}

async function loadUserDetail(userId:string,lang:'en'|'mn'): Promise<UserDetail>{
  const [
    profRes,
    {data:balance,error:balanceError},
    {data:events,error:eventsError},
    {data:attempts,error:attemptsError},
    {data:pay},
    {data:subs},
    {data:quizzes},
  ] = await Promise.all([
    fetchProfile(userId),
    supabase.rpc('xp_balance',{p_user:userId}),
    supabase.from('xp_events').select('id,kind,points,day,note,created_at').eq('user_id',userId).order('created_at',{ascending:false}).limit(60),
    supabase.from('exam_attempts').select('id,exam_id,score_pct,passed,xp_awarded,created_at').eq('user_id',userId).order('created_at',{ascending:false}).limit(60),
    supabase.from('payments').select('id,user_id,plan,amount_mnt,status,reference,created_at').eq('user_id',userId).order('created_at',{ascending:false}).limit(60),
    supabase.from('subscriptions').select('id,plan,expires_at').eq('user_id',userId).order('expires_at',{ascending:false}),
    supabase.from('quiz_results').select('id,score,total,created_at').eq('user_id',userId).order('created_at',{ascending:false}).limit(30),
  ]);
  const attemptRows=(attempts??[]) as AttemptRow[];
  const examIds=[...new Set(attemptRows.map(a=>a.exam_id))];
  const titles:Record<number,string>={};
  if(examIds.length){
    const {data:rows}=await supabase.from('exams').select('id,title,title_en').in('id',examIds);
    for(const row of (rows??[]) as {id:number;title:string;title_en:string}[]){
      titles[row.id]=lang==='mn'?row.title:row.title_en||row.title;
    }
  }
  return {
    profile:profRes.data,
    xp:Number(balance)||0,
    events:(events??[]) as XpRow[],
    attempts:attemptRows,
    payments:(pay??[]) as Payment[],
    subs:(subs??[]) as SubRow[],
    quizzes:(quizzes??[]) as QuizRow[],
    titles,
    missing:Boolean(balanceError||eventsError||attemptsError),
  };
}

export default function AdminPage(){
  const {lang}=useLang();
  const dict=copy[lang];
  const {user}=useAuth();
  const {ready:subReady,isAdmin,refresh}=useSubscription();
  const ready=subReady;
  const [profiles,setProfiles]=useState<Profile[]>([]);
  const [payments,setPayments]=useState<Payment[]>([]);
  const [exams,setExams]=useState<ExamRow[]>([]);
  const [examMissing,setExamMissing]=useState(false);
  const [draftTopic,setDraftTopic]=useState('');
  const [draftCount,setDraftCount]=useState('5');
  const [draftName,setDraftName]=useState('');
  const [draftList,setDraftList]=useState<DraftQ[]>([]);
  const [draftBusy,setDraftBusy]=useState(false);
  const [draftSaving,setDraftSaving]=useState(false);
  const [draftSaved,setDraftSaved]=useState(false);
  const [batchGroup,setBatchGroup]=useState<ExamGroupId>('skeletal');
  const [batchParts,setBatchParts]=useState<string[]>([]);
  const [batchCount,setBatchCount]=useState('5');
  const [batchBusy,setBatchBusy]=useState(false);
  const [batchDone,setBatchDone]=useState('');
  const [grant,setGrant]=useState<Record<string,string>>({});
  const [grantNotice,setGrantNotice]=useState('');
  const [selected,setSelected]=useState<Profile|null>(null);
  const [detail,setDetail]=useState<UserDetail|null>(null);
  const [detailBusy,setDetailBusy]=useState(false);
  const [premiumDays,setPremiumDays]=useState('30');
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [query,setQuery]=useState('');

  const load=useCallback(async()=>{
    if(!user)return;
    setLoading(true);
    setError('');
    const [{data:users,error:usersError},{data:pay,error:payError},examRes]=await Promise.all([
      supabase.from('profiles').select('id,name,email,is_admin,created_at').order('created_at',{ascending:false}).limit(200),
      // No embedded join here: payments. The user's name/email are taken
      // from the profiles list already loaded above.
      supabase.from('payments').select('id,user_id,plan,amount_mnt,status,reference,created_at').order('created_at',{ascending:false}).limit(200),
      loadExams(),
    ]);
    if(usersError||payError)setError(usersError?.message??payError?.message??'Error');
    setProfiles((users??[]) as Profile[]);
    setPayments((pay??[]) as Payment[]);
    setExams(examRes.rows);
    setExamMissing(examRes.missing);
    setLoading(false);
    // Keep an open user panel in step with the tables it reads.
    if(selected)setDetail(await loadUserDetail(selected.id,lang));
  },[user,selected,lang]);

  useEffect(()=>{if(ready&&isAdmin)load();},[ready,isAdmin,load]);

  if(!ready)return <main className="flex min-h-screen items-center justify-center text-slate-500">…</main>;
  if(!user)return <Navigate to="/login" state={{from:'/admin'}} replace/>;
  if(!isAdmin)return <main className="mx-auto max-w-md px-4 py-16 text-center text-slate-600">{dict.noAccess}</main>;

  async function setAdmin(row:Profile,admin:boolean){
    const {error}=await supabase.from('profiles').update({is_admin:admin}).eq('id',row.id);
    if(error){setError(error.message);return;}
    setProfiles(rows=>rows.map(r=>r.id===row.id?{...r,is_admin:admin}:r));
    refresh();
  }

  async function setStatus(row:Payment,status:'completed'|'rejected'){
    const {data:{user:me},error:meError}=await supabase.auth.getUser();
    if(meError||!me){setError(meError?.message??'Not signed in');return;}
    const {error}=await supabase.from('payments').update({
      status,confirmed_at:new Date().toISOString(),confirmed_by:me.id,
    }).eq('id',row.id);
    if(error){setError(error.message);return;}
    setPayments(rows=>rows.map(r=>r.id===row.id?{...r,status}:r));
    refresh();
  }

  async function setExamStatus(row:ExamRow,status:'draft'|'published'|'archived'){
    const {error}=await supabase.from('exams').update({status}).eq('id',row.id);
    if(error){setError(error.message);return;}
    setExams(rows=>rows.map(r=>r.id===row.id?{...r,status}:r));
  }

  // Ask the assistant for candidate questions. Nothing is stored yet: the
  // admin reads them here, and only "save" writes a draft paper.
  async function makeDraft(){
    setError('');
    setDraftSaved(false);
    const topic=draftTopic.trim();
    if(!topic){setError(lang==='en'?'Enter a topic.':'Сэдвээ бичнэ үү.');return;}
    setDraftBusy(true);
    try{
      const res=await fetch('/api/exam',{
        method:'POST',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({mode:'draft',lang,topic,count:Number(draftCount)||5}),
      });
      const body=await res.json() as {ok?:boolean;questions?:DraftQ[];message?:string};
      if(!res.ok||!body.ok){setError(body.message??(lang==='en'?'Could not draft questions.':'Асуулт бичиж чадсангүй.'));}
      else setDraftList(body.questions??[]);
    }catch{
      setError(lang==='en'?'Could not reach the exam endpoint.':'Шалгалтын endpoint хүрсэнгүй.');
    }
    setDraftBusy(false);
  }

  async function saveDraft(){
    if(!draftList.length||draftSaving)return;
    setError('');
    setDraftSaving(true);
    const topic=draftTopic.trim();
    const stored=await saveDraftPaper({
      title:(draftName.trim()||topic).slice(0,120),
      topic,
      source:'ai',
      questions:draftList,
    });
    setDraftSaving(false);
    if(!stored.data){
      setStateMessage(stored);
      return;
    }
    const examRes=await loadExams();
    setExams(examRes.rows);
    setExamMissing(examRes.missing);
    setDraftSaved(true);
  }

  /** A missing table is a different message from a plain failure. */
  function setStateMessage(result:{state:string;message?:string}){
    if(result.state==='missing')setError(dict.examMissing);
    else setError(result.message??'Error');
  }

  /**
   * Batch drafting: one request per structure, each stored as its own draft
   * paper. Sequential on purpose — the provider is rate limited and a stalled
   * loop is easier to read than twelve calls that all failed at once. The
   * structure's own notes from app/structure-facts.ts go with the request, so
   * the model writes about a verified function and nerve instead of guessing.
   */
  async function runBatch(){
    if(batchBusy)return;
    const group=EXAM_GROUPS.find(item=>item.id===batchGroup)??EXAM_GROUPS[0];
    const parts=group.parts.filter(key=>batchParts.includes(key));
    setError('');
    setBatchDone('');
    if(!parts.length){setError(dict.batchPickParts);return;}
    setBatchBusy(true);
    let made=0;
    let failed=0;
    for(const part of parts){
      setBatchDone(`${groupLabel(group.id,lang)} · ${partLabel(part,lang)}`);
      try{
        const fact=resolveStructureFact(part);
        const res=await fetch('/api/exam',{
          method:'POST',
          headers:{'content-type':'application/json'},
          body:JSON.stringify({
            mode:'draft',
            lang,
            topic:`${groupLabel(group.id,lang)}: ${partLabel(part,lang)}`,
            count:Number(batchCount)||5,
            group:group.id,
            part,
            facts:{name:part,latin:fact?.latin??'',function:fact?.function??'',nerve:fact?.nerve??''},
          }),
        });
        const body=await res.json() as {ok?:boolean;questions?:DraftQ[];message?:string};
        const questions=body.questions??[];
        if(!res.ok||!body.ok||!questions.length){failed+=1;continue;}
        // The same title shape the seeded bank uses: "Яс: гуяны яс".
        const stored=await saveDraftPaper({
          title:`${groupLabel(group.id,'mn')}: ${partTitle(part,'mn')}`,
          titleEn:`${groupLabel(group.id,'en')}: ${part}`,
          topic:groupLabel(group.id,'mn'),
          groupKey:group.id,
          partKey:part,
          partMn:partTitle(part,'mn'),
          source:'ai',
          timeLimitMin:6,
          passPct:80,
          questions,
        });
        if(stored.data)made+=1;
        else failed+=1;
      }catch{
        failed+=1;
      }
    }
    const examRes=await loadExams();
    setExams(examRes.rows);
    setExamMissing(examRes.missing);
    setBatchBusy(false);
    setBatchDone(made?dict.batchDone(made,failed):dict.batchEmpty);
  }

  async function openUser(row:Profile){
    setError('');
    setGrantNotice('');
    setSelected(row);
    setDetail(null);
    setDetailBusy(true);
    try{
      setDetail(await loadUserDetail(row.id,lang));
    }catch(err){
      console.error('[admin] user panel load failed',err);
      setError(dict.panelMissing);
    }
    setDetailBusy(false);
  }

  async function grantXp(row:Profile){
    setError('');
    setGrantNotice('');
    const points=Math.round(Number(grant[row.id]||'0')||0);
    if(!points){setError(dict.grantXpHint);return;}
    const {data,error}=await supabase.rpc('grant_xp',{p_user:row.id,p_points:points,p_note:'admin'});
    if(error){
      console.error('[admin] grant_xp failed',error.code,error.message);
      setError(dict.grantFail);
      return;
    }
    setGrantNotice(`${row.name||row.email}: ${dict.grantedXp(String(Number(data)||0))}`);
    setGrant(g=>({...g,[row.id]:''}));
    if(selected?.id===row.id)setDetail(await loadUserDetail(row.id,lang));
  }

  // Premium time without a payment record: the subscriptions table has an
  // insert policy for admins, and the client picks up the new expiry through
  // useSubscription().refresh(). Existing time is stacked, never shortened.
  async function givePremium(row:Profile){
    setError('');
    setGrantNotice('');
    const days=Math.round(Number(premiumDays)||0);
    if(!days||days<1||days>365){setError(dict.grantPremiumHint);return;}
    const current=detail?.subs[0]?.expires_at;
    const base=current&&new Date(current).getTime()>Date.now()?current:new Date().toISOString();
    const until=new Date(new Date(base).getTime()+days*86400000).toISOString();
    const {error}=await supabase.from('subscriptions').insert({
      user_id:row.id,plan:days>=330?'yearly':'monthly',starts_at:base,expires_at:until,
    });
    if(error){
      console.error('[admin] premium grant failed',error.code,error.message);
      setError(error.message);
      return;
    }
    setGrantNotice(dict.premiumGiven(new Date(until).toLocaleDateString()));
    setDetail(await loadUserDetail(row.id,lang));
    refresh();
  }

  const term=query.trim().toLowerCase();
  const visible=term
    ?profiles.filter(p=>p.name?.toLowerCase().includes(term)||p.email?.toLowerCase().includes(term))
    :profiles;
  const statusLabel=(key:string)=>String((dict.status as Record<string,string>)[key]??key);
  // Payment rows carry user_id only; resolve the display name/email from
  // the profiles table fetched above.
  const profileById=new Map(profiles.map(p=>[p.id,p]));
  const holderOf=(id:string)=>profileById.get(id);

  return(
    <PageScroll className="mx-auto min-h-screen max-w-5xl bg-white px-4 pt-[calc(var(--site-nav-h)+24px)] pb-8 text-slate-900">
      <SiteNav tone="light"/>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-semibold">{dict.title}</h1>
        <Button onClick={()=>{load();refresh();}}>{lang==='en'?'Refresh':'Шинэчлэх'}</Button>
      </div>
      {error&&<p className="mb-4 text-sm text-red-600">{error}</p>}

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">{dict.payments}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading
            ?<p className="text-sm text-slate-500">…</p>
            :payments.length===0
              ?<p className="text-sm text-slate-500">{dict.noPayments}</p>
              :<div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-slate-500">
                    <th className="py-2">{dict.name}</th><th>{dict.plan}</th><th>{dict.amount}</th><th>{lang==='en'?'Status':'Төлөв'}</th><th>{dict.ref}</th><th>{dict.created}</th><th>{dict.actions}</th>
                  </tr></thead>
                  <tbody>
                    {payments.map(payment=>(
                      <tr key={payment.id} className={`border-t border-slate-100 ${payment.status==='pending'?'bg-amber-50/60':''}`}>
                        <td className="py-2">{holderOf(payment.user_id)?.name||holderOf(payment.user_id)?.email||dict.none}</td>
                        <td>{payment.plan==='yearly'?'1 жил':'1 сар'}</td>
                        <td>{payment.amount_mnt.toLocaleString()}₮</td>
                        <td><Badge variant={payment.status==='completed'?'default':payment.status==='rejected'?'destructive':'secondary'}>
                          {statusLabel(payment.status)}
                        </Badge></td>
                        <td className="text-slate-500">{payment.reference||dict.none}</td>
                        <td className="text-slate-500">{fmt(payment.created_at)}</td>
                        <td>
                          {payment.status==='pending'&&
                            <div className="flex gap-2">
                              <Button size="sm" onClick={()=>setStatus(payment,'completed')}>{dict.confirm}</Button>
                              <Button size="sm" variant="outline" onClick={()=>setStatus(payment,'rejected')}>{dict.reject}</Button>
                            </div>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">{dict.exams}</CardTitle>
        </CardHeader>
        <CardContent>
          {examMissing
            ?<p className="text-sm text-amber-700">{dict.examMissing}</p>
            :<>
              {loading
                ?<p className="text-sm text-slate-500">…</p>
                :exams.length===0
                  ?<p className="text-sm text-slate-500">{dict.noExams}</p>
                  :<div className="overflow-x-auto mb-6">
                    <table className="w-full text-sm">
                      <thead><tr className="text-left text-slate-500">
                        <th className="py-2">{dict.examTitle}</th><th>{dict.examTopic}</th><th>{dict.examQuestions}</th><th>{dict.examPoints}</th>
                        <th>{dict.examTime}</th><th>{dict.examPass}</th><th>{dict.examStatus}</th><th>{dict.actions}</th>
                      </tr></thead>
                      <tbody>
                        {exams.map(exam=>(
                          <tr key={exam.id} className="border-t border-slate-100">
                            <td className="py-2">
                              <p>{lang==='mn'?exam.title:exam.title_en||exam.title}</p>
                              {exam.group_key&&<p className="text-xs text-slate-500">{`${groupLabel(exam.group_key,lang)}${exam.part_key?` · ${partLabel(exam.part_key,lang)}`:''}${exam.source==='ai'?' · AI':''}`}</p>}
                            </td>
                            <td className="text-slate-500">{exam.topic||dict.none}</td>
                            <td>{exam.question_count}</td>
                            <td>{exam.total_points}</td>
                            <td>{exam.time_limit_min}</td>
                            <td>{exam.pass_pct}%</td>
                            <td>
                              <Badge variant={exam.status==='published'?'default':exam.status==='archived'?'destructive':'secondary'}>
                                {String((dict.examStatusText as Record<string,string>)[exam.status]??exam.status)}
                              </Badge>
                            </td>
                            <td>
                              <div className="flex gap-2">
                                {exam.status!=='published'&&exam.status!=='archived'&&
                                  <Button size="sm" onClick={()=>setExamStatus(exam,'published')}>{dict.publish}</Button>}
                                {exam.status==='published'&&
                                  <Button size="sm" variant="outline" onClick={()=>setExamStatus(exam,'archived')}>{dict.archive}</Button>}
                                {exam.status==='archived'&&
                                  <Button size="sm" variant="outline" onClick={()=>setExamStatus(exam,'draft')}>{dict.backDraft}</Button>}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>}

              <div className="grid gap-3 sm:grid-cols-[1fr_120px_auto] sm:items-end">
                <label className="grid gap-1 text-sm">
                  <span>{dict.draftTopic}</span>
                  <Input value={draftTopic} onChange={e=>setDraftTopic(e.target.value)}/>
                </label>
                <label className="grid gap-1 text-sm">
                  <span>{dict.draftCount}</span>
                  <Input inputMode="numeric" value={draftCount} onChange={e=>setDraftCount(e.target.value.replace(/\D/g,''))}/>
                </label>
                <Button disabled={draftBusy} onClick={makeDraft}>{draftBusy?dict.draftWorking:dict.draftMake}</Button>
              </div>

              {draftList.length>0&&
                <div className="mt-4 space-y-3">
                  {draftList.map((q,i)=>(
                    <div key={i} className="rounded-xl border border-slate-200 p-3 text-sm">
                      <p className="mb-1 text-xs uppercase tracking-wide text-slate-500">
                        {String((dict.draftKind as Record<string,string>)[q.kind]??q.kind)} · {q.points}
                      </p>
                      <p className="font-medium">{q.prompt}</p>
                      {q.kind==='mcq'&&
                        <ul className="mt-1 list-disc pl-5 text-slate-600">
                          {q.options.map((opt,idx)=>(
                            <li key={idx}>{opt}{q.answer===idx?' ✓':''}</li>
                          ))}
                        </ul>}
                      {q.rubric&&<p className="mt-1 text-slate-500">{dict.draftRubric}: {q.rubric}</p>}
                    </div>
                  ))}
                  <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                    <label className="grid gap-1 text-sm">
                      <span>{dict.draftExamName}</span>
                      <Input value={draftName} onChange={e=>setDraftName(e.target.value)}/>
                    </label>
                    <div className="flex items-center gap-3">
                      <Button disabled={draftSaving} onClick={saveDraft}>{draftSaving?'…':dict.draftSave}</Button>
                      {draftSaved&&<span className="text-sm text-emerald-700">{dict.draftSaved}</span>}
                    </div>
                  </div>
                </div>}

              <div className="mt-6 rounded-2xl border border-slate-200 p-4">
                <p className="text-sm font-semibold">{dict.batchTitle}</p>
                <p className="mt-1 mb-3 text-sm text-slate-600">{dict.batchLead}</p>
                <div className="grid gap-3 sm:grid-cols-[200px_120px_auto] sm:items-end">
                  <label className="grid gap-1 text-sm">
                    <span>{dict.batchGroup}</span>
                    <NativeSelect className="w-full" value={batchGroup} onChange={e=>{setBatchGroup(e.target.value as ExamGroupId);setBatchParts([]);}}>
                      {EXAM_GROUPS.map(group=><NativeSelectOption key={group.id} value={group.id}>{`${groupLabel(group.id,lang)} (${group.parts.length})`}</NativeSelectOption>)}
                    </NativeSelect>
                  </label>
                  <label className="grid gap-1 text-sm">
                    <span>{dict.batchCount}</span>
                    <Input inputMode="numeric" value={batchCount} onChange={e=>setBatchCount(e.target.value.replace(/\D/g,'').slice(0,2))}/>
                  </label>
                  <Button disabled={batchBusy} onClick={runBatch}>{batchBusy?dict.draftWorking:dict.batchRun}</Button>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-sm text-slate-500">{dict.batchParts}</span>
                  <Button size="sm" variant="ghost" disabled={batchBusy}
                    onClick={()=>setBatchParts(batchParts.length?[]:(EXAM_GROUPS.find(g=>g.id===batchGroup)?.parts??[]))}>
                    {batchParts.length?dict.batchClear:dict.batchAll}
                  </Button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(EXAM_GROUPS.find(g=>g.id===batchGroup)?.parts??[]).map(part=>{
                    const on=batchParts.includes(part);
                    return (
                      <label key={part} className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1 text-sm ${on?'border-slate-900 bg-slate-900 text-white':'border-slate-200 text-slate-700'}`}>
                        <input type="checkbox" className="sr-only" checked={on} disabled={batchBusy} onChange={()=>setBatchParts(p=>on?p.filter(x=>x!==part):[...p,part])}/>
                        {partLabel(part,lang)}
                      </label>
                    );
                  })}
                </div>
                {batchBusy&&<p className="mt-3 text-sm text-slate-500">{dict.draftWorking} {batchDone}</p>}
                {!batchBusy&&batchDone&&<p className="mt-3 text-sm text-emerald-700">{batchDone}</p>}
              </div>
            </>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-lg">{dict.users}</CardTitle>
          <Input value={query} onChange={e=>setQuery(e.target.value)} placeholder={dict.search} className="max-w-xs"/>
        </CardHeader>
        <CardContent>
          {visible.length===0&&!loading
            ?<p className="text-sm text-slate-500">{dict.noUsers}</p>
            :<div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-slate-500">
                  <th className="py-2">{dict.name}</th><th>{dict.email}</th><th>{dict.registered}</th><th>{dict.role}</th><th>{dict.actions}</th>
                </tr></thead>
                <tbody>
                  {visible.map(profile=>(
                    <tr key={profile.id} className="border-t border-slate-100">
                      <td className="py-2">{profile.name||dict.none}</td>
                      <td className="text-slate-600">{profile.email}</td>
                      <td className="text-slate-500">{fmt(profile.created_at)}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          {profile.is_admin
                            ?<Badge>{dict.admin}</Badge>
                            :<Badge variant="secondary">{dict.member}</Badge>}
                          <Button size="sm" variant="ghost" onClick={()=>setAdmin(profile,!profile.is_admin)}>
                            {profile.is_admin?dict.becomeAdminHint:dict.becomeAdmin}
                          </Button>
                        </div>
                      </td>
                      <td>
                        <Button size="sm" variant="outline" onClick={()=>openUser(profile)}>{dict.view}</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>}
        </CardContent>
      </Card>

      {selected&&
        <Card className="mt-6">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-lg">{`${dict.panel}: ${selected.name||selected.email}`}</CardTitle>
            <Button size="sm" variant="ghost" onClick={()=>{setSelected(null);setDetail(null);}}>{dict.close}</Button>
          </CardHeader>
          <CardContent>
            {detailBusy
              ?<p className="text-sm text-slate-500">{dict.loading}</p>
              :!detail
                ?<p className="text-sm text-slate-500">{dict.panelMissing}</p>
                :<>
                  {detail.missing&&<p className="mb-3 text-sm text-amber-700">{dict.panelMissing}</p>}

                  <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    {[
                      {label:dict.xpBalance,value:String(detail.xp)},
                      {label:dict.attendance,value:String(new Set(detail.events.filter(e=>e.kind==='checkin').map(e=>e.day)).size)},
                      {label:dict.examsSat,value:String(detail.attempts.length)},
                      {label:dict.examsPassed,value:String(detail.attempts.filter(a=>a.passed).length)},
                      {label:dict.avgScore,value:detail.attempts.length?`${Math.round(detail.attempts.reduce((s,a)=>s+a.score_pct,0)/detail.attempts.length)}%`:'—'},
                    ].map(tile=>(
                      <div key={tile.label} className="rounded-xl border border-slate-200 px-3 py-2">
                        <p className="text-xs text-slate-500">{tile.label}</p>
                        <p className="text-xl font-semibold">{tile.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mb-5 grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <p className="mb-1 font-medium">{dict.school}</p>
                      {detail.profile&&(detail.profile.university||detail.profile.department||detail.profile.specialty||detail.profile.study_year)
                        ?<ul className="space-y-0.5 text-slate-600">
                          <li>{dict.university}: {detail.profile.university||dict.none}</li>
                          <li>{dict.department}: {detail.profile.department||dict.none}</li>
                          <li>{dict.specialty}: {detail.profile.specialty||dict.none}</li>
                          <li>{dict.year}: {detail.profile.study_year||dict.none}</li>
                        </ul>
                        :<p className="text-slate-500">{dict.noSchool}</p>}
                    </div>
                    <div>
                      <p className="mb-1 font-medium">{dict.premiumUntil}</p>
                      <p className="text-slate-600">
                        {detail.subs.some(s=>new Date(s.expires_at).getTime()>Date.now())
                          ?new Date(detail.subs[0].expires_at).toLocaleDateString()
                          :dict.premiumNone}
                      </p>
                      <div className="mt-3 flex items-end gap-2">
                        <label className="grid gap-1 text-sm">
                          <span>{dict.grantPremiumHint}</span>
                          <Input
                            className="w-24"
                            inputMode="numeric"
                            value={premiumDays}
                            onChange={e=>setPremiumDays(e.target.value.replace(/\D/g,''))}
                          />
                        </label>
                        <Button size="sm" variant="outline" onClick={()=>givePremium(selected)}>{dict.grantPremium}</Button>
                      </div>
                      <div className="mt-4 flex items-end gap-2">
                        <label className="grid gap-1 text-sm">
                          <span>{dict.grantXpHint}</span>
                          <Input
                            className="w-24"
                            inputMode="numeric"
                            aria-label={dict.grantXpHint}
                            value={grant[selected.id]??''}
                            onChange={e=>setGrant(g=>({...g,[selected.id]:e.target.value.replace(/\D/g,'')}))}
                          />
                        </label>
                        <Button size="sm" variant="outline" disabled={!grant[selected.id]} onClick={()=>grantXp(selected)}>{dict.grantXp}</Button>
                      </div>
                    </div>
                  </div>

                  <div className="mb-5 grid gap-5 lg:grid-cols-2">
                    <div>
                      <p className="mb-2 font-medium">{dict.attempts}</p>
                      {detail.attempts.length===0
                        ?<p className="text-sm text-slate-500">{dict.noAttempts}</p>
                        :<div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead><tr className="text-left text-slate-500">
                              <th className="py-1">{dict.paper}</th><th>{dict.score}</th><th>{dict.examStatus}</th><th>{dict.created}</th>
                            </tr></thead>
                            <tbody>
                              {detail.attempts.map(a=>(
                                <tr key={a.id} className="border-t border-slate-100">
                                  <td className="py-1">{detail.titles[a.exam_id]||`#${a.exam_id}`}</td>
                                  <td>{a.score_pct}%</td>
                                  <td><Badge variant={a.passed?'default':'secondary'}>{a.passed?dict.passedText:dict.failedText}</Badge></td>
                                  <td className="text-slate-500">{fmt(a.created_at)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>}
                    </div>
                    <div>
                      <p className="mb-2 font-medium">{dict.practice}</p>
                      {detail.quizzes.length===0
                        ?<p className="text-sm text-slate-500">{dict.noPractice}</p>
                        :<ul className="space-y-1 text-sm">
                          {detail.quizzes.map(q=>(
                            <li key={q.id} className="flex items-center justify-between gap-3 border-t border-slate-100 pt-1">
                              <span>{q.score}/{q.total}</span>
                              <span className="text-slate-500">{fmt(q.created_at)}</span>
                            </li>
                          ))}
                        </ul>}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 font-medium">{dict.paymentsOf}</p>
                    {detail.payments.length===0
                      ?<p className="text-sm text-slate-500">{dict.noPaymentsOf}</p>
                      :<div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead><tr className="text-left text-slate-500">
                            <th className="py-1">{dict.plan}</th><th>{dict.amount}</th><th>{dict.examStatus}</th><th>{dict.ref}</th><th>{dict.created}</th>
                          </tr></thead>
                          <tbody>
                            {detail.payments.map(p=>(
                              <tr key={p.id} className="border-t border-slate-100">
                                <td className="py-1">{p.plan==='yearly'?'1 жил':'1 сар'}</td>
                                <td>{p.amount_mnt.toLocaleString()}₮</td>
                                <td><Badge variant={p.status==='completed'?'default':p.status==='rejected'?'destructive':'secondary'}>{statusLabel(p.status)}</Badge></td>
                                <td className="text-slate-500">{p.reference||dict.none}</td>
                                <td className="text-slate-500">{fmt(p.created_at)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>}
                  </div>
                </>}
            {grantNotice&&<p className="mt-4 text-sm text-emerald-700">{grantNotice}</p>}
          </CardContent>
        </Card>}
    </PageScroll>
  );
}
