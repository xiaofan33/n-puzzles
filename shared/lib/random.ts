/**
 * Returns a random integer in the closed interval [min, max]
 * @throws {RangeError} if min > max
 */
export function randomInt(min: number, max: number) {
  if (min > max) {
    throw new RangeError(`randomInt: min (${min}) must not exceed max (${max})`)
  }
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Picks a random item weighted by its `weight` property.
 * All weights must be non-negative and the array must not be empty.
 * @throws {Error} if items is empty or contains negative weights
 */
export function randomWeighted<T extends { weight: number }>(
  items: readonly T[],
) {
  if (items.length === 0) {
    throw new Error('randomWeighted: items must not be empty')
  }

  const totalWeight = items.reduce((sum, item) => {
    if (item.weight < 0) {
      throw new Error(
        `randomWeighted: negative weight (${item.weight}) is not allowed`,
      )
    }
    return sum + item.weight
  }, 0)

  let random = Math.random() * totalWeight

  for (const item of items) {
    random -= item.weight
    if (random <= 0) {
      return item
    }
  }

  throw new Error('randomWeighted: unexpected error')
}
