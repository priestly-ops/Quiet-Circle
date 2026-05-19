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
  "can't go on",
  'no reason to live',
  'ending it'
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
  const clean = text.toLowerCase().normalize('NFKD').replace(/[’‘]/g, "'");
  return [...new Set(crisisWords.map(word => word.toLowerCase().replace(/[’‘]/g, "'")))].some(word => clean.includes(word));
}

export function safetyReply() {
  return 'I’m really sorry you’re feeling this much pain. I can’t be your only support right now. If you might hurt yourself or are in danger, please call 911 or 988 now, or text HOME to 741741. If you can, move near another person and tell them you need help staying safe.';
}

function pick(options) {
  return options[Math.floor(Math.random() * options.length)];
}

export function humanReply(text, room = {}) {
  if (isCrisisText(text)) return safetyReply();

  const lower = text.toLowerCase();
  const roomId = room.id || '';

  if (roomId === 'family' || lower.includes('family') || lower.includes('parents') || lower.includes('mom') || lower.includes('dad')) {
    return pick([
      'Oof, family stuff hurts differently because you still care. What did they say that stayed in your head?',
      'That sounds heavy. Are you more angry, guilty, or just tired right now?',
      'I get why that would mess with your peace. Do you want to vent first, or do you want help figuring out what to say back?'
    ]);
  }

  if (roomId === 'breakup' || lower.includes('breakup') || lower.includes('ex') || lower.includes('miss him') || lower.includes('miss her')) {
    return pick([
      'Yeah… missing someone can hit like a wave out of nowhere. Did something trigger it today?',
      'I won’t tell you to “just move on.” That never helps. What part do you miss — them, the routine, or who you were with them?',
      'Be honest with me: are you wanting closure, a reply, or just relief from the feeling?'
    ]);
  }

  if (roomId === 'career' || lower.includes('job') || lower.includes('career') || lower.includes('interview') || lower.includes('rejection')) {
    return pick([
      'That job pressure can make everything feel personal. But rejection is not your identity. What happened today?',
      'I hear you. Are you feeling stuck because of money, time, interviews, or comparing yourself to others?',
      'You’re not lazy — you sound drained. What is the one career thing stressing you the most right now?'
    ]);
  }

  if (roomId === 'anxiety' || lower.includes('anxious') || lower.includes('panic') || lower.includes('overthink') || lower.includes('scared')) {
    return pick([
      'Okay, stay with me for a second. Is this a real problem in front of you, or a scary “what if” loop?',
      'That spiral is loud, I know. Name one thing you can see near you right now. Let’s slow your brain down a little.',
      'You don’t have to solve the whole thing tonight. What is the exact thought that keeps repeating?'
    ]);
  }

  if (roomId === 'faith' || lower.includes('god') || lower.includes('pray') || lower.includes('faith')) {
    return pick([
      'You can be honest with God here. Even “I’m tired” counts as a prayer. What do you wish He would answer right now?',
      'Faith can feel quiet sometimes. That doesn’t mean you’re abandoned. What are you carrying today?',
      'I’m with you. Want to say the messy version first, then we can turn it into a simple prayer?'
    ]);
  }

  if (roomId === 'friendship' || lower.includes('friend') || lower.includes('left out') || lower.includes('ghosted')) {
    return pick([
      'Being left out by friends is such a specific kind of hurt. Did they ignore you, replace you, or make you feel small?',
      'That would bother me too. Do you want to understand it, confront it, or just stop caring so much?',
      'You’re not dramatic for feeling hurt. What happened?'
    ]);
  }

  if (lower.includes('alone') || lower.includes('lonely')) {
    return pick([
      'I’m here with you. Not in a fake motivational way — genuinely, you don’t have to hold this sentence alone. What made tonight feel lonely?',
      'Loneliness gets so loud when everything is quiet. Do you want distraction, comfort, or to talk through it?',
      'That sounds really isolating. When did it start feeling this heavy today?'
    ]);
  }

  if (lower.includes('stress') || lower.includes('exam') || lower.includes('work')) {
    return pick([
      'That sounds like too many tabs open in your brain. What’s the one tab that keeps flashing red?',
      'I get it. Let’s not fix everything. What is the next tiny thing you need to survive the next hour?',
      'You sound overloaded, not weak. What’s taking the most energy right now?'
    ]);
  }

  if (lower.includes('sad') || lower.includes('cry') || lower.includes('hurt')) {
    return pick([
      'I’m sorry. That sounds really tender. Do you want to tell me the real reason, even if it sounds messy?',
      'I’m here. No pressure to make it sound okay. What part hurts the most?',
      'That kind of sadness can sit in your chest. Did something happen, or did it just build up?'
    ]);
  }

  return pick([
    'I’m listening. Say more — what’s the part you haven’t told anyone yet?',
    'That makes sense. I don’t want to give you a fake quote. What do you actually need right now — comfort, honesty, or distraction?',
    'I’m with you. Keep going, even if it comes out messy.',
    'Yeah, I hear you. What happened right before you started feeling this way?',
    'That’s a lot to carry alone. Want to unpack the first piece together?'
  ]);
}
