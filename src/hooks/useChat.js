import { useCallback, useMemo, useRef, useState } from 'react';
import {
  classifySafety,
  isDuplicateMessage,
  shouldAiIntervene
} from '../utils/moderation';

export default function useChat({
  endpoint = '/api/chat',
  recentMessages = [],
  hasOtherPeople = false,
  roomKey = 'general'
}) {
  const [typing, setTyping] = useState(false);
  const [lastAiAt, setLastAiAt] = useState(0);
  const retryCountRef = useRef(0);

  const recentHumans = useMemo(
    () => recentMessages.filter(message => message.type === 'human'),
    [recentMessages]
  );

  const sendMessage = useCallback(async ({
    text,
    payload = {},
    onBlocked,
    onReply,
    onError
  }) => {
    const safety = classifySafety(text);

    if (isDuplicateMessage(text, recentMessages)) {
      onBlocked?.({
        reason: 'duplicate',
        message: 'That message is too similar to a recent one.'
      });
      return;
    }

    const aiShouldRespond = shouldAiIntervene({
      roomMessages: recentMessages,
      safety,
      hasOtherPeople,
      lastAiAt
    });

    if (!aiShouldRespond && hasOtherPeople) {
      onReply?.({
        skipped: true,
        reason: 'human_priority'
      });
      return;
    }

    try {
      setTyping(true);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: text,
          roomKey,
          recentMessages: recentHumans.slice(-12),
          ...payload
        })
      });

      const data = await response.json();

      if (!response.ok) {
        retryCountRef.current += 1;
        throw new Error(data?.error || 'Chat failed');
      }

      retryCountRef.current = 0;
      setLastAiAt(Date.now());

      onReply?.(data);
    } catch (error) {
      onError?.(error);
    } finally {
      setTyping(false);
    }
  }, [endpoint, recentMessages, recentHumans, hasOtherPeople, lastAiAt, roomKey]);

  return {
    typing,
    sendMessage,
    retryCount: retryCountRef.current
  };
}
