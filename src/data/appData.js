export const rooms = [
  { id: '2am', icon: '🌙', name: '2 AM Thoughts', theme: 'Loneliness', members: 1, desc: 'For heavy thoughts that show up late at night.', aiName: 'MoonLeaf' },
  { id: 'family', icon: '🏠', name: 'Family Pressure', theme: 'Family', members: 1, desc: 'For expectations, arguments, guilt, and feeling misunderstood at home.', aiName: 'WarmRiver' },
  { id: 'breakup', icon: '💔', name: 'Breakup Healing', theme: 'Heartbreak', members: 1, desc: 'For missing them, moving on, no-contact, and emotional relapses.', aiName: 'BlueFinch' },
  { id: 'career', icon: '💼', name: 'Career Stress', theme: 'Career', members: 1, desc: 'For job search pressure, rejection, interviews, money stress, and feeling behind.', aiName: 'KindAnchor' },
  { id: 'exam', icon: '📚', name: 'Exam Pressure', theme: 'Study', members: 1, desc: 'A quiet room for students under pressure.', aiName: 'StudySage' },
  { id: 'work', icon: '☕', name: 'Corporate Burnout', theme: 'Work', members: 1, desc: 'Talk through work stress without judgment.', aiName: 'SoftAnchor' },
  { id: 'faith', icon: '🕊️', name: 'Faith & Doubt', theme: 'Faith', members: 1, desc: 'For prayer, questions, silence, and trying to trust again.', aiName: 'GraceLantern' },
  { id: 'anxiety', icon: '🌫️', name: 'Anxiety Room', theme: 'Anxiety', members: 1, desc: 'For spiraling thoughts, overthinking, panic, and needing grounding.', aiName: 'CalmStone' },
  { id: 'friendship', icon: '🤍', name: 'Friendship Wounds', theme: 'Friends', members: 1, desc: 'For being left out, misunderstood, ghosted, or tired of pretending.', aiName: 'SilverCloud' },
  { id: 'healing', icon: '🌱', name: 'Self Healing', theme: 'Healing', members: 1, desc: 'For rebuilding yourself slowly after a hard season.', aiName: 'GreenFinch' }
];

export const crisisResources = [
  { name: 'Emergency Services', phone: '911', desc: 'Call immediately if you or someone else is in danger.' },
  { name: '988 Suicide & Crisis Lifeline', phone: '988', desc: '24/7 confidential support in the United States.' },
  { name: 'Crisis Text Line', phone: 'Text HOME to 741741', desc: 'Free crisis support by text.' }
];

export const journalPrompts = [
  'What emotion needs space today?',
  'What did you survive quietly this week?',
  'What would you say to a friend feeling this way?',
  'What is one small thing that can make the next hour gentler?'
];

export const starterMessages = [
  { from: 'Quiet Circle', text: "Hey, I’m here with you. What’s been sitting heavy on your mind?" }
];

export const defaultRoomMessages = {
  '2am': [{ user: 'MoonLeaf', text: 'Late night thoughts can get loud. I’m here — say it messy if you need to.' }],
  family: [{ user: 'WarmRiver', text: 'Family pressure hits different because it follows you home. What happened today?' }],
  breakup: [{ user: 'BlueFinch', text: 'Missing someone doesn’t mean you made the wrong choice. What part is hurting most right now?' }],
  career: [{ user: 'KindAnchor', text: 'Feeling behind is exhausting. Tell me the part you’re scared to say out loud.' }],
  exam: [{ user: 'StudySage', text: 'One page, one breath, one small step. What subject is stressing you most?' }],
  work: [{ user: 'SoftAnchor', text: 'Burnout makes tiny things feel huge. What drained you today?' }],
  faith: [{ user: 'GraceLantern', text: 'You can be honest here — even if your prayer today is just “God, I’m tired.”' }],
  anxiety: [{ user: 'CalmStone', text: 'Okay, pause with me. What thought keeps looping the loudest?' }],
  friendship: [{ user: 'SilverCloud', text: 'Being hurt by people you care about is heavy. What did they do that stayed with you?' }],
  healing: [{ user: 'GreenFinch', text: 'Healing is not a straight line. What are you trying to let go of today?' }]
};

export const DEMO_PROFILE_ID = '00000000-0000-0000-0000-000000000001';
