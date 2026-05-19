import { DEMO_PROFILE_ID } from '../data/appData';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

export async function syncProfile({ profile, user, email, authMode }) {
  if (!isSupabaseConfigured) return;

  await supabase.from('profiles').upsert({
    id: user ? undefined : DEMO_PROFILE_ID,
    user_id: user?.id,
    email: user?.email || email || null,
    auth_provider: authMode || 'demo',
    display_name: profile.name,
    age_range: profile.age,
    support_preference: profile.intent,
    ai_persona: profile.persona
  });
}
