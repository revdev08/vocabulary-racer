import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { clearDemo, demoAvailable, validateDemo } from './demoClient';

export function useDemoAccess() {
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(demoAvailable);
  const [error, setError] = useState<string | null>(null);
  const generation = useRef(0);
  const alive = useRef(true);
  const pending = useRef<Promise<boolean> | null>(null);
  const check = useCallback(function checkSession(code?: string): Promise<boolean> {
    if (pending.current) {
      // A background refresh must not swallow a newly submitted code.
      return code === undefined ? pending.current : pending.current.then(() => checkSession(code));
    }
    const version = generation.current;
    const task = (async () => {
      try {
        const granted = await validateDemo(code);
        if (alive.current && version === generation.current) { setActive(granted); setError(null); }
        return granted && version === generation.current;
      } catch (cause) {
        if (alive.current && version === generation.current) {
          setActive(false);
          setError(cause instanceof Error ? cause.message : 'No pudimos verificar el acceso de demostración.');
        }
        return false;
      } finally {
        pending.current = null;
        if (alive.current) setLoading(false);
      }
    })();
    pending.current = task;
    return task;
  }, []);
  const exit = useCallback(async () => {
    generation.current++;
    setActive(false);
    // Wait for any activation write before deleting the saved session.
    await pending.current;
    await clearDemo();
  }, []);
  useEffect(() => {
    alive.current = true;
    void check();
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') void check();
    });
    // Recheck expiry while open as well as before each race.
    const timer = setInterval(() => {
      if (AppState.currentState === 'active') void check();
    }, 30000);
    return () => { alive.current = false; subscription.remove(); clearInterval(timer); };
  }, [check]);
  return { active, loading, error, available: demoAvailable, check, exit };
}
