import { getRankedMemories, saveAiMemory } from './aiMemoryService';

async function callMemoryApi(payload) {
  const response = await fetch('/api/memory', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Memory request failed');
  }

  return response.json();
}

export async function rememberWithEmbeddings({ userId, roomKey, text, importance = 1 }) {
  try {
    return await callMemoryApi({
      action: 'remember',
      userId,
      roomKey,
      text,
      importance
    });
  } catch (error) {
    console.warn('Falling back to local semantic memory:', error.message);

    await saveAiMemory({
      userId,
      roomKey,
      memory: text,
      sourceMessage: text,
      importance
    });

    return {
      source: 'fallback_keyword_memory'
    };
  }
}

export async function searchEmotionalMemories({ userId, roomKey, text, limit = 6 }) {
  try {
    const result = await callMemoryApi({
      action: 'search',
      userId,
      roomKey,
      text,
      limit
    });

    return result.memories || [];
  } catch (error) {
    console.warn('Falling back to local ranked memories:', error.message);

    return getRankedMemories({
      userId,
      roomKey,
      input: text,
      limit
    });
  }
}
