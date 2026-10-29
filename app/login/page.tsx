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
import '../auth.css';

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
      const res=await fetch('/api/auth',{
        method:'POST',
        credentials:'include',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({action:'login',email:mail,password}),
      });
      if(res.ok){
        window.dispatchEvent(new Event('anatomn-auth'));
        navigate(destination,{replace:true});
        return;
      }
      const local=(await res.json().catch(()=>null)) as {error?:string}|null;
      // A cloud account still signs in when this browser has no local one.
      if(supabaseConfigured){
        const {data,error}=await supabase.auth.signInWithPassword({email:mail,password});
        if(!error){
          // A session that never landed would leave every guarded page bouncing
          // back here, so say so instead of navigating into a signed-out app.
          if(!data.session){setError(explainAuthError('Email not confirmed',lang));return;}
          navigate(destination,{replace:true});
          return;
        }
        setError(explainAuthError(error.message,lang)||t.auth.failed);
        return;
      }
      setError(local?.error==='invalid'?explainAuthError('invalid login credentials',lang):local?.error==='missing'?t.auth.missing:t.auth.failed);
    }catch(err){
      setError(explainAuthError(err instanceof Error?err.message:'',lang)||t.auth.failed);
    }finally{
      setLoading(false);
    }
  }

  return(
    <main className="auth-page flex min-h-screen items-center justify-center px-4 pt-[calc(var(--site-nav-h)+16px)] pb-8">
      <SiteNav/>
      <div className="auth-card w-full max-w-sm rounded-3xl p-8">
        <p className="auth-kicker mb-2 text-xs font-medium tracking-[0.2em]">{t.auth.kicker}</p>
        <h1 className="mb-1 text-3xl font-semibold">Anatomn</h1>
        <p className="auth-soft mb-6 text-sm">{t.auth.loginLead}</p>
        {notice&&<p className="auth-notice mb-4 rounded-xl px-3 py-2 text-sm">{notice}</p>}
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">{t.auth.email}</Label>
            <Input id="email" type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">{t.auth.password}</Label>
            <Input id="password" type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••"/>
          </div>
          {error&&<p className="auth-error text-sm">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>{loading?t.auth.signingIn:t.auth.signIn}</Button>
        </form>
        <p className="auth-soft mt-6 text-center text-sm">
          {t.auth.noAccount} <Link to="/signup" className="auth-link font-medium underline">{t.auth.signUp}</Link>
        </p>
      </div>
    </main>
  );
}