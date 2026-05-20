import { AuraCard } from '../../components/EngagementCards';

export default function MoodPage({ moodScore, setMoodScore, moodNote, setMoodNote, moods, addMood, moodLabel }) {
  return (
    <section className="page">
      <p className="eyebrow">30-second check-in</p>
      <h2>How is your heart today?</h2>

      <div className="grid two">
        <div className="card">
          <label>
            Mood score: {moodScore}/10
            <input
              type="range"
              min="1"
              max="10"
              value={moodScore}
              onChange={e => setMoodScore(e.target.value)}
            />
          </label>

          <div className="moodWords">
            <span>Stormy</span>
            <span>Steady</span>
            <span>Peaceful</span>
          </div>

          <label>
            One honest sentence
            <textarea
              value={moodNote}
              onChange={e => setMoodNote(e.target.value)}
              placeholder="Today I feel..."
            />
          </label>

          <button onClick={addMood}>Save check-in</button>
        </div>
        <MoodAuraPreview moodScore={moodScore} />
        <AuraCard score={Number(moodScore)} />

        <div className="card">
          <h3>Recent emotional weather</h3>

          <div className="list">
            {moods.length ? moods.slice(0, 6).map((item, index) => (
              <div className="listItem" key={`${item.at}-${index}`}>
                <strong>{item.score}/10 · {moodLabel(item.score)}</strong>
                <p>{item.note}</p>
                <small>{item.at}</small>
              </div>
            )) : (
              <p className="muted">Your first check-in will appear here.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
