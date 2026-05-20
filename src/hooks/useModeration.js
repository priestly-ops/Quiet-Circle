import { useMemo } from 'react';
import {
  canSendWithCooldown,
  classifySafety,
  isDuplicateMessage,
  MESSAGE_COOLDOWN_MS
} from '../utils/moderation';

export default function useModeration({ recentMessages = [], lastSentAt = 0 }) {
  const cooldown = useMemo(() => canSendWithCooldown(lastSentAt, MESSAGE_COOLDOWN_MS), [lastSentAt]);

  function validateMessage(text = '') {
    const safety = classifySafety(text);
    const duplicate = isDuplicateMessage(text, recentMessages);

    return {
      allowed:
        cooldown.allowed &&
        !duplicate &&
        safety.action !== 'block',
      cooldown,
      duplicate,
      safety
    };
  }

  return {
    validateMessage,
    cooldown
  };
}
