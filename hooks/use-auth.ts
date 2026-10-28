// React hook for the current Supabase auth session. Components use this to
// know whether a user is signed in and who they are.
import {useEffect,useState} from 'react';
import type {Session,User} from '@supabase/supabase-js';
import {supabase, supabaseConfigured} from '../lib/supabase';

export interface AuthState{
  ready:boolean;     // false until the first session check finishes
  session:Session|null;
  user:User|null;
}

export function useAuth():AuthState{
  const [state,setState]=useState<AuthState>({ready:false,session:null,user:null});

  useEffect(()=>{
    let alive=true;
    // Initial check: pick up a session from storage on page load.
    supabase.auth.getSession().then(({data})=>{
      if(alive)setState({ready:true,session:data.session,user:data.session?.user??null});
    });
    // Keep up to date: sign in, sign out, token refresh.
    const subscription=supabase.auth.onAuthStateChange((_event,session)=>{
      if(alive)setState({ready:true,session,user:session?.user??null});
    });
    return ()=>{
      alive=false;
      subscription.data.subscription.unsubscribe();
    };
  },[]);

  return state;
}

/**
 * Sign the user out and report what went wrong instead of throwing. A failed
 * sign-out leaves the session in localStorage, so the caller has to keep the
 * user on the page and say why rather than pretend they left.
 */
export async function signOut():Promise<string|null>{
  if(!supabaseConfigured)return null;
  const {error}=await supabase.auth.signOut();
  return error?.message??null;
}
