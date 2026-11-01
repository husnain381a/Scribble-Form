'use client';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { repository } from '@/lib/repository';
type Context = {
  user: User | null;
  ready: boolean;
  cloud: boolean;
  repo: ReturnType<typeof repository>;
  toast: (message: string) => void;
};
const AppContext = createContext<Context | null>(null);
export function Provider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!supabase);
  const [message, setMessage] = useState('');
  const repo = useMemo(() => repository(), []);
  useEffect(() => {
    if (!supabase) return;
    supabase.auth
      .getUser()
      .then(({ data }) => {
        setUser(data.user);
        setReady(true);
      })
      .catch(() => setReady(true));
    const { data } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null);
      setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(''), 5000);
    return () => clearTimeout(t);
  }, [message]);
  const cloud = Boolean(user && supabase);
  return (
    <AppContext.Provider value={{ user, ready, cloud, repo, toast: setMessage }}>
      {children}
      {message && (
        <div className="toast" role="status">
          {message}
          <button aria-label="Dismiss notification" onClick={() => setMessage('')}>
            ×
          </button>
        </div>
      )}
    </AppContext.Provider>
  );
}
export function useApp() {
  const app = useContext(AppContext);
  if (!app) throw new Error('Missing app provider');
  return app;
}
