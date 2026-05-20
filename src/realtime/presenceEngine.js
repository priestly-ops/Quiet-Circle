export function summarizePresence(members = []) {
  const total = members.length;

  if (total <= 1) {
    return {
      total,
      label: 'You are the first one here.',
      energy: 'quiet'
    };
  }

  if (total <= 3) {
    return {
      total,
      label: `${total} people are listening right now.`,
      energy: 'soft'
    };
  }

  return {
    total,
    label: `${total} people are active in this circle.`,
    energy: 'active'
  };
}

export function silenceDuration(messages = []) {
  if (!messages.length) return Infinity;

  const last = messages[messages.length - 1];
  const created = new Date(last.created_at || Date.now()).getTime();

  return Date.now() - created;
}

export function shouldTriggerAmbientPrompt(messages = []) {
  const silenceMs = silenceDuration(messages);
  return silenceMs > 4 * 60 * 1000;
}
