// Account page: shows the plan status, sells premium with an
// order-based bank/QPay transfer flow, and lists payment history.
// Flow: pick a plan → a pending payment row is created → transfer the
// shown amount → save the bank reference → the admin confirms → the
// subscription extends (handled by a database trigger).
import {useEffect,useState} from 'react';
import {Link,useLocation,Navigate} from 'react-router-dom';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Card,CardContent,CardHeader,CardTitle} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {supabase,supabaseConfigured} from '../../lib/supabase';
import {BANK,PLANS,type Plan} from '../../lib/plans';
import {useSubscription} from '../../hooks/use-subscription';
import {useAuth} from '../../hooks/use-auth';
import {LangSwitch,useLang} from '../locale';

const copy={
  en:{
    title:'Account',
    free:'Free plan',
    premium:'Premium',
    until:(v:string)=>`Premium is active until ${v}`,
    plansLead:'Unlock ROM Lab and Plaque Lab',
    buy:'Pay',
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
    waiting:'created — waiting for your reference and admin verification',
    history:'Payment history',
    historyEmpty:'No payments yet.',
    th:{plan:'Plan',amount:'Amount',status:'Status',ref:'Reference',date:'Date'},
    status:{pending:'Pending',completed:'Confirmed',rejected:'Rejected'},
    configure:'Supabase is not configured: the account backend needs VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local.',
    error:'Something went wrong. Try again.',
    backAtlas:'Back to the atlas',
  },
  mn:{
    title:'Хэрэглэгч',
    free:'Үнэгүй эрх',
    premium:'Premium',
    until:(v:string)=>`Premium ${v} хүртэл идэвхтэй`,
    plansLead:'ROM Lab болон Plaque Lab-ийг нээх',
    buy:'Төлөх',
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
    waiting:'үүслээ — дугаараа хадгалаад адмын шалгалтыг хүлээнэ',
    history:'Төлбөрийн түүх',
    historyEmpty:'Одоогоор төлбөр байхгүй.',
    th:{plan:'Багц',amount:'Дүн',status:'Төлөв',ref:'Дугаар',date:'Огноо'},
    status:{pending:'Хүлээж байна',completed:'Баталгаажсан',rejected:'Татгалзсан'},
    configure:'Supabase тохируулаагүй байна: VITE_SUPABASE_URL ба VITE_SUPABASE_PUBLISHABLE_KEY-г .env.local-д нэмнэ үү.',
    error:'Алдаа гарлаа. Дахин оролдоно уу.',
    backAtlas:'Атлас руу буцах',
  },
} as const;

const fmtDate=(v:string)=>new Date(v).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'});
const fmtMnt=(n:string)=>`${Number(n).toLocaleString()}₮`;

export default function AccountPage(){
  const {lang}=useLang();
  const dict=copy[lang];
  const location=useLocation();
  const {ready:subReady,user}=useAuth();
  const {ready:subOk,isAdmin,premium,expiresAt,refresh}=useSubscription();
  const ready=subReady&&subOk;
  const [payments,setPayments]=useState<Record<string,unknown>[]>([]);
  const [loading,setLoading]=useState(true);
  const [savingId,setSavingId]=useState<string|null>(null);
  const [refs,setRefs]=useState<Record<string,string>>({});
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');

  useEffect(()=>{
    setNotice(typeof (location.state as {notice?:string}|null)?.notice==='string'
      ?((location.state as {notice?:string}).notice as string)
      :'');
  },[location.state]);

  useEffect(()=>{
    if(!user){setLoading(false);return;}
    let alive=true;
    setPayments([]);
    setLoading(true);
    supabase.from('payments').select('*').order('created_at',{ascending:false}).then(({data})=>{
      if(alive){setPayments((data??[]) as Record<string,unknown>[]);setLoading(false);}
    });
    return ()=>{alive=false;};
  },[user]);

  if(!ready)return <main className="flex min-h-screen items-center justify-center text-slate-500">…</main>;
  if(!user)return <Navigate to="/login" state={{from:'/account'}} replace/>;

  async function createPayment(plan:Plan){
    setError('');
    const {data,error}=await supabase.from('payments').insert({
      user_id:user!.id,plan,amount_mnt:plan.priceMnt,method:'qpay',status:'pending',
    }).select().single();
    if(error){setError(dict.error);return;}
    setPayments(p=>[data as Record<string,unknown>,...p]);
  }

  async function saveReference(id:string){
    setError('');
    setSavingId(id);
    const value=(refs[id]??'').trim();
    const {error}=await supabase.from('payments').update({reference:value}).eq('id',Number(id)).eq('status','pending');
    if(error)setError(dict.error);
    refresh();
    setSavingId(null);
  }

  const planName=(id:string)=>PLANS.find(p=>p.id===id)?.name??id;
  const statusLabel=(key:string)=>String((dict.status as Record<string,string>)[key]??key);

  return(
    <main className="mx-auto min-h-screen max-w-3xl bg-white px-4 py-8 text-slate-900">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-semibold">{dict.title}</h1>
        <div className="flex items-center gap-3">
          <LangSwitch/>
          {isAdmin&&<Link to="/admin" className="text-sm font-medium text-slate-500 underline">Admin</Link>}
          <Link to="/atlas" className="text-sm text-slate-500 underline">{dict.backAtlas}</Link>
        </div>
      </div>

      {notice&&<p className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</p>}
      {!supabaseConfigured&&<p className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{dict.configure}</p>}
      {user&&<p className="mb-6 text-sm text-slate-500">{(user.user_metadata?.name as string|undefined)||user.email}</p>}

      <Card className="mb-6">
        <CardHeader><CardTitle className="text-lg">
          {premium
            ?<Badge className="bg-emerald-600">{dict.premium}</Badge>
            :<Badge variant="secondary">{dict.free}</Badge>}
          {premium&&expiresAt&&<span className="ml-2 text-sm font-normal text-slate-500">{dict.until(fmtDate(expiresAt))}</span>}
        </CardTitle></CardHeader>
        {!premium&&<CardContent>
          <p className="mb-4 text-sm text-slate-600">{dict.plansLead}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {PLANS.map(plan=>(
              <div key={plan.id} className="rounded-2xl border border-slate-200 p-4">
                <p className="text-lg font-semibold">{plan.name}</p>
                <p className="mb-3 text-2xl font-bold">{plan.priceMnt.toLocaleString()}₮</p>
                <Button className="w-full" onClick={()=>createPayment(plan)}>{dict.buy}</Button>
              </div>
            ))}
          </div>
        </CardContent>}
      </Card>

      {payments.length>0&&payments.some(p=>p.status==='pending')&&(
        <Card className="mb-6">
          <CardHeader><CardTitle className="text-lg">{dict.how}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-600">
              <li>{dict.step1}</li>
              <li>{dict.step2}</li>
              <li>{dict.step3}</li>
            </ol>
            <div className="grid gap-2 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
              <span><b>{dict.bank}:</b> {BANK.name}</span>
              <span><b>{dict.account}:</b> {BANK.account}</span>
              <span><b>{dict.receiver}:</b> {BANK.receiver}</span>
            </div>
            {payments.filter(p=>p.status==='pending').map(payment=>(
              <div key={String(payment.id)} className="rounded-xl border border-slate-200 p-4">
                <p className="mb-2 text-sm">
                  <b>#{String(payment.id)}</b> — {planName(String(payment.plan))} · {fmtMnt(String(payment.amount_mnt))}
                  <span className="ml-2 text-amber-600">{dict.pending}</span>
                </p>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <div className="flex-1 space-y-1">
                    <Label htmlFor={`ref-${payment.id}`}>{dict.payNumber}</Label>
                    <Input id={`ref-${payment.id}`} value={refs[String(payment.id)]??String(payment.reference??'')}
                      onChange={e=>setRefs(r=>({...r,[String(payment.id)]:e.target.value}))}
                      placeholder={dict.payNumberHint}/>
                  </div>
                  <Button variant="outline" disabled={savingId===String(payment.id)} onClick={()=>saveReference(String(payment.id))}>
                    {dict.saveRef}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {error&&<p className="mb-6 text-sm text-red-600">{error}</p>}

      <Card>
        <CardHeader><CardTitle className="text-lg">{dict.history}</CardTitle></CardHeader>
        <CardContent>
          {loading
            ?<p className="text-sm text-slate-500">…</p>
            :payments.length===0
              ?<p className="text-sm text-slate-500">{dict.historyEmpty}</p>
              :<div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-slate-500"><th className="py-2">{dict.th.date}</th><th>{dict.th.plan}</th><th>{dict.th.amount}</th><th>{dict.th.status}</th><th>{dict.th.ref}</th></tr></thead>
                  <tbody>
                    {payments.map(payment=>(
                      <tr key={String(payment.id)} className="border-t border-slate-100">
                        <td className="py-2">{fmtDate(String(payment.created_at))}</td>
                        <td>{planName(String(payment.plan))}</td>
                        <td>{fmtMnt(String(payment.amount_mnt))}</td>
                        <td>{statusLabel(String(payment.status))}</td>
                        <td className="text-slate-500">{String(payment.reference||'—')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>}
        </CardContent>
      </Card>
    </main>
  );
}
