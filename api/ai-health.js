const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY);

  return res.status(200).json({
    status: hasGeminiKey ? 'configured' : 'fallback_only',
    geminiConfigured: hasGeminiKey,
    model: GEMINI_MODEL,
    fallbackAvailable: true,
    message: hasGeminiKey
      ? 'Gemini key is configured. Chat will use Gemini first and local fallback if Gemini fails.'
      : 'Gemini key is missing. Chat will use local fallback only until GEMINI_API_KEY is added in Vercel.',
    checkedAt: new Date().toISOString()
  });
}
