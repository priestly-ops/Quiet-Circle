export default function ChatPanel({ title, subtitle, messages, currentUserName, input, setInput, onSend, aiTyping, typingName, onReport, placeholder }) {
  return (
    <div className="card wide">
      <h3>{title}</h3>
      {subtitle && <p className="muted">{subtitle}</p>}

      <div className="chatWindow">
        {messages.map((message, index) => (
          <div className={message.user === currentUserName || message.from === 'You' ? 'msg user' : 'msg bot'} key={`${message.user || message.from}-${index}`}>
            <strong>{message.user || message.from}</strong>
            <p>{message.text}</p>
            {onReport && <button className="linkBtn" onClick={() => onReport('message', message.text)}>Report</button>}
          </div>
        ))}
        {aiTyping && <div className="typingBubble">{typingName} is typing slowly…</div>}
      </div>

      <div className="composer">
        <input value={input} onChange={event => setInput(event.target.value)} placeholder={placeholder} onKeyDown={event => event.key === 'Enter' && onSend()} />
        <button onClick={onSend}>Send</button>
      </div>
    </div>
  );
}
