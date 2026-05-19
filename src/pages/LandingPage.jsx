export default function LandingPage({ profile, email, setEmail, authNotice, saveProfile, makeAnonName, enterApp }) {
  return (
    <main className="landing">
      <section className="landingCard">
        <div className="landingLogo">
          <div className="logoMark">QC</div>
          <div className="pulseRing"></div>
        </div>

        <p className="eyebrow">Welcome to Quiet Circle</p>
        <h1>A softer place to speak honestly.</h1>
        <p>Join anonymously, check in with yourself, and enter gentle support circles when life feels too loud.</p>

        <div className="authPanel">
          <label>
            Age range
            <select value={profile.age} onChange={e => saveProfile({ ...profile, age: e.target.value })}>
              <option>18-24</option>
              <option>25-34</option>
              <option>35-44</option>
              <option>45+</option>
            </select>
          </label>

          <label>
            Email
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
          </label>

          <div className="anonPreview">
            Your anonymous name: <strong>{profile.name}</strong>
            <button className="linkBtn" onClick={() => saveProfile({ ...profile, name: makeAnonName() })}>Regenerate</button>
          </div>

          {authNotice && <div className="authNotice">{authNotice}</div>}

          <button onClick={() => enterApp('google')}>Continue with Google</button>
          <button className="secondaryBtn wideBtn" onClick={() => enterApp('email')}>Sign up with email</button>
          <button className="linkBtn wideBtn" onClick={() => enterApp('guest')}>Continue as beta guest</button>
        </div>

        <small>Quiet Circle is not medical care. Support resources are available inside the app.</small>
      </section>
    </main>
  );
}
