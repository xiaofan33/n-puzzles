import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react'

type Listener = () => void

const cache = new Map<string, unknown>()
const listeners = new Map<string, Set<Listener>>()

function resolve<T>(value: T | (() => T)): T {
  return typeof value === 'function' ? (value as () => T)() : value
}

function read<T>(
  key: string,
  defaultValue: T | (() => T),
  parse?: (stored: unknown, defaultResolved: T) => T,
): T {
  const raw = localStorage.getItem(key)
  if (raw === null) {
    return resolve(defaultValue)
  }
  try {
    const parsed = JSON.parse(raw)
    return parse ? parse(parsed, resolve(defaultValue)) : (parsed as T)
  } catch {
    return resolve(defaultValue)
  }
}

function emit(key: string) {
  listeners.get(key)?.forEach(fn => fn())
}

function subscribeKey(key: string, fn: Listener): () => void {
  let set = listeners.get(key)
  if (!set) {
    set = new Set()
    listeners.set(key, set)
  }
  set.add(fn)
  return () => {
    const s = listeners.get(key)
    if (s) {
      s.delete(fn)
      if (s.size === 0) listeners.delete(key)
    }
  }
}

export function useLocalStorage<T>(
  key: string,
  defaultValue: T | (() => T),
  parse?: (stored: unknown, defaultResolved: T) => T,
) {
  const parseRef = useRef(parse)
  useEffect(() => {
    parseRef.current = parse
  }, [parse])
  const stableParse = useCallback(
    (stored: unknown, defaultResolved: T): T =>
      parseRef.current
        ? parseRef.current(stored, defaultResolved)
        : (stored as T),
    [],
  )

  const subscribe = useCallback(
    (onStoreChange: () => void) => subscribeKey(key, onStoreChange),
    [key],
  )

  const getSnapshot = useCallback(() => {
    if (cache.has(key)) {
      return cache.get(key) as T
    }
    const value = read(key, defaultValue, stableParse)
    cache.set(key, value)
    return value
  }, [key, defaultValue, stableParse])

  const value = useSyncExternalStore(subscribe, getSnapshot)

  // Cross-tab sync: the storage event only fires in OTHER tabs
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      // e.key === null means localStorage.clear()
      if (e.key === key || e.key === null) {
        cache.delete(key)
        emit(key)
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [key])

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      const prev = cache.has(key)
        ? (cache.get(key) as T)
        : read(key, defaultValue, stableParse)
      const resolved =
        typeof next === 'function' ? (next as (p: T) => T)(prev) : next
      try {
        localStorage.setItem(key, JSON.stringify(resolved))
      } catch {
        // write failed (quota exceeded, private mode, etc.)
      }
      cache.set(key, resolved)
      emit(key)
    },
    [key, defaultValue, stableParse],
  )

  const removeValue = useCallback(() => {
    localStorage.removeItem(key)
    cache.delete(key)
    emit(key)
  }, [key])

  return [value, setValue, removeValue] as const
}
