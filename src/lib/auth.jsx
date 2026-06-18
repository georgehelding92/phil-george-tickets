import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { userFromEmail } from './users';
import { AuthContext } from './authContext';

export function AuthProvider({children}) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({data}) => {
      setSession(data.session);
      setLoading(false);
    });
    const {data: listener} = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const currentUser = userFromEmail(session?.user?.email);

  const value = {
    loading,
    session,
    currentUser,
    isReadOnly: currentUser === "Kate",
    signOut: () => supabase.auth.signOut(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
