// Track account roles and existing subscriptions for account management.
// ROM Lab and Plaque Lab are free and do not depend on this hook.
import {useEffect,useState} from 'react';
import {supabase,supabaseConfigured} from '../lib/supabase';
import {useAuth} from './use-auth';

export interface SubscriptionState{
  ready:boolean;      // false until the first lookup finishes
  loading:boolean;
  isAdmin:boolean;
  premium:boolean;
  expiresAt:string|null; // ISO date of the furthest active subscription
  refresh:()=>void;
}export function usePremium():boolean{
  const {premium}=useSubscription();
  return premium;
}

export function useSubscription():SubscriptionState{
  const {ready,user,session}=useAuth();
  // Roles and subscriptions live in Supabase. A local /api/auth account has no
  // session there, so asking would only fail; it is a free, non-admin account.
  const cloud=supabaseConfigured&&!!session;
  // `owner` is the user the state was looked up for, so a newly signed-in user reads as loading
  // from the very first render instead of briefly looking like a free account.
  const [state,setState]=useState<Omit<SubscriptionState,'ready'|'refresh'>&{owner:string|null}>({
    loading:false,isAdmin:false,premium:false,expiresAt:null,owner:null,
  });
  // Bumping this counter forces a fresh lookup (payments confirm → refresh).
  const [version,setVersion]=useState(0);

  useEffect(()=>{
    let alive=true;
    if(!user){
      setState({loading:false,isAdmin:false,premium:false,expiresAt:null,owner:null});
      return;
    }
    if(!cloud){
      setState({loading:false,isAdmin:false,premium:false,expiresAt:null,owner:user.id});
      return;
    }
    setState(s=>({...s,loading:true}));
    (async()=>{
      // One profile row owns is_admin; subscriptions own premium time.
      // The user_id filter is explicit because the RLS policy also lets an admin read every row.
      const [{data:profile},{data:subs}]=await Promise.all([
        supabase.from('profiles').select('is_admin').eq('id',user.id).maybeSingle(),
        supabase.from('subscriptions').select('expires_at').eq('user_id',user.id).order('expires_at',{ascending:false}),
      ]);
      if(!alive)return;
      const now=Date.now();
      const active=(subs??[]).filter(s=>new Date(s.expires_at).getTime()>now);
      setState({
        loading:false,
        isAdmin:Boolean(profile?.is_admin),
        premium:active.length>0,
        expiresAt:active[0]?.expires_at??null,
        owner:user.id,
      });
    })();
    return ()=>{alive=false;};
  },[user,cloud,version]);

  const {owner,...rest}=state;
  return {
    ready,
    ...rest,
    loading:rest.loading||(user?.id??null)!==owner,
    refresh:()=>setVersion(v=>v+1),
  };
}
