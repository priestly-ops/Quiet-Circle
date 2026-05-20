import { MoodAuraPreview } from '../components/VisibleEngagement';

function moodLabel(score) {
  if (score >= 8) return 'peaceful sunrise';
  if (score >= 6) return 'cloudy but steady';
  if (score >= 4) return 'heavy fog';
  return 'stormy thoughts';
}

export default function MoodView({ moodScore, setMoodScore, moodNote, setMoodNote, addMood, moodTrend }) {
  return (
    <section className="page">
      <p className="eyebrow">30-second check-in</p>
      <h2>How is your heart today?</h2>

      <div className="grid two moodGrid">
        <div className="card moodInputCard">
          <label>
            Mood score: {moodScore} — <em>{moodLabel(moodScore)}</em>
            <input
              type="range"
              min="1"
              max="10"
              value={moodScore}
              onChange={event => setMoodScore(Number(event.target.value))}
            />
          </label>

          <label>
            Optional note
            <textarea
              value={moodNote}
              onChange={event => setMoodNote(event.target.value)}
              placeholder="What's going on?"
            />
          </label>

          <button className="btn primary" onClick={addMood}>Save check-in</button>
        </div>

        <MoodAuraPreview moodScore={moodScore} />

        <div className="card recentWeatherCard">
          <h3>Recent emotional weather</h3>
          {moodTrend.length === 0 ? (
            <p className="muted">No check-ins yet.</p>
          ) : (
            moodTrend.map((mood, index) => (
              <div key={index} className="moodRow">
                <span className="moodScore">{mood.score}/10</span>
                <span className="moodNote">{mood.note}</span>
                <span className="moodAt muted">{mood.at}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
