import { validateIds } from './utils'

/**
 * Check if a puzzle state (0 = blank) is solvable.
 *
 * @throws If `ids` is not a valid state (see `validateIds`).
 *
 * @example
 * ```ts
 * // 3x3, solvable
 * isSolvable([[1, 2, 3], [4, 5, 6], [7, 8, 0]]) // true
 * // 3x3, unsolvable
 * isSolvable([[1, 2, 3], [4, 5, 6], [8, 7, 0]]) // false
 * ```
 */
export function isSolvable(ids: number[][]) {
  const validation = validateIds(ids)
  if (!validation.isValid) throw new Error(validation.message)

  const h = ids.length
  const w = ids[0].length

  const flat: number[] = []
  let blankRowFromBottom = 0
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const val = ids[y][x]
      if (val === 0) {
        blankRowFromBottom = h - y
      } else {
        flat.push(val)
      }
    }
  }

  let inversions = 0
  for (let i = 0; i < flat.length; i++) {
    for (let j = i + 1; j < flat.length; j++) {
      if (flat[i] > flat[j]) inversions++
    }
  }

  return w % 2 === 1
    ? inversions % 2 === 0
    : (inversions + blankRowFromBottom) % 2 === 1
}
