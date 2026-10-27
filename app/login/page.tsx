import {useState} from 'react';
import type {FormEvent} from 'react';
import {Link,useLocation,useNavigate} from 'react-router-dom';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {LangSwitch,useLang} from '../locale';
import {supabase,supabaseConfigured} from '../../lib/supabase';

export default function LoginPage(){
  const {t}=useLang();
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
    if(!email||!password){setError(t.auth.missing);return;}
    setLoading(true);
    try{
      if(!supabaseConfigured){
        // Env vars missing: the page still works in demo mode (no backend).
        await new Promise(r=>setTimeout(r,500));
        navigate(destination);
        return;
      }
      const {error}=await supabase.auth.signInWithPassword({email,password});
      if(error)throw error;
      navigate(destination);
    }catch(err){
      setError(err instanceof Error&&err.message?t.auth.failed+' — '+err.message:t.auth.failed);
    }finally{
      setLoading(false);
    }
  }

  return(
    <main className="flex min-h-screen items-center justify-center bg-neutral-100 px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-sm">
        <div className="mb-4 flex justify-end"><LangSwitch/></div>
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