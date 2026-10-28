// Admin page: the payment queue, the user list with the admin flag and XP,
// and the exam bank. Confirming a payment is a single update — a database
// trigger turns it into subscription time automatically. The exam bank holds
// drafts until an admin publishes them, so a student never sees an unreviewed
// question; the assistant only writes candidates for this page.
import {useCallback,useEffect,useState} from 'react';
import {Navigate} from 'react-router-dom';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Card,CardContent,CardHeader,CardTitle} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {supabase} from '../../lib/supabase';
import {useSubscription} from '../../hooks/use-subscription';
import {useAuth} from '../../hooks/use-auth';
import {useLang} from '../locale';
import SiteNav from '../site-nav';

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
    grantXp:'Grant XP',
    grantXpHint:'Points to add',
    grantedXp:(v:string)=>`Balance: ${v} XP`,
    grantFail:'Could not grant XP.',
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
    grantXp:'XP өгөх',
    grantXpHint:'Нэмэх оноо',
    grantedXp:(v:string)=>`Үлдэгдэл: ${v} XP`,
    grantFail:'XP өгч чадсангүй.',
  },
} as const;

const fmt=(v:string)=>new Date(v).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'});

interface Profile{id:string;name:string;email:string;is_admin:boolean;created_at:string}
interface Payment{id:number;user_id:string;plan:string;amount_mnt:number;status:string;reference:string;created_at:string}
interface ExamRow{
  id:number;title:string;title_en:string;topic:string;level:string;
  time_limit_min:number;pass_pct:number;status:string;
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
    rows:rows.map(r=>({...r,question_count:tally.get(r.id)?.count??0,total_points:tally.get(r.id)?.points??0})) as ExamRow[],
    missing:false,
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
  const [grant,setGrant]=useState<Record<string,string>>({});
  const [grantNotice,setGrantNotice]=useState('');
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
  },[user]);

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
    if(!draftList.length)return;
    setError('');
    setDraftSaving(true);
    const title=(draftName.trim()||draftTopic.trim()).slice(0,120);
    const {data:exam,error:examError}=await supabase.from('exams').insert({
      title,title_en:'',topic:draftTopic.trim(),level:'basic',status:'draft',
    }).select('id').single();
    if(examError||!exam){
      console.error('[admin] draft exam insert failed',examError?.code,examError?.message);
      setError(examError?.message??'Error');
      setDraftSaving(false);
      return;
    }
    const {error:qError}=await supabase.from('exam_questions').insert(
      draftList.map((q,i)=>({
        exam_id:Number(exam.id),
        position:i+1,
        kind:q.kind,
        prompt:q.prompt,
        prompt_en:q.prompt_en,
        options:q.options,
        answer:q.kind==='mcq'?q.answer:null,
        rubric:q.rubric,
        concept:'',
        points:q.points,
      })),
    );
    if(qError){
      // The paper without questions would show students an empty exam, so
      // archive the shell and let the admin retry.
      console.error('[admin] draft questions failed',qError.code,qError.message);
      await supabase.from('exams').update({status:'archived'}).eq('id',Number(exam.id));
      setError(qError.message);
      setDraftSaving(false);
      return;
    }
    const examRes=await loadExams();
    setExams(examRes.rows);
    setExamMissing(examRes.missing);
    setDraftSaved(true);
    setDraftSaving(false);
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
    <main className="mx-auto min-h-screen max-w-5xl bg-white px-4 pt-[calc(var(--site-nav-h)+24px)] pb-8 text-slate-900">
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
                            <td className="py-2">{lang==='mn'?exam.title:exam.title_en||exam.title}</td>
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
                  <th className="py-2">{dict.name}</th><th>{dict.email}</th><th>{dict.registered}</th><th>{dict.role}</th><th>{dict.grantXp}</th>
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
                        <div className="flex items-center gap-2">
                          <Input
                            className="w-20"
                            inputMode="numeric"
                            aria-label={dict.grantXpHint}
                            value={grant[profile.id]??''}
                            onChange={e=>setGrant(g=>({...g,[profile.id]:e.target.value.replace(/-/g,'').replace(/\D/g,'')}))}
                          />
                          <Button size="sm" variant="outline" disabled={!grant[profile.id]} onClick={()=>grantXp(profile)}>
                            {dict.grantXp}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>}
        </CardContent>
      </Card>
      {grantNotice&&<p className="mt-4 text-sm text-emerald-700">{grantNotice}</p>}
    </main>
  );
}
