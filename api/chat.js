const MODEL = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

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

function greetingReply(roomName) {
  const replies = [
    `Hey, welcome to ${roomName || 'this circle'}. I’m glad you came in. How are you feeling right now?`,
    `Hi, I’m here with you. No pressure to explain everything — what brought you in today?`,
    `Hey hey. You can start small here. What’s on your mind?`,
    `Hi friend. I’m listening. Do you want to talk, vent, or just sit for a minute?`
  ];
  return replies[Math.floor(Math.random() * replies.length)];
}

function fallbackReply(roomName, message) {
  if (isGreeting(message)) return greetingReply(roomName);
  return `I’m here with you in ${roomName || 'this circle'}. Tell me the part that feels the heaviest right now — no need to make it sound perfect.`;
}

function buildPrompt({ message, roomName, roomTheme, recentMessages }) {
  const context = Array.isArray(recentMessages)
    ? recentMessages.slice(-8).map((item) => `${item.user || item.from || 'Someone'}: ${item.text}`).join('\n')
    : '';

  return `You are a warm Quiet Circle buddy inside an anonymous emotional support room.
Room: ${roomName || 'Quiet Circle'}
Theme: ${roomTheme || 'general support'}

Style rules:
- Reply like a caring Gen Z friend, not a therapist and not a formal chatbot.
- Keep replies short: 1 to 4 sentences.
- Sound natural, warm, friendly, and specific to what the user said.
- If the user only says hi, hey, hello, or another simple greeting, greet them warmly first. Do not immediately ask deep or intense questions.
- For simple greetings, use a light welcome such as: “Hey, I’m glad you came in. How are you feeling?”
- Ask one gentle follow-up question when helpful.
- Do not say you are an AI in every message.
- Do not claim to be a licensed therapist, doctor, pastor, or emergency service.
- Do not diagnose the user.
- If the user is in immediate danger, tell them to contact emergency support now.

Recent room context:
${context || 'No recent context yet.'}

User message:
${message}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message = '', roomName = 'Quiet Circle', roomTheme = 'support', recentMessages = [] } = req.body || {};

    if (!message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (hasCrisisLanguage(message)) {
      return res.status(200).json({
        reply: 'I’m really sorry you’re carrying this much pain. Please call 911 or 988 now if you might hurt yourself or are in danger, or text HOME to 741741. If you can, move near another person and tell them you need help staying safe.',
        source: 'safety'
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(200).json({ reply: fallbackReply(roomName, message), source: 'fallback' });
    }

    const response = await fetch(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: buildPrompt({ message, roomName, roomTheme, recentMessages }) }]
          }
        ],
        generationConfig: {
          temperature: 0.85,
          topP: 0.9,
          maxOutputTokens: 180
        }
      })
    });

    if (!response.ok) {
      return res.status(200).json({ reply: fallbackReply(roomName, message), source: 'fallback' });
    }

    const data = await response.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    return res.status(200).json({
      reply: reply || fallbackReply(roomName, message),
      source: reply ? 'gemini' : 'fallback'
    });
  } catch (error) {
    return res.status(200).json({ reply: fallbackReply('this circle', req.body?.message), source: 'fallback' });
  }
}
