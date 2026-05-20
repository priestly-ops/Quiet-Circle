import { useMemo, useState } from 'react';
import { readSaved, writeSaved } from '../services/storageService';

export function useMoodData() {
  const [moodScore, setMoodScore] = useState(6);
  const [moodNote, setMoodNote] = useState('');
  const [moods, setMoods] = useState(() => readSaved('qc_moods', []));

  const averageMood = useMemo(() => (
    moods.length
      ? (moods.reduce((sum, item) => sum + item.score, 0) / moods.length).toFixed(1)
      : 'No check-ins yet'
  ), [moods]);

  const latestMood = moods[0]?.score ?? moodScore;

  async function addMood() {
    const entry = {
      score: Number(moodScore),
      note: moodNote || 'No note',
      at: new Date().toLocaleString()
    };

    const next = [entry, ...moods];
    setMoods(next);
    writeSaved('qc_moods', next);
    setMoodNote('');
  }

  return {
    moodScore,
    setMoodScore,
    moodNote,
    setMoodNote,
    moods,
    setMoods,
    averageMood,
    latestMood,
    addMood
  };
}
