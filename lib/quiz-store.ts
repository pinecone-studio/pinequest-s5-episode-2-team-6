// Quiz history persistence. Signed-in users get their results stored in
// the Supabase `quiz_results` table; everyone else sees nothing new (the
// atlas itself never requires an account).
import {supabase} from './supabase';

export async function saveQuizResult(score:number,total:number,answers:Record<string,number>){
  try{
    const {data:{user}}=await supabase.auth.getUser();
    if(!user)return; // signed out: nothing stored, the app still works
    await supabase.from('quiz_results').insert({
      user_id:user.id,
      score,
      total,
      details:{answers},
    });
  }catch{
    // The quiz works without the backend; storage errors are non-fatal.
  }
}
