'use client';

import { createContext, useContext, useSyncExternalStore } from 'react';

interface UnitsContextValue {
  imperial: boolean;
  toggleUnits: () => void;
}

const UnitsContext = createContext<UnitsContextValue>({
  imperial: false,
  toggleUnits: () => {},
});

let listeners: (() => void)[] = [];

function subscribe(listener: () => void) {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function getSnapshot(): boolean {
  return localStorage.getItem('units') === 'imperial';
}

function getServerSnapshot(): boolean {
  return false;
}

function toggle() {
  const current = localStorage.getItem('units');
  localStorage.setItem('units', current === 'imperial' ? 'metric' : 'imperial');
  listeners.forEach((l) => l());
}

export function UnitsProvider({ children }: { children: React.ReactNode }) {
  const imperial = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return <UnitsContext value={{ imperial, toggleUnits: toggle }}>{children}</UnitsContext>;
}

export function useUnits() {
  return useContext(UnitsContext);
}
