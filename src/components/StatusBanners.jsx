export function StatusBanners({ isSupabaseConfigured, cloudStatus, aiStatus }) {
  return (
    <div className="statusStack">
      {!isSupabaseConfigured && (
        <div className="statusBanner warningBanner">
          <strong>Cloud sync is offline.</strong>
          <span>Live circles, reports, and cross-device history need Supabase environment variables.</span>
        </div>
      )}
      {cloudStatus?.toLowerCase?.().includes('failed') || cloudStatus?.toLowerCase?.().includes('could not') ? (
        <div className="statusBanner warningBanner"><strong>Supabase needs attention.</strong><span>{cloudStatus}</span></div>
      ) : null}
      {aiStatus && aiStatus !== 'ready' && (
        <div className="statusBanner aiBanner"><strong>Karan may be offline.</strong><span>{aiStatus}</span></div>
      )}
    </div>
  );
}

export function LiveCircleStatus({ people, hasOtherPeople, aiTyping }) {
  return (
    <div className={hasOtherPeople ? 'liveStatus humanLive' : 'liveStatus aiLive'}>
      <span className="liveDot" />
      <div>
        <strong>{people} {people === 1 ? 'person' : 'people'} present now</strong>
        <p>{hasOtherPeople ? 'Real people are here. Karan AI is paused.' : 'Only you are here. Karan is here until someone joins.'}</p>
      </div>
      {!hasOtherPeople && <div className={aiTyping ? 'karanPulse typing' : 'karanPulse'}>K</div>}
    </div>
  );
}
