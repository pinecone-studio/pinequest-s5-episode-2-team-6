import {useState} from 'react';
import type {FormEvent} from 'react';
import {Link,useLocation,useNavigate} from 'react-router-dom';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {useLang} from '../locale';
import SiteNav from '../site-nav';
import {supabase,supabaseConfigured} from '../../lib/supabase';
import {explainAuthError} from '../auth-error';

export default function LoginPage(){
  const {t,lang}=useLang();
  const navigate=useNavigate();
  const location=useLocation();
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(false);

  // The signup page forwards here with a note when email confirmation is on.
  const notice=(location.state as {notice?:string}|null)?.notice??'';
  // The place the user came from (account/admin guard) if any, else the atlas.
  const destination=(location.state as {from?:string}|null)?.from??'/atlas';

  async function onSubmit(e:FormEvent){
    e.preventDefault();
    setError('');
    if(loading)return;
    // A pasted address usually carries a space or capitals; both break the
    // lookup while still looking correct on screen.
    const mail=email.trim().toLowerCase();
    setEmail(mail);
    if(!mail||!password){setError(t.auth.missing);return;}
    setLoading(true);
    try{
      if(!supabaseConfigured){
        // Env vars missing: the page still works in demo mode (no backend).
        await new Promise(r=>setTimeout(r,500));
        navigate(destination);
        return;
      }
      const {data,error}=await supabase.auth.signInWithPassword({email:mail,password});
      if(error)throw error;
      // A session that never landed would leave every guarded page bouncing
      // back here, so say so instead of navigating into a signed-out app.
      if(!data.session){setError(explainAuthError('Email not confirmed',lang));return;}
      navigate(destination,{replace:true});
    }catch(err){
      setError(explainAuthError(err instanceof Error?err.message:'',lang)||t.auth.failed);
    }finally{
      setLoading(false);
    }
  }

  return(
    <main className="flex min-h-screen items-center justify-center bg-neutral-100 px-4 pt-[calc(var(--site-nav-h)+16px)] pb-8">
      <SiteNav tone="light"/>
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-sm">
        <p className="mb-2 text-xs font-medium tracking-[0.2em] text-slate-500">{t.auth.kicker}</p>
        <h1 className="mb-1 text-3xl font-semibold text-slate-900">Anatomn</h1>
        <p className="mb-6 text-sm text-slate-500">{t.auth.loginLead}</p>
        {notice&&<p className="mb-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p>}
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">{t.auth.email}</Label>
            <Input id="email" type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">{t.auth.password}</Label>
            <Input id="password" type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••"/>
          </div>
          {error&&<p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>{loading?t.auth.signingIn:t.auth.signIn}</Button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          {t.auth.noAccount} <Link to="/signup" className="font-medium text-slate-900 underline">{t.auth.signUp}</Link>
        </p>
      </div>
    </main>
  );
}