import { classifySafety, shouldAiIntervene } from '../utils/moderation';

export function emotionalTemperature(text = '') {
  const safety = classifySafety(text);

  if (safety.severity === 'critical') return { level: 'critical', score: 100, safety };
  if (safety.severity === 'high') return { level: 'high', score: 80, safety };
  if (safety.action === 'grounding_prompt') return { level: 'medium', score: 60, safety };

  const lower = text.toLowerCase();
  const mediumTerms = ['stress', 'anxious', 'lonely', 'sad', 'cry', 'overthink', 'burnout'];
  const score = mediumTerms.some(term => lower.includes(term)) ? 45 : 20;

  return {
    level: score >= 45 ? 'medium' : 'low',
    score,
    safety
  };
}

export function decideAiIntervention({ text, roomMessages = [], hasOtherPeople = false, lastAiAt = 0 }) {
  const temperature = emotionalTemperature(text);
  const shouldRespond = shouldAiIntervene({
    roomMessages,
    safety: temperature.safety,
    hasOtherPeople,
    lastAiAt
  });

  if (!shouldRespond && hasOtherPeople) {
    return {
      mode: 'passive_observe',
      shouldRespond: false,
      reason: 'human_priority',
      temperature
    };
  }

  if (temperature.level === 'critical') {
    return {
      mode: 'safety_escalation',
      shouldRespond: true,
      reason: 'critical_safety',
      temperature
    };
  }

  if (temperature.level === 'high' || temperature.safety.action === 'grounding_prompt') {
    return {
      mode: 'grounding_support',
      shouldRespond: true,
      reason: temperature.safety.reason,
      temperature
    };
  }

  return {
    mode: shouldRespond ? 'gentle_support' : 'passive_observe',
    shouldRespond,
    reason: shouldRespond ? 'room_needs_support' : 'human_priority',
    temperature
  };
}
