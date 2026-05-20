export function shouldAiReplyInCircle({ text, hasOtherPeople }) {
  const safety = classifySafety(text);

  // Safety overrides everything
  if (safety.action !== 'allow') {
    return true;
  }

  // AI only accompanies solo users
  return !hasOtherPeople;
}
