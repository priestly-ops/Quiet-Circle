export const rooms = [
  { id: '2am', icon: '🌙', name: '2 AM Thoughts', theme: 'Loneliness', members: 1, desc: 'For heavy thoughts that show up late at night.', aiName: 'Karan' },
  { id: 'family', icon: '🏠', name: 'Family Pressure', theme: 'Family', members: 1, desc: 'For expectations, arguments, guilt, and feeling misunderstood at home.', aiName: 'Karan' },
  { id: 'breakup', icon: '💔', name: 'Breakup Healing', theme: 'Heartbreak', members: 1, desc: 'For missing them, moving on, no-contact, and emotional relapses.', aiName: 'Karan' },
  { id: 'career', icon: '💼', name: 'Career Stress', theme: 'Career', members: 1, desc: 'For job search pressure, rejection, interviews, money stress, and feeling behind.', aiName: 'Karan' },
  { id: 'exam', icon: '📚', name: 'Exam Pressure', theme: 'Study', members: 1, desc: 'A quiet room for students under pressure.', aiName: 'Karan' },
  { id: 'work', icon: '☕', name: 'Corporate Burnout', theme: 'Work', members: 1, desc: 'Talk through work stress without judgment.', aiName: 'Karan' },
  { id: 'faith', icon: '🕊️', name: 'Faith & Doubt', theme: 'Faith', members: 1, desc: 'For prayer, questions, silence, and trying to trust again.', aiName: 'Karan' },
  { id: 'anxiety', icon: '🌫️', name: 'Anxiety Room', theme: 'Anxiety', members: 1, desc: 'For spiraling thoughts, overthinking, panic, and needing grounding.', aiName: 'Karan' },
  { id: 'friendship', icon: '🤍', name: 'Friendship Wounds', theme: 'Friends', members: 1, desc: 'For being left out, misunderstood, ghosted, or tired of pretending.', aiName: 'Karan' },
  { id: 'healing', icon: '🌱', name: 'Self Healing', theme: 'Healing', members: 1, desc: 'For rebuilding yourself slowly after a hard season.', aiName: 'Karan' }
];

export const crisisResources = [
  { name: 'Emergency Services', phone: '911', detail: 'Call immediately if you or someone else is in danger.' },
  { name: '988 Suicide & Crisis Lifeline', phone: '988', detail: '24/7 confidential crisis support in the United States.' },
  { name: 'Crisis Text Line', phone: 'Text HOME to 741741', detail: 'Free crisis support by text message.' }
];

export const journalPrompts = [
  'What emotion needs space today?',
  'What did you survive quietly this week?',
  'What would you say to a friend feeling this way?',
  'What is one small thing that can make the next hour gentler?'
];

export const starterMessages = [];

export const defaultRoomMessages = {
  '2am': [],
  family: [],
  breakup: [],
  career: [],
  exam: [],
  work: [],
  faith: [],
  anxiety: [],
  friendship: [],
  healing: []
};

export const DEMO_PROFILE_ID = '00000000-0000-0000-0000-000000000001';
