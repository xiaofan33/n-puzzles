/**
 * Returns a new shuffled array; optionally picks `sampleSize` unique random elements.
 *
 * `sampleSize` is truncated toward zero and clamped to `[0, items.length]`.
 *
 * **Does not mutate the input array.**
 */
export function arrayShuffle<T>(items: T[], sampleSize = items.length) {
  const sourceLength = items.length
  const targetLength = Math.max(
    0,
    Math.min(Math.trunc(sampleSize), sourceLength),
  )

  if (targetLength === 0) {
    return []
  }

  const result = [...items]
  for (let i = 0; i < targetLength; i++) {
    const j = i + Math.floor(Math.random() * (sourceLength - i))
    ;[result[i], result[j]] = [result[j], result[i]]
  }

  return result.slice(0, targetLength)
}

/**
 * Creates a rows×cols 2D array, filled with a static value or a factory function receiving
 * `{ x, y }` (x = column index, y = row index).
 *
 * `rows`/`cols` are truncated toward zero and clamped to ≥ 0.
 *
 * **Caution:** When a static object/array is passed as `fillValue`, all cells share the same reference.
 * Mutating one cell will affect all others. Use a factory function `() => ({...})` instead.
 */
export function create2DArray<T>(
  rows: number,
  cols: number,
  fillValue: T | ((pos: { x: number; y: number }) => T),
) {
  const fill =
    typeof fillValue === 'function'
      ? (fillValue as (pos: { x: number; y: number }) => T)
      : () => fillValue

  const rowCount = Math.max(0, Math.trunc(rows))
  const colCount = Math.max(0, Math.trunc(cols))

  return Array.from({ length: rowCount }, (_, y) =>
    Array.from({ length: colCount }, (_, x) => fill({ x, y })),
  )
}
