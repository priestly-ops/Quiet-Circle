const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514';
const CLAUDE_URL = 'https://api.anthropic.com/v1/messages';

const crisisTerms = ['suicide', 'kill myself', 'end my life', 'hurt myself', 'self harm', 'want to die', 'overdose', "can't go on", 'no reason to live', 'ending it'];

function normalize(text = '') {
  return text.toLowerCase().replace(/[’‘]/g, "'").trim();
}

function hasCrisisLanguage(text = '') {
  const clean = normalize(text);
  return crisisTerms.some((term) => clean.includes(term));
}

function buildSystemPrompt({ roomName, roomTheme, recentMessages }) {
  const context = Array.isArray(recentMessages)
    ? recentMessages.slice(-8).map((item) => `${item.user || item.from || 'Someone'}: ${item.text}`).join('\n')
    : '';

  return `You are Karan, a warm anonymous buddy inside a Quiet Circle emotional support chat.
Room: ${roomName || 'Quiet Circle'}
Theme: ${roomTheme || 'general support'}

Style:
- Sound like a real friend texting, not a therapist and not a wellness bot.
- Casual, warm, short, human. 1 to 3 sentences max.
- Use light Hinglish naturally: yaar, bro, kya hua, na, haan. Do not overdo it.
- Respond specifically to what the user said. Never repeat the same generic line.
- If the user says hi/hello, greet casually first.
- If the user says nothing much, small talk first.
- If the user says they failed exams, career is bad, parents are disappointed, moving on feels dark, respond to those exact details.
- Ask one caring follow-up.
- Do not claim to be a therapist, doctor, pastor, or emergency service.
- Do not diagnose.

Recent chat:
${context || 'No recent context yet.'}`;
}

async function callClaude({ message, roomName, roomTheme, recentMessages }) {
  const response = await fetch(CLAUDE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: CLAUDE_MODEL, max_tokens: 140, temperature: 0.85, system: buildSystemPrompt({ roomName, roomTheme, recentMessages }), messages: [{ role: 'user', content: message }] })
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
    body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: 0.9, topP: 0.92, maxOutputTokens: 120 } })
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
      return res.status(200).json({ reply: 'I’m really sorry you’re carrying this much pain. Please call 911 or 988 now if you might hurt yourself or are in danger, or text HOME to 741741. If you can, move near another person and tell them you need help staying safe.', source: 'safety' });
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

    return res.status(503).json({ error: 'No Claude or Gemini provider is configured. Add ANTHROPIC_API_KEY or GEMINI_API_KEY in Vercel.', source: 'not_configured' });
  } catch (error) {
    return res.status(503).json({ error: 'Claude and Gemini are unavailable right now.', source: 'provider_unavailable' });
  }
}
