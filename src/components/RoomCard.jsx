export default function RoomCard({ room, selected, onSelect, onOpen }) {
  const handleOpen = onSelect || onOpen;

  return (
    <button
      className={selected ? 'card roomCard selectedRoom' : 'card roomCard'}
      onClick={() => handleOpen?.(room)}
    >
      <div className="roomIcon">{room.icon}</div>

      <div className="roomTop">
        <h3>{room.name}</h3>
        <span>{room.theme}</span>
      </div>

      <p>{room.desc}</p>
      <small>Open circle</small>
    </button>
  );
}
