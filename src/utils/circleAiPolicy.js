import { classifySafety } from './moderation';

export function shouldAiReplyInCircle({ text, hasOtherPeople }) {
  const safety = classifySafety(text);

  if (safety.action !== 'allow') {
    return true;
  }

  return !hasOtherPeople;
}
