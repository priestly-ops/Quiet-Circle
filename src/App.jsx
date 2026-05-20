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

function hasPersonalInfo(text = '') {
  return personalInfoPatterns.some(pattern => pattern.test(text));
}

function privacyReply() {
  return `Small privacy check, yaar — please don't share real name, phone number, email, exact location, Instagram, hostel/PG, or address here. Quiet Circle is anonymous, so keep it general and safe.`;
}
function daysCheckedIn(moods) { return new Set(moods.map(item => String(item.at).split(',')[0])).size; }
function moodLabel(score) { if(score>=8) return 'peaceful sunrise'; if(score>=6) return 'cloudy but steady'; if(score>=4) return 'heavy fog'; return 'stormy thoughts'; }
function humanTypingDelay(text='') { return Math.min(5200, Math.max(1800, 900 + text.length * 28)); }
function sourceLabel(source) { return showSourceLabels && source ? ` · ${source}` : ''; }
function formatRoomMessage(row) {
  return {
    id: row.id,
    user: row.display_name || 'Anonymous',
    senderId: row.user_id || null,
    text: row.message || '',
    type: row.message_type || 'human',
    source: row.source || '',
    created_at: row.created_at
  };
}

function uniqueById(messages) {
  const seen = new Set();
  return messages.filter((item) => {
    const key =
      item.id ||
      `${item.senderId || item.user}:${item.text}:${item.created_at || ''}`;
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

function normalizeProfile(savedProfile) {
  return { ...savedProfile, name: savedProfile?.name || makeAnonName(), age: lockedAgeRange };
}

function MessageActions({ message, onReport, isBuddy }) {
  const [open, setOpen] = useState(false);

  if (isBuddy) return null;

  return (
    <div className="messageActions">
      <ReactionBar />
      <button
        className="iconBtn"
        aria-label="Message options"
        onClick={() => setOpen(!open)}
      >
        ⋯
      </button>
      {open && (
        <div className="messageMenu">
          <button
            onClick={() => {
              onReport(message.text);
              setOpen(false);
            }}
          >
            Report message
          </button>
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
  const activeChat = roomOpen
    ? { type: circleChatType, id: currentRoom.id, name: currentRoom.name }
    : active === 'companion'
    ? { type: aiChatType, id: companionMode.id, name: companionMode.label }
    : null;
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

  // Fix profile lock (name + age) on mount
  useEffect(() => {
    const locked = normalizeProfile(profile);
    if (locked.name !== profile.name || locked.age !== profile.age) {
      setProfile(locked);
      localStorage.setItem('qc_profile', JSON.stringify(locked));
    }
  }, []);

  // Theme persistence
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('qc_theme', JSON.stringify(theme));
  }, [theme]);

  // Supabase auth session
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setSession(data.session);
        setEntered(true);
        localStorage.setItem('qc_entered', JSON.stringify(true));
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      if (sess) {
        setEntered(true);
        localStorage.setItem('qc_entered', JSON.stringify(true));
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Breathing timer
  useEffect(() => {
    if (!breathing) return undefined;
    const timer = setInterval(() => setBreathStep(step => (step + 1) % 3), 4000);
    return () => clearInterval(timer);
  }, [breathing]);

  // Fetch + subscribe to room messages
  useEffect(() => {
    if (!isSupabaseConfigured || !roomOpen || !currentRoom?.id) return undefined;
    let alive = true;

    supabase
      .from('room_messages')
      .select('*')
      .eq('room_key', currentRoom.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (alive && data) {
          setRoomMessagesById(prev => ({
            ...prev,
            [currentRoom.id]: uniqueById(data.map(formatRoomMessage))
          }));
        }
      });

    const channel = supabase
      .channel(`room:${currentRoom.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'room_messages', filter: `room_key=eq.${currentRoom.id}` },
        payload => {
          if (alive) {
            setRoomMessagesById(prev => ({
              ...prev,
              [currentRoom.id]: uniqueById([
                ...(prev[currentRoom.id] || []),
                formatRoomMessage(payload.new)
              ])
            }));
          }
        }
      )
      .subscribe();

    return () => {
      alive = false;
      supabase.removeChannel(channel);
    };
  }, [roomOpen, currentRoom?.id]);

  // Track room membership / presence
  useEffect(() => {
    if (!roomOpen || !currentRoom?.id) return undefined;
    const localName = profile.name || session?.user?.email || 'Anonymous';
    const localUserId = session?.user?.id || `local-${localName}`;

    if (!isSupabaseConfigured) {
      setRoomMembersById(prev => ({
        ...prev,
        [currentRoom.id]: uniqueMembers([
          ...(prev[currentRoom.id] || []),
          { userId: localUserId, name: localName }
        ])
      }));
      return undefined;
    }

    const channel = supabase.channel(`presence:${currentRoom.id}`, { config: { presence: { key: localUserId } } });
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const members = Object.values(state).flat().map(p => ({ userId: p.userId, name: p.name }));
        setRoomMembersById(prev => ({ ...prev, [currentRoom.id]: uniqueMembers(members) }));
      })
      .subscribe(async status => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ userId: localUserId, name: localName });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomOpen, currentRoom?.id]);

  // ─── Async helpers ───────────────────────────────────────────────────────────

  async function syncProfile(next, user = session?.user, mode = authMode || 'demo') {
    if (isSupabaseConfigured) {
      const locked = normalizeProfile(next);
      await supabase.from('profiles').upsert({
        id: user?.id || DEMO_PROFILE_ID,
        display_name: locked.name,
        age_range: locked.age,
        intent: locked.intent,
        persona: locked.persona,
        role: locked.role
      });
    }
  }

  async function ensureCircleMembership(room = currentRoom) {
    if (!isSupabaseConfigured || !session?.user?.id) return true;
    const member = {
      room_key: room.id,
      user_id: session.user.id,
      display_name: profile.name
    };
    await supabase.from('circle_members').upsert(member, { onConflict: 'room_key,user_id' });
    return true;
  }

  async function enterApp(mode) {
    const next = normalizeProfile({ ...profile, name: profile.name || makeAnonName() });
    setProfile(next);
    localStorage.setItem('qc_profile', JSON.stringify(next));

    if (!isSupabaseConfigured) {
      setEntered(true);
      localStorage.setItem('qc_entered', JSON.stringify(true));
      return;
    }

    if (mode === 'email' && email) {
      setAuthNotice('Sending magic link…');
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) {
        setAuthNotice('Could not send link. Try anonymous entry.');
      } else {
        setAuthNotice('Check your email for a magic link!');
      }
      return;
    }

    // Anonymous / demo entry
    const { data, error } = await supabase.auth.signInAnonymously();
    if (!error && data?.session) {
      setSession(data.session);
      await syncProfile(next, data.session.user, mode);
    }
    setEntered(true);
    localStorage.setItem('qc_entered', JSON.stringify(true));
  }

  async function signOut() {
    if (isSupabaseConfigured && session) await supabase.auth.signOut();
    localStorage.removeItem('qc_entered');
    chatStorageKeys.forEach(key => localStorage.removeItem(key));
    setSession(null);
    setEntered(false);
    setMessages([]);
    setRoomMessagesById(defaultRoomMessages);
    setChatInput('');
    setRoomInput('');
    setRoomOpen(false);
    setSelectedRoom(null);
    setAiTyping(false);
    setCompanionTyping(false);
  }

  async function saveProfile(next) {
    const locked = normalizeProfile(next);
    setProfile(locked);
    localStorage.setItem('qc_profile', JSON.stringify(locked));
    if (isSupabaseConfigured) {
      await syncProfile(locked);
    }
  }

  async function addMood() {
    const entry = { score: Number(moodScore), note: moodNote || 'No note', at: new Date().toLocaleString() };
    const next = [entry, ...moods];
    setMoods(next);
    localStorage.setItem('qc_moods', JSON.stringify(next));
    setMoodNote('');
    if (isSupabaseConfigured && session?.user?.id) {
      await supabase.from('moods').insert({ user_id: session.user.id, score: entry.score, note: entry.note });
    }
  }

  async function saveJournal() {
    if (!journalText.trim()) return;
    if (hasPersonalInfo(journalText)) { alert(privacyReply()); return; }
    const entry = { text: journalText.trim(), at: new Date().toLocaleString(), mood: moodScore };
    const next = [entry, ...journals];
    setJournals(next);
    localStorage.setItem('qc_journals', JSON.stringify(next));
    setJournalText('');
    if (isSupabaseConfigured && session?.user?.id) {
      await supabase.from('journals').insert({ user_id: session.user.id, text: entry.text, mood_score: entry.mood });
    }
  }

  async function openRoom(room) {
    setSelectedRoom(room);
    setRoomOpen(true);
    await ensureCircleMembership(room);
  }

  function backToRooms() { setRoomOpen(false); setRoomInput(''); setAiTyping(false); }
  function changeActive(id) { setActive(id); if (id !== 'rooms') setRoomOpen(false); }
  function dismissLocalNotice() { localStorage.setItem('qc_local_notice_seen', JSON.stringify(true)); setShowLocalNotice(false); }
  function submitFeedback() { if (!feedback.trim()) return; alert('Thank you. Your beta feedback was saved locally for this MVP.'); setFeedback(''); }

  async function getAgentReply(userText, room = currentRoom, recent = roomMessages) {
    if (hasPersonalInfo(userText)) return { text: privacyReply(), source: 'privacy' };
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, roomName: room.name, roomTheme: room.theme, recentMessages: recent.slice(-6) })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) { console.error('Chat API error:', data.error || chatErrorText); throw new Error(chatErrorText); }
      if (!data.reply) { console.error('Chat API empty reply:', data); throw new Error(chatErrorText); }
      return { text: data.reply, source: data.source || 'unknown' };
    } catch {
      return { text: humanReply(userText, room), source: 'local' };
    }
  }

  async function sendCompanionMessage() {
    if (!chatInput.trim() || companionTyping) return;
    const userText = chatInput.trim();

    if (hasPersonalInfo(userText)) {
      const warning = { from: 'Quiet Circle', text: privacyReply(), type: 'system', id: Date.now() };
      setMessages(prev => [...prev, { from: 'user', text: userText, id: Date.now() - 1 }, warning]);
      setChatInput('');
      return;
    }

    if (isCrisisText(userText)) {
      const safeMsg = { from: 'Quiet Circle', text: safetyReply(), type: 'system', id: Date.now() };
      setMessages(prev => [...prev, { from: 'user', text: userText, id: Date.now() - 1 }, safeMsg]);
      setChatInput('');
      return;
    }

    const userMsg = { from: 'user', text: userText, id: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setCompanionTyping(true);

    const delay = humanTypingDelay(userText);
    await new Promise(r => setTimeout(r, delay));

    try {
      const response = await fetch('/api/companion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          mode: companionMode.id,
          modePrompt: companionMode.prompt,
          history: messages.slice(-10)
        })
      });
      const data = await response.json().catch(() => ({}));
      const replyText = data.reply || humanReply(userText);
      const replyMsg = { from: 'Quiet Circle', text: replyText + sourceLabel(data.source), type: 'ai', id: Date.now() };
      setMessages(prev => [...prev, replyMsg]);
      localStorage.setItem('qc_messages', JSON.stringify([...messages, userMsg, replyMsg]));
    } catch {
      const fallbackMsg = { from: 'Quiet Circle', text: humanReply(userText), type: 'ai', id: Date.now() };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setCompanionTyping(false);
    }
  }

  async function sendRoomMessage() {
    if (!roomInput.trim() || aiTyping) return;
    const userText = roomInput.trim();

    if (hasPersonalInfo(userText)) { alert(privacyReply()); setRoomInput(''); return; }

    const senderName = profile.name || 'Anonymous';
    const senderId = session?.user?.id || `local-${senderName}`;
    const userMsg = {
      id: `local-${Date.now()}`,
      user: senderName,
      senderId,
      text: userText,
      type: 'human',
      source: '',
      created_at: new Date().toISOString()
    };

    setRoomMessagesById(prev => ({
      ...prev,
      [currentRoom.id]: uniqueById([...(prev[currentRoom.id] || []), userMsg])
    }));
    setRoomInput('');

    if (isSupabaseConfigured && session?.user?.id) {
      await supabase.from('room_messages').insert({
        room_key: currentRoom.id,
        user_id: session.user.id,
        display_name: senderName,
        message: userText,
        message_type: 'human'
      });
    } else {
      const updated = { ...roomMessagesById, [currentRoom.id]: uniqueById([...(roomMessagesById[currentRoom.id] || []), userMsg]) };
      localStorage.setItem('qc_room_messages_by_id', JSON.stringify(updated));
    }

    setAiTyping(true);
    const delay = humanTypingDelay(userText);
    await new Promise(r => setTimeout(r, delay));

    try {
      const { text: agentText, source } = await getAgentReply(userText);
      const agentMsg = {
        id: `agent-${Date.now()}`,
        user: 'Quiet Circle',
        senderId: 'agent',
        text: agentText + sourceLabel(source),
        type: 'ai',
        source,
        created_at: new Date().toISOString()
      };

      setRoomMessagesById(prev => ({
        ...prev,
        [currentRoom.id]: uniqueById([...(prev[currentRoom.id] || []), agentMsg])
      }));

      if (isSupabaseConfigured && session?.user?.id) {
        await supabase.from('room_messages').insert({
          room_key: currentRoom.id,
          user_id: 'agent',
          display_name: 'Quiet Circle',
          message: agentText,
          message_type: 'ai',
          source
        });
      }
    } finally {
      setAiTyping(false);
    }
  }

  async function reportContent(type, text) {
    const report = { type, text, status: 'pending', at: new Date().toLocaleString() };
    const next = [report, ...reports];
    setReports(next);
    localStorage.setItem('qc_reports', JSON.stringify(next));
    if (isSupabaseConfigured && session?.user?.id) {
      await supabase.from('reports').insert({ reporter_id: session.user.id, content_type: type, content_text: text });
    }
    alert('Thank you — this message has been flagged for review.');
  }

  // ─── Early return: landing page ──────────────────────────────────────────────

  if (!entered) {
    return (
      <LandingPage
        profile={profile}
        email={email}
        setEmail={setEmail}
        authNotice={authNotice}
        saveProfile={saveProfile}
        makeAnonName={makeAnonName}
        enterApp={enterApp}
      />
    );
  }

  // ─── Main app shell ──────────────────────────────────────────────────────────

  return (
    <div className="appShell">
      <Sidebar
        profile={profile}
        session={session}
        nav={nav}
        active={active}
        setActive={changeActive}
        cloudStatus={cloudStatus}
        signOut={signOut}
        theme={theme}
        setTheme={setTheme}
      />
      <main className="mainContent">
        {showLocalNotice && (
          <div className="noticeBanner">
            <strong>Your entries are private to this device right now.</strong>
            <span> Sign in later to sync across devices. Clearing this browser can remove your data.</span>
            <button onClick={dismissLocalNotice}>Dismiss</button>
          </div>
        )}

        {active === 'dashboard' && (
          <section className="page">
            <div className="heroPanel">
              <div>
                <p className="eyebrow">Anonymous Indian emotional reset space</p>
                <h2>You do not have to carry everything alone.</h2>
                <p className="muted">Welcome back, {profile.name}.</p>
              </div>
            </div>
            <DashboardEngagement streak={daysCheckedIn(moods)} latestMood={latestMood} />
            <div className="grid two">
              <div className="card">
                <h3>Your emotional weather</h3>
                <p className="bigStat">{averageMood !== 'No check-ins yet' ? `${averageMood}/10` : averageMood}</p>
                <p className="muted">Average mood · {moods.length} check-ins</p>
              </div>
              <div className="card">
                <h3>Days checked in</h3>
                <p className="bigStat">{daysCheckedIn(moods)}</p>
                <p className="muted">Unique days with a mood entry</p>
              </div>
              <div className="card">
                <h3>Journal entries</h3>
                <p className="bigStat">{journals.length}</p>
                <p className="muted">Private thoughts saved</p>
              </div>
              <div className="card">
                <h3>Circle messages</h3>
                <p className="bigStat">{allRoomMessages.filter(m => m.type === 'human').length}</p>
                <p className="muted">From you across all circles</p>
              </div>
            </div>
          </section>
        )}

        {active === 'profile' && (
          <section className="page">
            <p className="eyebrow">Anonymous profile</p>
            <h2>Your Quiet Circle identity</h2>
            <div className="grid two">
              <div className="card">
                <h3>Locked for safety</h3>
                <p><strong>Name:</strong> {profile.name}</p>
                <p><strong>Age range:</strong> {profile.age}</p>
                <p className="muted">Your identity is always anonymous. Age is hidden to protect privacy.</p>
              </div>
              <div className="card">
                <h3>Personalise</h3>
                <label>
                  Display name
                  <input
                    value={profile.name}
                    onChange={e => saveProfile({ ...profile, name: e.target.value })}
                    placeholder="Anonymous name"
                  />
                </label>
                <label>
                  Companion persona
                  <select value={profile.persona} onChange={e => saveProfile({ ...profile, persona: e.target.value })}>
                    <option value="supportive_friend">Supportive friend</option>
                    <option value="therapist">Calm therapist</option>
                    <option value="elder">Wise elder</option>
                  </select>
                </label>
              </div>
            </div>
          </section>
        )}

        {active === 'mood' && (
          <section className="page">
            <p className="eyebrow">30-second check-in</p>
            <h2>How is your heart today?</h2>
            <div className="grid two">
              <div className="card">
                <label>
                  Mood score: {moodScore} — <em>{moodLabel(moodScore)}</em>
                  <input
                    type="range" min="1" max="10"
                    value={moodScore}
                    onChange={e => setMoodScore(Number(e.target.value))}
                  />
                </label>
                <label>
                  Optional note
                  <textarea
                    value={moodNote}
                    onChange={e => setMoodNote(e.target.value)}
                    placeholder="What's going on?"
                  />
                </label>
                <button className="btn primary" onClick={addMood}>Save check-in</button>
              </div>
              <MoodAuraPreview moodScore={moodScore} />
              <div className="card">
                <h3>Recent emotional weather</h3>
                {moodTrend.length === 0
                  ? <p className="muted">No check-ins yet.</p>
                  : moodTrend.map((m, i) => (
                      <div key={i} className="moodRow">
                        <span className="moodScore">{m.score}/10</span>
                        <span className="moodNote">{m.note}</span>
                        <span className="moodAt muted">{m.at}</span>
                      </div>
                    ))
                }
              </div>
            </div>
          </section>
        )}

        {active === 'journal' && (
          <section className="page">
            <p className="eyebrow">Private journal</p>
            <h2>Write what you cannot say out loud.</h2>
            <div className="grid two">
              <div className="card">
                <div className="promptRow">
                  {journalPrompts && journalPrompts.slice(0, 3).map((p, i) => (
                    <button key={i} className="promptChip" onClick={() => setJournalText(p)}>{p}</button>
                  ))}
                </div>
                <textarea
                  value={journalText}
                  onChange={e => setJournalText(e.target.value)}
                  placeholder="Start writing…"
                  rows={8}
                />
                <button className="btn primary" onClick={saveJournal}>Save entry</button>
              </div>
              <div className="card">
                <h3>Past entries</h3>
                {journals.length === 0
                  ? <p className="muted">Nothing saved yet.</p>
                  : journals.map((j, i) => (
                      <div key={i} className="journalEntry">
                        <p>{j.text.slice(0, 120)}{j.text.length > 120 ? '…' : ''}</p>
                        <span className="muted">{j.at}</span>
                      </div>
                    ))
                }
              </div>
            </div>
          </section>
        )}

        {active === 'companion' && (
          <section className="page">
            <p className="eyebrow">Private companion</p>
            <h2>Talk to Quiet Circle.</h2>
            <div className="grid two">
              <div className="card">
                <h3>Choose the mode that fits right now</h3>
                <div className="modeGrid">
                  {companionModes.map(m => (
                    <button
                      key={m.id}
                      className={`modeBtn ${companionMode.id === m.id ? 'active' : ''}`}
                      onClick={() => setCompanionMode(m)}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="card chatCard">
                <div className="chatMessages">
                  {messages.map((msg, i) => (
                    <div key={msg.id || i} className={`chatBubble ${msg.from === 'user' ? 'user' : 'buddy'}`}>
                      <span className="bubbleName">{msg.from}</span>
                      <p>{msg.text}</p>
                      {msg.from !== 'user' && (
                        <MessageActions
                          message={msg}
                          onReport={text => reportContent('companion', text)}
                          isBuddy={false}
                        />
                      )}
                    </div>
                  ))}
                  {companionTyping && <div className="chatBubble buddy typing"><span>typing…</span></div>}
                </div>
                <div className="chatInputRow">
                  <input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendCompanionMessage()}
                    placeholder="Type here…"
                    disabled={companionTyping}
                  />
                  <button className="btn primary" onClick={sendCompanionMessage} disabled={companionTyping}>Send</button>
                </div>
              </div>
            </div>
          </section>
        )}

        {active === 'rooms' && (
          <section className="page circlesPage">
            {!roomOpen ? (
              <>
                <p className="eyebrow">Choose your circle</p>
                <h2>What are you carrying today?</h2>
                <p className="muted pageIntro">Pick a room to share anonymously with others who understand.</p>
                <div className="roomGrid">
                  {rooms.map(room => (
                    <RoomCard
                      key={room.id}
                      room={room}
                      memberCount={roomMemberCounts[room.id] || 0}
                      onEnter={() => openRoom(room)}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="roomView">
                <div className="roomHeader">
                  <button className="iconBtn" onClick={backToRooms}>← Back</button>
                  <h3>{currentRoom.name}</h3>
                  <span className="muted">{currentRoomPeople} {currentRoomPeople === 1 ? 'person' : 'people'} here</span>
                </div>
                {!hasOtherPeople && (
                  <div className="soloNotice">
                    <p className="muted">You're the first one here. Someone will join soon. You're not alone in this.</p>
                  </div>
                )}
                <div className="chatMessages roomMessages">
                  {roomMessages.map((msg, i) => (
                    <div key={msg.id || i} className={`chatBubble ${msg.senderId === (session?.user?.id || `local-${profile.name}`) ? 'user' : 'buddy'}`}>
                      <span className="bubbleName">{msg.user}</span>
                      <p>{msg.text}</p>
                      {msg.type !== 'human' && (
                        <MessageActions
                          message={msg}
                          onReport={text => reportContent('room', text)}
                          isBuddy={msg.senderId === 'agent'}
                        />
                      )}
                    </div>
                  ))}
                  {aiTyping && <div className="chatBubble buddy typing"><span>Quiet Circle is typing…</span></div>}
                </div>
                <div className="chatInputRow">
                  <input
                    value={roomInput}
                    onChange={e => setRoomInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendRoomMessage()}
                    placeholder="Share anonymously…"
                    disabled={aiTyping}
                  />
                  <button className="btn primary" onClick={sendRoomMessage} disabled={aiTyping}>Send</button>
                </div>
              </div>
            )}
          </section>
        )}

        {active === 'crisis' && (
          <section className="page">
            <p className="eyebrow">India safety support</p>
            <h2>If you feel unsafe, get real-world help now.</h2>
            <div className="danger">
              <h3>Quiet Circle is a peer support space, not a crisis service.</h3>
              <p>If you or someone you know is in immediate danger, please contact one of these real-world resources:</p>
            </div>
            <div className="grid two">
              {crisisResources && crisisResources.map((res, i) => (
                <div key={i} className="card crisisCard">
                  <h3>{res.name}</h3>
                  <p className="crisisNumber">{res.number}</p>
                  <p className="muted">{res.desc}</p>
                </div>
              ))}
            </div>
            <div className="card breathingCard">
              <h3>Quick breathing reset</h3>
              <p className="muted">4-4-4 box breathing. Tap to start.</p>
              {!breathing ? (
                <button className="btn primary" onClick={() => setBreathing(true)}>Start breathing exercise</button>
              ) : (
                <>
                  <div className="breathCircle">
                    <span>{['Breathe in…','Hold…','Breathe out…'][breathStep]}</span>
                  </div>
                  <button className="btn" onClick={() => { setBreathing(false); setBreathStep(0); }}>Stop</button>
                </>
              )}
            </div>
          </section>
        )}

        {active === 'admin' && isAdmin && (
          <section className="page">
            <p className="eyebrow">Admin only</p>
            <h2>Moderation dashboard</h2>
            <div className="card">
              <h3>Pending reports</h3>
              <div className="list">
                {reports.length === 0
                  ? <p className="muted">No reports yet.</p>
                  : reports.map((r, i) => (
                      <div key={i} className="reportRow">
                        <span className="reportType">{r.type}</span>
                        <span className="reportText">{r.text}</span>
                        <span className="muted">{r.at}</span>
                      </div>
                    ))
                }
              </div>
            </div>
          </section>
        )}

        {active === 'admin' && !isAdmin && (
          <section className="page">
            <div className="card">
              <h2>This area is private.</h2>
              <p className="muted">Admin tools are hidden for regular users.</p>
            </div>
          </section>
        )}

        <footer>
          <label>
            Beta feedback
            <textarea
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              placeholder="What would make Quiet Circle feel safer or more useful?"
            />
          </label>
          <button className="btn" onClick={submitFeedback}>Send feedback</button>
        </footer>
      </main>
    </div>
  );
}
