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

function isGreeting(text = '') {
  const clean = normalize(text).replace(/[!?.\s]+$/g, '');
  return ['hi', 'hello', 'hey', 'hii', 'heyy', 'yo', 'sup', 'good morning', 'good afternoon', 'good evening'].includes(clean);
}

function isSmallTalk(text = '') {
  const clean = normalize(text);
  return ['nothing', 'nothing much', 'nothing much bro', 'nothing much yaar', 'nm', 'bored', 'im bored', "i'm bored", 'just chilling', 'chilling', 'fine', 'good', 'ok', 'okay'].includes(clean);
}

function pick(options) {
  return options[Math.floor(Math.random() * options.length)];
}

function greetingReply() {
  return pick(['hey! hi there, how’s it going?', 'heyy, kya chal raha hai?', 'hey bro, how are you doing?', 'hi yaar, what’s up?']);
}

function smallTalkReply() {
  return pick(['kya chal raha hai yaar? bored ho?', 'haha same vibes sometimes. anything on your mind?', 'achha, chill scene. wanna talk about anything or just timepass?', 'okay okay. how’s your mood today though?']);
}

function contextualFallback(roomName, roomTheme, message) {
  const clean = normalize(message);
  if (isGreeting(message)) return greetingReply();
  if (isSmallTalk(message)) return smallTalkReply();

  if (clean.includes('exam') || clean.includes('fail') || clean.includes('failed') || clean.includes('grade') || roomTheme === 'Study') {
    return pick([
      'arre yaar, exam fail hona feels really bad, but it doesn’t mean you’re a failure. parents ko impress karne ka pressure bhi heavy hota hai — what happened exactly?',
      'oof bro, that must be hurting. Is the bigger stress the exam result, or how your parents will react?',
      'I get you yaar. One bad exam can make everything feel dark, but we can still figure out the next step. Which exam was it?'
    ]);
  }

  if (clean.includes('career') || clean.includes('job') || clean.includes('parents') || clean.includes('impress')) {
    return pick([
      'oof yaar, trying to impress parents while dealing with career pressure is exhausting. What happened with your career recently?',
      'I get it bro. When parents expect a lot, even one setback feels huge. Are they upset, or are you scared they will be?',
      'that’s heavy yaar. Career pressure plus family expectations can mess with your head — tell me what went wrong.'
    ]);
  }

  if (clean.includes('dark') || clean.includes('move on') || clean.includes('moving on') || clean.includes('breakup') || roomTheme === 'Heartbreak') {
    return pick([
      'oof yaar, that sounds really heavy. Moving on can feel like everything is dark for a while — kya hua?',
      'I’m sorry bro. That “trying to move on” phase hurts a lot. Did something trigger the feeling today?',
      'haan yaar, moving on is not simple. Tell me what part is hurting the most right now.'
    ]);
  }

  if (clean.includes('family') || roomTheme === 'Family') {
    return pick([
      'family pressure hits different yaar. What did they say or do?',
      'I get you bro, home stress can follow you everywhere. What happened today?',
      'that sounds tiring yaar. Is it expectations, arguments, or feeling misunderstood?'
    ]);
  }

  if (clean.includes('anxiety') || clean.includes('panic') || clean.includes('overthink') || clean.includes('scared')) {
    return pick([
      'okay yaar, pause for a sec. What thought is looping the most?',
      'I hear you bro. Is this fear about something happening now, or a “what if” spiral?',
      'that sounds overwhelming. Tell me the one thought that’s not leaving you alone.'
    ]);
  }

  return `I hear you yaar. Tell me a little more — what’s making it feel this heavy?`;
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

    return res.status(200).json({ reply: contextualFallback(roomName, roomTheme, message), source: 'fallback' });
  } catch (error) {
    return res.status(200).json({ reply: contextualFallback('this circle', 'support', req.body?.message), source: 'fallback' });
  }
}
