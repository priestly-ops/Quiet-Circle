export default function LandingPage({ profile, email, setEmail, authNotice, saveProfile, makeAnonName, enterApp }) {
  return (
    <main className="landing">
      <section className="landingCard">
        <div className="landingLogo">
          <div className="logoMark">QC</div>
          <div className="pulseRing"></div>
        </div>

        <p className="eyebrow">Welcome to Quiet Circle</p>
        <h1>Your safe anonymous space.</h1>
        <p>
          Login securely, protect your privacy, and join supportive circles without revealing your real identity.
        </p>

        <div className="authPanel">
          <div className="anonPreview">
            Anonymous identity:
            <strong>{profile.name}</strong>
            <button
              className="linkBtn"
              onClick={() => saveProfile({ ...profile, name: makeAnonName() })}
            >
              Regenerate
            </button>
          </div>

          <label>
            Email address
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value.trim())}
              placeholder="you@example.com"
            />
          </label>

          <div className="card" style={{ padding: '16px', marginBottom: 0 }}>
            <h3 style={{ marginTop: 0 }}>Secure access</h3>
            <p className="muted">
              Quiet Circle now supports secure authentication and anonymous profile syncing through Supabase.
            </p>

            <div style={{ display: 'grid', gap: '10px' }}>
              <button onClick={() => enterApp('google')}>
                Continue with Google
              </button>

              <button
                className="secondaryBtn wideBtn"
                onClick={() => enterApp('email')}
              >
                Continue with Email Magic Link
              </button>

              <button
                className="linkBtn wideBtn"
                onClick={() => enterApp('guest')}
              >
                Continue as Guest
              </button>
            </div>
          </div>

          <div className="card" style={{ padding: '16px', marginBottom: 0 }}>
            <h3 style={{ marginTop: 0 }}>Privacy & Security</h3>
            <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--muted)', lineHeight: 1.8 }}>
              <li>Anonymous display names only</li>
              <li>No public email exposure</li>
              <li>Protected Supabase row-level security</li>
              <li>Encrypted authentication sessions</li>
              <li>Secure realtime circle messaging</li>
            </ul>
          </div>

          {authNotice && <div className="authNotice">{authNotice}</div>}
        </div>

        <small>
          Quiet Circle is a peer-support platform and not a replacement for professional medical care.
        </small>
      </section>
    </main>
  );
}
