import { useState } from 'react';

export default function App() {
  const [mood, setMood] = useState('Calm');

  return (
    <div className="container">
      <header className="hero">
        <h1>Quiet Circle</h1>
        <p>A safe space to pause, reflect, and feel heard.</p>
      </header>

      <section className="card">
        <h2>Daily Mood Check-In</h2>
        <select value={mood} onChange={(e) => setMood(e.target.value)}>
          <option>Calm</option>
          <option>Happy</option>
          <option>Anxious</option>
          <option>Lonely</option>
          <option>Overwhelmed</option>
        </select>
        <p className="mood">Current Mood: {mood}</p>
      </section>

      <section className="card">
        <h2>Private Journal</h2>
        <textarea placeholder="Write your thoughts here..."></textarea>
        <button>Save Journal</button>
      </section>

      <section className="card">
        <h2>AI Companion</h2>
        <div className="chatbox">
          <p><strong>You:</strong> I feel stressed today.</p>
          <p><strong>Quiet Circle:</strong> I'm here with you. Try taking a slow breath and writing down one thing weighing on your mind.</p>
        </div>
      </section>

      <section className="grid">
        <div className="card small">
          <h3>Support Rooms</h3>
          <p>Join anonymous support circles.</p>
        </div>

        <div className="card small">
          <h3>Crisis Resources</h3>
          <p>Emergency help and wellness support.</p>
        </div>

        <div className="card small">
          <h3>Moderation</h3>
          <p>Report harmful behavior anonymously.</p>
        </div>
      </section>
    </div>
  );
}
