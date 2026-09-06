import { useSyncExternalStore } from 'react';

/**
 * Minimal external store, used to share background-owned state between React
 * components without pulling in a state library. Mirrors the singleton
 * services the old Angular app used (`providedIn: 'root'`).
 */
export interface Store<T> {
  get(): T;
  set(value: T): void;
  subscribe(listener: () => void): () => void;
}

export function createStore<T>(initialValue: T): Store<T> {
  let value = initialValue;
  const listeners = new Set<() => void>();
  return {
    get: () => value,
    set: next => {
      value = next;
      listeners.forEach(listener => listener());
    },
    subscribe: listener => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

/** Subscribe a React component to a {@link Store}. */
export function useStore<T>(store: Store<T>): T {
  return useSyncExternalStore(store.subscribe, store.get);
}
