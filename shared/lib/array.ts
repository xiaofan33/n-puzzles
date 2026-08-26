import { clamp } from './utils'

/**
 * Returns a new shuffled array; optionally picks `sampleSize` unique random elements.
 * **Does not mutate the input array.**
 */
export function arrayShuffle<T>(items: T[], sampleSize?: number) {
  const sourceLength = items.length
  const targetLength =
    sampleSize !== undefined
      ? clamp(Math.floor(sampleSize), 0, sourceLength)
      : sourceLength

  if (targetLength === 0) {
    return []
  }

  const result = [...items]
  for (let i = 0; i < targetLength; i++) {
    const j = i + Math.floor(Math.random() * (sourceLength - i))
    const temp = result[i]
    result[i] = result[j]
    result[j] = temp
  }

  return result.slice(0, targetLength)
}

/**
 * Creates a rows×cols 2D array, filled with a static value or a function receiving (row, col)
 *
 * **Caution:** When a static object/array is passed as `fillValue`, all cells share the same reference.
 * Mutating one cell will affect all others. Use a factory function `() => ({...})` instead.
 */
export function create2DArray<T>(
  rows: number,
  cols: number,
  fillValue: T | ((pos: Position) => T),
) {
  const fill =
    typeof fillValue === 'function'
      ? (fillValue as (pos: Position) => T)
      : () => fillValue

  return Array.from({ length: rows }, (_, y) =>
    Array.from({ length: cols }, (_, x) => fill({ x, y })),
  )
}
