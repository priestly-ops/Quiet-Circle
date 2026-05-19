const adjectives = ['Quiet', 'Gentle', 'Moon', 'Calm', 'Soft', 'Brave', 'Warm', 'Hidden', 'Kind', 'Silver'];
const nouns = ['Willow', 'Leaf', 'Star', 'River', 'Cloud', 'Lantern', 'Anchor', 'Finch', 'Meadow', 'Stone'];

export const crisisWords = [
  'suicide',
  'kill myself',
  'end my life',
  'hurt myself',
  'self harm',
  'want to die',
  'overdose',
  'can’t go on',
  "can't go on"
];

export function getSaved(key, fallback) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

export function makeAnonName() {
  return `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]}`;
}

export function isCrisisText(text) {
  return crisisWords.some(word => text.toLowerCase().includes(word));
}

export function safetyReply() {
  return 'I’m really sorry you’re feeling this much pain. I can’t be your only support right now. If you might hurt yourself or are in danger, please call 911 or 988 now, or text HOME to 741741. If you can, move near another person and tell them you need help staying safe.';
}

export function humanReply(text) {
  if (isCrisisText(text)) return safetyReply();

  const lower = text.toLowerCase();

  if (lower.includes('alone') || lower.includes('lonely')) {
    return 'I get that. Sometimes feeling alone is the loudest part. I’m here in this circle with you — what made it feel strongest today?';
  }

  if (lower.includes('stress') || lower.includes('exam') || lower.includes('work')) {
    return 'That sounds like a lot to hold at once. Maybe start by naming the one thing that feels most urgent, not everything at once.';
  }

  if (lower.includes('sad') || lower.includes('break')) {
    return 'I’m sorry. That kind of hurt can come in waves. You don’t have to explain it perfectly here — just say the part that hurts most right now.';
  }

  return 'I hear you. I’m not here to fix you, just to sit with you for a minute. What would make the next ten minutes a little easier?';
}
