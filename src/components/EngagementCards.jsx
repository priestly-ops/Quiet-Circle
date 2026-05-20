import { useState } from 'react';
import { getMoodAura, reactionOptions } from '../utils/safety';

export function StreakCard({ streak = 0 }) {
  return (
    <div className="card streakCard">
      <p className="eyebrow">Daily emotional streak</p>
      <h3>{streak} day{streak === 1 ? '' : 's'} of showing up</h3>
      <p className="muted">Healing is not linear. Showing up still matters.</p>
    </div>
  );
}

export function AuraCard({ score = 6 }) {
  const [copied, setCopied] = useState(false);
  const aura = getMoodAura(score);

  async function handleShareAura() {
    const shareText = `${aura.emoji} My Quiet Circle aura today is ${aura.name}: ${aura.line}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'My Quiet Circle Aura',
          text: shareText
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      console.error('Aura share failed:', error);
    }
  }

  return (
    <div className={`card auraCard ${aura.className}`}>
      <p className="eyebrow">Today’s emotional aura</p>
      <h3>{aura.emoji} {aura.name}</h3>
      <p>{aura.line}</p>
      <button className="secondaryBtn" onClick={handleShareAura}>
        {copied ? 'Copied!' : 'Share aura card'}
      </button>
    </div>
  );
}

export function ReactionBar() {
  const [selected, setSelected] = useState(null);

  return (
    <div className="reactionBar" aria-label="Anonymous reactions">
      {reactionOptions.map(reaction => (
        <button
          key={reaction.id}
          type="button"
          className={selected === reaction.id ? 'reactionBtn activeReaction' : 'reactionBtn'}
          onClick={() => setSelected(selected === reaction.id ? null : reaction.id)}
        >
          <span>{reaction.emoji}</span>
          <small>{reaction.label}</small>
        </button>
      ))}
    </div>
  );
}

export function SafetyOnboarding({ onClose }) {
  return (
    <div className="modalOverlay">
      <div className="modalCard">
        <p className="eyebrow">Before you enter Quiet Circle</p>
        <h2>Keep yourself anonymous and safe.</h2>
        <ul>
          <li>No phone numbers, email, Instagram, Telegram, hostel, office, or exact location.</li>
          <li>Be gentle with people here.</li>
          <li>Quiet Circle is emotional support, not emergency care.</li>
          <li>If you feel unsafe, use the Safety section immediately.</li>
        </ul>
        <button onClick={onClose}>I understand</button>
      </div>
    </div>
  );
}

export function BuddyMatchingCard() {
  return (
    <div className="card buddyCard">
      <p className="eyebrow">Anonymous buddy matching</p>
      <h3>Find someone who understands your emotional weather.</h3>
      <p className="muted">Coming next: slow anonymous matching based on mood and life situation.</p>
      <button className="secondaryBtn">Join waitlist</button>
    </div>
  );
}
