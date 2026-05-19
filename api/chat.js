const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514';
const CLAUDE_URL = 'https://api.anthropic.com/v1/messages';

const crisisTerms = [
  'suicide',
  'kill myself',
  'end my life',
  'hurt myself',
  'self harm',
  'want to die',
  'overdose',
  "can't go on",
  'no reason to live',
  'ending it'
];

function hasCrisisLanguage(text = '') {
  const clean = text.toLowerCase().replace(/[’‘]/g, "'");
  return crisisTerms.some((term) => clean.includes(term));
}

function isGreeting(text = '') {
  const clean = text.toLowerCase().trim().replace(/[!?.\s]+$/g, '');
  return ['hi', 'hello', 'hey', 'hii', 'heyy', 'yo', 'sup', 'good morning', 'good afternoon', 'good evening'].includes(clean);
}

function isSmallTalk(text = '') {
  const clean = text.toLowerCase().trim();
  return ['nothing', 'nothing much', 'nothing much bro', 'nothing much yaar', 'nm', 'bored', 'im bored', "i'm bored", 'just chilling', 'chilling', 'fine', 'good', 'ok', 'okay'].includes(clean);
}

function pick(options) {
  return options[Math.floor(Math.random() * options.length)];
}

function greetingReply() {
  return pick([
    'hey! hi there, how’s it going?',
    'heyy, kya chal raha hai?',
    'hey bro, how are you doing?',
    'hi yaar, what’s up?'
  ]);
}

function smallTalkReply() {
  return pick([
    'kya chal raha hai yaar? bored ho?',
    'haha same vibes sometimes. anything on your mind?',
    'achha, chill scene. wanna talk about anything or just timepass?',
    'okay okay. how’s your mood today though?'
  ]);
}

function fallbackReply(roomName, message) {
  if (isGreeting(message)) return greetingReply();
  if (isSmallTalk(message)) return smallTalkReply();
  return `oof yaar, that sounds tough. I’m here with you — kya hua jo aise feel ho raha hai?`;
}

function buildSystemPrompt({ roomName, roomTheme, recentMessages }) {
  const context = Array.isArray(recentMessages)
    ? recentMessages.slice(-8).map((item) => `${item.user || item.from || 'Someone'}: ${item.text}`).join('\n')
    : '';

  return `You are Karan, a warm anonymous buddy inside a Quiet Circle emotional support chat.
Room: ${roomName || 'Quiet Circle'}
Theme: ${roomTheme || 'general support'}

Personality:
- Sound like a real friend texting, not a therapist, not a formal mental health bot.
- Casual, warm, simple, emotionally intelligent.
- Use light Hinglish naturally when it fits: yaar, bro, kya hua, chal, na, haan.
- Do not overuse Hinglish. Mix mostly English with small casual phrases.
- Keep replies short: 1 to 3 sentences.
- Make it feel like a buddy is present in the room.

Conversation behavior:
- If the user only says hi/hey/hello, simply greet them like: “hey! hi there, how’s it going?”
- If the user says “nothing much” or casual small talk, do not jump into deep therapy. Reply like: “kya chal raha hai yaar? bored ho?”
- If the user opens up emotionally, gently match their emotion and ask one caring follow-up.
- For breakup/healing, sound like: “oof yaar, that sounds tough... moving on can be such a pain na. kya hua jo aise feel ho raha hai?”
- Do not give long advice unless the user asks.
- Do not sound poetic, preachy, clinical, or overly polished.
- Do not say you are an AI in the message.
- Do not claim to be a licensed therapist, doctor, pastor, or emergency service.
- Do not diagnose the user.
- If the user is in immediate danger, tell them to contact emergency support now.

Recent chat:
${context || 'No recent context yet.'}`;
}

async function callClaude({ message, roomName, roomTheme, recentMessages }) {
  const response = await fetch(CLAUDE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 140,
      temperature: 0.85,
      system: buildSystemPrompt({ roomName, roomTheme, recentMessages }),
      messages: [{ role: 'user', content: message }]
    })
  });

  if (!response.ok) throw new Error('Claude request failed');
  const data = await response.json();
  return data?.content?.[0]?.text?.trim();
}

async function callGemini({ message, roomName, roomTheme, recentMessages }) {
  const prompt = `${buildSystemPrompt({ roomName, roomTheme, recentMessages })}\n\nUser message:\n${message}`;
  const response = await fetch(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.9, topP: 0.92, maxOutputTokens: 120 }
    })
  });

  if (!response.ok) throw new Error('Gemini request failed');
  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { message = '', roomName = 'Quiet Circle', roomTheme = 'support', recentMessages = [] } = req.body || {};
    if (!message.trim()) return res.status(400).json({ error: 'Message is required' });

    if (hasCrisisLanguage(message)) {
      return res.status(200).json({
        reply: 'I’m really sorry you’re carrying this much pain. Please call 911 or 988 now if you might hurt yourself or are in danger, or text HOME to 741741. If you can, move near another person and tell them you need help staying safe.',
        source: 'safety'
      });
    }

    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const reply = await callClaude({ message, roomName, roomTheme, recentMessages });
        if (reply) return res.status(200).json({ reply, source: 'claude' });
      } catch (error) {
        console.error('Claude fallback:', error.message);
      }
    }

    if (process.env.GEMINI_API_KEY) {
      try {
        const reply = await callGemini({ message, roomName, roomTheme, recentMessages });
        if (reply) return res.status(200).json({ reply, source: 'gemini' });
      } catch (error) {
        console.error('Gemini fallback:', error.message);
      }
    }

    return res.status(200).json({ reply: fallbackReply(roomName, message), source: 'fallback' });
  } catch (error) {
    return res.status(200).json({ reply: fallbackReply('this circle', req.body?.message), source: 'fallback' });
  }
}
