import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

const PREFIX = "cagr-view:";

export function readState<T>(code: string, name: string, fallback: T, accept: (value: unknown) => value is T): T {
  try {
    const raw = localStorage.getItem(`${PREFIX}${code}:${name}`);
    if (raw == null) return fallback;
    const parsed: unknown = JSON.parse(raw);
    return accept(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function writeState(code: string, name: string, value: unknown) {
  try {
    localStorage.setItem(`${PREFIX}${code}:${name}`, JSON.stringify(value));
  } catch {
    // The choice still applies for this visit when storage is blocked.
  }
}

export function clearState(code: string) {
  const prefix = `${PREFIX}${code}:`;
  const keys: string[] = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key?.startsWith(prefix)) keys.push(key);
  }
  keys.forEach((key) => localStorage.removeItem(key));
}

export function usePersistedState<T>(
  code: string | null,
  name: string,
  fallback: T,
  accept: (value: unknown) => value is T,
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => (code ? readState(code, name, fallback, accept) : fallback));
  useEffect(() => {
    if (code) writeState(code, name, value);
  }, [code, name, value]);
  return [value, setValue];
}
