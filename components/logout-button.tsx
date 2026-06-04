'use client';
import { createBrowserClient } from '@/lib/supabase/client';

export default function LogoutButton(){
  async function logout(){
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    window.location.href='/';
  }
  return <button onClick={logout} className="rounded-full border border-teal px-4 py-2 text-sm font-semibold text-teal">Logout</button>;
}
