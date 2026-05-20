import { DashboardEngagement } from '../components/VisibleEngagement';

function daysCheckedIn(moods) {
  return new Set(moods.map(item => String(item.at).split(',')[0])).size;
}

function moodLabel(score) {
  if (score >= 8) return 'peaceful sunrise';
  if (score >= 6) return 'cloudy but steady';
  if (score >= 4) return 'heavy fog';
  return 'stormy thoughts';
}

function dashboardNudge(latestMood, streak) {
  if (streak >= 7) return 'You have been showing up for yourself all week. That matters.';
  if (latestMood >= 8) return 'Your aura feels lighter today. Save this softness.';
  if (latestMood >= 6) return 'You are steady, even if the day feels messy.';
  if (latestMood >= 4) return 'Small steps count today. No pressure to be perfect.';
  return 'Your circle is here. Start with one honest breath.';
}

export default function DashboardView({ profile, moods, journals, allRoomMessages, averageMood, latestMood, setActive }) {
  const streak = daysCheckedIn(moods);

  return (
    <section className="page dashboardPage">
      <div className="heroPanel dashboardHero">
        <div>
          <p className="eyebrow">Anonymous Indian emotional reset space</p>
          <h2>You do not have to carry everything alone.</h2>
          <p className="muted">Welcome back, {profile.name}. {dashboardNudge(latestMood, streak)}</p>
          <div className="heroActions">
            <button className="btn primary" onClick={() => setActive('mood')}>Drop today’s vibe</button>
            <button className="secondaryBtn" onClick={() => setActive('companion')}>Talk to companion</button>
          </div>
        </div>
        <div className="floatingAuraPill">
          <span>✦</span>
          <strong>{moodLabel(latestMood)}</strong>
          <small>current aura</small>
        </div>
      </div>

      <div className="grid two statsGridV2">
        <div className="card statCard primaryStat">
          <span className="statIcon">🌦️</span>
          <h3>Your emotional weather</h3>
          <p className="bigStat">{averageMood !== 'No check-ins yet' ? `${averageMood}/10` : averageMood}</p>
          <p className="muted">Average mood · {moods.length} check-ins</p>
        </div>
        <div className="card statCard">
          <span className="statIcon">🔥</span>
          <h3>Days checked in</h3>
          <p className="bigStat">{streak}</p>
          <p className="muted">Unique days with a mood entry</p>
        </div>
        <div className="card statCard">
          <span className="statIcon">📝</span>
          <h3>Journal entries</h3>
          <p className="bigStat">{journals.length}</p>
          <p className="muted">Private thoughts saved</p>
        </div>
        <div className="card statCard">
          <span className="statIcon">💬</span>
          <h3>Circle messages</h3>
          <p className="bigStat">{allRoomMessages.filter(m => m.type === 'human').length}</p>
          <p className="muted">From you across all circles</p>
        </div>
      </div>

      <DashboardEngagement streak={streak} latestMood={latestMood} />
    </section>
  );
}
