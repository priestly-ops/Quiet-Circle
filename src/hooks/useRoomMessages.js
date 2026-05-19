import { useEffect } from 'react';
import { isSupabaseConfigured } from '../lib/supabase';
import {
  loadRoomHistory,
  mapDbMessage,
  subscribeToRoomMessages,
  unsubscribeFromRoomMessages
} from '../services/roomService';

function mergeRoomMessageGroups(currentGroups, incomingMessage) {
  const roomKey = incomingMessage.roomKey;
  if (!roomKey) return currentGroups;

  const existingMessages = currentGroups[roomKey] || [];
  const alreadyExists = incomingMessage.id && existingMessages.some(message => message.id === incomingMessage.id);

  if (alreadyExists) return currentGroups;

  return {
    ...currentGroups,
    [roomKey]: [...existingMessages, incomingMessage]
  };
}

export default function useRoomMessages({ enabled, setRoomMessagesById, setCloudStatus }) {
  useEffect(() => {
    if (!enabled || !isSupabaseConfigured) return undefined;

    let active = true;
    let channel = null;

    async function hydrateRoomHistory() {
      try {
        const rows = await loadRoomHistory();
        if (!active) return;

        setRoomMessagesById(previous => {
          let next = { ...previous };
          rows.forEach(row => {
            next = mergeRoomMessageGroups(next, mapDbMessage(row));
          });
          localStorage.setItem('qc_room_messages_by_id', JSON.stringify(next));
          return next;
        });

        setCloudStatus('Room history synced');
      } catch (error) {
        setCloudStatus('Room history sync failed');
      }
    }

    hydrateRoomHistory();

    channel = subscribeToRoomMessages(row => {
      const incomingMessage = mapDbMessage(row);
      setRoomMessagesById(previous => {
        const next = mergeRoomMessageGroups(previous, incomingMessage);
        localStorage.setItem('qc_room_messages_by_id', JSON.stringify(next));
        return next;
      });
      setCloudStatus('Live room update received');
    });

    return () => {
      active = false;
      unsubscribeFromRoomMessages(channel);
    };
  }, [enabled, setRoomMessagesById, setCloudStatus]);
}
