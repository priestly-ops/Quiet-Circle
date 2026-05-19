export default function Sidebar({ profile, session, nav, active, setActive, cloudStatus, signOut, theme, setTheme }) {
  const nextTheme = theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark';
  const themeLabel = theme === 'dark' ? 'Dark' : theme === 'light' ? 'Light' : 'System';

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
        <strong>{session ? 'Signed in' : 'Private guest'}</strong>
        <p>
          {session?.user?.email || 'Anonymous local session'}
          <br />
          You are allowed to pause before you respond to the world.
        </p>
        <button className="linkBtn" onClick={signOut}>Sign out</button>
      </div>

      <div className="miniCard">
        <strong>Appearance: {themeLabel}</strong>
        <p>Use a softer screen for late-night check-ins.</p>
        <button className="secondaryBtn wideBtn" onClick={() => setTheme(nextTheme)}>
          Switch to {nextTheme}
        </button>
      </div>

      <div className="safetyBox">
        {cloudStatus}
        <br />
        Support resources are available in the Safety tab.
      </div>
    </aside>
  );
}
