import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = url.searchParams.get('next') || '/dashboard';
  const code = url.searchParams.get('code');

  if (!code) return NextResponse.redirect(new URL('/auth/login?error=missing_code', url.origin));

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL(`/auth/login?error=${encodeURIComponent(error.message)}`, url.origin));

  const user = data.user;
  if (user) {
    await supabase.from('profiles').upsert({
      id: user.id,
      user_id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email,
      display_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email,
      auth_provider: 'google',
      role: 'user',
      preferred_language: 'English',
      country: 'India'
    });
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
