// Track the signed-in user's role and premium status. The atlas uses
// `premium` to lock ROM Lab and Plaque Lab; the account page also reads
// the latest subscription row for renewal dates.
import {useEffect,useState} from 'react';
import {supabase} from '../lib/supabase';
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
  const {ready,user}=useAuth();
  const [state,setState]=useState<Omit<SubscriptionState,'ready'|'refresh'>>({
    loading:false,isAdmin:false,premium:false,expiresAt:null,
  });
  // Bumping this counter forces a fresh lookup (payments confirm → refresh).
  const [version,setVersion]=useState(0);

  useEffect(()=>{
    let alive=true;
    if(!user){
      setState({loading:false,isAdmin:false,premium:false,expiresAt:null});
      return;
    }
    setState(s=>({...s,loading:true}));
    (async()=>{
      // One profile row owns is_admin; subscriptions own premium time.
      const [{data:profile},{data:subs}]=await Promise.all([
        supabase.from('profiles').select('is_admin').eq('id',user.id).maybeSingle(),
        supabase.from('subscriptions').select('expires_at').order('expires_at',{ascending:false}),
      ]);
      if(!alive)return;
      const now=Date.now();
      const active=(subs??[]).filter(s=>new Date(s.expires_at).getTime()>now);
      setState({
        loading:false,
        isAdmin:Boolean(profile?.is_admin),
        premium:active.length>0,
        expiresAt:active[0]?.expires_at??null,
      });
    })();
    return ()=>{alive=false;};
  },[user,version]);

  return {
    ready,
    ...state,
    refresh:()=>setVersion(v=>v+1),
  };
}
