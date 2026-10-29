import {useState} from 'react';
import type {FormEvent} from 'react';
import {Link,useLocation,useNavigate} from 'react-router-dom';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {useLang} from '../locale';
import SiteNav from '../site-nav';
import {supabase,supabaseConfigured} from '../../lib/supabase';
import {signInWithGoogle} from '../../hooks/use-auth';
import {explainAuthError} from '../auth-error';
import '../auth.css';

// Google's four-colour mark, sized for the sign-in button.
function GoogleMark(){
  return(
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden focusable="false">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC04" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

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

  async function onGoogle(){
    setError('');
    if(loading)return;
    setLoading(true);
    const problem=await signInWithGoogle(destination);
    // On success the browser leaves for Google and this page never answers again.
    if(problem)setError(explainAuthError(problem,lang)||t.auth.failed);
    else return;
    setLoading(false);
  }

  return(
    <main className="auth-page flex min-h-screen items-center justify-center px-4 pt-[calc(var(--site-nav-h)+16px)] pb-8">
      <SiteNav/>
      <div className="auth-card w-full max-w-sm rounded-3xl p-8">
        <p className="auth-kicker mb-2 text-xs font-medium tracking-[0.2em]">{t.auth.kicker}</p>
        <h1 className="mb-1 text-3xl font-semibold">Anatomn</h1>
        <p className="auth-soft mb-6 text-sm">{t.auth.loginLead}</p>
        {notice&&<p className="auth-notice mb-4 rounded-xl px-3 py-2 text-sm">{notice}</p>}
        {error&&<p className="auth-error mb-4 text-sm">{error}</p>}
        {supabaseConfigured&&(
          <>
            <Button type="button" variant="outline" className="auth-google w-full gap-2.5" disabled={loading} onClick={()=>void onGoogle()}>
              <GoogleMark/>{t.auth.google}
            </Button>
            <p className="auth-or my-5">{t.auth.or}</p>
          </>
        )}
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">{t.auth.email}</Label>
            <Input id="email" type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">{t.auth.password}</Label>
            <Input id="password" type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••"/>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>{loading?t.auth.signingIn:t.auth.signIn}</Button>
        </form>
        <p className="auth-soft mt-6 text-center text-sm">
          {t.auth.noAccount} <Link to="/signup" className="auth-link font-medium underline">{t.auth.signUp}</Link>
        </p>
      </div>
    </main>
  );
}