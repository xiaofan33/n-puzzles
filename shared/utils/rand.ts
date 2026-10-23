/**
 * Returns a random integer in the closed interval [min, max]
 * @throws {RangeError} if min or max is not an integer, or min > max
 */
export function randomInt(min: number, max: number) {
  if (!Number.isInteger(min) || !Number.isInteger(max)) {
    throw new RangeError(
      `randomInt: min (${min}) and max (${max}) must be integers`,
    )
  }
  if (min > max) {
    throw new RangeError(`randomInt: min (${min}) must not exceed max (${max})`)
  }
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Picks a random item weighted by its `weight` property.
 * All weights must be finite and non-negative, the array must not be empty,
 * and the total weight must be greater than zero.
 * @throws {Error} if items is empty, any weight is invalid, or the total weight is zero
 */
export function randomWeighted<T extends { weight: number }>(
  items: readonly T[],
) {
  if (items.length === 0) {
    throw new Error('randomWeighted: items must not be empty')
  }

  const totalWeight = items.reduce((sum, item) => {
    if (!Number.isFinite(item.weight) || item.weight < 0) {
      throw new Error(
        `randomWeighted: invalid weight (${item.weight}) is not allowed`,
      )
    }
    return sum + item.weight
  }, 0)

  if (totalWeight === 0) {
    throw new Error('randomWeighted: total weight must be greater than zero')
  }

  let random = Math.random() * totalWeight

  for (const item of items) {
    random -= item.weight
    if (random <= 0) {
      return item
    }
  }

  throw new Error('randomWeighted: unexpected error')
}
