import { useMemo, useState } from 'react'

export type Rerender = <A extends unknown[], R>(
  fn: (...args: A) => R,
) => (...args: A) => R

/**
 * Returns a `rerender` helper: `rerender(fn)` produces a new function that
 * calls `fn` and then forces a re-render. Use it to wrap model methods that
 * mutate non-React state, so the UI refreshes after each call.
 */
export function useForceRerender(): Rerender {
  const [, forceRerender] = useState({})
  return useMemo(
    () =>
      function rerender<A extends unknown[], R>(fn: (...args: A) => R) {
        return (...args: A): R => {
          const result = fn(...args)
          forceRerender({})
          return result
        }
      },
    [],
  )
}
