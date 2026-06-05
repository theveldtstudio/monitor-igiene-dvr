import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  hasPinSet,
  isLocked as readIsLocked,
  markUnlocked,
  setLocked,
  clearPin,
} from '../utils/pinStorage';

type LockState = 'setup' | 'locked' | 'unlocked';

interface AppLockContextValue {
  state: LockState;
  unlock: () => void;
  lock: () => void;
  resetPin: () => void;
  refresh: () => void;
}

const AppLockContext = createContext<AppLockContextValue | null>(null);

export function AppLockProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LockState>('locked');

  const refresh = () => {
    if (!hasPinSet()) {
      setState('setup');
    } else if (readIsLocked()) {
      setState('locked');
    } else {
      setState('unlocked');
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, []);

  const unlock = () => {
    markUnlocked();
    setState('unlocked');
  };

  const lock = () => {
    setLocked(true);
    setState('locked');
  };

  const resetPin = () => {
    clearPin();
    setState('setup');
  };

  return (
    <AppLockContext.Provider value={{ state, unlock, lock, resetPin, refresh }}>
      {children}
    </AppLockContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAppLock() {
  const ctx = useContext(AppLockContext);
  if (!ctx) throw new Error('useAppLock must be used within AppLockProvider');
  return ctx;
}
