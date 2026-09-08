import { useMemo, useState } from 'react'

export type Rerender = <T extends (...args: any[]) => any>(
  fn: T,
) => (...args: Parameters<T>) => ReturnType<T>

/**
 * Returns a `rerender` helper: `rerender(fn)` produces a new function that
 * calls `fn` and then forces a re-render. Use it to wrap model methods that
 * mutate non-React state, so the UI refreshes after each call.
 */
export function useForceRerender(): Rerender {
  const [, forceRerender] = useState({})
  return useMemo(
    () =>
      function rerender<T extends (...args: any[]) => any>(fn: T) {
        return (...args: Parameters<T>): ReturnType<T> => {
          const r = fn(...args)
          forceRerender({})
          return r
        }
      },
    [],
  )
}
