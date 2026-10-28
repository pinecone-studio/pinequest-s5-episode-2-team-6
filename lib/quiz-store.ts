// Quiz history persistence. Signed-in users get their results stored in
// the Supabase `quiz_results` table; everyone else sees nothing new (the
// atlas itself never requires an account).
import {supabase} from './supabase';

/** What one finished run keeps: the setup it was dealt from and, per question, whether it was right.
 *  Rows saved before topics existed carry `answers` (option index by bank position) instead of `items`. */
export interface QuizDetails {
  v: 2;
  topic: string;
  level: number;
  source: 'bank' | 'ai';
  retry: boolean;
  seconds: number;
  items: {id: string; topic: string; concept: string; correct: boolean}[];
}

export async function saveQuizResult(score:number,total:number,details:QuizDetails){
  try{
    const {data:{user}}=await supabase.auth.getUser();
    if(!user)return; // signed out: nothing stored, the app still works
    await supabase.from('quiz_results').insert({
      user_id:user.id,
      score,
      total,
      details,
    });
  }catch{
    // The quiz works without the backend; storage errors are non-fatal.
  }
}
