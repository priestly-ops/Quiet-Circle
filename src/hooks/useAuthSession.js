import { useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

export default function useAuthSession(setEntered, setCloudStatus) {
  const [session, setSession] = useState(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setSession(data.session);
        setEntered(true);
        localStorage.setItem('qc_entered', JSON.stringify(true));
        setCloudStatus('Signed in securely');
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);

      if (nextSession) {
        setEntered(true);
        localStorage.setItem('qc_entered', JSON.stringify(true));
        setCloudStatus('Signed in securely');
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [setEntered, setCloudStatus]);

  return session;
}
