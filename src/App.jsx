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
  return 'Small privacy check, yaar — please don't share real name, phone number, email, exact location, Instagram, hostel/PG, or address here. Quiet Circle is anonymous, so keep it general an[...]
}
function daysCheckedIn(moods){ return new Set(moods.map(item => String(item.at).split(',')[0])).size; }
function moodLabel(score){ if(score>=8)return 'peaceful sunrise'; if(score>=6)return 'cloudy but steady'; if(score>=4)return 'heavy fog'; return 'stormy thoughts'; }
function humanTypingDelay(text=''){ return Math.min(5200, Math.max(1800, 900 + text.length * 28)); }
function sourceLabel(source){ return showSourceLabels&&source ? ` · ${source}` : ''; }
function formatRoomMessage(row){return {id:row.id,user:row.display_name||'Anonymous',senderId:row.user_id||null,text:row.message||'',type:row.message_type||'human',source:row.source||'',created_at[...]
function uniqueById(messages){const seen=new Set();return messages.filter((item)=>{const key=item.id||`${item.senderId||item.user}:${item.text}:${item.created_at||''}`;if(seen.has(key))return fals[...]
function uniqueMembers(members){const seen=new Set();return members.filter(member=>{const key=member.userId||member.name;if(seen.has(key))return false;seen.add(key);return true;});}
function normalizeProfile(savedProfile){return {...savedProfile,name:savedProfile?.name||makeAnonName(),age:lockedAgeRange};}

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
export default function App(){
  const [session,setSession]=useState(null);
  const [entered,setEntered]=useState(()=>getSaved('qc_entered',false));
  const [authMode,setAuthMode]=useState('email');
  const [email,setEmail]=useState('');
  const [authNotice,setAuthNotice]=useState('');
  const [selectedRoom,setSelectedRoom]=useState(null);
  const [roomOpen,setRoomOpen]=useState(false);
  const [roomMemberCounts,setRoomMemberCounts]=useState({});
  const [roomMembersById,setRoomMembersById]=useState({});
  const [aiTyping,setAiTyping]=useState(false);
  const [companionTyping,setCompanionTyping]=useState(false);
  const [active,setActive]=useState('dashboard');
  const [cloudStatus,setCloudStatus]=useState(isSupabaseConfigured?'Cloud ready':'Your data is saved on this device');
  const [profile,setProfile]=useState(()=>normalizeProfile(getSaved('qc_profile',{name:makeAnonName(),age:lockedAgeRange,intent:'both',persona:'supportive_friend'})));
  const [moodScore,setMoodScore]=useState(6),[moodNote,setMoodNote]=useState('');
  const [moods,setMoods]=useState(()=>getSaved('qc_moods',[]));
  const [journalText,setJournalText]=useState(''),[journals,setJournals]=useState(()=>getSaved('qc_journals',[]));
  const [messages,setMessages]=useState(()=>getSaved('qc_messages',starterMessages)),[chatInput,setChatInput]=useState('');
  const [roomMessagesById,setRoomMessagesById]=useState(()=>getSaved('qc_room_messages_by_id',defaultRoomMessages));
  const [roomInput,setRoomInput]=useState(''),[reports,setReports]=useState(()=>getSaved('qc_reports',[])),[feedback,setFeedback]=useState('');
  const [breathing,setBreathing]=useState(false),[breathStep,setBreathStep]=useState(0);
  const [companionMode,setCompanionMode]=useState(companionModes[0]);
  const [showLocalNotice,setShowLocalNotice]=useState(()=>!isSupabaseConfigured&&!getSaved('qc_local_notice_seen',false));
  const [theme,setTheme]=useState(()=>getSaved('qc_theme','system'));

  const currentRoom=selectedRoom||rooms[0];
  const activeChat=roomOpen?{type:circleChatType,id:currentRoom.id,name:currentRoom.name}:active==='companion'?{type:aiChatType,id:companionMode.id,name:companionMode.label}:null;
  const roomMessages=roomMessagesById[currentRoom.id]||[];
  const currentRoomMembers=roomMembersById[currentRoom.id]||[];
  const currentRoomPeople=roomOpen?Math.max(1,currentRoomMembers.length):0;
  const hasOtherPeople=currentRoomPeople>1;
  const isAdmin=profile?.role==='admin'||session?.user?.app_metadata?.role==='admin';
  const nav=useMemo(()=>isAdmin?[...navBase,['admin','Admin']]:navBase,[isAdmin]);
  const allRoomMessages=Object.values(roomMessagesById).flat();
  const averageMood=useMemo(()=>moods.length?(moods.reduce((sum,item)=>sum+item.score,0)/moods.length).toFixed(1):'No check-ins yet',[moods]);
  const latestMood=moods[0]?.score??moodScore;
  const moodTrend=useMemo(()=>[...moods].slice(0,7).reverse(),[moods]);

  useEffect(()=>{const locked=normalizeProfile(profile);if(locked.name!==profile.name||locked.age!==profile.age){setProfile(locked);localStorage.setItem('qc_profile',JSON.stringify(locked));}},[][...]
  useEffect(()=>{document.documentElement.dataset.theme=theme;localStorage.setItem('qc_theme',JSON.stringify(theme));},[theme]);
  useEffect(()=>{if(!isSupabaseConfigured)return;supabase.auth.getSession().then(({data})=>{if(data.session){setSession(data.session);setEntered(true);localStorage.setItem('qc_entered',JSON.strin[...]
  useEffect(()=>{if(!breathing)return undefined;const timer=setInterval(()=>setBreathStep(step=>(step+1)%3),4000);return()=>clearInterval(timer);},[breathing]);
  useEffect(()=>{if(!isSupabaseConfigured||!roomOpen||!currentRoom?.id)return undefined;let alive=true;supabase.from('room_messages').select('*').eq('room_key',currentRoom.id).order('created_at',[...]
  useEffect(()=>{if(!roomOpen||!currentRoom?.id)return undefined;const localName=profile.name||session?.user?.email||'Anonymous';const localUserId=session?.user?.id||`local-${localName}`;if(!isSu[...]

  async function syncProfile(next,user=session?.user,mode=authMode||'demo'){if(isSupabaseConfigured){const locked=normalizeProfile(next);await supabase.from('profiles').upsert({id:user?undefined:[...]
  async function ensureCircleMembership(room=currentRoom){if(!isSupabaseConfigured||!session?.user?.id)return true;const member={room_key:room.id,user_id:session.user.id,display_name:profile.name[...]
  async function enterApp(mode){const next=normalizeProfile({...profile,name:profile.name||makeAnonName()});setProfile(next);localStorage.setItem('qc_profile',JSON.stringify(next));if(!isSupabase[...]
  async function signOut(){
    if(isSupabaseConfigured&&session)await supabase.auth.signOut();
    localStorage.removeItem('qc_entered');
    chatStorageKeys.forEach(key=>localStorage.removeItem(key));
    setSession(null);setEntered(false);setMessages([]);setRoomMessagesById(defaultRoomMessages);setChatInput('');setRoomInput('');setRoomOpen(false);setSelectedRoom(null);setAiTyping(false);setCo[...]
  }
  async function saveProfile(next){const locked=normalizeProfile(next);setProfile(locked);localStorage.setItem('qc_profile',JSON.stringify(locked));if(isSupabaseConfigured){await syncProfile(lock[...]
  async function addMood(){const entry={score:Number(moodScore),note:moodNote||'No note',at:new Date().toLocaleString()};const next=[entry,...moods];setMoods(next);localStorage.setItem('qc_moods'[...]
  async function saveJournal(){if(!journalText.trim())return;if(hasPersonalInfo(journalText)){alert(privacyReply());return;}const entry={text:journalText.trim(),at:new Date().toLocaleString(),moo[...]
  async function openRoom(room){setSelectedRoom(room);setRoomOpen(true);await ensureCircleMembership(room);}
  function backToRooms(){setRoomOpen(false);setRoomInput('');setAiTyping(false);}
  function changeActive(id){setActive(id);if(id!=='rooms')setRoomOpen(false);}
  function dismissLocalNotice(){localStorage.setItem('qc_local_notice_seen',JSON.stringify(true));setShowLocalNotice(false);}
  function submitFeedback(){if(!feedback.trim())return;alert('Thank you. Your beta feedback was saved locally for this MVP.');setFeedback('');}

  async function getAgentReply(userText, room=currentRoom, recent=roomMessages){
    if(hasPersonalInfo(userText))return {text:privacyReply(),source:'privacy'};
    try{
      const response=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:userText,roomName:room.name,roomTheme:room.theme,recentMessage[...]
      const data=await response.json().catch(()=>({}));
      if(!response.ok){console.error('Chat API error:',data.error||chatErrorText);throw new Error(chatErrorText);}
      if(!data.reply){console.error('Chat API empty reply:',data);throw new Error(chatErrorText);}
      return { text:data.reply, source:data.source||'unknown' };
    }catch{
      return {text:humanReply(userText,room),source:'local'};
    }
  }

  async function sendCompanionMessage(){if(!chatInput.trim()||companionTyping)return;const userText=chatInput.trim();if(hasPersonalInfo(userText)){const warning={from:'Quiet Circle',text:privacyR[...]

  async function sendRoomMessage(){if(!roomInput.trim()||aiTyping)return;const userText=roomInput.trim();if(hasPersonalInfo(userText)){alert(privacyReply());setRoomInput('');return;}const senderN[...]
  async function reportContent(type,text){const report={type,text,status:'pending',at:new Date().toLocaleString()};const next=[report,...reports];setReports(next);localStorage.setItem('qc_reports[...]

  if(!entered){return <LandingPage profile={profile} email={email} setEmail={setEmail} authNotice={authNotice} saveProfile={saveProfile} makeAnonName={makeAnonName} enterApp={enterApp}/>;}

  return <div className="appShell"><Sidebar profile={profile} session={session} nav={nav} active={active} setActive={changeActive} cloudStatus={cloudStatus} signOut={signOut} theme={theme} setThe[...]
    {showLocalNotice&&<div className="noticeBanner"><strong>Your entries are private to this device right now.</strong><span>Sign in later to sync across devices. Clearing this browser can remove[...]
    {active==='dashboard'&&<section className="page"><div className="heroPanel"><div><p className="eyebrow">Anonymous Indian emotional reset space</p><h2>You do not have to carry everything alone[...]</div></div><DashboardEngagement streak={daysCheckedIn(moods)} latestMood={latestMood} /><div className="grid two">[...]</div></section>}
    {active==='profile'&&<section className="page"><p className="eyebrow">Anonymous profile</p><h2>Your Quiet Circle identity</h2><div className="grid two"><div className="card"><h3>Locked for sa[...]
    {active==='mood'&&<section className="page"><p className="eyebrow">30-second check-in</p><h2>How is your heart today?</h2><div className="grid two"><div className="card"><label>Mood score: {m[...]</div><MoodAuraPreview moodScore={moodScore} /><div className="card"><h3>Recent emotional weather</h3>[...]</div></div></section>}
    {active==='journal'&&<section className="page"><p className="eyebrow">Private journal</p><h2>Write what you cannot say out loud.</h2><div className="grid two"><div className="card"><div class[...]
    {active==='companion'&&<section className="page"><p className="eyebrow">Private companion</p><h2>Talk to Quiet Circle.</h2><div className="grid two"><div className="card"><h3>Choose the mode [...]
    {active==='rooms'&&<section className="page circlesPage">{!roomOpen?<><p className="eyebrow">Choose your circle</p><h2>What are you carrying today?</h2><p className="muted pageIntro">Pick a r[...]
    {active==='crisis'&&<section className="page"><p className="eyebrow">India safety support</p><h2>If you feel unsafe, get real-world help now.</h2><div className="danger"><h3>Quiet Circle is a[...]
    {active==='admin'&&isAdmin&&<section className="page"><p className="eyebrow">Admin only</p><h2>Moderation dashboard</h2><div className="card"><h3>Pending reports</h3><div className="list">{re[...]
    {active==='admin'&&!isAdmin&&<section className="page"><div className="card"><h2>This area is private.</h2><p className="muted">Admin tools are hidden for regular users.</p></div></section>}
    <footer><label>Beta feedback<textarea value={feedback} onChange={e=>setFeedback(e.target.value)} placeholder="What would make Quiet Circle feel safer or more useful?"/></label><button classNa[...]
  </main></div>;
}
