'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';

export default function Register(){
  const router = useRouter();
  const supabase = createBrowserClient();
  const [fullName,setFullName]=useState('');
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [loading,setLoading]=useState(false);
  const [message,setMessage]=useState('');

  async function register(e:FormEvent){
    e.preventDefault();
    setLoading(true); setMessage('');
    const origin = window.location.origin;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options:{ emailRedirectTo:`${origin}/auth/callback?next=/dashboard`, data:{ full_name: fullName } }
    });
    if(error){ setLoading(false); return setMessage(error.message); }
    if(data.user){
      await supabase.from('profiles').upsert({ id:data.user.id, user_id:data.user.id, email, full_name:fullName, display_name:fullName, role:'user', preferred_language:'English', country:'India' });
    }
    setLoading(false);
    setMessage('Account created. Please check your email to confirm, then login.');
    router.refresh();
  }

  async function registerWithGoogle(){
    setLoading(true);
    const origin = window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({ provider:'google', options:{ redirectTo:`${origin}/auth/callback?next=/dashboard` } });
    if(error){ setLoading(false); setMessage(error.message); }
  }

  return <main className="mx-auto max-w-md px-4 py-10">
    <h1 className="text-3xl font-bold text-teal">Create account</h1>
    <p className="mt-2 text-sm text-slate-600">Create an account when you want to save journals, book therapists, or keep appointment history.</p>
    <form onSubmit={register} className="mt-6 rounded-3xl bg-white p-6 shadow-soft">
      <label className="text-sm font-semibold text-slate-700">Name</label>
      <input value={fullName} onChange={(e)=>setFullName(e.target.value)} className="mt-2 w-full rounded-2xl border px-4 py-3" placeholder="Your name" required />
      <label className="mt-4 block text-sm font-semibold text-slate-700">Email</label>
      <input value={email} onChange={(e)=>setEmail(e.target.value)} className="mt-2 w-full rounded-2xl border px-4 py-3" placeholder="you@example.com" type="email" required />
      <label className="mt-4 block text-sm font-semibold text-slate-700">Password</label>
      <input value={password} onChange={(e)=>setPassword(e.target.value)} className="mt-2 w-full rounded-2xl border px-4 py-3" placeholder="Minimum 6 characters" type="password" minLength={6} required />
      {message && <p className="mt-4 rounded-2xl bg-cream p-3 text-sm text-slate-700">{message}</p>}
      <button disabled={loading} className="mt-5 w-full rounded-full bg-teal px-6 py-3 font-semibold text-white disabled:opacity-60">{loading?'Please wait...':'Create account'}</button>
      <button type="button" onClick={registerWithGoogle} disabled={loading} className="mt-3 w-full rounded-full border border-teal px-6 py-3 font-semibold text-teal disabled:opacity-60">Continue with Google</button>
      <p className="mt-5 text-center text-sm text-slate-600">Already have an account? <Link className="font-semibold text-teal" href="/auth/login">Login</Link></p>
    </form>
  </main>;
}
