export default function RoomCard({ room, selected, onSelect, onOpen, memberCount = 1 }) {
  const handleOpen = onSelect || onOpen;
  const safeMemberCount = Number(memberCount) > 0 ? Number(memberCount) : 1;
  const roomKind = room.type === 'private' || room.roomType === 'private' ? '1:1 room' : 'Open circle';

  return (
    <button
      className={selected ? 'card roomCard selectedRoom' : 'card roomCard'}
      onClick={() => handleOpen?.(room)}
      type="button"
    >
      <div className="roomIcon">{room.icon}</div>

      <div className="roomTop">
        <h3>{room.name}</h3>
        <span>{room.theme}</span>
      </div>

      <p>{room.desc}</p>
      <small>
        {safeMemberCount} member{safeMemberCount === 1 ? '' : 's'} · {roomKind}
      </small>
    </button>
  );
}
