import { useEffect, useMemo, useState } from 'react';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import { DEMO_PROFILE_ID, crisisResources, defaultRoomMessages, journalPrompts, rooms, starterMessages } from './data/appData';
import { getSaved, humanReply, isCrisisText, makeAnonName, safetyReply } from './utils/helpers';
import { ReactionBar } from './components/EngagementCards';
import Sidebar from './components/Sidebar';
import RoomCard from './components/RoomCard';
import LandingPage from './pages/LandingPage';
import {
  DashboardEngagement,
  MoodAuraPreview
} from './components/VisibleEngagement';

const navBase = [['dashboard','Home'],['profile','Profile'],['mood','Mood'],['journal','Journal'],['companion','Companion'],['rooms','Circles'],['crisis','Safety']];
const companionModes = [
  { id:'future', label:'Future healed self', prompt:'Speak to me like the wiser, healed version of myself.' },
  { id:'vent', label:'Just let me vent', prompt:'Listen first. No fixing unless I ask.' },
  { id:'prayer', label:'Prayer mode', prompt:'Respond with a short prayer and calm encouragement.' },
  { id:'text', label:'Text I should not send', prompt:'Help me rewrite this message safely and maturely.' }
];

const chatStorageKeys = ['qc_messages','qc_room_messages_by_id'];
const chatErrorText = 'Karan is having trouble responding right now. Please try again in a moment.';
const isDemoMode = import.meta.env.VITE_CHAT_DEMO_MODE === 'true';
const showSourceLabels = false;
const circleChatType = 'circle';
const aiChatType = 'ai';
const lockedAgeRange = 'Anonymous';
const personalInfoPatterns = [
  /\b\d{10}\b/,
  /\b(?:\+91[\s-]?)?[6-9]\d{9}\b/,
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
  /\b(?:whatsapp|phone|mobile|number|email|gmail|address|location|live in|i am from|insta|instagram|snapchat|telegram)\b/i,
  /\b(?:flat|apartment|house no|street|colony|hostel|pg|pincode|pin code)\b/i
];

function hasPersonalInfo(text = '') { return personalInfoPatterns.some(pattern => pattern.test(text)); }
function privacyReply() { return `Small privacy check, yaar — please don't share real name, phone number, email, exact location, Instagram, hostel/PG, or address here. Quiet Circle is anonymous, so keep it general and safe.`; }
function daysCheckedIn(moods) { return new Set(moods.map(item => String(item.at).split(',')[0])).size; }
function moodLabel(score) { if(score>=8) return 'peaceful sunrise'; if(score>=6) return 'cloudy but steady'; if(score>=4) return 'heavy fog'; return 'stormy thoughts'; }
function humanTypingDelay(text='') { return Math.min(5200, Math.max(1800, 900 + text.length * 28)); }
function sourceLabel(source) { return showSourceLabels && source ? ` · ${source}` : ''; }
function dashboardNudge(latestMood, streak) {
  if (streak >= 7) return 'You have been showing up for yourself all week. That matters.';
  if (latestMood >= 8) return 'Your aura feels lighter today. Save this softness.';
  if (latestMood >= 6) return 'You are steady, even if the day feels messy.';
  if (latestMood >= 4) return 'Small steps count today. No pressure to be perfect.';
  return 'Your circle is here. Start with one honest breath.';
}
function formatRoomMessage(row) {
  return { id: row.id, user: row.display_name || 'Anonymous', senderId: row.user_id || null, text: row.message || '', type: row.message_type || 'human', source: row.source || '', created_at: row.created_at };
}
function uniqueById(messages) {
  const seen = new Set();
  return messages.filter((item) => {
    const key = item.id || `${item.senderId || item.user}:${item.text}:${item.created_at || ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
function uniqueMembers(members) {
  const seen = new Set();
  return members.filter((member) => {
    const key = member.userId || member.name;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
function normalizeProfile(savedProfile) { return { ...savedProfile, name: savedProfile?.name || makeAnonName(), age: lockedAgeRange }; }

function MessageActions({ message, onReport, isBuddy }) {
  const [open, setOpen] = useState(false);
  if (isBuddy) return null;
  return (
    <div className="messageActions">
      <ReactionBar />
      <button className="iconBtn" aria-label="Message options" onClick={() => setOpen(!open)}>⋯</button>
      {open && (
        <div className="messageMenu">
          <button onClick={() => { onReport(message.text); setOpen(false); }}>Report message</button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [entered, setEntered] = useState(() => getSaved('qc_entered', false));
  const [authMode, setAuthMode] = useState('email');
  const [email, setEmail] = useState('');
  const [authNotice, setAuthNotice] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomOpen, setRoomOpen] = useState(false);
  const [roomMemberCounts, setRoomMemberCounts] = useState({});
  const [roomMembersById, setRoomMembersById] = useState({});
  const [aiTyping, setAiTyping] = useState(false);
  const [companionTyping, setCompanionTyping] = useState(false);
  const [active, setActive] = useState('dashboard');
  const [cloudStatus, setCloudStatus] = useState(isSupabaseConfigured ? 'Cloud ready' : 'Your data is saved on this device');
  const [profile, setProfile] = useState(() => normalizeProfile(getSaved('qc_profile', { name: makeAnonName(), age: lockedAgeRange, intent: 'both', persona: 'supportive_friend' })));
  const [moodScore, setMoodScore] = useState(6);
  const [moodNote, setMoodNote] = useState('');
  const [moods, setMoods] = useState(() => getSaved('qc_moods', []));
  const [journalText, setJournalText] = useState('');
  const [journals, setJournals] = useState(() => getSaved('qc_journals', []));
  const [messages, setMessages] = useState(() => getSaved('qc_messages', starterMessages));
  const [chatInput, setChatInput] = useState('');
  const [roomMessagesById, setRoomMessagesById] = useState(() => getSaved('qc_room_messages_by_id', defaultRoomMessages));
  const [roomInput, setRoomInput] = useState('');
  const [reports, setReports] = useState(() => getSaved('qc_reports', []));
  const [feedback, setFeedback] = useState('');
  const [breathing, setBreathing] = useState(false);
  const [breathStep, setBreathStep] = useState(0);
  const [companionMode, setCompanionMode] = useState(companionModes[0]);
  const [showLocalNotice, setShowLocalNotice] = useState(() => !isSupabaseConfigured && !getSaved('qc_local_notice_seen', false));
  const [theme, setTheme] = useState(() => getSaved('qc_theme', 'system'));

  const currentRoom = selectedRoom || rooms[0];
  const activeChat = roomOpen ? { type: circleChatType, id: currentRoom.id, name: currentRoom.name } : active === 'companion' ? { type: aiChatType, id: companionMode.id, name: companionMode.label } : null;
  const roomMessages = roomMessagesById[currentRoom.id] || [];
  const currentRoomMembers = roomMembersById[currentRoom.id] || [];
  const currentRoomPeople = roomOpen ? Math.max(1, currentRoomMembers.length) : 0;
  const hasOtherPeople = currentRoomPeople > 1;
  const isAdmin = profile?.role === 'admin' || session?.user?.app_metadata?.role === 'admin';
  const nav = useMemo(() => isAdmin ? [...navBase, ['admin','Admin']] : navBase, [isAdmin]);
  const allRoomMessages = Object.values(roomMessagesById).flat();
  const averageMood = useMemo(() => moods.length ? (moods.reduce((sum, item) => sum + item.score, 0) / moods.length).toFixed(1) : 'No check-ins yet', [moods]);
  const latestMood = moods[0]?.score ?? moodScore;
  const moodTrend = useMemo(() => [...moods].slice(0, 7).reverse(), [moods]);

  useEffect(() => { const locked = normalizeProfile(profile); if (locked.name !== profile.name || locked.age !== profile.age) { setProfile(locked); localStorage.setItem('qc_profile', JSON.stringify(locked)); } }, []);
  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem('qc_theme', JSON.stringify(theme)); }, [theme]);
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase.auth.getSession().then(({ data }) => { if (data.session) { setSession(data.session); setEntered(true); localStorage.setItem('qc_entered', JSON.stringify(true)); } });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => { setSession(sess); if (sess) { setEntered(true); localStorage.setItem('qc_entered', JSON.stringify(true)); } });
    return () => subscription.unsubscribe();
  }, []);
  useEffect(() => { if (!breathing) return undefined; const timer = setInterval(() => setBreathStep(step => (step + 1) % 3), 4000); return () => clearInterval(timer); }, [breathing]);
  useEffect(() => {
    if (!isSupabaseConfigured || !roomOpen || !currentRoom?.id) return undefined;
    let alive = true;
    supabase.from('room_messages').select('*').eq('room_key', currentRoom.id).order('created_at', { ascending: true }).then(({ data }) => { if (alive && data) setRoomMessagesById(prev => ({ ...prev, [currentRoom.id]: uniqueById(data.map(formatRoomMessage)) })); });
    const channel = supabase.channel(`room:${currentRoom.id}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'room_messages', filter: `room_key=eq.${currentRoom.id}` }, payload => { if (alive) setRoomMessagesById(prev => ({ ...prev, [currentRoom.id]: uniqueById([...(prev[currentRoom.id] || []), formatRoomMessage(payload.new)]) })); }).subscribe();
    return () => { alive = false; supabase.removeChannel(channel); };
  }, [roomOpen, currentRoom?.id]);
  useEffect(() => {
    if (!roomOpen || !currentRoom?.id) return undefined;
    const localName = profile.name || session?.user?.email || 'Anonymous';
    const localUserId = session?.user?.id || `local-${localName}`;
    if (!isSupabaseConfigured) { setRoomMembersById(prev => ({ ...prev, [currentRoom.id]: uniqueMembers([...(prev[currentRoom.id] || []), { userId: localUserId, name: localName }]) })); return undefined; }
    const channel = supabase.channel(`presence:${currentRoom.id}`, { config: { presence: { key: localUserId } } });
    channel.on('presence', { event: 'sync' }, () => { const state = channel.presenceState(); const members = Object.values(state).flat().map(p => ({ userId: p.userId, name: p.name })); setRoomMembersById(prev => ({ ...prev, [currentRoom.id]: uniqueMembers(members) })); }).subscribe(async status => { if (status === 'SUBSCRIBED') await channel.track({ userId: localUserId, name: localName }); });
    return () => { supabase.removeChannel(channel); };
  }, [roomOpen, currentRoom?.id]);

  async function syncProfile(next, user = session?.user, mode = authMode || 'demo') {
    if (isSupabaseConfigured) { const locked = normalizeProfile(next); await supabase.from('profiles').upsert({ id: user?.id || DEMO_PROFILE_ID, display_name: locked.name, age_range: locked.age, intent: locked.intent, persona: locked.persona, role: locked.role }); }
  }
  async function ensureCircleMembership(room = currentRoom) { if (!isSupabaseConfigured || !session?.user?.id) return true; await supabase.from('circle_members').upsert({ room_key: room.id, user_id: session.user.id, display_name: profile.name }, { onConflict: 'room_key,user_id' }); return true; }
  async function enterApp(mode) { const next = normalizeProfile({ ...profile, name: profile.name || makeAnonName() }); setProfile(next); localStorage.setItem('qc_profile', JSON.stringify(next)); if (!isSupabaseConfigured) { setEntered(true); localStorage.setItem('qc_entered', JSON.stringify(true)); return; } if (mode === 'email' && email) { setAuthNotice('Sending magic link…'); const { error } = await supabase.auth.signInWithOtp({ email }); setAuthNotice(error ? 'Could not send link. Try anonymous entry.' : 'Check your email for a magic link!'); return; } const { data, error } = await supabase.auth.signInAnonymously(); if (!error && data?.session) { setSession(data.session); await syncProfile(next, data.session.user, mode); } setEntered(true); localStorage.setItem('qc_entered', JSON.stringify(true)); }
  async function signOut() { if (isSupabaseConfigured && session) await supabase.auth.signOut(); localStorage.removeItem('qc_entered'); chatStorageKeys.forEach(key => localStorage.removeItem(key)); setSession(null); setEntered(false); setMessages([]); setRoomMessagesById(defaultRoomMessages); setChatInput(''); setRoomInput(''); setRoomOpen(false); setSelectedRoom(null); setAiTyping(false); setCompanionTyping(false); }
  async function saveProfile(next) { const locked = normalizeProfile(next); setProfile(locked); localStorage.setItem('qc_profile', JSON.stringify(locked)); if (isSupabaseConfigured) await syncProfile(locked); }
  async function addMood() { const entry = { score: Number(moodScore), note: moodNote || 'No note', at: new Date().toLocaleString() }; const next = [entry, ...moods]; setMoods(next); localStorage.setItem('qc_moods', JSON.stringify(next)); setMoodNote(''); if (isSupabaseConfigured && session?.user?.id) await supabase.from('moods').insert({ user_id: session.user.id, score: entry.score, note: entry.note }); }
  async function saveJournal() { if (!journalText.trim()) return; if (hasPersonalInfo(journalText)) { alert(privacyReply()); return; } const entry = { text: journalText.trim(), at: new Date().toLocaleString(), mood: moodScore }; const next = [entry, ...journals]; setJournals(next); localStorage.setItem('qc_journals', JSON.stringify(next)); setJournalText(''); if (isSupabaseConfigured && session?.user?.id) await supabase.from('journals').insert({ user_id: session.user.id, text: entry.text, mood_score: entry.mood }); }
  async function openRoom(room) { setSelectedRoom(room); setRoomOpen(true); await ensureCircleMembership(room); }
  function backToRooms() { setRoomOpen(false); setRoomInput(''); setAiTyping(false); }
  function changeActive(id) { setActive(id); if (id !== 'rooms') setRoomOpen(false); }
  function dismissLocalNotice() { localStorage.setItem('qc_local_notice_seen', JSON.stringify(true)); setShowLocalNotice(false); }
  function submitFeedback() { if (!feedback.trim()) return; alert('Thank you. Your beta feedback was saved locally for this MVP.'); setFeedback(''); }

  async function getAgentReply(userText, room = currentRoom, recent = roomMessages) {
    if (hasPersonalInfo(userText)) return { text: privacyReply(), source: 'privacy' };
    try { const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: userText, roomName: room.name, roomTheme: room.theme, recentMessages: recent.slice(-6) }) }); const data = await response.json().catch(() => ({})); if (!response.ok || !data.reply) throw new Error(chatErrorText); return { text: data.reply, source: data.source || 'unknown' }; } catch { return { text: humanReply(userText, room), source: 'local' }; }
  }
  async function sendCompanionMessage() {
    if (!chatInput.trim() || companionTyping) return;
    const userText = chatInput.trim();
    if (hasPersonalInfo(userText)) { const warning = { from: 'Quiet Circle', text: privacyReply(), type: 'system', id: Date.now() }; setMessages(prev => [...prev, { from: 'user', text: userText, id: Date.now() - 1 }, warning]); setChatInput(''); return; }
    if (isCrisisText(userText)) { const safeMsg = { from: 'Quiet Circle', text: safetyReply(), type: 'system', id: Date.now() }; setMessages(prev => [...prev, { from: 'user', text: userText, id: Date.now() - 1 }, safeMsg]); setChatInput(''); return; }
    const userMsg = { from: 'user', text: userText, id: Date.now() }; setMessages(prev => [...prev, userMsg]); setChatInput(''); setCompanionTyping(true); await new Promise(r => setTimeout(r, humanTypingDelay(userText)));
    try { const response = await fetch('/api/companion', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: userText, mode: companionMode.id, modePrompt: companionMode.prompt, history: messages.slice(-10) }) }); const data = await response.json().catch(() => ({})); const replyMsg = { from: 'Quiet Circle', text: (data.reply || humanReply(userText)) + sourceLabel(data.source), type: 'ai', id: Date.now() }; setMessages(prev => [...prev, replyMsg]); localStorage.setItem('qc_messages', JSON.stringify([...messages, userMsg, replyMsg])); } catch { setMessages(prev => [...prev, { from: 'Quiet Circle', text: humanReply(userText), type: 'ai', id: Date.now() }]); } finally { setCompanionTyping(false); }
  }
  async function sendRoomMessage() {
    if (!roomInput.trim() || aiTyping) return;
    const userText = roomInput.trim();
    if (hasPersonalInfo(userText)) { alert(privacyReply()); setRoomInput(''); return; }
    const senderName = profile.name || 'Anonymous'; const senderId = session?.user?.id || `local-${senderName}`;
    const userMsg = { id: `local-${Date.now()}`, user: senderName, senderId, text: userText, type: 'human', source: '', created_at: new Date().toISOString() };
    setRoomMessagesById(prev => ({ ...prev, [currentRoom.id]: uniqueById([...(prev[currentRoom.id] || []), userMsg]) })); setRoomInput('');
    if (isSupabaseConfigured && session?.user?.id) await supabase.from('room_messages').insert({ room_key: currentRoom.id, user_id: session.user.id, display_name: senderName, message: userText, message_type: 'human' }); else localStorage.setItem('qc_room_messages_by_id', JSON.stringify({ ...roomMessagesById, [currentRoom.id]: uniqueById([...(roomMessagesById[currentRoom.id] || []), userMsg]) }));
    setAiTyping(true); await new Promise(r => setTimeout(r, humanTypingDelay(userText)));
    try { const { text: agentText, source } = await getAgentReply(userText); const agentMsg = { id: `agent-${Date.now()}`, user: 'Quiet Circle', senderId: 'agent', text: agentText + sourceLabel(source), type: 'ai', source, created_at: new Date().toISOString() }; setRoomMessagesById(prev => ({ ...prev, [currentRoom.id]: uniqueById([...(prev[currentRoom.id] || []), agentMsg]) })); if (isSupabaseConfigured && session?.user?.id) await supabase.from('room_messages').insert({ room_key: currentRoom.id, user_id: 'agent', display_name: 'Quiet Circle', message: agentText, message_type: 'ai', source }); } finally { setAiTyping(false); }
  }
  async function reportContent(type, text) { const report = { type, text, status: 'pending', at: new Date().toLocaleString() }; const next = [report, ...reports]; setReports(next); localStorage.setItem('qc_reports', JSON.stringify(next)); if (isSupabaseConfigured && session?.user?.id) await supabase.from('reports').insert({ reporter_id: session.user.id, content_type: type, content_text: text }); alert('Thank you — this message has been flagged for review.'); }

  if (!entered) return <LandingPage profile={profile} email={email} setEmail={setEmail} authNotice={authNotice} saveProfile={saveProfile} makeAnonName={makeAnonName} enterApp={enterApp} />;

  return (
    <div className="appShell">
      <Sidebar profile={profile} session={session} nav={nav} active={active} setActive={changeActive} cloudStatus={cloudStatus} signOut={signOut} theme={theme} setTheme={setTheme} />
      <main className="mainContent">
        {showLocalNotice && <div className="noticeBanner"><strong>Your entries are private to this device right now.</strong><span> Sign in later to sync across devices. Clearing this browser can remove your data.</span><button onClick={dismissLocalNotice}>Dismiss</button></div>}
        {active === 'dashboard' && (
          <section className="page dashboardPage">
            <div className="heroPanel dashboardHero">
              <div>
                <p className="eyebrow">Anonymous Indian emotional reset space</p>
                <h2>You do not have to carry everything alone.</h2>
                <p className="muted">Welcome back, {profile.name}. {dashboardNudge(latestMood, daysCheckedIn(moods))}</p>
                <div className="heroActions"><button className="btn primary" onClick={() => setActive('mood')}>Drop today’s vibe</button><button className="secondaryBtn" onClick={() => setActive('companion')}>Talk to companion</button></div>
              </div>
              <div className="floatingAuraPill"><span>✦</span><strong>{moodLabel(latestMood)}</strong><small>current aura</small></div>
            </div>
            <div className="grid two statsGridV2">
              <div className="card statCard primaryStat"><span className="statIcon">🌦️</span><h3>Your emotional weather</h3><p className="bigStat">{averageMood !== 'No check-ins yet' ? `${averageMood}/10` : averageMood}</p><p className="muted">Average mood · {moods.length} check-ins</p></div>
              <div className="card statCard"><span className="statIcon">🔥</span><h3>Days checked in</h3><p className="bigStat">{daysCheckedIn(moods)}</p><p className="muted">Unique days with a mood entry</p></div>
              <div className="card statCard"><span className="statIcon">📝</span><h3>Journal entries</h3><p className="bigStat">{journals.length}</p><p className="muted">Private thoughts saved</p></div>
              <div className="card statCard"><span className="statIcon">💬</span><h3>Circle messages</h3><p className="bigStat">{allRoomMessages.filter(m => m.type === 'human').length}</p><p className="muted">From you across all circles</p></div>
            </div>
            <DashboardEngagement streak={daysCheckedIn(moods)} latestMood={latestMood} />
          </section>
        )}

        {active === 'profile' && (<section className="page"><p className="eyebrow">Anonymous profile</p><h2>Your Quiet Circle identity</h2><div className="grid two"><div className="card"><h3>Locked for safety</h3><p><strong>Name:</strong> {profile.name}</p><p><strong>Age range:</strong> {profile.age}</p><p className="muted">Your identity is always anonymous. Age is hidden to protect privacy.</p></div><div className="card"><h3>Personalise</h3><label>Display name<input value={profile.name} onChange={e => saveProfile({ ...profile, name: e.target.value })} placeholder="Anonymous name" /></label><label>Companion persona<select value={profile.persona} onChange={e => saveProfile({ ...profile, persona: e.target.value })}><option value="supportive_friend">Supportive friend</option><option value="therapist">Calm therapist</option><option value="elder">Wise elder</option></select></label></div></div></section>)}
        {active === 'mood' && (<section className="page"><p className="eyebrow">30-second check-in</p><h2>How is your heart today?</h2><div className="grid two moodGrid"><div className="card moodInputCard"><label>Mood score: {moodScore} — <em>{moodLabel(moodScore)}</em><input type="range" min="1" max="10" value={moodScore} onChange={e => setMoodScore(Number(e.target.value))} /></label><label>Optional note<textarea value={moodNote} onChange={e => setMoodNote(e.target.value)} placeholder="What's going on?" /></label><button className="btn primary" onClick={addMood}>Save check-in</button></div><MoodAuraPreview moodScore={moodScore} /><div className="card recentWeatherCard"><h3>Recent emotional weather</h3>{moodTrend.length === 0 ? <p className="muted">No check-ins yet.</p> : moodTrend.map((m, i) => <div key={i} className="moodRow"><span className="moodScore">{m.score}/10</span><span className="moodNote">{m.note}</span><span className="moodAt muted">{m.at}</span></div>)}</div></div></section>)}
        {active === 'journal' && (<section className="page"><p className="eyebrow">Private journal</p><h2>Write what you cannot say out loud.</h2><div className="grid two"><div className="card"><div className="promptRow">{journalPrompts && journalPrompts.slice(0, 3).map((p, i) => <button key={i} className="promptChip" onClick={() => setJournalText(p)}>{p}</button>)}</div><textarea value={journalText} onChange={e => setJournalText(e.target.value)} placeholder="Start writing…" rows={8} /><button className="btn primary" onClick={saveJournal}>Save entry</button></div><div className="card"><h3>Past entries</h3>{journals.length === 0 ? <p className="muted">Nothing saved yet.</p> : journals.map((j, i) => <div key={i} className="journalEntry"><p>{j.text.slice(0, 120)}{j.text.length > 120 ? '…' : ''}</p><span className="muted">{j.at}</span></div>)}</div></div></section>)}
        {active === 'companion' && (<section className="page"><p className="eyebrow">Private companion</p><h2>Talk to Quiet Circle.</h2><div className="grid two"><div className="card"><h3>Choose the mode that fits right now</h3><div className="modeGrid">{companionModes.map(m => <button key={m.id} className={`modeBtn ${companionMode.id === m.id ? 'active' : ''}`} onClick={() => setCompanionMode(m)}>{m.label}</button>)}</div><p className="muted">{companionMode.prompt}</p></div><div className="card circleChatCard"><div className="chatWindow companionChat">{messages.map((m, i) => <div key={m.id || i} className={`msg ${m.from === 'user' ? 'user' : 'bot'}`}><strong>{m.from}</strong><p>{m.text}</p></div>)}{companionTyping && <div className="typingBubble">Quiet Circle is typing softly…</div>}</div><div className="composer"><input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendCompanionMessage()} placeholder="Say what you cannot say outside…" /><button onClick={sendCompanionMessage}>Send</button></div></div></div></section>)}
        {active === 'rooms' && !roomOpen && (<section className="page"><p className="eyebrow">Anonymous circles</p><h2>Find the room that fits your emotional weather.</h2><div className="grid circleGrid">{rooms.map(room => <RoomCard key={room.id} room={room} memberCount={roomMemberCounts[room.id]} onOpen={() => openRoom(room)} />)}</div></section>)}
        {active === 'rooms' && roomOpen && (<section className="page"><button className="secondaryBtn" onClick={backToRooms}>← Back to circles</button><div className="card circleChatCard"><div className="chatHeader"><div><p className="eyebrow">{currentRoom.theme}</p><h2>{currentRoom.name}</h2><p className="muted">{hasOtherPeople ? `${currentRoomPeople} people are here` : 'You are the first one here. Quiet Circle will stay with you.'}</p></div></div><div className="chatWindow">{roomMessages.map((m, i) => <div key={m.id || i} className={`msg ${m.senderId === (session?.user?.id || `local-${profile.name}`) ? 'user' : 'bot'}`}><strong>{m.user}</strong><p>{m.text}</p><MessageActions message={m} onReport={(text) => reportContent('room_message', text)} isBuddy={m.type === 'ai'} /></div>)}{aiTyping && <div className="typingBubble">Quiet Circle is holding space…</div>}</div><div className="composer"><input value={roomInput} onChange={e => setRoomInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendRoomMessage()} placeholder="Share anonymously…" /><button onClick={sendRoomMessage}>Send</button></div></div></section>)}
        {active === 'crisis' && (<section className="page"><p className="eyebrow">Safety first</p><h2>You deserve immediate support.</h2><div className="danger"><h3>If you might hurt yourself or someone else</h3><p>Call emergency services now or contact a crisis line in your country. Quiet Circle is not emergency care.</p></div><div className="grid two">{crisisResources.map((r, i) => <div key={i} className="card"><h3>{r.name}</h3><p>{r.detail}</p></div>)}</div></section>)}
        {active === 'admin' && isAdmin && (<section className="page"><p className="eyebrow">Admin</p><h2>Moderation reports</h2><div className="card"><h3>Flagged content</h3>{reports.length === 0 ? <p className="muted">No reports yet.</p> : reports.map((r, i) => <div key={i} className="listItem"><strong>{r.type}</strong><p>{r.text}</p><small>{r.status} · {r.at}</small></div>)}</div><div className="card"><h3>Beta feedback</h3><textarea value={feedback} onChange={e => setFeedback(e.target.value)} placeholder="What should improve?" /><button onClick={submitFeedback}>Save feedback</button></div></section>)}
      </main>
    </div>
  );
}
