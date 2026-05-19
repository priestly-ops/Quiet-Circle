export const rooms = [
  { id: '2am', icon: '🌙', name: '2 AM Thoughts', theme: 'Loneliness', members: 1, desc: 'For heavy thoughts that show up late at night.', aiName: 'Night Willow' },
  { id: 'exam', icon: '📚', name: 'Exam Pressure', theme: 'Stress', members: 1, desc: 'A quiet room for students under pressure.', aiName: 'Study Sage' },
  { id: 'work', icon: '☕', name: 'Corporate Burnout', theme: 'Work', members: 1, desc: 'Talk through work stress without judgment.', aiName: 'Soft Anchor' },
  { id: 'healing', icon: '🌱', name: 'Breakup Healing', theme: 'Healing', members: 1, desc: 'A softer place for moving forward slowly.', aiName: 'Green Finch' }
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
  { from: 'Quiet Circle', text: "Hi, I'm here with you. What feels heavy today?" }
];

export const defaultRoomMessages = {
  '2am': [{ user: 'Night Willow', text: 'I’m here for a bit. No rush to say it perfectly.' }],
  exam: [{ user: 'Study Sage', text: 'One page, one breath, one small step. That counts.' }],
  work: [{ user: 'Soft Anchor', text: 'Burnout makes even small things feel heavy. I’m listening.' }],
  healing: [{ user: 'Green Finch', text: 'Healing is not linear. Today can be messy and still count.' }]
};

export const DEMO_PROFILE_ID = '00000000-0000-0000-0000-000000000001';
