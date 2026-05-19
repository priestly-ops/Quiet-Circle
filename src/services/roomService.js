import { isSupabaseConfigured, supabase } from '../lib/supabase';

export function createClientMessageId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function saveRoomMessage({ session, roomKey, displayName, message, clientMessageId }) {
  if (!isSupabaseConfigured) return null;

  const payload = {
    room_key: roomKey,
    user_id: session?.user?.id,
    display_name: displayName,
    message
  };

  if (clientMessageId) payload.client_message_id = clientMessageId;

  const { data, error } = await supabase
    .from('room_messages')
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function loadRoomHistory() {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('room_messages')
    .select('id, room_key, display_name, message, created_at, user_id, client_message_id')
    .order('created_at', { ascending: true })
    .limit(250);

  if (error) throw error;
  return data || [];
}

export function mapDbMessage(row) {
  return {
    id: row.id,
    clientMessageId: row.client_message_id,
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
