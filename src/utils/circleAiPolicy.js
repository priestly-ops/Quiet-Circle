import { classifySafety } from './moderation';

function directlyAsksAi(text = '') {
  return /(?:@ai|@karan|quiet circle|karan|ai\b|help me|any advice|what should i do|can you help|please respond)/i.test(text);
}

export function shouldAiReplyInCircle({ text, hasOtherPeople }) {
  const safety = classifySafety(text);

  // Safety overrides everything.
  if (safety.action !== 'allow') {
    return true;
  }

  // When humans are present, AI should not interrupt normal conversation.
  // But it should still respond when someone directly asks for help.
  if (hasOtherPeople) {
    return directlyAsksAi(text);
  }

  // AI accompanies solo users.
  return true;
}
