import { isSupabaseConfigured, supabase } from '../lib/supabase';

export async function saveMoodCheckin({ userId, score, note }) {
  if (!isSupabaseConfigured || !userId) return { skipped: true };
  return supabase.from('mood_checkins').insert({
    user_id: userId,
    mood_score: score,
    note
  });
}

export async function saveJournalEntry({ userId, text, moodScore }) {
  if (!isSupabaseConfigured || !userId) return { skipped: true };
  return supabase.from('journal_entries').insert({
    user_id: userId,
    content: text,
    mood_score: moodScore
  });
}

export async function saveModerationReport({ userId, type, text, severity = 'low', reason = 'user_report' }) {
  if (!isSupabaseConfigured || !userId) return { skipped: true };
  return supabase.from('moderation_reports').insert({
    user_id: userId,
    report_type: type,
    content: text,
    severity,
    safety_reason: reason
  });
}

export async function saveRoomMessage({ roomKey, userId, displayName, message, messageType = 'human', source = '', moderation = {} }) {
  if (!isSupabaseConfigured || !userId) return { skipped: true };
  return supabase.from('room_messages').insert({
    room_key: roomKey,
    user_id: userId,
    display_name: displayName,
    message,
    message_type: messageType,
    source,
    moderation_status: moderation.status || 'visible',
    severity: moderation.severity || 'low',
    safety_reason: moderation.reason || null,
    hidden_from_others: Boolean(moderation.hiddenFromOthers)
  });
}
