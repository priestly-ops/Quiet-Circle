export default function Sidebar({ profile, session, nav, active, setActive, cloudStatus, signOut }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="logo">QC</div>
        <div>
          <h1>Quiet Circle</h1>
          <p>{profile.name}</p>
        </div>
      </div>

      <nav>
        {nav.map(([id, label]) => (
          <button key={id} className={active === id ? 'nav active' : 'nav'} onClick={() => setActive(id)}>
            {label}
          </button>
        ))}
      </nav>

      <div className="miniCard">
        <strong>{session ? 'Signed in' : 'Beta guest'}</strong>
        <p>
          {session?.user?.email || 'Anonymous local session'}
          <br />
          You are allowed to pause before you respond to the world.
        </p>
        <button className="linkBtn" onClick={signOut}>Sign out</button>
      </div>

      <div className="safetyBox">
        {cloudStatus}
        <br />
        Support resources are available in the Safety tab.
      </div>
    </aside>
  );
}
