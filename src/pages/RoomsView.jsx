import RoomCard from '../components/RoomCard';

export default function RoomsView({
  rooms,
  roomOpen,
  currentRoom,
  roomMessages,
  roomInput,
  setRoomInput,
  sendRoomMessage,
  aiTyping,
  openRoom,
  backToRooms,
  MessageActions,
  reportContent,
  profile,
  session,
  currentRoomPeople,
  hasOtherPeople,
  roomMemberCounts
}) {
  if (!roomOpen) {
    return (
      <section className="page">
        <p className="eyebrow">Anonymous circles</p>
        <h2>Find the room that fits your emotional weather.</h2>

        <div className="grid circleGrid">
          {rooms.map(room => (
            <RoomCard
              key={room.id}
              room={room}
              memberCount={roomMemberCounts[room.id]}
              onOpen={() => openRoom(room)}
            />
          ))}
        </div>
      </section>
    );
  }

  const currentUserId = session?.user?.id || `local-${profile.name}`;

  return (
    <section className="page circlePage">
      <button className="secondaryBtn" onClick={backToRooms}>
        ← Back to circles
      </button>

      <div className="card circleChatCard">
        <div className="chatHeader">
          <div>
            <p className="eyebrow">{currentRoom.theme}</p>
            <h2>{currentRoom.name}</h2>
            <p className="muted">
              {hasOtherPeople
                ? `${currentRoomPeople} people are here`
                : 'You are the first one here. Quiet Circle will stay with you.'}
            </p>
          </div>
        </div>

        <div className="chatWindow circleChatWindow">
          {roomMessages.map((message, index) => {
            const isOwnMessage = message.senderId === currentUserId;

            return (
              <div
                key={message.id || index}
                className={`msg ${isOwnMessage ? 'user' : 'bot'}`}
              >
                <strong>{message.user}</strong>
                <p>{message.text}</p>

                <MessageActions
                  message={message}
                  onReport={(text) => reportContent('room_message', text)}
                  isBuddy={message.type === 'ai'}
                  isOwnMessage={isOwnMessage}
                />
              </div>
            );
          })}

          {aiTyping && (
            <div className="typingBubble">
              Quiet Circle is holding space…
            </div>
          )}
        </div>

        <div className="composer circleComposer">
          <input
            value={roomInput}
            onChange={event => setRoomInput(event.target.value)}
            onKeyDown={event => event.key === 'Enter' && sendRoomMessage()}
            placeholder="Share anonymously…"
          />

          <button onClick={sendRoomMessage}>Send</button>
        </div>
      </div>
    </section>
  );
}
