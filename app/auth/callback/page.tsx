import {useEffect,useState} from 'react';
import {Link,useNavigate} from 'react-router-dom';
import {buttonVariants} from '@/components/ui/button';
import {useLang} from '../../locale';
import SiteNav from '../../site-nav';
import {supabaseConfigured} from '../../../lib/supabase';
import {takeGoogleReturn,useAuth} from '../../../hooks/use-auth';
import '../../auth.css';

/**
 * Google sends the browser back here with a code and the Supabase client
 * trades it for a session while the app starts up. This page only waits for
 * that session, then continues to wherever the student was headed.
 */
export default function AuthCallbackPage(){
  const {t}=useLang();
  const navigate=useNavigate();
  const {ready,user}=useAuth();
  const [failed,setFailed]=useState(!supabaseConfigured);

  useEffect(()=>{
    if(!ready)return;
    if(!user){
      // Google reports its own trouble in the query string, so no code is
      // coming and waiting longer would not change that.
      if(new URLSearchParams(window.location.search).has('error')){setFailed(true);return;}
      const timer=window.setTimeout(()=>setFailed(true),4000);
      return ()=>window.clearTimeout(timer);
    }
    navigate(takeGoogleReturn(),{replace:true});
  },[ready,user,navigate]);

  return(
    <main className="auth-page flex min-h-screen items-center justify-center px-4 pt-[calc(var(--site-nav-h)+16px)] pb-8">
      <SiteNav/>
      <div className="auth-card w-full max-w-sm rounded-3xl p-8 text-center">
        <p className="auth-kicker mb-2 text-xs font-medium tracking-[0.2em]">{t.auth.kicker}</p>
        <h1 className="auth-cb-title mb-1">{t.auth.callbackTitle}</h1>
        {failed?(
          <>
            <p className="auth-error mb-5 text-sm">{t.auth.callbackFailed}</p>
            <Link to="/login" className={`${buttonVariants({variant: 'outline'})} auth-back`}>{t.auth.backToSignIn}</Link>
          </>
        ):(
          <p className="auth-soft text-sm">{t.auth.callbackLead}</p>
        )}
      </div>
    </main>
  );
}
