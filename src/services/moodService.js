import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { DEMO_PROFILE_ID } from '../data/appData';

export async function saveMoodEntry({ session, entry }) {
  if (!isSupabaseConfigured) return;

  await supabase.from('mood_checkins').insert({
    profile_id: session ? null : DEMO_PROFILE_ID,
    user_id: session?.user?.id,
    mood_score: entry.score,
    note: entry.note
  });
}
