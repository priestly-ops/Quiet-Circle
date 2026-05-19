import { isSupabaseConfigured, supabase } from '../lib/supabase';

export async function saveModerationReport({ session, type, content }) {
  if (!isSupabaseConfigured) return;

  await supabase.from('moderation_reports').insert({
    user_id: session?.user?.id,
    report_type: type,
    content,
    status: 'pending'
  });
}
