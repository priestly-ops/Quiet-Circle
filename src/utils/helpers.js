const adjectives = ['Chill', 'Soft', 'Kind', 'Calm', 'Bright', 'Brave', 'Moon', 'Warm', 'Quiet', 'Desi'];
const indianNames = ['Aarav', 'Vivaan', 'Aditya', 'Arjun', 'Krishna', 'Rohan', 'Kabir', 'Ishaan', 'Anaya', 'Diya', 'Meera', 'Kavya', 'Aadhya', 'Saanvi', 'Nisha', 'Priya', 'Rahul', 'Sneha', 'Kiran', 'Asha'];

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
  'ending it',
  'mar jaunga',
  'mar jaungi',
  'jaan de dunga',
  'jaan de dungi',
  'jeena nahi',
  'jeena nahin'
];

const personalInfoPatterns = [
  /\b\d{10}\b/,
  /\b(?:\+91[\s-]?)?[6-9]\d{9}\b/,
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
  /\b(?:whatsapp|phone|mobile|number|email|gmail|address|location|live in|i am from|insta|instagram|snapchat|telegram)\b/i,
  /\b(?:flat|apartment|house no|street|colony|hostel|pg|pincode|pin code)\b/i
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
  return `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${indianNames[Math.floor(Math.random() * indianNames.length)]}`;
}

export function isCrisisText(text) {
  const clean = text.toLowerCase().normalize('NFKD').replace(/[’‘]/g, "'");
  return [...new Set(crisisWords.map(word => word.toLowerCase().replace(/[’‘]/g, "'")))].some(word => clean.includes(word));
}

export function hasPersonalInfo(text = '') {
  return personalInfoPatterns.some(pattern => pattern.test(text));
}

export function privacyReply() {
  return 'Small privacy check, yaar — please don’t share real name, phone number, email, exact location, Instagram, hostel/PG, or address here. Quiet Circle is anonymous, so keep it general and safe.';
}

export function safetyReply() {
  return 'I’m really sorry you’re feeling this much pain. Quiet Circle is anonymous and not an emergency service. If you might hurt yourself or are in immediate danger in India, call 112 now, contact KIRAN at 1800-599-0019, or reach out to a trusted person near you right now. Please don’t stay alone with this feeling.';
}

function pick(options) {
  return options[Math.floor(Math.random() * options.length)];
}

function isGreeting(text) {
  const clean = text.toLowerCase().trim().replace(/[!?.\s]+$/g, '');
  return ['hi', 'hello', 'hey', 'hii', 'heyy', 'yo', 'sup', 'namaste', 'bro', 'yaar', 'good morning', 'good afternoon', 'good evening'].includes(clean);
}

export function humanReply(text, room = {}) {
  if (hasPersonalInfo(text)) return privacyReply();
  if (isCrisisText(text)) return safetyReply();

  const lower = text.toLowerCase();
  const roomId = room.id || '';

  if (isGreeting(text)) {
    return pick([
      'hi yaar, how are you?',
      "hey hey, what's up?",
      "yo, how's it going?",
      'heyy, what are you up to?'
    ]);
  }

  if (roomId === 'family' || lower.includes('family') || lower.includes('parents') || lower.includes('mom') || lower.includes('dad')) {
    return pick([
      'Family pressure hits different, yaar. What exactly happened?',
      'That sounds heavy. Are you more angry, guilty, or just tired right now?',
      'I get you. Indian family expectations can feel nonstop. Want to vent first?'
    ]);
  }

  if (roomId === 'breakup' || lower.includes('breakup') || lower.includes('ex') || lower.includes('miss him') || lower.includes('miss her')) {
    return pick([
      'Oof, that pain is real. Did something trigger the missing-them feeling today?',
      'No fake “move on” gyaan from me. What part hurts most right now?',
      'Be honest bro — do you want closure, a reply, or just peace from the feeling?'
    ]);
  }

  if (roomId === 'career' || lower.includes('job') || lower.includes('career') || lower.includes('interview') || lower.includes('rejection')) {
    return pick([
      'Job pressure can mess with your head badly. But rejection is not your identity, okay?',
      'I hear you. Is it money stress, interviews, visa pressure, or comparing yourself with others?',
      'You’re not lazy, you sound drained. What’s the biggest career tension right now?'
    ]);
  }

  if (roomId === 'anxiety' || lower.includes('anxious') || lower.includes('panic') || lower.includes('overthink') || lower.includes('scared')) {
    return pick([
      'Okay, breathe with me for a sec. Is this a real problem right now, or a scary what-if loop?',
      'That spiral is loud, I know. Name one thing near you. Let’s slow this down.',
      'You don’t have to solve everything tonight. What thought keeps repeating?'
    ]);
  }

  if (roomId === 'faith' || lower.includes('god') || lower.includes('pray') || lower.includes('faith')) {
    return pick([
      'You can be honest with God here. Even “I’m tired” is a prayer, yaar.',
      'Faith can feel quiet sometimes. That doesn’t mean you’re abandoned. What are you carrying?',
      'Say the messy version first. We can turn it into a simple prayer after.'
    ]);
  }

  if (roomId === 'friendship' || lower.includes('friend') || lower.includes('left out') || lower.includes('ghosted')) {
    return pick([
      'Being left out by friends hurts badly. Did they ignore you, replace you, or make you feel small?',
      'That would bother me too. Do you want to understand it, confront it, or just detach?',
      'You’re not dramatic for feeling hurt. Batao, what happened?'
    ]);
  }

  if (lower.includes('alone') || lower.includes('lonely')) {
    return pick([
      'I’m here with you, yaar. What made tonight feel this lonely?',
      'Loneliness gets loud when everything is quiet. Want comfort, distraction, or to talk it out?',
      'That sounds isolating. When did it start feeling heavy today?'
    ]);
  }

  if (lower.includes('stress') || lower.includes('exam') || lower.includes('work')) {
    return pick([
      'Your brain sounds like too many tabs open. Which tab is flashing red right now?',
      'Let’s not fix everything. What’s the next tiny thing you need to survive the next hour?',
      'You sound overloaded, not weak. What’s taking the most energy?'
    ]);
  }

  if (lower.includes('sad') || lower.includes('cry') || lower.includes('hurt')) {
    return pick([
      'I’m sorry yaar. That sounds tender. What part hurts the most?',
      'No need to make it sound okay. Say it messy, I’m listening.',
      'That sadness can sit in the chest. Did something happen, or did it build up?'
    ]);
  }

  return pick([
    'I’m listening. Say more — what’s the part you haven’t told anyone?',
    'I get you. Do you need comfort, honesty, or distraction right now?',
    'I’m with you. Keep going, even if it comes out messy.',
    'Yeah, I hear you. What happened right before this feeling started?',
    'That’s a lot to carry alone, bro. Let’s unpack one piece at a time.'
  ]);
}
