export const targetCountry = 'India';

export const personalInfoPatterns = [
  /\b\d{10}\b/,
  /\b(?:\+91[\s-]?)?[6-9]\d{9}\b/,
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
  /\b(?:whatsapp|phone|mobile|number|email|gmail|address|location|live in|i am from|insta|instagram|snapchat|telegram)\b/i,
  /\b(?:flat|apartment|house no|street|colony|hostel|pg|pincode|pin code)\b/i
];

export const abusePatterns = [
  /\b(kill yourself|kys|go die|die now)\b/i,
  /\b(slut|whore|bitch|bastard)\b/i,
  /\b(nude|send pic|send photo|hookup|sex chat)\b/i
];

export const reactionOptions = [
  { id: 'feel_this', label: 'I feel this', emoji: '🤍' },
  { id: 'strength', label: 'sending strength', emoji: '🫶' },
  { id: 'same_bro', label: 'same bro', emoji: '🥲' }
];

export function hasPersonalInfo(text = '') {
  return personalInfoPatterns.some(pattern => pattern.test(text));
}

export function privacyReply() {
  return 'Small privacy check — please do not share real name, phone number, email, exact location, Instagram, hostel/PG, or address here. Quiet Circle is anonymous, so keep it general and safe.';
}

export function detectAbuse(text = '') {
  const matched = abusePatterns.find(pattern => pattern.test(text));
  return matched ? { blocked: true, reason: 'This message may hurt someone or cross a boundary. Please rewrite it gently.' } : { blocked: false };
}

export function getMoodAura(score = 6) {
  const value = Number(score);
  if (value >= 8) return { name: 'Sunrise Aura', emoji: '🌅', className: 'auraSunrise', line: 'soft, steady, and hopeful' };
  if (value >= 6) return { name: 'Cloud Glow', emoji: '☁️', className: 'auraCloud', line: 'not perfect, but holding on' };
  if (value >= 4) return { name: 'Blue Fog', emoji: '🌫️', className: 'auraFog', line: 'heavy, but still moving' };
  return { name: 'Storm Heart', emoji: '⛈️', className: 'auraStorm', line: 'needs gentleness today' };
}

export function dailyStreak(items = []) {
  const days = [...new Set(items.map(item => new Date(item.iso || item.at || Date.now()).toDateString()))];
  if (!days.length) return 0;
  const daySet = new Set(days);
  let streak = 0;
  const cursor = new Date();
  for (;;) {
    if (!daySet.has(cursor.toDateString())) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function countryCrisisResources(country = targetCountry) {
  if (country === 'India') {
    return [
      { name: 'Emergency Services', phone: '112', desc: 'Call now if you or someone else is in immediate danger in India.' },
      { name: 'KIRAN Mental Health Helpline', phone: '1800-599-0019', desc: 'Government mental health support helpline in India.' },
      { name: 'Tele-MANAS', phone: '14416 or 1-800-891-4416', desc: 'National tele-mental health support in India.' }
    ];
  }
  return [
    { name: 'Emergency Services', phone: 'Local emergency number', desc: 'Call immediately if there is danger.' },
    { name: 'Local Crisis Line', phone: 'Use your country crisis hotline', desc: 'Reach a trained crisis supporter near you.' }
  ];
}
