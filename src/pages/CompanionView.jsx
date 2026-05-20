export default function CompanionView({
  companionModes,
  companionMode,
  setCompanionMode,
  messages,
  companionTyping,
  chatInput,
  setChatInput,
  sendCompanionMessage
}) {
  return (
    <section className="page">
      <p className="eyebrow">Private companion</p>
      <h2>Talk to Quiet Circle.</h2>

      <div className="grid two">
        <div className="card">
          <h3>Choose the mode that fits right now</h3>

          <div className="modeGrid">
            {companionModes.map(mode => (
              <button
                key={mode.id}
                className={`modeBtn ${companionMode.id === mode.id ? 'active' : ''}`}
                onClick={() => setCompanionMode(mode)}
              >
                {mode.label}
              </button>
            ))}
          </div>

          <p className="muted">{companionMode.prompt}</p>
        </div>

        <div className="card circleChatCard">
          <div className="chatWindow companionChat">
            {messages.map((message, index) => (
              <div
                key={message.id || index}
                className={`msg ${message.from === 'user' ? 'user' : 'bot'}`}
              >
                <strong>{message.from}</strong>
                <p>{message.text}</p>
              </div>
            ))}

            {companionTyping && (
              <div className="typingBubble">
                Quiet Circle is typing softly…
              </div>
            )}
          </div>

          <div className="composer">
            <input
              value={chatInput}
              onChange={event => setChatInput(event.target.value)}
              onKeyDown={event => event.key === 'Enter' && sendCompanionMessage()}
              placeholder="Say what you cannot say outside…"
            />

            <button onClick={sendCompanionMessage}>Send</button>
          </div>
        </div>
      </div>
    </section>
  );
}
