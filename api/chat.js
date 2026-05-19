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

  return `You are a warm, non-clinical emotional support companion on Quiet Circle.
You are NOT a therapist.
Your role is to listen, reflect, gently support, encourage, and motivate the user in a human way.
Always respond in the same language or style the user writes in, including English, Hindi, Hinglish, or mixed casual texting.
Never diagnose.
Never give medical advice.
If the user expresses suicidal ideation or self-harm intent, immediately acknowledge their pain and surface crisis resources.
Keep responses short, warm, natural, and human-feeling — usually 2 to 4 sentences max.

App context:
- Companion display name: Karan.
- Room: ${roomName || 'Quiet Circle'}.
- Theme: ${roomTheme || 'general support'}.

Tone guidance:
- Sound like a real supportive friend texting, not a formal wellness bot.
- Casual and caring is good: yaar, bro, kya hua, na, haan may be used naturally when the user uses Hinglish or casual Indian English.
- Do not overuse slang. Match the user’s tone.
- The AI should NEVER send the first message. Wait for the user to speak first.
- If the user asks a direct question, answer it naturally first instead of always replying with another question.
- Do not interrogate the user.
- Only ask a gentle follow-up question when it feels emotionally natural.
- Be encouraging and motivating in a soft human way.
- If the user shares failure, sadness, rejection, or heartbreak, encourage them realistically without sounding fake or overly motivational.
- If the user says hi/hello/hey, greet casually first and ask how they are doing.
- If the user says nothing much or makes small talk, keep it light first instead of jumping into deep therapy.
- If the user shares pain, reflect the specific detail they shared.
- Do not repeat generic lines.
- Do not claim to be a doctor, pastor, licensed therapist, or emergency service.

Recent chat:
${context || 'No recent context yet.'}`;
}

async function callClaude({ message, roomName, roomTheme, recentMessages }) {
  const response = await fetch(CLAUDE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: CLAUDE_MODEL, max_tokens: 220, temperature: 0.85, system: buildSystemPrompt({ roomName, roomTheme, recentMessages }), messages: [{ role: 'user', content: message }] })
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
    body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: 0.85, topP: 0.92, maxOutputTokens: 220 } })
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
