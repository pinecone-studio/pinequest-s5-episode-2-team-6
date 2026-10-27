// Admin page: user list with the admin flag and the payment queue.
// Confirming a payment is a single update — a database trigger turns it
// into subscription time automatically.
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
  },
} as const;

const fmt=(v:string)=>new Date(v).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'});

interface Profile{id:string;name:string;email:string;is_admin:boolean;created_at:string}
interface Payment{id:number;user_id:string;plan:string;amount_mnt:number;status:string;reference:string;created_at:string}

export default function AdminPage(){
  const {lang}=useLang();
  const dict=copy[lang];
  const {user}=useAuth();
  const {ready:subReady,isAdmin,refresh}=useSubscription();
  const ready=subReady;
  const [profiles,setProfiles]=useState<Profile[]>([]);
  const [payments,setPayments]=useState<Payment[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [query,setQuery]=useState('');

  const load=useCallback(async()=>{
    if(!user)return;
    setLoading(true);
    setError('');
    const [{data:users,error:usersError},{data:pay,error:payError}]=await Promise.all([
      supabase.from('profiles').select('id,name,email,is_admin,created_at').order('created_at',{ascending:false}).limit(200),
      // No embedded join here: payments. The user's name/email are taken
      // from the profiles list already loaded above.
      supabase.from('payments').select('id,user_id,plan,amount_mnt,status,reference,created_at').order('created_at',{ascending:false}).limit(200),
    ]);
    if(usersError||payError)setError(usersError?.message??payError?.message??'Error');
    setProfiles((users??[]) as Profile[]);
    setPayments((pay??[]) as Payment[]);
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
                  <th className="py-2">{dict.name}</th><th>{dict.email}</th><th>{dict.registered}</th><th>{dict.role}</th>
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
