import { isSupabaseConfigured, supabase } from '../lib/supabase';

export async function saveRoomMessage({ session, roomKey, displayName, message }) {
  if (!isSupabaseConfigured) return;

  await supabase.from('room_messages').insert({
    room_key: roomKey,
    user_id: session?.user?.id,
    display_name: displayName,
    message
  });
}
