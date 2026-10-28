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
    let generation=0;

    async function refresh(){
      const mine=++generation;
      try{
        const user=await localUser();
        if(!alive||mine!==generation)return;
        if(user){
          local=true;
          setState({ready:true,session:null,user});
          return;
        }
      }catch{/* The dev server can be restarting; fall through to signed-out. */}
      local=false;
      if(!supabaseConfigured){
        if(alive&&mine===generation)setState({ready:true,session:null,user:null});
        return;
      }
      try{
        const {data}=await supabase.auth.getSession();
        if(!alive||mine!==generation||local)return;
        setState({ready:true,session:data.session,user:data.session?.user??null});
      }catch{
        if(alive&&mine===generation)setState({ready:true,session:null,user:null});
      }
    }

    void refresh();
    const onChange=()=>{void refresh();};
    window.addEventListener('anatomn-auth',onChange);
    const subscription=supabaseConfigured
      ?supabase.auth.onAuthStateChange((_event,session)=>{
        if(!alive||local)return;
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

export async function signOut(){
  await fetch('/api/auth',{
    method:'POST',
    credentials:'include',
    headers:{'content-type':'application/json'},
    body:JSON.stringify({action:'logout'}),
  }).catch(()=>{});
  if(supabaseConfigured){
    try{await supabase.auth.signOut();}catch{/* The local cookie is already cleared. */}
  }
  window.dispatchEvent(new Event('anatomn-auth'));
}
