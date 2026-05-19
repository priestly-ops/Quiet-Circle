import { useEffect, useMemo, useState } from 'react';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import { DEMO_PROFILE_ID, crisisResources, defaultRoomMessages, journalPrompts, rooms, starterMessages } from './data/appData';
import { getSaved, humanReply, isCrisisText, makeAnonName, safetyReply } from './utils/helpers';
import Sidebar from './components/Sidebar';
import RoomCard from './components/RoomCard';
import LandingPage from './pages/LandingPage';

export default function App() {
  const [session, setSession] = useState(null);
  const [entered, setEntered] = useState(() => getSaved('qc_entered', false));
  const [authMode, setAuthMode] = useState('email');
  const [email, setEmail] = useState('');
  const [authNotice, setAuthNotice] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(rooms[0]);
  const [aiTyping, setAiTyping] = useState(false);
  const [active, setActive] = useState('dashboard');
  const [cloudStatus, setCloudStatus] = useState(isSupabaseConfigured ? 'Cloud ready' : 'Local demo mode');
  const [profile, setProfile] = useState(() => getSaved('qc_profile', { name: makeAnonName(), age: '18-24', intent: 'both', persona: 'supportive_friend' }));
  const [moodScore, setMoodScore] = useState(6), [moodNote, setMoodNote] = useState('');
  const [moods, setMoods] = useState(() => getSaved('qc_moods', []));
  const [journalText, setJournalText] = useState(''), [journals, setJournals] = useState(() => getSaved('qc_journals', []));
  const [messages, setMessages] = useState(() => getSaved('qc_messages', starterMessages)), [chatInput, setChatInput] = useState('');
  const [roomMessagesById, setRoomMessagesById] = useState(() => getSaved('qc_room_messages_by_id', defaultRoomMessages));
  const [roomInput, setRoomInput] = useState(''), [reports, setReports] = useState(() => getSaved('qc_reports', [])), [feedback, setFeedback] = useState('');
  const roomMessages = roomMessagesById[selectedRoom.id] || [];
  const averageMood = useMemo(() => moods.length ? (moods.reduce((sum, item) => sum + item.score, 0) / moods.length).toFixed(1) : 'No check-ins yet', [moods]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) { setSession(data.session); setEntered(true); localStorage.setItem('qc_entered', JSON.stringify(true)); setCloudStatus('Signed in securely'); }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession) { setEntered(true); localStorage.setItem('qc_entered', JSON.stringify(true)); setCloudStatus('Signed in securely'); }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function syncProfile(next, user = session?.user, mode = authMode || 'demo') {
    if (isSupabaseConfigured) {
      await supabase.from('profiles').upsert({ id: user ? undefined : DEMO_PROFILE_ID, user_id: user?.id, email: user?.email || email || null, auth_provider: mode, display_name: next.name, age_range: next.age, support_preference: next.intent, ai_persona: next.persona });
    }
  }

  async function enterApp(mode) {
    const next = { ...profile, name: profile.name || makeAnonName() };
    setProfile(next);
    localStorage.setItem('qc_profile', JSON.stringify(next));
    if (!isSupabaseConfigured || mode === 'guest') { localStorage.setItem('qc_entered', JSON.stringify(true)); setEntered(true); setAuthMode(mode); return; }
    try {
      if (mode === 'google') { localStorage.setItem('qc_profile', JSON.stringify(next)); await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } }); return; }
      if (!email.trim()) { setAuthNotice('Enter your email first.'); return; }
      const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: window.location.origin } });
      if (error) throw error;
      await syncProfile(next, null, 'email_magic_link');
      setAuthNotice('Magic link sent. Check your email. For beta preview, you can continue as guest.');
    } catch (err) {
      setAuthNotice(err.message || 'Auth setup needs provider configuration. Continuing in beta mode.');
    }
  }

  async function signOut() { if (isSupabaseConfigured && session) await supabase.auth.signOut(); localStorage.removeItem('qc_entered'); setSession(null); setEntered(false); setCloudStatus(isSupabaseConfigured ? 'Signed out' : 'Local demo mode'); }
  async function saveProfile(next) { setProfile(next); localStorage.setItem('qc_profile', JSON.stringify(next)); if (isSupabaseConfigured) { await syncProfile(next); setCloudStatus('Profile synced to Supabase'); } }
  async function addMood() { const entry = { score: Number(moodScore), note: moodNote || 'No note', at: new Date().toLocaleString() }; const next = [entry, ...moods]; setMoods(next); localStorage.setItem('qc_moods', JSON.stringify(next)); if (isSupabaseConfigured) { await supabase.from('mood_checkins').insert({ profile_id: session ? null : DEMO_PROFILE_ID, user_id: session?.user?.id, mood_score: entry.score, note: entry.note }); setCloudStatus('Mood saved to Supabase'); } setMoodNote(''); }
  async function saveJournal() { if (!journalText.trim()) return; const entry = { text: journalText.trim(), at: new Date().toLocaleString(), mood: Number(moodScore) }; const next = [entry, ...journals]; setJournals(next); localStorage.setItem('qc_journals', JSON.stringify(next)); if (isSupabaseConfigured) { await supabase.from('journal_entries').insert({ profile_id: session ? null : DEMO_PROFILE_ID, user_id: session?.user?.id, content: entry.text, mood_score: entry.mood }); setCloudStatus('Journal saved to Supabase'); } setJournalText(''); }
  function sendCompanionMessage() { if (!chatInput.trim()) return; const userMsg = { from: 'You', text: chatInput.trim() }; const botMsg = { from: 'Quiet Circle', text: isCrisisText(chatInput) ? safetyReply() : 'I hear you. Let us make this moment smaller: take one slow breath, name the feeling, and choose one kind next step. If you are in immediate danger, please contact emergency support now.' }; const next = [...messages, userMsg, botMsg]; setMessages(next); localStorage.setItem('qc_messages', JSON.stringify(next)); setChatInput(''); if (isCrisisText(userMsg.text)) setActive('crisis'); }
  async function sendRoomMessage() { if (!roomInput.trim()) return; const userText = roomInput.trim(); const msg = { user: profile.name || 'Anonymous', text: userText }; const nextForRoom = [...roomMessages, msg]; const nextAll = { ...roomMessagesById, [selectedRoom.id]: nextForRoom }; setRoomMessagesById(nextAll); localStorage.setItem('qc_room_messages_by_id', JSON.stringify(nextAll)); setRoomInput(''); if (isSupabaseConfigured) { await supabase.from('room_messages').insert({ room_key: selectedRoom.id, user_id: session?.user?.id, display_name: msg.user, message: msg.text }); setCloudStatus('Room message synced to Supabase'); } if (isCrisisText(userText)) { setActive('crisis'); await reportContent('crisis_keyword', userText); } setAiTyping(true); setTimeout(() => { const aiMsg = { user: selectedRoom.aiName, text: humanReply(userText) }; const latest = getSaved('qc_room_messages_by_id', nextAll); const updated = { ...latest, [selectedRoom.id]: [...(latest[selectedRoom.id] || []), aiMsg] }; setRoomMessagesById(updated); localStorage.setItem('qc_room_messages_by_id', JSON.stringify(updated)); setAiTyping(false); }, 2600 + Math.floor(Math.random()*2200)); }
  async function reportContent(type, text) { const report = { type, text, status: 'pending', at: new Date().toLocaleString() }; const next = [report, ...reports]; setReports(next); localStorage.setItem('qc_reports', JSON.stringify(next)); if (isSupabaseConfigured) { await supabase.from('moderation_reports').insert({ user_id: session?.user?.id, report_type: type, content: text, status: 'pending' }); setCloudStatus('Report sent to Supabase'); } if (type !== 'crisis_keyword') alert('Report submitted for admin review.'); }
  function submitFeedback() { if (!feedback.trim()) return; alert('Thank you. Your beta feedback was saved locally for this MVP.'); setFeedback(''); }
  const nav = [['dashboard', 'Home'], ['profile', 'Profile'], ['mood', 'Mood'], ['journal', 'Journal'], ['companion', 'Companion'], ['rooms', 'Circles'], ['crisis', 'Safety'], ['admin', 'Admin']];

  if (!entered) {
    return <LandingPage profile={profile} email={email} setEmail={setEmail} authNotice={authNotice} saveProfile={saveProfile} makeAnonName={makeAnonName} enterApp={enterApp} />;
  }

  return (
    <div className="appShell">
      <Sidebar profile={profile} session={session} nav={nav} active={active} setActive={setActive} cloudStatus={cloudStatus} signOut={signOut} />
      <main className="main">
        {active === 'dashboard' && <section className="page"><div className="heroPanel"><div><p className="eyebrow">A gentle check-in space</p><h2>You do not have to carry everything alone.</h2><p>Quiet Circle helps you slow down, write honestly, and connect with calm anonymous support when life feels too loud.</p><div className="heroActions"><button onClick={() => setActive('mood')}>Check in now</button><button className="secondaryBtn" onClick={() => setActive('companion')}>Talk to companion</button></div></div><div className="breathOrb"><span>Breathe</span></div></div><div className="moodStrip"><span>🌿 Breathe</span><span>📝 Reflect</span><span>🤍 Be heard</span><span>🛟 Stay safe</span></div><div className="statsGrid"><div className="stat"><span>{averageMood}</span><p>Average mood</p></div><div className="stat"><span>{journals.length}</span><p>Journal entries</p></div><div className="stat"><span>{reports.length}</span><p>Reports pending</p></div><div className="stat"><span>{Object.values(roomMessagesById).flat().length}</span><p>Circle messages</p></div></div><div className="grid two"><div className="card featureCard"><h3>Guided reflection</h3><p>{journalPrompts[0]}</p><button onClick={() => { setJournalText(journalPrompts[0] + '\n\n'); setActive('journal'); }}>Start writing</button></div><div className="card featureCard"><h3>Suggested circle</h3><p>2 AM Thoughts — a soft space for late-night emotions.</p><button onClick={() => { setSelectedRoom(rooms[0]); setActive('rooms'); }}>Join circle</button></div></div></section>}
        {active === 'rooms' && <section className="page"><p className="eyebrow">Anonymous support circles</p><h2>Support Circles</h2><div className="grid two">{rooms.map(r => <RoomCard key={r.id} room={r} selected={selectedRoom.id === r.id} onSelect={setSelectedRoom} />)}</div><div className="card wide"><h3>{selectedRoom.icon} {selectedRoom.name}</h3><p className="muted">If no one else is active, {selectedRoom.aiName} will respond slowly like a real circle member.</p><div className="chatWindow">{roomMessages.map((m, i) => <div className={m.user === profile.name ? 'msg user' : 'msg bot'} key={i}><strong>{m.user}</strong><p>{m.text}</p><button className="linkBtn" onClick={() => reportContent('message', m.text)}>Report</button></div>)}{aiTyping && <div className="typingBubble">{selectedRoom.aiName} is typing slowly…</div>}</div><div className="composer"><input value={roomInput} onChange={e => setRoomInput(e.target.value)} placeholder={`Message ${selectedRoom.name}...`} onKeyDown={e => e.key === 'Enter' && sendRoomMessage()} /><button onClick={sendRoomMessage}>Send</button></div></div></section>}
      </main>
    </div>
  );
}
