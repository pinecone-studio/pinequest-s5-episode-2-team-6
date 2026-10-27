// Central Supabase client for the browser app. The URL and publishable (anon)
// key are safe to expose: row level security on the Supabase project decides
// what the browser can read and write.
import {createClient} from '@supabase/supabase-js';

const env=(import.meta as unknown as {env?:Record<string,string|undefined>}).env;

const url=env?.VITE_SUPABASE_URL??'';
const key=env?.VITE_SUPABASE_PUBLISHABLE_KEY??'';

export const supabaseConfigured=url!==''&&key!=='';

// When the env vars are missing (fresh checkout, demo mode) we still need a
// client object for the imports above to work. Requests against the
// placeholder just fail, and the app's pages already handle that gracefully.
export const supabase=createClient(
  url||'https://placeholder.supabase.co',
  key||'public-anon-key',
  {
    auth:{
      // Sessions live in localStorage so a refresh keeps the user signed in.
      persistSession:true,
      autoRefreshToken:true,
    },
  },
);
