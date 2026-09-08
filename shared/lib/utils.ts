export function clamp(value: number, min: number, max: number) {
  if (min > max) {
    throw new RangeError('clamp: min must not exceed max')
  }
  return Math.min(Math.max(value, min), max)
}
