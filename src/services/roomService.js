import { isSupabaseConfigured, supabase } from '../lib/supabase';

export async function saveRoomMessage({ session, roomKey, displayName, message }) {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase
    .from('room_messages')
    .insert({
      room_key: roomKey,
      user_id: session?.user?.id,
      display_name: displayName,
      message
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function loadRoomHistory() {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('room_messages')
    .select('id, room_key, display_name, message, created_at, user_id')
    .order('created_at', { ascending: true })
    .limit(250);

  if (error) throw error;
  return data || [];
}

export function mapDbMessage(row) {
  return {
    id: row.id,
    user: row.display_name || 'Anonymous',
    text: row.message,
    roomKey: row.room_key,
    at: row.created_at,
    type: 'human',
    source: 'supabase'
  };
}

export function subscribeToRoomMessages(onInsert) {
  if (!isSupabaseConfigured) return null;

  return supabase
    .channel('quiet-circle-room-messages')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'room_messages' },
      payload => onInsert(payload.new)
    )
    .subscribe();
}

export async function unsubscribeFromRoomMessages(channel) {
  if (!channel || !isSupabaseConfigured) return;
  await supabase.removeChannel(channel);
}
