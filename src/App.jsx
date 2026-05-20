import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import { DEMO_PROFILE_ID, crisisResources, defaultRoomMessages, journalPrompts, rooms, starterMessages } from './data/appData';
import { getSaved, hasPersonalInfo, humanReply, isCrisisText, makeAnonName, privacyReply, safetyReply } from './utils/helpers';
import useRoomMessages from './hooks/useRoomMessages';
import { createClientMessageId, saveRoomMessage } from './services/roomService';
import Sidebar from './components/Sidebar';
import RoomCard from './components/RoomCard';
import LandingPage from './pages/LandingPage';

const navBase = [['dashboard','Home'],['profile','Profile'],['mood','Mood'],['journal','Journal'],['companion','Companion'],['rooms','Circles'],['crisis','Safety']];
const routeToTab = { '/':'dashboard', '/dashboard':'dashboard', '/profile':'profile', '/mood':'mood', '/journal':'journal', '/companion':'companion', '/rooms':'rooms', '/safety':'crisis', '/crisis':'crisis', '/admin':'admin' };
const tabToRoute = { dashboard:'/dashboard', profile:'/profile', mood:'/mood', journal:'/journal', companion:'/companion', rooms:'/rooms', crisis:'/safety', admin:'/admin' };
const companionModes = [
  { id:'future', label:'Future healed self', prompt:'Speak to me like the wiser, healed version of myself.' },
  { id:'vent', label:'Just let me vent', prompt:'Listen first. No fixing unless I ask.' },
  { id:'prayer', label:'Prayer mode', prompt:'Respond with a short prayer and calm encouragement.' },
  { id:'text', label:'Text I should not send', prompt:'Help me rewrite this message safely and maturely.' }
];

const chatStorageKeys = ['qc_messages','qc_room_messages_by_id'];
const lockedAgeRange = 'Anonymous';

function daysCheckedIn(moods){ return new Set(moods.map(item => String(item.at).split(',')[0])).size; }
function moodLabel(score){ if(score>=8)return 'peaceful sunrise'; if(score>=6)return 'cloudy but steady'; if(score>=4)return 'heavy fog'; return 'stormy thoughts'; }
function humanTypingDelay(text=''){ return Math.min(5200, Math.max(1800, 900 + text.length * 28)); }
function normalizeProfile(savedProfile){return {...savedProfile,name:savedProfile?.name||makeAnonName(),age:lockedAgeRange};}

function MessageActions({ message, onReport, isBuddy }){
  const [open,setOpen]=useState(false);
  if(isBuddy)return null;
  return <div className="messageActions"><button className="iconBtn" aria-label="Message options" onClick={()=>setOpen(!open)}>⋯</button>{open&&<div className="messageMenu"><button onClick={()=>{onReport(message.text);setOpen(false);}}>Report message</button></div>}</div>;
}

export default function App(){
  const location=useLocation();
  const navigate=useNavigate();
  const [session,setSession]=useState(null);
  const [entered,setEntered]=useState(()=>getSaved('qc_entered',false));
  const [authMode,setAuthMode]=useState('email');
  const [email,setEmail]=useState('');
  const [authNotice,setAuthNotice]=useState('');
  const [selectedRoom,setSelectedRoom]=useState(null);
  const [roomOpen,setRoomOpen]=useState(false);
  const [aiTyping,setAiTyping]=useState(false);
  const [companionTyping,setCompanionTyping]=useState(false);
  const [active,setActive]=useState(()=>routeToTab[window.location.pathname]||'dashboard');
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
  const roomMessages=roomMessagesById[currentRoom.id]||[];
  const isAdmin=session?.user?.app_metadata?.role==='admin';
  const nav=useMemo(()=>isAdmin?[...navBase,['admin','Admin']]:navBase,[isAdmin]);
  const allRoomMessages=Object.values(roomMessagesById).flat();
  const averageMood=useMemo(()=>moods.length?(moods.reduce((sum,item)=>sum+item.score,0)/moods.length).toFixed(1):'No check-ins yet',[moods]);
  const latestMood=moods[0]?.score??moodScore;
  const moodTrend=useMemo(()=>[...moods].slice(0,7).reverse(),[moods]);

  useRoomMessages({ enabled: entered, setRoomMessagesById, setCloudStatus });
  useEffect(()=>{const locked=normalizeProfile(profile);if(locked.name!==profile.name||locked.age!==profile.age){setProfile(locked);localStorage.setItem('qc_profile',JSON.stringify(locked));}},[]);
  useEffect(()=>{const nextTab=routeToTab[location.pathname]||'dashboard';if(nextTab!==active){setActive(nextTab);if(nextTab!=='rooms')setRoomOpen(false);}},[location.pathname]);
  useEffect(()=>{if(location.pathname==='/'&&entered)navigate('/dashboard',{replace:true});},[entered,location.pathname,navigate]);
  useEffect(()=>{if(active==='admin'&&!isAdmin)navigate('/dashboard',{replace:true});},[active,isAdmin,navigate]);
  useEffect(()=>{document.documentElement.dataset.theme=theme;localStorage.setItem('qc_theme',JSON.stringify(theme));},[theme]);
  useEffect(()=>{if(!isSupabaseConfigured)return;supabase.auth.getSession().then(({data})=>{if(data.session){setSession(data.session);setEntered(true);localStorage.setItem('qc_entered',JSON.stringify(true));setCloudStatus('Signed in securely');}});const{data:listener}=supabase.auth.onAuthStateChange((_event,nextSession)=>{setSession(nextSession);if(nextSession){setEntered(true);localStorage.setItem('qc_entered',JSON.stringify(true));setCloudStatus('Signed in securely');}});return()=>listener.subscription.unsubscribe();},[]);
  useEffect(()=>{if(!breathing)return undefined;const timer=setInterval(()=>setBreathStep(step=>(step+1)%3),4000);return()=>clearInterval(timer);},[breathing]);

  async function syncProfile(next,user=session?.user,mode=authMode||'demo'){if(isSupabaseConfigured){const locked=normalizeProfile(next);await supabase.from('profiles').upsert({id:user?undefined:DEMO_PROFILE_ID,user_id:user?.id,email:user?.email||email||null,auth_provider:mode,display_name:locked.name,age_range:locked.age,support_preference:locked.intent,ai_persona:locked.persona});}}
  async function enterApp(mode){const next=normalizeProfile({...profile,name:profile.name||makeAnonName()});setProfile(next);localStorage.setItem('qc_profile',JSON.stringify(next));if(!isSupabaseConfigured||mode==='guest'){localStorage.setItem('qc_entered',JSON.stringify(true));setEntered(true);setAuthMode(mode);navigate('/dashboard',{replace:true});return;}try{if(mode==='google'){localStorage.setItem('qc_profile',JSON.stringify(next));await supabase.auth.signInWithOAuth({provider:'google',options:{redirectTo:window.location.origin}});return;}if(!email.trim()){setAuthNotice('Enter your email first.');return;}const{error}=await supabase.auth.signInWithOtp({email:email.trim(),options:{emailRedirectTo:window.location.origin}});if(error)throw error;await syncProfile(next,null,'email_magic_link');setAuthNotice('Magic link sent. Check your email. For beta preview, you can continue as guest.');}catch(err){setAuthNotice(err.message||'Auth setup needs provider configuration. Continuing in beta mode.');}}
  async function signOut(){
    if(isSupabaseConfigured&&session)await supabase.auth.signOut();
    localStorage.removeItem('qc_entered');
    chatStorageKeys.forEach(key=>localStorage.removeItem(key));
    setSession(null);setEntered(false);setMessages([]);setRoomMessagesById(defaultRoomMessages);setChatInput('');setRoomInput('');setRoomOpen(false);setSelectedRoom(null);setAiTyping(false);setCompanionTyping(false);setCloudStatus(isSupabaseConfigured?'Signed out':'Your data is saved on this device');navigate('/',{replace:true});
  }
  async function saveProfile(next){const locked=normalizeProfile(next);setProfile(locked);localStorage.setItem('qc_profile',JSON.stringify(locked));if(isSupabaseConfigured){await syncProfile(locked);setCloudStatus('Anonymous profile synced');}}
  async function addMood(){const entry={score:Number(moodScore),note:moodNote||'No note',at:new Date().toLocaleString()};const next=[entry,...moods];setMoods(next);localStorage.setItem('qc_moods',JSON.stringify(next));if(isSupabaseConfigured){await supabase.from('mood_checkins').insert({profile_id:session?null:DEMO_PROFILE_ID,user_id:session?.user?.id,mood_score:entry.score,note:entry.note});setCloudStatus('Mood saved');}setMoodNote('');}
  async function saveJournal(){if(!journalText.trim())return;if(hasPersonalInfo(journalText)){alert(privacyReply());return;}const entry={text:journalText.trim(),at:new Date().toLocaleString(),mood:Number(moodScore)};const next=[entry,...journals];setJournals(next);localStorage.setItem('qc_journals',JSON.stringify(next));if(isSupabaseConfigured){await supabase.from('journal_entries').insert({profile_id:session?null:DEMO_PROFILE_ID,user_id:session?.user?.id,content:entry.text,mood_score:entry.mood});setCloudStatus('Journal saved');}setJournalText('');}
  function openRoom(room){setSelectedRoom(room);setRoomOpen(true);}
  function backToRooms(){setRoomOpen(false);setRoomInput('');setAiTyping(false);}
  function changeActive(id){const route=tabToRoute[id]||'/dashboard';navigate(route);if(id!=='rooms')setRoomOpen(false);}
  function dismissLocalNotice(){localStorage.setItem('qc_local_notice_seen',JSON.stringify(true));setShowLocalNotice(false);}
  function submitFeedback(){if(!feedback.trim())return;alert('Thank you. Your beta feedback was saved locally for this MVP.');setFeedback('');}

  async function getAgentReply(userText, room=currentRoom, recent=roomMessages){
    if(hasPersonalInfo(userText))return privacyReply();
    try{
      const response=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:userText,roomName:room.name,roomTheme:room.theme,recentMessages:recent.slice(-8)})});
      if(!response.ok)throw new Error('Agent unavailable');
      const data=await response.json();
      return data.reply||humanReply(userText,room);
    }catch{
      return humanReply(userText,room);
    }
  }

  async function sendCompanionMessage(){if(!chatInput.trim()||companionTyping)return;const userText=chatInput.trim();if(hasPersonalInfo(userText)){const warning={from:'Quiet Circle',text:privacyReply()};setMessages([...messages,warning]);setChatInput('');return;}const userMsg={from:'You',text:userText};const next=[...messages,userMsg];setMessages(next);localStorage.setItem('qc_messages',JSON.stringify(next));setChatInput('');if(isCrisisText(userText)){const safe=[...next,{from:'Quiet Circle',text:safetyReply()}];setMessages(safe);localStorage.setItem('qc_messages',JSON.stringify(safe));changeActive('crisis');return;}setCompanionTyping(true);const reply=await getAgentReply(userText,{name:'Private companion',theme:companionMode.label,id:companionMode.id},next.map(m=>({user:m.from,text:m.text})));setTimeout(()=>{const updated=[...next,{from:'Quiet Circle',text:reply}];setMessages(updated);localStorage.setItem('qc_messages',JSON.stringify(updated));setCompanionTyping(false);},humanTypingDelay(reply));}

  async function sendRoomMessage(){if(!roomInput.trim()||aiTyping)return;const userText=roomInput.trim();if(hasPersonalInfo(userText)){alert(privacyReply());setRoomInput('');return;}const clientMessageId=createClientMessageId();const msg={clientMessageId,user:profile.name||'Anonymous',text:userText,type:'human',source:'local'};const nextForRoom=[...roomMessages,msg];const nextAll={...roomMessagesById,[currentRoom.id]:nextForRoom};setRoomMessagesById(nextAll);localStorage.setItem('qc_room_messages_by_id',JSON.stringify(nextAll));setRoomInput('');if(isSupabaseConfigured){await saveRoomMessage({session,roomKey:currentRoom.id,displayName:msg.user,message:msg.text,clientMessageId});setCloudStatus('Room message synced');}if(isCrisisText(userText)){changeActive('crisis');await reportContent('crisis_keyword',userText);}setAiTyping(true);const reply=await getAgentReply(userText,currentRoom,nextForRoom);setTimeout(()=>{const buddyMsg={user:currentRoom.aiName,text:reply,type:'buddy'};const latest=getSaved('qc_room_messages_by_id',nextAll);const updated={...latest,[currentRoom.id]:[...(latest[currentRoom.id]||[]),buddyMsg]};setRoomMessagesById(updated);localStorage.setItem('qc_room_messages_by_id',JSON.stringify(updated));setAiTyping(false);},humanTypingDelay(reply));}
  async function reportContent(type,text){const report={type,text,status:'pending',at:new Date().toLocaleString()};const next=[report,...reports];setReports(next);localStorage.setItem('qc_reports',JSON.stringify(next));if(isSupabaseConfigured){await supabase.from('moderation_reports').insert({user_id:session?.user?.id,report_type:type,content:text,status:'pending'});setCloudStatus('Report sent');}if(type!=='crisis_keyword')alert('Report submitted for admin review.');}

  if(!entered){return <LandingPage profile={profile} email={email} setEmail={setEmail} authNotice={authNotice} saveProfile={saveProfile} makeAnonName={makeAnonName} enterApp={enterApp}/>;}

  return <div className="appShell"><Sidebar profile={profile} session={session} nav={nav} active={active} setActive={changeActive} cloudStatus={cloudStatus} signOut={signOut} theme={theme} setTheme={setTheme}/><main className="main">
    {showLocalNotice&&<div className="noticeBanner"><strong>Your entries are private to this device right now.</strong><span>Sign in later to sync across devices. Clearing this browser can remove local entries.</span><button className="linkBtn" onClick={dismissLocalNotice}>Got it</button></div>}
    {active==='dashboard'&&<section className="page"><div className="heroPanel"><div><p className="eyebrow">Anonymous Indian emotional reset space</p><h2>You do not have to carry everything alone.</h2><p>Quiet Circle helps you slow down, vent safely, and connect without revealing your real identity.</p><div className="heroActions"><button onClick={()=>changeActive('mood')}>Check in now</button><button className="secondaryBtn" onClick={()=>changeActive('rooms')}>Find a circle</button></div></div><button className={breathing?'breathOrb activeBreath':'breathOrb'} onClick={()=>{setBreathing(!breathing);setBreathStep(0);}}><span>{breathing?['Breathe in','Hold softly','Breathe out'][breathStep]:'Tap to breathe'}</span></button></div><div className="moodStrip"><button onClick={()=>changeActive('mood')}>🌿 Breathe</button><button onClick={()=>changeActive('journal')}>📝 Reflect</button><button onClick={()=>changeActive('rooms')}>🤍 Be heard</button><button onClick={()=>changeActive('crisis')}>🛟 Stay safe</button></div><div className="statsGrid"><div className="stat"><span>{averageMood}</span><p>Average mood</p></div><div className="stat"><span>{daysCheckedIn(moods)}</span><p>Days checked in</p></div><div className="stat"><span>{journals.length}</span><p>Journal entries</p></div><div className="stat"><span>{allRoomMessages.length}</span><p>Circle messages</p></div></div><div className="grid two"><div className="card featureCard"><h3>Emotional weather</h3><p className="weatherText">Today feels like <strong>{moodLabel(Number(latestMood))}</strong>.</p><button onClick={()=>changeActive('mood')}>Update weather</button></div><div className="card featureCard"><h3>7-day mood pulse</h3><div className="sparkline">{moodTrend.length?moodTrend.map((item,index)=><span key={`${item.at}-${index}`} style={{height:`${Math.max(12,item.score*10)}%`}}/>):<em>No mood data yet</em>}</div><button onClick={()=>changeActive('journal')}>Reflect on pattern</button></div></div></section>}
    {active==='profile'&&<section className="page"><p className="eyebrow">Anonymous profile</p><h2>Your Quiet Circle identity</h2><div className="grid two"><div className="card"><h3>Locked for safety</h3><p className="muted">Quiet Circle is anonymous. Your display name and age are system-generated/hidden and cannot be edited.</p><div className="profilePreview"><span>{profile.name||'Anonymous'}</span><small>Age hidden · Anonymous mode</small></div><label>Support style<select value={profile.intent} onChange={e=>setProfile({...profile,intent:e.target.value})}><option value="listen">Just listen</option><option value="advice">Gentle advice</option><option value="prayer">Prayer</option><option value="both">Advice + prayer</option></select></label><button onClick={()=>saveProfile(profile)}>Save support preference</button></div><div className="card"><h3>Privacy rules</h3><p className="muted">Do not share real name, phone number, email, address, exact location, Instagram, Telegram, hostel, PG, college section, or workplace details in chats.</p><p className="weatherText">Your real identity stays off the room.</p></div></div></section>}
    {active==='mood'&&<section className="page"><p className="eyebrow">30-second check-in</p><h2>How is your heart today?</h2><div className="grid two"><div className="card"><label>Mood score: {moodScore}/10<input type="range" min="1" max="10" value={moodScore} onChange={e=>setMoodScore(e.target.value)}/></label><div className="moodWords"><span>Stormy</span><span>Steady</span><span>Peaceful</span></div><label>One honest sentence<textarea value={moodNote} onChange={e=>setMoodNote(e.target.value)} placeholder="Today I feel..."/></label><button onClick={addMood}>Save check-in</button></div><div className="card"><h3>Recent emotional weather</h3><div className="list">{moods.length?moods.slice(0,6).map((item,index)=><div className="listItem" key={`${item.at}-${index}`}><strong>{item.score}/10 · {moodLabel(item.score)}</strong><p>{item.note}</p><small>{item.at}</small></div>):<p className="muted">Your first check-in will appear here.</p>}</div></div></div></section>}
    {active==='journal'&&<section className="page"><p className="eyebrow">Private journal</p><h2>Write what you cannot say out loud.</h2><div className="grid two"><div className="card"><div className="promptGrid">{journalPrompts.map(prompt=><button className="promptBtn" key={prompt} onClick={()=>setJournalText(`${prompt}\n\n`)}>{prompt}</button>)}</div><textarea className="largeText" value={journalText} onChange={e=>setJournalText(e.target.value)} placeholder="Start with one honest line, but avoid personal details..."/><button onClick={saveJournal}>Save journal</button></div><div className="card"><h3>Gentle reflection</h3><p>{journalText.trim()?'You may be carrying something that needs language, not judgment.':'Start writing and this space will help you reflect without pressure.'}</p><div className="list">{journals.slice(0,4).map((item,index)=><div className="listItem" key={`${item.at}-${index}`}><small>{item.at} · mood {item.mood}/10</small><p>{item.text}</p></div>)}</div></div></div></section>}
    {active==='companion'&&<section className="page"><p className="eyebrow">Private companion</p><h2>Talk to Quiet Circle.</h2><div className="grid two"><div className="card"><h3>Choose the mode you need</h3><div className="modeGrid">{companionModes.map(mode=><button key={mode.id} className={companionMode.id===mode.id?'promptBtn activeMode':'promptBtn'} onClick={()=>setCompanionMode(mode)}>{mode.label}</button>)}</div><p className="muted">{companionMode.prompt}</p><p className="muted">Privacy rule: no phone, email, address, exact location, real name, or social handles.</p></div><div className="card wide"><h3>Quiet Circle</h3><p className="muted">A private buddy-style space for comfort, reflection, prayer, and emotional rewrites. Not an emergency service.</p><div className="chatWindow companionChat">{messages.map((m,i)=><div className={m.from==='You'?'msg user':'msg bot'} key={`${m.from}-${i}`}><strong>{m.from}</strong><p>{m.text}</p></div>)}{companionTyping&&<div className="typingBubble">Karan is typing…</div>}</div><div className="composer"><input value={chatInput} onChange={e=>setChatInput(e.target.value)} placeholder="Say what feels heavy, without personal details..." onKeyDown={e=>e.key==='Enter'&&sendCompanionMessage()}/><button onClick={sendCompanionMessage} disabled={companionTyping}>Send</button></div></div></div></section>}
    {active==='rooms'&&<section className="page circlesPage">{!roomOpen?<><p className="eyebrow">Choose your circle</p><h2>What are you carrying today?</h2><p className="muted pageIntro">Pick a room first. Keep it anonymous — no phone numbers, real names, exact location, socials, or personal contact details.</p><div className="grid circleGrid">{rooms.map(r=><RoomCard key={r.id} room={r} selected={currentRoom.id===r.id} onSelect={openRoom}/>)}</div></>:<div className="card wide circleChatCard"><div className="chatHeader"><button className="secondaryBtn" onClick={backToRooms}>← All circles</button><div><p className="eyebrow">{currentRoom.theme}</p><h2>{currentRoom.icon} {currentRoom.name}</h2><p className="muted">Anonymous room. If the room is quiet, a Quiet Circle buddy may keep you company. Do not share personal contact or location details.</p></div></div><div className="chatWindow">{roomMessages.map((m,i)=>{const isBuddy=m.type==='buddy'||rooms.some(room=>m.user===room.aiName);return <div className={m.user===profile.name?'msg user':'msg bot'} key={`${m.id||m.clientMessageId||m.user}-${i}`}><strong>{m.user}</strong><p>{m.text}</p><MessageActions message={m} isBuddy={isBuddy} onReport={text=>reportContent('message',text)}/></div>;})}{aiTyping&&<div className="typingBubble">{currentRoom.aiName} is typing…</div>}</div><div className="composer"><input value={roomInput} onChange={e=>setRoomInput(e.target.value)} placeholder={`Message ${currentRoom.name} anonymously...`} onKeyDown={e=>e.key==='Enter'&&sendRoomMessage()}/><button onClick={sendRoomMessage} disabled={aiTyping}>Send</button></div></div>}</section>}
    {active==='crisis'&&<section className="page"><p className="eyebrow">India safety support</p><h2>If you feel unsafe, get real-world help now.</h2><div className="danger"><h3>Quiet Circle is anonymous and not an emergency service.</h3><p>If you may hurt yourself, someone else, or feel immediately unsafe, call 112 in India or reach a trusted person near you now. Do not share your exact location inside the chat.</p></div><div className="grid two">{crisisResources.map(resource=><div className="card" key={resource.name}><h3>{resource.name}</h3><p>{resource.desc}</p><strong>{resource.phone}</strong></div>)}</div></section>}
    {active==='admin'&&isAdmin&&<section className="page"><p className="eyebrow">Admin only</p><h2>Moderation dashboard</h2><div className="card"><h3>Pending reports</h3><div className="list">{reports.length?reports.map((item,index)=><div className="listItem" key={`${item.at}-${index}`}><strong>{item.type} · {item.status}</strong><p>{item.text}</p><small>{item.at}</small></div>):<p className="muted">No pending reports.</p>}</div></div></section>}
    {active==='admin'&&!isAdmin&&<section className="page"><div className="card"><h2>This area is private.</h2><p className="muted">Admin tools are hidden for regular users.</p></div></section>}
    <footer><label>Beta feedback<textarea value={feedback} onChange={e=>setFeedback(e.target.value)} placeholder="What would make Quiet Circle feel safer or more useful?"/></label><button className="secondaryBtn" onClick={submitFeedback}>Send feedback</button></footer>
  </main></div>;
}
