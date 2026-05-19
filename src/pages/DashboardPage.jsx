export default function DashboardPage({ averageMood, journalsCount, reportsCount, messagesCount, journalPrompt, setJournalText, setActive, setSelectedRoom, firstRoom }) {
  return (
    <section className="page">
      <div className="heroPanel">
        <div>
          <p className="eyebrow">A gentle check-in space</p>
          <h2>You do not have to carry everything alone.</h2>
          <p>Quiet Circle helps you slow down, write honestly, and connect with calm anonymous support when life feels too loud.</p>
          <div className="heroActions">
            <button onClick={() => setActive('mood')}>Check in now</button>
            <button className="secondaryBtn" onClick={() => setActive('companion')}>Talk to companion</button>
          </div>
        </div>
        <div className="breathOrb"><span>Breathe</span></div>
      </div>

      <div className="moodStrip">
        <span>🌿 Breathe</span><span>📝 Reflect</span><span>🤍 Be heard</span><span>🛟 Stay safe</span>
      </div>

      <div className="statsGrid">
        <div className="stat"><span>{averageMood}</span><p>Average mood</p></div>
        <div className="stat"><span>{journalsCount}</span><p>Journal entries</p></div>
        <div className="stat"><span>{reportsCount}</span><p>Reports pending</p></div>
        <div className="stat"><span>{messagesCount}</span><p>Circle messages</p></div>
      </div>

      <div className="grid two">
        <div className="card featureCard">
          <h3>Guided reflection</h3>
          <p>{journalPrompt}</p>
          <button onClick={() => { setJournalText(journalPrompt + '\n\n'); setActive('journal'); }}>Start writing</button>
        </div>
        <div className="card featureCard">
          <h3>Suggested circle</h3>
          <p>2 AM Thoughts — a soft space for late-night emotions.</p>
          <button onClick={() => { setSelectedRoom(firstRoom); setActive('rooms'); }}>Join circle</button>
        </div>
      </div>
    </section>
  );
}
