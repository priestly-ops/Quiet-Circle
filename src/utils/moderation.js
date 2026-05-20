import { hasPersonalInfo, isCrisisText } from './helpers';

const TOXIC_PATTERNS = [
  /\b(kill|hurt|attack|beat)\s+(him|her|them|you|someone)\b/i,
  /\b(hate speech|racial slur|go die|kys)\b/i,
  /\b(send nudes|sexual pics|hookup)\b/i,
  /\b(drugs?|weed|cocaine|mdma|pills)\b/i,
  /\b(?:meet me|come to my place|share your location|drop your address)\b/i
];

const GROUNDING_PATTERNS = [
  /\b(panic|panicking|anxiety attack|can't breathe|cant breathe|spiral|overthinking)\b/i,
  /\b(crying|shaking|numb|triggered|flashback)\b/i
];

const DUPLICATE_WINDOW_MS = 90 * 1000;
const MESSAGE_COOLDOWN_MS = 4500;
const REPORT_COOLDOWN_MS = 10000;

function normalizeText(text = '') {
  return text.toLowerCase().replace(/[^a-z0-9\s]/gi, '').replace(/\s+/g, ' ').trim();
}

function similarity(a = '', b = '') {
  const aWords = new Set(normalizeText(a).split(' ').filter(Boolean));
  const bWords = new Set(normalizeText(b).split(' ').filter(Boolean));
  if (!aWords.size || !bWords.size) return 0;
  const overlap = [...aWords].filter(word => bWords.has(word)).length;
  return overlap / Math.max(aWords.size, bWords.size);
}

export function classifySafety(text = '') {
  if (isCrisisText(text)) {
    return { severity: 'critical', action: 'escalate', reason: 'crisis_intent' };
  }

  if (hasPersonalInfo(text)) {
    return { severity: 'high', action: 'block', reason: 'personal_info' };
  }

  if (TOXIC_PATTERNS.some(pattern => pattern.test(text))) {
    return { severity: 'high', action: 'hold_for_review', reason: 'unsafe_or_toxic' };
  }

  if (GROUNDING_PATTERNS.some(pattern => pattern.test(text))) {
    return { severity: 'medium', action: 'grounding_prompt', reason: 'grounding_needed' };
  }

  return { severity: 'low', action: 'allow', reason: 'clear' };
}

export function isDuplicateMessage(text = '', recentMessages = []) {
  const now = Date.now();
  return recentMessages.some(message => {
    const createdAt = message.created_at ? new Date(message.created_at).getTime() : now;
    const closeInTime = Number.isFinite(createdAt) && now - createdAt < DUPLICATE_WINDOW_MS;
    return closeInTime && similarity(text, message.text || '') > 0.86;
  });
}

export function canSendWithCooldown(lastSentAt, cooldownMs = MESSAGE_COOLDOWN_MS) {
  if (!lastSentAt) return { allowed: true, waitMs: 0 };
  const waitMs = cooldownMs - (Date.now() - lastSentAt);
  return { allowed: waitMs <= 0, waitMs: Math.max(0, waitMs) };
}

export function shouldAiIntervene({ roomMessages = [], safety = {}, hasOtherPeople = false, lastAiAt = 0 }) {
  if (safety.action === 'escalate' || safety.action === 'grounding_prompt') return true;
  if (safety.action === 'hold_for_review') return true;

  const humanMessages = roomMessages.filter(message => message.type === 'human');
  const aiRecentlySpoke = lastAiAt && Date.now() - lastAiAt < 2 * 60 * 1000;
  const roomIsEmpty = !hasOtherPeople && humanMessages.length <= 1;
  const afterSilence = humanMessages.length > 0 && Date.now() - new Date(humanMessages[humanMessages.length - 1].created_at || Date.now()).getTime() > 3 * 60 * 1000;

  if (aiRecentlySpoke) return false;
  return roomIsEmpty || afterSilence;
}

export function groundingReply() {
  return 'Pause with me for 20 seconds. Look around and name 3 things you can see, 2 things you can touch, and 1 thing you can hear. You do not have to solve the whole feeling right now.';
}

export function moderationReply() {
  return 'I’m holding this message for safety. Quiet Circle is anonymous, gentle, and not a place for threats, personal details, explicit requests, or unsafe contact sharing.';
}

export { MESSAGE_COOLDOWN_MS, REPORT_COOLDOWN_MS };
