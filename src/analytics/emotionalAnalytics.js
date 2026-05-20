export function calculateMoodTrend(moods = []) {
  if (moods.length < 2) {
    return {
      direction: 'stable',
      delta: 0
    };
  }

  const latest = moods[0]?.score || 0;
  const previous = moods[1]?.score || 0;
  const delta = latest - previous;

  if (delta > 1) {
    return {
      direction: 'improving',
      delta
    };
  }

  if (delta < -1) {
    return {
      direction: 'declining',
      delta
    };
  }

  return {
    direction: 'stable',
    delta
  };
}

export function emotionalConsistency(moods = []) {
  if (!moods.length) return 0;

  const scores = moods.map(m => Number(m.score || 0));
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

  const variance = scores.reduce((sum, value) => sum + Math.pow(value - avg, 2), 0) / scores.length;

  return Math.max(0, Math.round(100 - variance * 10));
}

export function emotionalSummary(moods = []) {
  const trend = calculateMoodTrend(moods);
  const consistency = emotionalConsistency(moods);

  if (trend.direction === 'improving') {
    return 'Your emotional energy has been slowly improving lately.';
  }

  if (trend.direction === 'declining') {
    return 'Things may feel heavier recently. Small steps still matter.';
  }

  if (consistency > 70) {
    return 'Your emotional rhythm has been relatively steady.';
  }

  return 'Your emotions have been shifting a lot lately. That can be exhausting.';
}
