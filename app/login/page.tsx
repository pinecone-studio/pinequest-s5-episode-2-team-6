import {useState} from 'react';
import type {FormEvent} from 'react';
import {Link,useNavigate} from 'react-router-dom';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';

export default function LoginPage(){
  const navigate=useNavigate();
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(false);

  async function onSubmit(e:FormEvent){
    e.preventDefault();
    setError('');
    if(!email||!password){setError('Имэйл болон нууц үгээ оруулна уу.');return;}
    setLoading(true);
    try{
      // TODO: энд жинхэнэ нэвтрэлтийн дуудлага орно (Clerk, Supabase г.м.)
      await new Promise(r=>setTimeout(r,500));
      navigate('/atlas');
    }catch{
      setError('Нэвтрэхэд алдаа гарлаа. Дахин оролдоно уу.');
    }finally{
      setLoading(false);
    }
  }

  return(
    <main className="flex min-h-screen items-center justify-center bg-neutral-100 px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-sm">
        <p className="mb-2 text-xs font-medium tracking-[0.2em] text-slate-500">INTERACTIVE ANATOMY</p>
        <h1 className="mb-1 text-3xl font-semibold text-slate-900">Human Atlas</h1>
        <p className="mb-6 text-sm text-slate-500">Бүртгэлээрээ нэвтэрнэ үү.</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Имэйл</Label>
            <Input id="email" type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Нууц үг</Label>
            <Input id="password" type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••"/>
          </div>
          {error&&<p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>{loading?'Нэвтэрч байна...':'Нэвтрэх'}</Button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          Бүртгэлгүй юу? <Link to="/signup" className="font-medium text-slate-900 underline">Бүртгүүлэх</Link>
        </p>
      </div>
    </main>
  );
}