import { useEffect, useMemo, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { shouldTriggerAmbientPrompt, summarizePresence } from '../realtime/presenceEngine';

function uniqueMembers(members) {
  const seen = new Set();
  return members.filter((member) => {
    const key = member.userId || member.name;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function usePresence({ roomOpen, roomId, profile, session, messages = [] }) {
  const [members, setMembers] = useState([]);

  useEffect(() => {
    if (!roomOpen || !roomId) return undefined;

    const localName = profile?.name || session?.user?.email || 'Anonymous';
    const localUserId = session?.user?.id || `local-${localName}`;

    if (!isSupabaseConfigured) {
      setMembers(prev => uniqueMembers([...prev, { userId: localUserId, name: localName }]));
      return undefined;
    }

    const channel = supabase.channel(`presence:${roomId}`, {
      config: { presence: { key: localUserId } }
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const activeMembers = Object.values(state).flat().map(person => ({
          userId: person.userId,
          name: person.name
        }));
        setMembers(uniqueMembers(activeMembers));
      })
      .subscribe(async status => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ userId: localUserId, name: localName });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomOpen, roomId, profile?.name, session?.user?.id, session?.user?.email]);

  const summary = useMemo(() => summarizePresence(members), [members]);
  const shouldPrompt = useMemo(() => shouldTriggerAmbientPrompt(messages), [messages]);

  return {
    members,
    summary,
    shouldPrompt,
    peopleCount: roomOpen ? Math.max(1, members.length) : 0,
    hasOtherPeople: roomOpen ? members.length > 1 : false
  };
}
