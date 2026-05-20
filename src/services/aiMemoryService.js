import { isSupabaseConfigured, supabase } from '../lib/supabase';

function scoreMemory(memory = '', input = '') {
  const left = new Set(String(memory).toLowerCase().split(/\W+/).filter(Boolean));
  const right = new Set(String(input).toLowerCase().split(/\W+/).filter(Boolean));
  if (!left.size || !right.size) return 0;
  const overlap = [...left].filter(word => right.has(word)).length;
  return overlap / Math.max(left.size, right.size);
}

export async function saveAiMemory({ userId, roomKey, memory, sourceMessage, importance = 1 }) {
  if (!isSupabaseConfigured || !userId || !memory?.trim()) return { skipped: true };

  return supabase.from('ai_memories').insert({
    user_id: userId,
    room_key: roomKey,
    memory: memory.trim(),
    source_message: sourceMessage || null,
    importance
  });
}

export async function getRankedMemories({ userId, roomKey, input, limit = 5 }) {
  if (!isSupabaseConfigured || !userId) return [];

  const { data, error } = await supabase
    .from('ai_memories')
    .select('*')
    .eq('user_id', userId)
    .or(`room_key.eq.${roomKey},room_key.is.null`)
    .order('created_at', { ascending: false })
    .limit(30);

  if (error || !data) return [];

  return data
    .map(item => ({
      ...item,
      rank: scoreMemory(item.memory, input) + Number(item.importance || 1) * 0.08
    }))
    .sort((a, b) => b.rank - a.rank)
    .slice(0, limit);
}

export function summarizeMemoryCandidate(text = '') {
  const clean = text.trim();
  if (clean.length < 30) return '';
  if (/\b(always|never|family|parents|career|job|anxiety|panic|breakup|faith|lonely|alone|stress)\b/i.test(clean)) {
    return clean.slice(0, 220);
  }
  return '';
}
