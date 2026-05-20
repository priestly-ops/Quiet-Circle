import { createClient } from '@supabase/supabase-js';

const GEMINI_EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001';
const GEMINI_EMBEDDING_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_EMBEDDING_MODEL}:embedContent`;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabaseAdmin() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false }
  });
}

async function generateEmbedding(text = '') {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const response = await fetch(`${GEMINI_EMBEDDING_URL}?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: {
        parts: [{ text }]
      },
      taskType: 'RETRIEVAL_DOCUMENT',
      outputDimensionality: 768
    })
  });

  if (!response.ok) {
    const details = await response.text().catch(() => '');
    throw new Error(`Gemini embedding failed: ${details}`);
  }

  const data = await response.json();
  const values = data?.embedding?.values;

  if (!Array.isArray(values) || values.length !== 768) {
    throw new Error('Gemini returned an invalid embedding');
  }

  return values;
}

async function generateQueryEmbedding(text = '') {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const response = await fetch(`${GEMINI_EMBEDDING_URL}?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: {
        parts: [{ text }]
      },
      taskType: 'RETRIEVAL_QUERY',
      outputDimensionality: 768
    })
  });

  if (!response.ok) {
    const details = await response.text().catch(() => '');
    throw new Error(`Gemini query embedding failed: ${details}`);
  }

  const data = await response.json();
  const values = data?.embedding?.values;

  if (!Array.isArray(values) || values.length !== 768) {
    throw new Error('Gemini returned an invalid query embedding');
  }

  return values;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return res.status(503).json({ error: 'Supabase service role is not configured', source: 'not_configured' });
    }

    const { action, userId, roomKey = null, text = '', importance = 1, threshold = 0.72, limit = 6 } = req.body || {};

    if (!action || !userId) {
      return res.status(400).json({ error: 'action and userId are required' });
    }

    if (action === 'remember') {
      if (!text.trim()) return res.status(400).json({ error: 'text is required' });

      const embedding = await generateEmbedding(text.trim());

      const { data, error } = await supabase
        .from('ai_memories')
        .insert({
          user_id: userId,
          room_key: roomKey,
          memory: text.trim().slice(0, 500),
          source_message: text.trim(),
          importance,
          embedding,
          embedding_model: GEMINI_EMBEDDING_MODEL
        })
        .select('*')
        .single();

      if (error) throw error;

      return res.status(200).json({ memory: data, source: 'gemini_embedding' });
    }

    if (action === 'search') {
      if (!text.trim()) return res.status(400).json({ error: 'text is required' });

      const embedding = await generateQueryEmbedding(text.trim());

      const { data, error } = await supabase.rpc('match_ai_memories', {
        query_embedding: embedding,
        match_threshold: threshold,
        match_count: limit,
        target_user_id: userId,
        target_room_key: roomKey
      });

      if (error) throw error;

      return res.status(200).json({ memories: data || [], source: 'pgvector' });
    }

    return res.status(400).json({ error: 'Unsupported memory action' });
  } catch (error) {
    console.error('Memory API error:', error.message);
    return res.status(500).json({ error: error.message || 'Memory API failed', source: 'memory_api' });
  }
}
