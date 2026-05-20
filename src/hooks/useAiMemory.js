import { useCallback, useEffect, useState } from 'react';
import {
  getRankedMemories,
  saveAiMemory,
  summarizeMemoryCandidate
} from '../services/aiMemoryService';

export default function useAiMemory({ userId, roomKey }) {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(false);

  const refreshMemories = useCallback(async (input = '') => {
    if (!userId) return [];

    setLoading(true);

    try {
      const ranked = await getRankedMemories({
        userId,
        roomKey,
        input,
        limit: 6
      });

      setMemories(ranked);
      return ranked;
    } finally {
      setLoading(false);
    }
  }, [userId, roomKey]);

  const remember = useCallback(async ({ text, importance = 1 }) => {
    const memory = summarizeMemoryCandidate(text);

    if (!memory || !userId) return null;

    await saveAiMemory({
      userId,
      roomKey,
      memory,
      sourceMessage: text,
      importance
    });

    return refreshMemories(text);
  }, [userId, roomKey, refreshMemories]);

  useEffect(() => {
    refreshMemories();
  }, [refreshMemories]);

  return {
    memories,
    loading,
    remember,
    refreshMemories
  };
}
