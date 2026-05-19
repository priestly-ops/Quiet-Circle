import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { DEMO_PROFILE_ID } from '../data/appData';

export async function saveJournalEntry({ session, entry }) {
  if (!isSupabaseConfigured) return;

  await supabase.from('journal_entries').insert({
    profile_id: session ? null : DEMO_PROFILE_ID,
    user_id: session?.user?.id,
    content: entry.text,
    mood_score: entry.mood
  });
}
