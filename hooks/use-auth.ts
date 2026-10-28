// Current account: the local /api/auth cookie, or a Supabase session when
// that project is configured. Pages use this to know who is signed in.
import {useEffect,useState} from 'react';
import type {Session,User} from '@supabase/supabase-js';
import {supabase,supabaseConfigured} from '../lib/supabase';

export interface AuthState{
  ready:boolean;     // false until the first session check finishes
  session:Session|null;
  user:User|null;
}

interface LocalUser{id:string;email:string;name:string}

function asUser(row:LocalUser):User{
  return {
    id:row.id,
    email:row.email,
    user_metadata:{name:row.name},
    app_metadata:{},
    aud:'authenticated',
    created_at:new Date().toISOString(),
  } as User;
}

async function localUser():Promise<User|null>{
  const res=await fetch('/api/auth',{credentials:'include'});
  if(!res.ok)return null;
  const data=await res.json() as {user?:LocalUser|null};
  return data.user?asUser(data.user):null;
}

export function useAuth():AuthState{
  const [state,setState]=useState<AuthState>({ready:false,session:null,user:null});

  useEffect(()=>{
    let alive=true;
    let local=false;
    // Supabase fires INITIAL_SESSION as soon as it subscribes, usually before
    // the cookie lookup answers. Acting on it then would report "signed out"
    // to a local account and bounce /account to /login, so its events only
    // count once the first lookup has settled.
    let settled=false;
    let generation=0;

    async function refresh(){
      const mine=++generation;
      try{
        const user=await localUser();
        if(!alive||mine!==generation)return;
        if(user){
          local=true;
          settled=true;
          setState({ready:true,session:null,user});
          return;
        }
      }catch{/* The dev server can be restarting; fall through to signed-out. */}
      local=false;
      if(!supabaseConfigured){
        if(alive&&mine===generation){settled=true;setState({ready:true,session:null,user:null});}
        return;
      }
      try{
        const {data}=await supabase.auth.getSession();
        if(!alive||mine!==generation||local)return;
        settled=true;
        setState({ready:true,session:data.session,user:data.session?.user??null});
      }catch{
        if(alive&&mine===generation){settled=true;setState({ready:true,session:null,user:null});}
      }
    }

    void refresh();
    const onChange=()=>{void refresh();};
    window.addEventListener('anatomn-auth',onChange);
    const subscription=supabaseConfigured
      ?supabase.auth.onAuthStateChange((_event,session)=>{
        if(!alive||local||!settled)return;
        setState({ready:true,session,user:session?.user??null});
      })
      :null;
    return ()=>{
      alive=false;
      window.removeEventListener('anatomn-auth',onChange);
      subscription?.data.subscription.unsubscribe();
    };
  },[]);

  return state;
}

/**
 * Sign out of both stores — the local cookie and the Supabase session — and
 * report what went wrong instead of throwing. A failed sign-out leaves the
 * session behind, so the caller has to keep the user on the page and say why
 * rather than pretend they left.
 */
export async function signOut():Promise<string|null>{
  let problem='';
  const local=await fetch('/api/auth',{
    method:'POST',
    credentials:'include',
    headers:{'content-type':'application/json'},
    body:JSON.stringify({action:'logout'}),
  }).catch(()=>null);
  // A static host has no /api/auth at all; nothing to clear there.
  if(local&&!local.ok&&local.status!==404)problem=`logout ${local.status}`;
  if(supabaseConfigured){
    // The Supabase client clears its own storage even offline, so a dead
    // network is not a failed sign-out as long as it answers.
    const {error}=await supabase.auth.signOut();
    if(error)problem=error.message;
  }else if(!local){
    problem='failed to fetch';
  }
  window.dispatchEvent(new Event('anatomn-auth'));
  return problem||null;
}

