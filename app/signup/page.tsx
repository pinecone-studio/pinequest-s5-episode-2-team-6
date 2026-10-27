import {useState} from 'react';
import type {FormEvent} from 'react';
import {Link,useNavigate} from 'react-router-dom';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {LangSwitch,useLang} from '../locale';
import {supabase,supabaseConfigured} from '../../lib/supabase';

export default function SignupPage(){
  const {t}=useLang();
  const navigate=useNavigate();
  const [name,setName]=useState('');
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [confirm,setConfirm]=useState('');
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(false);

  async function onSubmit(e:FormEvent){
    e.preventDefault();
    setError('');
    if(!name||!email||!password||!confirm){setError(t.auth.fillAll);return;}
    if(password.length<8){setError(t.auth.short);return;}
    if(password!==confirm){setError(t.auth.mismatch);return;}
    setLoading(true);
    try{
      if(!supabaseConfigured){
        // Env vars missing: the page still works in demo mode (no backend).
        await new Promise(r=>setTimeout(r,500));
        navigate('/login');
        return;
      }
      const result=await supabase.auth.signUp({
        email,
        password,
        options:{
          data:{name}, // copied into the profiles table by a DB trigger
          // Keep the user on the site after confirming the email.
          emailRedirectTo:`${window.location.origin}/login`,
        },
      });
      if(result.error)throw result.error;
      // Email confirmation off (the Supabase default is on): the session
      // already exists, so the new user goes straight to the account page.
      // With confirmation on, the login page shows the check-your-email note.
      if(result.data.session){
        navigate('/account',{state:{notice:t.auth.created}});
      }else{
        navigate('/login',{state:{notice:t.auth.verifyEmail}});
      }
    }catch(err){
      setError(err instanceof Error&&err.message?t.auth.signupFailed+' — '+err.message:t.auth.signupFailed);
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
        <p className="mb-6 text-sm text-slate-500">{t.auth.signupLead}</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">{t.auth.name}</Label>
            <Input id="name" autoComplete="name" value={name} onChange={e=>setName(e.target.value)} placeholder={t.auth.namePlaceholder}/>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">{t.auth.email}</Label>
            <Input id="email" type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">{t.auth.password}</Label>
            <Input id="password" type="password" autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder={t.auth.passwordHint}/>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm">{t.auth.confirm}</Label>
            <Input id="confirm" type="password" autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="••••••••"/>
          </div>
          {error&&<p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>{loading?t.auth.creating:t.auth.signUp}</Button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          {t.auth.hasAccount} <Link to="/login" className="font-medium text-slate-900 underline">{t.auth.signIn}</Link>
        </p>
      </div>
    </main>
  );
}