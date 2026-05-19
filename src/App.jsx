import { useMemo, useState } from 'react';
import { isSupabaseConfigured, supabase } from './lib/supabase';

const rooms = [
  { id: 1, name: '2 AM Thoughts', theme: 'Loneliness', members: 6, desc: 'For heavy thoughts that show up late at night.' },
  { id: 2, name: 'Exam Pressure', theme: 'Stress', members: 4, desc: 'A quiet room for students under pressure.' },
  { id: 3, name: 'Corporate Burnout', theme: 'Work', members: 8, desc: 'Talk through work stress without judgment.' },
  { id: 4, name: 'Breakup Healing', theme: 'Healing', members: 5, desc: 'A softer place for moving forward slowly.' }
];

const crisisResources = [
  { name: 'Emergency Services', phone: '911', desc: 'Call immediately if you or someone else is in danger.' },
  { name: '988 Suicide & Crisis Lifeline', phone: '988', desc: '24/7 confidential support in the United States.' },
  { name: 'Crisis Text Line', phone: 'Text HOME to 741741', desc: 'Free crisis support by text.' }
];

const starterMessages = [{ from: 'Quiet Circle', text: "Hi, I'm here with you. What feels heavy today?" }];
const DEMO_PROFILE_ID = '00000000-0000-0000-0000-000000000001';

function getSaved(key, fallback) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [active, setActive] = useState('dashboard');
  const [cloudStatus, setCloudStatus] = useState(isSupabaseConfigured ? 'Cloud ready' : 'Local demo mode');
  const [profile, setProfile] = useState(() => getSaved('qc_profile', { name: 'Moon Listener', age: '18-24', intent: 'both', persona: 'supportive_friend' }));
  const [moodScore, setMoodScore] = useState(6);
  const [moodNote, setMoodNote] = useState('');
  const [moods, setMoods] = useState(() => getSaved('qc_moods', []));
  const [journalText, setJournalText] = useState('');
  const [journals, setJournals] = useState(() => getSaved('qc_journals', []));
  const [messages, setMessages] = useState(() => getSaved('qc_messages', starterMessages));
  const [chatInput, setChatInput] = useState('');
  const [roomMessages, setRoomMessages] = useState(() => getSaved('qc_room_messages', [
    { user: 'Calm Star', text: 'Today was a lot, but I am trying to breathe through it.' },
    { user: 'Quiet Leaf', text: 'You are not alone here.' }
  ]));
  const [roomInput, setRoomInput] = useState('');
  const [reports, setReports] = useState(() => getSaved('qc_reports', []));
  const [feedback, setFeedback] = useState('');

  const averageMood = useMemo(() => {
    if (!moods.length) return 'No check-ins yet';
    return (moods.reduce((sum, item) => sum + item.score, 0) / moods.length).toFixed(1);
  }, [moods]);

  async function saveProfile(next) {
    setProfile(next);
    localStorage.setItem('qc_profile', JSON.stringify(next));
    if (isSupabaseConfigured) {
      await supabase.from('profiles').upsert({ id: DEMO_PROFILE_ID, display_name: next.name, age_range: next.age, support_preference: next.intent, ai_persona: next.persona });
      setCloudStatus('Profile synced to Supabase');
    }
  }

  async function addMood() {
    const entry = { score: Number(moodScore), note: moodNote || 'No note', at: new Date().toLocaleString() };
    const next = [entry, ...moods];
    setMoods(next);
    localStorage.setItem('qc_moods', JSON.stringify(next));
    if (isSupabaseConfigured) {
      await supabase.from('mood_checkins').insert({ profile_id: DEMO_PROFILE_ID, mood_score: entry.score, note: entry.note });
      setCloudStatus('Mood saved to Supabase');
    }
    setMoodNote('');
  }

  async function saveJournal() {
    if (!journalText.trim()) return;
    const entry = { text: journalText.trim(), at: new Date().toLocaleString(), mood: Number(moodScore) };
    const next = [entry, ...journals];
    setJournals(next);
    localStorage.setItem('qc_journals', JSON.stringify(next));
    if (isSupabaseConfigured) {
      await supabase.from('journal_entries').insert({ profile_id: DEMO_PROFILE_ID, content: entry.text, mood_score: entry.mood });
      setCloudStatus('Journal saved to Supabase');
    }
    setJournalText('');
  }

  function sendCompanionMessage() {
    if (!chatInput.trim()) return;
    const userMsg = { from: 'You', text: chatInput.trim() };
    const botMsg = { from: 'Quiet Circle', text: 'Thank you for trusting this space. Try naming the feeling, taking one slow breath, and choosing one tiny next step. If you are in danger, please contact emergency support now.' };
    const next = [...messages, userMsg, botMsg];
    setMessages(next);
    localStorage.setItem('qc_messages', JSON.stringify(next));
    setChatInput('');
  }

  async function sendRoomMessage() {
    if (!roomInput.trim()) return;
    const msg = { user: profile.name || 'Anonymous', text: roomInput.trim() };
    const next = [...roomMessages, msg];
    setRoomMessages(next);
    localStorage.setItem('qc_room_messages', JSON.stringify(next));
    if (isSupabaseConfigured) {
      await supabase.from('room_messages').insert({ display_name: msg.user, message: msg.text });
      setCloudStatus('Room message synced to Supabase');
    }
    setRoomInput('');
  }

  async function reportContent(type, text) {
    const report = { type, text, status: 'pending', at: new Date().toLocaleString() };
    const next = [report, ...reports];
    setReports(next);
    localStorage.setItem('qc_reports', JSON.stringify(next));
    if (isSupabaseConfigured) {
      await supabase.from('moderation_reports').insert({ report_type: type, content: text, status: 'pending' });
      setCloudStatus('Report sent to Supabase');
    }
    alert('Report submitted for admin review.');
  }

  function submitFeedback() {
    if (!feedback.trim()) return;
    alert('Thank you. Your beta feedback was saved locally for this MVP.');
    setFeedback('');
  }

  const nav = [['dashboard', 'Dashboard'], ['profile', 'Profile'], ['mood', 'Mood'], ['journal', 'Journal'], ['companion', 'AI Companion'], ['rooms', 'Rooms'], ['crisis', 'Crisis Help'], ['admin', 'Admin']];

  return (
    <div className="appShell">
      <aside className="sidebar"><div className="brand"><div className="logo">QC</div><div><h1>Quiet Circle</h1><p>Private mental wellness MVP</p></div></div><nav>{nav.map(([id, label]) => <button key={id} className={active === id ? 'nav active' : 'nav'} onClick={() => setActive(id)}>{label}</button>)}</nav><div className="safetyBox">{cloudStatus}<br />Not medical care. If you are in immediate danger, call emergency services.</div></aside>
      <main className="main">
        {active === 'dashboard' && <section className="page"><div className="heroPanel"><p className="eyebrow">Welcome back, {profile.name}</p><h2>A calmer place to pause, reflect, and feel heard.</h2><p>Track your mood, journal privately, talk with a supportive companion, and enter anonymous support circles.</p></div><div className="statsGrid"><div className="stat"><span>{averageMood}</span><p>Average mood</p></div><div className="stat"><span>{journals.length}</span><p>Journal entries</p></div><div className="stat"><span>{reports.length}</span><p>Reports pending</p></div><div className="stat"><span>{roomMessages.length}</span><p>Room messages</p></div></div><div className="grid two"><div className="card"><h3>Today’s gentle prompt</h3><p>What is one thing you wish someone understood about your day?</p><button onClick={() => setActive('journal')}>Write now</button></div><div className="card"><h3>Suggested room</h3><p>2 AM Thoughts — a soft space for late-night emotions.</p><button onClick={() => setActive('rooms')}>Join room</button></div></div></section>}
        {active === 'profile' && <section className="page card wide"><h2>Anonymous Profile</h2><label>Display name<input value={profile.name} onChange={e => saveProfile({ ...profile, name: e.target.value })} /></label><label>Age range<select value={profile.age} onChange={e => saveProfile({ ...profile, age: e.target.value })}><option>18-24</option><option>25-34</option><option>35-44</option><option>45+</option></select></label><label>Support preference<select value={profile.intent} onChange={e => saveProfile({ ...profile, intent: e.target.value })}><option value="listener">Listener</option><option value="sharer">Sharer</option><option value="both">Both</option></select></label><label>AI persona<select value={profile.persona} onChange={e => saveProfile({ ...profile, persona: e.target.value })}><option value="supportive_friend">Supportive Friend</option><option value="calm_listener">Calm Listener</option><option value="motivator">Motivator</option><option value="wise_elder">Wise Elder</option></select></label></section>}
        {active === 'mood' && <section className="page card wide"><h2>Mood Check-In</h2><label>Mood score: {moodScore}/10<input type="range" min="1" max="10" value={moodScore} onChange={e => setMoodScore(e.target.value)} /></label><textarea value={moodNote} onChange={e => setMoodNote(e.target.value)} placeholder="Optional note about what you are feeling..." /><button onClick={addMood}>Save Check-In</button><div className="list">{moods.map((m, i) => <div className="listItem" key={i}><strong>{m.score}/10</strong><p>{m.note}</p><small>{m.at}</small></div>)}</div></section>}
        {active === 'journal' && <section className="page card wide"><h2>Private Journal</h2><textarea className="largeText" value={journalText} onChange={e => setJournalText(e.target.value)} placeholder="Write privately. This MVP stores entries in your browser and syncs to Supabase when configured." /><button onClick={saveJournal}>Save Journal</button><div className="list">{journals.map((j, i) => <div className="listItem" key={i}><p>{j.text}</p><small>{j.at} · Mood {j.mood}/10</small></div>)}</div></section>}
        {active === 'companion' && <section className="page card wide"><h2>AI Companion</h2><p className="muted">MVP supportive companion. Real AI can be connected later using Gemini/OpenAI/Claude.</p><div className="chatWindow">{messages.map((m, i) => <div key={i} className={m.from === 'You' ? 'msg user' : 'msg bot'}><strong>{m.from}</strong><p>{m.text}</p></div>)}</div><div className="composer"><input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Share what is on your mind..." onKeyDown={e => e.key === 'Enter' && sendCompanionMessage()} /><button onClick={sendCompanionMessage}>Send</button></div></section>}
        {active === 'rooms' && <section className="page"><h2>Support Rooms</h2><div className="grid two">{rooms.map(r => <div className="card" key={r.id}><div className="roomTop"><h3>{r.name}</h3><span>{r.members}/8</span></div><p>{r.desc}</p><small>{r.theme}</small></div>)}</div><div className="card wide"><h3>Room Chat</h3><div className="chatWindow">{roomMessages.map((m, i) => <div className="msg bot" key={i}><strong>{m.user}</strong><p>{m.text}</p><button className="linkBtn" onClick={() => reportContent('message', m.text)}>Report</button></div>)}</div><div className="composer"><input value={roomInput} onChange={e => setRoomInput(e.target.value)} placeholder="Send a kind message..." onKeyDown={e => e.key === 'Enter' && sendRoomMessage()} /><button onClick={sendRoomMessage}>Send</button></div></div></section>}
        {active === 'crisis' && <section className="page"><div className="danger"><h2>Need immediate help?</h2><p>If there is immediate danger, call emergency services now. Quiet Circle is not a replacement for professional care.</p></div><div className="grid two">{crisisResources.map((r, i) => <div className="card" key={i}><h3>{r.name}</h3><h2>{r.phone}</h2><p>{r.desc}</p></div>)}</div></section>}
        {active === 'admin' && <section className="page card wide"><h2>Admin Moderation</h2><div className="statsGrid"><div className="stat"><span>{reports.length}</span><p>Total reports</p></div><div className="stat"><span>{moods.length}</span><p>Mood logs</p></div><div className="stat"><span>{journals.length}</span><p>Journals</p></div></div><div className="list">{reports.length ? reports.map((r, i) => <div className="listItem" key={i}><strong>{r.type}</strong><p>{r.text}</p><small>{r.status} · {r.at}</small></div>) : <p>No reports yet.</p>}</div><h3>Beta Feedback</h3><textarea value={feedback} onChange={e => setFeedback(e.target.value)} placeholder="Add tester feedback or notes..." /><button onClick={submitFeedback}>Save Feedback</button></section>}
        <footer>Quiet Circle MVP · Live Beta · Supabase-ready cloud persistence</footer>
      </main>
    </div>
  );
}
